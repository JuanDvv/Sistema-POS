const { ipcMain } = require('electron');
const { allQuery } = require('../db/connection');
const { supabaseLogs } = require('../sync/supabaseClients');
const { syncColaErrores } = require('../sync/syncService');
const { registrarErrorSistema, actualizarSesionActiva } = require('../services/errorLogService');

// SRP: consulta de logs de auditoría (tabla `auditoria`, proyecto Supabase de Logs) para el panel de Administración.

const PAGE_SIZE = 50;

// Trae los valores distintos (no vacíos, ordenados) de una columna de `auditoria`, para poblar
// selectores de filtro (Usuario, Acción) con los valores que realmente existen en los datos.
// Se pagina con .range() porque un .select() sin límite explícito se corta en el máximo de
// PostgREST (1000 filas): con la tabla ya por encima de eso, esa página siempre traía las filas
// más antiguas y perdía valores introducidos después (p. ej. las acciones de Pedidos), aunque sí
// existieran en la BD.
async function obtenerValoresDistintos(columna, tabla = 'auditoria') {
    if (!supabaseLogs) return [];
    const PAGE_SIZE = 1000;
    const valores = new Set();
    let desde = 0;

    while (true) {
        const { data, error } = await supabaseLogs
            .from(tabla)
            .select(columna)
            .not(columna, 'is', null)
            .range(desde, desde + PAGE_SIZE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;

        data.forEach(r => {
            const valor = (r[columna] || '').trim();
            if (valor !== '') valores.add(valor);
        });

        if (data.length < PAGE_SIZE) break;
        desde += PAGE_SIZE;
    }

    return [...valores].sort((a, b) => a.localeCompare(b, 'es'));
}

async function consultarErroresLocalesFallback(filtros = {}) {
    const { usuario, sucursalId, modulo, busqueda, fechaDesde, fechaHasta, pagina = 1 } = filtros || {};
    const where = [];
    const params = [];

    if (typeof usuario === 'string' && usuario.trim() !== '') {
        where.push('usuario = ?');
        params.push(usuario.trim());
    }
    if (typeof sucursalId === 'string' && sucursalId.trim() !== '') {
        where.push('sucursal_id = ?');
        params.push(sucursalId.trim());
    }
    if (typeof modulo === 'string' && modulo.trim() !== '') {
        where.push('modulo = ?');
        params.push(modulo.trim());
    }
    if (typeof fechaDesde === 'string' && fechaDesde.trim() !== '') {
        where.push('fecha >= ?');
        params.push(fechaDesde.trim());
    }
    if (typeof fechaHasta === 'string' && fechaHasta.trim() !== '') {
        where.push('fecha <= ?');
        params.push(fechaHasta.trim());
    }
    if (typeof busqueda === 'string' && busqueda.trim() !== '') {
        const terminos = busqueda.trim().split(/\s+/).filter(Boolean);
        terminos.forEach(t => {
            where.push('(lower(intento_usuario) LIKE ? OR lower(mensaje_amigable) LIKE ? OR lower(error_tecnico) LIKE ? OR lower(modulo) LIKE ?)');
            const pat = `%${t.toLowerCase()}%`;
            params.push(pat, pat, pat, pat);
        });
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const desde = (Math.max(1, pagina) - 1) * PAGE_SIZE;

    const totalRows = await allQuery(`SELECT COUNT(*) AS total FROM cola_errores ${whereSql}`, params);
    const total = totalRows && totalRows[0] ? Number(totalRows[0].total) : 0;
    const filas = await allQuery(
        `SELECT id, fecha, usuario, rol, sucursal_id, modulo, intento_usuario, mensaje_amigable, error_tecnico
         FROM cola_errores ${whereSql}
         ORDER BY fecha DESC
         LIMIT ? OFFSET ?`,
        [...params, PAGE_SIZE, desde]
    );

    return { success: true, data: filas || [], total, pagina };
}

function registerAuditoriaIpc() {
    // Obtener Logs de Auditoría con filtros (usuario, sucursal, acción, detalles libre, rango de fechas) y paginación
    ipcMain.handle('obtener-auditoria', async (event, filtros = {}) => {
        if (!supabaseLogs) {
            return { success: true, data: [], total: 0, pagina: 1 };
        }
        try {
            const { usuario, sucursalId, accion, detalles, productoIds, fechaDesdeUTC, fechaHastaUTC, pagina = 1 } = filtros || {};
            const desde = (Math.max(1, pagina) - 1) * PAGE_SIZE;

            // `detalles` es texto libre (input abierto): se separa en palabras para que la RPC
            // `buscar_auditoria` (sync/migrate_auditoria_busqueda_insensible.sql) exija que cada una
            // aparezca en el texto guardado, sin importar tildes ni el orden en que se escribieron
            // (igual que la búsqueda del catálogo de productos). Como en pantalla se muestra el
            // nombre del producto pero en la BD el texto sigue guardando "Producto ID: <id>",
            // también se pasan los IDs de producto cuyo nombre coincidió (resueltos en el renderer
            // vía `productoIds`) para que la RPC los busque como alternativa.
            const detallesTerminos = typeof detalles === 'string' && detalles.trim() !== ''
                ? detalles.trim().split(/\s+/).filter(Boolean)
                : null;
            const productoIdsValidos = Array.isArray(productoIds)
                ? productoIds.filter(id => typeof id === 'string' && id.trim() !== '')
                : null;

            // Cada filtro solo viaja como valor no nulo si trae contenido válido tras trim(); así la
            // carga inicial sin filtros no compara columnas contra "" y siempre trae el historial
            // completo paginado. fechaDesdeUTC/fechaHastaUTC ya vienen convertidos desde el renderer
            // (límites del día en America/Bogota, expresados en UTC).
            const { data, error } = await supabaseLogs.rpc('buscar_auditoria', {
                p_usuario: typeof usuario === 'string' && usuario.trim() !== '' ? usuario.trim() : null,
                p_sucursal_id: typeof sucursalId === 'string' && sucursalId.trim() !== '' ? sucursalId.trim() : null,
                p_accion: typeof accion === 'string' && accion.trim() !== '' ? accion.trim() : null,
                p_detalles_terminos: detallesTerminos,
                p_producto_ids: productoIdsValidos && productoIdsValidos.length > 0 ? productoIdsValidos : null,
                p_fecha_desde: typeof fechaDesdeUTC === 'string' && fechaDesdeUTC.trim() !== '' ? fechaDesdeUTC : null,
                p_fecha_hasta: typeof fechaHastaUTC === 'string' && fechaHastaUTC.trim() !== '' ? fechaHastaUTC : null,
                p_limite: PAGE_SIZE,
                p_offset: desde
            });
            if (error) throw error;

            // El total viaja repetido en cada fila (count(*) OVER() en la RPC); se lee de la primera
            // y se descarta la columna antes de devolver los registros al renderer.
            const total = data && data.length > 0 ? Number(data[0].total) : 0;
            const registros = (data || []).map(({ total: _total, ...resto }) => resto);

            return { success: true, data: registros, total, pagina };
        } catch (err) {
            return { success: false, message: 'Error al obtener los logs de auditoría: ' + err.message };
        }
    });

    // Poblar el selector de filtro por Acción con las acciones que realmente existen en los datos.
    ipcMain.handle('obtener-acciones-auditoria', async () => {
        try {
            return { success: true, data: await obtenerValoresDistintos('accion') };
        } catch (err) {
            return { success: false, message: 'Error al obtener las acciones de auditoría: ' + err.message };
        }
    });

    // Poblar el selector de filtro por Usuario con los usuarios que realmente existen en los datos.
    ipcMain.handle('obtener-usuarios-auditoria', async () => {
        try {
            return { success: true, data: await obtenerValoresDistintos('usuario') };
        } catch (err) {
            return { success: false, message: 'Error al obtener los usuarios de auditoría: ' + err.message };
        }
    });

    ipcMain.handle('obtener-errores-sistema', async (event, filtros = {}) => {
        await syncColaErrores().catch(() => {});
        const { usuario, sucursalId, modulo, busqueda, fechaDesde, fechaHasta, pagina = 1 } = filtros || {};
        const desde = (Math.max(1, pagina) - 1) * PAGE_SIZE;

        const fechaDesdeNorm = typeof fechaDesde === 'string' && fechaDesde.trim() !== ''
            ? `${fechaDesde.trim()} 00:00:00`
            : null;
        const fechaHastaNorm = typeof fechaHasta === 'string' && fechaHasta.trim() !== ''
            ? `${fechaHasta.trim()} 23:59:59`
            : null;

        if (!supabaseLogs) {
            return consultarErroresLocalesFallback({
                usuario,
                sucursalId,
                modulo,
                busqueda,
                fechaDesde: fechaDesdeNorm,
                fechaHasta: fechaHastaNorm,
                pagina
            });
        }

        try {
            const terminos = typeof busqueda === 'string' && busqueda.trim() !== ''
                ? busqueda.trim().split(/\s+/).filter(Boolean)
                : null;

            const { data, error } = await supabaseLogs.rpc('buscar_errores_sistema', {
                p_usuario: typeof usuario === 'string' && usuario.trim() !== '' ? usuario.trim() : null,
                p_sucursal_id: typeof sucursalId === 'string' && sucursalId.trim() !== '' ? sucursalId.trim() : null,
                p_modulo: typeof modulo === 'string' && modulo.trim() !== '' ? modulo.trim() : null,
                p_terminos: terminos,
                p_fecha_desde: fechaDesdeNorm,
                p_fecha_hasta: fechaHastaNorm,
                p_limite: PAGE_SIZE,
                p_offset: desde
            });
            if (error) throw error;

            const total = data && data.length > 0 ? Number(data[0].total) : 0;
            const registros = (data || []).map(({ total: _total, ...resto }) => resto);

            return { success: true, data: registros, total, pagina };
        } catch (err) {
            try {
                return await consultarErroresLocalesFallback({
                    usuario,
                    sucursalId,
                    modulo,
                    busqueda,
                    fechaDesde: fechaDesdeNorm,
                    fechaHasta: fechaHastaNorm,
                    pagina
                });
            } catch (_) {
                return { success: false, message: 'Error al obtener el log de errores del sistema: ' + err.message };
            }
        }
    });

    ipcMain.handle('obtener-modulos-errores', async () => {
        try {
            const remotos = await obtenerValoresDistintos('modulo', 'errores_sistema').catch(() => []);
            const locales = await allQuery(`SELECT DISTINCT modulo FROM cola_errores WHERE modulo IS NOT NULL AND trim(modulo) <> ''`, []).catch(() => []);
            const set = new Set(remotos);
            (locales || []).forEach(r => { if (r.modulo) set.add(r.modulo.trim()); });
            return { success: true, data: [...set].sort((a, b) => a.localeCompare(b, 'es')) };
        } catch (err) {
            return { success: false, message: 'Error al obtener módulos de errores: ' + err.message };
        }
    });

    ipcMain.handle('obtener-usuarios-errores', async () => {
        try {
            const remotos = await obtenerValoresDistintos('usuario', 'errores_sistema').catch(() => []);
            const locales = await allQuery(`SELECT DISTINCT usuario FROM cola_errores WHERE usuario IS NOT NULL AND trim(usuario) <> ''`, []).catch(() => []);
            const set = new Set(remotos);
            (locales || []).forEach(r => { if (r.usuario) set.add(r.usuario.trim()); });
            return { success: true, data: [...set].sort((a, b) => a.localeCompare(b, 'es')) };
        } catch (err) {
            return { success: false, message: 'Error al obtener usuarios de errores: ' + err.message };
        }
    });

    ipcMain.handle('registrar-error-renderer', async (event, datos = {}) => {
        const {
            usuario,
            rol,
            sucursalId,
            modulo = 'Interfaz de Usuario',
            origen = 'Renderer',
            intentoUsuario = 'Interacción en pantalla',
            mensajeAmigable = '',
            errorMensaje = 'Error de ejecución en la interfaz',
            errorStack = '',
            contextoDatos = null
        } = datos || {};

        if (usuario || rol) {
            actualizarSesionActiva(usuario, rol);
        }

        const errObj = new Error(errorMensaje);
        if (errorStack) errObj.stack = errorStack;

        await registrarErrorSistema({
            usuario,
            rol,
            sucursalId,
            modulo,
            origen,
            intentoUsuario,
            mensajeAmigable,
            error: errObj,
            contextoDatos
        });

        return { success: true };
    });
}

module.exports = { registerAuditoriaIpc };
