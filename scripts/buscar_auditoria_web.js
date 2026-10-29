const { getPool } = require('../sync/remoteDbClient');

async function buscarWeb() {
    const pool = getPool();
    if (!pool) return;
    try {
        const totalWeb = await pool.query(
            "SELECT count(*) FROM auditoria WHERE detalles LIKE '%aplicación web%' OR sucursal_id = 'Web-Movil' OR accion LIKE '%Web Móvil%'"
        );
        console.log('TOTAL REGISTROS WEB:', totalWeb.rows[0].count);

        const res = await pool.query(
            "SELECT id, fecha, usuario, rol, sucursal_id, accion, detalles FROM auditoria WHERE detalles LIKE '%aplicación web%' OR sucursal_id = 'Web-Movil' OR accion LIKE '%Web Móvil%' ORDER BY fecha DESC LIMIT 10"
        );
        console.log('ÚLTIMOS REGISTROS DE LA WEB (ORDER BY fecha DESC):');
        console.log(res.rows);

        const ultimosGeneral = await pool.query(
            "SELECT id, fecha, usuario, rol, sucursal_id, accion FROM auditoria ORDER BY fecha DESC LIMIT 5"
        );
        console.log('ÚLTIMOS 5 REGISTROS GENERALES EN AUDITORIA:');
        console.log(ultimosGeneral.rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit(0);
    }
}
buscarWeb();

