const { ipcMain } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { db, runQuery, allQuery } = require('../db/connection');
const { registrarAuditoria } = require('../services/auditService');
const { registrarMovimientoInventario } = require('../services/inventarioMovimientoService');
const { solicitarSincronizacion } = require('../sync/syncService');
const { notificarInventarioActualizado } = require('../services/gastoService');

// SRP: traslados de inventario entre sucursales.

function registerTransferenciasIpc() {
    // Módulo de Transferencias de Inventario
    ipcMain.handle('realizar-transferencia', async (event, datosTransferencia) => {
        const { sucursalOrigenId, sucursalDestinoId, productos, usuario, rol } = datosTransferencia;
        const transferenciaId = 't-' + uuidv4().substring(0, 8);
        const fechaActual = new Date().toISOString();

        try {
            // Validar que la transferencia solo se realice desde la sucursal activa emisora
            const sucursalActiva = await new Promise((resolve) => {
                db.get(`SELECT id FROM config_sucursal WHERE activa = 1 LIMIT 1`, [], (err, row) => resolve(row));
            });
            if (sucursalActiva && sucursalOrigenId !== sucursalActiva.id && rol !== 'Administrador') {
                return { success: false, message: `Las transferencias solo pueden ser realizadas desde la sucursal activa (${sucursalActiva.id}).` };
            }

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
                    db.get(`SELECT stock, stock_reservado FROM inventario_sucursal WHERE producto_id = ? AND sucursal_id = ?`, [item.id, sucursalOrigenId], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });
                const disponibleOrigen = stockOrigen ? (Number(stockOrigen.stock) - Number(stockOrigen.stock_reservado || 0)) : 0;
                if (Number(item.cantidad) > disponibleOrigen) {
                    throw new Error(`Stock disponible insuficiente de "${item.nombre || item.id}" en origen. Físico: ${stockOrigen ? stockOrigen.stock : 0}, Reservado: ${stockOrigen ? (stockOrigen.stock_reservado || 0) : 0}, Solicitado: ${item.cantidad}.`);
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
            notificarInventarioActualizado();
            solicitarSincronizacion('transferencia registrada');
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

            // Validar que solo la sucursal que envía la transferencia pueda anularla
            const sucursalActiva = await new Promise((resolve) => {
                db.get(`SELECT id FROM config_sucursal WHERE activa = 1 LIMIT 1`, [], (err, row) => resolve(row));
            });
            if (sucursalActiva && trans.sucursal_origen_id !== sucursalActiva.id && auditoriaRol !== 'Administrador') {
                throw new Error(`Solo la sucursal que envía la transferencia (${trans.sucursal_origen_id}) puede anularla.`);
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
                    productoId: det.producto_id, sucursalId: trans.sucursal_origen_id, tipo: 'ANULACION_TRASLADO_ENTRADA',
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
                    productoId: det.producto_id, sucursalId: trans.sucursal_destino_id, tipo: 'ANULACION_TRASLADO_SALIDA',
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
            notificarInventarioActualizado();
            solicitarSincronizacion('transferencia eliminada');
            return { success: true, message: 'Transferencia eliminada y stock revertido con éxito.' };
        } catch (err) {
            await runQuery("ROLLBACK", []).catch(() => {});
            return { success: false, message: 'Error al eliminar transferencia: ' + err.message };
        }
    });

    // Obtener datos y detalles de una transferencia
    ipcMain.handle('obtener-transferencia', async (event, id) => {
        try {
            const trans = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM transferencias WHERE id = ?`, [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            if (!trans) {
                return { success: false, message: 'La transferencia no existe.' };
            }

            const items = await allQuery(
                `SELECT dt.id, dt.producto_id, dt.cantidad, p.nombre, p.precio, COALESCE(inv.stock, 0) AS stock
                 FROM detalle_transferencias dt
                 JOIN productos p ON dt.producto_id = p.id
                 LEFT JOIN inventario_sucursal inv ON inv.producto_id = p.id AND inv.sucursal_id = ?
                 WHERE dt.transferencia_id = ?`,
                [trans.sucursal_origen_id, id]
            );

            return { success: true, data: { ...trans, items } };
        } catch (err) {
            return { success: false, message: 'Error al obtener transferencia: ' + err.message };
        }
    });

    // Editar transferencia (Ajustar diferencias de stock y detalles)
    ipcMain.handle('editar-transferencia', async (event, { id, sucursalDestinoId, productos, auditoriaUsuario, auditoriaRol }) => {
        try {
            if (!Array.isArray(productos) || productos.length === 0) {
                return { success: false, message: 'La transferencia debe contener al menos un producto.' };
            }

            for (const item of productos) {
                if (!item.cantidad || Number(item.cantidad) <= 0) {
                    return { success: false, message: 'Todas las cantidades deben ser mayores a cero.' };
                }
            }

            await runQuery("BEGIN TRANSACTION", []);

            // 1. Obtener la transferencia original
            const trans = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM transferencias WHERE id = ?`, [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!trans) {
                throw new Error("La transferencia no existe.");
            }
            if (trans.sync_status === 'deleted') {
                throw new Error("No se puede editar una transferencia que ya ha sido anulada.");
            }

            // Validar que solo la sucursal que envía la transferencia pueda editarla
            const sucursalActiva = await new Promise((resolve) => {
                db.get(`SELECT id FROM config_sucursal WHERE activa = 1 LIMIT 1`, [], (err, row) => resolve(row));
            });
            if (sucursalActiva && trans.sucursal_origen_id !== sucursalActiva.id && auditoriaRol !== 'Administrador') {
                throw new Error(`Solo la sucursal que envía la transferencia (${trans.sucursal_origen_id}) puede editarla.`);
            }

            const sucursalOrigenId = trans.sucursal_origen_id;
            const oldDestinoId = trans.sucursal_destino_id;
            const newDestinoId = sucursalDestinoId || oldDestinoId;

            if (newDestinoId === sucursalOrigenId) {
                throw new Error("La sucursal de destino no puede ser la misma que la de origen.");
            }

            // 2. Obtener detalles originales
            const detallesOriginales = await allQuery(`SELECT * FROM detalle_transferencias WHERE transferencia_id = ?`, [id]);
            const oldMap = new Map();
            detallesOriginales.forEach(d => oldMap.set(d.producto_id, { id: d.id, cantidad: Number(d.cantidad) }));

            const newMap = new Map();
            productos.forEach(p => newMap.set(p.id || p.producto_id, { cantidad: Number(p.cantidad), nombre: p.nombre }));

            // 3. Validación y ajuste de inventario
            if (oldDestinoId === newDestinoId) {
                // Mismo destino: calcular delta neto por producto
                const allProdIds = new Set([...oldMap.keys(), ...newMap.keys()]);

                // Fase de validación
                for (const prodId of allProdIds) {
                    const oldQty = oldMap.has(prodId) ? oldMap.get(prodId).cantidad : 0;
                    const newQty = newMap.has(prodId) ? newMap.get(prodId).cantidad : 0;
                    const delta = newQty - oldQty;

                    if (delta > 0) {
                        const stockRow = await new Promise((resolve, reject) => {
                            db.get(`SELECT stock, stock_reservado FROM inventario_sucursal WHERE producto_id = ? AND sucursal_id = ?`, [prodId, sucursalOrigenId], (err, row) => {
                                if (err) reject(err); else resolve(row);
                            });
                        });
                        const dispOrigen = stockRow ? (Number(stockRow.stock) - Number(stockRow.stock_reservado || 0)) : 0;
                        if (dispOrigen < delta) {
                            const prodName = newMap.get(prodId)?.nombre || prodId;
                            throw new Error(`Stock disponible insuficiente de "${prodName}" en origen para incrementar el traslado. Físico: ${stockRow ? stockRow.stock : 0}, Reservado: ${stockRow ? (stockRow.stock_reservado || 0) : 0}, adicional requerido: ${delta}.`);
                        }
                    } else if (delta < 0) {
                        const absDelta = Math.abs(delta);
                        const stockRow = await new Promise((resolve, reject) => {
                            db.get(`SELECT stock FROM inventario_sucursal WHERE producto_id = ? AND sucursal_id = ?`, [prodId, oldDestinoId], (err, row) => {
                                if (err) reject(err); else resolve(row);
                            });
                        });
                        const dispDestino = stockRow ? Number(stockRow.stock) : 0;
                        if (dispDestino < absDelta) {
                            const prod = await new Promise(res => db.get(`SELECT nombre FROM productos WHERE id = ?`, [prodId], (e, r) => res(r)));
                            const prodName = prod ? prod.nombre : prodId;
                            throw new Error(`La sucursal de destino (${oldDestinoId}) no tiene suficiente stock de "${prodName}" para devolver (Stock actual: ${dispDestino}, requerido: ${absDelta}).`);
                        }
                    }
                }

                // Fase de aplicación de movimientos
                for (const prodId of allProdIds) {
                    const oldQty = oldMap.has(prodId) ? oldMap.get(prodId).cantidad : 0;
                    const newQty = newMap.has(prodId) ? newMap.get(prodId).cantidad : 0;
                    const delta = newQty - oldQty;

                    if (delta > 0) {
                        await runQuery(
                            `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                             VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                             ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                                stock = stock - excluded.stock,
                                sync_status = 'pending'`,
                            [prodId, sucursalOrigenId, delta]
                        );
                        await registrarMovimientoInventario({
                            productoId: prodId, sucursalId: sucursalOrigenId, tipo: 'TRASLADO_SALIDA',
                            cantidad: -Number(delta), referenciaId: id, usuario: auditoriaUsuario
                        });

                        await runQuery(
                            `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                             VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                             ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                                stock = stock + excluded.stock,
                                sync_status = 'pending'`,
                            [prodId, oldDestinoId, delta]
                        );
                        await registrarMovimientoInventario({
                            productoId: prodId, sucursalId: oldDestinoId, tipo: 'TRASLADO_ENTRADA',
                            cantidad: Number(delta), referenciaId: id, usuario: auditoriaUsuario
                        });
                    } else if (delta < 0) {
                        const absDelta = Math.abs(delta);
                        await runQuery(
                            `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                             VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                             ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                                stock = stock + excluded.stock,
                                sync_status = 'pending'`,
                            [prodId, sucursalOrigenId, absDelta]
                        );
                        await registrarMovimientoInventario({
                            productoId: prodId, sucursalId: sucursalOrigenId, tipo: 'ANULACION_TRASLADO_ENTRADA',
                            cantidad: Number(absDelta), referenciaId: id, usuario: auditoriaUsuario
                        });

                        await runQuery(
                            `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                             VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                             ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                                stock = stock - excluded.stock,
                                sync_status = 'pending'`,
                            [prodId, oldDestinoId, absDelta]
                        );
                        await registrarMovimientoInventario({
                            productoId: prodId, sucursalId: oldDestinoId, tipo: 'ANULACION_TRASLADO_SALIDA',
                            cantidad: -Number(absDelta), referenciaId: id, usuario: auditoriaUsuario
                        });
                    }
                }
            } else {
                // Cambio de destino: validar y devolver todo de destino previo y enviar al nuevo destino
                for (const det of detallesOriginales) {
                    const stockRow = await new Promise((resolve, reject) => {
                        db.get(`SELECT stock FROM inventario_sucursal WHERE producto_id = ? AND sucursal_id = ?`, [det.producto_id, oldDestinoId], (err, row) => {
                            if (err) reject(err); else resolve(row);
                        });
                    });
                    const dispDestino = stockRow ? Number(stockRow.stock) : 0;
                    if (dispDestino < det.cantidad) {
                        const prod = await new Promise(res => db.get(`SELECT nombre FROM productos WHERE id = ?`, [det.producto_id], (e, r) => res(r)));
                        const prodName = prod ? prod.nombre : det.producto_id;
                        throw new Error(`La sucursal anterior (${oldDestinoId}) no tiene stock suficiente de "${prodName}" para devolver (Stock: ${dispDestino}, requerido: ${det.cantidad}).`);
                    }
                }

                for (const item of productos) {
                    const pId = item.id || item.producto_id;
                    const stockRow = await new Promise((resolve, reject) => {
                        db.get(`SELECT stock, stock_reservado FROM inventario_sucursal WHERE producto_id = ? AND sucursal_id = ?`, [pId, sucursalOrigenId], (err, row) => {
                            if (err) reject(err); else resolve(row);
                        });
                    });
                    const dispOrigen = stockRow ? (Number(stockRow.stock) - Number(stockRow.stock_reservado || 0)) : 0;
                    const oldDevuelto = oldMap.has(pId) ? oldMap.get(pId).cantidad : 0;
                    if ((dispOrigen + oldDevuelto) < Number(item.cantidad)) {
                        throw new Error(`Stock disponible insuficiente de "${item.nombre || pId}" en origen. Físico: ${stockRow ? stockRow.stock : 0}, Reservado: ${stockRow ? (stockRow.stock_reservado || 0) : 0}, Disponible neto con devolución previa: ${dispOrigen + oldDevuelto}, requerido: ${item.cantidad}.`);
                    }
                }

                for (const det of detallesOriginales) {
                    await runQuery(
                        `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                         VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                         ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                            stock = stock + excluded.stock,
                            sync_status = 'pending'`,
                        [det.producto_id, sucursalOrigenId, det.cantidad]
                    );
                    await registrarMovimientoInventario({
                        productoId: det.producto_id, sucursalId: sucursalOrigenId, tipo: 'ANULACION_TRASLADO_ENTRADA',
                        cantidad: Number(det.cantidad), referenciaId: id, usuario: auditoriaUsuario
                    });

                    await runQuery(
                        `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                         VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                         ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                            stock = stock - excluded.stock,
                            sync_status = 'pending'`,
                        [det.producto_id, oldDestinoId, det.cantidad]
                    );
                    await registrarMovimientoInventario({
                        productoId: det.producto_id, sucursalId: oldDestinoId, tipo: 'ANULACION_TRASLADO_SALIDA',
                        cantidad: -Number(det.cantidad), referenciaId: id, usuario: auditoriaUsuario
                    });
                }

                for (const item of productos) {
                    const pId = item.id || item.producto_id;
                    await runQuery(
                        `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                         VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                         ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                            stock = stock - excluded.stock,
                            sync_status = 'pending'`,
                        [pId, sucursalOrigenId, item.cantidad]
                    );
                    await registrarMovimientoInventario({
                        productoId: pId, sucursalId: sucursalOrigenId, tipo: 'TRASLADO_SALIDA',
                        cantidad: -Number(item.cantidad), referenciaId: id, usuario: auditoriaUsuario
                    });

                    await runQuery(
                        `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                         VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                         ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                            stock = stock + excluded.stock,
                            sync_status = 'pending'`,
                        [pId, newDestinoId, item.cantidad]
                    );
                    await registrarMovimientoInventario({
                        productoId: pId, sucursalId: newDestinoId, tipo: 'TRASLADO_ENTRADA',
                        cantidad: Number(item.cantidad), referenciaId: id, usuario: auditoriaUsuario
                    });
                }
            }

            // 4. Actualizar cabecera
            await runQuery(
                `UPDATE transferencias
                 SET sucursal_destino_id = ?, sync_status = 'pending', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
                 WHERE id = ?`,
                [newDestinoId, id]
            );

            // 5. Reemplazar líneas de detalle conservando IDs si coinciden
            await runQuery(`DELETE FROM detalle_transferencias WHERE transferencia_id = ?`, [id]);
            for (const item of productos) {
                const pId = item.id || item.producto_id;
                const existing = oldMap.get(pId);
                const detId = existing ? existing.id : ('dt-' + uuidv4().substring(0, 8));
                await runQuery(
                    `INSERT INTO detalle_transferencias (id, transferencia_id, producto_id, cantidad, updated_at)
                     VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                    [detId, id, pId, item.cantidad]
                );
            }

            // 6. Auditoría
            const prodsResumen = productos.map(i => `${i.nombre || i.id} (x${i.cantidad})`).join(', ');
            await registrarAuditoria(
                auditoriaUsuario,
                auditoriaRol,
                sucursalOrigenId,
                'Edición de Transferencia',
                `Transferencia ${id} modificada. Destino: ${newDestinoId}. Items: [${prodsResumen}]`
            );

            await runQuery("COMMIT", []);
            notificarInventarioActualizado();
            solicitarSincronizacion('transferencia editada');
            return { success: true, message: '¡Transferencia actualizada con éxito!' };
        } catch (error) {
            await runQuery("ROLLBACK", []).catch(() => {});
            return { success: false, message: 'Error al editar transferencia: ' + error.message };
        }
    });
}

module.exports = { registerTransferenciasIpc };
