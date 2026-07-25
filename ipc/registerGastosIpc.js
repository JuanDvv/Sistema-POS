const { ipcMain, BrowserWindow } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { db, runQuery, allQuery } = require('../db/connection');
const { registrarAuditoria } = require('../services/auditService');
const { registrarMovimientoInventario } = require('../services/inventarioMovimientoService');
const { solicitarSincronizacion } = require('../sync/syncService');
const { TIPOS_GASTO, ESTADOS_DEVOLUCION, requiereAjusteInventario } = require('../utils/gastos');

// SRP: registro, edición y eliminación de gastos/egresos de caja.

function registerGastosIpc() {
    // Registrar Gasto
    ipcMain.handle('registrar-gasto', async (event, datosGasto) => {
        const { sucursalId, tipo, descripcion, monto, metodoPago, auditoriaUsuario, auditoriaRol, productosVencidos = [] } = datosGasto;
        const gastoId = uuidv4();
        const fechaActual = new Date().toISOString();
        const esDevolucion = tipo === TIPOS_GASTO.DEVOLUCION;
        const estadoInicial = esDevolucion ? ESTADOS_DEVOLUCION.PENDIENTE : null;

        try {
            await runQuery('BEGIN TRANSACTION', []);
            await runQuery(
                `INSERT INTO gastos (id, sucursal_id, tipo, descripcion, monto, fecha, metodo_pago, estado, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                [gastoId, sucursalId, tipo, descripcion, Number(monto) || 0, fechaActual, metodoPago || 'Efectivo', estadoInicial]
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

            const accionAuditoria = esDevolucion ? 'Registrar Devolución de Producto' : 'Registrar Gasto';
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucursalId, accionAuditoria, `Monto: $${Number(monto) || 0} - Clasificación: ${tipo} - Método: ${metodoPago || 'Efectivo'} - Desc: ${descripcion}`);
            await runQuery('COMMIT', []);

            BrowserWindow.getAllWindows().forEach(win => {
                if (!win.isDestroyed()) {
                    win.webContents.send('inventario-actualizado');
                }
            });
            solicitarSincronizacion('gasto registrado');

            return { success: true, message: 'Gasto registrado con éxito.' };
        } catch (error) {
            await runQuery('ROLLBACK', []).catch(() => { });
            return { success: false, message: 'Error al guardar el gasto: ' + error.message };
        }
    });

    // Descripciones más frecuentes de una clasificación (uso: sugerencias al registrar gastos
    // recurrentes, ej. "Pago del turno" en Operativo, para no reescribirlas cada vez). Se agrupan
    // normalizando mayúsculas/espacios para que variaciones de escritura cuenten como el mismo
    // gasto, y de cada grupo se toma la descripción de la ocurrencia más reciente (gracias al bare
    // column de SQLite junto al único MAX() de la consulta). HAVING usos >= 2 deja fuera los
    // conceptos escritos una sola vez (no son "recurrentes" todavía); de los que sí califican se
    // listan los 20 más usados.
    //
    // Se excluye "Domicilio (Descuento de Caja)": no se registra desde este formulario, sino que lo
    // crea automáticamente insertarVentaTx/editarVentaCompletaTx (ver services/ventaService.js) al
    // marcar domicilio en una venta, así que no tiene sentido sugerirlo aquí.
    ipcMain.handle('obtener-descripciones-frecuentes-gasto', async (event, { sucursalId, tipo }) => {
        try {
            const rows = await allQuery(
                `SELECT descripcion, COUNT(*) as usos, MAX(fecha) as ultima_fecha
                 FROM gastos
                 WHERE sucursal_id = ? AND tipo = ? AND descripcion IS NOT NULL AND TRIM(descripcion) <> ''
                   AND LOWER(TRIM(descripcion)) <> 'domicilio (descuento de caja)'
                   AND (sync_status IS NULL OR sync_status <> 'deleted')
                 GROUP BY LOWER(TRIM(descripcion))
                 HAVING COUNT(*) >= 2
                 ORDER BY usos DESC, ultima_fecha DESC
                 LIMIT 20`,
                [sucursalId, tipo]
            );
            return { success: true, data: rows.map(r => ({ descripcion: r.descripcion, usos: r.usos })) };
        } catch (err) {
            return { success: false, data: [], message: err.message };
        }
    });

    // Editar Gasto
    ipcMain.handle('editar-gasto', async (event, datosGasto) => {
        const { id, tipo, descripcion, monto, metodoPago, auditoriaUsuario, auditoriaRol } = datosGasto;
        try {
            // Obtener la sucursal del gasto original antes de modificarlo para auditoría
            const gasto = await new Promise((resolve) => {
                db.get(`SELECT sucursal_id, descripcion FROM gastos WHERE id = ?`, [id], (err, row) => resolve(row));
            });
            // "Domicilio (Descuento de Caja)" lo genera y reconcilia automáticamente
            // insertarVentaTx/editarVentaCompletaTx (ver services/ventaService.js); editarlo aquí lo
            // desincronizaría de su venta asociada, así que se bloquea aunque la UI ya no ofrezca el botón.
            if (gasto && gasto.descripcion === 'Domicilio (Descuento de Caja)') {
                return { success: false, message: 'Este gasto se gestiona automáticamente desde la venta asociada y no se puede editar aquí.' };
            }
            const sucId = gasto ? gasto.sucursal_id : 'Desconocida';

            await runQuery(
                `UPDATE gastos SET tipo = ?, descripcion = ?, monto = ?, metodo_pago = ?, sync_status = 'pending' WHERE id = ?`,
                [tipo, descripcion, monto, metodoPago || 'Efectivo', id]
            );
            // Registrar en logs de auditoría
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucId, 'Editar Gasto', `Gasto ID: ${id} - Nuevo Monto: $${monto} - Tipo: ${tipo} - Método: ${metodoPago || 'Efectivo'} - Desc: ${descripcion}`);
            solicitarSincronizacion('gasto editado');
            return { success: true, message: 'Gasto modificado exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al modificar el gasto: ' + err.message };
        }
    });

    // Eliminar Gasto
    ipcMain.handle('eliminar-gasto', async (event, datos) => {
        const { id, auditoriaUsuario, auditoriaRol } = datos;
        try {
            // Obtener datos del gasto antes de marcar como eliminado
            const gasto = await new Promise((resolve) => {
                db.get(`SELECT sucursal_id, tipo, monto, descripcion FROM gastos WHERE id = ?`, [id], (err, row) => resolve(row));
            });
            // Igual que en editar-gasto: este gasto se borra automáticamente al quitar el domicilio
            // de su venta (ver editarVentaCompletaTx en services/ventaService.js), no manualmente aquí.
            if (gasto && gasto.descripcion === 'Domicilio (Descuento de Caja)') {
                return { success: false, message: 'Este gasto se gestiona automáticamente desde la venta asociada y no se puede borrar aquí.' };
            }
            const sucId = gasto ? gasto.sucursal_id : 'Desconocida';

            await runQuery('BEGIN TRANSACTION', []);

            // Si el gasto había descontado inventario (Gasto de Inventario / Devolución de Producto),
            // se revierte cada movimiento asociado para que el stock quede como antes de registrarlo.
            if (gasto && requiereAjusteInventario(gasto.tipo)) {
                const movimientos = await new Promise((resolve, reject) => {
                    db.all(`SELECT producto_id, sucursal_id, cantidad FROM movimientos_inventario WHERE referencia_id = ?`, [id], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    });
                });
                for (const mov of movimientos) {
                    await runQuery(
                        `UPDATE inventario_sucursal SET stock = stock - ?, sync_status = 'pending' WHERE producto_id = ? AND sucursal_id = ?`,
                        [mov.cantidad, mov.producto_id, mov.sucursal_id]
                    );
                    await registrarMovimientoInventario({
                        productoId: mov.producto_id, sucursalId: mov.sucursal_id, tipo: 'REVERSION_ELIMINACION_GASTO',
                        cantidad: -mov.cantidad, referenciaId: id, usuario: auditoriaUsuario
                    });
                }
            }

            await runQuery(`UPDATE gastos SET sync_status = 'deleted' WHERE id = ?`, [id]);
            await runQuery('COMMIT', []);

            // Registrar en logs de auditoría
            if (gasto) {
                await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucId, 'Eliminar Gasto', `Gasto ID: ${id} - Monto: $${gasto.monto} - Desc: ${gasto.descripcion}`);
            }
            solicitarSincronizacion('gasto eliminado');
            return { success: true, message: 'Gasto eliminado exitosamente.' };
        } catch (err) {
            await runQuery('ROLLBACK', []).catch(() => { });
            return { success: false, message: 'Error al eliminar el gasto: ' + err.message };
        }
    });

    // Actualizar Estado de Devolución: el proveedor informa si el producto regresa a la sucursal
    // (reingresa a inventario) o se queda con ellos tras su auditoría de calidad (Rechazada, sin cambio).
    ipcMain.handle('actualizar-estado-devolucion', async (event, datos) => {
        const { id, nuevoEstado, auditoriaUsuario, auditoriaRol } = datos;
        if (!Object.values(ESTADOS_DEVOLUCION).includes(nuevoEstado)) {
            return { success: false, message: 'Estado de devolución inválido.' };
        }
        try {
            const devolucion = await new Promise((resolve) => {
                db.get(`SELECT sucursal_id, descripcion, estado FROM gastos WHERE id = ? AND tipo = ?`, [id, TIPOS_GASTO.DEVOLUCION], (err, row) => resolve(row));
            });
            if (!devolucion) {
                return { success: false, message: 'Devolución no encontrada.' };
            }
            const estadoActual = devolucion.estado || ESTADOS_DEVOLUCION.PENDIENTE;
            if (estadoActual !== ESTADOS_DEVOLUCION.PENDIENTE) {
                return { success: false, message: `Esta devolución ya fue resuelta (${estadoActual}).` };
            }

            await runQuery('BEGIN TRANSACTION', []);

            // El proveedor regresó el producto a la sucursal: reingresa el stock que se descontó
            // al registrar la devolución, usando el mismo kardex (movimientos_inventario) como fuente.
            if (nuevoEstado === ESTADOS_DEVOLUCION.DEVUELTA) {
                const movimientos = await new Promise((resolve, reject) => {
                    db.all(`SELECT producto_id, sucursal_id, cantidad FROM movimientos_inventario WHERE referencia_id = ? AND tipo = 'BAJA_DEVOLUCION'`, [id], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    });
                });
                for (const mov of movimientos) {
                    await runQuery(
                        `UPDATE inventario_sucursal SET stock = stock - ?, sync_status = 'pending' WHERE producto_id = ? AND sucursal_id = ?`,
                        [mov.cantidad, mov.producto_id, mov.sucursal_id]
                    );
                    await registrarMovimientoInventario({
                        productoId: mov.producto_id, sucursalId: mov.sucursal_id, tipo: 'REINGRESO_DEVOLUCION',
                        cantidad: -mov.cantidad, referenciaId: id, usuario: auditoriaUsuario
                    });
                }
            }

            await runQuery(`UPDATE gastos SET estado = ?, sync_status = 'pending' WHERE id = ?`, [nuevoEstado, id]);
            await runQuery('COMMIT', []);

            await registrarAuditoria(auditoriaUsuario, auditoriaRol, devolucion.sucursal_id, 'Actualizar Estado Devolución', `Gasto ID: ${id} - Estado: ${estadoActual} -> ${nuevoEstado} - Desc: ${devolucion.descripcion}`);
            solicitarSincronizacion('estado de devolución actualizado');
            return { success: true, message: 'Estado de la devolución actualizado.' };
        } catch (err) {
            await runQuery('ROLLBACK', []).catch(() => { });
            return { success: false, message: 'Error al actualizar la devolución: ' + err.message };
        }
    });
}

module.exports = { registerGastosIpc };
