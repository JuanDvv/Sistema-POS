const { db, allQuery } = require('./db/connection');
const { remoteDbClient, getPool } = require('./sync/remoteDbClient');
const { procesarSincronizacion } = require('./sync/syncService');

async function diagnosticar() {
    console.log('=== 1. SUCURSAL ACTIVA EN ESTE PC ===');
    const sucursalActiva = await allQuery(`SELECT id, nombre, activa FROM config_sucursal WHERE activa = 1`, []);
    console.table(sucursalActiva);

    console.log('\n=== 2. CIERRES DE CAJA EN SQLITE LOCAL (ESTE PC) ===');
    const cierresLocales = await allQuery(`SELECT id, sucursal_id, usuario, tipo, fecha_hasta, sync_status FROM cierres_caja ORDER BY fecha_hasta DESC LIMIT 5`, []);
    console.table(cierresLocales);

    console.log('\n=== 3. CURSOR LOCAL DE SINCRONIZACIÓN ===');
    const cursor = await allQuery(`SELECT * FROM sync_cursores WHERE tabla = 'cierres_caja'`, []);
    console.table(cursor);

    console.log('\n=== 4. CONEXIÓN A POSTGRESQL CENTRAL ===');
    const pool = getPool();
    if (!pool) {
        console.error('No se pudo inicializar el pool de PostgreSQL.');
        process.exit(1);
    }

    try {
        const client = await pool.connect();
        console.log('Conexión exitosa a PostgreSQL.');

        const checkTabla = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'cierres_caja'
        `);
        if (checkTabla.rows.length === 0) {
            console.error('LA TABLA public.cierres_caja NO EXISTE EN POSTGRESQL.');
        } else {
            console.log('La tabla public.cierres_caja existe en PostgreSQL.');

            const checkTrg = await client.query(`
                SELECT trigger_name FROM information_schema.triggers 
                WHERE event_object_table = 'cierres_caja'
            `);
            console.log('Triggers en cierres_caja:', checkTrg.rows.map(r => r.trigger_name).join(', ') || 'NINGUNO');

            const cierresRemotos = await client.query(`
                SELECT id, sucursal_id, usuario, tipo, fecha_hasta, sync_seq 
                FROM public.cierres_caja 
                ORDER BY fecha_hasta DESC LIMIT 5
            `);
            console.log('\n=== 5. CIERRES REGISTRADOS EN POSTGRESQL CENTRAL ===');
            console.table(cierresRemotos.rows);
        }
        client.release();
    } catch (err) {
        console.error('Error conectando o consultando PostgreSQL:', err.message);
    }

    console.log('\n=== 6. PROBANDO CICLO DE SINCRONIZACIÓN MANUAL ===');
    try {
        await procesarSincronizacion();
        console.log('Sincronización ejecutada con éxito.');

        const cierresPostSync = await allQuery(`SELECT id, sucursal_id, usuario, tipo, fecha_hasta, sync_status FROM cierres_caja ORDER BY fecha_hasta DESC LIMIT 5`, []);
        console.log('\nCierres en SQLite tras sincronizar:');
        console.table(cierresPostSync);
    } catch (errSync) {
        console.error('Fallo durante sincronización:', errSync.message);
    }

    process.exit(0);
}

diagnosticar().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});

