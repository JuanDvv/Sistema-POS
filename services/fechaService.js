// SRP: utilidades de fecha para el módulo de "Ventas de Fecha Anterior". Funciones puras, sin dependencias.

function obtenerFechaHoyYYYYMMDD() {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function esFechaAnteriorValida(fechaDia) {
    if (!fechaDia || !/^\d{4}-\d{2}-\d{2}$/.test(fechaDia)) return false;
    return fechaDia < obtenerFechaHoyYYYYMMDD();
}

// Convierte una fecha 'YYYY-MM-DD' (elegida por el usuario) al mediodía local en un ISO string,
// para evitar que la conversión a UTC/localtime la corra a otro día calendario.
function construirFechaISODeDia(fechaDia) {
    return new Date(`${fechaDia}T12:00:00`).toISOString();
}

module.exports = { obtenerFechaHoyYYYYMMDD, esFechaAnteriorValida, construirFechaISODeDia };
