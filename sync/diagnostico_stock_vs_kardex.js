// Script manual de SOLO LECTURA (NO forma parte del ciclo de sincronización de la app ni corre
// solo, y NO escribe nada en Supabase).
//
// Compara inventario_sucursal.stock contra el kardex (SUM(cantidad) de movimientos_inventario)
// para detectar productos donde el stock actual no coincide con la suma de sus movimientos.
//
// IMPORTANTE -- por qué este script NO corrige nada automáticamente: se corrió en PRODUCCIÓN el
// 2026-07-25 antes de desplegar sync/migrate_stock_delta_sync.sql y varias filas mostraron una
// diferencia enorme (ej. producto p-a0000065 en Granja: stock real 17, suma del kardex -1). Eso
// significa que movimientos_inventario NO es un historial completo desde el origen para todo el
// catálogo (hay stock que se cargó -- ventas o abastecimientos viejos, importaciones, etc. --
// antes de que existiera el kardex, o por rutas que no lo registraron). "Corregir" el stock para
// que cuadre con esa suma incompleta BORRARÍA existencias reales. Por eso esto se quedó como
// herramienta de diagnóstico manual: sirve para investigar producto por producto, no para
// aplicar en bloque.
//
// Uso:
//   node sync/backfill_stock_desde_kardex.js --test
//   node sync/backfill_stock_desde_kardex.js --prod
//
// No usa sync/supabaseClients.js porque ese módulo depende de `electron` (app.isPackaged) y
// este script corre como Node plano, fuera de Electron.

const { createClient } = require('@supabase/supabase-js');

const PROD = {
    url: 'https://mkbwfypxupebulwhijgw.supabase.co',
    key: 'sb_publishable_fVK6Qpm0tyP0eKu38XUEAw_Spq-ccEw'
};
const TEST = {
    url: 'https://kfcaaiyzdmcdccmhqemf.supabase.co',
    key: 'sb_publishable_aJj-iuP6UjR-IRDIWt3NWg_jJAEc8kG'
};

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

async function leerTodo(tabla, select = '*') {
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

async function main() {
    console.log(`=== Comparando stock vs. kardex en ${etiqueta} (solo lectura, no escribe nada) ===\n`);

    const [inventario, movimientos] = await Promise.all([
        leerTodo('inventario_sucursal', 'producto_id,sucursal_id,stock,updated_at'),
        leerTodo('movimientos_inventario', 'producto_id,sucursal_id,cantidad')
    ]);

    const sumaKardex = new Map(); // "producto_id|sucursal_id" -> suma
    for (const mov of movimientos) {
        const clave = `${mov.producto_id}|${mov.sucursal_id}`;
        sumaKardex.set(clave, (sumaKardex.get(clave) || 0) + Number(mov.cantidad));
    }

    const diferencias = [];
    for (const inv of inventario) {
        const clave = `${inv.producto_id}|${inv.sucursal_id}`;
        if (!sumaKardex.has(clave)) continue; // sin movimientos registrados: no hay con qué comparar
        const esperadoSiKardexFueraCompleto = sumaKardex.get(clave);
        if (Number(inv.stock) !== esperadoSiKardexFueraCompleto) {
            diferencias.push({ producto_id: inv.producto_id, sucursal_id: inv.sucursal_id, actual: Number(inv.stock), sumaKardex: esperadoSiKardexFueraCompleto });
        }
    }

    if (diferencias.length === 0) {
        console.log('Sin diferencias: inventario_sucursal.stock coincide con la suma del kardex en todos los productos con movimientos.');
        return;
    }

    console.log(`Se encontraron ${diferencias.length} fila(s) donde el stock actual no coincide con la suma del kardex.`);
    console.log('Esto NO implica que el stock actual esté mal -- puede ser kardex incompleto. Revisar caso por caso:\n');
    diferencias.forEach(d => {
        console.log(`  producto_id=${d.producto_id} sucursal_id=${d.sucursal_id}  stock_actual=${d.actual}  suma_kardex=${d.sumaKardex}  diferencia=${d.actual - d.sumaKardex}`);
    });
}

main().catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});
