const { obtenerConfigServidor } = require('../services/serverConfigService');

let pg = null;
try {
    pg = require('pg');
    if (pg && pg.types) {
        // Universal Wall-Clock Time Standard: nunca deserializar fechas como Date objects de JS.
        // OIDs: 1082 (DATE), 1114 (TIMESTAMP), 1184 (TIMESTAMPTZ) devueltos siempre como string literal.
        pg.types.setTypeParser(1082, str => str);
        pg.types.setTypeParser(1114, str => str);
        pg.types.setTypeParser(1184, str => {
            if (!str) return str;
            return /[+-]\d{2}$/.test(str) ? str.replace(' ', 'T') + ':00' : str;
        });
    }
} catch (e) {
    console.warn('[remoteDbClient] El módulo "pg" no está instalado aún. Ejecute "npm install pg".');
}

let activePool = null;
let lastConfigJson = null;

function getPool() {
    if (!pg) return null;
    const config = obtenerConfigServidor();
    const configJson = JSON.stringify(config);

    if (activePool && lastConfigJson === configJson) {
        return activePool;
    }

    if (activePool) {
        try { activePool.end(); } catch (err) { }
    }

    lastConfigJson = configJson;
    activePool = new pg.Pool({
        host: config.host || '127.0.0.1',
        port: Number(config.port) || 5432,
        database: config.database || 'pos_delipostres',
        user: config.user || 'postgres',
        password: String(config.password ?? ''),
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 3000,
        idleTimeoutMillis: 10000,
        max: 10
    });

    activePool.on('error', (err) => {
        console.error('[remoteDbClient] Error en pool de conexiones PostgreSQL:', err.message);
    });

    return activePool;
}

function resetPool() {
    if (activePool) {
        try { activePool.end(); } catch (err) { }
        activePool = null;
        lastConfigJson = null;
    }
}

async function testConnection() {
    const pool = getPool();
    if (!pool) return false;
    let client = null;
    try {
        client = await pool.connect();
        await client.query('SELECT 1');
        return true;
    } catch (err) {
        return false;
    } finally {
        if (client) client.release();
    }
}

// ------------------------------------------------------------------------------
// Fluent Query Builder para emular la interfaz de Supabase sobre PostgreSQL 17
// ------------------------------------------------------------------------------
class QueryBuilder {
    constructor(tabla) {
        this.tabla = tabla;
        this.operacion = 'select';
        this.columnas = '*';
        this.filtros = [];
        this.valores = [];
        this.orden = null;
        this.limiteVal = null;
        this.offsetVal = null;
        this.datos = null;
        this.returningCol = null;
        this.onConflictCol = 'id';
        this.isSingle = false;
        this.isMaybeSingle = false;
    }

    select(cols = '*') {
        if (this.operacion === 'upsert' || this.operacion === 'update' || this.operacion === 'delete') {
            this.returningCol = cols;
            return this;
        }
        this.operacion = 'select';
        this.columnas = cols;
        return this;
    }

    range(desde, hasta) {
        this.offsetVal = Math.max(0, desde);
        this.limiteVal = Math.max(0, hasta - desde + 1);
        return this;
    }

    limit(n) {
        this.limiteVal = n;
        return this;
    }

    order(col, { ascending = true } = {}) {
        this.orden = `"${col}" ${ascending ? 'ASC' : 'DESC'}`;
        return this;
    }

    eq(col, val) {
        this.valores.push(val);
        this.filtros.push(`"${col}" = $${this.valores.length}`);
        return this;
    }

    neq(col, val) {
        this.valores.push(val);
        this.filtros.push(`"${col}" <> $${this.valores.length}`);
        return this;
    }

    gt(col, val) {
        this.valores.push(val);
        this.filtros.push(`"${col}" > $${this.valores.length}`);
        return this;
    }

    gte(col, val) {
        this.valores.push(val);
        this.filtros.push(`"${col}" >= $${this.valores.length}`);
        return this;
    }

    lt(col, val) {
        this.valores.push(val);
        this.filtros.push(`"${col}" < $${this.valores.length}`);
        return this;
    }

    lte(col, val) {
        this.valores.push(val);
        this.filtros.push(`"${col}" <= $${this.valores.length}`);
        return this;
    }

    is(col, val) {
        if (val === null) {
            this.filtros.push(`"${col}" IS NULL`);
        } else {
            this.valores.push(val);
            this.filtros.push(`"${col}" IS $${this.valores.length}`);
        }
        return this;
    }

    in(col, vals) {
        const arr = Array.isArray(vals) ? vals : [vals];
        if (arr.length === 0) {
            this.filtros.push('FALSE');
            return this;
        }
        const placeholders = arr.map(v => {
            this.valores.push(v);
            return `$${this.valores.length}`;
        }).join(', ');
        this.filtros.push(`"${col}" IN (${placeholders})`);
        return this;
    }

    not(col, operator, val) {
        if (operator === 'is' && val === null) {
            this.filtros.push(`"${col}" IS NOT NULL`);
        } else {
            this.valores.push(val);
            this.filtros.push(`NOT ("${col}" = $${this.valores.length})`);
        }
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    maybeSingle() {
        this.isMaybeSingle = true;
        return this;
    }

    upsert(payload, options = {}) {
        this.operacion = 'upsert';
        this.datos = Array.isArray(payload) ? payload : [payload];
        this.onConflictCol = options.onConflict || 'id';
        return this;
    }

    update(datos) {
        this.operacion = 'update';
        this.datos = datos;
        return this;
    }

    delete() {
        this.operacion = 'delete';
        return this;
    }

    async then(resolve, reject) {
        try {
            const pool = getPool();
            if (!pool) {
                return resolve({ data: null, error: new Error('PostgreSQL pool no disponible. Verifique que pg esté instalado y configurado.') });
            }

            let sql = '';
            let params = [];

            if (this.operacion === 'select') {
                sql = `SELECT ${this.columnas} FROM "${this.tabla}"`;
                if (this.filtros.length > 0) {
                    sql += ` WHERE ${this.filtros.join(' AND ')}`;
                }
                if (this.orden) {
                    sql += ` ORDER BY ${this.orden}`;
                }
                if (this.limiteVal !== null) {
                    sql += ` LIMIT ${this.limiteVal}`;
                }
                if (this.offsetVal !== null) {
                    sql += ` OFFSET ${this.offsetVal}`;
                }
                params = this.valores;
            } else if (this.operacion === 'upsert') {
                if (!this.datos || this.datos.length === 0) {
                    return resolve({ data: [], error: null });
                }
                const fila = this.datos[0];
                const cols = Object.keys(fila).filter(k => fila[k] !== undefined);
                if (cols.length === 0) {
                    return resolve({ data: [], error: null });
                }

                params = cols.map(c => {
                    const val = fila[c];
                    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
                        return JSON.stringify(val);
                    }
                    return val;
                });
                const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
                const quotedCols = cols.map(c => `"${c}"`).join(', ');

                const updates = cols
                    .filter(c => c !== this.onConflictCol)
                    .map(c => `"${c}" = EXCLUDED."${c}"`)
                    .join(', ');

                sql = `INSERT INTO "${this.tabla}" (${quotedCols}) VALUES (${placeholders})
                       ON CONFLICT ("${this.onConflictCol}") DO ${updates ? `UPDATE SET ${updates}` : 'NOTHING'}`;

                if (this.returningCol) {
                    sql += ` RETURNING ${this.returningCol === '*' ? '*' : `"${this.returningCol}"`}`;
                }

            } else if (this.operacion === 'update') {
                const keys = Object.keys(this.datos || {}).filter(k => this.datos[k] !== undefined);
                if (keys.length === 0) {
                    return resolve({ data: [], error: null });
                }

                const setParts = [];
                for (const k of keys) {
                    const val = this.datos[k];
                    params.push(val !== null && typeof val === 'object' && !(val instanceof Date) ? JSON.stringify(val) : val);
                    setParts.push(`"${k}" = $${params.length}`);
                }

                sql = `UPDATE "${this.tabla}" SET ${setParts.join(', ')}`;

                if (this.filtros.length > 0) {
                    const offsetParams = params.length;
                    const whereSql = this.filtros.map(f => {
                        return f.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + offsetParams}`);
                    }).join(' AND ');
                    params = params.concat(this.valores);
                    sql += ` WHERE ${whereSql}`;
                }

                if (this.returningCol) {
                    sql += ` RETURNING ${this.returningCol === '*' ? '*' : `"${this.returningCol}"`}`;
                }

            } else if (this.operacion === 'delete') {
                sql = `DELETE FROM "${this.tabla}"`;
                if (this.filtros.length > 0) {
                    sql += ` WHERE ${this.filtros.join(' AND ')}`;
                }
                if (this.returningCol) {
                    sql += ` RETURNING ${this.returningCol === '*' ? '*' : `"${this.returningCol}"`}`;
                }
                params = this.valores;
            }

            const res = await pool.query(sql, params);
            if (this.isSingle) {
                if (res.rows.length === 1) {
                    return resolve({ data: res.rows[0], error: null });
                }
                const err = new Error(res.rows.length === 0
                    ? 'JSON object requested, multiple (or no) rows returned'
                    : 'JSON object requested, multiple rows returned');
                err.code = 'PGRST116';
                return resolve({ data: null, error: err });
            }
            if (this.isMaybeSingle) {
                if (res.rows.length === 0) {
                    return resolve({ data: null, error: null });
                }
                if (res.rows.length === 1) {
                    return resolve({ data: res.rows[0], error: null });
                }
                const err = new Error('JSON object requested, multiple rows returned');
                err.code = 'PGRST116';
                return resolve({ data: null, error: err });
            }
            return resolve({ data: res.rows, error: null });
        } catch (err) {
            // Normalizar errores comunes de PostgreSQL para compatibilidad con syncService.js
            if (err.code === '42P01') {
                err.code = 'PGRST205'; // tabla no encontrada
            } else if (err.code === '42883') {
                err.code = 'PGRST202'; // función no encontrada
            }
            return resolve({ data: null, error: err });
        }
    }
}

const remoteDbClient = {
    from(tabla) {
        return new QueryBuilder(tabla);
    },

    async rpc(funcion, parametros = {}) {
        const pool = getPool();
        if (!pool) {
            return { data: null, error: new Error('PostgreSQL pool no disponible.') };
        }

        try {
            const keys = Object.keys(parametros);
            const params = keys.map(k => parametros[k]);
            const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');

            const sql = `SELECT * FROM public.${funcion}(${placeholders})`;
            const res = await pool.query(sql, params);

            // Si la función devuelve una tabla/filas
            if (funcion === 'buscar_auditoria') {
                return { data: res.rows, error: null };
            }
            // Funciones escalares / void (ej. aplicar_correccion_stock devuelve un integer delta)
            if (res.rows && res.rows.length > 0) {
                const primerVal = Object.values(res.rows[0])[0];
                return { data: primerVal, error: null };
            }
            return { data: null, error: null };
        } catch (err) {
            if (err.code === '42883') {
                err.code = 'PGRST202';
            } else if (err.code === '42P01') {
                err.code = 'PGRST205';
            }
            return { data: null, error: err };
        }
    },

    testConnection,
    resetPool
};

module.exports = {
    remoteDbClient,
    getPool,
    resetPool,
    testConnection
};

