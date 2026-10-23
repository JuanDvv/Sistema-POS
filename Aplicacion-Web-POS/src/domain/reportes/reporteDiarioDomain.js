const TIPOS_GASTO_VALIDOS = [
    'Operativo',
    'Gastos Administrativos',
    'Gasto de Inventario',
    'Devolución de Producto'
];

function validarFechaReporte(fechaStr) {
    const limpia = String(fechaStr || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(limpia)) {
        throw new Error('Formato de fecha inválido. Use YYYY-MM-DD.');
    }
    return limpia;
}

function normalizarMetodoPagoVenta({ metodoPago, efectivoMixto, transferenciaMixto, total }) {
    const metodo = String(metodoPago || '').trim();
    if (!metodo) {
        throw new Error('Debe seleccionar un método de pago.');
    }

    if (metodo === 'Mixto' || metodo.startsWith('Mixto')) {
        const ef = Number(efectivoMixto || 0);
        const tr = Number(transferenciaMixto || 0);
        if (!Number.isFinite(ef) || ef < 0 || !Number.isFinite(tr) || tr < 0) {
            throw new Error('Los montos de pago mixto deben ser números válidos.');
        }
        if (Math.abs((ef + tr) - Number(total)) > 1) {
            throw new Error(`La suma de Efectivo ($${ef}) + Transferencia ($${tr}) debe ser igual al total de la venta ($${total}).`);
        }
        return `Mixto (Efectivo: ${ef}, Transferencia: ${tr})`;
    }

    return metodo;
}

function validarEdicionVenta(payload = {}) {
    const itemsRaw = Array.isArray(payload.carrito) ? payload.carrito : [];
    if (itemsRaw.length === 0) {
        throw new Error('La venta debe tener al menos un producto.');
    }

    const consolidados = new Map();
    for (const item of itemsRaw) {
        const id = String(item.id || item.producto_id || '').trim();
        const nombre = String(item.nombre || id).trim();
        const cantidad = Number(item.cantidad);
        const precio = Number(item.precio ?? item.precio_unitario);

        if (!id) {
            throw new Error('Producto inválido en el detalle de la venta.');
        }
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
            throw new Error(`La cantidad para "${nombre}" debe ser un entero mayor a 0.`);
        }
        if (!Number.isFinite(precio) || precio < 0) {
            throw new Error(`El precio para "${nombre}" no es válido.`);
        }

        if (consolidados.has(id)) {
            const existente = consolidados.get(id);
            existente.cantidad += cantidad;
        } else {
            consolidados.set(id, { id, nombre, cantidad, precio });
        }
    }

    const carrito = Array.from(consolidados.values());
    const subtotalProductos = carrito.reduce((acc, it) => acc + (it.cantidad * it.precio), 0);
    const valorDomicilio = Number(payload.valorDomicilio || 0);
    if (!Number.isFinite(valorDomicilio) || valorDomicilio < 0) {
        throw new Error('El valor de domicilio no puede ser negativo.');
    }

    const total = subtotalProductos + valorDomicilio;
    const metodoPagoFinal = normalizarMetodoPagoVenta({
        metodoPago: payload.metodoPago,
        efectivoMixto: payload.efectivoMixto,
        transferenciaMixto: payload.transferenciaMixto,
        total
    });

    return {
        carrito,
        subtotalProductos,
        valorDomicilio,
        total,
        metodoPago: metodoPagoFinal
    };
}

function validarDatosGasto(payload = {}) {
    const tipo = String(payload.tipo || 'Operativo').trim();
    if (!TIPOS_GASTO_VALIDOS.includes(tipo)) {
        throw new Error('Tipo de gasto no válido.');
    }

    const descripcion = String(payload.descripcion || '').trim();
    if (!descripcion) {
        throw new Error('La descripción del gasto es obligatoria.');
    }
    if (descripcion.toLowerCase() === 'domicilio (descuento de caja)') {
        throw new Error('El gasto de domicilio se gestiona automáticamente desde la venta asociada.');
    }

    const monto = Number(payload.monto);
    if (!Number.isFinite(monto) || monto < 0) {
        throw new Error('El monto del gasto debe ser un número válido mayor o igual a 0.');
    }

    const metodoPago = String(payload.metodoPago || 'Efectivo').trim() || 'Efectivo';

    return {
        tipo,
        descripcion,
        monto,
        metodoPago
    };
}

function extraerMontosMetodoPago(metodoPago, total) {
    const montoTotal = Number(total || 0);
    const mp = String(metodoPago || '');
    if (mp.startsWith('Mixto')) {
        const matchEf = mp.match(/Efectivo:\s*(\d+(?:\.\d+)?)/i);
        const matchTr = mp.match(/Transferencia:\s*(\d+(?:\.\d+)?)/i);
        return {
            efectivo: matchEf ? Number(matchEf[1]) : 0,
            transferencia: matchTr ? Number(matchTr[1]) : 0,
            credito: 0
        };
    }
    if (mp.toLowerCase().includes('transferencia')) {
        return { efectivo: 0, transferencia: montoTotal, credito: 0 };
    }
    if (mp.toLowerCase().includes('crédito') || mp.toLowerCase().includes('credito')) {
        return { efectivo: 0, transferencia: 0, credito: montoTotal };
    }
    return { efectivo: montoTotal, transferencia: 0, credito: 0 };
}

function calcularResumenFinancieroDia({ ventas = [], gastos = [], abonosPedido = [] }) {
    let ventasEfectivo = 0;
    let ventasTransferencia = 0;
    let ventasCredito = 0;

    for (const v of ventas) {
        if (Number(v.es_pedido) === 1) continue;
        if (Number(v.es_credito) === 1) {
            ventasCredito += Number(v.total || 0);
            continue;
        }
        const desglose = extraerMontosMetodoPago(v.metodo_pago, v.total);
        ventasEfectivo += desglose.efectivo;
        ventasTransferencia += desglose.transferencia;
        ventasCredito += desglose.credito;
    }

    for (const ab of abonosPedido) {
        const desglose = extraerMontosMetodoPago(ab.metodo_pago, ab.monto);
        ventasEfectivo += desglose.efectivo;
        ventasTransferencia += desglose.transferencia;
    }

    let gastosEfectivo = 0;
    let gastosTransferencia = 0;
    let gastosNoFinancieros = 0;

    for (const g of gastos) {
        const esNoFinanciero = g.tipo === 'Gasto de Inventario' || g.tipo === 'Devolución de Producto';
        const monto = Number(g.monto || 0);
        if (esNoFinanciero) {
            gastosNoFinancieros += monto;
            continue;
        }
        if (String(g.metodo_pago || 'Efectivo').toLowerCase().includes('transferencia')) {
            gastosTransferencia += monto;
        } else {
            gastosEfectivo += monto;
        }
    }

    const totalIngresosRecibidos = ventasEfectivo + ventasTransferencia;
    const totalGastosCaja = gastosEfectivo + gastosTransferencia;
    const efectivoEnCaja = ventasEfectivo - gastosEfectivo;

    return {
        ventasEfectivo,
        ventasTransferencia,
        ventasCredito,
        totalIngresosRecibidos,
        gastosEfectivo,
        gastosTransferencia,
        gastosNoFinancieros,
        totalGastosCaja,
        efectivoEnCaja
    };
}

module.exports = {
    TIPOS_GASTO_VALIDOS,
    validarFechaReporte,
    validarEdicionVenta,
    validarDatosGasto,
    extraerMontosMetodoPago,
    calcularResumenFinancieroDia
};

