const { getPool } = require('../sync/remoteDbClient');
const { v4: uuidv4 } = require('uuid');

async function testInsert() {
    const pool = getPool();
    if (!pool) {
        console.error('No pool');
        process.exit(1);
    }

    const id = uuidv4();
    const fecha = '2026-10-23 20:56:00';
    const usuario = 'admin';
    const rol = 'Administrador';
    const sucursalId = 'Web-Movil';
    const accion = 'Prueba Diagnóstico';
    const detallesTexto = 'Prueba de inserción desde script [Realizado desde la aplicación web]';

    console.log('Intentando insertar con query exacta de authRepository...');
    try {
        const res = await pool.query(
            `INSERT INTO "auditoria" (id, fecha, usuario, rol, sucursal_id, accion, detalles)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING`,
            [id, fecha, usuario, rol, sucursalId, accion, detallesTexto]
        );
        console.log('Resultado de inserción:', res.rowCount, 'filas afectadas.');

        const check = await pool.query("SELECT * FROM auditoria WHERE id = $1", [id]);
        console.log('Fila leída:', check.rows);

        // Limpiar la fila de prueba
        await pool.query("DELETE FROM auditoria WHERE id = $1", [id]);
        console.log('Fila de prueba eliminada.');
    } catch (err) {
        console.error('ERROR AL INSERTAR:', err);
    } finally {
        process.exit(0);
    }
}

testInsert();

