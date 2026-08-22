const { ipcMain, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const { allQuery } = require('../db/connection');
const {
    calcularRecomendacionesPasteleriaSucursal,
    obtenerProductosPasteleriaConSugeridos,
    upsertSugeridoPasteleriaTx
} = require('../services/pedidoSugeridoPasteleriaService');
const { generarExcelPedidoExtra } = require('../utils/excelPedidoExtra');
const { generarExcelSugeridosPasteleria } = require('../utils/excelSugeridosPasteleria');

function registerPedidoSugeridoIpc() {
    ipcMain.handle('obtener-sugeridos-pasteleria', async (event, { sucursalId }) => {
        try {
            const rows = await allQuery(
                `SELECT producto_id, sugerido_martes, sugerido_jueves, sugerido_sabado
                 FROM sugeridos_pasteleria
                 WHERE sucursal_id = ? AND (sync_status IS NULL OR sync_status <> 'deleted')`,
                [sucursalId]
            );
            return { success: true, data: rows };
        } catch (err) {
            return { success: false, data: [], message: err.message };
        }
    });

    ipcMain.handle('guardar-sugerido-pasteleria', async (event, datos) => upsertSugeridoPasteleriaTx(datos));

    ipcMain.handle('exportar-excel-sugeridos-pasteleria', async (event, { sucursalId }) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        try {
            const productos = await obtenerProductosPasteleriaConSugeridos(sucursalId);
            if (productos.length === 0) {
                return { success: false, message: 'No hay productos de pastelería en esta sucursal.' };
            }

            const { canceled, filePath } = await dialog.showSaveDialog(win, {
                title: 'Guardar sugeridos semanales de pastelería',
                defaultPath: `sugeridos-pasteleria-${sucursalId}-${new Date().toISOString().split('T')[0]}.xlsx`,
                filters: [{ name: 'Excel', extensions: ['xlsx'] }]
            });
            if (canceled || !filePath) {
                return { success: false, cancelado: true };
            }

            const buffer = await generarExcelSugeridosPasteleria(productos);
            fs.writeFileSync(filePath, buffer);
            return { success: true, message: 'Excel generado exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al generar el Excel: ' + err.message };
        }
    });

    ipcMain.handle('obtener-recomendaciones-pedido-extra', async (event, { sucursalId }) => {
        try {
            const data = await calcularRecomendacionesPasteleriaSucursal(sucursalId);
            return { success: true, data };
        } catch (err) {
            return { success: false, data: [], message: err.message };
        }
    });

    ipcMain.handle('exportar-excel-pedido-extra', async (event, { sucursalId }) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        try {
            const resultados = await calcularRecomendacionesPasteleriaSucursal(sucursalId);
            if (resultados.length === 0) {
                return { success: false, message: 'No hay productos de pastelería con sugerido configurado en esta sucursal.' };
            }

            const { canceled, filePath } = await dialog.showSaveDialog(win, {
                title: 'Guardar recomendaciones de pedido extra',
                defaultPath: `pedido-extra-pasteleria-${sucursalId}-${new Date().toISOString().split('T')[0]}.xlsx`,
                filters: [{ name: 'Excel', extensions: ['xlsx'] }]
            });
            if (canceled || !filePath) {
                return { success: false, cancelado: true };
            }

            const buffer = await generarExcelPedidoExtra(resultados);
            fs.writeFileSync(filePath, buffer);
            return { success: true, message: 'Excel generado exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al generar el Excel: ' + err.message };
        }
    });
}

module.exports = { registerPedidoSugeridoIpc };
