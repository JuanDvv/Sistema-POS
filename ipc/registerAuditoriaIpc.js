const { ipcMain } = require('electron');
const { supabaseLogs } = require('../sync/supabaseClients');

// SRP: consulta de logs de auditoría (tabla `auditoria`, proyecto Supabase de Logs) para el panel de Administración.

const PAGE_SIZE = 50;

// Escapa un valor para usarlo dentro de un filtro `.or()` de PostgREST: lo envuelve en comillas
// dobles (requerido si el valor trae comas, puntos o paréntesis) y escapa backslashes/comillas internas.
function escaparValorOr(valor) {
    return `"${String(valor).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

// Trae los valores distintos (no vacíos, ordenados) de una columna de `auditoria`, para poblar
// selectores de filtro (Usuario, Acción) con los valores que realmente existen en los datos.
async function obtenerValoresDistintos(columna) {
    const { data, error } = await supabaseLogs
        .from('auditoria')
        .select(columna)
        .not(columna, 'is', null);
    if (error) throw error;

    return [...new Set((data || [])
        .map(r => (r[columna] || '').trim())
        .filter(v => v !== ''))]
        .sort((a, b) => a.localeCompare(b, 'es'));
}

function registerAuditoriaIpc() {
    // Obtener Logs de Auditoría con filtros (usuario, sucursal, acción, detalles libre, rango de fechas) y paginación
    ipcMain.handle('obtener-auditoria', async (event, filtros = {}) => {
        try {
            const { usuario, sucursalId, accion, detalles, productoIds, fechaDesdeUTC, fechaHastaUTC, pagina = 1 } = filtros || {};
            const desde = (Math.max(1, pagina) - 1) * PAGE_SIZE;
            const hasta = desde + PAGE_SIZE - 1;

            let query = supabaseLogs
                .from('auditoria')
                .select('fecha, usuario, rol, sucursal_id, accion, detalles', { count: 'exact' });

            // Cada filtro solo se agrega al WHERE si trae un valor válido (string no vacío tras
            // trim); así la carga inicial sin filtros no compara columnas contra "", null o
            // undefined y siempre trae el historial completo paginado.
            if (typeof usuario === 'string' && usuario.trim() !== '') {
                query = query.eq('usuario', usuario.trim());
            }
            if (typeof sucursalId === 'string' && sucursalId.trim() !== '') {
                query = query.eq('sucursal_id', sucursalId.trim());
            }
            if (typeof accion === 'string' && accion.trim() !== '') {
                query = query.eq('accion', accion.trim());
            }
            // `detalles` es texto libre (input abierto): búsqueda parcial, no selector de valores exactos.
            // Como en pantalla se muestra el nombre del producto pero en la BD el texto sigue
            // guardando "Producto ID: <id>", además de buscar el texto tal cual se busca por cada
            // ID de producto cuyo nombre coincidió (resuelto en el renderer vía `productoIds`).
            if (typeof detalles === 'string' && detalles.trim() !== '') {
                const patrones = [`detalles.ilike.${escaparValorOr(`%${detalles.trim()}%`)}`];
                if (Array.isArray(productoIds)) {
                    productoIds.forEach(id => {
                        if (typeof id === 'string' && id.trim() !== '') {
                            patrones.push(`detalles.ilike.${escaparValorOr(`%Producto ID: ${id.trim()}%`)}`);
                        }
                    });
                }
                query = query.or(patrones.join(','));
            }
            // fechaDesdeUTC/fechaHastaUTC ya vienen convertidos desde el renderer (límites del
            // día en America/Bogota, expresados en UTC) para no depender de la zona horaria del proceso principal.
            if (typeof fechaDesdeUTC === 'string' && fechaDesdeUTC.trim() !== '') {
                query = query.gte('fecha', fechaDesdeUTC);
            }
            if (typeof fechaHastaUTC === 'string' && fechaHastaUTC.trim() !== '') {
                query = query.lte('fecha', fechaHastaUTC);
            }

            query = query.order('fecha', { ascending: false }).range(desde, hasta);

            const { data, error, count } = await query;
            if (error) throw error;

            return { success: true, data, total: count, pagina };
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
}

module.exports = { registerAuditoriaIpc };
