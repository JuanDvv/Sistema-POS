const { v4: uuidv4 } = require('uuid');
const { runQuery } = require('../db/connection');

// SRP: todo lo relacionado con el registro y la interpretación de errores de la cola de auditoría.

function esErrorRls(err) {
    const message = err?.message || '';
    return message.includes('row-level security') || message.includes('policy') || message.includes('RLS');
}

function obtenerMensajeSync(err, tabla) {
    if (esErrorRls(err)) {
        return `La tabla ${tabla} está bloqueada por políticas RLS. Configura políticas de inserción/actualización en Supabase o usa una clave de servicio válida.`;
    }
    return err?.message || 'Error desconocido';
}

// Registrar logs de auditoría de transacciones (local y encolado offline)
async function registrarAuditoria(usuario, rol, sucursalId, accion, detalles) {
    const id = uuidv4();
    const fecha = new Date().toISOString();
    const detString = typeof detalles === 'object' ? JSON.stringify(detalles) : String(detalles || '');

    try {
        await runQuery(
            `INSERT INTO cola_auditoria (id, usuario, rol, sucursal_id, accion, detalles, fecha, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [id, usuario || 'Invitado', rol || 'Sin Rol', sucursalId || 'Sin Sucursal', accion, detString, fecha]
        );
        console.log(`[Auditoría] Acción '${accion}' registrada localmente.`);
    } catch (err) {
        console.error("[Auditoría] Error al escribir log de auditoría local:", err.message);
    }
}

module.exports = { esErrorRls, obtenerMensajeSync, registrarAuditoria };
