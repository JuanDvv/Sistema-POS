const { v4: uuidv4 } = require('uuid');
const { runQuery } = require('../db/connection');

// SRP: registro append-only de movimientos de inventario (Kardex). `cantidad` es el delta real
// aplicado a inventario_sucursal.stock (positivo = entrada, negativo = salida); `tipo` solo
// clasifica el motivo para reportes. Debe invocarse dentro de la misma transacción que modifica
// el stock, para que ambas escrituras se confirmen o reviertan juntas.
async function registrarMovimientoInventario({ productoId, sucursalId, tipo, cantidad, referenciaId, usuario }) {
    await runQuery(
        `INSERT INTO movimientos_inventario (id, producto_id, sucursal_id, tipo, cantidad, referencia_id, usuario, fecha, sync_status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
        [uuidv4(), productoId, sucursalId, tipo, cantidad, referenciaId || null, usuario || null]
    );
}

// Mismo patrón que registrarMovimientoInventario, pero para el kardex del hold de Pedidos/
// Apartados (inventario_sucursal.stock_reservado en vez de stock). Debe invocarse dentro de la
// misma transacción que modifica stock_reservado, por la misma razón: ambas escrituras deben
// confirmarse o revertirse juntas.
async function registrarMovimientoReserva({ productoId, sucursalId, tipo, cantidad, referenciaId, usuario }) {
    await runQuery(
        `INSERT INTO movimientos_reserva_inventario (id, producto_id, sucursal_id, tipo, cantidad, referencia_id, usuario, fecha, sync_status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
        [uuidv4(), productoId, sucursalId, tipo, cantidad, referenciaId || null, usuario || null]
    );
}

module.exports = { registrarMovimientoInventario, registrarMovimientoReserva };
