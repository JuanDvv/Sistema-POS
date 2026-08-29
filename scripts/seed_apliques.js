/**
 * Script para sembrar la categoría de Apliques y sus productos en la base de datos local SQLite.
 * Genera productos con valor desde 3.000 hasta 26.000 (paso predeterminado de 1.000, configurable a 500).
 *
 * Uso:
 *   node scripts/seed_apliques.js
 *   node scripts/seed_apliques.js --all (aplica a producción y test si existen)
 *   node scripts/seed_apliques.js --step 500 (siembra de 500 en 500)
 *   node scripts/seed_apliques.js path/to/database.db
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const CATEGORIA = {
    id: 'cat-apliques',
    nombre: 'Apliques',
    categoria_padre_id: null
};

const VALOR_MINIMO = 3000;
const VALOR_MAXIMO = 26000;

function formatearNumeroCOP(val) {
    return Number(val).toLocaleString('es-CO');
}

function generarProductos(paso = 1000) {
    const productos = [];
    for (let valor = VALOR_MINIMO; valor <= VALOR_MAXIMO; valor += paso) {
        const id = `p-aplique-${valor}`;
        const nombre = `Aplique $${formatearNumeroCOP(valor)}`;
        const descripcion = `Aplique con valor de $${formatearNumeroCOP(valor)} (${valor})`;
        productos.push({
            id,
            nombre,
            descripcion,
            precio: valor,
            stock_minimo: 5,
            categoria_id: CATEGORIA.id
        });
    }
    return productos;
}

function obtenerRutasBasesDatos() {
    const pkg = require('../package.json');
    const appData = process.env.APPDATA || (process.platform === 'darwin'
        ? path.join(process.env.HOME, 'Library', 'Application Support')
        : path.join(process.env.HOME, '.config'));
    const appDirName = pkg.name || 'pos-tiendakary';
    const userDataPath = path.join(appData, appDirName);

    const baseName = (pkg.name || 'pos_tiendakary').replace(/[^a-zA-Z0-9_-]/g, '_');
    const posiblesArchivos = [
        path.join(userDataPath, `${baseName}.db`),
        path.join(userDataPath, `${baseName}.test.db`),
        path.join(userDataPath, 'pos_camisetas.db'),
        path.join(userDataPath, 'pos_camisetas.test.db')
    ];

    const archivosExistentes = posiblesArchivos.filter(f => fs.existsSync(f));
    return { userDataPath, archivosExistentes };
}

function sembrarEnBaseDeDatos(dbFile, productos) {
    return new Promise((resolve, reject) => {
        console.log(`\nProcesando BD: ${dbFile}`);
        const db = new sqlite3.Database(dbFile, (err) => {
            if (err) return reject(err);
        });

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // 1. Insertar / actualizar categoría Apliques
            const stmtCat = db.prepare(`
                INSERT INTO categorias (id, nombre, categoria_padre_id, sync_status, updated_at)
                VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                ON CONFLICT(id) DO UPDATE SET
                    nombre = excluded.nombre,
                    categoria_padre_id = excluded.categoria_padre_id,
                    sync_status = 'pending',
                    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
            `);
            stmtCat.run([CATEGORIA.id, CATEGORIA.nombre, CATEGORIA.categoria_padre_id]);
            stmtCat.finalize();

            // 2. Insertar / actualizar productos de Apliques
            const stmtProd = db.prepare(`
                INSERT INTO productos (id, nombre, descripcion, precio, stock_minimo, categoria_id, sync_status, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                ON CONFLICT(id) DO UPDATE SET
                    nombre = excluded.nombre,
                    descripcion = excluded.descripcion,
                    precio = excluded.precio,
                    categoria_id = excluded.categoria_id,
                    sync_status = 'pending',
                    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
            `);

            for (const prod of productos) {
                stmtProd.run([
                    prod.id,
                    prod.nombre,
                    prod.descripcion,
                    prod.precio,
                    prod.stock_minimo,
                    prod.categoria_id
                ]);
            }
            stmtProd.finalize();

            // 3. Inicializar inventario_sucursal para las sucursales existentes con stock 0 si no existe
            db.run(`
                INSERT OR IGNORE INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                SELECT p.id, s.id, 0, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')
                FROM productos p
                CROSS JOIN config_sucursal s
                WHERE p.id LIKE 'p-aplique-%'
            `);

            db.run('COMMIT', (err) => {
                if (err) {
                    db.run('ROLLBACK', () => db.close());
                    return reject(err);
                }
                db.close((closeErr) => {
                    if (closeErr) return reject(closeErr);
                    console.log(`✓ Sembrados exitosamente ${productos.length} productos y categoría '${CATEGORIA.nombre}' en ${path.basename(dbFile)}.`);
                    resolve();
                });
            });
        });
    });
}

async function main() {
    const args = process.argv.slice(2);
    let paso = 1000;
    const stepArgIndex = args.findIndex(a => a === '--step');
    if (stepArgIndex !== -1 && args[stepArgIndex + 1]) {
        paso = parseInt(args[stepArgIndex + 1], 10) || 1000;
    }

    const productos = generarProductos(paso);
    console.log(`Total de productos generados a sembrar: ${productos.length} (de $${VALOR_MINIMO} a $${VALOR_MAXIMO}, paso: $${paso})`);

    let rutasDestino = [];
    const customPath = args.find(a => !a.startsWith('--') && (stepArgIndex === -1 || a !== args[stepArgIndex + 1]));

    if (customPath) {
        const rutaPersonalizada = path.resolve(customPath);
        if (fs.existsSync(rutaPersonalizada)) {
            rutasDestino.push(rutaPersonalizada);
        } else {
            console.error(`Error: El archivo especificado no existe: ${rutaPersonalizada}`);
            process.exit(1);
        }
    } else {
        const { userDataPath, archivosExistentes } = obtenerRutasBasesDatos();
        if (archivosExistentes.length === 0) {
            console.warn(`No se encontraron archivos .db automáticamente en: ${userDataPath}`);
            const defaultDb = path.join(userDataPath, 'pos_camisetas.db');
            console.log(`Creando/inicializando en la ruta por defecto: ${defaultDb}`);
            if (!fs.existsSync(userDataPath)) {
                fs.mkdirSync(userDataPath, { recursive: true });
            }
            rutasDestino.push(defaultDb);
        } else {
            rutasDestino = archivosExistentes;
        }
    }

    for (const dbPathTarget of rutasDestino) {
        await sembrarEnBaseDeDatos(dbPathTarget, productos);
    }
    console.log('\nProceso de siembra finalizado con éxito.');
}

main().catch(err => {
    console.error('Error durante la siembra:', err.message);
    process.exit(1);
});

