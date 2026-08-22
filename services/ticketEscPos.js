// Genera el comprobante de venta como comandos ESC/POS crudos (estándar de facto de las
// impresoras térmicas de recibo), para enviarlos directo a la cola de impresión en modo RAW
// desde services/printService.js. Esto evita por completo el pipeline gráfico de Chromium,
// que resultó incompatible con el driver de ciertas impresoras térmicas (error persistente
// "Invalid printer settings" sin importar deviceName, pageSize o el backend de impresión usado).

const ESC = 0x1B;
const GS = 0x1D;

const INIT = Buffer.from([ESC, 0x40]);
const BOLD_ON = Buffer.from([ESC, 0x45, 0x01]);
const BOLD_OFF = Buffer.from([ESC, 0x45, 0x00]);
// Alineación por hardware (ESC a n): la propia impresora conoce su ancho físico real, así
// que centrar/alinear a la derecha con estos comandos es más confiable que rellenar con
// espacios calculados a mano asumiendo un número fijo de caracteres por línea (eso fue lo
// que causaba precios desalineados: el ancho real de esta impresora no era el asumido).
const ALIGN_LEFT = Buffer.from([ESC, 0x61, 0x00]);
const ALIGN_CENTER = Buffer.from([ESC, 0x61, 0x01]);
const ALIGN_RIGHT = Buffer.from([ESC, 0x61, 0x02]);
const CORTE_PARCIAL = Buffer.from([GS, 0x56, 0x01]);
// Margen de avance antes del corte: la cuchilla está físicamente por debajo del cabezal de
// impresión, así que hay que alimentar varias líneas de sobra o el corte cae sobre el texto
// del pie de página en vez de en blanco.
const AVANCE_PAPEL = (n) => Buffer.from(Array(n).fill(0x0A));

// Ancho de línea imprimible. La medición previa contando dígitos sobre una foto (58) resultó
// poco confiable -- se pasaba del ancho real y hacía saltar de línea a media tabla de precios.
// 42 es el valor estándar de la industria para térmicas de 80mm en fuente normal (Font A),
// usado por defecto en la mayoría de librerías POS; deja margen de sobra para no repetir el
// mismo problema.
const ANCHO_SEPARADOR = 48;

// La tabla de códigos activa en estos drivers genéricos es poco confiable con acentos/ñ;
// se normaliza a ASCII antes de imprimir para no arriesgar caracteres corruptos en el ticket.
const limpiar = (texto) => String(texto ?? '')
    .normalize('NFD')
    .replace(/[^\x00-\x7F]/g, '');

const separador = () => '-'.repeat(ANCHO_SEPARADOR);

// Tabla de 3 columnas fijas para cada producto: cantidad | nombre | precio. El nombre envuelve
// dentro de su propio ancho (COL_NOMBRE) sin importar cuán largo sea; el precio solo aparece en
// el primer renglón (alineado con la cantidad) y las líneas de continuación del nombre quedan
// indentadas bajo su columna, sin repetir el precio.
const COL_CANT = 4;    // "1x  ", "12x "
const COL_PRECIO = 10; // right-aligned, alcanza holgado para montos en pesos colombianos
const COL_NOMBRE = ANCHO_SEPARADOR - COL_CANT - COL_PRECIO;

// La impresora corta sola al llegar al ancho físico, pero lo hace a mitad de palabra (se vio
// con "3 Unidades" partido en "3 Uni" / "dades"). Se ajusta la línea aquí primero, cortando
// solo en espacios, para que un nombre de producto largo baje limpio a la siguiente línea.
function envolverTexto(texto, ancho = ANCHO_SEPARADOR) {
    const palabras = limpiar(texto).split(' ');
    const lineas = [];
    let actual = '';

    palabras.forEach((palabra) => {
        const candidato = actual ? `${actual} ${palabra}` : palabra;
        if (candidato.length <= ancho) {
            actual = candidato;
            return;
        }
        if (actual) lineas.push(actual);
        // Caso extremo: una sola palabra ya más larga que el ancho de línea (raro, pero se
        // corta a la fuerza para no dejarla desbordando indefinidamente).
        let resto = palabra;
        while (resto.length > ancho) {
            lineas.push(resto.slice(0, ancho));
            resto = resto.slice(ancho);
        }
        actual = resto;
    });
    if (actual) lineas.push(actual);

    return lineas;
}

// Arma las líneas de un producto en las 3 columnas fijas (cantidad | nombre | precio). El precio
// solo se imprime en el primer renglón; si el nombre necesita más líneas, quedan indentadas bajo
// su columna, con la columna de precio en blanco (no se repite el valor).
function formatearFilaProducto(cantidad, nombre, precioTexto) {
    const prefijoCant = `${cantidad}x`.padEnd(COL_CANT);
    const relleno = ' '.repeat(COL_CANT);
    const espacioPrecio = ' '.repeat(COL_PRECIO);

    return envolverTexto(nombre, COL_NOMBRE).map((lineaNombre, i) => {
        const prefijo = i === 0 ? prefijoCant : relleno;
        const valor = i === 0 ? precioTexto.padStart(COL_PRECIO) : espacioPrecio;
        return prefijo + lineaNombre.padEnd(COL_NOMBRE) + valor;
    });
}

function construirTicketBuffer({ ventaId, fecha, items, total, metodoPago, sucursalNombre, direccion, telefono, montoRecibido, vuelto } = {}) {
    const formatCOP = (val) => `$${Math.round(Number(val) || 0).toLocaleString('es-CO')}`;
    const fechaTexto = new Date(fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

    const partes = [INIT];
    const linea = (texto) => partes.push(Buffer.from(`${limpiar(texto)}\n`, 'ascii'));
    const sep = () => linea(separador());

    partes.push(ALIGN_CENTER);
    linea('*** COMPROBANTE INFORMATIVO ***');
    linea('NO ES FACTURA DE VENTA');
    partes.push(ALIGN_LEFT);
    sep();
    partes.push(ALIGN_CENTER, BOLD_ON);
    linea(`Delipostres Venecia ${sucursalNombre || ''}`.trim());
    partes.push(BOLD_OFF);
    if (direccion) linea(direccion);
    if (telefono) linea(`Tel: ${telefono}`);
    partes.push(ALIGN_LEFT);
    sep();
    linea(`Fecha: ${fechaTexto}`);
    linea(`Venta ID: ${String(ventaId || '').slice(0, 8)}`);
    linea(`Metodo: ${metodoPago || ''}`);
    sep();

    (items || []).forEach(item => {
        const precioTexto = formatCOP((item.precio || 0) * (item.cantidad || 0));
        formatearFilaProducto(item.cantidad, item.nombre, precioTexto).forEach(linea);
    });

    sep();
    // "TOTAL: $X" como una sola línea en negrita alineada a la derecha, igual que .ticket-total
    // en la vista previa en pantalla (no como etiqueta/valor separados con puntos de relleno).
    partes.push(ALIGN_RIGHT, BOLD_ON);
    linea(`TOTAL: ${formatCOP(total)}`);
    partes.push(BOLD_OFF);
    if (montoRecibido != null) {
        linea(`Recibido: ${formatCOP(montoRecibido)}`);
        partes.push(BOLD_ON);
        linea(`Cambio: ${formatCOP(vuelto)}`);
        partes.push(BOLD_OFF);
    }
    partes.push(ALIGN_LEFT);
    sep();
    partes.push(ALIGN_CENTER);
    linea('*** COMPROBANTE INFORMATIVO ***');
    linea('NO ES FACTURA DE VENTA');
    partes.push(ALIGN_LEFT);
    partes.push(AVANCE_PAPEL(6));
    partes.push(CORTE_PARCIAL);

    return Buffer.concat(partes);
}

// Comprobante de Pedido/Apartado: documento distinto al comprobante informativo de venta (arriba),
// ya que certifica una reserva con abono, no una venta concretada. Reutiliza los mismos comandos
// ESC/POS y helpers de formato de línea, pero con encabezado, secciones de cliente/entrega y
// abonado/saldo propios.
function construirTicketPedidoBuffer({ pedidoId, clienteNombre, clienteIdentificacion, clienteTelefono, fechaPedido, fechaEntregaEstimada, items, total, abonado, saldoPendiente, sucursalNombre, direccion, telefono } = {}) {
    const formatCOP = (val) => `$${Math.round(Number(val) || 0).toLocaleString('es-CO')}`;
    const formatFecha = (val) => new Date(val).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    // Cuando no se especifica hora de entrega, pedidos.js guarda el día con las 23:59:59 locales como
    // marca (un <input type="time"> nunca produce segundos != 00), así que se omite la hora al imprimir.
    const formatFechaEntrega = (val) => {
        const d = new Date(val);
        const opciones = d.getSeconds() === 59 ? { dateStyle: 'short' } : { dateStyle: 'short', timeStyle: 'short' };
        return d.toLocaleString('es-CO', opciones);
    };

    const partes = [INIT];
    const linea = (texto) => partes.push(Buffer.from(`${limpiar(texto)}\n`, 'ascii'));
    const sep = () => linea(separador());

    partes.push(ALIGN_CENTER);
    linea('*** COMPROBANTE DE PEDIDO ***');
    linea('*** APARTADO CON ABONO ***');
    partes.push(ALIGN_LEFT);
    sep();
    partes.push(ALIGN_CENTER, BOLD_ON);
    linea(`Delipostres Venecia ${sucursalNombre || ''}`.trim());
    partes.push(BOLD_OFF);
    if (direccion) linea(direccion);
    if (telefono) linea(`Tel: ${telefono}`);
    partes.push(ALIGN_LEFT);
    sep();
    linea(`Pedido ID: ${String(pedidoId || '').slice(0, 8)}`);
    linea(`Fecha pedido: ${formatFecha(fechaPedido)}`);
    partes.push(BOLD_ON);
    linea(`Entrega estimada: ${formatFechaEntrega(fechaEntregaEstimada)}`);
    partes.push(BOLD_OFF);
    sep();
    linea(`Cliente: ${clienteNombre || ''}`);
    if (clienteIdentificacion) linea(`Identificacion: ${clienteIdentificacion}`);
    linea(`Telefono: ${clienteTelefono || ''}`);
    sep();

    (items || []).forEach(item => {
        const precioTexto = formatCOP((item.precio || 0) * (item.cantidad || 0));
        formatearFilaProducto(item.cantidad, item.nombre, precioTexto).forEach(linea);
    });

    sep();
    linea(`Total pedido: ${formatCOP(total)}`);
    linea(`Abonado: ${formatCOP(abonado)}`);
    partes.push(BOLD_ON);
    linea(`Saldo pendiente: ${formatCOP(saldoPendiente)}`);
    partes.push(BOLD_OFF);
    sep();
    partes.push(ALIGN_CENTER);
    linea('Presente este comprobante al recoger su pedido.');
    linea('*** NO ES FACTURA DE VENTA ***');
    partes.push(ALIGN_LEFT);
    partes.push(AVANCE_PAPEL(6));
    partes.push(CORTE_PARCIAL);

    return Buffer.concat(partes);
}

module.exports = { construirTicketBuffer, construirTicketPedidoBuffer };
