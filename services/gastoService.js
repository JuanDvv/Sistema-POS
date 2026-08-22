const { BrowserWindow } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { db, runQuery } = require('../db/connection');
const { registrarAuditoria } = require('./auditService');
const { registrarMovimientoInventario } = require('./inventarioMovimientoService');
const { solicitarSincronizacion } = require('../sync/syncService');
const { TIPOS_GASTO, ESTADOS_DEVOLUCION, requiereAjusteInventario } = require('../utils/gastos');

// SRP: única fuente de verdad de la transacción que crea un gasto (cabecera + ajuste de
// inventario si aplica + auditoría). Usada tanto por el registro directo (día actual o fecha
// anterior de un Administrador) como por la aprobación de solicitudes de gasto retroactivo.

function notificarInventarioActualizado() {
    BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
            win.webContents.send('inventario-actualizado');
        }
    });
}

async function insertarGastoTx({ sucursalId, tipo, descripcion, monto, metodoPago, fecha, productosVencidos = [], auditoriaUsuario, auditoriaRol, accion }) {
    const gastoId = uuidv4();
    const esDevolucion = tipo === TIPOS_GASTO.DEVOLUCION;
    const estadoInicial = esDevolucion ? ESTADOS_DEVOLUCION.PENDIENTE : null;

    try {
        await runQuery('BEGIN TRANSACTION', []);
        await runQuery(
            `INSERT INTO gastos (id, sucursal_id, tipo, descripcion, monto, fecha, metodo_pago, estado, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
            [gastoId, sucursalId, tipo, descripcion, Number(monto) || 0, fecha, metodoPago || 'Efectivo', estadoInicial]
        );

        if (requiereAjusteInventario(tipo) && productosVencidos.length > 0) {
            const tipoMovimiento = esDevolucion ? 'BAJA_DEVOLUCION' : 'BAJA_INVENTARIO';
            for (const item of productosVencidos) {
                const cantidad = Number(item.cantidad || 0);
                if (!item.id || cantidad <= 0) continue;

                const stockActual = await new Promise((resolve, reject) => {
                    db.get(`SELECT stock FROM inventario_sucursal WHERE producto_id = ? AND sucursal_id = ?`, [item.id, sucursalId], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });

                if (!stockActual || stockActual.stock < cantidad) {
                    throw new Error(`No hay suficiente stock de ${item.nombre || 'producto'} para descontar ${cantidad} unidades.`);
                }

                await runQuery(
                    `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                     VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                     ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                        stock = stock - excluded.stock,
                        sync_status = 'pending'`,
                    [item.id, sucursalId, cantidad]
                );
                await registrarMovimientoInventario({
                    productoId: item.id, sucursalId, tipo: tipoMovimiento,
                    cantidad: -cantidad, referenciaId: gastoId, usuario: auditoriaUsuario
                });
            }
        }

        const accionAuditoria = accion || (esDevolucion ? 'Registrar Devolución de Producto' : 'Registrar Gasto');
        await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucursalId, accionAuditoria, `Monto: $${Number(monto) || 0} - Clasificación: ${tipo} - Método: ${metodoPago || 'Efectivo'} - Fecha: ${fecha} - Desc: ${descripcion}`);
        await runQuery('COMMIT', []);

        notificarInventarioActualizado();
        solicitarSincronizacion('gasto registrado');

        return { success: true, message: 'Gasto registrado con éxito.', gastoId };
    } catch (error) {
        await runQuery('ROLLBACK', []).catch(() => { });
        return { success: false, message: 'Error al guardar el gasto: ' + error.message };
    }
}

module.exports = { insertarGastoTx };
