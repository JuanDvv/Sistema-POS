const { ipcMain } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { db, runQuery, allQuery } = require('../db/connection');
const { registrarAuditoria } = require('../services/auditService');

// SRP: autenticación y administración de cuentas de usuario.

function registerUsuariosIpc() {
    // Login
    ipcMain.handle('login', async (event, credentials) => {
        return new Promise((resolve) => {
            db.get(`SELECT * FROM usuarios WHERE username = ? AND password = ?`,
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
            const rows = await allQuery(`SELECT id, username, password, rol FROM usuarios`, []);
            return { success: true, data: rows };
        } catch (err) {
            return { success: false, message: 'Error al obtener usuarios: ' + err.message };
        }
    });

    // Guardar usuario (Crear o editar)
    ipcMain.handle('guardar-usuario', async (event, datos) => {
        const { id, username, password, rol } = datos;
        try {
            if (id) {
                // Edición
                await runQuery(
                    `UPDATE usuarios SET username = ?, password = ?, rol = ?, sync_status = 'pending' WHERE id = ?`,
                    [username, password, rol, id]
                );
                return { success: true, message: 'Usuario modificado exitosamente.' };
            } else {
                // Creación
                const nuevoId = uuidv4();
                await runQuery(
                    `INSERT INTO usuarios (id, username, password, rol, sync_status, updated_at) VALUES (?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                    [nuevoId, username, password, rol]
                );
                return { success: true, message: 'Usuario registrado exitosamente.' };
            }
        } catch (err) {
            return { success: false, message: 'Error al guardar usuario: ' + err.message };
        }
    });

    // Eliminar usuario
    ipcMain.handle('eliminar-usuario', async (event, id) => {
        try {
            await runQuery(`DELETE FROM usuarios WHERE id = ?`, [id]);
            return { success: true, message: 'Usuario eliminado exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al eliminar usuario: ' + err.message };
        }
    });
}

module.exports = { registerUsuariosIpc };
