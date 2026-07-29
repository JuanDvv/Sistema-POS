const { ipcMain, BrowserWindow } = require('electron');
const { imprimirTicket, imprimirTicketPedido, listarImpresorasDisponibles, guardarImpresoraLocal, leerImpresoraGuardada } = require('../services/printService');

// SRP: expone como IPC la impresión térmica de tickets. La selección de impresora y
// el manejo del callback nativo viven en services/printService.

function registerImpresionIpc() {
    // Usada por la pantalla de administración para que el usuario elija la impresora de
    // este equipo en vez de depender de la predeterminada de Windows.
    ipcMain.handle('listar-impresoras', async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return { nombres: [], sugerida: '', guardada: '' };
        return listarImpresorasDisponibles(win);
    });

    // Lectura rápida (solo Registro, sin enumerar impresoras ni consultar PowerShell) usada
    // al entrar a Administración: si ya hay una impresora guardada, no hace falta disparar
    // la detección completa automáticamente, solo mostrarla.
    ipcMain.handle('obtener-impresora-guardada', () => {
        return leerImpresoraGuardada();
    });

    // Persiste en un archivo de configuración de este equipo (no en localStorage, que se
    // borra por completo en cada cierre de sesión).
    ipcMain.handle('guardar-impresora-local', (event, nombre) => {
        guardarImpresoraLocal(String(nombre || ''));
        return { success: true };
    });

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

    // Comprobante de Pedido/Apartado: mismo mecanismo RAW, distinto contenido (ver
    // services/ticketEscPos.js: construirTicketPedidoBuffer).
    ipcMain.handle('imprimir-ticket-pedido', async (event, { printerName, datosTicket } = {}) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) {
            return { success: false, message: 'Error de impresión: no se encontró la ventana activa.' };
        }

        const resultado = await imprimirTicketPedido(win, { printerName, datosTicket });

        if (!resultado.success) {
            event.sender.send('impresion-fallida', resultado.message);
        }

        return resultado;
    });
}

module.exports = { registerImpresionIpc };
