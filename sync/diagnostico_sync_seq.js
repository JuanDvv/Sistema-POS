// Script manual de SOLO LECTURA (no forma parte del ciclo de sincronización de la app, no corre
// solo, y no escribe nada en Supabase).
//
// Valida sync/migrate_incremental_pull.sql DESPUÉS de correrlo, antes de que la app dependa de
// sync_seq para el pull incremental (ver descargarDesdeCursor en sync/syncService.js). Por cada
// tabla sincronizada:
//   1. Confirma que no quedó ninguna fila con sync_seq NULL (el backfill de la migración debe
//      haber cubierto el 100% de las filas existentes).
//   2. Confirma que no hay valores de sync_seq duplicados DENTRO de la tabla (la secuencia es
//      compartida entre las 18 tablas, así que valores duplicados entre tablas distintas son
//      normales -- ver nota abajo -- pero dentro de una misma tabla indicarían un bug).
//   3. Reporta min/max de sync_seq y el conteo total, para inspección manual.
//
// Uso (correr TEST primero, nunca PRODUCCIÓN sin haber validado TEST):
//   node sync/diagnostico_sync_seq.js --test
//   node sync/diagnostico_sync_seq.js --prod
//
// No usa sync/supabaseClients.js porque ese módulo depende de `electron` (app.isPackaged) y este
// script corre como Node plano, fuera de Electron. Mismas credenciales que
// sync/diagnostico_stock_vs_kardex.js.

const { createClient } = require('@supabase/supabase-js');

const PROD = {
    url: 'https://mkbwfypxupebulwhijgw.supabase.co',
    key: 'sb_publishable_fVK6Qpm0tyP0eKu38XUEAw_Spq-ccEw'
};
const TEST = {
    url: 'https://kfcaaiyzdmcdccmhqemf.supabase.co',
    key: 'sb_publishable_aJj-iuP6UjR-IRDIWt3NWg_jJAEc8kG'
};

const TABLAS = [
    'ventas', 'detalle_ventas', 'gastos', 'productos', 'categorias', 'inventario_sucursal',
    'movimientos_inventario', 'movimientos_reserva_inventario', 'config_sucursal', 'usuarios',
    'transferencias', 'detalle_transferencias', 'clientes', 'abonos_credito', 'pedidos',
    'detalle_pedidos', 'abonos_pedido', 'solicitudes_venta'
];

const args = process.argv.slice(2);
const usarProd = args.includes('--prod');
const usarTest = args.includes('--test');

if (usarProd === usarTest) {
    console.error('Debes indicar exactamente uno de --test o --prod.');
    process.exit(1);
}

const cfg = usarProd ? PROD : TEST;
const etiqueta = usarProd ? 'PRODUCCIÓN' : 'TEST';
const cliente = createClient(cfg.url, cfg.key);

const PAGE_SIZE = 1000;

async function leerTodo(tabla, select) {
    const filas = [];
    let desde = 0;
    while (true) {
        const { data, error } = await cliente.from(tabla).select(select).range(desde, desde + PAGE_SIZE - 1);
        if (error) throw new Error(`Leyendo ${tabla}: ${error.message}`);
        filas.push(...data);
        if (data.length < PAGE_SIZE) break;
        desde += PAGE_SIZE;
    }
    return filas;
}

async function validarTabla(tabla) {
    let filas;
    try {
        filas = await leerTodo(tabla, 'sync_seq');
    } catch (err) {
        return { tabla, error: err.message };
    }

    const total = filas.length;
    const nulos = filas.filter(f => f.sync_seq === null || f.sync_seq === undefined).length;
    // Number(null) da 0 (no NaN) -- filtrar los nulos explícitamente antes de convertir, o una
    // fila con sync_seq NULL se cuela como si fuera un valor real "0" en min/max/duplicados.
    const valores = filas.filter(f => f.sync_seq !== null && f.sync_seq !== undefined).map(f => Number(f.sync_seq));
    const duplicados = valores.length - new Set(valores).size;
    const min = valores.length ? Math.min(...valores) : null;
    const max = valores.length ? Math.max(...valores) : null;

    return { tabla, total, nulos, duplicados, min, max };
}

async function main() {
    console.log(`=== Validando sync_seq en ${etiqueta} (solo lectura, no escribe nada) ===\n`);

    const resultados = [];
    for (const tabla of TABLAS) {
        resultados.push(await validarTabla(tabla));
    }

    let huboProblemas = false;
    for (const r of resultados) {
        if (r.error) {
            huboProblemas = true;
            console.log(`✗ ${r.tabla}: ERROR -- ${r.error} (¿corriste sync/migrate_incremental_pull.sql en ${etiqueta}?)`);
            continue;
        }
        const problemas = [];
        if (r.nulos > 0) problemas.push(`${r.nulos} fila(s) con sync_seq NULL (backfill incompleto)`);
        if (r.duplicados > 0) problemas.push(`${r.duplicados} valor(es) de sync_seq duplicados dentro de la tabla`);

        if (problemas.length > 0) {
            huboProblemas = true;
            console.log(`✗ ${r.tabla}: total=${r.total} min=${r.min} max=${r.max} -- ${problemas.join('; ')}`);
        } else {
            console.log(`✓ ${r.tabla}: total=${r.total} min=${r.min} max=${r.max}`);
        }
    }

    console.log('');
    if (huboProblemas) {
        console.log('Hay problemas que revisar antes de confiar en el pull incremental para estas tablas.');
        process.exitCode = 1;
    } else {
        console.log('Todo OK: todas las tablas tienen sync_seq asignado sin nulos ni duplicados.');
    }
}

main().catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});
