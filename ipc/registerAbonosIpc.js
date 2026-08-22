const { ipcMain } = require('electron');
const { listarAbonosEliminados, recuperarAbono } = require('../services/abonoRecoveryService');

// SRP: expone como IPC la recuperación de abonos eliminados (Crédito y Pedidos), Administrador
// únicamente desde el Panel de Administración. La lógica vive en services/abonoRecoveryService.

function registerAbonosIpc() {
    ipcMain.handle('listar-abonos-eliminados', async () => {
        try {
            return await listarAbonosEliminados();
        } catch (err) {
            return { success: false, message: 'No se pudieron obtener los abonos eliminados (revisa la conexión a internet): ' + err.message };
        }
    });

    ipcMain.handle('recuperar-abono', async (event, datos) => {
        try {
            return await recuperarAbono(datos);
        } catch (err) {
            return { success: false, message: 'Error al recuperar el abono: ' + err.message };
        }
    });
}

module.exports = { registerAbonosIpc };
