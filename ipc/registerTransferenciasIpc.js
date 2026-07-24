const { ipcMain } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { db, runQuery, allQuery } = require('../db/connection');
const { registrarAuditoria } = require('../services/auditService');
const { registrarMovimientoInventario } = require('../services/inventarioMovimientoService');

// SRP: traslados de inventario entre sucursales.

function registerTransferenciasIpc() {
    // Módulo de Transferencias de Inventario
    ipcMain.handle('realizar-transferencia', async (event, datosTransferencia) => {
        const { sucursalOrigenId, sucursalDestinoId, productos, usuario, rol } = datosTransferencia;
        const transferenciaId = 't-' + uuidv4().substring(0, 8);
        const fechaActual = new Date().toISOString();

        try {
            await runQuery("BEGIN TRANSACTION", []);

            // 1. Registrar cabecera de la transferencia
            // updated_at se fija explícitamente en cada INSERT (no se deja al DEFAULT de la
            // columna): en bases de datos migradas ese DEFAULT no existe a nivel de columna
            // (ver agregarSoporteLWW en db/schema.js) y solo se rellena una vez por arranque de
            // la app, dejando NULL cualquier fila creada a mitad de sesión -- lo que Supabase
            // rechaza por su constraint NOT NULL al sincronizar.
            await runQuery(
                `INSERT INTO transferencias (id, sucursal_origen_id, sucursal_destino_id, fecha, usuario, sync_status, updated_at)
                 VALUES (?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                [transferenciaId, sucursalOrigenId, sucursalDestinoId, fechaActual, usuario]
            );

            for (const item of productos) {
                const detalleId = 'dt-' + uuidv4().substring(0, 8);

                // 2. Validar que el origen tenga stock suficiente antes de descontar: sin este
                //    chequeo el UPDATE de abajo resta a ciegas y puede dejar el origen en negativo.
                const stockOrigen = await new Promise((resolve, reject) => {
                    db.get(`SELECT stock FROM inventario_sucursal WHERE producto_id = ? AND sucursal_id = ?`, [item.id, sucursalOrigenId], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });
                const disponibleOrigen = stockOrigen ? Number(stockOrigen.stock) : 0;
                if (Number(item.cantidad) > disponibleOrigen) {
                    throw new Error(`Stock insuficiente de "${item.nombre || item.id}" en la sucursal de origen. Disponible: ${disponibleOrigen}, solicitado: ${item.cantidad}.`);
                }

                // 3. Registrar detalle de la transferencia
                await runQuery(
                    `INSERT INTO detalle_transferencias (id, transferencia_id, producto_id, cantidad, updated_at)
                     VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                    [detalleId, transferenciaId, item.id, item.cantidad]
                );

                // 4. Descontar stock de la sucursal de origen
                await runQuery(
                    `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                     VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                     ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                        stock = stock - excluded.stock,
                        sync_status = 'pending'`,
                    [item.id, sucursalOrigenId, item.cantidad]
                );
                await registrarMovimientoInventario({
                    productoId: item.id, sucursalId: sucursalOrigenId, tipo: 'TRASLADO_SALIDA',
                    cantidad: -Number(item.cantidad), referenciaId: transferenciaId, usuario
                });

                // 5. Incrementar stock en la sucursal de destino
                await runQuery(
                    `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                     VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                     ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                        stock = stock + excluded.stock,
                        sync_status = 'pending'`,
                    [item.id, sucursalDestinoId, item.cantidad]
                );
                await registrarMovimientoInventario({
                    productoId: item.id, sucursalId: sucursalDestinoId, tipo: 'TRASLADO_ENTRADA',
                    cantidad: Number(item.cantidad), referenciaId: transferenciaId, usuario
                });
            }

            // 5. Registrar acción en logs de auditoría local
            const prodsResumen = productos.map(i => `${i.nombre} (x${i.cantidad})`).join(', ');
            await registrarAuditoria(
                usuario,
                rol,
                sucursalOrigenId,
                'Transferencia de Inventario',
                `Enviado desde ${sucursalOrigenId} hacia ${sucursalDestinoId}. Items: [${prodsResumen}]`
            );

            await runQuery("COMMIT", []);
            return { success: true, message: '¡Transferencia registrada y procesada con éxito!' };
        } catch (error) {
            await runQuery("ROLLBACK", []).catch(() => {});
            return { success: false, message: 'Error al realizar transferencia: ' + error.message };
        }
    });

    // Eliminar transferencia (Revertir stock)
    ipcMain.handle('eliminar-transferencia', async (event, { id, auditoriaUsuario, auditoriaRol }) => {
        try {
            await runQuery("BEGIN TRANSACTION", []);

            // 1. Obtener los datos de la transferencia
            const trans = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM transferencias WHERE id = ?`, [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!trans) {
                throw new Error("La transferencia no existe.");
            }

            // 2. Obtener los detalles de la transferencia
            const detalles = await allQuery(`SELECT * FROM detalle_transferencias WHERE transferencia_id = ?`, [id]);

            // 2.5. Validar que la sucursal de destino tenga stock suficiente de cada producto antes de restar
            for (const det of detalles) {
                const stockRow = await new Promise((resolve, reject) => {
                    db.get(
                        `SELECT stock FROM inventario_sucursal WHERE producto_id = ? AND sucursal_id = ?`,
                        [det.producto_id, trans.sucursal_destino_id],
                        (err, row) => {
                            if (err) reject(err);
                            else resolve(row);
                        }
                    );
                });
                const currentStock = stockRow ? stockRow.stock : 0;
                if (currentStock < det.cantidad) {
                    const prod = await new Promise((resolve) => {
                        db.get(`SELECT nombre FROM productos WHERE id = ?`, [det.producto_id], (err, row) => resolve(row));
                    });
                    const prodName = prod ? prod.nombre : 'Producto Desconocido';
                    throw new Error(`La sucursal de destino (${trans.sucursal_destino_id}) no cuenta con suficiente stock de "${prodName}" para devolver (Stock actual: ${currentStock}, Requerido para devolución: ${det.cantidad}).`);
                }
            }

            // 3. Revertir el stock de cada producto en las sucursales
            for (const det of detalles) {
                // Incrementar stock en origen (se devuelve la mercancia que salio de origen)
                await runQuery(
                    `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                     VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                     ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                        stock = stock + excluded.stock,
                        sync_status = 'pending'`,
                    [det.producto_id, trans.sucursal_origen_id, det.cantidad]
                );
                await registrarMovimientoInventario({
                    productoId: det.producto_id, sucursalId: trans.sucursal_origen_id, tipo: 'ANULACION_TRASLADO',
                    cantidad: Number(det.cantidad), referenciaId: id, usuario: auditoriaUsuario
                });

                // Descontar stock en destino (se retira la mercancia que entro a destino)
                await runQuery(
                    `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                     VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                     ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                        stock = stock - excluded.stock,
                        sync_status = 'pending'`,
                    [det.producto_id, trans.sucursal_destino_id, det.cantidad]
                );
                await registrarMovimientoInventario({
                    productoId: det.producto_id, sucursalId: trans.sucursal_destino_id, tipo: 'ANULACION_TRASLADO',
                    cantidad: -Number(det.cantidad), referenciaId: id, usuario: auditoriaUsuario
                });
            }

            // 4. Marcar la transferencia como eliminada para la sincronización
            await runQuery(`UPDATE transferencias SET sync_status = 'deleted' WHERE id = ?`, [id]);

            // 5. Registrar en logs de auditoría
            await registrarAuditoria(
                auditoriaUsuario,
                auditoriaRol,
                trans.sucursal_origen_id,
                'Eliminación de Transferencia',
                `Transferencia ${id} anulada (Revertido de sucursal destino ${trans.sucursal_destino_id} a origen ${trans.sucursal_origen_id}).`
            );

            await runQuery("COMMIT", []);
            return { success: true, message: 'Transferencia eliminada y stock revertido con éxito.' };
        } catch (err) {
            await runQuery("ROLLBACK", []).catch(() => {});
            return { success: false, message: 'Error al eliminar transferencia: ' + err.message };
        }
    });
}

module.exports = { registerTransferenciasIpc };
