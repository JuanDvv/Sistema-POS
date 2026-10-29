const { ipcMain, BrowserWindow } = require('electron');
const {
    verificarActualizaciones,
    aplicarActualizacion,
    obtenerEstadoActualizacion,
    registrarListenerEstado
} = require('../services/updaterService');

// SRP: Gestión exclusiva de canales IPC para el ciclo de vida de actualizaciones automáticas

function registerUpdaterIpc() {
    ipcMain.handle('verificar-actualizacion', async () => {
        return await verificarActualizaciones();
    });

    ipcMain.handle('aplicar-actualizacion', async () => {
        return aplicarActualizacion();
    });

    ipcMain.handle('obtener-estado-actualizacion', async () => {
        return obtenerEstadoActualizacion();
    });

    // Reenviar cualquier cambio de estado del servicio a todas las ventanas abiertas
    registrarListenerEstado((estado) => {
        const ventanas = BrowserWindow.getAllWindows();
        for (const win of ventanas) {
            if (!win.isDestroyed()) {
                win.webContents.send('estado-actualizacion-cambio', estado);
            }
        }
    });
}

module.exports = { registerUpdaterIpc };

