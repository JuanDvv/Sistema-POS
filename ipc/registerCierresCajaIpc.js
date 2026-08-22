const { ipcMain } = require('electron');
const { calcularVentanaYEsperado, registrarCierreCajaTx, obtenerCierresCaja, eliminarCierreCajaTx, recalcularCierreCajaTx } = require('../services/cierreCajaService');

// SRP: expone como IPC el cuadre de caja por ventana de tiempo. La lógica de cálculo/persistencia
// vive en services/cierreCajaService.js.

function registerCierresCajaIpc() {
    ipcMain.handle('obtener-ventana-caja-actual', async (event, { sucursalId }) => {
        try {
            const ventana = await calcularVentanaYEsperado(sucursalId);
            return { success: true, ...ventana };
        } catch (err) {
            return { success: false, message: 'Error al calcular la ventana de caja: ' + err.message };
        }
    });

    ipcMain.handle('registrar-cierre-caja', async (event, datos) => {
        return registrarCierreCajaTx(datos);
    });

    ipcMain.handle('obtener-cierres-caja', async (event, filtros) => {
        try {
            return { success: true, data: await obtenerCierresCaja(filtros) };
        } catch (err) {
            return { success: false, data: [], message: err.message };
        }
    });

    ipcMain.handle('eliminar-cierre-caja', async (event, { cierreId, auditoriaUsuario, auditoriaRol }) => {
        if (auditoriaRol !== 'Administrador') {
            return { success: false, message: 'Solo un Administrador puede eliminar un cierre de caja.' };
        }
        return eliminarCierreCajaTx({ cierreId, auditoriaUsuario, auditoriaRol });
    });

    ipcMain.handle('recalcular-cierre-caja', async (event, { cierreId, auditoriaUsuario, auditoriaRol }) => {
        if (auditoriaRol !== 'Administrador') {
            return { success: false, message: 'Solo un Administrador puede recalcular un cierre de caja.' };
        }
        return recalcularCierreCajaTx({ cierreId, auditoriaUsuario, auditoriaRol });
    });
}

module.exports = { registerCierresCajaIpc };
