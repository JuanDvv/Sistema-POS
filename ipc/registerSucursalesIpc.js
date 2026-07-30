const { ipcMain } = require('electron');
const { db, runQuery, allQuery } = require('../db/connection');
const { supabase } = require('../sync/supabaseClients');
const { solicitarSincronizacion } = require('../sync/syncService');
const { registrarAuditoria } = require('../services/auditService');

// Filtro reutilizado en todos los listados: una sucursal marcada para soft-delete
// (sync_status = 'deleted') sigue existiendo localmente hasta que el ciclo de sync
// confirme el borrado con la nube (ver eliminar-sucursal más abajo), pero no debe
// aparecer como opción disponible mientras tanto.
const FILTRO_NO_ELIMINADA = `(sync_status IS NULL OR sync_status <> 'deleted')`;

// SRP: configuración y activación de sucursales.

function registerSucursalesIpc() {
    // Obtener todas las sucursales disponibles en la BD
    ipcMain.handle('obtener-sucursales-disponibles', async () => {
        try {
            const rows = await allQuery(
                `SELECT DISTINCT sucursal_id as id FROM inventario_sucursal
                 WHERE sucursal_id IN (SELECT id FROM config_sucursal WHERE ${FILTRO_NO_ELIMINADA})
                 UNION
                 SELECT id FROM config_sucursal WHERE ${FILTRO_NO_ELIMINADA}`,
                []
            );
            const ids = rows.map(r => r.id).filter(Boolean);
            return { success: true, data: [...new Set(ids)] };
        } catch (err) {
            return { success: false, message: 'Error al obtener sucursales: ' + err.message };
        }
    });

    // Obtener ID actual de la sucursal activa en este equipo
    ipcMain.handle('obtener-sucursal-id', async () => {
        try {
            const row = await new Promise((resolve, reject) => {
                db.get(`SELECT id FROM config_sucursal WHERE activa = 1 LIMIT 1`, [], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            if (row) return { success: true, id: row.id };

            // Fallback a cualquier sucursal si ninguna está activa
            const fallback = await new Promise((resolve) => {
                db.get(`SELECT id FROM config_sucursal WHERE ${FILTRO_NO_ELIMINADA} LIMIT 1`, [], (err, row) => {
                    resolve(row);
                });
            });
            return { success: true, id: fallback ? fallback.id : 'sucursal-norte' };
        } catch (err) {
            return { success: true, id: 'sucursal-norte' };
        }
    });

    // Obtener todas las sucursales
    ipcMain.handle('obtener-todas-sucursales', async () => {
        try {
            const rows = await allQuery(`SELECT * FROM config_sucursal WHERE ${FILTRO_NO_ELIMINADA}`, []);
            return { success: true, data: rows };
        } catch (err) {
            return { success: false, message: 'Error al obtener sucursales: ' + err.message };
        }
    });

    // Activar una sucursal para este PC
    ipcMain.handle('activar-sucursal', async (event, datos) => {
        const { id, auditoriaUsuario, auditoriaRol } = datos;
        try {
            await runQuery("BEGIN TRANSACTION", []);
            await runQuery(`UPDATE config_sucursal SET activa = 0`, []);
            await runQuery(`UPDATE config_sucursal SET activa = 1 WHERE id = ?`, [id]);
            await runQuery("COMMIT", []);
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, id, 'Activar Sucursal (Terminal)', `Sucursal ID: ${id}`);
            return { success: true, message: 'Sucursal activada en este PC exitosamente.' };
        } catch (err) {
            await runQuery("ROLLBACK", []).catch(() => { });
            return { success: false, message: 'Error al activar sucursal: ' + err.message };
        }
    });

    // Obtener información de una sucursal específica
    ipcMain.handle('obtener-sucursal', async (event, id) => {
        try {
            const row = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM config_sucursal WHERE id = ?`, [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            return { success: true, data: row };
        } catch (err) {
            return { success: false, message: 'Error al obtener sucursal: ' + err.message };
        }
    });

    // Guardar/Crear información de la sucursal (Soporta modificación de ID)
    ipcMain.handle('guardar-sucursal', async (event, datos) => {
        const { oldId, newId, nombre, direccion, telefono, auditoriaUsuario, auditoriaRol } = datos;
        const ahora = new Date().toISOString();
        try {
            await runQuery("BEGIN TRANSACTION", []);

            if (oldId && oldId !== newId) {
                // Registrar nueva sucursal copiando el estado 'activa' de la anterior
                await runQuery(
                    `INSERT INTO config_sucursal (id, nombre, direccion, telefono, activa, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, (SELECT activa FROM config_sucursal WHERE id = ?), 'pending', ?)`,
                    [newId, nombre, direccion, telefono, oldId, ahora]
                );
                // Eliminar anterior
                await runQuery(`DELETE FROM config_sucursal WHERE id = ?`, [oldId]);
                // Actualizar referencias en cascada local (inventario_sucursal sustituye a productos)
                await runQuery(`UPDATE inventario_sucursal SET sucursal_id = ?, sync_status = 'pending' WHERE sucursal_id = ?`, [newId, oldId]);
                await runQuery(`UPDATE ventas SET sucursal_id = ?, sync_status = 'pending' WHERE sucursal_id = ?`, [newId, oldId]);
                await runQuery(`UPDATE gastos SET sucursal_id = ?, sync_status = 'pending' WHERE sucursal_id = ?`, [newId, oldId]);
            } else {
                // Si es nueva sucursal, se crea por defecto como inactiva (activa = 0)
                await runQuery(
                    `INSERT INTO config_sucursal (id, nombre, direccion, telefono, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, 'pending', ?)
                     ON CONFLICT(id) DO UPDATE SET
                        nombre = excluded.nombre,
                        direccion = excluded.direccion,
                        telefono = excluded.telefono,
                        sync_status = 'pending',
                        updated_at = excluded.updated_at`,
                    [newId, nombre, direccion, telefono, ahora]
                );
            }
            await runQuery("COMMIT", []);

            const accionAuditoria = !oldId ? 'Crear Sucursal' : (oldId !== newId ? 'Editar Sucursal (Cambio de ID)' : 'Editar Sucursal');
            const detalleAuditoria = oldId && oldId !== newId
                ? `ID: ${oldId} -> ${newId} - Nombre: ${nombre}`
                : `ID: ${newId} - Nombre: ${nombre}`;
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, newId, accionAuditoria, detalleAuditoria);

            // Intentar sincronizar con Supabase de inmediato, además del ciclo de sync en segundo
            // plano, para que un error de red/RLS se pueda avisar ya mismo en vez de perderse.
            let avisoSync = '';
            try {
                if (oldId && oldId !== newId) {
                    const { error: errorDelete } = await supabase.from('config_sucursal').delete().eq('id', oldId);
                    if (errorDelete) throw errorDelete;
                }
                const { data: filasActualizadas, error: errorUpsert } = await supabase
                    .from('config_sucursal')
                    .upsert({ id: newId, nombre, direccion, telefono, updated_at: ahora })
                    .select('id');
                if (errorUpsert) throw errorUpsert;
                if (!filasActualizadas || filasActualizadas.length === 0) {
                    throw new Error('la nube rechazó el cambio (posible política de seguridad/RLS)');
                }
                await runQuery(`UPDATE config_sucursal SET sync_status = 'synced' WHERE id = ?`, [newId]);
            } catch (errSync) {
                avisoSync = ` ⚠️ No se pudo sincronizar con la nube (${errSync.message}). Se reintentará automáticamente.`;
                solicitarSincronizacion('reintento tras fallo al guardar sucursal');
            }

            return { success: true, message: 'Información de la sucursal guardada exitosamente.' + avisoSync };
        } catch (err) {
            await runQuery("ROLLBACK", []).catch(() => { });
            return { success: false, message: 'Error al guardar sucursal: ' + err.message };
        }
    });

    // Eliminar sucursal
    ipcMain.handle('eliminar-sucursal', async (event, datos) => {
        const { id, auditoriaUsuario, auditoriaRol } = datos;
        try {
            const row = await new Promise((resolve) => {
                db.get(`SELECT activa FROM config_sucursal WHERE id = ?`, [id], (err, row) => {
                    resolve(row);
                });
            });
            if (row && row.activa === 1) {
                return { success: false, code: 'SUCURSAL_ACTIVA', message: 'No se puede eliminar la sucursal activa en este terminal. Primero activa otra sucursal.' };
            }

            const inventario = await new Promise((resolve, reject) => {
                db.get(`SELECT COALESCE(SUM(stock), 0) as stockTotal FROM inventario_sucursal WHERE sucursal_id = ?`, [id], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });
            if (inventario && inventario.stockTotal > 0) {
                return {
                    success: false,
                    code: 'STOCK_PENDIENTE',
                    stockTotal: inventario.stockTotal,
                    message: `No se puede eliminar: la sucursal todavía tiene ${inventario.stockTotal} unidades en inventario. Transfiere o descarga el stock primero.`
                };
            }

            const pedidoPendiente = await new Promise((resolve, reject) => {
                db.get(`SELECT COUNT(*) as n FROM pedidos WHERE sucursal_id = ? AND estado = 'pendiente'`, [id], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });
            if (pedidoPendiente && pedidoPendiente.n > 0) {
                return { success: false, code: 'PEDIDOS_PENDIENTES', message: `No se puede eliminar: la sucursal tiene ${pedidoPendiente.n} pedido(s)/apartado(s) pendiente(s) de entrega.` };
            }

            // Soft delete (igual que categorías/productos/clientes): se marca la fila para que el
            // ciclo de sincronización propague el deleted_at a Supabase antes de borrarla físico
            // en local. Un DELETE directo aquí nunca llegaba a la nube (ver syncSucursales, que
            // solo sube filas con sync_status = 'pending').
            await runQuery(`UPDATE config_sucursal SET sync_status = 'deleted' WHERE id = ?`, [id]);
            // El inventario en 0 que quedó de esta sucursal ya no tiene utilidad y ensucia los
            // selectores de "sucursales disponibles" (que también miran inventario_sucursal); se
            // limpia porque la validación de arriba garantiza que no representa stock real.
            await runQuery(`DELETE FROM inventario_sucursal WHERE sucursal_id = ? AND stock = 0`, [id]);

            await registrarAuditoria(auditoriaUsuario, auditoriaRol, id, 'Eliminar Sucursal', `Sucursal ID: ${id}`);
            solicitarSincronizacion('sucursal eliminada');
            return { success: true, message: 'Sucursal eliminada exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al eliminar sucursal: ' + err.message };
        }
    });
}

module.exports = { registerSucursalesIpc };
