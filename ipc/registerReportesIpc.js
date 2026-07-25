const { ipcMain, BrowserWindow, dialog, app } = require('electron');
const path = require('path');
const fs = require('fs');
const { allQuery } = require('../db/connection');
const { TIPOS_GASTO, ESTADOS_DEVOLUCION } = require('../utils/gastos');

// SRP: reportes de gestión (balance financiero, ranking, filtros de año/mes) y exportación genérica a PDF.

function registerReportesIpc() {
    // Obtener Balance Financiero para Reportes de Gestión
    ipcMain.handle('obtener-balance-financiero', async (event, { sucursalId, fechaInicio, fechaFin, tipoGasto, conceptoGasto }) => {
        try {
            // Las ventas a crédito no representan dinero recibido todavía, así que se excluyen de
            // los ingresos hasta que el cliente pague (ver consulta de abonos_credito más abajo).
            // El ingreso real se reconoce el día del abono, con el método de pago con el que se recibió.
            // Mismo criterio para pedidos/apartados: la venta que se genera al entregarlos (detectada
            // por el JOIN con `pedidos`) se excluye porque ese dinero ya se contó día a día vía sus
            // abonos (ver consulta de abonos_pedido más abajo).
            let queryVentas = `
                SELECT
                    strftime('%Y-%m-%d', fecha, 'localtime') as dia,
                    metodo_pago,
                    SUM(total) as total
                FROM ventas
                WHERE strftime('%Y-%m-%d', fecha) >= ? AND strftime('%Y-%m-%d', fecha) <= ?
                    AND (sync_status IS NULL OR sync_status <> 'deleted')
                    AND (es_credito IS NULL OR es_credito = 0)
                    AND NOT EXISTS (SELECT 1 FROM pedidos ped WHERE ped.venta_id = ventas.id)
            `;
            let paramsVentas = [fechaInicio, fechaFin];
            if (sucursalId) {
                queryVentas += ` AND sucursal_id = ?`;
                paramsVentas.push(sucursalId);
            }
            queryVentas += ` GROUP BY dia, metodo_pago ORDER BY dia DESC`;

            let queryGastos = `
                SELECT
                    strftime('%Y-%m-%d', fecha, 'localtime') as dia,
                    tipo,
                    monto,
                    metodo_pago,
                    estado,
                    COALESCE(descripcion, 'Sin descripción') as descripcion
                FROM gastos
                WHERE strftime('%Y-%m-%d', fecha) >= ? AND strftime('%Y-%m-%d', fecha) <= ? AND (sync_status IS NULL OR sync_status <> 'deleted')
            `;
            let paramsGastos = [fechaInicio, fechaFin];
            if (sucursalId) {
                queryGastos += ` AND sucursal_id = ?`;
                paramsGastos.push(sucursalId);
            }
            if (tipoGasto && Object.values(TIPOS_GASTO).includes(tipoGasto)) {
                queryGastos += ` AND tipo = ?`;
                paramsGastos.push(tipoGasto);
            }
            if (conceptoGasto && conceptoGasto.trim()) {
                queryGastos += ` AND descripcion LIKE ?`;
                paramsGastos.push(`%${conceptoGasto.trim()}%`);
            }
            queryGastos += ` ORDER BY dia DESC, tipo ASC, fecha DESC`;

            // abonos_credito no tiene sucursal_id (los clientes no están ligados a una sucursal),
            // así que el cobro de cartera solo se refleja en la vista consolidada (sin filtro de sucursal).
            let abonos = [];
            if (!sucursalId) {
                const queryAbonos = `
                    SELECT
                        strftime('%Y-%m-%d', fecha) as dia,
                        metodo_pago,
                        SUM(monto) as total
                    FROM abonos_credito
                    WHERE strftime('%Y-%m-%d', fecha) >= ? AND strftime('%Y-%m-%d', fecha) <= ?
                        AND (sync_status IS NULL OR sync_status <> 'deleted')
                    GROUP BY dia, metodo_pago
                    ORDER BY dia DESC
                `;
                abonos = await allQuery(queryAbonos, [fechaInicio, fechaFin]);
            }

            // Abonos de Pedidos/Apartados: a diferencia de abonos_credito, sí se pueden filtrar por
            // sucursal porque el pedido (a través del cual se llega al abono) sí tiene sucursal_id.
            let queryAbonosPedido = `
                SELECT
                    strftime('%Y-%m-%d', ap.fecha) as dia,
                    ap.metodo_pago,
                    SUM(ap.monto) as total
                FROM abonos_pedido ap
                JOIN pedidos p ON ap.pedido_id = p.id
                WHERE strftime('%Y-%m-%d', ap.fecha) >= ? AND strftime('%Y-%m-%d', ap.fecha) <= ?
                    AND (ap.sync_status IS NULL OR ap.sync_status <> 'deleted')
            `;
            let paramsAbonosPedido = [fechaInicio, fechaFin];
            if (sucursalId) {
                queryAbonosPedido += ` AND p.sucursal_id = ?`;
                paramsAbonosPedido.push(sucursalId);
            }
            queryAbonosPedido += ` GROUP BY dia, ap.metodo_pago ORDER BY dia DESC`;
            const abonosPedido = await allQuery(queryAbonosPedido, paramsAbonosPedido);

            const ventas = await allQuery(queryVentas, paramsVentas);
            const gastos = await allQuery(queryGastos, paramsGastos);

            return { success: true, ventas, gastos, abonos, abonosPedido };
        } catch (err) {
            return { success: false, message: 'Error al obtener balance financiero: ' + err.message };
        }
    });

    // Obtener Ranking de Productos más vendidos para Reportes de Gestión
    ipcMain.handle('obtener-ranking-productos', async (event, { sucursalId, fechaInicio, fechaFin, categoriaId }) => {
        try {
            let queryRanking = `
                SELECT
                    p.nombre as producto_nombre,
                    COALESCE(c.nombre, 'Sin Categoría') as categoria_nombre,
                    SUM(dv.cantidad) as total_cantidad,
                    SUM(dv.cantidad * dv.precio_unitario) as total_ingreso
                FROM ventas v
                JOIN detalle_ventas dv ON v.id = dv.venta_id
                JOIN productos p ON dv.producto_id = p.id
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE strftime('%Y-%m-%d', v.fecha) >= ? AND strftime('%Y-%m-%d', v.fecha) <= ? AND (v.sync_status IS NULL OR v.sync_status <> 'deleted')
            `;
            let paramsRanking = [fechaInicio, fechaFin];
            if (sucursalId) {
                queryRanking += ` AND v.sucursal_id = ?`;
                paramsRanking.push(sucursalId);
            }
            if (categoriaId === 'sin-categoria') {
                queryRanking += ` AND p.categoria_id IS NULL`;
            } else if (categoriaId) {
                queryRanking += ` AND p.categoria_id = ?`;
                paramsRanking.push(categoriaId);
            }
            queryRanking += ` GROUP BY p.id, p.nombre, c.nombre ORDER BY total_cantidad DESC`;

            const ranking = await allQuery(queryRanking, paramsRanking);
            return { success: true, ranking };
        } catch (err) {
            return { success: false, message: 'Error al obtener ranking de productos: ' + err.message };
        }
    });

    // Obtener Reporte de Seguimiento de Devoluciones de Producto (mala calidad, pendientes por devolver a la empresa)
    ipcMain.handle('obtener-reporte-devoluciones', async (event, { sucursalId, fechaInicio, fechaFin } = {}) => {
        try {
            let query = `
                SELECT
                    id,
                    sucursal_id,
                    strftime('%Y-%m-%d', fecha, 'localtime') as dia,
                    fecha,
                    descripcion,
                    monto,
                    COALESCE(estado, ?) as estado
                FROM gastos
                WHERE tipo = ? AND (sync_status IS NULL OR sync_status <> 'deleted')
            `;
            const params = [ESTADOS_DEVOLUCION.PENDIENTE, TIPOS_GASTO.DEVOLUCION];
            if (fechaInicio && fechaFin) {
                query += ` AND strftime('%Y-%m-%d', fecha) >= ? AND strftime('%Y-%m-%d', fecha) <= ?`;
                params.push(fechaInicio, fechaFin);
            }
            if (sucursalId) {
                query += ` AND sucursal_id = ?`;
                params.push(sucursalId);
            }
            query += ` ORDER BY (estado IS NOT NULL AND estado <> ?) ASC, fecha DESC`;
            params.push(ESTADOS_DEVOLUCION.PENDIENTE);

            const devoluciones = await allQuery(query, params);
            const resumen = devoluciones.reduce((acc, d) => {
                const clave = d.estado === ESTADOS_DEVOLUCION.DEVUELTA ? 'devueltas' : d.estado === ESTADOS_DEVOLUCION.RECHAZADA ? 'rechazadas' : 'pendientes';
                acc[clave] += 1;
                return acc;
            }, { pendientes: 0, devueltas: 0, rechazadas: 0 });

            return { success: true, devoluciones, resumen };
        } catch (err) {
            return { success: false, message: 'Error al obtener reporte de devoluciones: ' + err.message };
        }
    });

    // Obtener años disponibles con registros de ventas o gastos
    ipcMain.handle('obtener-anios-disponibles', async () => {
        try {
            const rows = await allQuery(`
                SELECT DISTINCT strftime('%Y', fecha) as anio FROM (
                    SELECT fecha FROM ventas WHERE sync_status IS NULL OR sync_status <> 'deleted'
                    UNION ALL
                    SELECT fecha FROM gastos WHERE sync_status IS NULL OR sync_status <> 'deleted'
                ) WHERE fecha IS NOT NULL AND fecha <> '' ORDER BY anio DESC
            `, []);
            const anios = rows.map(r => parseInt(r.anio)).filter(y => !isNaN(y));
            return { success: true, anios };
        } catch (err) {
            return { success: false, message: 'Error al obtener años disponibles: ' + err.message };
        }
    });

    // Obtener meses disponibles con registros de ventas o gastos para un año específico
    ipcMain.handle('obtener-meses-disponibles', async (event, anio) => {
        try {
            const rows = await allQuery(`
                SELECT DISTINCT CAST(strftime('%m', fecha) AS INTEGER) - 1 as mes FROM (
                    SELECT fecha FROM ventas WHERE (sync_status IS NULL OR sync_status <> 'deleted') AND strftime('%Y', fecha) = ?
                    UNION ALL
                    SELECT fecha FROM gastos WHERE (sync_status IS NULL OR sync_status <> 'deleted') AND strftime('%Y', fecha) = ?
                ) WHERE fecha IS NOT NULL AND fecha <> '' ORDER BY mes ASC
            `, [String(anio), String(anio)]);
            const meses = rows.map(r => r.mes).filter(m => !isNaN(m));
            return { success: true, meses };
        } catch (err) {
            return { success: false, message: 'Error al obtener meses disponibles: ' + err.message };
        }
    });

    // Exportar Reporte a PDF
    ipcMain.handle('exportar-pdf', async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        const pdfOptions = {
            marginsType: 0,
            pageSize: 'A4',
            printBackground: true,
            landscape: false
        };
        try {
            const data = await win.webContents.printToPDF(pdfOptions);
            const { filePath } = await dialog.showSaveDialog(win, {
                title: 'Guardar Reporte en PDF',
                defaultPath: path.join(app.getPath('downloads'), `reporte-${new Date().toISOString().split('T')[0]}.pdf`),
                filters: [{ name: 'Documentos PDF', extensions: ['pdf'] }]
            });
            if (filePath) {
                fs.writeFileSync(filePath, data);
                return { success: true, message: 'PDF exportado exitosamente.' };
            }
            return { success: false, message: 'Exportación cancelada.' };
        } catch (err) {
            return { success: false, message: 'Error al generar PDF: ' + err.message };
        }
    });
}

module.exports = { registerReportesIpc };
