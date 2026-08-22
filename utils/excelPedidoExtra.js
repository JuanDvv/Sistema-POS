const ExcelJS = require('exceljs');

// SRP: generación del archivo Excel (.xlsx) con las recomendaciones de pedido extra de
// pastelería para una sucursal -- ver services/pedidoSugeridoPasteleriaService.js
// (calcularRecomendacionesPasteleriaSucursal), única fuente del cálculo para que la tabla en
// pantalla y este archivo siempre muestren los mismos números.

const COLUMNAS = [
    { header: 'Producto', key: 'producto', width: 38 },
    { header: 'Stock Actual', key: 'stock', width: 15 },
    { header: 'Promedio Diario de Venta', key: 'promedio', width: 24 },
    { header: 'Próxima Entrega', key: 'fecha', width: 18 },
    { header: 'Días Hasta la Entrega', key: 'dias', width: 20 },
    { header: 'Sugerido de ese Día', key: 'sugerido', width: 20 },
    { header: 'Cantidad Recomendada', key: 'recomendado', width: 20 }
];

async function generarExcelPedidoExtra(resultados) {
    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet('Pedido Extra Pastelería');
    hoja.columns = COLUMNAS;

    const filaHeader = hoja.getRow(1);
    filaHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    filaHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } };
    hoja.views = [{ state: 'frozen', ySplit: 1 }];
    hoja.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + COLUMNAS.length)}1` };

    resultados.forEach((r) => {
        hoja.addRow({
            producto: r.productoNombre,
            stock: r.stockActual,
            promedio: Math.round(r.promedioDiario * 100) / 100,
            fecha: r.proximaFechaEntrega,
            dias: r.diasHastaProximaEntrega,
            sugerido: r.sugeridoDelDia,
            recomendado: r.cantidadRecomendada
        });
    });

    return workbook.xlsx.writeBuffer();
}

module.exports = { generarExcelPedidoExtra };
