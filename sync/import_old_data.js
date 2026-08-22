const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Determinar rutas de bases de datos
const isProd = process.env.APP_ENV === 'production';
const appDataDir = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
const userDataPath = path.join(appDataDir, 'pos-delipostresturbaco');

const oldDbFile = isProd ? 'pos_delipostres.db' : 'pos_delipostres.test.db';
const newDbFile = isProd ? 'pos_camisetas.db' : 'pos_camisetas.test.db';

const oldDbPath = path.join(userDataPath, oldDbFile);
const newDbPath = path.join(userDataPath, newDbFile);

console.log(`Buscando base de datos origen en: ${oldDbPath}`);
console.log(`Buscando base de datos destino en: ${newDbPath}`);

if (!fs.existsSync(oldDbPath)) {
    console.error(`ERROR: No se encontró la base de datos de origen en ${oldDbPath}`);
    process.exit(1);
}

const oldDb = new sqlite3.Database(oldDbPath);
const newDb = new sqlite3.Database(newDbPath);

// Función auxiliar para copiar registros
function copiarTabla(tabla, columnas) {
    return new Promise((resolve, reject) => {
        oldDb.all(`SELECT * FROM ${tabla}`, [], (err, rows) => {
            if (err) {
                // Si la tabla no existe en la BD anterior, simplemente la omitimos
                if (err.message.includes('no such table')) {
                    console.log(`La tabla ${tabla} no existe en la base de datos anterior. Omitiendo...`);
                    return resolve();
                }
                return reject(err);
            }

            if (rows.length === 0) {
                console.log(`La tabla ${tabla} está vacía en la base de datos anterior.`);
                return resolve();
            }

            const placeholders = columnas.map(() => '?').join(',');
            const query = `INSERT OR IGNORE INTO ${tabla} (${columnas.join(',')}) VALUES (${placeholders})`;

            newDb.serialize(() => {
                const stmt = newDb.prepare(query);
                rows.forEach(row => {
                    const params = columnas.map(col => row[col]);
                    stmt.run(params);
                });
                stmt.finalize((errFinal) => {
                    if (errFinal) return reject(errFinal);
                    console.log(`✓ Copiados ${rows.length} registros en la tabla ${tabla}.`);
                    resolve();
                });
            });
        });
    });
}

async function migrar() {
    try {
        console.log("Iniciando migración de datos de clientes, pedidos y abonos...");

        // 1. Clientes
        await copiarTabla('clientes', [
            'id', 'nombre', 'tipo', 'identificacion', 'telefono', 'email', 
            'sync_status', 'updated_at', 'deleted_at', 'origen', 'categoria'
        ]);

        // 2. Abonos de Crédito
        await copiarTabla('abonos_credito', [
            'id', 'cliente_id', 'monto', 'fecha', 'metodo_pago', 'sync_status', 'updated_at', 'deleted_at'
        ]);

        // 3. Pedidos
        await copiarTabla('pedidos', [
            'id', 'sucursal_id', 'cliente_id', 'fecha_pedido', 'fecha_entrega_estimada', 
            'fecha_entrega_real', 'estado', 'total', 'notas', 'venta_id', 
            'usuario_creo', 'updated_at', 'deleted_at', 'cliente_nombre_registro', 
            'cliente_identificacion_registro', 'cliente_telefono_registro', 'valor_domicilio', 'sync_status'
        ]);

        // 4. Detalle de Pedidos (requerido para reconstruir los abonos/saldos de pedidos)
        await copiarTabla('detalle_pedidos', [
            'id', 'pedido_id', 'producto_id', 'cantidad', 'precio_unitario', 'updated_at', 'deleted_at'
        ]);

        // 5. Abonos de Pedidos
        await copiarTabla('abonos_pedido', [
            'id', 'pedido_id', 'monto', 'fecha', 'metodo_pago', 'updated_at', 'deleted_at', 'sync_status'
        ]);

        console.log("Migración finalizada con éxito.");
    } catch (error) {
        console.error("Error durante la migración:", error);
    } finally {
        oldDb.close();
        newDb.close();
    }
}

migrar();
