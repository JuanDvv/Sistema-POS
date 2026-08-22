const { BrowserWindow } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { db, runQuery, allQuery } = require('../db/connection');
const { registrarAuditoria } = require('./auditService');
const { registrarMovimientoInventario, registrarMovimientoReserva } = require('./inventarioMovimientoService');
const { solicitarSincronizacion } = require('../sync/syncService');
const { obtenerFechaHoyYYYYMMDD } = require('./fechaService');

// SRP: única fuente de verdad de las transacciones del módulo de Pedidos/Apartados (hold de
// inventario + abonos + entrega/cancelación). El "hold" vive en inventario_sucursal.stock_reservado,
// que se suma/resta SIN tocar inventario_sucursal.stock -- el stock físico real solo se descuenta
// al entregar el pedido (ver entregarPedidoTx), igual que cualquier venta normal (permite negativo).

function notificarInventarioActualizado() {
    BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
            win.webContents.send('inventario-actualizado');
        }
    });
}

function resumenCarrito(carrito) {
    return carrito.length > 20
        ? `${carrito.slice(0, 20).map(i => `${i.nombre} (x${i.cantidad})`).join(', ')}... (+${carrito.length - 20} más)`
        : carrito.map(i => `${i.nombre} (x${i.cantidad})`).join(', ');
}

// Compara el estado previo del pedido (leído de la BD antes del UPDATE) contra los valores nuevos
// que llegan del formulario de edición, y arma un texto legible "campo: antes -> después" solo con
// lo que realmente cambió. Sin esto, el log de auditoría de "Editar Pedido" mostraba únicamente el
// estado final, sin forma de saber qué se modificó.
function describirCambiosPedido({ pedidoAnterior, detalleAnterior, fechaEntregaEstimada, notas, carrito, total, valorDomicilio }) {
    const cambios = [];

    if (pedidoAnterior.fecha_entrega_estimada !== fechaEntregaEstimada) {
        cambios.push(`Entrega estimada: ${pedidoAnterior.fecha_entrega_estimada} -> ${fechaEntregaEstimada}`);
    }
    if ((pedidoAnterior.notas || '') !== (notas || '')) {
        cambios.push(`Notas: "${pedidoAnterior.notas || ''}" -> "${notas || ''}"`);
    }
    if (Number(pedidoAnterior.total) !== total) {
        cambios.push(`Total: $${pedidoAnterior.total} -> $${total}`);
    }
    if (Number(pedidoAnterior.valor_domicilio || 0) !== Number(valorDomicilio || 0)) {
        cambios.push(`Domicilio: $${Number(pedidoAnterior.valor_domicilio || 0)} -> $${Number(valorDomicilio || 0)}`);
    }
    const prodsAntes = resumenCarrito(detalleAnterior);
    const prodsDespues = resumenCarrito(carrito);
    if (prodsAntes !== prodsDespues) {
        cambios.push(`Productos: [${prodsAntes}] -> [${prodsDespues}]`);
    }

    return cambios.length > 0 ? cambios.join(' | ') : 'Sin cambios detectados';
}

// Resuelve el cliente de un pedido reutilizando la tabla `clientes` que ya usa el módulo de
// Créditos: si viene un id existente lo actualiza/retorna, si no hay id pero la identificación
// coincide con un cliente ya registrado lo reutiliza, y solo si no hay coincidencia crea uno nuevo.
// Así el formulario de "Nuevo Pedido" puede ofrecer un buscador de clientes existentes sin obligar
// a volver a digitar sus datos, y sigue funcionando si el cajero solo escribe uno nuevo.
async function resolverOCrearClienteId({ clienteId, nombre, identificacion, telefono }) {
    if (clienteId) {
        const existente = await new Promise((resolve, reject) => {
            db.get(`SELECT id FROM clientes WHERE id = ? AND (sync_status IS NULL OR sync_status <> 'deleted')`, [clienteId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        if (existente) {
            await runQuery(
                `UPDATE clientes SET nombre = ?, telefono = ?, sync_status = 'pending' WHERE id = ?`,
                [nombre, telefono, clienteId]
            );
            return clienteId;
        }
    }

    if (identificacion) {
        const porIdentificacion = await new Promise((resolve, reject) => {
            db.get(
                `SELECT id FROM clientes WHERE identificacion = ? AND (sync_status IS NULL OR sync_status <> 'deleted') LIMIT 1`,
                [identificacion],
                (err, row) => { if (err) reject(err); else resolve(row); }
            );
        });
        if (porIdentificacion) {
            await runQuery(
                `UPDATE clientes SET nombre = ?, telefono = ?, sync_status = 'pending' WHERE id = ?`,
                [nombre, telefono, porIdentificacion.id]
            );
            return porIdentificacion.id;
        }
    }

    const nuevoId = 'cli-' + uuidv4().substring(0, 8);
    await runQuery(
        `INSERT INTO clientes (id, nombre, tipo, identificacion, telefono, origen, sync_status, updated_at) VALUES (?, ?, 'Persona', ?, ?, 'Pedido', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
        [nuevoId, nombre, identificacion || null, telefono]
    );
    return nuevoId;
}

// Suma (delta > 0) o resta (delta < 0) `cantidad` a inventario_sucursal.stock_reservado para cada
// item, SIN tocar stock. Usa el mismo patrón INSERT...ON CONFLICT que ventaService.js usa para
// `stock`, porque el producto puede no tener fila previa en esta sucursal. Además dejar rastro en
// movimientos_reserva_inventario (kardex del hold) por cada item, para que el hold se sincronice
// como delta atómico en vez de foto con LWW -- mismo motivo que movimientos_inventario para
// `stock` (ver services/inventarioMovimientoService.js).
async function ajustarStockReservado(items, sucursalId, { tipo, referenciaId, usuario }) {
    if (!items.length) return;
    const values = items.flatMap(item => [item.producto_id, sucursalId, Number(item.cantidad), 'pending']);
    const placeholders = items.map(() => '(?, ?, ?, ?, strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\'))').join(', ');
    await runQuery(
        `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock_reservado, sync_status, updated_at)
         VALUES ${placeholders}
         ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
            stock_reservado = stock_reservado + excluded.stock_reservado,
            sync_status = 'pending'`,
        values
    );
    for (const item of items) {
        await registrarMovimientoReserva({
            productoId: item.producto_id, sucursalId, tipo,
            cantidad: Number(item.cantidad), referenciaId, usuario
        });
    }
}

async function obtenerSaldoPedido(pedidoId) {
    const pedido = await new Promise((resolve, reject) => {
        db.get(`SELECT total FROM pedidos WHERE id = ?`, [pedidoId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    if (!pedido) return null;

    const fila = await new Promise((resolve, reject) => {
        db.get(
            `SELECT COALESCE(SUM(monto), 0) as abonado FROM abonos_pedido WHERE pedido_id = ? AND (sync_status IS NULL OR sync_status <> 'deleted')`,
            [pedidoId],
            (err, row) => { if (err) reject(err); else resolve(row); }
        );
    });

    const abonado = Number(fila?.abonado || 0);
    return { total: Number(pedido.total), abonado, saldoPendiente: Number(pedido.total) - abonado };
}

async function crearPedidoTx({ sucursalId, clienteId, clienteNombre, clienteIdentificacion, clienteTelefono, fechaEntregaEstimada, carrito, notas, abonoInicial, valorDomicilio, auditoriaUsuario, auditoriaRol }) {
    if (!Array.isArray(carrito) || carrito.length === 0) {
        return { success: false, message: 'El pedido debe tener al menos un producto.' };
    }
    if (!clienteNombre || !clienteTelefono) {
        return { success: false, message: 'Debe indicar nombre y teléfono del cliente.' };
    }
    if (!fechaEntregaEstimada) {
        return { success: false, message: 'Debe indicar la fecha estimada de entrega.' };
    }

    const pedidoId = 'ped-' + uuidv4().substring(0, 8);
    const valorDomicilioFinal = Number(valorDomicilio || 0);
    const total = carrito.reduce((sum, item) => sum + (Number(item.precio) * Number(item.cantidad)), 0) + valorDomicilioFinal;

    try {
        const clienteIdFinal = await resolverOCrearClienteId({
            clienteId, nombre: clienteNombre, identificacion: clienteIdentificacion, telefono: clienteTelefono
        });

        await runQuery("BEGIN TRANSACTION", []);

        await runQuery(
            `INSERT INTO pedidos (id, sucursal_id, cliente_id, fecha_pedido, fecha_entrega_estimada, estado, total, notas, usuario_creo, cliente_nombre_registro, cliente_identificacion_registro, cliente_telefono_registro, valor_domicilio, sync_status, updated_at)
             VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), ?, 'pendiente', ?, ?, ?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
            [pedidoId, sucursalId, clienteIdFinal, fechaEntregaEstimada, total, notas || null, auditoriaUsuario || null, clienteNombre, clienteIdentificacion || null, clienteTelefono, valorDomicilioFinal]
        );

        const detalleValues = carrito.flatMap(item => [uuidv4(), pedidoId, item.id, item.cantidad, item.precio]);
        const detallePlaceholders = carrito.map(() => '(?, ?, ?, ?, ?, strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\'))').join(', ');
        await runQuery(
            `INSERT INTO detalle_pedidos (id, pedido_id, producto_id, cantidad, precio_unitario, updated_at) VALUES ${detallePlaceholders}`,
            detalleValues
        );

        await ajustarStockReservado(carrito.map(item => ({ producto_id: item.id, cantidad: item.cantidad })), sucursalId, {
            tipo: 'CREACION_PEDIDO', referenciaId: pedidoId, usuario: auditoriaUsuario
        });

        if (abonoInicial && Number(abonoInicial.monto) > 0) {
            await runQuery(
                `INSERT INTO abonos_pedido (id, pedido_id, monto, fecha, metodo_pago, sync_status, updated_at) VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                ['abp-' + uuidv4().substring(0, 8), pedidoId, Number(abonoInicial.monto), abonoInicial.metodoPago || 'Efectivo']
            );
        }

        const detalleDomicilio = valorDomicilioFinal > 0 ? ` - Domicilio: $${valorDomicilioFinal}` : '';
        await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucursalId, 'Crear Pedido/Apartado', `Pedido ID: ${pedidoId} - Cliente: ${clienteNombre} - Total: $${total}${detalleDomicilio} - Entrega estimada: ${fechaEntregaEstimada} - Prods: [${resumenCarrito(carrito)}]`);

        await runQuery("COMMIT", []);
        notificarInventarioActualizado();
        solicitarSincronizacion('pedido creado');

        return { success: true, message: 'Pedido registrado con éxito.', pedidoId };
    } catch (error) {
        await runQuery("ROLLBACK", []).catch(() => { });
        return { success: false, message: 'Error interno: ' + error.message };
    }
}

async function registrarAbonoPedidoTx({ pedidoId, monto, metodoPago, fecha, auditoriaUsuario, auditoriaRol }) {
    const abonoId = 'abp-' + uuidv4().substring(0, 8);
    const fechaActual = fecha || new Date().toISOString();
    try {
        const pedido = await new Promise((resolve, reject) => {
            db.get(`SELECT sucursal_id, estado FROM pedidos WHERE id = ?`, [pedidoId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        if (!pedido) {
            return { success: false, message: 'No se encontró el pedido especificado.' };
        }
        if (pedido.estado !== 'pendiente') {
            return { success: false, message: 'No se pueden registrar abonos en un pedido que ya fue entregado o cancelado.' };
        }

        await runQuery(
            `INSERT INTO abonos_pedido (id, pedido_id, monto, fecha, metodo_pago, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
            [abonoId, pedidoId, monto, fechaActual, metodoPago]
        );
        await registrarAuditoria(auditoriaUsuario, auditoriaRol, pedido.sucursal_id, 'Registrar Abono Pedido', `Pedido ID: ${pedidoId} - Monto: $${monto} - Método: ${metodoPago}`);
        solicitarSincronizacion('abono de pedido registrado');
        return { success: true, message: 'Abono registrado con éxito.' };
    } catch (err) {
        return { success: false, message: 'Error al registrar abono: ' + err.message };
    }
}

async function eliminarAbonoPedidoTx({ id, auditoriaUsuario, auditoriaRol }) {
    try {
        const abono = await new Promise((resolve, reject) => {
            db.get(
                `SELECT ap.monto, ap.pedido_id, p.sucursal_id, p.estado, strftime('%Y-%m-%d', ap.fecha, 'localtime') as fecha_dia
                 FROM abonos_pedido ap JOIN pedidos p ON ap.pedido_id = p.id WHERE ap.id = ?`,
                [id],
                (err, row) => { if (err) reject(err); else resolve(row); }
            );
        });
        if (!abono) {
            return { success: false, message: 'No se encontró el abono especificado.' };
        }
        if (abono.estado !== 'pendiente') {
            return { success: false, message: 'No se pueden eliminar abonos de un pedido que ya fue entregado o cancelado.' };
        }
        // Un abono de un día anterior solo lo puede eliminar un Administrador (y queda recuperable
        // desde Administración > Abonos Eliminados) -- mismo criterio que gastos/ventas de fecha
        // anterior, para que un abono ya reflejado en el cierre de caja de un día pasado no
        // desaparezca por error o descuido de un Operador.
        if (auditoriaRol !== 'Administrador' && abono.fecha_dia !== obtenerFechaHoyYYYYMMDD()) {
            return { success: false, message: 'Solo un Administrador puede eliminar un abono de un día anterior.' };
        }
        await runQuery(`UPDATE abonos_pedido SET sync_status = 'deleted' WHERE id = ?`, [id]);
        await registrarAuditoria(auditoriaUsuario, auditoriaRol, abono.sucursal_id, 'Eliminar Abono Pedido', `Pedido ID: ${abono.pedido_id} - Monto: $${abono.monto}`);
        solicitarSincronizacion('abono de pedido eliminado');
        return { success: true, message: 'Abono eliminado exitosamente.' };
    } catch (err) {
        return { success: false, message: 'Error al eliminar abono: ' + err.message };
    }
}

// Reemplaza productos/cantidades de un pedido `pendiente`, ajustando el hold de inventario por
// la diferencia (revierte lo reservado por las líneas viejas, aplica lo de las líneas nuevas). El
// cliente NUNCA se toca aquí: si se equivocaron de cliente, se cancela el pedido y se crea uno nuevo.
async function editarPedidoTx({ pedidoId, fechaEntregaEstimada, notas, carrito, valorDomicilio, auditoriaUsuario, auditoriaRol }) {
    if (!Array.isArray(carrito) || carrito.length === 0) {
        return { success: false, message: 'El pedido debe tener al menos un producto.' };
    }

    try {
        const pedido = await new Promise((resolve, reject) => {
            db.get(`SELECT sucursal_id, estado, total, fecha_entrega_estimada, notas, valor_domicilio FROM pedidos WHERE id = ?`, [pedidoId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        if (!pedido) {
            return { success: false, message: 'No se encontró el pedido especificado.' };
        }
        if (pedido.estado !== 'pendiente') {
            return { success: false, message: 'Solo se puede editar un pedido que aún esté pendiente.' };
        }

        const valorDomicilioFinal = Number(valorDomicilio || 0);
        const total = carrito.reduce((sum, item) => sum + (Number(item.precio) * Number(item.cantidad)), 0) + valorDomicilioFinal;

        await runQuery("BEGIN TRANSACTION", []);

        const detalleOriginal = await allQuery(
            `SELECT dp.producto_id, dp.cantidad, dp.precio_unitario, COALESCE(p.nombre, '(Producto eliminado)') as nombre
             FROM detalle_pedidos dp LEFT JOIN productos p ON p.id = dp.producto_id
             WHERE dp.pedido_id = ?`,
            [pedidoId]
        );
        if (detalleOriginal.length > 0) {
            await ajustarStockReservado(detalleOriginal.map(d => ({ producto_id: d.producto_id, cantidad: -Number(d.cantidad) })), pedido.sucursal_id, {
                tipo: 'EDICION_PEDIDO_REVERSA', referenciaId: pedidoId, usuario: auditoriaUsuario
            });
        }

        await runQuery(`DELETE FROM detalle_pedidos WHERE pedido_id = ?`, [pedidoId]);

        const detalleValues = carrito.flatMap(item => [uuidv4(), pedidoId, item.id, item.cantidad, item.precio]);
        const detallePlaceholders = carrito.map(() => '(?, ?, ?, ?, ?, strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\'))').join(', ');
        await runQuery(
            `INSERT INTO detalle_pedidos (id, pedido_id, producto_id, cantidad, precio_unitario, updated_at) VALUES ${detallePlaceholders}`,
            detalleValues
        );

        await ajustarStockReservado(carrito.map(item => ({ producto_id: item.id, cantidad: item.cantidad })), pedido.sucursal_id, {
            tipo: 'EDICION_PEDIDO', referenciaId: pedidoId, usuario: auditoriaUsuario
        });

        await runQuery(
            `UPDATE pedidos SET total = ?, fecha_entrega_estimada = ?, notas = ?, valor_domicilio = ?, sync_status = 'pending' WHERE id = ?`,
            [total, fechaEntregaEstimada, notas || null, valorDomicilioFinal, pedidoId]
        );

        const cambios = describirCambiosPedido({ pedidoAnterior: pedido, detalleAnterior: detalleOriginal, fechaEntregaEstimada, notas, carrito, total, valorDomicilio: valorDomicilioFinal });
        await registrarAuditoria(auditoriaUsuario, auditoriaRol, pedido.sucursal_id, 'Editar Pedido', `Pedido ID: ${pedidoId} - Cambios: ${cambios}`);

        await runQuery("COMMIT", []);
        notificarInventarioActualizado();
        solicitarSincronizacion('pedido editado');

        return { success: true, message: 'Pedido modificado exitosamente.' };
    } catch (err) {
        await runQuery("ROLLBACK", []).catch(() => { });
        return { success: false, message: 'Error al modificar el pedido: ' + err.message };
    }
}

// Libera el hold de inventario y, en la misma transacción, genera el reembolso de los abonos ya
// pagados como gasto de caja (agrupado por método de pago) -- sin pasos manuales aparte.
async function cancelarPedidoTx({ pedidoId, auditoriaUsuario, auditoriaRol }) {
    try {
        const pedido = await new Promise((resolve, reject) => {
            db.get(
                `SELECT p.sucursal_id, p.estado, COALESCE(c.nombre, p.cliente_nombre_registro) as cliente_nombre
                 FROM pedidos p LEFT JOIN clientes c ON p.cliente_id = c.id WHERE p.id = ?`,
                [pedidoId],
                (err, row) => { if (err) reject(err); else resolve(row); }
            );
        });
        if (!pedido) {
            return { success: false, message: 'No se encontró el pedido especificado.' };
        }
        if (pedido.estado !== 'pendiente') {
            return { success: false, message: 'Solo se puede cancelar un pedido que aún esté pendiente.' };
        }

        await runQuery("BEGIN TRANSACTION", []);

        const detalle = await allQuery(`SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = ?`, [pedidoId]);
        if (detalle.length > 0) {
            await ajustarStockReservado(detalle.map(d => ({ producto_id: d.producto_id, cantidad: -Number(d.cantidad) })), pedido.sucursal_id, {
                tipo: 'CANCELACION_PEDIDO', referenciaId: pedidoId, usuario: auditoriaUsuario
            });
        }

        const abonos = await allQuery(
            `SELECT metodo_pago, SUM(monto) as total FROM abonos_pedido WHERE pedido_id = ? AND (sync_status IS NULL OR sync_status <> 'deleted') GROUP BY metodo_pago`,
            [pedidoId]
        );
        let totalReembolsado = 0;
        for (const ab of abonos) {
            const monto = Number(ab.total || 0);
            if (monto <= 0) continue;
            totalReembolsado += monto;
            await runQuery(
                `INSERT INTO gastos (id, sucursal_id, tipo, descripcion, monto, fecha, metodo_pago, pedido_id, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                [uuidv4(), pedido.sucursal_id, 'Operativo', `Reembolso Pedido Cancelado (Cliente: ${pedido.cliente_nombre || 'N/A'})`, monto, ab.metodo_pago, pedidoId]
            );
        }

        await runQuery(`UPDATE pedidos SET estado = 'cancelado', sync_status = 'pending' WHERE id = ?`, [pedidoId]);

        await registrarAuditoria(auditoriaUsuario, auditoriaRol, pedido.sucursal_id, 'Cancelar Pedido', `Pedido ID: ${pedidoId} - Reembolsado: $${totalReembolsado}`);

        await runQuery("COMMIT", []);
        notificarInventarioActualizado();
        solicitarSincronizacion('pedido cancelado');

        return { success: true, message: 'Pedido cancelado y hold de inventario liberado.' };
    } catch (err) {
        await runQuery("ROLLBACK", []).catch(() => { });
        return { success: false, message: 'Error al cancelar el pedido: ' + err.message };
    }
}

// Convierte el pedido en una venta real (descuenta el stock físico, igual que cualquier venta,
// permitiendo negativo) y libera el hold. No se permite entregar mientras quede saldo pendiente:
// el dinero físico debe estar completo (abonos registrados) antes de marcar el pedido como entregado.
async function entregarPedidoTx({ pedidoId, auditoriaUsuario, auditoriaRol }) {
    try {
        const pedido = await new Promise((resolve, reject) => {
            db.get(`SELECT sucursal_id, estado, total, valor_domicilio FROM pedidos WHERE id = ?`, [pedidoId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        if (!pedido) {
            return { success: false, message: 'No se encontró el pedido especificado.' };
        }
        if (pedido.estado !== 'pendiente') {
            return { success: false, message: 'Este pedido ya fue entregado o cancelado.' };
        }

        const saldo = await obtenerSaldoPedido(pedidoId);
        if (saldo.saldoPendiente > 0) {
            return { success: false, message: `No se puede entregar el pedido: aún hay un saldo pendiente de $${saldo.saldoPendiente}. Registra los abonos correspondientes antes de entregarlo.` };
        }

        const detalle = await allQuery(
            `SELECT dp.producto_id, dp.cantidad, dp.precio_unitario, p.nombre
             FROM detalle_pedidos dp LEFT JOIN productos p ON dp.producto_id = p.id
             WHERE dp.pedido_id = ?`,
            [pedidoId]
        );

        const ventaId = uuidv4();

        await runQuery("BEGIN TRANSACTION", []);

        const abonosPorMetodo = await allQuery(
            `SELECT metodo_pago, SUM(monto) as total FROM abonos_pedido WHERE pedido_id = ? AND (sync_status IS NULL OR sync_status <> 'deleted') GROUP BY metodo_pago`,
            [pedidoId]
        );
        const efectivo = Number(abonosPorMetodo.find(a => a.metodo_pago === 'Efectivo')?.total || 0);
        const transferencia = Number(abonosPorMetodo.find(a => a.metodo_pago === 'Transferencia')?.total || 0);
        let metodoPago = 'Efectivo';
        if (efectivo > 0 && transferencia > 0) {
            metodoPago = `Mixto (Efectivo: ${efectivo}, Transferencia: ${transferencia})`;
        } else if (transferencia > 0) {
            metodoPago = 'Transferencia';
        }

        // El valor del domicilio queda como sufijo "(Domicilio: $X)" en metodo_pago, igual que hace
        // ventas.js al cobrar directamente -- así reportes.js/gestion.js/pdfHelpers.js (que ya saben
        // extraerlo de ahí, ver extraerDomicilioDeMetodoPago) lo reconocen sin distinguir si la venta
        // vino de un pedido entregado o de una venta directa.
        const valorDomicilio = Number(pedido.valor_domicilio || 0);
        if (valorDomicilio > 0) {
            metodoPago += ` (Domicilio: ${Math.round(valorDomicilio).toLocaleString('es-CO')})`;
        }

        await runQuery(
            `INSERT INTO ventas (id, sucursal_id, total, metodo_pago, fecha, es_credito, cliente_id, sync_status, updated_at) VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), 0, NULL, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
            [ventaId, pedido.sucursal_id, pedido.total, metodoPago]
        );

        // Genera la salida de caja para el mensajero justo ahora (momento real de la entrega),
        // enlazada a la venta recién creada -- mismo shape que insertarVentaTx en ventaService.js,
        // para que editar-gasto/eliminar-gasto la bloqueen igual (ver descripcion en registerGastosIpc.js).
        if (valorDomicilio > 0) {
            await runQuery(
                `INSERT INTO gastos (id, sucursal_id, tipo, descripcion, monto, fecha, metodo_pago, venta_id, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                [uuidv4(), pedido.sucursal_id, 'Operativo', 'Domicilio (Descuento de Caja)', valorDomicilio, 'Efectivo', ventaId]
            );
        }

        if (detalle.length > 0) {
            const detalleValues = detalle.flatMap(item => [uuidv4(), ventaId, item.producto_id, item.cantidad, item.precio_unitario]);
            const detallePlaceholders = detalle.map(() => '(?, ?, ?, ?, ?, strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\'))').join(', ');
            await runQuery(
                `INSERT INTO detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, updated_at) VALUES ${detallePlaceholders}`,
                detalleValues
            );

            for (const item of detalle) {
                await runQuery(
                    `UPDATE inventario_sucursal SET stock = stock - ?, stock_reservado = stock_reservado - ?, sync_status = 'pending' WHERE producto_id = ? AND sucursal_id = ?`,
                    [item.cantidad, item.cantidad, item.producto_id, pedido.sucursal_id]
                );
                await registrarMovimientoInventario({
                    productoId: item.producto_id, sucursalId: pedido.sucursal_id, tipo: 'VENTA',
                    cantidad: -Number(item.cantidad), referenciaId: ventaId, usuario: auditoriaUsuario
                });
                await registrarMovimientoReserva({
                    productoId: item.producto_id, sucursalId: pedido.sucursal_id, tipo: 'ENTREGA_PEDIDO',
                    cantidad: -Number(item.cantidad), referenciaId: pedidoId, usuario: auditoriaUsuario
                });
            }
        }

        await runQuery(
            `UPDATE pedidos SET estado = 'entregado', venta_id = ?, fecha_entrega_real = strftime('%Y-%m-%dT%H:%M:%fZ','now'), sync_status = 'pending' WHERE id = ?`,
            [ventaId, pedidoId]
        );

        await registrarAuditoria(auditoriaUsuario, auditoriaRol, pedido.sucursal_id, 'Entregar Pedido', `Pedido ID: ${pedidoId} - Venta ID: ${ventaId} - Total: $${pedido.total} - Método: ${metodoPago}`);

        await runQuery("COMMIT", []);
        notificarInventarioActualizado();
        solicitarSincronizacion('pedido entregado');

        return { success: true, message: 'Pedido entregado y registrado como venta.', ventaId };
    } catch (err) {
        await runQuery("ROLLBACK", []).catch(() => { });
        return { success: false, message: 'Error al entregar el pedido: ' + err.message };
    }
}

module.exports = {
    resolverOCrearClienteId,
    obtenerSaldoPedido,
    crearPedidoTx,
    registrarAbonoPedidoTx,
    eliminarAbonoPedidoTx,
    editarPedidoTx,
    cancelarPedidoTx,
    entregarPedidoTx
};
