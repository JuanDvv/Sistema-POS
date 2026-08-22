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

// Datos fijos del emisor ("DOCUMENTO EQUIVALENTE A FACTURA", Dec. 3050 de 1997 Art 3): deben ser
// revisados por un contador antes de usarse en producción, no se validaron con un profesional
// tributario. La dirección y el teléfono de contacto NO van aquí: se toman de la sucursal de la
// venta (ver `direccion`/`telefonoSucursal` en construirHtmlCuentaCobro), porque el negocio opera
// desde varias sucursales y no hay una dirección fija única del emisor.
const EMISOR = {
  nombreComercial: 'Tienda de Kary',
  nit: '30775919-8',
  descripcionComercial: 'Tienda de Kary - Camisetas y Estampados',
  representanteNombre: 'KARINA DE LEÓN HUETO',
  representanteCC: '30775919',
  representanteCCFormateada: '30.775.919',
  telefono: '3178931098',
  banco: 'BANCOLOMBIA',
  tipoCuenta: 'Ahorros',
  numeroCuentaBancaria: '50437144995',
  titularCuenta: 'Karina De León Hueto',
  email: 'karinadeleon3@hotmail.com'
};

function formatearFechaCorta(fecha) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '-';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

// Construye el HTML de una "Cuenta de Cobro" / documento equivalente a factura (usado tanto por
// el reporte acumulado de créditos como por la cuenta de cobro puntual de una venta fiscal).
// `sucursalLabel` es opcional (nombre de una sucursal, o varias separadas por coma). `direccion` y
// `telefonoSucursal` vienen de la sucursal de la venta y solo se muestran cuando hay una sola
// sucursal involucrada (ver obtenerSucursalInfo en registerClientesIpc.js). `firmaDataUri` es la
// firma escaneada como data URI; si no se provee, se cae de vuelta a un nombre en fuente cursiva.
function construirHtmlCuentaCobro({ cliente, numeroCuenta, items, total, sucursalLabel, direccion, telefonoSucursal, firmaDataUri }) {
  const fechaActual = new Date();
  const ciudadFecha = `Turbaco, ${fechaActual.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  const sumaEnLetras = numeroALetras(total).toLowerCase();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #1f2937; margin: 0; padding: 36px 40px; font-size: 12px; }
    .brand { text-align: center; font-family: 'Brush Script MT', 'Segoe Script', cursive; font-size: 34px; font-weight: bold; color: #c0392b; margin-bottom: 2px; }
    .brand-sub { text-align: center; font-size: 12px; margin: 2px 0; }
    .divider { border-top: 1px solid #111827; margin: 10px 0; }
    .doc-title { text-align: center; font-weight: bold; font-size: 13px; margin: 2px 0; }
    .doc-legal { text-align: center; font-weight: bold; font-size: 11px; margin: 1px 0; }
    .ciudad-fecha { margin: 16px 0; }
    .cliente-block { text-align: center; margin: 18px 0; }
    .cliente-nombre { font-weight: bold; font-size: 13px; text-transform: uppercase; }
    .debe-a { text-align: center; margin: 18px 0; }
    .debe-a .nombre { font-weight: bold; text-transform: uppercase; }
    .concepto { text-align: center; font-weight: bold; margin: 16px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    th, td { border: 1px solid #9ca3af; padding: 6px 8px; text-align: left; }
    th { background: #f3f4f6; font-weight: bold; text-align: center; }
    th.num, td.num { text-align: right; }
    .totales { text-align: right; margin-top: 10px; font-weight: bold; font-size: 12px; }
    .total-letras { text-align: center; margin: 16px 0; }
    .cordialmente { margin-top: 34px; }
    .firma { font-family: 'Brush Script MT', 'Segoe Script', cursive; font-size: 30px; margin: 8px 0 0 4px; color: #111827; }
    .firma-img { width: 170px; height: auto; max-width: 100%; margin: 8px 0 0 4px; display: block; }
    .firma-line { border-top: 1px solid #111827; width: 260px; margin-top: 4px; }
    .firma-nombre { font-weight: 600; margin-top: 4px; }
    .banco { margin-top: 18px; }
    .footer { margin-top: 26px; border-top: 1px solid #d1d5db; padding-top: 10px; text-align: center; font-size: 10.5px; color: #374151; }
    .footer a { color: #2563eb; }
  </style>
</head>
<body>
  <div class="brand">${EMISOR.nombreComercial}</div>
  <div class="brand-sub">Nit: ${EMISOR.nit}</div>
  <div class="brand-sub">${EMISOR.descripcionComercial}</div>
  <div class="divider"></div>

  <div class="doc-title">DOCUMENTO EQUIVALENTE A FACTURA No ${numeroCuenta}</div>
  <div class="doc-legal">Dec. 3050 de 1997 Art 3</div>
  <div class="doc-legal">No responsable del IVA</div>
  <div class="divider"></div>

  <div class="ciudad-fecha">${ciudadFecha}${sucursalLabel ? ` &mdash; Sucursal: ${sucursalLabel}` : ''}</div>

  <div class="cliente-block">
    <div class="cliente-nombre">${cliente.nombre}</div>
    <div>NIT ${cliente.identificacion || '-'}</div>
  </div>

  <div class="debe-a">
    <div>DEBE A:</div>
    <div class="nombre">${EMISOR.representanteNombre}</div>
    <div>CC ${EMISOR.representanteCC}</div>
  </div>

  <div class="concepto">Por concepto:</div>

  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Producto</th>
        <th class="num">Cant</th>
        <th class="num">Vr. Unitario</th>
        <th class="num">Vr. Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${formatearFechaCorta(item.fecha)}</td>
          <td>${item.producto}</td>
          <td class="num">${item.cantidad}</td>
          <td class="num">${formatearCOP(item.precio)}</td>
          <td class="num">${formatearCOP(item.subtotal)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totales">TOTAL: ${formatearCOP(total)}</div>
  <div class="total-letras">Total: <strong>${formatearCOP(total)} (${sumaEnLetras}.)</strong></div>

  <div class="cordialmente">Cordialmente,</div>
  ${firmaDataUri
      ? `<img class="firma-img" src="${firmaDataUri}" alt="Firma">`
      : `<div class="firma">${EMISOR.representanteNombre.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</div>`}
  <div class="firma-line"></div>
  <div class="firma-nombre">${EMISOR.representanteNombre}</div>
  <div>C.C. ${EMISOR.representanteCCFormateada}</div>
  <div>Teléfono ${EMISOR.telefono}</div>

  <div class="banco">
    Consignar en cuenta de ${EMISOR.tipoCuenta} ${EMISOR.banco}: ${EMISOR.numeroCuentaBancaria} a nombre de<br>
    ${EMISOR.titularCuenta}
  </div>

  <div class="footer">
    ${direccion ? `Dirección: ${direccion}<br>` : ''}
    Correo electrónico: <a href="mailto:${EMISOR.email}">${EMISOR.email}</a>
    ${telefonoSucursal ? `<br>Teléfonos: ${telefonoSucursal}` : ''}
  </div>
</body>
</html>`;
}

module.exports = { formatearCOP, sanitizarNombreArchivo, numeroALetras, extraerDomicilioDeMetodoPago, construirHtmlCuentaCobro };
