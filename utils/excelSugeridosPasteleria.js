const ExcelJS = require('exceljs');

// SRP: generación del archivo Excel (.xlsx) con los sugeridos semanales de pastelería de una
// sucursal -- ver services/pedidoSugeridoPasteleriaService.js
// (obtenerProductosPasteleriaConSugeridos), única fuente de estos datos para que la grilla en
// pantalla y este archivo siempre coincidan.

const COLUMNAS = [
    { header: 'Producto', key: 'producto', width: 38 },
    { header: 'Stock Actual', key: 'stock', width: 15 },
    { header: 'Sugerido Martes', key: 'martes', width: 18 },
    { header: 'Sugerido Jueves', key: 'jueves', width: 18 },
    { header: 'Sugerido Sábado', key: 'sabado', width: 18 }
];

async function generarExcelSugeridosPasteleria(productos) {
    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet('Sugeridos Pastelería');
    hoja.columns = COLUMNAS;

    const filaHeader = hoja.getRow(1);
    filaHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    filaHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } };
    hoja.views = [{ state: 'frozen', ySplit: 1 }];
    hoja.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + COLUMNAS.length)}1` };

    productos.forEach((p) => {
        hoja.addRow({
            producto: p.productoNombre,
            stock: p.stockActual,
            martes: p.sugeridoMartes,
            jueves: p.sugeridoJueves,
            sabado: p.sugeridoSabado
        });
    });

    return workbook.xlsx.writeBuffer();
}

module.exports = { generarExcelSugeridosPasteleria };
