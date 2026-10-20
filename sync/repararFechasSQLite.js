const path = require('path');
const sqlite3 = require('sqlite3');
const fs = require('fs');

const appData = process.env.APPDATA || '';
const dbPath = path.join(appData, 'pos-delipostresturbaco', 'pos_delipostres.db');

if (!fs.existsSync(dbPath)) {
    console.error('No se encontró el archivo de base de datos en:', dbPath);
    process.exit(1);
}

console.log('Conectando a base de datos:', dbPath);
const db = new sqlite3.Database(dbPath);

function repararTabla(tabla) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT id, fecha, updated_at FROM ${tabla}`, [], (err, rows) => {
            if (err) return reject(err);
            if (!rows || rows.length === 0) return resolve(0);

            const aReparar = rows.filter(r => {
                const f = String(r.fecha || '').trim();
                return /^\d{11,}(\.\d+)?$/.test(f);
            });

            if (aReparar.length === 0) return resolve(0);

            let completadas = 0;
            aReparar.forEach(row => {
                const num = parseFloat(row.fecha);
                const isoFecha = new Date(num).toISOString();

                let isoUpdated = row.updated_at;
                if (/^\d{11,}(\.\d+)?$/.test(String(row.updated_at || '').trim())) {
                    isoUpdated = new Date(parseFloat(row.updated_at)).toISOString();
                }

                db.run(
                    `UPDATE ${tabla} SET fecha = ?, updated_at = ? WHERE id = ?`,
                    [isoFecha, isoUpdated, row.id],
                    (updateErr) => {
                        if (updateErr) console.error(`Error actualizando ${tabla} id ${row.id}:`, updateErr.message);
                        completadas++;
                        if (completadas === aReparar.length) {
                            resolve(completadas);
                        }
                    }
                );
            });
        });
    });
}

(async () => {
    try {
        const v = await repararTabla('ventas');
        const g = await repararTabla('gastos');
        console.log(`\nReparación finalizada con éxito:`);
        console.log(`- Ventas convertidas a ISO: ${v}`);
        console.log(`- Gastos convertidos a ISO: ${g}`);
    } catch (err) {
        console.error('Error durante la reparación:', err.message);
    } finally {
        db.close();
    }
})();

