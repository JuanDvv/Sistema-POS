function validarDatosProducto(payload = {}, esCreacion = false) {
    const nombre = String(payload.nombre || '').trim();
    if (!nombre) {
        throw new Error('El nombre del producto es obligatorio.');
    }

    const descripcion = String(payload.descripcion || '').trim();
    const precio = Number(payload.precio);
    if (!Number.isFinite(precio) || precio < 0) {
        throw new Error('El precio debe ser un número válido mayor o igual a 0.');
    }

    const stockMinimo = payload.stockMinimo === undefined || payload.stockMinimo === ''
        ? 5
        : Number(payload.stockMinimo);
    if (!Number.isInteger(stockMinimo) || stockMinimo < 0) {
        throw new Error('El stock mínimo debe ser un número entero mayor o igual a 0.');
    }

    const categoriaId = payload.categoriaId ? String(payload.categoriaId).trim() : null;
    const sucursalId = payload.sucursalId ? String(payload.sucursalId).trim() : null;

    let stock = null;
    if (payload.stock !== undefined && payload.stock !== null && payload.stock !== '') {
        stock = Number(payload.stock);
        if (!Number.isInteger(stock) || stock < 0) {
            throw new Error('El stock debe ser un número entero mayor o igual a 0.');
        }
    } else if (esCreacion) {
        stock = 0;
    }

    if (esCreacion && !sucursalId) {
        throw new Error('Debe seleccionar una sucursal activa.');
    }

    return {
        nombre,
        descripcion,
        precio,
        stockMinimo,
        categoriaId,
        sucursalId,
        stock
    };
}

function validarAbastecimiento(payload = {}) {
    const sucursalId = String(payload.sucursalId || '').trim();
    if (!sucursalId) {
        throw new Error('Debe seleccionar una sucursal activa para abastecer.');
    }

    const cantidad = Number(payload.cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error('La cantidad a abastecer debe ser un entero mayor a 0.');
    }

    return {
        sucursalId,
        cantidad
    };
}

function validarDatosCategoria(payload = {}) {
    const nombre = String(payload.nombre || '').trim();
    if (!nombre) {
        throw new Error('El nombre de la categoría es obligatorio.');
    }
    const categoriaPadreId = payload.categoriaPadreId ? String(payload.categoriaPadreId).trim() : null;
    return {
        nombre,
        categoriaPadreId
    };
}

module.exports = {
    validarDatosProducto,
    validarAbastecimiento,
    validarDatosCategoria
};

