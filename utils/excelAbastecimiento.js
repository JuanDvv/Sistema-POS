const ExcelJS = require('exceljs');

// SRP: generación y lectura del archivo Excel (.xlsx) de carga masiva de abastecimiento.
// Se usa un archivo Excel real (no CSV) para que las columnas siempre se vean separadas al
// abrirlo, sin depender de la configuración regional del equipo del operador. El ID de
// producto es la clave real de emparejamiento; el nombre es solo de referencia visual.

// La categoría es solo informativa (no se usa para el emparejamiento al leer el archivo); se
// incluye para que los usuarios puedan filtrar/ordenar por ella en Excel más fácilmente.
const COLUMNAS = [
    { header: 'ID Producto (No Modificar)', key: 'id', width: 32 },
    { header: 'Nombre Producto', key: 'nombre', width: 38 },
    { header: 'Categoría', key: 'categoria', width: 25 },
    { header: 'Cantidad a Ingresar', key: 'cantidad', width: 20 }
];

async function generarPlantillaAbastecimiento(productos) {
    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet('Abastecimiento');
    hoja.columns = COLUMNAS;

    const filaHeader = hoja.getRow(1);
    filaHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    filaHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } };
    hoja.views = [{ state: 'frozen', ySplit: 1 }];
    // Flechitas de filtro en el encabezado, para que filtrar/ordenar por categoría sea inmediato.
    hoja.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + COLUMNAS.length)}1` };

    productos.forEach((p) => {
        hoja.addRow({ id: p.id, nombre: p.nombre, categoria: p.categoria_nombre || 'Sin categoría', cantidad: 0 });
    });

    return workbook.xlsx.writeBuffer();
}

async function leerPlantillaAbastecimiento(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const hoja = workbook.worksheets[0];
    if (!hoja) return [];

    const filas = [];
    hoja.eachRow((row, numeroFila) => {
        if (numeroFila === 1) return; // fila de encabezado
        const id = String(row.getCell(1).value ?? '').trim();
        if (!id) return;
        const nombreArchivo = String(row.getCell(2).value ?? '').trim();
        // Columna 3 (Categoría) es solo informativa, se ignora al leer.
        const cantidad = Number(row.getCell(4).value);
        filas.push({ id, nombreArchivo, cantidad: Number.isFinite(cantidad) ? cantidad : NaN });
    });
    return filas;
}

module.exports = { generarPlantillaAbastecimiento, leerPlantillaAbastecimiento };
