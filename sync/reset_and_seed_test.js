// Script manual (NO forma parte del ciclo de sincronización de la app ni corre solo).
// Deja el proyecto Supabase de TEST y el sqlite local de TEST exactamente como una
// fotografía fresca de PRODUCCIÓN: borra todo lo que haya en TEST (incluida basura de
// pruebas que nunca existió en producción), reseeda desde PRODUCCIÓN y borra el sqlite
// local de TEST para que la app lo reconstruya vacío y descargue todo de nuevo.
//
// Requisito de una sola vez: correr sync/setup_test_rls_delete_policy.sql en el SQL
// Editor del proyecto TEST antes de la primera vez que se use este script (agrega la
// policy de DELETE que falta en movimientos_inventario).
//
// Uso: node sync/reset_and_seed_test.js
// Requisito: cerrar la app (modo prueba) antes de correr esto -- si el sqlite local de
// TEST sigue abierto, el paso de borrado de archivo falla con un mensaje claro.
//
// No usa sync/supabaseClients.js (depende de electron) ni variables de entorno para la
// URL/key de TEST: el proyecto queda escrito literal para que este script JAMÁS pueda
// terminar apuntando por accidente a PRODUCCIÓN.

const { createClient } = require('@supabase/supabase-js');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_URL = 'https://kfcaaiyzdmcdccmhqemf.supabase.co';
const TEST_KEY = 'sb_publishable_aJj-iuP6UjR-IRDIWt3NWg_jJAEc8kG';

// Defensa en profundidad: si alguna vez alguien cambia TEST_URL de arriba por error,
// que la validación explícita del ref de proyecto detenga el script antes de borrar nada.
if (!TEST_URL.includes('kfcaaiyzdmcdccmhqemf')) {
    throw new Error('TEST_URL no apunta al proyecto de TEST esperado (kfcaaiyzdmcdccmhqemf). Abortando por seguridad.');
}

const TEST = createClient(TEST_URL, TEST_KEY);

// Hijas antes que padres, aunque algunas FK ya tengan ON DELETE CASCADE (ver
// sync/schema_test_data.sql) -- así el orden no depende de tener que recordar cuáles sí
// y cuáles no.
const TABLAS_EN_ORDEN = [
    { tabla: 'cierres_caja', columnaId: 'id' },
    { tabla: 'detalle_ventas', columnaId: 'id' },
    { tabla: 'detalle_pedidos', columnaId: 'id' },
    { tabla: 'detalle_transferencias', columnaId: 'id' },
    { tabla: 'abonos_credito', columnaId: 'id' },
    { tabla: 'abonos_pedido', columnaId: 'id' },
    { tabla: 'movimientos_inventario', columnaId: 'id' },
    { tabla: 'solicitudes_venta', columnaId: 'id' },
    { tabla: 'gastos', columnaId: 'id' },
    { tabla: 'transferencias', columnaId: 'id' },
    { tabla: 'pedidos', columnaId: 'id' },
    { tabla: 'ventas', columnaId: 'id' },
    { tabla: 'inventario_sucursal', columnaId: 'producto_id' },
    { tabla: 'clientes', columnaId: 'id' },
    { tabla: 'productos', columnaId: 'id' },
    { tabla: 'categorias', columnaId: 'id' },
    { tabla: 'config_sucursal', columnaId: 'id' },
    { tabla: 'usuarios', columnaId: 'id' },
];

async function vaciarTabla(tabla, columnaId) {
    // supabase-js exige un filtro en delete(); .neq() con un valor imposible borra todas
    // las filas reales sin tener que conocer sus ids de antemano.
    const { error, count } = await TEST.from(tabla).delete({ count: 'exact' }).neq(columnaId, '__reset_and_seed_test__nunca_coincide__');
    if (error) throw new Error(`Borrando ${tabla} en TEST: ${error.message}`);
    console.log(`  ${tabla}: ${count ?? 0} fila(s) borrada(s).`);
}

function nombreAppDesdePackageJson() {
    const pkg = require('../package.json');
    return pkg.name;
}

function rutaUserDataElectron(appName) {
    if (process.platform === 'win32') return path.join(process.env.APPDATA, appName);
    if (process.platform === 'darwin') return path.join(require('os').homedir(), 'Library', 'Application Support', appName);
    return path.join(require('os').homedir(), '.config', appName);
}

function borrarSqliteLocalDeTest() {
    const userDataPath = rutaUserDataElectron(nombreAppDesdePackageJson());
    const dbPath = path.join(userDataPath, 'pos_delipostres.test.db');
    if (!fs.existsSync(dbPath)) {
        console.log(`  Sqlite local de TEST no existe (${dbPath}), nada que borrar.`);
        return;
    }
    try {
        fs.unlinkSync(dbPath);
        console.log(`  Sqlite local de TEST borrado: ${dbPath}`);
    } catch (err) {
        throw new Error(
            `No se pudo borrar el sqlite local de TEST (${dbPath}): ${err.message}\n` +
            `  Supabase TEST ya quedó reseteado y resembrado -- solo falta este paso.\n` +
            `  Cierra la app (modo prueba, APP_ENV=test) y vuelve a correr: node sync/reset_and_seed_test.js`
        );
    }
}

async function main() {
    console.log('=== 1/3: Borrando datos actuales del proyecto TEST (kfcaaiyzdmcdccmhqemf) ===\n');
    for (const { tabla, columnaId } of TABLAS_EN_ORDEN) {
        await vaciarTabla(tabla, columnaId);
    }

    console.log('\n=== 2/3: Sembrando datos de PRODUCCIÓN en TEST ===\n');
    execFileSync(process.execPath, [path.join(__dirname, 'seed_test_from_prod.js')], { stdio: 'inherit' });

    console.log('\n=== 3/3: Borrando sqlite local de TEST (se reconstruye vacío al abrir la app) ===\n');
    borrarSqliteLocalDeTest();

    console.log('\n=== Listo. TEST (nube + local) quedó como una copia fresca de PRODUCCIÓN. ===');
}

main().catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});
