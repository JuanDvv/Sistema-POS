const { ejecutarQuery } = require('../db/postgresClient');

async function listarLogsAuditoria({ limite = 50, offset = 0, busqueda = '', accion = '', usuario = '' } = {}) {
    const condiciones = [];
    const valores = [];
    let idx = 1;

    if (usuario && usuario.trim()) {
        condiciones.push(`LOWER(usuario) = LOWER($${idx++})`);
        valores.push(usuario.trim());
    }

    if (accion && accion.trim()) {
        condiciones.push(`accion = $${idx++}`);
        valores.push(accion.trim());
    }

    if (busqueda && busqueda.trim()) {
        const termino = `%${busqueda.trim()}%`;
        condiciones.push(`(detalles ILIKE $${idx} OR accion ILIKE $${idx} OR usuario ILIKE $${idx})`);
        valores.push(termino);
        idx++;
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    const sqlCount = `SELECT COUNT(*) AS total FROM "auditoria" ${whereClause}`;
    const sqlData = `
        SELECT id, fecha, usuario, rol, sucursal_id, accion, detalles
        FROM "auditoria"
        ${whereClause}
        ORDER BY fecha DESC
        LIMIT $${idx++} OFFSET $${idx++}
    `;

    const limitVal = Math.min(100, Math.max(1, Number(limite) || 50));
    const offsetVal = Math.max(0, Number(offset) || 0);

    const [countRes, dataRes] = await Promise.all([
        ejecutarQuery(sqlCount, valores),
        ejecutarQuery(sqlData, [...valores, limitVal, offsetVal])
    ]);

    const total = Number(countRes.rows[0]?.total || 0);
    return {
        logs: dataRes.rows,
        total
    };
}

module.exports = {
    listarLogsAuditoria
};

