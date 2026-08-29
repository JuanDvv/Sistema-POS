const { ipcMain } = require('electron');
const { supabaseLogs } = require('../sync/supabaseClients');

// SRP: consulta de logs de auditoría (tabla `auditoria`, proyecto Supabase de Logs) para el panel de Administración.

const PAGE_SIZE = 50;

// Trae los valores distintos (no vacíos, ordenados) de una columna de `auditoria`, para poblar
// selectores de filtro (Usuario, Acción) con los valores que realmente existen en los datos.
// Se pagina con .range() porque un .select() sin límite explícito se corta en el máximo de
// PostgREST (1000 filas): con la tabla ya por encima de eso, esa página siempre traía las filas
// más antiguas y perdía valores introducidos después (p. ej. las acciones de Pedidos), aunque sí
// existieran en la BD.
async function obtenerValoresDistintos(columna) {
    if (!supabaseLogs) return [];
    const PAGE_SIZE = 1000;
    const valores = new Set();
    let desde = 0;

    while (true) {
        const { data, error } = await supabaseLogs
            .from('auditoria')
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
}

module.exports = { registerAuditoriaIpc };
