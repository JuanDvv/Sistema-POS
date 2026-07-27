// Script manual. Por defecto SOLO REPORTA (dry-run) qué correcciones de saldo de apertura
// insertaría; con --aplicar además las inserta en Supabase.
//
// Inserta UNA fila de conciliación (tipo='SALDO_APERTURA_KARDEX') por cada producto/sucursal
// donde stock_actual no coincide con la suma del kardex (movimientos_inventario +
// kardex_checkpoints ya podados, ver sync/migrate_kardex_retention.sql), usando stock_actual como
// ancla de verdad -- NUNCA lo modifica, solo agrega el kardex faltante para que la suma cuadre a
// partir de ahora. Va directo a la tabla (no por la RPC aplicar_movimiento_inventario), a
// propósito: esa RPC también suma el delta a inventario_sucursal.stock, y aquí el stock ya es
// correcto -- solo el kardex necesita ponerse al día. Nunca borra ni edita movimientos existentes
// (kardex append-only).
//
// Misma lógica de comparación que sync/diagnostico_stock_vs_kardex.js -- si un producto/sucursal
// no tiene NINGÚN movimiento ni checkpoint todavía, se omite (no hay con qué comparar), igual que
// hace ese diagnóstico.
//
// IMPORTANTE: antes de correr con --aplicar, revisar el reporte del dry-run -- especialmente las
// diferencias grandes -- para confirmar que stock_actual es correcto y no al revés (ver la
// advertencia de fondo en sync/diagnostico_stock_vs_kardex.js: "corregir" en la otra dirección
// borraría existencias reales).
//
// Uso:
//   node sync/conciliar_saldo_apertura.js --test              (dry-run, solo reporta)
//   node sync/conciliar_saldo_apertura.js --test --aplicar    (inserta las correcciones)
//   node sync/conciliar_saldo_apertura.js --prod [--aplicar]
//
// No usa sync/supabaseClients.js porque ese módulo depende de `electron` (app.isPackaged) y este
// script corre como Node plano, fuera de Electron.

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

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
const aplicar = args.includes('--aplicar');

if (usarProd === usarTest) {
    console.error('Debes indicar exactamente uno de --test o --prod.');
    process.exit(1);
}

const cfg = usarProd ? PROD : TEST;
const etiqueta = usarProd ? 'PRODUCCIÓN' : 'TEST';
const cliente = createClient(cfg.url, cfg.key);

const PAGE_SIZE = 1000;
const USUARIO_CONCILIACION = 'Conciliacion-Saldo-Apertura';

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

async function calcularDiferencias() {
    const [inventario, movimientos, checkpoints] = await Promise.all([
        leerTodo('inventario_sucursal', 'producto_id,sucursal_id,stock'),
        leerTodo('movimientos_inventario', 'producto_id,sucursal_id,cantidad'),
        leerTodo('kardex_checkpoints', 'tabla,producto_id,sucursal_id,suma_podada').catch(() => [])
    ]);

    const sumaKardex = new Map();
    for (const mov of movimientos) {
        const clave = `${mov.producto_id}|${mov.sucursal_id}`;
        sumaKardex.set(clave, (sumaKardex.get(clave) || 0) + Number(mov.cantidad));
    }
    for (const chk of checkpoints) {
        if (chk.tabla !== 'movimientos_inventario') continue;
        const clave = `${chk.producto_id}|${chk.sucursal_id}`;
        sumaKardex.set(clave, (sumaKardex.get(clave) || 0) + Number(chk.suma_podada));
    }

    const diferencias = [];
    for (const inv of inventario) {
        const clave = `${inv.producto_id}|${inv.sucursal_id}`;
        if (!sumaKardex.has(clave)) continue;
        const suma = sumaKardex.get(clave);
        const actual = Number(inv.stock);
        if (actual !== suma) {
            diferencias.push({ producto_id: inv.producto_id, sucursal_id: inv.sucursal_id, actual, suma, delta: actual - suma });
        }
    }
    return diferencias;
}

async function main() {
    console.log(`=== Conciliación de saldo de apertura del kardex en ${etiqueta} (${aplicar ? 'APLICANDO' : 'dry-run, solo reporta'}) ===\n`);

    const diferencias = await calcularDiferencias();

    if (diferencias.length === 0) {
        console.log('Sin diferencias: el kardex ya coincide con el stock actual en todos los productos con historial.');
        return;
    }

    console.log(`${diferencias.length} producto(s)/sucursal(es) a conciliar:\n`);
    diferencias.forEach(d => {
        console.log(`  producto_id=${d.producto_id} sucursal_id=${d.sucursal_id}  stock_actual=${d.actual}  suma_kardex=${d.suma}  ajuste_a_insertar=${d.delta > 0 ? '+' : ''}${d.delta}`);
    });

    if (!aplicar) {
        console.log(`\nDry-run: no se insertó nada. Revisar la lista de arriba y correr de nuevo con --aplicar para confirmar.`);
        return;
    }

    console.log('\nInsertando movimientos de conciliación...');
    const ahora = new Date().toISOString();
    const filas = diferencias.map(d => ({
        id: uuidv4(),
        producto_id: d.producto_id,
        sucursal_id: d.sucursal_id,
        tipo: 'SALDO_APERTURA_KARDEX',
        cantidad: d.delta,
        referencia_id: null,
        usuario: USUARIO_CONCILIACION,
        fecha: ahora,
        updated_at: ahora
    }));

    const { error } = await cliente.from('movimientos_inventario').insert(filas);
    if (error) throw new Error(`Insertando conciliación: ${error.message}`);

    console.log(`${filas.length} movimiento(s) de conciliación insertado(s). inventario_sucursal.stock no se tocó.`);

    const restantes = await calcularDiferencias();
    if (restantes.length === 0) {
        console.log('Verificado: el kardex ahora coincide con el stock actual en todos los productos con historial.');
    } else {
        console.log(`ADVERTENCIA: quedaron ${restantes.length} diferencia(s) sin conciliar -- revisar manualmente.`);
    }
}

main().catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});
