const { runQuery, allQuery } = require('../db/connection');
const { supabase } = require('../sync/supabaseClients');
const { registrarAuditoria } = require('./auditService');

// SRP: recuperación de abonos eliminados (Crédito y Pedidos), Administrador únicamente desde el
// Panel de Administración.
//
// Por qué esto lee/escribe directo en Supabase en vez de vivir dentro del ciclo normal de
// sincronización (sync/syncService.js): en cuanto un abono eliminado (sync_status='deleted') se
// confirma subido, syncAbonos/syncAbonosPedido lo BORRAN físicamente de la fila local (mismo
// patrón que ventas/gastos/pedidos) -- solo queda su copia con `deleted_at` en Supabase. Por eso
// "recuperar" no puede ser una operación puramente local: hay que traer el dato de vuelta desde
// la nube, que es la única fuente que todavía lo conserva.

const LIMITE_ABONOS_ELIMINADOS = 50;

async function listarAbonosEliminados() {
    if (!supabase) return { success: true, data: [] };
    const [credRes, pedRes] = await Promise.all([
        supabase.from('abonos_credito')
            .select('id, cliente_id, monto, fecha, metodo_pago, deleted_at')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false })
            .limit(LIMITE_ABONOS_ELIMINADOS),
        supabase.from('abonos_pedido')
            .select('id, pedido_id, monto, fecha, metodo_pago, deleted_at')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false })
            .limit(LIMITE_ABONOS_ELIMINADOS)
    ]);
    if (credRes.error) throw credRes.error;
    if (pedRes.error) throw pedRes.error;

    // Enriquecer con el nombre a mostrar (cliente / cliente del pedido), leído de la copia local
    // -- no hace falta otro viaje a la nube para esto, ambas tablas ya se sincronizan localmente.
    const clienteIds = [...new Set(credRes.data.map(a => a.cliente_id).filter(Boolean))];
    const pedidoIds = [...new Set(pedRes.data.map(a => a.pedido_id).filter(Boolean))];

    const [clientesFilas, pedidosFilas] = await Promise.all([
        clienteIds.length > 0
            ? allQuery(`SELECT id, nombre FROM clientes WHERE id IN (${clienteIds.map(() => '?').join(',')})`, clienteIds)
            : Promise.resolve([]),
        pedidoIds.length > 0
            ? allQuery(`SELECT id, cliente_nombre_registro FROM pedidos WHERE id IN (${pedidoIds.map(() => '?').join(',')})`, pedidoIds)
            : Promise.resolve([])
    ]);
    const clientesMap = new Map(clientesFilas.map(c => [c.id, c.nombre]));
    const pedidosMap = new Map(pedidosFilas.map(p => [p.id, p.cliente_nombre_registro]));

    const abonosCredito = credRes.data.map(a => ({
        tipo: 'credito', id: a.id, monto: a.monto, fecha: a.fecha, metodoPago: a.metodo_pago,
        deletedAt: a.deleted_at, referencia: clientesMap.get(a.cliente_id) || '(Cliente desconocido)'
    }));
    const abonosPedido = pedRes.data.map(a => ({
        tipo: 'pedido', id: a.id, monto: a.monto, fecha: a.fecha, metodoPago: a.metodo_pago,
        deletedAt: a.deleted_at, referencia: pedidosMap.get(a.pedido_id) || '(Pedido desconocido)'
    }));

    const data = [...abonosCredito, ...abonosPedido].sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
    return { success: true, data };
}

async function recuperarAbono({ tipo, id, auditoriaUsuario, auditoriaRol }) {
    if (!supabase) {
        return { success: false, message: 'La sincronización en la nube no está configurada.' };
    }
    if (tipo !== 'credito' && tipo !== 'pedido') {
        return { success: false, message: 'Tipo de abono inválido.' };
    }
    const tabla = tipo === 'credito' ? 'abonos_credito' : 'abonos_pedido';
    const ahora = new Date().toISOString();

    // Limpiar deleted_at en Supabase (fuente de verdad): el trigger assign_sync_seq() le asigna un
    // sync_seq nuevo al quedar por encima del cursor de todos los equipos, así que también vuelve
    // a bajar sola en el próximo ciclo de sincronización de cualquier otra terminal.
    const { data, error } = await supabase
        .from(tabla)
        .update({ deleted_at: null, updated_at: ahora })
        .eq('id', id)
        .select('*')
        .maybeSingle();
    if (error) return { success: false, message: 'Error al recuperar en la nube: ' + error.message };
    if (!data) return { success: false, message: 'No se encontró el abono eliminado en la nube (puede que ya haya sido recuperado).' };

    // Reflejarlo de inmediato en este equipo, con el mismo shape que usa la descarga normal (ver
    // syncAbonos/syncPedidosAbonosDescargar en sync/syncService.js), para no depender de esperar
    // al próximo ciclo de sincronización para verlo de vuelta en los reportes de este equipo.
    if (tipo === 'credito') {
        await runQuery(
            `INSERT INTO abonos_credito (id, cliente_id, monto, fecha, metodo_pago, sync_status, updated_at)
             VALUES (?, ?, ?, ?, ?, 'synced', ?)
             ON CONFLICT(id) DO UPDATE SET
                cliente_id = excluded.cliente_id, monto = excluded.monto, fecha = excluded.fecha,
                metodo_pago = excluded.metodo_pago, sync_status = 'synced', updated_at = excluded.updated_at`,
            [data.id, data.cliente_id, data.monto, data.fecha, data.metodo_pago, data.updated_at]
        );
    } else {
        await runQuery(
            `INSERT INTO abonos_pedido (id, pedido_id, monto, fecha, metodo_pago, sync_status, updated_at)
             VALUES (?, ?, ?, ?, ?, 'synced', ?)
             ON CONFLICT(id) DO UPDATE SET
                pedido_id = excluded.pedido_id, monto = excluded.monto, fecha = excluded.fecha,
                metodo_pago = excluded.metodo_pago, sync_status = 'synced', updated_at = excluded.updated_at`,
            [data.id, data.pedido_id, data.monto, data.fecha, data.metodo_pago, data.updated_at]
        );
    }

    await registrarAuditoria(
        auditoriaUsuario, auditoriaRol, 'Administración', 'Recuperar Abono',
        `Tipo: ${tipo === 'credito' ? 'Crédito' : 'Pedido'} - Abono ID: ${id} - Monto: $${data.monto}`
    );

    return { success: true, message: 'Abono recuperado exitosamente.' };
}

module.exports = { listarAbonosEliminados, recuperarAbono };
