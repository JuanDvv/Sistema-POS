const pg = require('pg');
const { obtenerConfiguracionEntorno } = require('../config/envConfig');

if (pg && pg.types) {
    pg.types.setTypeParser(1082, str => str);
    pg.types.setTypeParser(1114, str => str);
    pg.types.setTypeParser(1184, str => str);
}

let pool = null;

function obtenerPool() {
    if (pool) return pool;
    const { db } = obtenerConfiguracionEntorno();
    pool = new pg.Pool({
        host: db.host,
        port: db.port,
        database: db.database,
        user: db.user,
        password: db.password,
        ssl: db.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 4000,
        idleTimeoutMillis: 15000,
        max: 10
    });
    pool.on('error', (err) => {
        console.error('[postgresClient] Error en pool PostgreSQL:', err.message);
    });
    return pool;
}

async function ejecutarQuery(sql, params = []) {
    const clientePool = obtenerPool();
    return clientePool.query(sql, params);
}

async function verificarConexionDb() {
    try {
        await ejecutarQuery('SELECT 1');
        return { conectado: true };
    } catch (err) {
        return { conectado: false, error: err.message };
    }
}

module.exports = {
    obtenerPool,
    ejecutarQuery,
    verificarConexionDb
};

