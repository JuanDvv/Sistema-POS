// SRP: utilidades puras de formato para la generación de documentos PDF.

function formatearCOP(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(Number(valor || 0));
}

function sanitizarNombreArchivo(valor) {
    return String(valor || 'documento')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .trim()
        .replace(/\s+/g, '_');
}

const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const ESPECIALES = { 10: 'DIEZ', 11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE', 16: 'DIECISEIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE', 20: 'VEINTE' };
const DECENAS = ['', '', 'VEINTI', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function convertirGrupo(n) {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    const c = Math.floor(n / 100);
    const resto = n % 100;
    let texto = c > 0 ? CENTENAS[c] : '';
    if (resto > 0) {
        let restoTexto;
        if (ESPECIALES[resto]) {
            restoTexto = ESPECIALES[resto];
        } else if (resto < 10) {
            restoTexto = UNIDADES[resto];
        } else if (resto < 30) {
            restoTexto = 'VEINTI' + UNIDADES[resto % 10];
        } else {
            const d = Math.floor(resto / 10);
            const u = resto % 10;
            restoTexto = DECENAS[d] + (u > 0 ? ' Y ' + UNIDADES[u] : '');
        }
        texto += (texto ? ' ' : '') + restoTexto;
    }
    return texto.trim();
}

function numeroALetras(valor) {
    const n = Math.floor(Math.abs(Number(valor) || 0));
    if (n === 0) return 'CERO PESOS M/CTE';

    const millones = Math.floor(n / 1000000);
    const miles = Math.floor((n % 1000000) / 1000);
    const cientos = n % 1000;

    const partes = [];
    if (millones > 0) partes.push(millones === 1 ? 'UN MILLON' : convertirGrupo(millones) + ' MILLONES');
    if (miles > 0) partes.push(miles === 1 ? 'MIL' : convertirGrupo(miles) + ' MIL');
    if (cientos > 0) partes.push(convertirGrupo(cientos));

    return partes.join(' ').trim() + ' PESOS M/CTE';
}

// El valor del domicilio no tiene columna propia en `ventas`; queda embebido en
// metodo_pago como "... (Domicilio: $X)" al momento de cobrar (ver ventas.js/ventas-anteriores.js).
function extraerDomicilioDeMetodoPago(metodoPago) {
    const match = String(metodoPago || '').match(/\(Domicilio:\s*\$?([\d.,]+)\)/);
    if (!match) return 0;
    const numero = parseFloat(match[1].replace(/\./g, '').replace(/,/g, '.'));
    return Number.isFinite(numero) ? numero : 0;
}

module.exports = { formatearCOP, sanitizarNombreArchivo, numeroALetras, extraerDomicilioDeMetodoPago };
