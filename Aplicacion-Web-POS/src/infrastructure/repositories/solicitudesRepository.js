const { ejecutarQuery } = require('../db/postgresClient');

async function listarSolicitudesVenta({ estado = '', usuario = '', limite = 50, offset = 0 } = {}) {
    const condiciones = ['deleted_at IS NULL'];
    const valores = [];
    let idx = 1;

    if (estado && estado.trim()) {
        condiciones.push(`estado = $${idx++}`);
        valores.push(estado.trim());
    }

    if (usuario && usuario.trim()) {
        condiciones.push(`LOWER(usuario_solicitante) = LOWER($${idx++})`);
        valores.push(usuario.trim());
    }

    const whereClause = `WHERE ${condiciones.join(' AND ')}`;
    const limitVal = Math.min(100, Math.max(1, Number(limite) || 50));
    const offsetVal = Math.max(0, Number(offset) || 0);

    const sqlCount = `SELECT COUNT(*) AS total FROM "solicitudes_venta" ${whereClause}`;
    const sqlData = `
        SELECT id, tipo, venta_id, sucursal_id, fecha_venta, datos, estado,
               usuario_solicitante, fecha_solicitud, usuario_revisor, fecha_revision, motivo_rechazo
        FROM "solicitudes_venta"
        ${whereClause}
        ORDER BY fecha_solicitud DESC
        LIMIT $${idx++} OFFSET $${idx++}
    `;

    const [countRes, dataRes] = await Promise.all([
        ejecutarQuery(sqlCount, valores),
        ejecutarQuery(sqlData, [...valores, limitVal, offsetVal])
    ]);

    return {
        solicitudes: dataRes.rows,
        total: Number(countRes.rows[0]?.total || 0)
    };
}

async function listarSolicitudesGasto({ estado = '', usuario = '', limite = 50, offset = 0 } = {}) {
    const condiciones = ['deleted_at IS NULL'];
    const valores = [];
    let idx = 1;

    if (estado && estado.trim()) {
        condiciones.push(`estado = $${idx++}`);
        valores.push(estado.trim());
    }

    if (usuario && usuario.trim()) {
        condiciones.push(`LOWER(usuario_solicitante) = LOWER($${idx++})`);
        valores.push(usuario.trim());
    }

    const whereClause = `WHERE ${condiciones.join(' AND ')}`;
    const limitVal = Math.min(100, Math.max(1, Number(limite) || 50));
    const offsetVal = Math.max(0, Number(offset) || 0);

    const sqlCount = `SELECT COUNT(*) AS total FROM "solicitudes_gasto" ${whereClause}`;
    const sqlData = `
        SELECT id, sucursal_id, fecha_gasto, datos, estado,
               usuario_solicitante, fecha_solicitud, usuario_revisor, fecha_revision, motivo_rechazo
        FROM "solicitudes_gasto"
        ${whereClause}
        ORDER BY fecha_solicitud DESC
        LIMIT $${idx++} OFFSET $${idx++}
    `;

    const [countRes, dataRes] = await Promise.all([
        ejecutarQuery(sqlCount, valores),
        ejecutarQuery(sqlData, [...valores, limitVal, offsetVal])
    ]);

    return {
        solicitudes: dataRes.rows,
        total: Number(countRes.rows[0]?.total || 0)
    };
}

async function listarOperadores() {
    const sql = `
        SELECT id, username, rol
        FROM "usuarios"
        WHERE deleted_at IS NULL AND (LOWER(rol) LIKE '%operad%' OR rol = 'Operador')
        ORDER BY username ASC
    `;
    const res = await ejecutarQuery(sql);
    return res.rows;
}

module.exports = {
    listarSolicitudesVenta,
    listarSolicitudesGasto,
    listarOperadores
};

