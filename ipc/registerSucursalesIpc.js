const { ipcMain } = require('electron');
const { db, runQuery, allQuery } = require('../db/connection');
const { supabase } = require('../sync/supabaseClients');
const { solicitarSincronizacion } = require('../sync/syncService');

// SRP: configuración y activación de sucursales.

function registerSucursalesIpc() {
    // Obtener todas las sucursales disponibles en la BD
    ipcMain.handle('obtener-sucursales-disponibles', async () => {
        try {
            const rows = await allQuery(
                `SELECT DISTINCT sucursal_id as id FROM inventario_sucursal
                 UNION
                 SELECT id FROM config_sucursal`,
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
                db.get(`SELECT id FROM config_sucursal LIMIT 1`, [], (err, row) => {
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
            const rows = await allQuery(`SELECT * FROM config_sucursal`, []);
            return { success: true, data: rows };
        } catch (err) {
            return { success: false, message: 'Error al obtener sucursales: ' + err.message };
        }
    });

    // Activar una sucursal para este PC
    ipcMain.handle('activar-sucursal', async (event, id) => {
        try {
            await runQuery("BEGIN TRANSACTION", []);
            await runQuery(`UPDATE config_sucursal SET activa = 0`, []);
            await runQuery(`UPDATE config_sucursal SET activa = 1 WHERE id = ?`, [id]);
            await runQuery("COMMIT", []);
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
        const { oldId, newId, nombre, direccion, telefono } = datos;
        try {
            await runQuery("BEGIN TRANSACTION", []);

            if (oldId && oldId !== newId) {
                // Registrar nueva sucursal copiando el estado 'activa' de la anterior
                await runQuery(
                    `INSERT INTO config_sucursal (id, nombre, direccion, telefono, activa, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, (SELECT activa FROM config_sucursal WHERE id = ?), 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                    [newId, nombre, direccion, telefono, oldId]
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
                     VALUES (?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                     ON CONFLICT(id) DO UPDATE SET
                        nombre = excluded.nombre,
                        direccion = excluded.direccion,
                        telefono = excluded.telefono,
                        sync_status = 'pending'`,
                    [newId, nombre, direccion, telefono]
                );
            }
            await runQuery("COMMIT", []);

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
                    .upsert({ id: newId, nombre, direccion, telefono })
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
    ipcMain.handle('eliminar-sucursal', async (event, id) => {
        try {
            const row = await new Promise((resolve) => {
                db.get(`SELECT activa FROM config_sucursal WHERE id = ?`, [id], (err, row) => {
                    resolve(row);
                });
            });
            if (row && row.activa === 1) {
                return { success: false, message: 'No se puede eliminar la sucursal activa en este terminal. Primero activa otra sucursal.' };
            }
            await runQuery(`DELETE FROM config_sucursal WHERE id = ?`, [id]);
            return { success: true, message: 'Sucursal eliminada exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al eliminar sucursal: ' + err.message };
        }
    });
}

module.exports = { registerSucursalesIpc };
