const { ipcMain, BrowserWindow, screen } = require('electron');
const path = require('path');
const { procesarSincronizacion, isSincronizando } = require('../sync/syncService');

// SRP: utilidades transversales de la app (ventanas secundarias, foco, sincronización manual).

function registerSistemaIpc() {
    let ventanasVentas = [];

    // Abrir ventana de ventas secundaria
    ipcMain.handle('abrir-ventana-ventas', async (event) => {
        if (ventanasVentas.length >= 3) {
            return { success: false, message: 'Límite de 3 ventanas secundarias de ventas alcanzado.' };
        }

        const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
        const minWidth = Math.round(screenWidth * 0.5);

        const win = new BrowserWindow({
            width: 1100,
            height: 750,
            minWidth: minWidth,
            minHeight: 600,
            icon: path.join(__dirname, '..', 'build/icon.png'),
            webPreferences: {
                preload: path.join(__dirname, '..', 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false
            }
        });

        win.loadFile('ventas.html', { query: { nueva_ventana: 'true' } });
        ventanasVentas.push(win);

        win.on('closed', () => {
            ventanasVentas = ventanasVentas.filter(w => w !== win);
        });

        return { success: true };
    });

    // Forzar re-enfoque de la ventana para corregir bug de entrada de texto en Electron
    ipcMain.handle('force-refocus', async (event) => {
        try {
            const win = BrowserWindow.fromWebContents(event.sender);
            if (win) {
                win.blur();
                win.focus();
            }
            return { success: true };
        } catch (err) {
            return { success: false };
        }
    });

    // Consultar si hay una sincronización en curso (ej. al montar el sidebar)
    ipcMain.handle('is-sincronizando', async () => {
        return isSincronizando();
    });

    // Forzar Sincronización Manualmente
    ipcMain.handle('forzar-sincronizacion', async () => {
        if (isSincronizando()) {
            return { success: false, message: 'La sincronización ya está en curso.' };
        }
        try {
            await procesarSincronizacion();
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    });
}

module.exports = { registerSistemaIpc };
