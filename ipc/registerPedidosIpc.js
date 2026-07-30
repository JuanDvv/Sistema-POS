const { ipcMain } = require('electron');
const { db, allQuery } = require('../db/connection');
const {
    crearPedidoTx, registrarAbonoPedidoTx, eliminarAbonoPedidoTx,
    editarPedidoTx, cancelarPedidoTx, entregarPedidoTx
} = require('../services/pedidoService');

// SRP: expone como IPC el ciclo de vida de un Pedido/Apartado. La lógica transaccional (hold de
// inventario, abonos, entrega/cancelación) vive en services/pedidoService.

function registerPedidosIpc() {
    ipcMain.handle('crear-pedido', async (event, datos) => {
        const { sucursalId, clienteId, clienteNombre, clienteIdentificacion, clienteTelefono, fechaEntregaEstimada, carrito, notas, abonoInicial, auditoriaUsuario, auditoriaRol } = datos;
        return crearPedidoTx({
            sucursalId, clienteId, clienteNombre, clienteIdentificacion, clienteTelefono,
            fechaEntregaEstimada, carrito, notas, abonoInicial, auditoriaUsuario, auditoriaRol
        });
    });

    // Listado de pedidos con datos de cliente, resumen de productos y saldo pendiente ya
    // calculados, para que el buscador/listado de pedidos.html no tenga que hacer N llamadas extra.
    ipcMain.handle('obtener-pedidos', async (event, filtros) => {
        const { sucursalId, estado, busqueda, fechaEntregaDesde, fechaEntregaHasta, soloHoy } = filtros || {};
        try {
            let query = `
                SELECT
                    p.id, p.sucursal_id, p.cliente_id, p.fecha_pedido, p.fecha_entrega_estimada,
                    p.fecha_entrega_real, p.estado, p.total, p.notas, p.venta_id,
                    COALESCE(c.nombre, p.cliente_nombre_registro) as cliente_nombre,
                    COALESCE(c.identificacion, p.cliente_identificacion_registro) as cliente_identificacion,
                    COALESCE(c.telefono, p.cliente_telefono_registro) as cliente_telefono,
                    COALESCE((
                        SELECT SUM(ap.monto) FROM abonos_pedido ap
                        WHERE ap.pedido_id = p.id AND (ap.sync_status IS NULL OR ap.sync_status <> 'deleted')
                    ), 0) as abonado,
                    group_concat(pr.nombre || ' (x' || dp.cantidad || ')', ', ') as productos_resumen
                FROM pedidos p
                LEFT JOIN clientes c ON p.cliente_id = c.id
                LEFT JOIN detalle_pedidos dp ON dp.pedido_id = p.id
                LEFT JOIN productos pr ON dp.producto_id = pr.id
                WHERE (p.sync_status IS NULL OR p.sync_status <> 'deleted')
            `;
            const params = [];

            if (sucursalId) {
                query += ` AND p.sucursal_id = ?`;
                params.push(sucursalId);
            }
            if (estado) {
                query += ` AND p.estado = ?`;
                params.push(estado);
            }
            if (busqueda) {
                query += ` AND (COALESCE(c.nombre, p.cliente_nombre_registro) LIKE ? OR COALESCE(c.identificacion, p.cliente_identificacion_registro) LIKE ? OR COALESCE(c.telefono, p.cliente_telefono_registro) LIKE ? OR p.id LIKE ?)`;
                const like = `%${busqueda}%`;
                params.push(like, like, like, like);
            }
            if (fechaEntregaDesde) {
                query += ` AND strftime('%Y-%m-%d', p.fecha_entrega_estimada) >= ?`;
                params.push(fechaEntregaDesde);
            }
            if (fechaEntregaHasta) {
                query += ` AND strftime('%Y-%m-%d', p.fecha_entrega_estimada) <= ?`;
                params.push(fechaEntregaHasta);
            }
            // "Creados hoy" filtra por fecha de creación (no de entrega) en hora local, para que el
            // cajero pueda verificar de inmediato que un pedido recién registrado quedó guardado,
            // sin importar qué tan lejos esté programada su entrega.
            if (soloHoy) {
                query += ` AND date(p.fecha_pedido, 'localtime') = date('now', 'localtime')`;
            }

            query += ` GROUP BY p.id ORDER BY ${soloHoy ? 'p.fecha_pedido DESC' : 'p.fecha_entrega_estimada ASC'}`;

            const rows = await allQuery(query, params);
            const data = rows.map(row => ({
                ...row,
                saldo_pendiente: Number(row.total) - Number(row.abonado)
            }));

            return { success: true, data };
        } catch (err) {
            return { success: false, message: 'Error al obtener pedidos: ' + err.message };
        }
    });

    ipcMain.handle('obtener-detalle-pedido', async (event, pedidoId) => {
        try {
            const pedido = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT p.*,
                        COALESCE(c.nombre, p.cliente_nombre_registro) as cliente_nombre,
                        COALESCE(c.identificacion, p.cliente_identificacion_registro) as cliente_identificacion,
                        COALESCE(c.telefono, p.cliente_telefono_registro) as cliente_telefono
                     FROM pedidos p LEFT JOIN clientes c ON p.cliente_id = c.id
                     WHERE p.id = ?`,
                    [pedidoId],
                    (err, row) => { if (err) reject(err); else resolve(row); }
                );
            });
            if (!pedido) {
                return { success: false, message: 'No se encontró el pedido especificado.' };
            }

            const detalle = await allQuery(
                `SELECT dp.producto_id, dp.cantidad, dp.precio_unitario, p.nombre
                 FROM detalle_pedidos dp LEFT JOIN productos p ON dp.producto_id = p.id
                 WHERE dp.pedido_id = ?`,
                [pedidoId]
            );

            const abonos = await allQuery(
                `SELECT * FROM abonos_pedido WHERE pedido_id = ? AND (sync_status IS NULL OR sync_status <> 'deleted') ORDER BY fecha ASC`,
                [pedidoId]
            );

            const abonado = abonos.reduce((sum, a) => sum + Number(a.monto || 0), 0);

            return { success: true, pedido, detalle, abonos, saldo_pendiente: Number(pedido.total) - abonado };
        } catch (err) {
            return { success: false, message: 'Error al obtener el detalle del pedido: ' + err.message };
        }
    });

    ipcMain.handle('editar-pedido', async (event, datos) => {
        const { pedidoId, fechaEntregaEstimada, notas, carrito, auditoriaUsuario, auditoriaRol } = datos;
        return editarPedidoTx({ pedidoId, fechaEntregaEstimada, notas, carrito, auditoriaUsuario, auditoriaRol });
    });

    ipcMain.handle('registrar-abono-pedido', async (event, datos) => {
        const { pedidoId, monto, metodoPago, fecha, auditoriaUsuario, auditoriaRol } = datos;
        return registrarAbonoPedidoTx({ pedidoId, monto, metodoPago, fecha, auditoriaUsuario, auditoriaRol });
    });

    ipcMain.handle('eliminar-abono-pedido', async (event, datos) => {
        const { id, auditoriaUsuario, auditoriaRol } = datos;
        return eliminarAbonoPedidoTx({ id, auditoriaUsuario, auditoriaRol });
    });

    ipcMain.handle('entregar-pedido', async (event, datos) => {
        const { pedidoId, auditoriaUsuario, auditoriaRol } = datos;
        return entregarPedidoTx({ pedidoId, auditoriaUsuario, auditoriaRol });
    });

    ipcMain.handle('cancelar-pedido', async (event, datos) => {
        const { pedidoId, auditoriaUsuario, auditoriaRol } = datos;
        return cancelarPedidoTx({ pedidoId, auditoriaUsuario, auditoriaRol });
    });

    // Cuenta pedidos pendientes cuya fecha estimada de entrega ya pasó, para el badge del sidebar.
    ipcMain.handle('contar-pedidos-atrasados', async () => {
        try {
            const row = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT COUNT(*) as total FROM pedidos
                     WHERE estado = 'pendiente' AND fecha_entrega_estimada < strftime('%Y-%m-%dT%H:%M:%fZ','now')
                       AND (sync_status IS NULL OR sync_status <> 'deleted')`,
                    [],
                    (err, row) => { if (err) reject(err); else resolve(row); }
                );
            });
            return { success: true, count: row ? row.total : 0 };
        } catch (err) {
            return { success: false, count: 0, message: err.message };
        }
    });
}

module.exports = { registerPedidosIpc };
