const { v4: uuidv4 } = require('uuid');
const { db, runQuery, allQuery } = require('../db/connection');
const { registrarAuditoria } = require('./auditService');
const { solicitarSincronizacion } = require('../sync/syncService');

// Adaptado de ventas.js/ventas-anteriores.js/admin.js (esCategoriaPasteleria): camina
// categoria_padre_id hasta la raíz y compara el nombre normalizado contra "pasteleria"/"pastel"/
// "heladeria"/"helado" (duplicado a propósito, mismo patrón ya usado en esos archivos -- pero aquí
// en el proceso principal, para exportar a Excel el catálogo completo de pastelería y heladería
// sin depender del renderer).
function normalizeStrServ(value) {
    if (value == null) return '';
    return String(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// SRP: sugeridos semanales de pastelería (persistidos, solo Administrador) y la recomendación de
// pedido extra (calculada al vuelo, nunca se guarda -- ver admin.html/admin.js, sección
// "Calculadora de Pedido Extra").

const LOOKBACK_DIAS_PROMEDIO = 42; // 6 semanas: múltiplo de 7 para promediar la estacionalidad por
// día de la semana (los sábados venden distinto que un martes) sin necesitar un modelo por día.
const DIAS_ENTREGA = [2, 4, 6]; // martes, jueves, sábado (Date.getDay(): 0=domingo)
const COLUMNA_SUGERIDO_POR_DIA = { 2: 'sugerido_martes', 4: 'sugerido_jueves', 6: 'sugerido_sabado' };

// Fecha local en formato YYYY-MM-DD a partir de un Date -- NO usar toISOString().slice(0,10) para
// esto: convierte a UTC primero, así que en horas de la tarde/noche en Colombia (UTC-5) puede
// devolver el día siguiente. Mismo patrón que ya usa gestion.js (calcularRangoFechasFiltro) para
// evitar ese corrimiento de zona horaria.
function fechaLocalYMD(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Próxima fecha de entrega estrictamente DESPUÉS de "desde" -- si hoy mismo es día de entrega, se
// asume que el camión de hoy ya salió/está por salir, así que apunta a la SIGUIENTE (ej. pedir un
// extra en martes recomienda para el jueves, no para el propio martes).
function calcularProximaEntrega(desde = new Date()) {
    for (let d = 1; d <= 7; d++) {
        const candidata = new Date(desde);
        candidata.setDate(candidata.getDate() + d);
        if (DIAS_ENTREGA.includes(candidata.getDay())) {
            return { fecha: fechaLocalYMD(candidata), dias: d, diaSemana: candidata.getDay() };
        }
    }
    throw new Error('No se pudo calcular la próxima fecha de entrega.'); // inalcanzable, DIAS_ENTREGA no está vacío
}

// Recomendación = promedio de venta diaria (últimos 42 días) × días hasta la próxima entrega,
// menos el stock físico actual, con mínimo 0 -- cuántas unidades hacen falta para no quedarse sin
// stock antes de que llegue el camión, según el ritmo de venta reciente y lo que hay en físico
// ahora mismo.
//
// OJO: a propósito NO se resta el sugerido de ese día aquí (se probó esa versión y el resultado
// daba prácticamente siempre 0 -- el sugerido normalmente ya está calibrado para cubrir esa misma
// demanda, así que "necesidad − sugerido" tiende a cancelarse por diseño, sin importar qué tan
// bajo esté el stock real en este momento). El sugerido de ese día sigue disponible en la
// respuesta (`sugeridoDelDia`) como dato de referencia en su propia columna, pero no participa en
// el cálculo de la cantidad recomendada. Solo lectura -- no escribe nada en base de datos.
async function calcularRecomendacionExtra({ productoId, sucursalId }) {
    const hoy = new Date();
    const desde = new Date(hoy);
    desde.setDate(desde.getDate() - LOOKBACK_DIAS_PROMEDIO);
    const desdeStr = fechaLocalYMD(desde);
    const hastaStr = fechaLocalYMD(hoy);

    const fila = await new Promise((resolve, reject) => {
        db.get(
            `SELECT COALESCE(SUM(dv.cantidad), 0) as total_vendido
             FROM ventas v
             JOIN detalle_ventas dv ON v.id = dv.venta_id
             WHERE dv.producto_id = ? AND v.sucursal_id = ?
               AND (v.sync_status IS NULL OR v.sync_status <> 'deleted')
               AND dv.deleted_at IS NULL
               AND strftime('%Y-%m-%d', v.fecha, 'localtime') >= ? AND strftime('%Y-%m-%d', v.fecha, 'localtime') <= ?`,
            [productoId, sucursalId, desdeStr, hastaStr],
            (err, row) => err ? reject(err) : resolve(row)
        );
    });
    const promedioDiario = (fila.total_vendido || 0) / LOOKBACK_DIAS_PROMEDIO;

    const stockFila = await new Promise((resolve, reject) => {
        db.get(`SELECT stock FROM inventario_sucursal WHERE producto_id = ? AND sucursal_id = ?`, [productoId, sucursalId],
            (err, row) => err ? reject(err) : resolve(row));
    });
    const stockActual = stockFila ? stockFila.stock : 0;

    const sugeridoFila = await new Promise((resolve, reject) => {
        db.get(`SELECT sugerido_martes, sugerido_jueves, sugerido_sabado FROM sugeridos_pasteleria WHERE producto_id = ? AND sucursal_id = ?`,
            [productoId, sucursalId], (err, row) => err ? reject(err) : resolve(row));
    });

    const { fecha: proximaFechaEntrega, dias: diasHastaProximaEntrega, diaSemana } = calcularProximaEntrega(hoy);
    const columnaDia = COLUMNA_SUGERIDO_POR_DIA[diaSemana];
    const sugeridoDelDia = (sugeridoFila && sugeridoFila[columnaDia]) || 0;

    const necesidadProyectada = Math.round(promedioDiario * diasHastaProximaEntrega);
    const cantidadRecomendada = Math.max(0, necesidadProyectada - stockActual);

    return { promedioDiario, diasHastaProximaEntrega, proximaFechaEntrega, stockActual, sugeridoDelDia, cantidadRecomendada };
}

// Recomendación para TODOS los productos de pastelería que ya tienen algún sugerido configurado
// en la sucursal (no se listan los que nunca llegan ahí -- ver esCategoriaPasteleriaAdmin/filtro
// en admin.js). Arranca directamente desde sugeridos_pasteleria en vez de recorrer el catálogo
// completo por categoría: como esa tabla solo se llena desde la grilla de "Sugeridos Semanales"
// (ya limitada a pastelería), es un filtro equivalente y evita duplicar la lógica de árbol de
// categorías en el proceso principal. Usada tanto por la tabla en pantalla como por el Excel
// (ver utils/excelPedidoExtra.js), para que ambos muestren siempre los mismos números.
async function calcularRecomendacionesPasteleriaSucursal(sucursalId) {
    const filas = await new Promise((resolve, reject) => {
        db.all(
            `SELECT sp.producto_id, p.nombre as producto_nombre
             FROM sugeridos_pasteleria sp
             JOIN productos p ON p.id = sp.producto_id
             WHERE sp.sucursal_id = ?
               AND (sp.sync_status IS NULL OR sp.sync_status <> 'deleted')
               AND (p.sync_status IS NULL OR p.sync_status <> 'deleted')
               AND (sp.sugerido_martes > 0 OR sp.sugerido_jueves > 0 OR sp.sugerido_sabado > 0)
             ORDER BY p.nombre COLLATE NOCASE`,
            [sucursalId],
            (err, rows) => err ? reject(err) : resolve(rows)
        );
    });

    const resultados = [];
    for (const fila of filas) {
        const r = await calcularRecomendacionExtra({ productoId: fila.producto_id, sucursalId });
        resultados.push({ productoId: fila.producto_id, productoNombre: fila.producto_nombre, ...r });
    }
    return resultados;
}

// Catálogo COMPLETO de productos de pastelería de una sucursal, con su sugerido actual (0 si
// nunca se guardó uno) -- mismos datos que arma la grilla editable de admin.js
// (cargarSugeridosPasteleria), pero calculados aquí en el proceso principal para poder generar el
// Excel de "Sugeridos Semanales" (ver utils/excelSugeridosPasteleria.js) sin depender de que el
// renderer le pase sus datos ya filtrados.
async function obtenerProductosPasteleriaConSugeridos(sucursalId) {
    const productos = await allQuery(
        `SELECT p.id, p.nombre, p.categoria_id, COALESCE(i.stock, 0) as stock
         FROM productos p
         LEFT JOIN inventario_sucursal i ON p.id = i.producto_id AND i.sucursal_id = ?
         WHERE (p.sync_status IS NULL OR p.sync_status <> 'deleted')`,
        [sucursalId]
    );
    const categorias = await allQuery(
        `SELECT id, nombre, categoria_padre_id FROM categorias WHERE (sync_status IS NULL OR sync_status <> 'deleted')`, []
    );
    const esPasteleria = (producto) => {
        if (!producto.categoria_id) return false;
        let actual = categorias.find(c => c.id === producto.categoria_id);
        while (actual) {
            const norm = normalizeStrServ(actual.nombre);
            if (norm.includes('pasteleria') || norm.includes('pastel') || norm.includes('heladeria') || norm.includes('helado')) return true;
            actual = categorias.find(c => c.id === actual.categoria_padre_id) || null;
        }
        return false;
    };
    const productosPasteleria = productos.filter(esPasteleria);

    const sugeridos = await allQuery(
        `SELECT producto_id, sugerido_martes, sugerido_jueves, sugerido_sabado FROM sugeridos_pasteleria
         WHERE sucursal_id = ? AND (sync_status IS NULL OR sync_status <> 'deleted')`,
        [sucursalId]
    );
    const sugeridosPorProducto = {};
    sugeridos.forEach(s => { sugeridosPorProducto[s.producto_id] = s; });

    return productosPasteleria
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
        .map(p => {
            const s = sugeridosPorProducto[p.id] || { sugerido_martes: 0, sugerido_jueves: 0, sugerido_sabado: 0 };
            return {
                productoId: p.id, productoNombre: p.nombre, stockActual: p.stock,
                sugeridoMartes: s.sugerido_martes, sugeridoJueves: s.sugerido_jueves, sugeridoSabado: s.sugerido_sabado
            };
        });
}

async function upsertSugeridoPasteleriaTx({ productoId, sucursalId, sugeridoMartes, sugeridoJueves, sugeridoSabado, auditoriaUsuario, auditoriaRol }) {
    if (auditoriaRol !== 'Administrador') {
        return { success: false, message: 'Solo un administrador puede editar los sugeridos.' };
    }
    try {
        const id = uuidv4();
        await runQuery(
            `INSERT INTO sugeridos_pasteleria (id, producto_id, sucursal_id, sugerido_martes, sugerido_jueves, sugerido_sabado, sync_status, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
             ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                sugerido_martes = excluded.sugerido_martes,
                sugerido_jueves = excluded.sugerido_jueves,
                sugerido_sabado = excluded.sugerido_sabado,
                sync_status = 'pending'`,
            [id, productoId, sucursalId, Number(sugeridoMartes) || 0, Number(sugeridoJueves) || 0, Number(sugeridoSabado) || 0]
        );
        // Se consulta el nombre del producto en vez de confiar en un nombre que mande el cliente,
        // para que el log de auditoría sea una fuente verificada (mismo criterio que el resto de
        // registrarAuditoria(...) en este proyecto).
        const productoFila = await new Promise((resolve, reject) => {
            db.get(`SELECT nombre FROM productos WHERE id = ?`, [productoId], (err, row) => err ? reject(err) : resolve(row));
        });
        const productoNombre = productoFila ? productoFila.nombre : productoId;
        await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucursalId, 'Editar Sugerido Pastelería',
            `Producto: ${productoNombre} - Martes: ${sugeridoMartes} - Jueves: ${sugeridoJueves} - Sábado: ${sugeridoSabado}`);
        solicitarSincronizacion('sugerido de pastelería editado');
        return { success: true, message: 'Sugerido guardado exitosamente.' };
    } catch (err) {
        return { success: false, message: 'Error al guardar el sugerido: ' + err.message };
    }
}

module.exports = {
    calcularProximaEntrega, calcularRecomendacionExtra, calcularRecomendacionesPasteleriaSucursal,
    obtenerProductosPasteleriaConSugeridos, upsertSugeridoPasteleriaTx
};
