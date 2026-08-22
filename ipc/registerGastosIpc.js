const { ipcMain } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { db, runQuery, allQuery } = require('../db/connection');
const { registrarAuditoria } = require('../services/auditService');
const { registrarMovimientoInventario } = require('../services/inventarioMovimientoService');
const { insertarGastoTx } = require('../services/gastoService');
const { esFechaAnteriorValida, construirFechaISODeDia, obtenerFechaHoyYYYYMMDD } = require('../services/fechaService');
const { solicitarSincronizacion } = require('../sync/syncService');
const { TIPOS_GASTO, ESTADOS_DEVOLUCION, requiereAjusteInventario } = require('../utils/gastos');

// SRP: registro, edición y eliminación de gastos/egresos de caja. La lógica transaccional del
// registro vive en services/gastoService (insertarGastoTx), compartida entre el flujo del día
// actual, el de fecha anterior y la aprobación de solicitudes retroactivas.

function registerGastosIpc() {
    // Registrar Gasto (día actual)
    ipcMain.handle('registrar-gasto', async (event, datosGasto) => {
        const { sucursalId, tipo, descripcion, monto, metodoPago, auditoriaUsuario, auditoriaRol, productosVencidos = [] } = datosGasto;
        return insertarGastoTx({
            sucursalId, tipo, descripcion, monto, metodoPago, productosVencidos,
            fecha: new Date().toISOString(),
            auditoriaUsuario, auditoriaRol
        });
    });

    // Descripciones más frecuentes de una clasificación (uso: sugerencias al registrar gastos
    // recurrentes, ej. "Pago del turno" en Operativo, para no reescribirlas cada vez). Se agrupan
    // normalizando mayúsculas/espacios para que variaciones de escritura cuenten como el mismo
    // gasto, y de cada grupo se toma la descripción de la ocurrencia más reciente (gracias al bare
    // column de SQLite junto al único MAX() de la consulta). HAVING usos >= 2 deja fuera los
    // conceptos escritos una sola vez (no son "recurrentes" todavía); de los que sí califican se
    // listan los 20 más usados.
    //
    // Se excluye "Domicilio (Descuento de Caja)": no se registra desde este formulario, sino que lo
    // crea automáticamente insertarVentaTx/editarVentaCompletaTx (ver services/ventaService.js) al
    // marcar domicilio en una venta, así que no tiene sentido sugerirlo aquí.
    ipcMain.handle('obtener-descripciones-frecuentes-gasto', async (event, { sucursalId, tipo }) => {
        try {
            const rows = await allQuery(
                `SELECT descripcion, COUNT(*) as usos, MAX(fecha) as ultima_fecha
                 FROM gastos
                 WHERE sucursal_id = ? AND tipo = ? AND descripcion IS NOT NULL AND TRIM(descripcion) <> ''
                   AND LOWER(TRIM(descripcion)) <> 'domicilio (descuento de caja)'
                   AND (sync_status IS NULL OR sync_status <> 'deleted')
                 GROUP BY LOWER(TRIM(descripcion))
                 HAVING COUNT(*) >= 2
                 ORDER BY usos DESC, ultima_fecha DESC
                 LIMIT 20`,
                [sucursalId, tipo]
            );
            return { success: true, data: rows.map(r => ({ descripcion: r.descripcion, usos: r.usos })) };
        } catch (err) {
            return { success: false, data: [], message: err.message };
        }
    });

    // Editar Gasto
    ipcMain.handle('editar-gasto', async (event, datosGasto) => {
        const { id, tipo, descripcion, monto, metodoPago, auditoriaUsuario, auditoriaRol } = datosGasto;
        try {
            // Obtener el gasto original antes de modificarlo, para auditoría y para bloquear el domicilio
            const gasto = await new Promise((resolve) => {
                db.get(`SELECT sucursal_id, tipo, descripcion, monto, metodo_pago, strftime('%Y-%m-%d', fecha, 'localtime') as fecha_dia FROM gastos WHERE id = ?`, [id], (err, row) => resolve(row));
            });
            // "Domicilio (Descuento de Caja)" lo genera y reconcilia automáticamente
            // insertarVentaTx/editarVentaCompletaTx (ver services/ventaService.js); editarlo aquí lo
            // desincronizaría de su venta asociada, así que se bloquea aunque la UI ya no ofrezca el botón.
            if (gasto && gasto.descripcion === 'Domicilio (Descuento de Caja)') {
                return { success: false, message: 'Este gasto se gestiona automáticamente desde la venta asociada y no se puede editar aquí.' };
            }
            // Un gasto de un día anterior solo lo puede editar un Administrador; el día actual sigue
            // abierto para cualquier rol. Reportes.js ya oculta el botón, esto es la defensa real.
            if (gasto && auditoriaRol !== 'Administrador' && gasto.fecha_dia !== obtenerFechaHoyYYYYMMDD()) {
                return { success: false, message: 'Solo un Administrador puede editar un gasto de un día anterior.' };
            }
            const sucId = gasto ? gasto.sucursal_id : 'Desconocida';
            const metodoPagoFinal = metodoPago || 'Efectivo';

            await runQuery(
                `UPDATE gastos SET tipo = ?, descripcion = ?, monto = ?, metodo_pago = ?, sync_status = 'pending' WHERE id = ?`,
                [tipo, descripcion, monto, metodoPagoFinal, id]
            );
            // Registrar en logs de auditoría: solo lo que cambió queda con flecha antes → después
            const detallesAuditoria = [
                `Gasto ID: ${id}`,
                gasto && Number(gasto.monto) !== Number(monto) ? `Monto: $${gasto.monto} → $${monto}` : `Monto: $${monto}`,
                gasto && gasto.tipo !== tipo ? `Tipo: ${gasto.tipo} → ${tipo}` : `Tipo: ${tipo}`,
                gasto && (gasto.metodo_pago || 'Efectivo') !== metodoPagoFinal ? `Método: ${gasto.metodo_pago || 'Efectivo'} → ${metodoPagoFinal}` : `Método: ${metodoPagoFinal}`,
                gasto && gasto.descripcion !== descripcion ? `Desc: ${gasto.descripcion} → ${descripcion}` : `Desc: ${descripcion}`
            ].join(' - ');
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucId, 'Editar Gasto', detallesAuditoria);
            solicitarSincronizacion('gasto editado');
            return { success: true, message: 'Gasto modificado exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al modificar el gasto: ' + err.message };
        }
    });

    // Eliminar Gasto
    ipcMain.handle('eliminar-gasto', async (event, datos) => {
        const { id, auditoriaUsuario, auditoriaRol } = datos;
        try {
            // Obtener datos del gasto antes de marcar como eliminado
            const gasto = await new Promise((resolve) => {
                db.get(`SELECT sucursal_id, tipo, monto, descripcion, strftime('%Y-%m-%d', fecha, 'localtime') as fecha_dia FROM gastos WHERE id = ?`, [id], (err, row) => resolve(row));
            });
            // Igual que en editar-gasto: este gasto se borra automáticamente al quitar el domicilio
            // de su venta (ver editarVentaCompletaTx en services/ventaService.js), no manualmente aquí.
            if (gasto && gasto.descripcion === 'Domicilio (Descuento de Caja)') {
                return { success: false, message: 'Este gasto se gestiona automáticamente desde la venta asociada y no se puede borrar aquí.' };
            }
            // Un gasto de un día anterior solo lo puede borrar un Administrador; el día actual sigue
            // abierto para cualquier rol. Reportes.js ya oculta el botón, esto es la defensa real.
            if (gasto && auditoriaRol !== 'Administrador' && gasto.fecha_dia !== obtenerFechaHoyYYYYMMDD()) {
                return { success: false, message: 'Solo un Administrador puede borrar un gasto de un día anterior.' };
            }
            const sucId = gasto ? gasto.sucursal_id : 'Desconocida';

            await runQuery('BEGIN TRANSACTION', []);

            // Si el gasto había descontado inventario (Gasto de Inventario / Devolución de Producto),
            // se revierte cada movimiento asociado para que el stock quede como antes de registrarlo.
            if (gasto && requiereAjusteInventario(gasto.tipo)) {
                const movimientos = await new Promise((resolve, reject) => {
                    db.all(`SELECT producto_id, sucursal_id, cantidad FROM movimientos_inventario WHERE referencia_id = ?`, [id], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    });
                });
                for (const mov of movimientos) {
                    await runQuery(
                        `UPDATE inventario_sucursal SET stock = stock - ?, sync_status = 'pending' WHERE producto_id = ? AND sucursal_id = ?`,
                        [mov.cantidad, mov.producto_id, mov.sucursal_id]
                    );
                    await registrarMovimientoInventario({
                        productoId: mov.producto_id, sucursalId: mov.sucursal_id, tipo: 'REVERSION_ELIMINACION_GASTO',
                        cantidad: -mov.cantidad, referenciaId: id, usuario: auditoriaUsuario
                    });
                }
            }

            await runQuery(`UPDATE gastos SET sync_status = 'deleted' WHERE id = ?`, [id]);
            await runQuery('COMMIT', []);

            // Registrar en logs de auditoría
            if (gasto) {
                await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucId, 'Eliminar Gasto', `Gasto ID: ${id} - Monto: $${gasto.monto} - Desc: ${gasto.descripcion}`);
            }
            solicitarSincronizacion('gasto eliminado');
            return { success: true, message: 'Gasto eliminado exitosamente.' };
        } catch (err) {
            await runQuery('ROLLBACK', []).catch(() => { });
            return { success: false, message: 'Error al eliminar el gasto: ' + err.message };
        }
    });

    // Actualizar Estado de Devolución: el proveedor informa si el producto regresa a la sucursal
    // (reingresa a inventario) o se queda con ellos tras su auditoría de calidad (Rechazada, sin cambio).
    ipcMain.handle('actualizar-estado-devolucion', async (event, datos) => {
        const { id, nuevoEstado, auditoriaUsuario, auditoriaRol } = datos;
        if (!Object.values(ESTADOS_DEVOLUCION).includes(nuevoEstado)) {
            return { success: false, message: 'Estado de devolución inválido.' };
        }
        try {
            const devolucion = await new Promise((resolve) => {
                db.get(`SELECT sucursal_id, descripcion, estado FROM gastos WHERE id = ? AND tipo = ?`, [id, TIPOS_GASTO.DEVOLUCION], (err, row) => resolve(row));
            });
            if (!devolucion) {
                return { success: false, message: 'Devolución no encontrada.' };
            }
            const estadoActual = devolucion.estado || ESTADOS_DEVOLUCION.PENDIENTE;
            if (estadoActual !== ESTADOS_DEVOLUCION.PENDIENTE) {
                return { success: false, message: `Esta devolución ya fue resuelta (${estadoActual}).` };
            }

            await runQuery('BEGIN TRANSACTION', []);

            // El proveedor regresó el producto a la sucursal: reingresa el stock que se descontó
            // al registrar la devolución, usando el mismo kardex (movimientos_inventario) como fuente.
            if (nuevoEstado === ESTADOS_DEVOLUCION.DEVUELTA) {
                const movimientos = await new Promise((resolve, reject) => {
                    db.all(`SELECT producto_id, sucursal_id, cantidad FROM movimientos_inventario WHERE referencia_id = ? AND tipo = 'BAJA_DEVOLUCION'`, [id], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    });
                });
                for (const mov of movimientos) {
                    await runQuery(
                        `UPDATE inventario_sucursal SET stock = stock - ?, sync_status = 'pending' WHERE producto_id = ? AND sucursal_id = ?`,
                        [mov.cantidad, mov.producto_id, mov.sucursal_id]
                    );
                    await registrarMovimientoInventario({
                        productoId: mov.producto_id, sucursalId: mov.sucursal_id, tipo: 'REINGRESO_DEVOLUCION',
                        cantidad: -mov.cantidad, referenciaId: id, usuario: auditoriaUsuario
                    });
                }
            }

            await runQuery(`UPDATE gastos SET estado = ?, sync_status = 'pending' WHERE id = ?`, [nuevoEstado, id]);
            await runQuery('COMMIT', []);

            await registrarAuditoria(auditoriaUsuario, auditoriaRol, devolucion.sucursal_id, 'Actualizar Estado Devolución', `Gasto ID: ${id} - Estado: ${estadoActual} -> ${nuevoEstado} - Desc: ${devolucion.descripcion}`);
            solicitarSincronizacion('estado de devolución actualizado');
            return { success: true, message: 'Estado de la devolución actualizado.' };
        } catch (err) {
            await runQuery('ROLLBACK', []).catch(() => { });
            return { success: false, message: 'Error al actualizar la devolución: ' + err.message };
        }
    });

    // =================================================================
    // GASTOS DE FECHA ANTERIOR (con cola de aprobación para Operadores)
    // Solo cubre alta ("nueva"): editar/eliminar un gasto ya existente no tiene restricción de
    // fecha ni rol (ver 'editar-gasto'/'eliminar-gasto' arriba), así que no necesita solicitud.
    // =================================================================

    // Registrar un gasto nuevo con fecha de un día anterior
    ipcMain.handle('registrar-gasto-anterior', async (event, datos) => {
        const { sucursalId, tipo, descripcion, monto, metodoPago, productosVencidos = [], fechaGasto, auditoriaUsuario, auditoriaRol } = datos;

        if (!esFechaAnteriorValida(fechaGasto)) {
            return { success: false, message: 'La fecha del gasto debe ser un día anterior a hoy.' };
        }

        const esAjusteInventario = requiereAjusteInventario(tipo);
        if (esAjusteInventario) {
            if (!Array.isArray(productosVencidos) || productosVencidos.length === 0) {
                return { success: false, message: 'Selecciona al menos un producto con cantidad válida.' };
            }
        } else if (!(Number(monto) > 0) || !descripcion) {
            return { success: false, message: 'Por favor, introduce un monto válido y una descripción.' };
        }

        if (auditoriaRol === 'Administrador') {
            const resultado = await insertarGastoTx({
                sucursalId, tipo, descripcion, monto: esAjusteInventario ? 0 : monto, metodoPago, productosVencidos,
                fecha: construirFechaISODeDia(fechaGasto),
                auditoriaUsuario, auditoriaRol,
                accion: 'Registrar Gasto (Fecha Anterior)'
            });
            return { ...resultado, requiereAprobacion: false };
        }

        try {
            const id = uuidv4();
            const ahora = new Date().toISOString();
            const propuesta = { sucursalId, tipo, descripcion, monto: esAjusteInventario ? 0 : monto, metodoPago, productosVencidos };
            await runQuery(
                `INSERT INTO solicitudes_gasto (id, sucursal_id, fecha_gasto, datos, estado, usuario_solicitante, fecha_solicitud, sync_status, updated_at)
                 VALUES (?, ?, ?, ?, 'pendiente', ?, ?, 'pending', ?)`,
                [id, sucursalId, fechaGasto, JSON.stringify({ propuesta }), auditoriaUsuario, ahora, ahora]
            );
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucursalId, 'Solicitud Gasto Retroactivo', `Fecha: ${fechaGasto} - Clasificación: ${tipo} - Monto: $${Number(monto) || 0} - Desc: ${descripcion}`);
            solicitarSincronizacion('solicitud de gasto retroactivo creada');
            return { success: true, message: 'Solicitud enviada. Un administrador debe confirmarla antes de que se refleje en caja e inventario.', requiereAprobacion: true };
        } catch (err) {
            return { success: false, message: 'Error al enviar la solicitud: ' + err.message };
        }
    });

    // Listar solicitudes de gasto retroactivo
    ipcMain.handle('obtener-solicitudes-gasto', async (event, filtros) => {
        const { estado, usuario } = filtros || {};
        try {
            let query = `SELECT * FROM solicitudes_gasto WHERE 1=1`;
            const params = [];
            if (estado) {
                query += ` AND estado = ?`;
                params.push(estado);
            }
            if (usuario) {
                query += ` AND usuario_solicitante = ?`;
                params.push(usuario);
            }
            query += ` ORDER BY fecha_solicitud DESC`;
            const rows = await allQuery(query, params);
            return { success: true, data: rows };
        } catch (err) {
            return { success: false, message: 'Error al obtener solicitudes: ' + err.message };
        }
    });

    // Aprobar una solicitud de gasto retroactivo (solo Administrador)
    ipcMain.handle('aprobar-solicitud-gasto', async (event, datos) => {
        const { id, auditoriaUsuario, auditoriaRol } = datos;
        if (auditoriaRol !== 'Administrador') {
            return { success: false, message: 'Solo un administrador puede aprobar solicitudes.' };
        }

        try {
            const solicitud = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM solicitudes_gasto WHERE id = ?`, [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!solicitud) {
                return { success: false, message: 'No se encontró la solicitud especificada.' };
            }
            if (solicitud.estado !== 'pendiente') {
                return { success: false, message: 'Esta solicitud ya fue revisada.' };
            }

            const datosParseados = JSON.parse(solicitud.datos || '{}');
            const p = datosParseados.propuesta;
            const resultado = await insertarGastoTx({
                sucursalId: p.sucursalId, tipo: p.tipo, descripcion: p.descripcion, monto: p.monto,
                metodoPago: p.metodoPago, productosVencidos: p.productosVencidos,
                fecha: construirFechaISODeDia(solicitud.fecha_gasto),
                auditoriaUsuario, auditoriaRol,
                accion: 'Aprobar Solicitud Gasto Retroactivo'
            });

            if (!resultado.success) {
                return resultado;
            }

            await runQuery(
                `UPDATE solicitudes_gasto SET estado = 'aprobada', usuario_revisor = ?, fecha_revision = ?, sync_status = 'pending' WHERE id = ?`,
                [auditoriaUsuario, new Date().toISOString(), id]
            );
            solicitarSincronizacion('solicitud de gasto aprobada');

            return { success: true, message: 'Solicitud aprobada y aplicada exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al aprobar la solicitud: ' + err.message };
        }
    });

    // Rechazar una solicitud de gasto retroactivo (solo Administrador)
    ipcMain.handle('rechazar-solicitud-gasto', async (event, datos) => {
        const { id, motivo, auditoriaUsuario, auditoriaRol } = datos;
        if (auditoriaRol !== 'Administrador') {
            return { success: false, message: 'Solo un administrador puede rechazar solicitudes.' };
        }
        try {
            const solicitud = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM solicitudes_gasto WHERE id = ?`, [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            if (!solicitud) {
                return { success: false, message: 'No se encontró la solicitud especificada.' };
            }
            if (solicitud.estado !== 'pendiente') {
                return { success: false, message: 'Esta solicitud ya fue revisada.' };
            }
            await runQuery(
                `UPDATE solicitudes_gasto SET estado = 'rechazada', usuario_revisor = ?, fecha_revision = ?, motivo_rechazo = ?, sync_status = 'pending' WHERE id = ?`,
                [auditoriaUsuario, new Date().toISOString(), motivo || null, id]
            );
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, solicitud.sucursal_id, 'Rechazar Solicitud Gasto Retroactivo', `Solicitud ID: ${id}${motivo ? ' - Motivo: ' + motivo : ''}`);
            solicitarSincronizacion('solicitud de gasto rechazada');
            return { success: true, message: 'Solicitud rechazada.' };
        } catch (err) {
            return { success: false, message: 'Error al rechazar la solicitud: ' + err.message };
        }
    });
}

module.exports = { registerGastosIpc };
