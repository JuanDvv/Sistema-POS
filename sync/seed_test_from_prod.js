// Script manual (NO forma parte del ciclo de sincronización de la app ni corre solo).
// Copia una fotografía de los datos reales de PRODUCCIÓN al proyecto Supabase de TEST,
// para tener datos realistas con qué probar. Se puede correr las veces que quieras: hace
// upsert (inserta o actualiza por primary key), nunca borra nada en test.
//
// Uso: node sync/seed_test_from_prod.js
//
// No usa sync/supabaseClients.js porque ese módulo depende de `electron` (app.isPackaged)
// y este script corre como Node plano, fuera de Electron.

const { createClient } = require('@supabase/supabase-js');

const PROD = createClient(
    'https://mkbwfypxupebulwhijgw.supabase.co',
    'sb_publishable_fVK6Qpm0tyP0eKu38XUEAw_Spq-ccEw'
);
const TEST = createClient(
    'https://kfcaaiyzdmcdccmhqemf.supabase.co',
    'sb_publishable_aJj-iuP6UjR-IRDIWt3NWg_jJAEc8kG'
);

const PAGE_SIZE = 1000;

async function leerTodo(cliente, tabla) {
    const filas = [];
    let desde = 0;
    while (true) {
        const { data, error } = await cliente.from(tabla).select('*').range(desde, desde + PAGE_SIZE - 1);
        if (error) throw new Error(`Leyendo ${tabla} de producción: ${error.message}`);
        filas.push(...data);
        if (data.length < PAGE_SIZE) break;
        desde += PAGE_SIZE;
    }
    return filas;
}

async function subirLotes(tabla, filas, onConflict) {
    if (filas.length === 0) {
        console.log(`  ${tabla}: sin filas en producción, se omite.`);
        return;
    }
    for (let i = 0; i < filas.length; i += PAGE_SIZE) {
        const lote = filas.slice(i, i + PAGE_SIZE);
        const { error } = await TEST.from(tabla).upsert(lote, { onConflict });
        if (error) throw new Error(`Subiendo ${tabla} a test: ${error.message}`);
    }
    console.log(`  ${tabla}: ${filas.length} fila(s) sembrada(s) en test.`);
}

async function copiarTabla(tabla, onConflict = 'id') {
    console.log(`Copiando ${tabla}...`);
    const filas = await leerTodo(PROD, tabla);
    await subirLotes(tabla, filas, onConflict);
    return filas;
}

async function main() {
    console.log('=== Sembrando datos de PRODUCCIÓN en TEST (kfcaaiyzdmcdccmhqemf) ===\n');

    // categorias es auto-referencial (categoria_padre_id -> categorias.id): primero se
    // insertan todas sin el padre, luego se actualiza el padre en una segunda pasada,
    // así el orden de llegada de las filas nunca rompe la FK.
    const categorias = await leerTodo(PROD, 'categorias');
    await subirLotes('categorias', categorias.map(c => ({ ...c, categoria_padre_id: null })), 'id');
    const conPadre = categorias.filter(c => c.categoria_padre_id);
    if (conPadre.length > 0) {
        for (const cat of conPadre) {
            // El trigger trg_lww_guard descarta el UPDATE si new.updated_at <= old.updated_at.
            // Como la fila ya quedó con el updated_at de producción tras el upsert de arriba,
            // hay que mandar un updated_at más nuevo o el guard ignora el cambio en silencio
            // (sin error) y categoria_padre_id nunca queda grabado.
            const { error } = await TEST.from('categorias')
                .update({ categoria_padre_id: cat.categoria_padre_id, updated_at: new Date().toISOString() })
                .eq('id', cat.id);
            if (error) throw new Error(`Actualizando categoria_padre_id de ${cat.id}: ${error.message}`);
        }
    }
    console.log(`  categorias: ${categorias.length} fila(s) sembrada(s) en test (con jerarquía).`);

    await copiarTabla('config_sucursal');
    await copiarTabla('productos');
    await copiarTabla('clientes');
    await copiarTabla('usuarios');
    await copiarTabla('inventario_sucursal', 'producto_id,sucursal_id');
    await copiarTabla('movimientos_inventario');
    await copiarTabla('ventas');
    await copiarTabla('detalle_ventas');
    await copiarTabla('pedidos');
    await copiarTabla('detalle_pedidos');
    await copiarTabla('abonos_credito');
    await copiarTabla('abonos_pedido');
    await copiarTabla('transferencias');
    await copiarTabla('detalle_transferencias');
    await copiarTabla('gastos');
    await copiarTabla('solicitudes_venta');
    await copiarTabla('cierres_caja');

    console.log('\n=== Listo. El proyecto de TEST ya tiene una copia de los datos reales. ===');
}

main().catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});
