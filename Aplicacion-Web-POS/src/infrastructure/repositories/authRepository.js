const { v4: uuidv4 } = require('uuid');
const { ejecutarQuery } = require('../db/postgresClient');
const { obtenerFechaWallClock } = require('../../domain/shared/clock');

async function buscarUsuarioPorUsername(username) {
    const res = await ejecutarQuery(
        `SELECT id, username, password, rol, updated_at, deleted_at
         FROM "usuarios"
         WHERE LOWER(username) = LOWER($1) AND deleted_at IS NULL
         LIMIT 1`,
        [username]
    );
    return res.rows[0] || null;
}

async function registrarAuditoriaRemota({ usuario, rol, sucursalId, accion, detalles }) {
    try {
        const id = uuidv4();
        const fecha = obtenerFechaWallClock();
        const detallesTexto = typeof detalles === 'object' ? JSON.stringify(detalles) : String(detalles || '');
        await ejecutarQuery(
            `INSERT INTO "auditoria" (id, fecha, usuario, rol, sucursal_id, accion, detalles)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING`,
            [id, fecha, usuario || 'Sistema', rol || 'Sin Rol', sucursalId || 'Web-Movil', accion, detallesTexto]
        );
    } catch (err) {
        console.error('[authRepository] No se pudo escribir en auditoria:', err.message);
    }
}

module.exports = {
    buscarUsuarioPorUsername,
    registrarAuditoriaRemota
};

