const { v4: uuidv4 } = require('uuid');
const { runQuery, allQuery } = require('../db/connection');
const { registrarAuditoria } = require('./auditService');
const { solicitarSincronizacion } = require('../sync/syncService');
const { obtenerFechaHoyYYYYMMDD } = require('./fechaService');
const { TIPOS_CIERRE_CAJA } = require('../utils/cierresCaja');

// SRP: única fuente de verdad del cuadre de caja por ventana de tiempo (cambios de turno,
// cierres parciales o cierre de día). Cada cierre retira físicamente el
// efectivo contado a caja fuerte, así que el turno siguiente siempre arranca del fondo base fijo
// -- no se encadena el conteo del cierre anterior -- y cada operador responde solo por su propia
// ventana (fecha_desde -> fecha_hasta), no por lo que pasó en el turno de otro operador el mismo día.

const FONDO_BASE_SUCURSAL = 200000; // Fallback por defecto a 200.000

function inicioDeHoyISO() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hoy.toISOString();
}

// Ventas en efectivo (o porción efectivo de "Mixto") + abonos en efectivo - gastos operativos en
// efectivo, dentro de una ventana [fechaDesde, fechaHasta] ya fija. Separado de
// calcularVentanaYEsperado para poder reutilizarlo al recalcular un cierre YA registrado (que
// tiene su propia ventana congelada en fecha_desde/fecha_hasta) sin duplicar la lógica de suma.
async function calcularEfectivoVentana(sucursalId, fechaDesde, fechaHasta) {
    // Excluye ventas de entrega de pedido (ese dinero ya se contó como abono el día que se
    // recibió, ver abonos abajo).
    const ventas = await allQuery(
        `SELECT v.metodo_pago, v.total
         FROM ventas v
         LEFT JOIN pedidos ped ON ped.venta_id = v.id
         WHERE v.sucursal_id = ? AND v.fecha > ? AND v.fecha <= ?
           AND (v.sync_status IS NULL OR v.sync_status <> 'deleted') AND ped.id IS NULL`,
        [sucursalId, fechaDesde, fechaHasta]
    );
    let ventasEfectivo = 0;
    ventas.forEach(v => {
        if (v.metodo_pago === 'Efectivo') {
            ventasEfectivo += v.total;
        } else if (v.metodo_pago && v.metodo_pago.startsWith('Mixto')) {
            const m = v.metodo_pago.match(/Efectivo:\s*(\d+(\.\d+)?)/);
            ventasEfectivo += m ? parseFloat(m[1]) : 0;
        }
    });

    const abonos = await allQuery(
        `SELECT ap.monto FROM abonos_pedido ap
         JOIN pedidos p ON ap.pedido_id = p.id
         WHERE p.sucursal_id = ? AND ap.fecha > ? AND ap.fecha <= ? AND ap.metodo_pago = 'Efectivo'
           AND (ap.sync_status IS NULL OR ap.sync_status <> 'deleted')`,
        [sucursalId, fechaDesde, fechaHasta]
    );
    const abonosEfectivo = abonos.reduce((s, a) => s + Number(a.monto), 0);

    const gastos = await allQuery(
        `SELECT monto FROM gastos
         WHERE sucursal_id = ? AND fecha > ? AND fecha <= ? AND tipo = 'Operativo'
           AND (metodo_pago IS NULL OR metodo_pago = 'Efectivo')
           AND (sync_status IS NULL OR sync_status <> 'deleted')`,
        [sucursalId, fechaDesde, fechaHasta]
    );
    const gastosEfectivo = gastos.reduce((s, g) => s + Number(g.monto), 0);

    return ventasEfectivo + abonosEfectivo - gastosEfectivo;
}

// fecha_desde = fecha_hasta del último cierre de HOY para esa sucursal, o inicio del día si
// todavía no hay ninguno. Misma lógica de suma que get-reporte-diario (ipc/registerVentasIpc.js),
// pero acotada a un rango de fecha-hora en vez de "todo el día" (comparación de string funciona
// porque `fecha` se guarda como TEXT ISO8601 sorteable).
async function calcularVentanaYEsperado(sucursalId, fechaHasta = new Date().toISOString()) {
    const hoyStr = obtenerFechaHoyYYYYMMDD();
    const ultimoCierre = await allQuery(
        `SELECT fecha_hasta FROM cierres_caja
         WHERE sucursal_id = ? AND (sync_status IS NULL OR sync_status <> 'deleted')
           AND strftime('%Y-%m-%d', fecha_hasta, 'localtime') = ?
         ORDER BY fecha_hasta DESC LIMIT 1`,
        [sucursalId, hoyStr]
    );
    const fechaDesde = ultimoCierre.length > 0 ? ultimoCierre[0].fecha_hasta : inicioDeHoyISO();
    const efectivoEsperado = await calcularEfectivoVentana(sucursalId, fechaDesde, fechaHasta);

    // Buscar caja_base configurada en config_sucursal
    const sucursalFilas = await allQuery(`SELECT caja_base FROM config_sucursal WHERE id = ?`, [sucursalId]);
    const fondoBase = sucursalFilas.length > 0 && sucursalFilas[0].caja_base !== undefined && sucursalFilas[0].caja_base !== null
        ? sucursalFilas[0].caja_base
        : FONDO_BASE_SUCURSAL;

    return { fechaDesde, fechaHasta, fondoBase, efectivoEsperado };
}

async function registrarCierreCajaTx({ sucursalId, tipo, nota, denominaciones, auditoriaUsuario, auditoriaRol }) {
    if (!Object.values(TIPOS_CIERRE_CAJA).includes(tipo)) {
        return { success: false, message: 'Tipo de cierre inválido.' };
    }
    if (!Array.isArray(denominaciones) || denominaciones.length === 0) {
        return { success: false, message: 'Debe registrar el conteo físico de caja.' };
    }

    // El Cierre de Día es el corte final de la jornada: una vez registrado, no se admite ningún
    // otro cierre (de ningún tipo) el mismo día para esa sucursal. Validado aquí, no solo en la UI,
    // porque el renderer puede tener el formulario ya abierto/desactualizado.
    const cierreDiaHoy = await allQuery(
        `SELECT id FROM cierres_caja
         WHERE sucursal_id = ? AND tipo = ? AND (sync_status IS NULL OR sync_status <> 'deleted')
           AND strftime('%Y-%m-%d', fecha_hasta, 'localtime') = ?`,
        [sucursalId, TIPOS_CIERRE_CAJA.CIERRE_DIA, obtenerFechaHoyYYYYMMDD()]
    );
    if (cierreDiaHoy.length > 0) {
        return { success: false, message: 'Ya se realizó el Cierre de Día de hoy. No se pueden registrar más cierres de caja hasta mañana.' };
    }

    // Defensa en profundidad: no se confía en el total ya sumado por el renderer.
    const efectivoContado = denominaciones.reduce((s, d) => s + (Number(d.valor) * Number(d.cantidad)), 0);

    // Recalculado de forma autoritativa aquí (no se reutiliza lo que la UI cargó al abrir la
    // pantalla): si el operador tarda varios minutos contando el efectivo físico, puede haber
    // entrado una venta nueva entre que se mostró el esperado y que se confirma el cierre.
    const fechaHasta = new Date().toISOString();
    const { fechaDesde, fondoBase, efectivoEsperado } = await calcularVentanaYEsperado(sucursalId, fechaHasta);
    const diferencia = efectivoContado - fondoBase - efectivoEsperado;
    const id = uuidv4();

    try {
        await runQuery('BEGIN TRANSACTION', []);
        await runQuery(
            `INSERT INTO cierres_caja
                (id, sucursal_id, usuario, rol, tipo, nota, fecha_desde, fecha_hasta, fondo_base, efectivo_esperado, efectivo_contado, diferencia, denominaciones, sync_status, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
            [id, sucursalId, auditoriaUsuario, auditoriaRol, tipo, nota || null, fechaDesde, fechaHasta, fondoBase, efectivoEsperado, efectivoContado, diferencia, JSON.stringify(denominaciones)]
        );
        await registrarAuditoria(
            auditoriaUsuario, auditoriaRol, sucursalId, 'Registrar Cierre de Caja',
            `Tipo: ${tipo} - Esperado: $${efectivoEsperado} - Contado: $${efectivoContado} - Diferencia: $${diferencia}${nota ? ' - Nota: ' + nota : ''}`
        );
        await runQuery('COMMIT', []);

        solicitarSincronizacion('cierre de caja registrado');
        return { success: true, message: 'Cierre de caja registrado con éxito.', id, fechaDesde, fechaHasta, fondoBase, efectivoEsperado, efectivoContado, diferencia };
    } catch (err) {
        await runQuery('ROLLBACK', []).catch(() => { });
        return { success: false, message: 'Error al registrar el cierre de caja: ' + err.message };
    }
}

async function obtenerCierresCaja({ sucursalId, fecha }) {
    const fechaFiltro = fecha || obtenerFechaHoyYYYYMMDD();
    return allQuery(
        `SELECT * FROM cierres_caja
         WHERE sucursal_id = ? AND strftime('%Y-%m-%d', fecha_hasta, 'localtime') = ?
           AND (sync_status IS NULL OR sync_status <> 'deleted')
         ORDER BY fecha_hasta DESC`,
        [sucursalId, fechaFiltro]
    );
}

// Borrado restringido a Administrador (ver registerCierresCajaIpc.js): borrar un cierre reescribe
// el historial de caja de la sucursal, así que no se expone a otros roles ni requiere flujo de
// aprobación intermedio (a diferencia de eliminar-venta-anterior).
async function eliminarCierreCajaTx({ cierreId, auditoriaUsuario, auditoriaRol }) {
    const cierre = await allQuery(
        `SELECT * FROM cierres_caja WHERE id = ? AND (sync_status IS NULL OR sync_status <> 'deleted')`,
        [cierreId]
    );
    if (cierre.length === 0) {
        return { success: false, message: 'No se encontró el cierre de caja especificado.' };
    }
    const c = cierre[0];

    try {
        await runQuery('BEGIN TRANSACTION', []);
        await runQuery(`UPDATE cierres_caja SET sync_status = 'deleted' WHERE id = ?`, [cierreId]);
        await registrarAuditoria(
            auditoriaUsuario, auditoriaRol, c.sucursal_id, 'Eliminar Cierre de Caja',
            `Tipo: ${c.tipo} - Esperado: $${c.efectivo_esperado} - Contado: $${c.efectivo_contado} - Diferencia: $${c.diferencia}`
        );
        await runQuery('COMMIT', []);

        solicitarSincronizacion('cierre de caja eliminado');
        return { success: true, message: 'Cierre de caja eliminado con éxito.' };
    } catch (err) {
        await runQuery('ROLLBACK', []).catch(() => { });
        return { success: false, message: 'Error al eliminar el cierre de caja: ' + err.message };
    }
}

// Corrige efectivo_esperado/diferencia de un cierre YA registrado, sin tocar su ventana
// (fecha_desde/fecha_hasta, que queda congelada tal como se cerró) ni el efectivo_contado (el
// conteo físico no se re-hace retroactivamente). Pensado para cuando aparece una venta con
// componente en efectivo que se registra días después de haberse cerrado esa caja (ver
// 'registrar-venta-anterior' en registerVentasIpc.js): el cierre ya guardado no se entera solo de
// ventas insertadas después, así que hay que recalcularlo explícitamente contra su misma ventana.
async function recalcularCierreCajaTx({ cierreId, auditoriaUsuario, auditoriaRol }) {
    const filas = await allQuery(
        `SELECT * FROM cierres_caja WHERE id = ? AND (sync_status IS NULL OR sync_status <> 'deleted')`,
        [cierreId]
    );
    if (filas.length === 0) {
        return { success: false, message: 'No se encontró el cierre de caja especificado.' };
    }
    const cierre = filas[0];

    const nuevoEfectivoEsperado = await calcularEfectivoVentana(cierre.sucursal_id, cierre.fecha_desde, cierre.fecha_hasta);
    const nuevaDiferencia = cierre.efectivo_contado - cierre.fondo_base - nuevoEfectivoEsperado;

    if (nuevoEfectivoEsperado === cierre.efectivo_esperado && nuevaDiferencia === cierre.diferencia) {
        return {
            success: true, sinCambios: true,
            message: 'El cierre ya estaba al día: no hay ventas, abonos o gastos nuevos en su ventana.',
            efectivoEsperado: cierre.efectivo_esperado, diferencia: cierre.diferencia
        };
    }

    try {
        await runQuery('BEGIN TRANSACTION', []);
        await runQuery(
            `UPDATE cierres_caja SET efectivo_esperado = ?, diferencia = ?, sync_status = 'pending', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
            [nuevoEfectivoEsperado, nuevaDiferencia, cierreId]
        );
        await registrarAuditoria(
            auditoriaUsuario, auditoriaRol, cierre.sucursal_id, 'Recalcular Cierre de Caja',
            `Cierre ID: ${cierreId} - Esperado: $${cierre.efectivo_esperado} → $${nuevoEfectivoEsperado} - Diferencia: $${cierre.diferencia} → $${nuevaDiferencia}`
        );
        await runQuery('COMMIT', []);

        solicitarSincronizacion('cierre de caja recalculado');
        return {
            success: true, sinCambios: false, message: 'Cierre de caja recalculado con éxito.',
            efectivoEsperadoAnterior: cierre.efectivo_esperado, efectivoEsperado: nuevoEfectivoEsperado,
            diferenciaAnterior: cierre.diferencia, diferencia: nuevaDiferencia
        };
    } catch (err) {
        await runQuery('ROLLBACK', []).catch(() => { });
        return { success: false, message: 'Error al recalcular el cierre de caja: ' + err.message };
    }
}

module.exports = { calcularVentanaYEsperado, registrarCierreCajaTx, obtenerCierresCaja, eliminarCierreCajaTx, recalcularCierreCajaTx };
