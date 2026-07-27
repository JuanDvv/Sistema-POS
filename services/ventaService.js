const { BrowserWindow } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { db, runQuery, allQuery } = require('../db/connection');
const { registrarAuditoria } = require('./auditService');
const { registrarMovimientoInventario } = require('./inventarioMovimientoService');
const { solicitarSincronizacion } = require('../sync/syncService');

// SRP: única fuente de verdad de las transacciones que crean/editan/eliminan una venta
// (stock + detalle + cabecera + auditoría). Usadas tanto por los flujos directos (venta del
// día, Administrador) como por la aprobación de solicitudes de venta de fecha anterior.

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

// Busca el gasto "Domicilio (Descuento de Caja)" enlazado a una venta (por venta_id). Las ventas
// creadas antes de que existiera esa columna tienen el gasto suelto (venta_id NULL); para esas se
// intenta adoptar por sucursal + fecha exacta (con milisegundos, prácticamente única por venta) en
// vez de tratarlas como si no tuvieran domicilio y duplicar el gasto en la próxima edición.
async function buscarGastoDomicilioDeVenta({ ventaId, sucursalId, fecha }) {
    let gasto = await new Promise((resolve, reject) => {
        db.get(
            `SELECT id, monto FROM gastos WHERE venta_id = ? AND descripcion = 'Domicilio (Descuento de Caja)' AND (sync_status IS NULL OR sync_status <> 'deleted')`,
            [ventaId],
            (err, row) => { if (err) reject(err); else resolve(row); }
        );
    });

    if (!gasto) {
        gasto = await new Promise((resolve, reject) => {
            db.get(
                `SELECT id, monto FROM gastos WHERE venta_id IS NULL AND sucursal_id = ? AND fecha = ? AND descripcion = 'Domicilio (Descuento de Caja)' AND (sync_status IS NULL OR sync_status <> 'deleted') LIMIT 1`,
                [sucursalId, fecha],
                (err, row) => { if (err) reject(err); else resolve(row); }
            );
        });
        if (gasto) {
            await runQuery(`UPDATE gastos SET venta_id = ? WHERE id = ?`, [ventaId, gasto.id]);
        }
    }

    return gasto;
}

async function insertarVentaTx({ sucursalId, metodoPago, total, carrito, valorDomicilio, es_credito, cliente_id, fecha, auditoriaUsuario, auditoriaRol, accion, permitirStockNegativo }) {
    // Defensa en profundidad: los formularios de venta (día actual y fecha anterior) ya bloquean
    // el envío sin cliente, pero esta función es el único punto de escritura real (también la
    // usa la aprobación de solicitudes retroactivas), así que la validación vive aquí también.
    if (es_credito && !cliente_id) {
        return { success: false, message: 'Debe seleccionar un cliente para registrar una venta a crédito.' };
    }

    const ventaId = uuidv4();

    try {
        await runQuery("BEGIN TRANSACTION", []);
        // updated_at se fija explícitamente aquí (no se deja al DEFAULT de la columna): en bases
        // de datos migradas ese DEFAULT no existe a nivel de columna (ver agregarSoporteLWW en
        // db/schema.js) y solo se rellena una vez por arranque de la app, dejando NULL cualquier
        // fila creada a mitad de sesión -- lo que Supabase rechaza por su constraint NOT NULL.
        await runQuery(
            `INSERT INTO ventas (id, sucursal_id, total, metodo_pago, fecha, es_credito, cliente_id, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
            [ventaId, sucursalId, total, metodoPago, fecha, es_credito || 0, cliente_id || null]
        );

        if (valorDomicilio && Number(valorDomicilio) > 0) {
            const gastoId = uuidv4();
            // venta_id enlaza este gasto con la venta que lo generó, para poder encontrarlo y
            // actualizarlo/eliminarlo si la venta se edita o se borra más adelante.
            await runQuery(
                `INSERT INTO gastos (id, sucursal_id, tipo, descripcion, monto, fecha, metodo_pago, venta_id, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                [gastoId, sucursalId, 'Operativo', 'Domicilio (Descuento de Caja)', Number(valorDomicilio), fecha, 'Efectivo', ventaId]
            );
        }

        if (carrito.length > 0) {
            // Vender con inventario insuficiente (quedando en negativo) solo está permitido para la
            // venta del día (permitirStockNegativo=true, ver 'registrar-venta' en registerVentasIpc):
            // ahí la UI ya pidió confirmación al usuario. Las ventas de fecha anterior nunca lo permiten.
            if (!permitirStockNegativo) {
                for (const item of carrito) {
                    const filaStock = await new Promise((resolve, reject) => {
                        db.get(`SELECT stock FROM inventario_sucursal WHERE producto_id = ? AND sucursal_id = ?`, [item.id, sucursalId], (err, row) => {
                            if (err) reject(err);
                            else resolve(row);
                        });
                    });
                    const disponible = filaStock ? Number(filaStock.stock) : 0;
                    if (Number(item.cantidad) > disponible) {
                        throw new Error(`Stock insuficiente para "${item.nombre || item.id}". Disponible: ${disponible}, solicitado: ${item.cantidad}.`);
                    }
                }
            }

            const detalleValues = carrito.flatMap(item => [uuidv4(), ventaId, item.id, item.cantidad, item.precio]);
            const detallePlaceholders = carrito.map(() => '(?, ?, ?, ?, ?, strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\'))').join(', ');
            await runQuery(
                `INSERT INTO detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, updated_at) VALUES ${detallePlaceholders}`,
                detalleValues
            );

            // El valor insertado va en negativo (-cantidad): si el producto nunca tuvo fila en
            // inventario_sucursal para esta sucursal (nunca se le abasteció ahí), la rama ON CONFLICT
            // no dispara y es el propio INSERT el que fija el stock inicial -- con +cantidad quedaba
            // en positivo (bug real: una venta de 1 unidad de un producto "Agotado" sin fila previa
            // dejaba el stock en 1 en vez de -1). Por eso el UPDATE suma (no resta) excluded.stock.
            const stockValues = carrito.flatMap(item => [item.id, sucursalId, -Number(item.cantidad), 'pending']);
            const stockPlaceholders = carrito.map(() => '(?, ?, ?, ?, strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\'))').join(', ');
            await runQuery(
                `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                 VALUES ${stockPlaceholders}
                 ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                    stock = stock + excluded.stock,
                    sync_status = 'pending'`,
                stockValues
            );

            for (const item of carrito) {
                await registrarMovimientoInventario({
                    productoId: item.id, sucursalId, tipo: 'VENTA',
                    cantidad: -Number(item.cantidad), referenciaId: ventaId, usuario: auditoriaUsuario
                });
            }
        }

        await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucursalId, accion || 'Registrar Venta', `Total: $${total} - Método: ${metodoPago} - Fecha: ${fecha} - Prods: [${resumenCarrito(carrito)}]`);

        await runQuery("COMMIT", []);
        notificarInventarioActualizado();
        solicitarSincronizacion('venta registrada');

        return { success: true, message: '¡Venta procesada con éxito!', ventaId };
    } catch (error) {
        await runQuery("ROLLBACK", []).catch(() => { });
        return { success: false, message: 'Error interno: ' + error.message };
    }
}

async function eliminarVentaTx({ ventaId, auditoriaUsuario, auditoriaRol, accion }) {
    try {
        await runQuery("BEGIN TRANSACTION", []);

        // 1. Obtener la sucursal de la venta para devolver el stock a la correcta
        const venta = await new Promise((resolve, reject) => {
            db.get(`SELECT sucursal_id, total, fecha FROM ventas WHERE id = ?`, [ventaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!venta) {
            throw new Error("No se encontró la venta especificada.");
        }

        // 2. Obtener detalles para devolver el stock (con nombre para dejarlo trazado en la auditoría)
        const detalles = await allQuery(
            `SELECT dv.producto_id, dv.cantidad, p.nombre
             FROM detalle_ventas dv
             LEFT JOIN productos p ON p.id = dv.producto_id
             WHERE dv.venta_id = ?`,
            [ventaId]
        );
        for (const det of detalles) {
            await runQuery(
                `UPDATE inventario_sucursal SET stock = stock + ?, sync_status = 'pending' WHERE producto_id = ? AND sucursal_id = ?`,
                [det.cantidad, det.producto_id, venta.sucursal_id]
            );
            await registrarMovimientoInventario({
                productoId: det.producto_id, sucursalId: venta.sucursal_id, tipo: 'ANULACION',
                cantidad: Number(det.cantidad), referenciaId: ventaId, usuario: auditoriaUsuario
            });
        }

        // 3. Revertir el gasto de domicilio asociado (si lo había): sin esto, borrar una venta con
        //    domicilio dejaba la salida de caja del mensajero registrada para una venta inexistente.
        const gastoDomicilio = await buscarGastoDomicilioDeVenta({ ventaId, sucursalId: venta.sucursal_id, fecha: venta.fecha });
        if (gastoDomicilio) {
            await runQuery(`UPDATE gastos SET sync_status = 'deleted' WHERE id = ?`, [gastoDomicilio.id]);
        }

        // 4. Marcar la venta como eliminada
        await runQuery(`UPDATE ventas SET sync_status = 'deleted' WHERE id = ?`, [ventaId]);

        // Registrar en logs de auditoría (incluye productos para poder rastrear qué se anuló)
        const resumenProductos = resumenCarrito(detalles.map(d => ({ nombre: d.nombre || d.producto_id, cantidad: d.cantidad })));
        await registrarAuditoria(auditoriaUsuario, auditoriaRol, venta.sucursal_id, accion || 'Eliminar Venta', `Venta ID: ${ventaId} - Reintegrado Total: $${venta.total} - Prods: [${resumenProductos}]`);

        await runQuery("COMMIT", []);
        solicitarSincronizacion('venta eliminada');
        return { success: true, message: 'Venta eliminada exitosamente y stock restablecido.' };
    } catch (err) {
        await runQuery("ROLLBACK", []).catch(() => { });
        return { success: false, message: 'Error al eliminar venta: ' + err.message };
    }
}

async function editarVentaCompletaTx({ ventaId, sucursalId, metodoPago, total, carrito, valorDomicilio, es_credito, cliente_id, fecha, auditoriaUsuario, auditoriaRol, accion }) {
    if (es_credito && !cliente_id) {
        return { success: false, message: 'Debe seleccionar un cliente para registrar una venta a crédito.' };
    }

    try {
        await runQuery("BEGIN TRANSACTION", []);

        const ventaOriginal = await new Promise((resolve, reject) => {
            db.get(`SELECT sucursal_id, fecha FROM ventas WHERE id = ?`, [ventaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!ventaOriginal) {
            throw new Error("No se encontró la venta especificada.");
        }

        const sucursalOriginalId = ventaOriginal.sucursal_id;
        const sucursalFinalId = sucursalId || sucursalOriginalId;

        // 1. Revertir el stock descontado por las líneas originales
        const detallesOriginales = await allQuery(`SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?`, [ventaId]);
        for (const det of detallesOriginales) {
            await runQuery(
                `UPDATE inventario_sucursal SET stock = stock + ?, sync_status = 'pending' WHERE producto_id = ? AND sucursal_id = ?`,
                [det.cantidad, det.producto_id, sucursalOriginalId]
            );
            await registrarMovimientoInventario({
                productoId: det.producto_id, sucursalId: sucursalOriginalId, tipo: 'EDICION_VENTA',
                cantidad: Number(det.cantidad), referenciaId: ventaId, usuario: auditoriaUsuario
            });
        }

        // 2. Validar que haya stock suficiente para las nuevas cantidades, ya con el stock
        //    original devuelto. Editar una venta NUNCA permite dejar el stock en negativo (a
        //    diferencia del registro de una venta nueva del día, ver insertarVentaTx): si falta,
        //    se lanza y el catch hace ROLLBACK (revierte también la devolución del paso 1), sin
        //    tocar detalle ni cabecera.
        for (const item of carrito) {
            const filaStock = await new Promise((resolve, reject) => {
                db.get(`SELECT stock FROM inventario_sucursal WHERE producto_id = ? AND sucursal_id = ?`, [item.id, sucursalFinalId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            const disponible = filaStock ? Number(filaStock.stock) : 0;
            if (Number(item.cantidad) > disponible) {
                throw new Error(`Stock insuficiente para "${item.nombre || item.id}". Disponible: ${disponible}, solicitado: ${item.cantidad}.`);
            }
        }

        // 3. Reemplazar las líneas de detalle por las del carrito editado
        await runQuery(`DELETE FROM detalle_ventas WHERE venta_id = ?`, [ventaId]);

        if (carrito.length > 0) {
            const detalleValues = carrito.flatMap(item => [uuidv4(), ventaId, item.id, item.cantidad, item.precio]);
            const detallePlaceholders = carrito.map(() => '(?, ?, ?, ?, ?, strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\'))').join(', ');
            await runQuery(
                `INSERT INTO detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, updated_at) VALUES ${detallePlaceholders}`,
                detalleValues
            );

            // 4. Descontar el stock nuevo en la sucursal final (valor negativo, ver insertarVentaTx
            //    para el porqué: así el INSERT también queda correcto si no había fila previa).
            const stockValues = carrito.flatMap(item => [item.id, sucursalFinalId, -Number(item.cantidad), 'pending']);
            const stockPlaceholders = carrito.map(() => '(?, ?, ?, ?, strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\'))').join(', ');
            await runQuery(
                `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                 VALUES ${stockPlaceholders}
                 ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                    stock = stock + excluded.stock,
                    sync_status = 'pending'`,
                stockValues
            );

            for (const item of carrito) {
                await registrarMovimientoInventario({
                    productoId: item.id, sucursalId: sucursalFinalId, tipo: 'EDICION_VENTA',
                    cantidad: -Number(item.cantidad), referenciaId: ventaId, usuario: auditoriaUsuario
                });
            }
        }

        // 5. Actualizar la cabecera de la venta
        await runQuery(
            `UPDATE ventas SET total = ?, metodo_pago = ?, fecha = ?, es_credito = ?, cliente_id = ?, sucursal_id = ?, sync_status = 'pending' WHERE id = ?`,
            [total, metodoPago, fecha, es_credito || 0, cliente_id || null, sucursalFinalId, ventaId]
        );

        // 6. Reconciliar el gasto "Domicilio (Descuento de Caja)": se crea, actualiza o elimina
        //    según cómo haya quedado el domicilio tras la edición. Se busca con la sucursal/fecha
        //    ORIGINALES (antes de este UPDATE) porque así quedó registrado el gasto suelto si la
        //    venta es de antes de que existiera gastos.venta_id.
        const nuevoValorDomicilio = Number(valorDomicilio || 0);
        const gastoDomicilio = await buscarGastoDomicilioDeVenta({
            ventaId, sucursalId: sucursalOriginalId, fecha: ventaOriginal.fecha
        });

        if (nuevoValorDomicilio > 0) {
            if (gastoDomicilio) {
                if (Number(gastoDomicilio.monto) !== nuevoValorDomicilio || sucursalFinalId !== sucursalOriginalId) {
                    await runQuery(
                        `UPDATE gastos SET monto = ?, sucursal_id = ?, sync_status = 'pending' WHERE id = ?`,
                        [nuevoValorDomicilio, sucursalFinalId, gastoDomicilio.id]
                    );
                }
            } else {
                const gastoId = uuidv4();
                await runQuery(
                    `INSERT INTO gastos (id, sucursal_id, tipo, descripcion, monto, fecha, metodo_pago, venta_id, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                    [gastoId, sucursalFinalId, 'Operativo', 'Domicilio (Descuento de Caja)', nuevoValorDomicilio, fecha, 'Efectivo', ventaId]
                );
            }
        } else if (gastoDomicilio) {
            await runQuery(`UPDATE gastos SET sync_status = 'deleted' WHERE id = ?`, [gastoDomicilio.id]);
        }

        await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucursalFinalId, accion || 'Editar Venta (Productos)', `Venta ID: ${ventaId} - Total: $${total} - Método: ${metodoPago} - Fecha: ${fecha} - Prods: [${resumenCarrito(carrito)}]`);

        await runQuery("COMMIT", []);
        notificarInventarioActualizado();
        solicitarSincronizacion('venta editada');

        return { success: true, message: 'Venta modificada exitosamente.' };
    } catch (err) {
        await runQuery("ROLLBACK", []).catch(() => { });
        return { success: false, message: 'Error al modificar venta: ' + err.message };
    }
}

module.exports = { insertarVentaTx, eliminarVentaTx, editarVentaCompletaTx };
