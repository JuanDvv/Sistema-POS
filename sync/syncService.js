const { BrowserWindow } = require('electron');
const { runQuery, allQuery } = require('../db/connection');
const { obtenerMensajeSync } = require('../services/auditService');
const { supabase, supabaseLogs, supabaseUrl, supabaseKey } = require('./supabaseClients');

// SRP: motor de sincronización offline-first. Cada función sync* es responsable de UNA sola
// entidad (subir pendientes, subir eliminaciones, descargar cambios de la nube); el orquestador
// procesarSincronizacion() solo decide el orden y centraliza el guard de "sincronización en curso".
//
// Estrategia de resolución de conflictos: LWW (Last-Write-Wins) por updated_at + soft delete.
// - Cada fila sincronizada tiene updated_at (bump automático vía trigger SQLite/Postgres en cada
//   UPDATE) y deleted_at (bandera lógica de borrado, nunca un DELETE físico entre clientes).
// - PUSH: se sube el updated_at local tal cual; un trigger en Postgres (lww_guard, ver
//   migrate_lww_soft_deletes.sql) descarta en silencio cualquier UPDATE cuyo updated_at entrante
//   no sea más nuevo que el ya guardado, así que un cliente con datos desactualizados nunca puede
//   pisar una escritura más reciente de otro. Si la fila no vuelve en el upsert (RLS o LWW-loss),
//   la fila local sigue 'pending' y la siguiente descarga trae la versión ganadora.
// - PULL: solo se sobreescribe localmente si la fila entrante trae updated_at más nuevo que el
//   local Y el registro local no tiene una edición propia sin subir (sync_status <> 'pending').
//   Si la fila remota trae deleted_at, se refleja como DELETE físico local (el SQLite local es un
//   espejo desechable, no la fuente de verdad).

let estaSincronizando = false;
const isSincronizando = () => estaSincronizando;

function nowISO() {
    return new Date().toISOString();
}

// Sube `payload` (debe incluir updated_at) a `tabla`. Devuelve true si Supabase confirmó la
// escritura (fila devuelta) o false si no se aplicó -- por RLS o porque el trigger LWW la
// descartó por estar desactualizada frente a lo que ya había en la nube.
async function upsertConLWW(tabla, payload, columnaId = 'id') {
    const { data, error } = await supabase.from(tabla).upsert(payload).select(columnaId);
    if (error) throw error;
    return !!(data && data.length > 0);
}

// Descarga TODAS las filas de `tabla`, paginando con .range(). PostgREST (API de Supabase)
// capa cada respuesta a un máximo de filas por defecto (1000): un .select('*') plano se trunca en
// silencio -- sin error -- apenas la tabla supera ese tamaño, y las filas que quedan fuera dependen
// del orden interno de Postgres (no garantizado), así que pueden ser justo las más nuevas. Bug real
// detectado en detalle_ventas (1032 filas en la nube): ventas del día no bajaban a los equipos que
// solo consumen por sync, aunque sí existían en Supabase.
const TAMANO_PAGINA_DESCARGA = 1000;
async function descargarTodo(tabla) {
    let desde = 0;
    let filas = [];
    while (true) {
        const { data, error } = await supabase
            .from(tabla)
            .select('*')
            .range(desde, desde + TAMANO_PAGINA_DESCARGA - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        filas = filas.concat(data);
        if (data.length < TAMANO_PAGINA_DESCARGA) break;
        desde += TAMANO_PAGINA_DESCARGA;
    }
    return filas;
}

// Igual que upsertConLWW pero para un soft delete (marca deleted_at en vez de borrar la fila).
async function softDeleteConLWW(tabla, filtro) {
    const ahora = nowISO();
    let query = supabase.from(tabla).update({ deleted_at: ahora, updated_at: ahora });
    for (const [col, val] of Object.entries(filtro)) {
        query = query.eq(col, val);
    }
    const { data, error } = await query.select(Object.keys(filtro)[0]);
    if (error) throw error;
    return !!(data && data.length > 0);
}

// --- Disparador de eventos críticos (ventas, gastos, aprobaciones) ---
// Debounce: agrupa ráfagas de eventos (ej. varias ventas seguidas) en una sola
// sincronización, en vez de disparar un ciclo completo por cada cambio individual.
const DEBOUNCE_EVENTO_CRITICO_MS = 1500;
let debounceEventoCritico = null;
let reintentoPendiente = false;

function solicitarSincronizacion(motivo = 'evento crítico') {
    if (estaSincronizando) {
        // Ya hay un ciclo en curso: no lo interrumpimos, solo marcamos que hace falta
        // otra pasada al terminar para no perder este cambio.
        reintentoPendiente = true;
        return;
    }
    if (debounceEventoCritico) clearTimeout(debounceEventoCritico);
    debounceEventoCritico = setTimeout(() => {
        debounceEventoCritico = null;
        procesarSincronizacion().catch(err => console.error('[Sincronizador] Ciclo automático finalizó con error:', err.message));
    }, DEBOUNCE_EVENTO_CRITICO_MS);
    console.log(`[Sincronizador] Sincronización solicitada (${motivo}).`);
}

// --- 0. SINCRONIZAR COLA DE AUDITORÍA (Local -> Supabase Logs) ---
// Registro de auditoría append-only: sin ediciones ni conflictos, no necesita LWW.
async function syncColaAuditoria() {
    try {
        const logsPendientes = await allQuery(`SELECT * FROM cola_auditoria WHERE sync_status = 'pending'`, []);
        for (const log of logsPendientes) {
            const { error } = await supabaseLogs
                .from('auditoria')
                .insert({
                    fecha: log.fecha,
                    usuario: log.usuario,
                    rol: log.rol,
                    sucursal_id: log.sucursal_id,
                    accion: log.accion,
                    detalles: log.detalles
                });

            if (error) throw error;

            await runQuery(`UPDATE cola_auditoria SET sync_status = 'synced' WHERE id = ?`, [log.id]);
            console.log(`[Sincronizador] Log de auditoría ${log.id} subido a Supabase Logs.`);
        }

        // Retención local de 60 días en SQLite: eliminar logs subidos más antiguos de 60 días
        await runQuery(
            `DELETE FROM cola_auditoria WHERE sync_status = 'synced' AND datetime(fecha) < datetime('now', '-60 days')`,
            []
        );

        // Pruning en la Nube: Eliminar logs en Supabase más antiguos de 90 días para cuidar el límite de 500 MB
        const fechaLimiteNube = new Date();
        fechaLimiteNube.setDate(fechaLimiteNube.getDate() - 90);
        await supabaseLogs
            .from('auditoria')
            .delete()
            .lt('fecha', fechaLimiteNube.toISOString());
    } catch (err) {
        console.log("[Sincronizador] Logs de auditoría no subidos (Offline o error de red):", err.message);
    }
}

// --- 1. SUBIR VENTAS LOCALES A LA NUBE (Local -> Supabase, con LWW) ---
async function syncVentasSubir() {
    try {
        const ventasPendientes = await allQuery(`SELECT * FROM ventas WHERE sync_status = 'pending'`, []);

        for (const venta of ventasPendientes) {
            const gano = await upsertConLWW('ventas', {
                id: venta.id,
                sucursal_id: venta.sucursal_id,
                total: venta.total,
                metodo_pago: venta.metodo_pago,
                fecha: venta.fecha,
                es_credito: venta.es_credito || 0,
                cliente_id: venta.cliente_id || null,
                updated_at: venta.updated_at
            });

            if (!gano) {
                // Perdimos la carrera LWW (o RLS bloqueó): queda 'pending' y la descarga
                // siguiente trae la versión ganadora, en vez de arriesgarnos a pisarla.
                console.log(`[Sincronizador] Venta ${venta.id} no subida: hay una versión más reciente en la nube.`);
                continue;
            }

            const detalles = await allQuery(`SELECT * FROM detalle_ventas WHERE venta_id = ?`, [venta.id]);

            // Borrar las líneas remotas previas antes de reinsertar: si la venta fue editada,
            // detalle_ventas se reemplaza localmente (DELETE + INSERT con nuevos ids), y sin este
            // paso las líneas viejas quedan huérfanas en Supabase y se vuelven a descargar,
            // duplicando los productos y el total al reabrir la venta para editar.
            const { error: errorLimpiezaDetalle } = await supabase
                .from('detalle_ventas')
                .delete()
                .eq('venta_id', venta.id);
            if (errorLimpiezaDetalle) throw errorLimpiezaDetalle;

            // Subir el detalle de los productos vendidos
            for (const det of detalles) {
                const { error: errorDetalle } = await supabase
                    .from('detalle_ventas')
                    .upsert({
                        id: det.id,
                        venta_id: det.venta_id,
                        producto_id: det.producto_id,
                        cantidad: det.cantidad,
                        precio_unitario: det.precio_unitario,
                        updated_at: nowISO()
                    });
                if (errorDetalle) throw errorDetalle;
            }

            // Cambiar estado a sincronizado
            await runQuery(`UPDATE ventas SET sync_status = 'synced' WHERE id = ?`, [venta.id]);
            console.log(`[Sincronizador] Venta ${venta.id} sincronizada con la nube.`);
        }
        return { ok: true };
    } catch (err) {
        console.error("[Sincronizador] Ventas locales no sincronizadas (Modo Offline o error de red):", err.message);
        return { ok: false, message: err.message };
    }
}

// --- 1.5. SINCRONIZAR ELIMINACIONES DE VENTAS (Local -> Supabase, soft delete) ---
async function syncVentasEliminaciones() {
    try {
        const ventasEliminadas = await allQuery(`SELECT * FROM ventas WHERE sync_status = 'deleted'`, []);
        for (const venta of ventasEliminadas) {
            const gano = await softDeleteConLWW('ventas', { id: venta.id });
            if (!gano) {
                // Perdimos la carrera LWW (o RLS bloqueó el UPDATE). Antes esto dejaba la venta en
                // 'deleted' para siempre: cada ciclo la volvía a intentar y volvía a fallar contra
                // la misma fila remota, generando un bucle infinito. Resolvemos el conflicto ahora
                // mismo consultando qué hay realmente en la nube, en vez de reintentar indefinidamente.
                const { data: filaNube, error: errFilaNube } = await supabase
                    .from('ventas')
                    .select('*')
                    .eq('id', venta.id)
                    .maybeSingle();

                if (errFilaNube || !filaNube) {
                    // No se pudo confirmar el estado remoto (red/RLS): dejamos de reintentar
                    // marcando la venta como sincronizada en vez de repetir el intento cada ciclo.
                    console.log(`[Sincronizador] Eliminación de venta ${venta.id} pospuesta: no se pudo confirmar el estado en la nube. Se deja de reintentar.`);
                    await runQuery(`UPDATE ventas SET sync_status = 'synced' WHERE id = ?`, [venta.id]);
                } else if (filaNube.deleted_at) {
                    // La nube también la tiene eliminada: completamos el borrado local.
                    await runQuery(`DELETE FROM detalle_ventas WHERE venta_id = ?`, [venta.id]);
                    await runQuery(`DELETE FROM ventas WHERE id = ?`, [venta.id]);
                    console.log(`[Sincronizador] Eliminación de venta ${venta.id} confirmada con la nube.`);
                } else {
                    // Hay una versión más reciente y viva en la nube: la adoptamos localmente en
                    // lugar de insistir en el borrado, y queda 'synced' para no reintentar.
                    await runQuery(
                        `UPDATE ventas SET sucursal_id = ?, total = ?, metodo_pago = ?, fecha = ?, es_credito = ?, cliente_id = ?, sync_status = 'synced', updated_at = ? WHERE id = ?`,
                        [filaNube.sucursal_id, filaNube.total, filaNube.metodo_pago, filaNube.fecha, filaNube.es_credito, filaNube.cliente_id, filaNube.updated_at, venta.id]
                    );
                    console.log(`[Sincronizador] Eliminación de venta ${venta.id} pospuesta: se adoptó la versión más reciente de la nube en vez de reintentar indefinidamente.`);
                }
                continue;
            }
            await supabase.from('detalle_ventas').delete().eq('venta_id', venta.id);
            await runQuery(`DELETE FROM detalle_ventas WHERE venta_id = ?`, [venta.id]);
            await runQuery(`DELETE FROM ventas WHERE id = ?`, [venta.id]);
            console.log(`[Sincronizador] Eliminación de venta ${venta.id} sincronizada con la nube.`);
        }
    } catch (err) {
        console.log("[Sincronizador] Eliminaciones de ventas no sincronizadas (Modo Offline o error de red):", err.message);
    }
}

// --- 1.7. DESCARGAR VENTAS DESDE LA NUBE (Supabase -> Local, con LWW) ---
async function syncVentasDescargar() {
    try {
        const ventasNube = await descargarTodo('ventas');

        if (ventasNube) {
            for (const venta of ventasNube) {
                if (venta.deleted_at) {
                    await runQuery(`DELETE FROM detalle_ventas WHERE venta_id = ?`, [venta.id]);
                    await runQuery(`DELETE FROM ventas WHERE id = ? AND sync_status <> 'pending'`, [venta.id]);
                    continue;
                }
                await runQuery(
                    `INSERT INTO ventas (id, sucursal_id, total, metodo_pago, fecha, es_credito, cliente_id, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                        sucursal_id = excluded.sucursal_id,
                        total = excluded.total,
                        metodo_pago = excluded.metodo_pago,
                        fecha = excluded.fecha,
                        es_credito = excluded.es_credito,
                        cliente_id = excluded.cliente_id,
                        sync_status = 'synced',
                        updated_at = excluded.updated_at
                     WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                    [venta.id, venta.sucursal_id, venta.total, venta.metodo_pago, venta.fecha, venta.es_credito, venta.cliente_id, venta.updated_at]
                );
            }
        }

        const detVentasNube = await descargarTodo('detalle_ventas');

        if (detVentasNube) {
            for (const det of detVentasNube) {
                if (det.deleted_at) {
                    await runQuery(`DELETE FROM detalle_ventas WHERE id = ?`, [det.id]);
                    continue;
                }
                await runQuery(
                    `INSERT INTO detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?)
                     ON CONFLICT(id) DO UPDATE SET
                        venta_id = excluded.venta_id,
                        producto_id = excluded.producto_id,
                        cantidad = excluded.cantidad,
                        precio_unitario = excluded.precio_unitario,
                        updated_at = excluded.updated_at
                     WHERE excluded.updated_at > updated_at`,
                    [det.id, det.venta_id, det.producto_id, det.cantidad, det.precio_unitario, det.updated_at]
                );
            }
        }
        console.log("[Sincronizador] Ventas y detalles descargados desde la nube.");
        return { ok: true };
    } catch (err) {
        console.error("[Sincronizador] No se pudieron descargar ventas (Modo Offline o error de red):", err.message);
        return { ok: false, message: err.message };
    }
}

// --- 1.8. REPARAR LÍNEAS DE detalle_ventas DUPLICADAS ---
// Limpieza de datos ya corrompidos por el bug histórico previo al soft delete/LWW.
// Idempotente: no hace nada si no hay duplicados.
async function repararDetalleVentasDuplicado() {
    try {
        const detalles = await allQuery(`SELECT id, venta_id, producto_id FROM detalle_ventas ORDER BY id ASC`, []);
        const conservados = new Set();
        const duplicados = [];

        for (const det of detalles) {
            const key = `${det.venta_id}|${det.producto_id}`;
            if (conservados.has(key)) {
                duplicados.push(det.id);
            } else {
                conservados.add(key);
            }
        }

        if (duplicados.length === 0) return;

        for (const id of duplicados) {
            await runQuery(`DELETE FROM detalle_ventas WHERE id = ?`, [id]);
            const { error } = await supabase.from('detalle_ventas').delete().eq('id', id);
            if (error) throw error;
        }
        console.log(`[Sincronizador] Se repararon ${duplicados.length} línea(s) de detalle_ventas duplicadas.`);
    } catch (err) {
        console.log("[Sincronizador] No se pudo reparar detalle_ventas duplicado (Modo Offline o error de red):", err.message);
    }
}

// --- 2. SUBIR GASTOS LOCALES A LA NUBE (Local -> Supabase, con LWW) ---
async function syncGastosSubir() {
    try {
        const gastosPendientes = await allQuery(`SELECT * FROM gastos WHERE sync_status = 'pending'`, []);

        for (const gasto of gastosPendientes) {
            const gano = await upsertConLWW('gastos', {
                id: gasto.id,
                sucursal_id: gasto.sucursal_id,
                tipo: gasto.tipo,
                descripcion: gasto.descripcion,
                monto: gasto.monto,
                fecha: gasto.fecha,
                metodo_pago: gasto.metodo_pago,
                estado: gasto.estado,
                venta_id: gasto.venta_id || null,
                pedido_id: gasto.pedido_id || null,
                updated_at: gasto.updated_at
            });

            if (!gano) {
                console.log(`[Sincronizador] Gasto ${gasto.id} no subido: hay una versión más reciente en la nube.`);
                continue;
            }

            await runQuery(`UPDATE gastos SET sync_status = 'synced' WHERE id = ?`, [gasto.id]);
            console.log(`[Sincronizador] Gasto ${gasto.id} sincronizado con la nube.`);
        }
        return { ok: true };
    } catch (err) {
        console.error("[Sincronizador] Gastos locales no sincronizados (Modo Offline o error de red):", err.message);
        return { ok: false, message: err.message };
    }
}

// --- 2.5. SINCRONIZAR ELIMINACIONES DE GASTOS (Local -> Supabase, soft delete) ---
async function syncGastosEliminaciones() {
    try {
        const gastosEliminados = await allQuery(`SELECT * FROM gastos WHERE sync_status = 'deleted'`, []);
        for (const gasto of gastosEliminados) {
            const gano = await softDeleteConLWW('gastos', { id: gasto.id });
            if (!gano) {
                // Perdimos la carrera LWW (o RLS bloqueó el UPDATE). Antes esto dejaba el gasto en
                // 'deleted' para siempre: cada ciclo lo volvía a intentar y volvía a fallar contra la
                // misma fila remota, generando un bucle infinito (mismo id repitiéndose sin parar en el
                // log). Resolvemos el conflicto ahora mismo consultando qué hay realmente en la nube.
                const { data: filaNube, error: errFilaNube } = await supabase
                    .from('gastos')
                    .select('*')
                    .eq('id', gasto.id)
                    .maybeSingle();

                if (errFilaNube) {
                    // No se pudo confirmar el estado remoto (red/RLS): dejamos de reintentar
                    // marcando el gasto como sincronizado en vez de repetir el intento cada ciclo.
                    console.log(`[Sincronizador] Eliminación del gasto ${gasto.id} pospuesta: no se pudo confirmar el estado en la nube. Se deja de reintentar.`);
                    await runQuery(`UPDATE gastos SET sync_status = 'synced' WHERE id = ?`, [gasto.id]);
                } else if (!filaNube || filaNube.deleted_at) {
                    // La fila nunca llegó a subirse (nunca existió en la nube) o ya está eliminada
                    // allá también: no hay nada que reconciliar, se completa el borrado local.
                    await runQuery(`DELETE FROM gastos WHERE id = ?`, [gasto.id]);
                    console.log(`[Sincronizador] Eliminación del gasto ${gasto.id} confirmada con la nube.`);
                } else {
                    // Hay una versión más reciente y viva en la nube: la adoptamos localmente en
                    // lugar de insistir en el borrado, y queda 'synced' para no reintentar.
                    await runQuery(
                        `UPDATE gastos SET sucursal_id = ?, tipo = ?, descripcion = ?, monto = ?, fecha = ?, metodo_pago = ?, estado = ?, venta_id = ?, pedido_id = ?, sync_status = 'synced', updated_at = ? WHERE id = ?`,
                        [filaNube.sucursal_id, filaNube.tipo, filaNube.descripcion, filaNube.monto, filaNube.fecha, filaNube.metodo_pago, filaNube.estado, filaNube.venta_id, filaNube.pedido_id, filaNube.updated_at, gasto.id]
                    );
                    console.log(`[Sincronizador] Eliminación del gasto ${gasto.id} pospuesta: se adoptó la versión más reciente de la nube en vez de reintentar indefinidamente.`);
                }
                continue;
            }
            await runQuery(`DELETE FROM gastos WHERE id = ?`, [gasto.id]);
            console.log(`[Sincronizador] Eliminación del gasto ${gasto.id} sincronizada con la nube.`);
        }
    } catch (err) {
        console.log("[Sincronizador] Eliminaciones de gastos no sincronizadas (Modo Offline o error de red):", err.message);
    }
}

// --- 2.7. DESCARGAR GASTOS DESDE LA NUBE (Supabase -> Local, con LWW) ---
async function syncGastosDescargar() {
    try {
        const gastosNube = await descargarTodo('gastos');

        if (gastosNube) {
            for (const gasto of gastosNube) {
                if (gasto.deleted_at) {
                    await runQuery(`DELETE FROM gastos WHERE id = ? AND sync_status <> 'pending'`, [gasto.id]);
                    continue;
                }
                await runQuery(
                    `INSERT INTO gastos (id, sucursal_id, tipo, descripcion, monto, fecha, metodo_pago, estado, venta_id, pedido_id, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                        sucursal_id = excluded.sucursal_id,
                        tipo = excluded.tipo,
                        descripcion = excluded.descripcion,
                        monto = excluded.monto,
                        fecha = excluded.fecha,
                        metodo_pago = excluded.metodo_pago,
                        estado = excluded.estado,
                        venta_id = excluded.venta_id,
                        pedido_id = excluded.pedido_id,
                        sync_status = 'synced',
                        updated_at = excluded.updated_at
                     WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                    [gasto.id, gasto.sucursal_id, gasto.tipo, gasto.descripcion, gasto.monto, gasto.fecha, gasto.metodo_pago, gasto.estado, gasto.venta_id || null, gasto.pedido_id || null, gasto.updated_at]
                );
            }
            console.log("[Sincronizador] Gastos descargados desde la nube.");
        }
        return { ok: true };
    } catch (err) {
        console.error("[Sincronizador] No se pudieron descargar gastos (Modo Offline o error de red):", err.message);
        return { ok: false, message: err.message };
    }
}

// --- 3. SUBIR PRODUCTOS CREADOS O EDITADOS LOCALMENTE (Local -> Supabase, con LWW) ---
async function syncProductosSubir() {
    try {
        const productosPendientes = await allQuery(`SELECT * FROM productos WHERE sync_status = 'pending'`, []);
        for (const prod of productosPendientes) {
            const gano = await upsertConLWW('productos', {
                id: prod.id,
                nombre: prod.nombre,
                descripcion: prod.descripcion,
                precio: prod.precio,
                stock_minimo: prod.stock_minimo,
                foto_path: prod.foto_path,
                categoria_id: prod.categoria_id,
                updated_at: prod.updated_at
            });

            if (!gano) {
                console.log(`[Sincronizador] Producto ${prod.nombre} (${prod.id}) no subido: hay una versión más reciente en la nube.`);
                continue;
            }

            await runQuery(`UPDATE productos SET sync_status = 'synced' WHERE id = ?`, [prod.id]);
            console.log(`[Sincronizador] Producto ${prod.nombre} (${prod.id}) sincronizado con la nube.`);
        }
    } catch (err) {
        console.log("[Sincronizador] Productos locales no sincronizados (Modo Offline o error de red):", err.message);
    }
}

// --- 3.2. SUBIR CATEGORÍAS CREADAS O EDITADAS LOCALMENTE (Local -> Supabase, con LWW) ---
async function syncCategoriasSubir() {
    try {
        const categoriasPendientes = await allQuery(`SELECT * FROM categorias WHERE sync_status = 'pending'`, []);
        for (const cat of categoriasPendientes) {
            const gano = await upsertConLWW('categorias', {
                id: cat.id,
                nombre: cat.nombre,
                categoria_padre_id: cat.categoria_padre_id,
                updated_at: cat.updated_at
            });

            if (!gano) {
                console.log(`[Sincronizador] Categoría ${cat.nombre} no subida: hay una versión más reciente en la nube.`);
                continue;
            }

            await runQuery(`UPDATE categorias SET sync_status = 'synced' WHERE id = ?`, [cat.id]);
            console.log(`[Sincronizador] Categoría ${cat.nombre} sincronizada con la nube.`);
        }
    } catch (err) {
        console.log("[Sincronizador] Categorías locales no sincronizadas (Modo Offline o error de red):", err.message);
    }
}

// --- 3.4. SINCRONIZAR ELIMINACIONES DE CATEGORÍAS (Local -> Supabase, soft delete) ---
async function syncCategoriasEliminaciones() {
    try {
        const categoriasEliminadas = await allQuery(`SELECT * FROM categorias WHERE sync_status = 'deleted'`, []);
        for (const cat of categoriasEliminadas) {
            const gano = await softDeleteConLWW('categorias', { id: cat.id });
            if (!gano) {
                console.log(`[Sincronizador] Eliminación de categoría ${cat.id} pospuesta: hay una versión más reciente en la nube.`);
                continue;
            }
            await runQuery(`DELETE FROM categorias WHERE id = ?`, [cat.id]);
            console.log(`[Sincronizador] Eliminación de categoría ${cat.id} sincronizada con la nube.`);
        }
    } catch (err) {
        console.log("[Sincronizador] Eliminación de categorías no sincronizada:", err.message);
    }
}

// --- 3.5. SUBIR INVENTARIO POR SUCURSAL EDITADO LOCALMENTE (Local -> Supabase, con LWW) ---
async function syncInventarioSubir() {
    try {
        const stocksPendientes = await allQuery(`SELECT * FROM inventario_sucursal WHERE sync_status = 'pending'`, []);
        for (const inv of stocksPendientes) {
            const gano = await upsertConLWW('inventario_sucursal', {
                producto_id: inv.producto_id,
                sucursal_id: inv.sucursal_id,
                stock: inv.stock,
                stock_reservado: inv.stock_reservado || 0,
                updated_at: inv.updated_at
            }, 'producto_id');

            if (!gano) {
                console.log(`[Sincronizador] Existencias de ${inv.producto_id} en ${inv.sucursal_id} no subidas: hay una versión más reciente en la nube.`);
                continue;
            }

            await runQuery(
                `UPDATE inventario_sucursal SET sync_status = 'synced' WHERE producto_id = ? AND sucursal_id = ?`,
                [inv.producto_id, inv.sucursal_id]
            );
            console.log(`[Sincronizador] Existencias del producto ${inv.producto_id} en ${inv.sucursal_id} sincronizadas.`);
        }
    } catch (err) {
        console.log("[Sincronizador] Existencias de inventario no sincronizadas (Modo Offline o error de red):", err.message);
    }
}

// La tabla 'movimientos_inventario' puede no existir aún en Supabase (o el cache de esquema de
// PostgREST puede no reconocerla tras crearla). En ese caso Supabase responde con el error
// PGRST205 "Could not find the table ... in the schema cache". Detectamos ese caso puntual para
// degradar en silencio (sin romper el resto del ciclo de sincronización) y evitar reintentar
// contra la red en cada ciclo mientras la tabla siga sin existir.
let movimientosInventarioTablaDisponible = true;
// Mismo caso que movimientos_inventario: mientras el usuario no corra el SQL de las tablas del
// módulo de Pedidos/Apartados en Supabase, se degrada en silencio en vez de romper el ciclo.
let pedidosTablasDisponibles = true;

function esErrorTablaInexistente(error) {
    if (!error) return false;
    const mensaje = String(error.message || '').toLowerCase();
    return error.code === 'PGRST205' || mensaje.includes('could not find the table') || mensaje.includes('schema cache');
}

// --- 3.6. SUBIR MOVIMIENTOS DE INVENTARIO (Local -> Supabase, con LWW) ---
// Append-only (Kardex): nunca se editan ni se eliminan localmente, por eso no tiene una función
// de "eliminaciones" propia como ventas/transferencias.
async function syncMovimientosInventarioSubir() {
    if (!movimientosInventarioTablaDisponible) return;
    try {
        const movimientosPendientes = await allQuery(`SELECT * FROM movimientos_inventario WHERE sync_status = 'pending'`, []);
        for (const mov of movimientosPendientes) {
            const gano = await upsertConLWW('movimientos_inventario', {
                id: mov.id,
                producto_id: mov.producto_id,
                sucursal_id: mov.sucursal_id,
                tipo: mov.tipo,
                cantidad: mov.cantidad,
                referencia_id: mov.referencia_id,
                usuario: mov.usuario,
                fecha: mov.fecha,
                updated_at: mov.updated_at
            });

            if (!gano) {
                console.log(`[Sincronizador] Movimiento de inventario ${mov.id} no subido: hay una versión más reciente en la nube.`);
                continue;
            }

            await runQuery(`UPDATE movimientos_inventario SET sync_status = 'synced' WHERE id = ?`, [mov.id]);
            console.log(`[Sincronizador] Movimiento de inventario ${mov.id} sincronizado con la nube.`);
        }
    } catch (err) {
        if (esErrorTablaInexistente(err)) {
            movimientosInventarioTablaDisponible = false;
            console.log("[Sincronizador] La tabla 'movimientos_inventario' no existe en Supabase (o el cache de esquema no la reconoce). Se omite esta sincronización sin interrumpir el resto del ciclo.");
            return;
        }
        console.log("[Sincronizador] Movimientos de inventario no sincronizados (Modo Offline o error de red):", err.message);
    }
}

// --- 4. SINCRONIZAR ELIMINACIONES DE PRODUCTOS (Local -> Supabase, soft delete) ---
async function syncProductosEliminaciones() {
    try {
        const productosEliminados = await allQuery(`SELECT * FROM productos WHERE sync_status = 'deleted'`, []);
        for (const prod of productosEliminados) {
            const gano = await softDeleteConLWW('productos', { id: prod.id });
            if (!gano) {
                console.log(`[Sincronizador] Eliminación del producto ${prod.id} pospuesta: hay una versión más reciente en la nube.`);
                continue;
            }
            await runQuery(`DELETE FROM inventario_sucursal WHERE producto_id = ?`, [prod.id]);
            await runQuery(`DELETE FROM productos WHERE id = ?`, [prod.id]);
            console.log(`[Sincronizador] Eliminación del producto ${prod.id} sincronizada con la nube.`);
        }
    } catch (err) {
        console.log("[Sincronizador] Eliminaciones de productos no sincronizadas (Modo Offline o error de red):", err.message);
    }
}

// --- 4.5. DESCARGAR CATEGORÍAS DESDE SUPABASE (con LWW) ---
async function syncCategoriasDescargar() {
    try {
        const categoriasNube = await descargarTodo('categorias');

        if (categoriasNube) {
            for (const cat of categoriasNube) {
                if (cat.deleted_at) {
                    await runQuery(`DELETE FROM categorias WHERE id = ? AND sync_status <> 'pending'`, [cat.id]);
                    continue;
                }
                await runQuery(
                    `INSERT INTO categorias (id, nombre, categoria_padre_id, sync_status, updated_at)
                     VALUES (?, ?, ?, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                        nombre = excluded.nombre,
                        categoria_padre_id = excluded.categoria_padre_id,
                        sync_status = 'synced',
                        updated_at = excluded.updated_at
                     WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                    [cat.id, cat.nombre, cat.categoria_padre_id, cat.updated_at]
                );
            }
            console.log("[Sincronizador] Categorías actualizadas desde la nube.");
        }
    } catch (err) {
        console.log("[Sincronizador] No se pudieron descargar categorías (Modo Offline):", err.message);
    }
}

// --- 5. DESCARGAR ACTUALIZACIONES DEL CATÁLOGO GLOBAL (Supabase -> Local, con LWW) ---
async function syncProductosDescargar() {
    try {
        const productosNube = await descargarTodo('productos');

        if (productosNube) {
            for (const prod of productosNube) {
                if (prod.deleted_at) {
                    await runQuery(`DELETE FROM inventario_sucursal WHERE producto_id = ?`, [prod.id]);
                    await runQuery(`DELETE FROM productos WHERE id = ? AND sync_status <> 'pending'`, [prod.id]);
                    continue;
                }
                await runQuery(
                    `INSERT INTO productos (id, nombre, descripcion, precio, stock_minimo, foto_path, categoria_id, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                        nombre = excluded.nombre,
                        descripcion = excluded.descripcion,
                        precio = excluded.precio,
                        stock_minimo = excluded.stock_minimo,
                        foto_path = excluded.foto_path,
                        categoria_id = excluded.categoria_id,
                        sync_status = 'synced',
                        updated_at = excluded.updated_at
                     WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                    [prod.id, prod.nombre, prod.descripcion, prod.precio, prod.stock_minimo, prod.foto_path, prod.categoria_id, prod.updated_at]
                );
            }
            console.log("[Sincronizador] Catálogo de inventario actualizado desde la nube.");
        }
    } catch (err) {
        console.log("[Sincronizador] No se pudo descargar el catálogo (Modo Offline):", err.message);
    }
}

// --- 5.5. DESCARGAR ACTUALIZACIONES DE INVENTARIO POR SUCURSAL (Supabase -> Local, con LWW) ---
async function syncInventarioDescargar() {
    try {
        const invNube = await descargarTodo('inventario_sucursal');

        if (invNube) {
            for (const inv of invNube) {
                if (inv.deleted_at) {
                    await runQuery(
                        `DELETE FROM inventario_sucursal WHERE producto_id = ? AND sucursal_id = ? AND sync_status <> 'pending'`,
                        [inv.producto_id, inv.sucursal_id]
                    );
                    continue;
                }
                await runQuery(
                    `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, stock_reservado, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, 'synced', ?)
                     ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                        stock = excluded.stock,
                        stock_reservado = excluded.stock_reservado,
                        sync_status = 'synced',
                        updated_at = excluded.updated_at
                     WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                    [inv.producto_id, inv.sucursal_id, inv.stock, inv.stock_reservado || 0, inv.updated_at]
                );
            }
            console.log("[Sincronizador] Existencias por sucursal actualizadas desde la nube.");
        }
    } catch (err) {
        console.log("[Sincronizador] No se pudieron descargar existencias por sucursal (Modo Offline):", err.message);
    }
}

// --- 5.7. DESCARGAR MOVIMIENTOS DE INVENTARIO (Supabase -> Local, con LWW) ---
async function syncMovimientosInventarioDescargar() {
    if (!movimientosInventarioTablaDisponible) return;
    try {
        const movsNube = await descargarTodo('movimientos_inventario');

        if (movsNube) {
            for (const mov of movsNube) {
                if (mov.deleted_at) {
                    await runQuery(`DELETE FROM movimientos_inventario WHERE id = ? AND sync_status <> 'pending'`, [mov.id]);
                    continue;
                }
                await runQuery(
                    `INSERT INTO movimientos_inventario (id, producto_id, sucursal_id, tipo, cantidad, referencia_id, usuario, fecha, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                        producto_id = excluded.producto_id,
                        sucursal_id = excluded.sucursal_id,
                        tipo = excluded.tipo,
                        cantidad = excluded.cantidad,
                        referencia_id = excluded.referencia_id,
                        usuario = excluded.usuario,
                        fecha = excluded.fecha,
                        sync_status = 'synced',
                        updated_at = excluded.updated_at
                     WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                    [mov.id, mov.producto_id, mov.sucursal_id, mov.tipo, mov.cantidad, mov.referencia_id, mov.usuario, mov.fecha, mov.updated_at]
                );
            }
            console.log("[Sincronizador] Movimientos de inventario actualizados desde la nube.");
        }
    } catch (err) {
        if (esErrorTablaInexistente(err)) {
            movimientosInventarioTablaDisponible = false;
            console.log("[Sincronizador] La tabla 'movimientos_inventario' no existe en Supabase (o el cache de esquema no la reconoce). Se omite esta sincronización sin interrumpir el resto del ciclo.");
            return;
        }
        console.log("[Sincronizador] No se pudieron descargar movimientos de inventario (Modo Offline):", err.message);
    }
}

// --- 6. SINCRONIZAR CONFIGURACIÓN DE SUCURSALES (Bidireccional, con LWW) ---
async function syncSucursales() {
    // A. Subir cambios locales pendientes a la nube
    try {
        const sucursalesPendientes = await allQuery(
            `SELECT id, nombre, direccion, telefono, updated_at FROM config_sucursal WHERE sync_status = 'pending'`, []
        );
        for (const suc of sucursalesPendientes) {
            const gano = await upsertConLWW('config_sucursal', {
                id: suc.id, nombre: suc.nombre, direccion: suc.direccion, telefono: suc.telefono, updated_at: suc.updated_at
            });
            if (!gano) {
                console.log(`[Sincronizador] Sucursal ${suc.id} no subida: hay una versión más reciente en la nube (o RLS la bloqueó).`);
                continue;
            }
            await runQuery(`UPDATE config_sucursal SET sync_status = 'synced' WHERE id = ?`, [suc.id]);
            console.log(`[Sincronizador] Sucursal ${suc.id} sincronizada con la nube.`);
        }
    } catch (errUpload) {
        console.log("[Sincronizador] No se pudieron subir sucursales:", obtenerMensajeSync(errUpload, 'config_sucursal'));
    }

    // B. Descargar cambios de la nube a local (solo si no hay error de red)
    try {
        const sucursalesNube = await descargarTodo('config_sucursal');

        if (sucursalesNube) {
            for (const suc of sucursalesNube) {
                if (suc.deleted_at) {
                    await runQuery(`DELETE FROM config_sucursal WHERE id = ? AND sync_status <> 'pending'`, [suc.id]);
                    continue;
                }
                // 'activa' es un flag local por terminal: nunca se sobrescribe con la nube.
                await runQuery(
                    `INSERT INTO config_sucursal (id, nombre, direccion, telefono, activa, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, 0, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                        nombre = excluded.nombre,
                        direccion = excluded.direccion,
                        telefono = excluded.telefono,
                        sync_status = 'synced',
                        updated_at = excluded.updated_at
                     WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                    [suc.id, suc.nombre, suc.direccion, suc.telefono, suc.updated_at]
                );
            }
            console.log("[Sincronizador] Configuración de sucursales sincronizada con la nube.");
        }
    } catch (errDownload) {
        console.log("[Sincronizador] No se pudieron descargar sucursales (Modo Offline):", errDownload.message);
    }
}

// --- 7. SINCRONIZAR USUARIOS (Bidireccional, con LWW y tolerante a desconexión) ---
async function syncUsuarios() {
    try {
        // A. Subir cambios locales pendientes a la nube
        try {
            const usuariosPendientes = await allQuery(`SELECT id, username, password, rol, updated_at FROM usuarios WHERE sync_status = 'pending'`, []);
            for (const usr of usuariosPendientes) {
                // Solo intentamos subir si no es el admin por defecto local temporal
                if (usr.id === 'u-admin-default') continue;

                const gano = await upsertConLWW('usuarios', {
                    id: usr.id, username: usr.username, password: usr.password, rol: usr.rol, updated_at: usr.updated_at
                });
                if (!gano) {
                    console.log(`[Sincronizador] Usuario ${usr.username} no subido: hay una versión más reciente en la nube (o RLS la bloqueó).`);
                    continue;
                }
                await runQuery(`UPDATE usuarios SET sync_status = 'synced' WHERE id = ?`, [usr.id]);
                console.log(`[Sincronizador] Usuario ${usr.username} sincronizado con la nube.`);
            }
        } catch (errUpload) {
            console.log("[Sincronizador] No se pudieron subir usuarios:", obtenerMensajeSync(errUpload, 'usuarios'));
        }

        // B. Descargar cambios de la nube a local (solo si no hay error de red)
        try {
            const usuariosNube = await descargarTodo('usuarios');

            if (usuariosNube) {
                // Si en la nube ya existe un usuario con username 'admin' (con otro ID),
                // eliminamos el admin local por defecto para evitar la colisión de UNIQUE constraint.
                const tieneAdminNube = usuariosNube.some(u => u.username === 'admin' && !u.deleted_at);
                if (tieneAdminNube) {
                    await runQuery(`DELETE FROM usuarios WHERE id = 'u-admin-default'`, []);
                }

                for (const usr of usuariosNube) {
                    if (usr.deleted_at) {
                        await runQuery(`DELETE FROM usuarios WHERE id = ? AND id <> 'u-admin-default' AND sync_status <> 'pending'`, [usr.id]);
                        continue;
                    }
                    await runQuery(
                        `INSERT INTO usuarios (id, username, password, rol, sync_status, updated_at)
                         VALUES (?, ?, ?, ?, 'synced', ?)
                         ON CONFLICT(id) DO UPDATE SET
                            username = excluded.username,
                            password = excluded.password,
                            rol = excluded.rol,
                            sync_status = 'synced',
                            updated_at = excluded.updated_at
                         WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                        [usr.id, usr.username, usr.password, usr.rol, usr.updated_at]
                    );
                }
                console.log("[Sincronizador] Usuarios sincronizados con la nube.");
            }
        } catch (errDownload) {
            console.log("[Sincronizador] No se pudieron descargar usuarios (Modo Offline):", errDownload.message);
        }
    } catch (err) {
        console.log("[Sincronizador] Error general en sincronización de usuarios:", err.message);
    }
}

// --- 8. SINCRONIZAR TRANSFERENCIAS (Local -> Supabase, con LWW) ---
async function syncTransferenciasSubir() {
    try {
        const transferenciasPendientes = await allQuery(`SELECT * FROM transferencias WHERE sync_status = 'pending'`, []);
        for (const trans of transferenciasPendientes) {
            const gano = await upsertConLWW('transferencias', {
                id: trans.id,
                sucursal_origen_id: trans.sucursal_origen_id,
                sucursal_destino_id: trans.sucursal_destino_id,
                fecha: trans.fecha,
                usuario: trans.usuario,
                updated_at: trans.updated_at
            });

            if (!gano) {
                console.log(`[Sincronizador] Transferencia ${trans.id} no subida: hay una versión más reciente en la nube.`);
                continue;
            }

            const detalles = await allQuery(`SELECT * FROM detalle_transferencias WHERE transferencia_id = ?`, [trans.id]);
            for (const det of detalles) {
                const { error: errDetalle } = await supabase
                    .from('detalle_transferencias')
                    .upsert({
                        id: det.id,
                        transferencia_id: det.transferencia_id,
                        producto_id: det.producto_id,
                        cantidad: det.cantidad,
                        updated_at: nowISO()
                    });
                if (errDetalle) throw errDetalle;
            }

            await runQuery(`UPDATE transferencias SET sync_status = 'synced' WHERE id = ?`, [trans.id]);
            console.log(`[Sincronizador] Transferencia ${trans.id} subida a Supabase.`);
        }
    } catch (errTrans) {
        console.log("[Sincronizador] Transferencias no subidas (Offline o error de red):", errTrans.message);
    }
}

// --- 8.2. SINCRONIZAR ELIMINACIONES DE TRANSFERENCIAS (Local -> Supabase, soft delete) ---
async function syncTransferenciasEliminaciones() {
    try {
        const transferenciasEliminadas = await allQuery(`SELECT * FROM transferencias WHERE sync_status = 'deleted'`, []);
        for (const trans of transferenciasEliminadas) {
            const gano = await softDeleteConLWW('transferencias', { id: trans.id });
            if (!gano) {
                console.log(`[Sincronizador] Eliminación de transferencia ${trans.id} pospuesta: hay una versión más reciente en la nube.`);
                continue;
            }
            await supabase.from('detalle_transferencias').delete().eq('transferencia_id', trans.id);
            await runQuery(`DELETE FROM detalle_transferencias WHERE transferencia_id = ?`, [trans.id]);
            await runQuery(`DELETE FROM transferencias WHERE id = ?`, [trans.id]);
            console.log(`[Sincronizador] Eliminación de transferencia ${trans.id} sincronizada con la nube.`);
        }
    } catch (err) {
        console.log("[Sincronizador] Eliminaciones de transferencias no sincronizadas:", err.message);
    }
}

// --- 8.5. DESCARGAR TRANSFERENCIAS (Supabase -> Local, con LWW) ---
async function syncTransferenciasDescargar() {
    try {
        const transNube = await descargarTodo('transferencias');

        if (transNube) {
            for (const trans of transNube) {
                if (trans.deleted_at) {
                    await runQuery(`DELETE FROM detalle_transferencias WHERE transferencia_id = ?`, [trans.id]);
                    await runQuery(`DELETE FROM transferencias WHERE id = ? AND sync_status <> 'pending'`, [trans.id]);
                    continue;
                }
                await runQuery(
                    `INSERT INTO transferencias (id, sucursal_origen_id, sucursal_destino_id, fecha, usuario, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, ?, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                        sucursal_origen_id = excluded.sucursal_origen_id,
                        sucursal_destino_id = excluded.sucursal_destino_id,
                        fecha = excluded.fecha,
                        usuario = excluded.usuario,
                        sync_status = 'synced',
                        updated_at = excluded.updated_at
                     WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                    [trans.id, trans.sucursal_origen_id, trans.sucursal_destino_id, trans.fecha, trans.usuario, trans.updated_at]
                );
            }
        }

        const detNube = await descargarTodo('detalle_transferencias');

        if (detNube) {
            for (const det of detNube) {
                if (det.deleted_at) {
                    await runQuery(`DELETE FROM detalle_transferencias WHERE id = ?`, [det.id]);
                    continue;
                }
                await runQuery(
                    `INSERT INTO detalle_transferencias (id, transferencia_id, producto_id, cantidad, updated_at)
                     VALUES (?, ?, ?, ?, ?)
                     ON CONFLICT(id) DO UPDATE SET
                        transferencia_id = excluded.transferencia_id,
                        producto_id = excluded.producto_id,
                        cantidad = excluded.cantidad,
                        updated_at = excluded.updated_at
                     WHERE excluded.updated_at > updated_at`,
                    [det.id, det.transferencia_id, det.producto_id, det.cantidad, det.updated_at]
                );
            }
        }
        console.log("[Sincronizador] Transferencias y detalles descargados desde la nube.");
    } catch (err) {
        console.log("[Sincronizador] No se pudieron descargar transferencias (Modo Offline o error de red):", err.message);
    }
}

// --- 9. SINCRONIZAR CLIENTES (Bidireccional, con LWW) ---
async function syncClientes() {
    try {
        // A. Subir clientes locales creados/editados
        const clientesPendientes = await allQuery(`SELECT * FROM clientes WHERE sync_status = 'pending'`, []);
        for (const cli of clientesPendientes) {
            const gano = await upsertConLWW('clientes', {
                id: cli.id,
                nombre: cli.nombre,
                tipo: cli.tipo,
                identificacion: cli.identificacion,
                telefono: cli.telefono,
                email: cli.email,
                origen: cli.origen,
                updated_at: cli.updated_at
            });
            if (!gano) {
                console.log(`[Sincronizador] Cliente ${cli.id} no subido: hay una versión más reciente en la nube.`);
                continue;
            }
            await runQuery(`UPDATE clientes SET sync_status = 'synced' WHERE id = ?`, [cli.id]);
        }

        // B. Sincronizar eliminaciones (soft delete)
        const clientesEliminados = await allQuery(`SELECT * FROM clientes WHERE sync_status = 'deleted'`, []);
        for (const cli of clientesEliminados) {
            const gano = await softDeleteConLWW('clientes', { id: cli.id });
            if (!gano) continue;
            await runQuery(`DELETE FROM clientes WHERE id = ?`, [cli.id]);
        }

        // C. Descargar clientes
        const clientesNube = await descargarTodo('clientes');
        if (clientesNube) {
            for (const cli of clientesNube) {
                if (cli.deleted_at) {
                    await runQuery(`DELETE FROM clientes WHERE id = ? AND sync_status <> 'pending'`, [cli.id]);
                    continue;
                }
                await runQuery(
                    `INSERT INTO clientes (id, nombre, tipo, identificacion, telefono, email, origen, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                        nombre = excluded.nombre,
                        tipo = excluded.tipo,
                        identificacion = excluded.identificacion,
                        telefono = excluded.telefono,
                        email = excluded.email,
                        origen = excluded.origen,
                        sync_status = 'synced',
                        updated_at = excluded.updated_at
                     WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                    [cli.id, cli.nombre, cli.tipo, cli.identificacion, cli.telefono, cli.email, cli.origen, cli.updated_at]
                );
            }
        }
    } catch (errCli) {
        console.log("[Sincronizador] Clientes no sincronizados:", obtenerMensajeSync(errCli, 'clientes'));
    }
}

// --- 10. SINCRONIZAR ABONOS (Bidireccional, con LWW) ---
async function syncAbonos() {
    try {
        // A. Subir abonos locales creados/editados
        const abonosPendientes = await allQuery(`SELECT * FROM abonos_credito WHERE sync_status = 'pending'`, []);
        for (const ab of abonosPendientes) {
            const gano = await upsertConLWW('abonos_credito', {
                id: ab.id,
                cliente_id: ab.cliente_id,
                monto: ab.monto,
                fecha: ab.fecha,
                metodo_pago: ab.metodo_pago,
                updated_at: ab.updated_at
            });
            if (!gano) {
                console.log(`[Sincronizador] Abono ${ab.id} no subido: hay una versión más reciente en la nube.`);
                continue;
            }
            await runQuery(`UPDATE abonos_credito SET sync_status = 'synced' WHERE id = ?`, [ab.id]);
        }

        // B. Sincronizar eliminaciones (soft delete)
        const abonosEliminados = await allQuery(`SELECT * FROM abonos_credito WHERE sync_status = 'deleted'`, []);
        for (const ab of abonosEliminados) {
            const gano = await softDeleteConLWW('abonos_credito', { id: ab.id });
            if (!gano) continue;
            await runQuery(`DELETE FROM abonos_credito WHERE id = ?`, [ab.id]);
        }

        // C. Descargar abonos
        const abonosNube = await descargarTodo('abonos_credito');
        if (abonosNube) {
            for (const ab of abonosNube) {
                if (ab.deleted_at) {
                    await runQuery(`DELETE FROM abonos_credito WHERE id = ? AND sync_status <> 'pending'`, [ab.id]);
                    continue;
                }
                await runQuery(
                    `INSERT INTO abonos_credito (id, cliente_id, monto, fecha, metodo_pago, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, ?, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                        cliente_id = excluded.cliente_id,
                        monto = excluded.monto,
                        fecha = excluded.fecha,
                        metodo_pago = excluded.metodo_pago,
                        sync_status = 'synced',
                        updated_at = excluded.updated_at
                     WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                    [ab.id, ab.cliente_id, ab.monto, ab.fecha, ab.metodo_pago, ab.updated_at]
                );
            }
        }
    } catch (errAb) {
        console.log("[Sincronizador] Abonos no sincronizados:", obtenerMensajeSync(errAb, 'abonos_credito'));
    }
}

// --- 10.5. SINCRONIZAR PEDIDOS/APARTADOS (Bidireccional, con LWW) ---
// pedidos no tiene una función de "eliminaciones" propia: cancelar un pedido solo cambia su
// `estado` (nunca sync_status='deleted'), así que sube/baja como cualquier UPDATE normal.
async function syncPedidosSubir() {
    if (!pedidosTablasDisponibles) return;
    try {
        const pedidosPendientes = await allQuery(`SELECT * FROM pedidos WHERE sync_status = 'pending'`, []);
        for (const ped of pedidosPendientes) {
            const gano = await upsertConLWW('pedidos', {
                id: ped.id,
                sucursal_id: ped.sucursal_id,
                cliente_id: ped.cliente_id,
                fecha_pedido: ped.fecha_pedido,
                fecha_entrega_estimada: ped.fecha_entrega_estimada,
                fecha_entrega_real: ped.fecha_entrega_real,
                estado: ped.estado,
                total: ped.total,
                notas: ped.notas,
                venta_id: ped.venta_id,
                usuario_creo: ped.usuario_creo,
                cliente_nombre_registro: ped.cliente_nombre_registro,
                cliente_identificacion_registro: ped.cliente_identificacion_registro,
                cliente_telefono_registro: ped.cliente_telefono_registro,
                updated_at: ped.updated_at
            });

            if (!gano) {
                console.log(`[Sincronizador] Pedido ${ped.id} no subido: hay una versión más reciente en la nube.`);
                continue;
            }

            const detalles = await allQuery(`SELECT * FROM detalle_pedidos WHERE pedido_id = ?`, [ped.id]);

            // Igual que con detalle_ventas: se borran las líneas remotas previas antes de
            // reinsertar, porque editarPedidoTx reemplaza detalle_pedidos localmente (DELETE +
            // INSERT con ids nuevos) y sin este paso las líneas viejas quedarían huérfanas en
            // Supabase, duplicando productos y total al descargar en otro equipo.
            const { error: errorLimpiezaDetalle } = await supabase
                .from('detalle_pedidos')
                .delete()
                .eq('pedido_id', ped.id);
            if (errorLimpiezaDetalle) throw errorLimpiezaDetalle;

            for (const det of detalles) {
                const { error: errorDetalle } = await supabase
                    .from('detalle_pedidos')
                    .upsert({
                        id: det.id,
                        pedido_id: det.pedido_id,
                        producto_id: det.producto_id,
                        cantidad: det.cantidad,
                        precio_unitario: det.precio_unitario,
                        updated_at: nowISO()
                    });
                if (errorDetalle) throw errorDetalle;
            }

            await runQuery(`UPDATE pedidos SET sync_status = 'synced' WHERE id = ?`, [ped.id]);
            console.log(`[Sincronizador] Pedido ${ped.id} sincronizado con la nube.`);
        }
    } catch (err) {
        if (esErrorTablaInexistente(err)) {
            pedidosTablasDisponibles = false;
            console.log("[Sincronizador] Las tablas de Pedidos/Apartados no existen en Supabase (o el cache de esquema no las reconoce). Se omite esta sincronización sin interrumpir el resto del ciclo.");
            return;
        }
        console.log("[Sincronizador] Pedidos no sincronizados (Modo Offline o error de red):", err.message);
    }
}

async function syncPedidosDescargar() {
    if (!pedidosTablasDisponibles) return;
    try {
        const pedidosNube = await descargarTodo('pedidos');

        if (pedidosNube) {
            for (const ped of pedidosNube) {
                await runQuery(
                    `INSERT INTO pedidos (id, sucursal_id, cliente_id, fecha_pedido, fecha_entrega_estimada, fecha_entrega_real, estado, total, notas, venta_id, usuario_creo, cliente_nombre_registro, cliente_identificacion_registro, cliente_telefono_registro, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                        sucursal_id = excluded.sucursal_id,
                        cliente_id = excluded.cliente_id,
                        fecha_pedido = excluded.fecha_pedido,
                        fecha_entrega_estimada = excluded.fecha_entrega_estimada,
                        fecha_entrega_real = excluded.fecha_entrega_real,
                        estado = excluded.estado,
                        total = excluded.total,
                        notas = excluded.notas,
                        venta_id = excluded.venta_id,
                        usuario_creo = excluded.usuario_creo,
                        cliente_nombre_registro = excluded.cliente_nombre_registro,
                        cliente_identificacion_registro = excluded.cliente_identificacion_registro,
                        cliente_telefono_registro = excluded.cliente_telefono_registro,
                        sync_status = 'synced',
                        updated_at = excluded.updated_at
                     WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                    [ped.id, ped.sucursal_id, ped.cliente_id, ped.fecha_pedido, ped.fecha_entrega_estimada, ped.fecha_entrega_real, ped.estado, ped.total, ped.notas, ped.venta_id, ped.usuario_creo, ped.cliente_nombre_registro, ped.cliente_identificacion_registro, ped.cliente_telefono_registro, ped.updated_at]
                );
            }
        }

        const detPedidosNube = await descargarTodo('detalle_pedidos');

        if (detPedidosNube) {
            for (const det of detPedidosNube) {
                await runQuery(
                    `INSERT INTO detalle_pedidos (id, pedido_id, producto_id, cantidad, precio_unitario, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?)
                     ON CONFLICT(id) DO UPDATE SET
                        pedido_id = excluded.pedido_id,
                        producto_id = excluded.producto_id,
                        cantidad = excluded.cantidad,
                        precio_unitario = excluded.precio_unitario,
                        updated_at = excluded.updated_at
                     WHERE excluded.updated_at > updated_at`,
                    [det.id, det.pedido_id, det.producto_id, det.cantidad, det.precio_unitario, det.updated_at]
                );
            }
        }
        console.log("[Sincronizador] Pedidos y detalles descargados desde la nube.");
    } catch (err) {
        if (esErrorTablaInexistente(err)) {
            pedidosTablasDisponibles = false;
            console.log("[Sincronizador] Las tablas de Pedidos/Apartados no existen en Supabase (o el cache de esquema no las reconoce). Se omite esta sincronización sin interrumpir el resto del ciclo.");
            return;
        }
        console.log("[Sincronizador] No se pudieron descargar pedidos (Modo Offline):", err.message);
    }
}

// --- 10.6. SINCRONIZAR ABONOS DE PEDIDO (Bidireccional, con LWW) ---
async function syncAbonosPedido() {
    if (!pedidosTablasDisponibles) return;
    try {
        const abonosPendientes = await allQuery(`SELECT * FROM abonos_pedido WHERE sync_status = 'pending'`, []);
        for (const ab of abonosPendientes) {
            const gano = await upsertConLWW('abonos_pedido', {
                id: ab.id,
                pedido_id: ab.pedido_id,
                monto: ab.monto,
                fecha: ab.fecha,
                metodo_pago: ab.metodo_pago,
                updated_at: ab.updated_at
            });
            if (!gano) {
                console.log(`[Sincronizador] Abono de pedido ${ab.id} no subido: hay una versión más reciente en la nube.`);
                continue;
            }
            await runQuery(`UPDATE abonos_pedido SET sync_status = 'synced' WHERE id = ?`, [ab.id]);
        }

        const abonosEliminados = await allQuery(`SELECT * FROM abonos_pedido WHERE sync_status = 'deleted'`, []);
        for (const ab of abonosEliminados) {
            const gano = await softDeleteConLWW('abonos_pedido', { id: ab.id });
            if (!gano) continue;
            await runQuery(`DELETE FROM abonos_pedido WHERE id = ?`, [ab.id]);
        }

        const abonosNube = await descargarTodo('abonos_pedido');
        if (abonosNube) {
            for (const ab of abonosNube) {
                if (ab.deleted_at) {
                    await runQuery(`DELETE FROM abonos_pedido WHERE id = ? AND sync_status <> 'pending'`, [ab.id]);
                    continue;
                }
                await runQuery(
                    `INSERT INTO abonos_pedido (id, pedido_id, monto, fecha, metodo_pago, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, ?, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                        pedido_id = excluded.pedido_id,
                        monto = excluded.monto,
                        fecha = excluded.fecha,
                        metodo_pago = excluded.metodo_pago,
                        sync_status = 'synced',
                        updated_at = excluded.updated_at
                     WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                    [ab.id, ab.pedido_id, ab.monto, ab.fecha, ab.metodo_pago, ab.updated_at]
                );
            }
        }
    } catch (err) {
        if (esErrorTablaInexistente(err)) {
            pedidosTablasDisponibles = false;
            console.log("[Sincronizador] Las tablas de Pedidos/Apartados no existen en Supabase (o el cache de esquema no las reconoce). Se omite esta sincronización sin interrumpir el resto del ciclo.");
            return;
        }
        console.log("[Sincronizador] Abonos de pedido no sincronizados:", obtenerMensajeSync(err, 'abonos_pedido'));
    }
}

// --- 11. SINCRONIZAR SOLICITUDES DE VENTA RETROACTIVA (Bidireccional, con LWW) ---
// El LWW aquí es crítico: evita que una edición vieja y sin subir de un Operador revierta en
// silencio la aprobación/rechazo que un Administrador ya subió para la misma solicitud.
async function syncSolicitudesVenta() {
    try {
        // A. Subir solicitudes nuevas o con cambio de estado (aprobada/rechazada)
        const solicitudesPendientes = await allQuery(`SELECT * FROM solicitudes_venta WHERE sync_status = 'pending'`, []);
        for (const sol of solicitudesPendientes) {
            const gano = await upsertConLWW('solicitudes_venta', {
                id: sol.id,
                tipo: sol.tipo,
                venta_id: sol.venta_id,
                sucursal_id: sol.sucursal_id,
                fecha_venta: sol.fecha_venta,
                datos: sol.datos,
                estado: sol.estado,
                usuario_solicitante: sol.usuario_solicitante,
                fecha_solicitud: sol.fecha_solicitud,
                usuario_revisor: sol.usuario_revisor,
                fecha_revision: sol.fecha_revision,
                motivo_rechazo: sol.motivo_rechazo,
                updated_at: sol.updated_at
            });
            if (!gano) {
                console.log(`[Sincronizador] Solicitud ${sol.id} no subida: hay una versión más reciente en la nube.`);
                continue;
            }
            await runQuery(`UPDATE solicitudes_venta SET sync_status = 'synced' WHERE id = ?`, [sol.id]);
        }

        // B. Descargar solicitudes creadas/revisadas desde otras terminales
        const solicitudesNube = await descargarTodo('solicitudes_venta');
        if (solicitudesNube) {
            for (const sol of solicitudesNube) {
                if (sol.deleted_at) {
                    await runQuery(`DELETE FROM solicitudes_venta WHERE id = ? AND sync_status <> 'pending'`, [sol.id]);
                    continue;
                }
                await runQuery(
                    `INSERT INTO solicitudes_venta (id, tipo, venta_id, sucursal_id, fecha_venta, datos, estado, usuario_solicitante, fecha_solicitud, usuario_revisor, fecha_revision, motivo_rechazo, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                        tipo = excluded.tipo,
                        venta_id = excluded.venta_id,
                        sucursal_id = excluded.sucursal_id,
                        fecha_venta = excluded.fecha_venta,
                        datos = excluded.datos,
                        estado = excluded.estado,
                        usuario_solicitante = excluded.usuario_solicitante,
                        fecha_solicitud = excluded.fecha_solicitud,
                        usuario_revisor = excluded.usuario_revisor,
                        fecha_revision = excluded.fecha_revision,
                        motivo_rechazo = excluded.motivo_rechazo,
                        sync_status = 'synced',
                        updated_at = excluded.updated_at
                     WHERE sync_status <> 'pending' AND excluded.updated_at > updated_at`,
                    [sol.id, sol.tipo, sol.venta_id, sol.sucursal_id, sol.fecha_venta, sol.datos, sol.estado, sol.usuario_solicitante, sol.fecha_solicitud, sol.usuario_revisor, sol.fecha_revision, sol.motivo_rechazo, sol.updated_at]
                );
            }
            console.log("[Sincronizador] Solicitudes de venta retroactiva sincronizadas con la nube.");
        }
    } catch (errSol) {
        console.log("[Sincronizador] Solicitudes de venta no sincronizadas:", obtenerMensajeSync(errSol, 'solicitudes_venta'));
    }
}

function notificarEstadoSincronizacion(enCurso) {
    BrowserWindow.getAllWindows().forEach(win => {
        if (win && !win.isDestroyed()) {
            win.webContents.send('sincronizacion-estado', enCurso);
        }
    });
}

function notificarVentanasReportes() {
    console.log('[Sincronizador] Sincronización finalizada. Notificando a ventanas de reportes.');
    BrowserWindow.getAllWindows().forEach(win => {
        if (win && !win.isDestroyed() && win.webContents.getURL().includes('reportes.html')) {
            console.log('[Sincronizador] Enviando evento "sincronizacion-completa" a ventana de reportes.');
            win.webContents.send('sincronizacion-completa');
        }
    });
}

// =================================================================
// MOTOR DE SINCRONIZACIÓN AUTOMÁTICA OFFLINE-FIRST (orquestador)
// Orden por entidad: PUSH (pendientes) -> PUSH (eliminaciones) -> PULL (nube),
// con LWW resolviendo cualquier conflicto en ambas direcciones (ver helpers arriba).
// =================================================================
async function procesarSincronizacion() {
    if (estaSincronizando) {
        console.log("[Sincronizador] Sincronización en curso. Omitiendo esta ejecución...");
        return;
    }

    // Si no se han cambiado los marcadores de posición, cancelamos de forma segura para no lanzar errores de red
    if (supabaseUrl.includes("TU_PROYECTO") || supabaseKey.includes("TU_KEY_PUBLICA")) {
        console.log("[Sincronizador] AVISO: Configura tus credenciales reales de Supabase en main.js para activar la sincronización en la nube.");
        return;
    }

    estaSincronizando = true;
    notificarEstadoSincronizacion(true);
    console.log("[Sincronizador] Iniciando verificación de datos pendientes...");

    // Fallos al subir/descargar ventas y gastos (de los que depende el Reporte Diario) se
    // registran aquí para NO reportar "éxito" al botón de sincronizar cuando en realidad la
    // venta/gasto nunca llegó a Supabase o no se trajo nada nuevo de la nube -- sin esto, un
    // error de red, de autenticación o de política RLS quedaba enmascarado por el try/catch
    // interno de cada sync* y el usuario veía "Sincronización exitosa" con datos desactualizados.
    let falloSyncReportes = null;

    try {
        await syncColaAuditoria();
        const resVentasSubir = await syncVentasSubir();
        if (!resVentasSubir.ok) falloSyncReportes = `subida de ventas: ${resVentasSubir.message}`;
        await syncVentasEliminaciones();
        const resVentasDescargar = await syncVentasDescargar();
        if (!resVentasDescargar.ok) falloSyncReportes = falloSyncReportes || `descarga de ventas: ${resVentasDescargar.message}`;
        await repararDetalleVentasDuplicado();
        const resGastosSubir = await syncGastosSubir();
        if (!resGastosSubir.ok) falloSyncReportes = falloSyncReportes || `subida de gastos: ${resGastosSubir.message}`;
        await syncGastosEliminaciones();
        const resGastosDescargar = await syncGastosDescargar();
        if (!resGastosDescargar.ok) falloSyncReportes = falloSyncReportes || `descarga de gastos: ${resGastosDescargar.message}`;
        await syncProductosSubir();
        await syncCategoriasSubir();
        await syncCategoriasEliminaciones();
        await syncInventarioSubir();
        await syncMovimientosInventarioSubir();
        await syncProductosEliminaciones();
        await syncCategoriasDescargar();
        await syncProductosDescargar();
        await syncInventarioDescargar();
        await syncMovimientosInventarioDescargar();
        await syncSucursales();
        await syncUsuarios();
        await syncTransferenciasSubir();
        await syncTransferenciasEliminaciones();
        await syncTransferenciasDescargar();
        await syncClientes();
        await syncAbonos();
        await syncPedidosSubir();
        await syncPedidosDescargar();
        await syncAbonosPedido();
        await syncSolicitudesVenta();
    } finally {
        estaSincronizando = false;
        notificarEstadoSincronizacion(false);
        notificarVentanasReportes();
        if (reintentoPendiente) {
            reintentoPendiente = false;
            solicitarSincronizacion('cambios pendientes durante la sincronización anterior');
        }
    }

    if (falloSyncReportes) {
        throw new Error(`Fallo de sincronización (${falloSyncReportes})`);
    }
}

module.exports = { procesarSincronizacion, isSincronizando, solicitarSincronizacion };
