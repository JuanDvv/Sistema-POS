const { v4: uuidv4 } = require('uuid');
const { obtenerPool, ejecutarQuery } = require('../db/postgresClient');
const { registrarAuditoriaRemota } = require('./authRepository');

async function listarCatalogoPorSucursal(sucursalId) {
    const [productosRes, categoriasRes] = await Promise.all([
        ejecutarQuery(
            `SELECT p.id,
                    p.nombre,
                    p.descripcion,
                    p.precio,
                    COALESCE(p.stock_minimo, 5) AS stock_minimo,
                    p.foto_path,
                    p.categoria_id,
                    c.nombre AS categoria_nombre,
                    COALESCE(i.stock, 0) AS stock,
                    COALESCE(i.stock_reservado, 0) AS stock_reservado,
                    p.updated_at
             FROM "productos" p
             LEFT JOIN "inventario_sucursal" i
               ON p.id = i.producto_id AND i.sucursal_id = $1 AND i.deleted_at IS NULL
             LEFT JOIN "categorias" c
               ON p.categoria_id = c.id AND c.deleted_at IS NULL
             WHERE p.deleted_at IS NULL
             ORDER BY p.nombre ASC`,
            [sucursalId || '']
        ),
        ejecutarQuery(
            `SELECT c.id,
                    c.nombre,
                    c.categoria_padre_id,
                    cp.nombre AS padre_nombre,
                    c.updated_at
             FROM "categorias" c
             LEFT JOIN "categorias" cp
               ON c.categoria_padre_id = cp.id AND cp.deleted_at IS NULL
             WHERE c.deleted_at IS NULL
             ORDER BY c.nombre ASC`
        )
    ]);

    return {
        productos: productosRes.rows,
        categorias: categoriasRes.rows
    };
}

async function crearProductoConInventario({ datos, usuario }) {
    const pool = obtenerPool();
    const client = await pool.connect();
    const productoId = 'p-' + uuidv4().substring(0, 8);

    try {
        await client.query('BEGIN');

        await client.query(
            `INSERT INTO "productos" (id, nombre, descripcion, precio, stock_minimo, categoria_id, updated_at, deleted_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NULL)`,
            [productoId, datos.nombre, datos.descripcion, datos.precio, datos.stockMinimo, datos.categoriaId]
        );

        await client.query(
            `INSERT INTO "inventario_sucursal" (producto_id, sucursal_id, stock, stock_reservado, updated_at, deleted_at)
             VALUES ($1, $2, 0, 0, NOW(), NULL)
             ON CONFLICT (producto_id, sucursal_id) DO NOTHING`,
            [productoId, datos.sucursalId]
        );

        if (datos.stock > 0) {
            const movId = uuidv4();
            await client.query(
                `SELECT public.aplicar_movimiento_inventario($1, $2, $3, $4, $5, $6, $7, NOW())`,
                [movId, productoId, datos.sucursalId, 'ENTRADA', datos.stock, productoId, usuario.username]
            );
        }

        await client.query('COMMIT');

        await registrarAuditoriaRemota({
            usuario: usuario.username,
            rol: usuario.rol,
            sucursalId: datos.sucursalId,
            accion: 'Registrar Producto (Web Móvil)',
            detalles: `Nombre: ${datos.nombre} - ID: ${productoId} - Precio: ${datos.precio} - Stock Inicial: ${datos.stock}`
        });

        return { id: productoId };
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}

async function editarProductoConInventario({ productoId, datos, usuario }) {
    const pool = obtenerPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const updateRes = await client.query(
            `UPDATE "productos"
             SET nombre = $1,
                 descripcion = $2,
                 precio = $3,
                 stock_minimo = $4,
                 categoria_id = $5,
                 updated_at = NOW()
             WHERE id = $6 AND deleted_at IS NULL
             RETURNING id`,
            [datos.nombre, datos.descripcion, datos.precio, datos.stockMinimo, datos.categoriaId, productoId]
        );

        if (updateRes.rowCount === 0) {
            throw new Error('El producto no existe o fue eliminado.');
        }

        let deltaReal = 0;
        let stockAnterior = null;

        if (datos.sucursalId && datos.stock !== null) {
            const stockPrevioRes = await client.query(
                `SELECT stock FROM "inventario_sucursal" WHERE producto_id = $1 AND sucursal_id = $2`,
                [productoId, datos.sucursalId]
            );
            stockAnterior = Number(stockPrevioRes.rows[0]?.stock || 0);

            if (datos.stock !== stockAnterior || stockPrevioRes.rowCount === 0) {
                const movId = uuidv4();
                const corrRes = await client.query(
                    `SELECT public.aplicar_correccion_stock($1, $2, $3, $4, $5, $6, NOW()) AS delta`,
                    [movId, productoId, datos.sucursalId, datos.stock, productoId, usuario.username]
                );
                deltaReal = Number(corrRes.rows[0]?.delta || 0);
            }
        }

        await client.query('COMMIT');

        const detalleStock = stockAnterior === null
            ? 'Sin cambio de sucursal'
            : deltaReal !== 0
                ? `Stock: ${stockAnterior} -> ${datos.stock} (${deltaReal > 0 ? '+' : ''}${deltaReal})`
                : `Stock: ${datos.stock} (sin cambios)`;

        await registrarAuditoriaRemota({
            usuario: usuario.username,
            rol: usuario.rol,
            sucursalId: datos.sucursalId || 'Catálogo',
            accion: 'Editar Producto (Web Móvil)',
            detalles: `Nombre: ${datos.nombre} - ID: ${productoId} - Precio: ${datos.precio} - ${detalleStock}`
        });

        return { id: productoId, deltaReal };
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}

async function abastecerStockProducto({ productoId, sucursalId, cantidad, usuario }) {
    const prodRes = await ejecutarQuery(
        `SELECT id, nombre FROM "productos" WHERE id = $1 AND deleted_at IS NULL`,
        [productoId]
    );
    if (prodRes.rowCount === 0) {
        throw new Error('El producto no existe o fue eliminado.');
    }
    const nombreProducto = prodRes.rows[0].nombre;
    const movId = uuidv4();

    await ejecutarQuery(
        `SELECT public.aplicar_movimiento_inventario($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [movId, productoId, sucursalId, 'ABASTECIMIENTO', cantidad, null, usuario.username]
    );

    const stockRes = await ejecutarQuery(
        `SELECT stock FROM "inventario_sucursal" WHERE producto_id = $1 AND sucursal_id = $2`,
        [productoId, sucursalId]
    );
    const nuevoStock = Number(stockRes.rows[0]?.stock || 0);

    await registrarAuditoriaRemota({
        usuario: usuario.username,
        rol: usuario.rol,
        sucursalId,
        accion: 'Abastecer Stock (Web Móvil)',
        detalles: `Producto: ${nombreProducto} (${productoId}) - Cantidad añadida: +${cantidad} - Stock resultante: ${nuevoStock}`
    });

    return { productoId, nuevoStock };
}

async function eliminarProductoSoftDelete({ productoId, sucursalId, usuario }) {
    const res = await ejecutarQuery(
        `UPDATE "productos"
         SET deleted_at = NOW(),
             updated_at = NOW()
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id, nombre`,
        [productoId]
    );
    if (res.rowCount === 0) {
        throw new Error('El producto no existe o ya fue eliminado.');
    }

    await registrarAuditoriaRemota({
        usuario: usuario.username,
        rol: usuario.rol,
        sucursalId: sucursalId || 'Catálogo',
        accion: 'Eliminar Producto (Web Móvil)',
        detalles: `Nombre: ${res.rows[0].nombre} - ID: ${productoId}`
    });

    return { id: productoId };
}

async function guardarCategoria({ categoriaId, datos, usuario }) {
    if (categoriaId) {
        const res = await ejecutarQuery(
            `UPDATE "categorias"
             SET nombre = $1,
                 categoria_padre_id = $2,
                 updated_at = NOW()
             WHERE id = $3 AND deleted_at IS NULL
             RETURNING id`,
            [datos.nombre, datos.categoriaPadreId, categoriaId]
        );
        if (res.rowCount === 0) {
            throw new Error('La categoría no existe.');
        }
        await registrarAuditoriaRemota({
            usuario: usuario.username,
            rol: usuario.rol,
            sucursalId: 'Catálogo',
            accion: 'Editar Categoría (Web Móvil)',
            detalles: `Nombre: ${datos.nombre} - ID: ${categoriaId}`
        });
        return { id: categoriaId };
    }

    const nuevoId = 'cat-' + uuidv4().substring(0, 8);
    await ejecutarQuery(
        `INSERT INTO "categorias" (id, nombre, categoria_padre_id, updated_at, deleted_at)
         VALUES ($1, $2, $3, NOW(), NULL)`,
        [nuevoId, datos.nombre, datos.categoriaPadreId]
    );
    await registrarAuditoriaRemota({
        usuario: usuario.username,
        rol: usuario.rol,
        sucursalId: 'Catálogo',
        accion: 'Crear Categoría (Web Móvil)',
        detalles: `Nombre: ${datos.nombre} - ID: ${nuevoId}`
    });
    return { id: nuevoId };
}

async function eliminarCategoriaSoftDelete({ categoriaId, usuario }) {
    const res = await ejecutarQuery(
        `UPDATE "categorias"
         SET deleted_at = NOW(),
             updated_at = NOW()
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id, nombre`,
        [categoriaId]
    );
    if (res.rowCount === 0) {
        throw new Error('La categoría no existe o ya fue eliminada.');
    }
    await registrarAuditoriaRemota({
        usuario: usuario.username,
        rol: usuario.rol,
        sucursalId: 'Catálogo',
        accion: 'Eliminar Categoría (Web Móvil)',
        detalles: `Nombre: ${res.rows[0].nombre} - ID: ${categoriaId}`
    });
    return { id: categoriaId };
}

module.exports = {
    listarCatalogoPorSucursal,
    crearProductoConInventario,
    editarProductoConInventario,
    abastecerStockProducto,
    eliminarProductoSoftDelete,
    guardarCategoria,
    eliminarCategoriaSoftDelete
};

