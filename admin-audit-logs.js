// Corregir bug de pérdida de foco en Electron al cerrar diálogos nativos en Windows
const originalAlert = window.alert;
window.alert = (msg) => {
    const result = originalAlert(msg);
    if (window.api?.forceRefocus) {
        window.api.forceRefocus();
    }
    setTimeout(() => {
        window.focus();
    }, 20);
    return result;
};
const originalConfirm = window.confirm;
window.confirm = (msg) => {
    const r = originalConfirm(msg);
    if (window.api?.forceRefocus) {
        window.api.forceRefocus();
    }
    setTimeout(() => {
        window.focus();
    }, 20);
    return r;
};

const PAGE_SIZE = 50;
let paginaActual = 1;
let totalRegistros = 0;
let debounceFiltrosAuditoria = null;
const mapaProductos = new Map(); // id de producto -> nombre, para mostrar nombres en vez de IDs en los detalles

// Recuerda los filtros seleccionados mientras dura la sesión de la ventana: al navegar a otra
// pantalla y volver (cada pantalla es una carga de página completa, no una SPA) se restauran en
// vez de resetearse. sessionStorage y no localStorage para aislar por ventana, igual que el
// carrito temporal (ver 'carrito_temporal' en ventas.js).
const STORAGE_KEY_FILTROS_AUDITORIA = 'auditoria_filtros';

function guardarFiltrosEnStorage() {
    const filtros = {
        usuario: document.getElementById('filtro-usuario').value,
        sucursal: document.getElementById('filtro-sucursal').value,
        accion: document.getElementById('filtro-accion').value,
        detalles: document.getElementById('filtro-detalles').value,
        fechaDesde: document.getElementById('filtro-fecha-desde').value,
        fechaHasta: document.getElementById('filtro-fecha-hasta').value
    };
    sessionStorage.setItem(STORAGE_KEY_FILTROS_AUDITORIA, JSON.stringify(filtros));
}

// Se llama después de poblar los <select> con sus opciones dinámicas (usuarios/sucursales/
// acciones), para que el valor guardado ya tenga un <option> al que engancharse.
function restaurarFiltrosDesdeStorage() {
    const guardado = sessionStorage.getItem(STORAGE_KEY_FILTROS_AUDITORIA);
    if (!guardado) return;
    try {
        const filtros = JSON.parse(guardado);
        document.getElementById('filtro-usuario').value = filtros.usuario || '';
        document.getElementById('filtro-sucursal').value = filtros.sucursal || '';
        document.getElementById('filtro-accion').value = filtros.accion || '';
        document.getElementById('filtro-detalles').value = filtros.detalles || '';
        document.getElementById('filtro-fecha-desde').value = filtros.fechaDesde || '';
        document.getElementById('filtro-fecha-hasta').value = filtros.fechaHasta || '';
    } catch {
        sessionStorage.removeItem(STORAGE_KEY_FILTROS_AUDITORIA);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validar Rol de Administrador
    const role = sessionStorage.getItem('currentRole') || 'Sin Rol';
    if (role !== 'Administrador') {
        alert("Acceso denegado. Esta sección es de uso exclusivo para administradores.");
        window.location.href = 'dashboard.html';
        return;
    }

    // Soporte para menú móvil flotante
    const toggleBtn = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggleBtn) {
                sidebar.classList.remove('open');
            }
        });
    }

    await Promise.all([cargarSucursalesFiltro(), cargarAccionesFiltro(), cargarUsuariosFiltro(), cargarProductosParaAuditoria()]);
    restaurarFiltrosDesdeStorage();
    await cargarAuditoria();

    const filtroUsuario = document.getElementById('filtro-usuario');
    const filtroSucursal = document.getElementById('filtro-sucursal');
    const filtroAccion = document.getElementById('filtro-accion');
    const filtroDetalles = document.getElementById('filtro-detalles');
    const filtroFechaDesde = document.getElementById('filtro-fecha-desde');
    const filtroFechaHasta = document.getElementById('filtro-fecha-hasta');

    filtroUsuario.addEventListener('change', () => recargarConDebounce());
    filtroSucursal.addEventListener('change', () => recargarConDebounce());
    filtroAccion.addEventListener('change', () => recargarConDebounce());
    filtroDetalles.addEventListener('input', () => recargarConDebounce());
    filtroFechaDesde.addEventListener('change', () => recargarConDebounce());
    filtroFechaHasta.addEventListener('change', () => recargarConDebounce());

    document.getElementById('btn-limpiar-filtros').addEventListener('click', () => {
        filtroUsuario.value = '';
        filtroSucursal.value = '';
        filtroAccion.value = '';
        filtroDetalles.value = '';
        filtroFechaDesde.value = '';
        filtroFechaHasta.value = '';
        sessionStorage.removeItem(STORAGE_KEY_FILTROS_AUDITORIA);
        paginaActual = 1;
        cargarAuditoria();
    });

    document.getElementById('btn-pagina-anterior').addEventListener('click', () => {
        if (paginaActual <= 1) return;
        paginaActual -= 1;
        cargarAuditoria();
    });

    document.getElementById('btn-pagina-siguiente').addEventListener('click', () => {
        if (paginaActual * PAGE_SIZE >= totalRegistros) return;
        paginaActual += 1;
        cargarAuditoria();
    });

    // Igual que en Reporte Diario: dos vías para invalidar la tabla tras sincronizar, el push IPC
    // 'sincronizacion-completa' (lo emite el proceso principal al terminar CUALQUIER ciclo, manual
    // o automático) y el evento local 'pos-sincronizacion-completa' que dispara el botón del sidebar
    // en esta misma ventana. Sin esto, un registro de auditoría hecho en otro equipo solo aparecía
    // tras salir y volver a entrar a esta pantalla.
    window.api.onSincronizacionCompleta(() => cargarAuditoria());
    window.addEventListener('pos-sincronizacion-completa', () => cargarAuditoria());
});

function recargarConDebounce() {
    guardarFiltrosEnStorage();
    clearTimeout(debounceFiltrosAuditoria);
    debounceFiltrosAuditoria = setTimeout(() => {
        paginaActual = 1;
        cargarAuditoria();
    }, 400);
}

// Rellenar el selector de Sucursal con las sucursales conocidas localmente
async function cargarSucursalesFiltro() {
    const select = document.getElementById('filtro-sucursal');
    const res = await window.api.obtenerTodasSucursales();
    if (res.success && res.data) {
        res.data.forEach(suc => {
            const opt = document.createElement('option');
            opt.value = suc.id;
            opt.innerText = suc.nombre;
            select.appendChild(opt);
        });
    }
}

// Rellenar el selector de Acción con los valores distintos que realmente existen en `auditoria`
async function cargarAccionesFiltro() {
    const select = document.getElementById('filtro-accion');
    const res = await window.api.obtenerAccionesAuditoria();
    if (res.success && res.data) {
        res.data.forEach(accion => {
            const opt = document.createElement('option');
            opt.value = accion;
            opt.innerText = accion;
            select.appendChild(opt);
        });
    }
}

// Rellenar el selector de Usuario con los usuarios que realmente existen en `auditoria`
async function cargarUsuariosFiltro() {
    const select = document.getElementById('filtro-usuario');
    const res = await window.api.obtenerUsuariosAuditoria();
    if (res.success && res.data) {
        res.data.forEach(usuario => {
            const opt = document.createElement('option');
            opt.value = usuario;
            opt.innerText = usuario;
            select.appendChild(opt);
        });
    }
}

// Colombia (America/Bogota) no tiene horario de verano: desfase fijo UTC-5.
// Convierte el límite inferior de un día local (00:00:00 -05:00) a su equivalente UTC.
function fechaDesdeBogotaAUTC(dateStr) {
    return `${dateStr}T05:00:00.000Z`;
}

// Convierte el límite superior de un día local (23:59:59.999 -05:00) a su equivalente UTC.
function fechaHastaBogotaAUTC(dateStr) {
    const inicioDiaSiguiente = new Date(`${dateStr}T00:00:00.000Z`);
    inicioDiaSiguiente.setUTCDate(inicioDiaSiguiente.getUTCDate() + 1);
    inicioDiaSiguiente.setUTCHours(4, 59, 59, 999);
    return inicioDiaSiguiente.toISOString();
}

// Cargar el catálogo de productos (id -> nombre) para poder mostrar nombres en vez de IDs en los detalles
async function cargarProductosParaAuditoria() {
    const res = await window.api.getInventory(null);
    if (res.success && res.data) {
        res.data.forEach(p => mapaProductos.set(p.id, p.nombre));
    }
}

// Quita tildes/diacríticos y pasa a minúsculas, igual que en ventas.js: permite que la búsqueda de
// "Detalles" ignore tildes tanto en el propio texto (resuelto server-side en buscar_auditoria, ver
// sync/migrate_auditoria_busqueda_insensible.sql) como al resolver nombres de producto acá.
function normalizeStr(value) {
    if (value == null) return '';
    return String(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Devuelve los IDs de producto cuyo nombre contiene todas las palabras del texto buscado, sin
// importar tildes ni el orden (usado para que el filtro de Detalles también encuentre coincidencias
// por nombre, aunque en la BD los detalles guarden el ID).
function productoIdsPorNombre(texto) {
    const terminos = normalizeStr(texto).split(/\s+/).filter(Boolean);
    const ids = [];
    mapaProductos.forEach((nombre, id) => {
        const nombreNormalizado = normalizeStr(nombre);
        if (terminos.every(t => nombreNormalizado.includes(t))) ids.push(id);
    });
    return ids;
}

// Sustituye "Producto ID: <id>" por "Producto: <nombre>" cuando el producto es reconocido.
// Si el producto ya no existe en el catálogo (p. ej. fue eliminado), se conserva el ID original.
function formatearDetallesConNombreProducto(detalles) {
    if (!detalles) return detalles;
    return detalles.replace(/Producto ID: (\S+)/g, (coincidencia, id) => {
        const nombre = mapaProductos.get(id);
        return nombre ? `Producto: ${nombre}` : coincidencia;
    });
}

// Los textos de "detalles" guardan timestamps en ISO/UTC crudo (p. ej. "Entrega estimada:
// 2026-07-30T04:59:59.000Z"), lo que confunde porque no coincide con la hora local. Se detecta
// cualquier ISO 8601 embebido y se reemplaza por su equivalente en hora de Bogotá.
function formatearFechasIsoEnDetalles(detalles) {
    if (!detalles) return detalles;
    return detalles.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z/g, (iso) => formatearFechaBogota(iso));
}

// Escapar HTML antes de insertar texto libre (usuario/accion/detalles) vía innerHTML
function escapeHtml(texto) {
    const div = document.createElement('div');
    div.innerText = texto === undefined || texto === null ? '' : String(texto);
    return div.innerHTML;
}

function formatearFechaBogota(fechaISO) {
    if (!fechaISO) return '-';
    return new Date(fechaISO).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'short',
        timeStyle: 'medium'
    });
}

// Clave "YYYY-MM-DD" en hora de Bogotá, usada para detectar cuándo cambia el día y agrupar filas.
function claveDiaBogota(fechaISO) {
    if (!fechaISO) return '';
    return new Date(fechaISO).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

// Encabezado legible del grupo, p. ej. "Jueves, 30 de julio de 2026".
function formatearEncabezadoDia(fechaISO) {
    const texto = new Date(fechaISO).toLocaleDateString('es-CO', {
        timeZone: 'America/Bogota',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

async function cargarAuditoria() {
    const usuario = document.getElementById('filtro-usuario').value;
    const sucursalId = document.getElementById('filtro-sucursal').value;
    const accion = document.getElementById('filtro-accion').value;
    const detalles = document.getElementById('filtro-detalles').value.trim();
    const fechaDesde = document.getElementById('filtro-fecha-desde').value;
    const fechaHasta = document.getElementById('filtro-fecha-hasta').value;

    // Solo se incluyen en el objeto las claves con un valor válido: con los filtros vacíos
    // (carga inicial o "Limpiar Filtros") no se envía usuario/sucursalId/accion/detalles/fechas
    // al IPC, y el handler trae el historial completo paginado en vez de comparar contra "".
    const filtros = { pagina: paginaActual };
    if (usuario) filtros.usuario = usuario;
    if (sucursalId) filtros.sucursalId = sucursalId;
    if (accion) filtros.accion = accion;
    if (detalles) {
        filtros.detalles = detalles;
        // Los detalles guardados en la BD siguen usando "Producto ID: <id>"; como en pantalla se
        // muestra el nombre, además del texto buscado se envían los IDs de producto cuyo nombre
        // coincide, para que el backend también pueda encontrarlos por nombre.
        const idsProductoCoincidentes = productoIdsPorNombre(detalles);
        if (idsProductoCoincidentes.length > 0) filtros.productoIds = idsProductoCoincidentes;
    }
    if (fechaDesde) filtros.fechaDesdeUTC = fechaDesdeBogotaAUTC(fechaDesde);
    if (fechaHasta) filtros.fechaHastaUTC = fechaHastaBogotaAUTC(fechaHasta);

    const tbody = document.querySelector('#table-auditoria tbody');
    const res = await window.api.obtenerAuditoria(filtros);

    if (!res.success) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">Error al cargar los logs de auditoría: ${res.message || ''}</td></tr>`;
        document.getElementById('paginacion-resumen').innerText = '';
        actualizarBotonesPaginacion();
        return;
    }

    totalRegistros = res.total || 0;
    const registros = res.data || [];

    if (registros.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #6b7280;">No se encontraron registros de auditoría con los filtros seleccionados.</td></tr>`;
    } else {
        tbody.innerHTML = '';
        let diaActual = null;
        registros.forEach(log => {
            const dia = claveDiaBogota(log.fecha);
            if (dia !== diaActual) {
                diaActual = dia;
                const trGrupo = document.createElement('tr');
                trGrupo.className = 'dia-header-row';
                trGrupo.innerHTML = `<td colspan="6">${formatearEncabezadoDia(log.fecha)}</td>`;
                tbody.appendChild(trGrupo);
            }

            const tr = document.createElement('tr');
            const esAdmin = log.rol === 'Administrador';
            tr.innerHTML = `
                <td>${formatearFechaBogota(log.fecha)}</td>
                <td><strong>${escapeHtml(log.usuario) || '-'}</strong></td>
                <td><span class="rol-badge" style="background-color: ${esAdmin ? '#fee2e2' : '#dbeafe'}; color: ${esAdmin ? '#ef4444' : '#2563eb'};">${escapeHtml(log.rol) || '-'}</span></td>
                <td>${escapeHtml(log.sucursal_id) || '-'}</td>
                <td>${escapeHtml(log.accion) || '-'}</td>
                <td class="detalles-cell">${escapeHtml(formatearFechasIsoEnDetalles(formatearDetallesConNombreProducto(log.detalles)))}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    const inicio = totalRegistros === 0 ? 0 : (paginaActual - 1) * PAGE_SIZE + 1;
    const fin = Math.min(paginaActual * PAGE_SIZE, totalRegistros);
    document.getElementById('paginacion-resumen').innerText = `Mostrando ${inicio}-${fin} de ${totalRegistros} registros`;
    actualizarBotonesPaginacion();
}

function actualizarBotonesPaginacion() {
    document.getElementById('btn-pagina-anterior').disabled = paginaActual <= 1;
    document.getElementById('btn-pagina-siguiente').disabled = (paginaActual * PAGE_SIZE) >= totalRegistros;
}
