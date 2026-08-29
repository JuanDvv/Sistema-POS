/**
 * Script para sembrar masivamente las camisetas en la base de datos local SQLite.
 * Genera 814 productos (4 grupos x tallas x 37 colores) y sus respectivas categorías.
 *
 * Uso:
 *   node scripts/seed_camisetas.js
 *   node scripts/seed_camisetas.js --all (aplica a producción y test si existen)
 *   node scripts/seed_camisetas.js path/to/database.db
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const CATEGORIAS = [
    { id: 'cat-camisetas', nombre: 'Camisetas', categoria_padre_id: null },
    { id: 'cat-camisetas-nina', nombre: 'Niña', categoria_padre_id: 'cat-camisetas' },
    { id: 'cat-camisetas-nino', nombre: 'Niño', categoria_padre_id: 'cat-camisetas' },
    { id: 'cat-camisetas-dama', nombre: 'Dama', categoria_padre_id: 'cat-camisetas' },
    { id: 'cat-camisetas-unisex', nombre: 'Unisex', categoria_padre_id: 'cat-camisetas' }
];

const GRUPOS = [
    {
        nombre: 'Niña',
        slug: 'nina',
        categoriaId: 'cat-camisetas-nina',
        tallas: ['2-4', '6-8', '10-12', '14-16']
    },
    {
        nombre: 'Niño',
        slug: 'nino',
        categoriaId: 'cat-camisetas-nino',
        tallas: ['2-4', '6-8', '10-12', '14-16']
    },
    {
        nombre: 'Dama',
        slug: 'dama',
        categoriaId: 'cat-camisetas-dama',
        tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
    },
    {
        nombre: 'Unisex',
        slug: 'unisex',
        categoriaId: 'cat-camisetas-unisex',
        tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
    }
];

const COLORES = [
    'Negro',
    'Blanco',
    'Gris Claro',
    'Gris Raton',
    'Rojo',
    'Azul Rey',
    'Azul Oscuro',
    'Azul Petroleo',
    'Azul Turquesa',
    'Azul Cielo',
    'Lila',
    'Palo de Rosa',
    'Guayaba',
    'Barbie',
    'Fucsia',
    'Fucsia Fantasia',
    'Mandarina',
    'Confite',
    'Verde Neon',
    'Naranja Neon',
    'Amarillo Neon',
    'Salmon',
    'Morado',
    'Ladrillo',
    'Vinotinto',
    'Naranja',
    'Beige',
    'Camel',
    'Verde Oliva',
    'Verde Menta',
    'Verde Militar',
    'Verde Antioquia',
    'Amarillo Claro',
    'Amarillo Taxi',
    'Amarillo Mostaza',
    'Cafe',
    'Caqui',
    'Mantequilla',
    'Azul Bebé'
];

function slugify(text) {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function generarCatalogo() {
    const productos = [];
    for (const grupo of GRUPOS) {
        for (const talla of grupo.tallas) {
            for (const color of COLORES) {
                const tallaSlug = slugify(talla);
                const colorSlug = slugify(color);
                const id = `p-cam-${grupo.slug}-${tallaSlug}-${colorSlug}`;
                const nombre = `Camiseta ${grupo.nombre} - Talla ${talla} - ${color}`;
                const descripcion = `Camiseta para ${grupo.nombre}, talla ${talla}, color ${color}`;
                productos.push({
                    id,
                    nombre,
                    descripcion,
                    precio: 0,
                    stock_minimo: 5,
                    categoria_id: grupo.categoriaId
                });
            }
        }
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

            // 1. Insertar categorías
            const stmtCat = db.prepare(`
                INSERT INTO categorias (id, nombre, categoria_padre_id, sync_status, updated_at)
                VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                ON CONFLICT(id) DO UPDATE SET
                    nombre = excluded.nombre,
                    categoria_padre_id = excluded.categoria_padre_id,
                    sync_status = 'pending',
                    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
            `);

            for (const cat of CATEGORIAS) {
                stmtCat.run([cat.id, cat.nombre, cat.categoria_padre_id]);
            }
            stmtCat.finalize();

            // 2. Insertar productos
            const stmtProd = db.prepare(`
                INSERT INTO productos (id, nombre, descripcion, precio, stock_minimo, categoria_id, sync_status, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                ON CONFLICT(id) DO UPDATE SET
                    nombre = excluded.nombre,
                    descripcion = excluded.descripcion,
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
                WHERE p.id LIKE 'p-cam-%'
            `);

            db.run('COMMIT', (err) => {
                if (err) {
                    db.run('ROLLBACK', () => db.close());
                    return reject(err);
                }
                db.close((closeErr) => {
                    if (closeErr) return reject(closeErr);
                    console.log(`✓ Sembrados exitosamente ${productos.length} productos y ${CATEGORIAS.length} categorías en ${path.basename(dbFile)}.`);
                    resolve();
                });
            });
        });
    });
}

async function main() {
    const args = process.argv.slice(2);
    const productos = generarCatalogo();
    console.log(`Total de productos generados a sembrar: ${productos.length}`);

    let rutasDestino = [];
    if (args.length > 0 && !args.includes('--all')) {
        const rutaPersonalizada = path.resolve(args[0]);
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

