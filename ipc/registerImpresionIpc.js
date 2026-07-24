const { ipcMain, BrowserWindow } = require('electron');
const { imprimirTicket } = require('../services/printService');

// SRP: expone como IPC la impresión térmica de tickets. La selección de impresora y
// el manejo del callback nativo viven en services/printService.

function registerImpresionIpc() {
    ipcMain.handle('imprimir-ticket', async (event, { printerName, datosTicket } = {}) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) {
            return { success: false, message: 'Error de impresión: no se encontró la ventana activa.' };
        }

        const resultado = await imprimirTicket(win, { printerName, datosTicket });

        if (!resultado.success) {
            event.sender.send('impresion-fallida', resultado.message);
        }

        return resultado;
    });
}

module.exports = { registerImpresionIpc };
