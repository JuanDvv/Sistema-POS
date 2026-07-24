const TIPOS_GASTO = Object.freeze({
  ADMINISTRATIVO: 'Gastos Administrativos',
  OPERATIVO: 'Operativo',
  INVENTARIO: 'Gasto de Inventario',
  DEVOLUCION: 'Devolución de Producto'
});

// Flujo real: 1) se envía el producto a la empresa/proveedor (stock ya descontado), 2) el
// proveedor hace su auditoría de calidad, 3) informa si el producto regresa a la sucursal
// (PENDIENTE -> DEVUELTA reingresa stock) o se queda con ellos (PENDIENTE -> RECHAZADA, sin cambio).
const ESTADOS_DEVOLUCION = Object.freeze({
  PENDIENTE: 'Pendiente de Respuesta del Proveedor',
  DEVUELTA: 'Regresada a la Sucursal',
  RECHAZADA: 'Rechazada por el Proveedor'
});

// Tipos sin impacto en caja: no suman al total de gastos financieros del período.
function esGastoNoFinanciero(tipo) {
  return tipo === TIPOS_GASTO.INVENTARIO || tipo === TIPOS_GASTO.DEVOLUCION;
}

// Solo administradores/directivos gestionan este tipo (arriendo, servicios, mercancía, aseo, etc.).
function esGastoRestringidoAdministradores(tipo) {
  return tipo === TIPOS_GASTO.ADMINISTRATIVO;
}

// Inventario y Devoluciones descuentan stock mediante el mismo mecanismo de productos afectados.
function requiereAjusteInventario(tipo) {
  return tipo === TIPOS_GASTO.INVENTARIO || tipo === TIPOS_GASTO.DEVOLUCION;
}

function construirDescripcionVencidos(items = []) {
  return items
    .map((item) => {
      const nombre = item?.nombre || 'Producto';
      const cantidad = Number(item?.cantidad || 0);
      const valor = Number(item?.valor || 0);
      return `${nombre} x${cantidad} - valor ${valor.toLocaleString('es-CO')}`;
    })
    .join(' | ');
}

module.exports = {
  TIPOS_GASTO,
  ESTADOS_DEVOLUCION,
  esGastoNoFinanciero,
  esGastoRestringidoAdministradores,
  requiereAjusteInventario,
  construirDescripcionVencidos
};
