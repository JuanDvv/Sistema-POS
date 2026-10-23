const { v4: uuidv4 } = require('uuid');
const { obtenerPool, ejecutarQuery } = require('../db/postgresClient');
const { registrarAuditoriaRemota } = require('./authRepository');
const { obtenerSoloFechaWallClock, obtenerFechaWallClock } = require('../../domain/shared/clock');
const { calcularResumenFinancieroDia } = require('../../domain/reportes/reporteDiarioDomain');

const SQL_FECHA_BOGOTA = `(
    CASE
        WHEN fecha::text ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN fecha::text
        WHEN fecha::text ~ '(Z|[+-]\\d{2}(:?\\d{2})?)$' THEN TO_CHAR((fecha::timestamptz AT TIME ZONE 'America/Bogota'), 'YYYY-MM-DD')
        ELSE SUBSTRING(REPLACE(fecha::text, 'T', ' '), 1, 10)
    END
)`;

function sqlFechaColumna(aliasColumna) {
    return SQL_FECHA_BOGOTA.replace(/fecha/g, aliasColumna);
}

function describirCambiosProductos(detallesOriginales, carritoNuevo) {
    const antes = new Map(detallesOriginales.map(d => [d.producto_id, { nombre: d.nombre || d.producto_id, cantidad: Number(d.cantidad) }]));
    const despues = new Map(carritoNuevo.map(i => [i.id, { nombre: i.nombre || i.id, cantidad: Number(i.cantidad) }]));

    const cambios = [];
    for (const [id, item] of despues) {
        const previo = antes.get(id);
        if (!previo) cambios.push(`+${item.nombre} (x${item.cantidad})`);
        else if (previo.cantidad !== item.cantidad) cambios.push(`${item.nombre} (x${previo.cantidad}->x${item.cantidad})`);
    }
    for (const [id, item] of antes) {
        if (!despues.has(id)) cambios.push(`-${item.nombre} (x${item.cantidad})`);
    }
    return cambios.length > 0 ? cambios.join(', ') : 'sin cambios';
}

async function buscarGastoDomicilioTx(client, { ventaId, sucursalId, fecha }) {
    const porVentaId = await client.query(
        `SELECT id, monto
         FROM "gastos"
         WHERE venta_id = $1
           AND descripcion = 'Domicilio (Descuento de Caja)'
           AND deleted_at IS NULL
         LIMIT 1`,
        [ventaId]
    );
    if (porVentaId.rowCount > 0) {
        return porVentaId.rows[0];
    }

    const porFecha = await client.query(
        `SELECT id, monto
         FROM "gastos"
         WHERE venta_id IS NULL
           AND sucursal_id = $1
           AND fecha = $2
           AND descripcion = 'Domicilio (Descuento de Caja)'
           AND deleted_at IS NULL
         LIMIT 1`,
        [sucursalId, fecha]
    );
    if (porFecha.rowCount > 0) {
        const gasto = porFecha.rows[0];
        await client.query(
            `UPDATE "gastos" SET venta_id = $1, updated_at = NOW() WHERE id = $2`,
            [ventaId, gasto.id]
        );
        return gasto;
    }

    return null;
}

async function obtenerReporteDiario({ sucursalId, fecha }) {
    const ventasRes = await ejecutarQuery(
        `SELECT v.id,
                v.sucursal_id,
                v.fecha,
                v.metodo_pago,
                v.total,
                COALESCE(v.es_credito, 0) AS es_credito,
                v.cliente_id,
                cli.nombre AS cliente_nombre,
                CASE WHEN ped.id IS NOT NULL THEN 1 ELSE 0 END AS es_pedido,
                ped.id AS pedido_id,
                COALESCE(
                    STRING_AGG(
                        CASE WHEN dv.id IS NOT NULL THEN COALESCE(p.nombre, dv.producto_id) || ' (x' || dv.cantidad || ')' END,
                        ', '
                    ),
                    ''
                ) AS productos_vendidos,
                COALESCE(SUM(CASE WHEN dv.id IS NOT NULL THEN dv.cantidad * dv.precio_unitario ELSE 0 END), 0) AS subtotal_productos,
                COALESCE((
                    SELECT g.monto
                    FROM "gastos" g
                    WHERE g.venta_id = v.id
                      AND g.descripcion = 'Domicilio (Descuento de Caja)'
                      AND g.deleted_at IS NULL
                    LIMIT 1
                ), 0) AS valor_domicilio
         FROM "ventas" v
         LEFT JOIN "detalle_ventas" dv
           ON v.id = dv.venta_id AND dv.deleted_at IS NULL
         LEFT JOIN "productos" p
           ON dv.producto_id = p.id
         LEFT JOIN "clientes" cli
           ON v.cliente_id = cli.id
         LEFT JOIN "pedidos" ped
           ON ped.venta_id = v.id AND ped.deleted_at IS NULL
         WHERE v.sucursal_id = $1
           AND v.deleted_at IS NULL
           AND ${sqlFechaColumna('v.fecha')} = $2
         GROUP BY v.id, cli.nombre, ped.id
         ORDER BY v.fecha DESC`,
        [sucursalId, fecha]
    );

    const gastosRes = await ejecutarQuery(
        `SELECT id,
                sucursal_id,
                tipo,
                descripcion,
                monto,
                fecha,
                COALESCE(metodo_pago, 'Efectivo') AS metodo_pago,
                estado,
                venta_id
         FROM "gastos"
         WHERE sucursal_id = $1
           AND deleted_at IS NULL
           AND ${sqlFechaColumna('fecha')} = $2
         ORDER BY fecha DESC`,
        [sucursalId, fecha]
    );

    let abonosPedido = [];
    try {
        const abonosRes = await ejecutarQuery(
            `SELECT ap.id, ap.monto, ap.metodo_pago, ap.fecha, p.id AS pedido_id
             FROM "abonos_pedido" ap
             JOIN "pedidos" p ON ap.pedido_id = p.id
             WHERE p.sucursal_id = $1
               AND ap.deleted_at IS NULL
               AND p.deleted_at IS NULL
               AND ${sqlFechaColumna('ap.fecha')} = $2
             ORDER BY ap.fecha DESC`,
            [sucursalId, fecha]
        );
        abonosPedido = abonosRes.rows;
    } catch (_) {
        abonosPedido = [];
    }

    const resumen = calcularResumenFinancieroDia({
        ventas: ventasRes.rows,
        gastos: gastosRes.rows,
        abonosPedido
    });

    return {
        fecha,
        sucursalId,
        resumen,
        ventas: ventasRes.rows,
        gastos: gastosRes.rows,
        abonosPedido
    };
}

async function obtenerDetalleVentaPorId(ventaId) {
    const ventaRes = await ejecutarQuery(
        `SELECT id, sucursal_id, fecha, metodo_pago, total, COALESCE(es_credito, 0) AS es_credito, cliente_id
         FROM "ventas"
         WHERE id = $1 AND deleted_at IS NULL
         LIMIT 1`,
        [ventaId]
    );
    if (ventaRes.rowCount === 0) {
        throw new Error('No se encontró la venta especificada.');
    }
    const venta = ventaRes.rows[0];

    const detalleRes = await ejecutarQuery(
        `SELECT dv.id,
                dv.producto_id,
                dv.cantidad,
                dv.precio_unitario,
                COALESCE(p.nombre, dv.producto_id) AS nombre
         FROM "detalle_ventas" dv
         LEFT JOIN "productos" p ON dv.producto_id = p.id
         WHERE dv.venta_id = $1 AND dv.deleted_at IS NULL
         ORDER BY p.nombre ASC`,
        [ventaId]
    );

    const domRes = await ejecutarQuery(
        `SELECT monto
         FROM "gastos"
         WHERE (venta_id = $1 OR (venta_id IS NULL AND sucursal_id = $2 AND fecha = $3))
           AND descripcion = 'Domicilio (Descuento de Caja)'
           AND deleted_at IS NULL
         LIMIT 1`,
        [ventaId, venta.sucursal_id, venta.fecha]
    );

    const valorDomicilio = domRes.rowCount > 0
        ? Number(domRes.rows[0].monto || 0)
        : Math.max(0, Number(venta.total || 0) - detalleRes.rows.reduce((s, d) => s + (Number(d.cantidad) * Number(d.precio_unitario)), 0));

    return {
        venta,
        detalle: detalleRes.rows,
        valorDomicilio
    };
}

async function editarVentaEnReporte({ ventaId, datos, usuario }) {
    const pool = obtenerPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const ventaOrigRes = await client.query(
            `SELECT id, sucursal_id, fecha, metodo_pago, total, es_credito, cliente_id
             FROM "ventas"
             WHERE id = $1 AND deleted_at IS NULL
             FOR UPDATE`,
            [ventaId]
        );
        if (ventaOrigRes.rowCount === 0) {
            throw new Error('No se encontró la venta especificada.');
        }
        const ventaOriginal = ventaOrigRes.rows[0];
        const sucursalId = ventaOriginal.sucursal_id;

        const detallesOrigRes = await client.query(
            `SELECT dv.id, dv.producto_id, dv.cantidad, COALESCE(p.nombre, dv.producto_id) AS nombre
             FROM "detalle_ventas" dv
             LEFT JOIN "productos" p ON dv.producto_id = p.id
             WHERE dv.venta_id = $1 AND dv.deleted_at IS NULL`,
            [ventaId]
        );
        const detallesOriginales = detallesOrigRes.rows;

        for (const det of detallesOriginales) {
            const movId = uuidv4();
            await client.query(
                `SELECT public.aplicar_movimiento_inventario($1, $2, $3, $4, $5, $6, $7, NOW())`,
                [movId, det.producto_id, sucursalId, 'EDICION_VENTA', Number(det.cantidad), ventaId, usuario.username]
            );
            await client.query(
                `UPDATE "detalle_ventas"
                 SET deleted_at = NOW(), updated_at = NOW()
                 WHERE id = $1`,
                [det.id]
            );
        }

        for (const item of datos.carrito) {
            const stockRes = await client.query(
                `SELECT stock FROM "inventario_sucursal" WHERE producto_id = $1 AND sucursal_id = $2`,
                [item.id, sucursalId]
            );
            const disponible = Number(stockRes.rows[0]?.stock || 0);
            if (item.cantidad > disponible) {
                throw new Error(`Stock insuficiente para "${item.nombre}". Disponible: ${disponible}, solicitado: ${item.cantidad}.`);
            }
        }

        for (const item of datos.carrito) {
            const detId = uuidv4();
            await client.query(
                `INSERT INTO "detalle_ventas" (id, venta_id, producto_id, cantidad, precio_unitario, updated_at, deleted_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NULL)`,
                [detId, ventaId, item.id, item.cantidad, item.precio]
            );

            const movId = uuidv4();
            await client.query(
                `SELECT public.aplicar_movimiento_inventario($1, $2, $3, $4, $5, $6, $7, NOW())`,
                [movId, item.id, sucursalId, 'EDICION_VENTA', -Number(item.cantidad), ventaId, usuario.username]
            );
        }

        await client.query(
            `UPDATE "ventas"
             SET total = $1,
                 metodo_pago = $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [datos.total, datos.metodoPago, ventaId]
        );

        const gastoDomicilio = await buscarGastoDomicilioTx(client, {
            ventaId,
            sucursalId,
            fecha: ventaOriginal.fecha
        });

        if (datos.valorDomicilio > 0) {
            if (gastoDomicilio) {
                await client.query(
                    `UPDATE "gastos"
                     SET monto = $1, updated_at = NOW()
                     WHERE id = $2`,
                    [datos.valorDomicilio, gastoDomicilio.id]
                );
            } else {
                const nuevoGastoId = uuidv4();
                await client.query(
                    `INSERT INTO "gastos" (id, sucursal_id, tipo, descripcion, monto, fecha, metodo_pago, venta_id, updated_at, deleted_at)
                     VALUES ($1, $2, 'Operativo', 'Domicilio (Descuento de Caja)', $3, $4, 'Efectivo', $5, NOW(), NULL)`,
                    [nuevoGastoId, sucursalId, datos.valorDomicilio, ventaOriginal.fecha, ventaId]
                );
            }
        } else if (gastoDomicilio) {
            await client.query(
                `UPDATE "gastos"
                 SET deleted_at = NOW(), updated_at = NOW()
                 WHERE id = $1`,
                [gastoDomicilio.id]
            );
        }

        await client.query('COMMIT');

        const domicilioAntes = gastoDomicilio ? Number(gastoDomicilio.monto) : 0;
        const cambiosProductos = describirCambiosProductos(detallesOriginales, datos.carrito);
        const detallesAuditoria = [
            `Venta ID: ${ventaId}`,
            Number(ventaOriginal.total) !== Number(datos.total) ? `Total: $${ventaOriginal.total} -> $${datos.total}` : `Total: $${datos.total}`,
            ventaOriginal.metodo_pago !== datos.metodoPago ? `Método: ${ventaOriginal.metodo_pago} -> ${datos.metodoPago}` : `Método: ${datos.metodoPago}`,
            domicilioAntes !== datos.valorDomicilio ? `Domicilio: $${domicilioAntes} -> $${datos.valorDomicilio}` : null,
            `Cambios prods: [${cambiosProductos}]`
        ].filter(Boolean).join(' - ');

        await registrarAuditoriaRemota({
            usuario: usuario.username,
            rol: usuario.rol,
            sucursalId,
            accion: 'Editar Venta (Web Móvil)',
            detalles: detallesAuditoria
        });

        return { id: ventaId };
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}

async function eliminarVentaEnReporte({ ventaId, usuario }) {
    const pool = obtenerPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const ventaRes = await client.query(
            `SELECT id, sucursal_id, total, fecha
             FROM "ventas"
             WHERE id = $1 AND deleted_at IS NULL
             FOR UPDATE`,
            [ventaId]
        );
        if (ventaRes.rowCount === 0) {
            throw new Error('No se encontró la venta especificada.');
        }
        const venta = ventaRes.rows[0];

        const detallesRes = await client.query(
            `SELECT dv.id, dv.producto_id, dv.cantidad, COALESCE(p.nombre, dv.producto_id) AS nombre
             FROM "detalle_ventas" dv
             LEFT JOIN "productos" p ON dv.producto_id = p.id
             WHERE dv.venta_id = $1 AND dv.deleted_at IS NULL`,
            [ventaId]
        );

        for (const det of detallesRes.rows) {
            const movId = uuidv4();
            await client.query(
                `SELECT public.aplicar_movimiento_inventario($1, $2, $3, $4, $5, $6, $7, NOW())`,
                [movId, det.producto_id, venta.sucursal_id, 'ANULACION', Number(det.cantidad), ventaId, usuario.username]
            );
            await client.query(
                `UPDATE "detalle_ventas" SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
                [det.id]
            );
        }

        const gastoDomicilio = await buscarGastoDomicilioTx(client, {
            ventaId,
            sucursalId: venta.sucursal_id,
            fecha: venta.fecha
        });
        if (gastoDomicilio) {
            await client.query(
                `UPDATE "gastos" SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
                [gastoDomicilio.id]
            );
        }

        await client.query(
            `UPDATE "ventas" SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [ventaId]
        );

        await client.query('COMMIT');

        const resumenProds = detallesRes.rows.map(d => `${d.nombre} (x${d.cantidad})`).join(', ');
        await registrarAuditoriaRemota({
            usuario: usuario.username,
            rol: usuario.rol,
            sucursalId: venta.sucursal_id,
            accion: 'Eliminar Venta (Web Móvil)',
            detalles: `Venta ID: ${ventaId} - Reintegrado Total: $${venta.total} - Prods: [${resumenProds}]`
        });

        return { id: ventaId };
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}

function construirTimestampParaDia(fechaDia) {
    const hoy = obtenerSoloFechaWallClock();
    if (fechaDia === hoy) {
        return obtenerFechaWallClock();
    }
    return `${fechaDia} 12:00:00`;
}

async function crearGastoEnReporte({ sucursalId, fechaDia, datos, usuario }) {
    if (fechaDia !== obtenerSoloFechaWallClock() && usuario.rol !== 'Administrador') {
        throw new Error('Solo un Administrador puede registrar gastos en fechas anteriores.');
    }
    const id = uuidv4();
    const fechaRegistro = construirTimestampParaDia(fechaDia);

    await ejecutarQuery(
        `INSERT INTO "gastos" (id, sucursal_id, tipo, descripcion, monto, fecha, metodo_pago, updated_at, deleted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NULL)`,
        [id, sucursalId, datos.tipo, datos.descripcion, datos.monto, fechaRegistro, datos.metodoPago]
    );

    await registrarAuditoriaRemota({
        usuario: usuario.username,
        rol: usuario.rol,
        sucursalId,
        accion: 'Registrar Gasto (Web Móvil)',
        detalles: `Gasto ID: ${id} - Tipo: ${datos.tipo} - Monto: $${datos.monto} - Método: ${datos.metodoPago} - Desc: ${datos.descripcion}`
    });

    return { id };
}

async function editarGastoEnReporte({ gastoId, datos, usuario }) {
    const previoRes = await ejecutarQuery(
        `SELECT id, sucursal_id, tipo, descripcion, monto, COALESCE(metodo_pago, 'Efectivo') AS metodo_pago, ${sqlFechaColumna('fecha')} AS fecha_dia
         FROM "gastos"
         WHERE id = $1 AND deleted_at IS NULL
         LIMIT 1`,
        [gastoId]
    );
    if (previoRes.rowCount === 0) {
        throw new Error('El gasto no existe o fue eliminado.');
    }
    const previo = previoRes.rows[0];

    if (previo.descripcion === 'Domicilio (Descuento de Caja)') {
        throw new Error('Este gasto se gestiona automáticamente desde la venta asociada y no se puede editar aquí.');
    }
    if (usuario.rol !== 'Administrador' && previo.fecha_dia !== obtenerSoloFechaWallClock()) {
        throw new Error('Solo un Administrador puede editar un gasto de un día anterior.');
    }

    await ejecutarQuery(
        `UPDATE "gastos"
         SET tipo = $1,
             descripcion = $2,
             monto = $3,
             metodo_pago = $4,
             updated_at = NOW()
         WHERE id = $5`,
        [datos.tipo, datos.descripcion, datos.monto, datos.metodoPago, gastoId]
    );

    const detallesAuditoria = [
        `Gasto ID: ${gastoId}`,
        Number(previo.monto) !== Number(datos.monto) ? `Monto: $${previo.monto} -> $${datos.monto}` : `Monto: $${datos.monto}`,
        previo.tipo !== datos.tipo ? `Tipo: ${previo.tipo} -> ${datos.tipo}` : `Tipo: ${datos.tipo}`,
        previo.metodo_pago !== datos.metodoPago ? `Método: ${previo.metodo_pago} -> ${datos.metodoPago}` : `Método: ${datos.metodoPago}`,
        previo.descripcion !== datos.descripcion ? `Desc: ${previo.descripcion} -> ${datos.descripcion}` : `Desc: ${datos.descripcion}`
    ].join(' - ');

    await registrarAuditoriaRemota({
        usuario: usuario.username,
        rol: usuario.rol,
        sucursalId: previo.sucursal_id,
        accion: 'Editar Gasto (Web Móvil)',
        detalles: detallesAuditoria
    });

    return { id: gastoId };
}

async function eliminarGastoEnReporte({ gastoId, usuario }) {
    const pool = obtenerPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const previoRes = await client.query(
            `SELECT id, sucursal_id, tipo, descripcion, monto, ${sqlFechaColumna('fecha')} AS fecha_dia
             FROM "gastos"
             WHERE id = $1 AND deleted_at IS NULL
             FOR UPDATE`,
            [gastoId]
        );
        if (previoRes.rowCount === 0) {
            throw new Error('El gasto no existe o ya fue eliminado.');
        }
        const gasto = previoRes.rows[0];

        if (gasto.descripcion === 'Domicilio (Descuento de Caja)') {
            throw new Error('Este gasto se gestiona automáticamente desde la venta asociada y no se puede borrar aquí.');
        }
        if (usuario.rol !== 'Administrador' && gasto.fecha_dia !== obtenerSoloFechaWallClock()) {
            throw new Error('Solo un Administrador puede borrar un gasto de un día anterior.');
        }

        if (gasto.tipo === 'Gasto de Inventario' || gasto.tipo === 'Devolución de Producto') {
            const movsRes = await client.query(
                `SELECT producto_id, sucursal_id, cantidad
                 FROM "movimientos_inventario"
                 WHERE referencia_id = $1 AND deleted_at IS NULL`,
                [gastoId]
            );
            for (const mov of movsRes.rows) {
                const revId = uuidv4();
                await client.query(
                    `SELECT public.aplicar_movimiento_inventario($1, $2, $3, $4, $5, $6, $7, NOW())`,
                    [revId, mov.producto_id, mov.sucursal_id, 'REVERSION_ELIMINACION_GASTO', -Number(mov.cantidad), gastoId, usuario.username]
                );
            }
        }

        await client.query(
            `UPDATE "gastos" SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [gastoId]
        );

        await client.query('COMMIT');

        await registrarAuditoriaRemota({
            usuario: usuario.username,
            rol: usuario.rol,
            sucursalId: gasto.sucursal_id,
            accion: 'Eliminar Gasto (Web Móvil)',
            detalles: `Gasto ID: ${gastoId} - Monto: $${gasto.monto} - Desc: ${gasto.descripcion}`
        });

        return { id: gastoId };
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    obtenerReporteDiario,
    obtenerDetalleVentaPorId,
    editarVentaEnReporte,
    eliminarVentaEnReporte,
    crearGastoEnReporte,
    editarGastoEnReporte,
    eliminarGastoEnReporte
};
