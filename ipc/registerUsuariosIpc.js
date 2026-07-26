const { ipcMain } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { db, runQuery, allQuery } = require('../db/connection');
const { registrarAuditoria } = require('../services/auditService');

// SRP: autenticación y administración de cuentas de usuario.

function registerUsuariosIpc() {
    // Login
    ipcMain.handle('login', async (event, credentials) => {
        return new Promise((resolve) => {
            db.get(`SELECT * FROM usuarios WHERE username = ? AND password = ? AND (sync_status IS NULL OR sync_status <> 'deleted')`,
                [credentials.username, credentials.password], async (err, row) => {
                    if (err) resolve({ success: false, message: 'Error de base de datos' });
                    else if (row) {
                        // Registrar inicio de sesión en auditoría
                        // Dado que el login no sabe la sucursal de inmediato, obtenemos la sucursal activa local
                        db.get(`SELECT id FROM config_sucursal WHERE activa = 1 LIMIT 1`, [], async (errSuc, rowSuc) => {
                            const sucId = rowSuc ? rowSuc.id : 'Desconocida';
                            await registrarAuditoria(row.username, row.rol, sucId, 'Inicio Sesión', 'Acceso al sistema');
                            resolve({ success: true, username: row.username, role: row.rol });
                        });
                    }
                    else resolve({ success: false, message: 'Credenciales incorrectas' });
                });
        });
    });

    // Obtener usuarios
    ipcMain.handle('obtener-usuarios', async () => {
        try {
            const rows = await allQuery(`SELECT id, username, password, rol FROM usuarios WHERE sync_status IS NULL OR sync_status <> 'deleted'`, []);
            return { success: true, data: rows };
        } catch (err) {
            return { success: false, message: 'Error al obtener usuarios: ' + err.message };
        }
    });

    // Guardar usuario (Crear o editar)
    ipcMain.handle('guardar-usuario', async (event, datos) => {
        const { id, username, password, rol, auditoriaUsuario, auditoriaRol } = datos;
        try {
            if (id) {
                // Edición
                await runQuery(
                    `UPDATE usuarios SET username = ?, password = ?, rol = ?, sync_status = 'pending' WHERE id = ?`,
                    [username, password, rol, id]
                );
                await registrarAuditoria(auditoriaUsuario, auditoriaRol, 'Administración', 'Editar Usuario', `Usuario: ${username} - Rol: ${rol}`);
                return { success: true, message: 'Usuario modificado exitosamente.' };
            } else {
                // Creación
                const nuevoId = uuidv4();
                await runQuery(
                    `INSERT INTO usuarios (id, username, password, rol, sync_status, updated_at) VALUES (?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                    [nuevoId, username, password, rol]
                );
                await registrarAuditoria(auditoriaUsuario, auditoriaRol, 'Administración', 'Crear Usuario', `Usuario: ${username} - Rol: ${rol}`);
                return { success: true, message: 'Usuario registrado exitosamente.' };
            }
        } catch (err) {
            return { success: false, message: 'Error al guardar usuario: ' + err.message };
        }
    });

    // Eliminar usuario: soft delete (igual que productos/categorías) para que la baja se
    // propague a Supabase y a las demás terminales en el próximo ciclo de sincronización.
    // 'u-admin-default' es el seed local de emergencia (nunca se sube a la nube), así que a
    // ese sí se le aplica un DELETE físico de una vez.
    ipcMain.handle('eliminar-usuario', async (event, datos) => {
        const { id, username, auditoriaUsuario, auditoriaRol } = datos;
        try {
            if (id === 'u-admin-default') {
                await runQuery(`DELETE FROM usuarios WHERE id = ?`, [id]);
            } else {
                await runQuery(`UPDATE usuarios SET sync_status = 'deleted' WHERE id = ?`, [id]);
            }
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, 'Administración', 'Eliminar Usuario', `Usuario: ${username} - ID: ${id}`);
            return { success: true, message: 'Usuario eliminado exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al eliminar usuario: ' + err.message };
        }
    });
}

module.exports = { registerUsuariosIpc };
