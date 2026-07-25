const { ipcMain } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { db, runQuery, allQuery } = require('../db/connection');
const { registrarAuditoria } = require('../services/auditService');
const { insertarVentaTx, eliminarVentaTx, editarVentaCompletaTx } = require('../services/ventaService');
const { esFechaAnteriorValida, construirFechaISODeDia } = require('../services/fechaService');
const { solicitarSincronizacion } = require('../sync/syncService');

// SRP: expone como IPC el ciclo de vida de una venta (día actual, fecha anterior y
// aprobación de solicitudes). La lógica transaccional vive en services/ventaService.

function registerVentasIpc() {
    ipcMain.handle('registrar-venta', async (event, datosVenta) => {
        const { sucursalId, metodoPago, total, carrito, auditoriaUsuario, auditoriaRol, valorDomicilio, es_credito, cliente_id } = datosVenta;
        return insertarVentaTx({
            sucursalId, metodoPago, total, carrito, valorDomicilio, es_credito, cliente_id,
            fecha: new Date().toISOString(),
            auditoriaUsuario, auditoriaRol,
            accion: 'Registrar Venta',
            // Solo la venta del día admite quedar con stock negativo (con confirmación ya pedida
            // en la UI). Las de fecha anterior (registrar-venta-anterior) nunca lo permiten.
            permitirStockNegativo: true
        });
    });

    // Editar Venta (Método de pago + productos/cantidades) desde el reporte diario
    ipcMain.handle('editar-venta', async (event, datosVenta) => {
        const { id, metodoPago, carrito, valorDomicilio, auditoriaUsuario, auditoriaRol } = datosVenta;

        if (!Array.isArray(carrito) || carrito.length === 0) {
            return { success: false, message: 'La venta debe tener al menos un producto.' };
        }

        const ventaActual = await new Promise((resolve, reject) => {
            db.get(`SELECT sucursal_id, fecha, es_credito, cliente_id FROM ventas WHERE id = ?`, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        if (!ventaActual) {
            return { success: false, message: 'No se encontró la venta especificada.' };
        }

        let metodoPagoFinal = metodoPago;
        if (typeof metodoPago === 'string' && metodoPago.startsWith('Mixto')) {
            const matchEf = metodoPago.match(/Efectivo:\s*(\d+(?:\.\d+)?)/);
            const matchTr = metodoPago.match(/Transferencia:\s*(\d+(?:\.\d+)?)/);
            if (matchEf && matchTr) {
                const efectivo = parseFloat(matchEf[1]);
                const transferencia = parseFloat(matchTr[1]);
                metodoPagoFinal = `Mixto (Efectivo: ${efectivo}, Transferencia: ${transferencia})`;
            }
        }

        const total = carrito.reduce((sum, item) => sum + (Number(item.precio) * Number(item.cantidad)), 0) + Number(valorDomicilio || 0);

        return editarVentaCompletaTx({
            ventaId: id,
            sucursalId: ventaActual.sucursal_id,
            metodoPago: metodoPagoFinal,
            total,
            carrito,
            valorDomicilio,
            es_credito: ventaActual.es_credito,
            cliente_id: ventaActual.cliente_id,
            fecha: ventaActual.fecha,
            auditoriaUsuario, auditoriaRol,
            accion: 'Editar Venta'
        });
    });

    // Eliminar Venta (Devolver inventario y marcar como eliminada)
    ipcMain.handle('eliminar-venta', async (event, datos) => {
        const { id, auditoriaUsuario, auditoriaRol } = datos;
        return eliminarVentaTx({ ventaId: id, auditoriaUsuario, auditoriaRol, accion: 'Eliminar Venta' });
    });

    // Obtener Reporte Diario Consolidado
    ipcMain.handle('get-reporte-diario', async (event, { sucursalId, fecha, categoriaIds }) => {
        try {
            let hasFilter = Array.isArray(categoriaIds) && categoriaIds.length > 0;
            let queryParamsVentas = [sucursalId, fecha];
            let categoryFilterSql = '';

            if (hasFilter) {
                // Generar placeholders para la consulta de categorías
                const placeholders = categoriaIds.map(() => '?').join(',');
                // La subconsulta filtra las ventas que contienen al menos uno de los productos que corresponden a las categorías seleccionadas
                categoryFilterSql = ` AND EXISTS (
                    SELECT 1 FROM detalle_ventas sub_dv
                    JOIN productos sub_p ON sub_dv.producto_id = sub_p.id
                    WHERE sub_dv.venta_id = v.id AND (sub_p.categoria_id IN (${placeholders}) OR ('sin-categoria' IN (${placeholders}) AND sub_p.categoria_id IS NULL))
                )`;

                // Añadimos los ids filtrados a los parámetros de la consulta de ventas
                categoriaIds.forEach(id => queryParamsVentas.push(id));
                categoriaIds.forEach(id => queryParamsVentas.push(id));
            }

            // El dinero de un pedido/apartado ya se reconoció día a día vía sus abonos (ver
            // `abonosPedido` más abajo), así que la venta que se genera al entregarlo (ver
            // entregarPedidoTx) se marca con `es_pedido` (detectada por el JOIN con `pedidos`) para
            // que el frontend la liste mas NO la sume de nuevo al efectivo/transferencia del día.
            const ventas = await allQuery(
                `SELECT
                    v.id,
                    v.fecha,
                    v.metodo_pago,
                    v.total,
                    v.cliente_id,
                    cli.nombre as cliente_nombre,
                    group_concat(p.nombre || ' (x' || dv.cantidad || ')', ', ') as productos_vendidos,
                    CASE WHEN ped.id IS NOT NULL THEN 1 ELSE 0 END as es_pedido
                 FROM ventas v
                 LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
                 LEFT JOIN productos p ON dv.producto_id = p.id
                 LEFT JOIN clientes cli ON v.cliente_id = cli.id
                 LEFT JOIN pedidos ped ON ped.venta_id = v.id
                 WHERE v.sucursal_id = ? AND strftime('%Y-%m-%d', v.fecha, 'localtime') = ? AND (v.sync_status IS NULL OR v.sync_status <> 'deleted')
                 ${categoryFilterSql}
                 GROUP BY v.id
                 ORDER BY v.fecha DESC`,
                queryParamsVentas
            );

            const gastos = await allQuery(
                `SELECT * FROM gastos WHERE sucursal_id = ? AND strftime('%Y-%m-%d', fecha, 'localtime') = ? AND (sync_status IS NULL OR sync_status <> 'deleted') ORDER BY fecha DESC`,
                [sucursalId, fecha]
            );

            // Abonos de Pedidos/Apartados recibidos este día: dinero real cobrado (efectivo/transferencia)
            // que aún no se refleja en `ventas` porque el pedido puede entregarse otro día. Se reconoce
            // el día del abono para que el efectivo esperado de caja cuadre con lo recibido ese día.
            const abonosPedido = await allQuery(
                `SELECT ap.id, ap.monto, ap.metodo_pago, ap.fecha, p.id as pedido_id, cli.nombre as cliente_nombre
                 FROM abonos_pedido ap
                 JOIN pedidos p ON ap.pedido_id = p.id
                 LEFT JOIN clientes cli ON p.cliente_id = cli.id
                 WHERE p.sucursal_id = ? AND strftime('%Y-%m-%d', ap.fecha, 'localtime') = ? AND (ap.sync_status IS NULL OR ap.sync_status <> 'deleted')
                 ORDER BY ap.fecha DESC`,
                [sucursalId, fecha]
            );

            let queryParamsResumen = [sucursalId, fecha];
            let categoryFilterResumenSql = '';
            if (hasFilter) {
                const placeholders = categoriaIds.map(() => '?').join(',');
                categoryFilterResumenSql = ` AND (p.categoria_id IN (${placeholders}) OR ('sin-categoria' IN (${placeholders}) AND p.categoria_id IS NULL))`;
                categoriaIds.forEach(id => queryParamsResumen.push(id));
                categoriaIds.forEach(id => queryParamsResumen.push(id));
            }

            // Nueva consulta consolidada de ventas por categoría para el reporte diario (incluyendo padres)
            const categoriasResumen = await allQuery(
                `SELECT
                    p.categoria_id,
                    COALESCE(c.nombre, 'Sin Categoría') as categoria_nombre,
                    c.categoria_padre_id,
                    cp.nombre as padre_nombre,
                    SUM(dv.cantidad) as total_cantidad,
                    SUM(dv.cantidad * dv.precio_unitario) as total_ingreso
                 FROM ventas v
                 JOIN detalle_ventas dv ON v.id = dv.venta_id
                 JOIN productos p ON dv.producto_id = p.id
                 LEFT JOIN categorias c ON p.categoria_id = c.id
                 LEFT JOIN categorias cp ON c.categoria_padre_id = cp.id
                 WHERE v.sucursal_id = ? AND strftime('%Y-%m-%d', v.fecha, 'localtime') = ? AND (v.sync_status IS NULL OR v.sync_status <> 'deleted')
                 ${categoryFilterResumenSql}
                 GROUP BY p.categoria_id, c.nombre, c.categoria_padre_id, cp.nombre`,
                queryParamsResumen
            );

            // Obtener transferencias de inventario que involucran a la sucursal actual para el reporte diario
            const transferencias = await allQuery(
                `SELECT
                    t.id,
                    t.sucursal_origen_id,
                    t.sucursal_destino_id,
                    t.fecha,
                    t.usuario,
                    group_concat(p.nombre || ' (x' || dt.cantidad || ')', ', ') as productos_detalle
                 FROM transferencias t
                 LEFT JOIN detalle_transferencias dt ON t.id = dt.transferencia_id
                 LEFT JOIN productos p ON dt.producto_id = p.id
                 WHERE (t.sucursal_origen_id = ? OR t.sucursal_destino_id = ?)
                   AND strftime('%Y-%m-%d', t.fecha, 'localtime') = ?
                   AND (t.sync_status IS NULL OR t.sync_status <> 'deleted')
                 GROUP BY t.id`,
                [sucursalId, sucursalId, fecha]
            );

            // Obtener resumen de ventas por producto (Reporte BiBI)
            // El stock se "congela" al cierre del día consultado: se parte del stock actual y se le
            // revierten (resta) los movimientos de inventario ocurridos DESPUÉS de ese día, usando el
            // kardex append-only de movimientos_inventario. Así, al revisar un día pasado, se ve cómo
            // quedó el stock ese día y no el valor en vivo.
            const queryParamsProductos = [fecha, sucursalId, fecha, ...queryParamsResumen.slice(2)];
            const productosResumen = await allQuery(
                `SELECT
                    p.nombre as producto_nombre,
                    COALESCE(c.nombre, 'Sin Categoría') as categoria_nombre,
                    c.id as categoria_id,
                    SUM(dv.cantidad) as total_cantidad,
                    SUM(dv.cantidad * dv.precio_unitario) as total_ingreso,
                    COALESCE(MAX(inv.stock), 0) - COALESCE((
                        SELECT SUM(mi.cantidad) FROM movimientos_inventario mi
                        WHERE mi.producto_id = dv.producto_id AND mi.sucursal_id = v.sucursal_id
                          AND strftime('%Y-%m-%d', mi.fecha, 'localtime') > ?
                    ), 0) as stock_actual
                 FROM ventas v
                 JOIN detalle_ventas dv ON v.id = dv.venta_id
                 JOIN productos p ON dv.producto_id = p.id
                 LEFT JOIN categorias c ON p.categoria_id = c.id
                 LEFT JOIN inventario_sucursal inv ON p.id = inv.producto_id AND v.sucursal_id = inv.sucursal_id
                 WHERE v.sucursal_id = ? AND strftime('%Y-%m-%d', v.fecha, 'localtime') = ? AND (v.sync_status IS NULL OR v.sync_status <> 'deleted')
                 ${categoryFilterResumenSql}
                 GROUP BY dv.producto_id, p.nombre, c.nombre, c.id
                 ORDER BY c.nombre ASC, total_cantidad DESC`,
                queryParamsProductos
            );

            return { success: true, ventas, gastos, categoriasResumen, transferencias, productosResumen, abonosPedido };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    // =================================================================
    // VENTAS DE FECHA ANTERIOR (con cola de aprobación para Operadores)
    // =================================================================

    // Registrar una venta nueva con fecha de un día anterior
    ipcMain.handle('registrar-venta-anterior', async (event, datos) => {
        const { sucursalId, metodoPago, total, carrito, valorDomicilio, es_credito, cliente_id, fechaVenta, auditoriaUsuario, auditoriaRol } = datos;

        if (!esFechaAnteriorValida(fechaVenta)) {
            return { success: false, message: 'La fecha de la venta debe ser un día anterior a hoy.' };
        }
        if (!Array.isArray(carrito) || carrito.length === 0) {
            return { success: false, message: 'El carrito está vacío.' };
        }

        if (auditoriaRol === 'Administrador') {
            const resultado = await insertarVentaTx({
                sucursalId, metodoPago, total, carrito, valorDomicilio, es_credito, cliente_id,
                fecha: construirFechaISODeDia(fechaVenta),
                auditoriaUsuario, auditoriaRol,
                accion: 'Registrar Venta (Fecha Anterior)'
            });
            return { ...resultado, requiereAprobacion: false };
        }

        try {
            const id = uuidv4();
            const ahora = new Date().toISOString();
            const propuesta = { sucursalId, metodoPago, total, carrito, valorDomicilio, es_credito, cliente_id };
            await runQuery(
                `INSERT INTO solicitudes_venta (id, tipo, venta_id, sucursal_id, fecha_venta, datos, estado, usuario_solicitante, fecha_solicitud, sync_status, updated_at)
                 VALUES (?, 'nueva', NULL, ?, ?, ?, 'pendiente', ?, ?, 'pending', ?)`,
                [id, sucursalId, fechaVenta, JSON.stringify({ propuesta }), auditoriaUsuario, ahora, ahora]
            );
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucursalId, 'Solicitud Venta Retroactiva (Nueva)', `Fecha: ${fechaVenta} - Total: $${total} - Método: ${metodoPago}`);
            solicitarSincronizacion('solicitud de venta retroactiva creada');
            return { success: true, message: 'Solicitud enviada. Un administrador debe confirmarla antes de que se refleje en caja e inventario.', requiereAprobacion: true };
        } catch (err) {
            return { success: false, message: 'Error al enviar la solicitud: ' + err.message };
        }
    });

    // Obtener el detalle completo de una venta (para precargar el carrito al editar)
    ipcMain.handle('obtener-detalle-venta', async (event, ventaId) => {
        try {
            const venta = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM ventas WHERE id = ?`, [ventaId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            if (!venta) {
                return { success: false, message: 'No se encontró la venta especificada.' };
            }
            const detalle = await allQuery(
                `SELECT dv.producto_id, dv.cantidad, dv.precio_unitario, p.nombre, p.categoria_id, c.nombre as categoria_nombre
                 FROM detalle_ventas dv
                 LEFT JOIN productos p ON dv.producto_id = p.id
                 LEFT JOIN categorias c ON p.categoria_id = c.id
                 WHERE dv.venta_id = ?`,
                [ventaId]
            );
            return { success: true, venta, detalle };
        } catch (err) {
            return { success: false, message: 'Error al obtener el detalle de la venta: ' + err.message };
        }
    });

    // Editar una venta de un día anterior (productos, método de pago, fecha, etc.)
    ipcMain.handle('editar-venta-anterior', async (event, datos) => {
        const { ventaId, sucursalId, metodoPago, total, carrito, valorDomicilio, es_credito, cliente_id, fechaVenta, auditoriaUsuario, auditoriaRol } = datos;

        if (!esFechaAnteriorValida(fechaVenta)) {
            return { success: false, message: 'La fecha de la venta debe ser un día anterior a hoy.' };
        }
        if (!Array.isArray(carrito) || carrito.length === 0) {
            return { success: false, message: 'El carrito está vacío.' };
        }

        if (auditoriaRol === 'Administrador') {
            const resultado = await editarVentaCompletaTx({
                ventaId, sucursalId, metodoPago, total, carrito, valorDomicilio, es_credito, cliente_id,
                fecha: construirFechaISODeDia(fechaVenta),
                auditoriaUsuario, auditoriaRol,
                accion: 'Editar Venta (Fecha Anterior)'
            });
            return { ...resultado, requiereAprobacion: false };
        }

        try {
            const detalleActual = await allQuery(
                `SELECT dv.producto_id, dv.cantidad, dv.precio_unitario, p.nombre
                 FROM detalle_ventas dv LEFT JOIN productos p ON dv.producto_id = p.id
                 WHERE dv.venta_id = ?`,
                [ventaId]
            );
            const ventaActual = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM ventas WHERE id = ?`, [ventaId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            if (!ventaActual) {
                return { success: false, message: 'No se encontró la venta especificada.' };
            }

            const id = uuidv4();
            const ahora = new Date().toISOString();
            const propuesta = { sucursalId, metodoPago, total, carrito, valorDomicilio, es_credito, cliente_id };
            const snapshotOriginal = { venta: ventaActual, detalle: detalleActual };
            await runQuery(
                `INSERT INTO solicitudes_venta (id, tipo, venta_id, sucursal_id, fecha_venta, datos, estado, usuario_solicitante, fecha_solicitud, sync_status, updated_at)
                 VALUES (?, 'edicion', ?, ?, ?, ?, 'pendiente', ?, ?, 'pending', ?)`,
                [id, ventaId, sucursalId, fechaVenta, JSON.stringify({ propuesta, snapshotOriginal }), auditoriaUsuario, ahora, ahora]
            );
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucursalId, 'Solicitud Venta Retroactiva (Edición)', `Venta ID: ${ventaId} - Fecha: ${fechaVenta} - Nuevo Total: $${total}`);
            solicitarSincronizacion('solicitud de edición de venta retroactiva creada');
            return { success: true, message: 'Solicitud de edición enviada. Un administrador debe confirmarla antes de que se aplique.', requiereAprobacion: true };
        } catch (err) {
            return { success: false, message: 'Error al enviar la solicitud: ' + err.message };
        }
    });

    // Eliminar una venta de un día anterior
    ipcMain.handle('eliminar-venta-anterior', async (event, datos) => {
        const { ventaId, auditoriaUsuario, auditoriaRol } = datos;

        if (auditoriaRol === 'Administrador') {
            const resultado = await eliminarVentaTx({ ventaId, auditoriaUsuario, auditoriaRol, accion: 'Eliminar Venta (Fecha Anterior)' });
            return { ...resultado, requiereAprobacion: false };
        }

        try {
            const ventaActual = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM ventas WHERE id = ?`, [ventaId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            if (!ventaActual) {
                return { success: false, message: 'No se encontró la venta especificada.' };
            }
            const detalleActual = await allQuery(
                `SELECT dv.producto_id, dv.cantidad, dv.precio_unitario, p.nombre
                 FROM detalle_ventas dv LEFT JOIN productos p ON dv.producto_id = p.id
                 WHERE dv.venta_id = ?`,
                [ventaId]
            );

            const id = uuidv4();
            const ahora = new Date().toISOString();
            const fechaDia = String(ventaActual.fecha || '').slice(0, 10);
            const snapshotOriginal = { venta: ventaActual, detalle: detalleActual };
            await runQuery(
                `INSERT INTO solicitudes_venta (id, tipo, venta_id, sucursal_id, fecha_venta, datos, estado, usuario_solicitante, fecha_solicitud, sync_status, updated_at)
                 VALUES (?, 'eliminacion', ?, ?, ?, ?, 'pendiente', ?, ?, 'pending', ?)`,
                [id, ventaId, ventaActual.sucursal_id, fechaDia, JSON.stringify({ snapshotOriginal }), auditoriaUsuario, ahora, ahora]
            );
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, ventaActual.sucursal_id, 'Solicitud Venta Retroactiva (Eliminación)', `Venta ID: ${ventaId} - Total: $${ventaActual.total}`);
            solicitarSincronizacion('solicitud de eliminación de venta retroactiva creada');
            return { success: true, message: 'Solicitud de eliminación enviada. Un administrador debe confirmarla.', requiereAprobacion: true };
        } catch (err) {
            return { success: false, message: 'Error al enviar la solicitud: ' + err.message };
        }
    });

    // Listar solicitudes de venta retroactiva
    ipcMain.handle('obtener-solicitudes-venta', async (event, filtros) => {
        const { estado, usuario } = filtros || {};
        try {
            let query = `SELECT * FROM solicitudes_venta WHERE 1=1`;
            const params = [];
            if (estado) {
                query += ` AND estado = ?`;
                params.push(estado);
            }
            if (usuario) {
                query += ` AND usuario_solicitante = ?`;
                params.push(usuario);
            }
            query += ` ORDER BY fecha_solicitud DESC`;
            const rows = await allQuery(query, params);
            return { success: true, data: rows };
        } catch (err) {
            return { success: false, message: 'Error al obtener solicitudes: ' + err.message };
        }
    });

    // Aprobar una solicitud de venta retroactiva (solo Administrador)
    ipcMain.handle('aprobar-solicitud-venta', async (event, datos) => {
        const { id, auditoriaUsuario, auditoriaRol } = datos;
        if (auditoriaRol !== 'Administrador') {
            return { success: false, message: 'Solo un administrador puede aprobar solicitudes.' };
        }

        try {
            const solicitud = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM solicitudes_venta WHERE id = ?`, [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!solicitud) {
                return { success: false, message: 'No se encontró la solicitud especificada.' };
            }
            if (solicitud.estado !== 'pendiente') {
                return { success: false, message: 'Esta solicitud ya fue revisada.' };
            }

            const datosParseados = JSON.parse(solicitud.datos || '{}');
            const fecha = construirFechaISODeDia(solicitud.fecha_venta);
            let resultado;

            if (solicitud.tipo === 'nueva') {
                const p = datosParseados.propuesta;
                resultado = await insertarVentaTx({
                    sucursalId: p.sucursalId, metodoPago: p.metodoPago, total: p.total, carrito: p.carrito,
                    valorDomicilio: p.valorDomicilio, es_credito: p.es_credito, cliente_id: p.cliente_id,
                    fecha, auditoriaUsuario, auditoriaRol,
                    accion: 'Aprobar Solicitud Venta Retroactiva (Nueva)'
                });
            } else if (solicitud.tipo === 'edicion') {
                const ventaExiste = await new Promise((resolve) => {
                    db.get(`SELECT id FROM ventas WHERE id = ? AND (sync_status IS NULL OR sync_status <> 'deleted')`, [solicitud.venta_id], (err, row) => resolve(row));
                });
                if (!ventaExiste) {
                    await runQuery(
                        `UPDATE solicitudes_venta SET estado = 'rechazada', usuario_revisor = ?, fecha_revision = ?, motivo_rechazo = ?, sync_status = 'pending' WHERE id = ?`,
                        [auditoriaUsuario, new Date().toISOString(), 'La venta original ya no existe.', id]
                    );
                    solicitarSincronizacion('solicitud rechazada automáticamente');
                    return { success: false, message: 'La venta original ya no existe. La solicitud fue rechazada automáticamente.' };
                }
                const p = datosParseados.propuesta;
                resultado = await editarVentaCompletaTx({
                    ventaId: solicitud.venta_id, sucursalId: p.sucursalId, metodoPago: p.metodoPago, total: p.total, carrito: p.carrito,
                    valorDomicilio: p.valorDomicilio, es_credito: p.es_credito, cliente_id: p.cliente_id,
                    fecha, auditoriaUsuario, auditoriaRol,
                    accion: 'Aprobar Solicitud Venta Retroactiva (Edición)'
                });
            } else if (solicitud.tipo === 'eliminacion') {
                const ventaExiste = await new Promise((resolve) => {
                    db.get(`SELECT id FROM ventas WHERE id = ? AND (sync_status IS NULL OR sync_status <> 'deleted')`, [solicitud.venta_id], (err, row) => resolve(row));
                });
                if (!ventaExiste) {
                    await runQuery(
                        `UPDATE solicitudes_venta SET estado = 'rechazada', usuario_revisor = ?, fecha_revision = ?, motivo_rechazo = ?, sync_status = 'pending' WHERE id = ?`,
                        [auditoriaUsuario, new Date().toISOString(), 'La venta original ya no existe.', id]
                    );
                    solicitarSincronizacion('solicitud rechazada automáticamente');
                    return { success: false, message: 'La venta original ya no existe. La solicitud fue rechazada automáticamente.' };
                }
                resultado = await eliminarVentaTx({ ventaId: solicitud.venta_id, auditoriaUsuario, auditoriaRol, accion: 'Aprobar Solicitud Venta Retroactiva (Eliminación)' });
            } else {
                return { success: false, message: 'Tipo de solicitud desconocido.' };
            }

            if (!resultado.success) {
                return resultado;
            }

            await runQuery(
                `UPDATE solicitudes_venta SET estado = 'aprobada', usuario_revisor = ?, fecha_revision = ?, sync_status = 'pending' WHERE id = ?`,
                [auditoriaUsuario, new Date().toISOString(), id]
            );
            solicitarSincronizacion('solicitud de venta aprobada');

            return { success: true, message: 'Solicitud aprobada y aplicada exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al aprobar la solicitud: ' + err.message };
        }
    });

    // Rechazar una solicitud de venta retroactiva (solo Administrador)
    ipcMain.handle('rechazar-solicitud-venta', async (event, datos) => {
        const { id, motivo, auditoriaUsuario, auditoriaRol } = datos;
        if (auditoriaRol !== 'Administrador') {
            return { success: false, message: 'Solo un administrador puede rechazar solicitudes.' };
        }
        try {
            const solicitud = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM solicitudes_venta WHERE id = ?`, [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            if (!solicitud) {
                return { success: false, message: 'No se encontró la solicitud especificada.' };
            }
            if (solicitud.estado !== 'pendiente') {
                return { success: false, message: 'Esta solicitud ya fue revisada.' };
            }
            await runQuery(
                `UPDATE solicitudes_venta SET estado = 'rechazada', usuario_revisor = ?, fecha_revision = ?, motivo_rechazo = ?, sync_status = 'pending' WHERE id = ?`,
                [auditoriaUsuario, new Date().toISOString(), motivo || null, id]
            );
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, solicitud.sucursal_id, 'Rechazar Solicitud Venta Retroactiva', `Solicitud ID: ${id}${motivo ? ' - Motivo: ' + motivo : ''}`);
            solicitarSincronizacion('solicitud de venta rechazada');
            return { success: true, message: 'Solicitud rechazada.' };
        } catch (err) {
            return { success: false, message: 'Error al rechazar la solicitud: ' + err.message };
        }
    });

    // Contar solicitudes pendientes (para el badge del sidebar)
    ipcMain.handle('contar-solicitudes-pendientes', async () => {
        try {
            const row = await new Promise((resolve, reject) => {
                db.get(`SELECT COUNT(*) as total FROM solicitudes_venta WHERE estado = 'pendiente'`, [], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            return { success: true, count: row ? row.total : 0 };
        } catch (err) {
            return { success: false, count: 0, message: err.message };
        }
    });
}

module.exports = { registerVentasIpc };
