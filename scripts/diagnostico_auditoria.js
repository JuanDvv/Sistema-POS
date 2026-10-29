const { getPool } = require('../sync/remoteDbClient');

async function diagnosticar() {
    const pool = getPool();
    if (!pool) {
        console.error('No se pudo inicializar el pool de conexiones.');
        process.exit(1);
    }

    try {
        console.log('--- 1. INFORMACIÓN DE LA TABLA AUDITORIA ---');
        const tablas = await pool.query(
            "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name ILIKE 'auditoria'"
        );
        console.log('Tablas encontradas:', tablas.rows);

        console.log('\n--- 2. COLUMNAS DE AUDITORIA ---');
        const columnas = await pool.query(
            "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'auditoria' ORDER BY ordinal_position"
        );
        console.log(columnas.rows);

        console.log('\n--- 3. RESTRICCIONES (CONSTRAINTS) ---');
        const constraints = await pool.query(
            "SELECT conname, contype, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class cl ON c.conrelid = cl.oid WHERE cl.relname = 'auditoria'"
        );
        console.log(constraints.rows);

        console.log('\n--- 4. ÚLTIMOS REGISTROS EN AUDITORIA ---');
        const ultimos = await pool.query(
            "SELECT * FROM auditoria ORDER BY fecha DESC LIMIT 5"
        );
        console.log(ultimos.rows);

    } catch (err) {
        console.error('Error durante diagnóstico:', err.message);
    } finally {
        process.exit(0);
    }
}

diagnosticar();

