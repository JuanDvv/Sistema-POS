/**
 * Script para sembrar las Camisetas Viscosas en la base de datos local SQLite.
 * Genera 18 productos (Dama: 5 tallas, Unisex: 5 tallas, Niña: 4 tallas, Niño: 4 tallas)
 * organizados bajo subcategorías de la categoría principal 'Camisetas'.
 *
 * Uso:
 *   node scripts/seed_camisetas_viscosas.js
 *   node scripts/seed_camisetas_viscosas.js --all (aplica a producción y test si existen)
 *   node scripts/seed_camisetas_viscosas.js path/to/database.db
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const CATEGORIAS = [
    { id: 'cat-camisetas', nombre: 'Camisetas', categoria_padre_id: null },
    { id: 'cat-camisetas-viscosa-dama', nombre: 'Viscosa Dama', categoria_padre_id: 'cat-camisetas' },
    { id: 'cat-camisetas-viscosa-unisex', nombre: 'Viscosa Unisex', categoria_padre_id: 'cat-camisetas' },
    { id: 'cat-camisetas-viscosa-nina', nombre: 'Viscosa Niña', categoria_padre_id: 'cat-camisetas' },
    { id: 'cat-camisetas-viscosa-nino', nombre: 'Viscosa Niño', categoria_padre_id: 'cat-camisetas' }
];

const GRUPOS = [
    {
        nombre: 'Dama',
        slug: 'dama',
        categoriaId: 'cat-camisetas-viscosa-dama',
        tallas: ['S', 'M', 'L', 'XL', 'XXL']
    },
    {
        nombre: 'Unisex',
        slug: 'unisex',
        categoriaId: 'cat-camisetas-viscosa-unisex',
        tallas: ['S', 'M', 'L', 'XL', 'XXL']
    },
    {
        nombre: 'Niña',
        slug: 'nina',
        categoriaId: 'cat-camisetas-viscosa-nina',
        tallas: ['2-4', '6-8', '10-12', '14-16']
    },
    {
        nombre: 'Niño',
        slug: 'nino',
        categoriaId: 'cat-camisetas-viscosa-nino',
        tallas: ['2-4', '6-8', '10-12', '14-16']
    }
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
            const tallaSlug = slugify(talla);
            const id = `p-cam-viscosa-${grupo.slug}-${tallaSlug}`;
            const nombre = `Camiseta Viscosa ${grupo.nombre} - Talla ${talla}`;
            const descripcion = `Camiseta Viscosa para ${grupo.nombre}, talla ${talla}`;
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
    return productos;
}

function obtenerRutasBasesDatos() {
    const appData = process.env.APPDATA || (process.platform === 'darwin'
        ? path.join(process.env.HOME, 'Library', 'Application Support')
        : path.join(process.env.HOME, '.config'));
    const userDataPath = path.join(appData, 'pos-delipostresturbaco');

    const posiblesArchivos = [
        path.join(userDataPath, 'pos_camisetas.db'),
        path.join(userDataPath, 'pos_camisetas.test.db'),
        path.join(userDataPath, 'pos_delipostres.db'),
        path.join(userDataPath, 'pos_delipostres.test.db')
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
                WHERE p.id LIKE 'p-cam-viscosa-%'
            `);

            db.run('COMMIT', (err) => {
                if (err) {
                    db.run('ROLLBACK', () => db.close());
                    return reject(err);
                }
                db.close((closeErr) => {
                    if (closeErr) return reject(closeErr);
                    console.log(`✓ Sembrados exitosamente ${productos.length} productos y subcategorías en ${path.basename(dbFile)}.`);
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

