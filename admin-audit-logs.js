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
let paginaErroresActual = 1;
let totalErroresRegistros = 0;
let debounceFiltrosErrores = null;
let tabActiva = 'movimientos';
const mapaProductos = new Map(); // id de producto -> nombre, para mostrar nombres en vez de IDs en los detalles
const mapaSucursales = new Map();

// Recuerda los filtros seleccionados mientras dura la sesión de la ventana: al navegar a otra
// pantalla y volver (cada pantalla es una carga de página completa, no una SPA) se restauran en
// vez de resetearse. sessionStorage y no localStorage para aislar por ventana, igual que el
// carrito temporal (ver 'carrito_temporal' en ventas.js).
const STORAGE_KEY_FILTROS_AUDITORIA = 'auditoria_filtros';
const STORAGE_KEY_FILTROS_ERRORES = 'auditoria_filtros_errores';
const STORAGE_KEY_TAB_ACTIVA = 'auditoria_tab_activa';

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

function guardarFiltrosErroresEnStorage() {
    const filtros = {
        usuario: document.getElementById('filtro-err-usuario').value,
        sucursal: document.getElementById('filtro-err-sucursal').value,
        modulo: document.getElementById('filtro-err-modulo').value,
        busqueda: document.getElementById('filtro-err-busqueda').value,
        fechaDesde: document.getElementById('filtro-err-fecha-desde').value,
        fechaHasta: document.getElementById('filtro-err-fecha-hasta').value
    };
    sessionStorage.setItem(STORAGE_KEY_FILTROS_ERRORES, JSON.stringify(filtros));
}

// Se llama después de poblar los <select> con sus opciones dinámicas (usuarios/sucursales/
// acciones), para que el valor guardado ya tenga un <option> al que engancharse.
function restaurarFiltrosDesdeStorage() {
    const guardado = sessionStorage.getItem(STORAGE_KEY_FILTROS_AUDITORIA);
    if (guardado) {
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

    const guardadoErr = sessionStorage.getItem(STORAGE_KEY_FILTROS_ERRORES);
    if (guardadoErr) {
        try {
            const filtrosErr = JSON.parse(guardadoErr);
            document.getElementById('filtro-err-usuario').value = filtrosErr.usuario || '';
            document.getElementById('filtro-err-sucursal').value = filtrosErr.sucursal || '';
            document.getElementById('filtro-err-modulo').value = filtrosErr.modulo || '';
            document.getElementById('filtro-err-busqueda').value = filtrosErr.busqueda || '';
            document.getElementById('filtro-err-fecha-desde').value = filtrosErr.fechaDesde || '';
            document.getElementById('filtro-err-fecha-hasta').value = filtrosErr.fechaHasta || '';
        } catch {
            sessionStorage.removeItem(STORAGE_KEY_FILTROS_ERRORES);
        }
    }
}

function cambiarTab(nuevaTab) {
    tabActiva = nuevaTab === 'errores' ? 'errores' : 'movimientos';
    sessionStorage.setItem(STORAGE_KEY_TAB_ACTIVA, tabActiva);

    const btnMov = document.getElementById('tab-btn-movimientos');
    const btnErr = document.getElementById('tab-btn-errores');
    const panelMov = document.getElementById('panel-movimientos');
    const panelErr = document.getElementById('panel-errores');

    if (tabActiva === 'errores') {
        btnMov.classList.remove('active');
        btnErr.classList.add('active');
        panelMov.style.display = 'none';
        panelErr.style.display = 'block';
        cargarErroresSistema();
    } else {
        btnErr.classList.remove('active');
        btnMov.classList.add('active');
        panelErr.style.display = 'none';
        panelMov.style.display = 'block';
        cargarAuditoria();
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

    await Promise.all([
        cargarSucursalesFiltro(),
        cargarAccionesFiltro(),
        cargarUsuariosFiltro(),
        cargarProductosParaAuditoria(),
        cargarModulosErroresFiltro(),
        cargarUsuariosErroresFiltro()
    ]);
    restaurarFiltrosDesdeStorage();

    document.getElementById('tab-btn-movimientos').addEventListener('click', () => cambiarTab('movimientos'));
    document.getElementById('tab-btn-errores').addEventListener('click', () => cambiarTab('errores'));

    const tabGuardada = sessionStorage.getItem(STORAGE_KEY_TAB_ACTIVA) || 'movimientos';
    cambiarTab(tabGuardada);

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

    const filtroErrUsuario = document.getElementById('filtro-err-usuario');
    const filtroErrSucursal = document.getElementById('filtro-err-sucursal');
    const filtroErrModulo = document.getElementById('filtro-err-modulo');
    const filtroErrBusqueda = document.getElementById('filtro-err-busqueda');
    const filtroErrFechaDesde = document.getElementById('filtro-err-fecha-desde');
    const filtroErrFechaHasta = document.getElementById('filtro-err-fecha-hasta');

    filtroErrUsuario.addEventListener('change', () => recargarErroresConDebounce());
    filtroErrSucursal.addEventListener('change', () => recargarErroresConDebounce());
    filtroErrModulo.addEventListener('change', () => recargarErroresConDebounce());
    filtroErrBusqueda.addEventListener('input', () => recargarErroresConDebounce());
    filtroErrFechaDesde.addEventListener('change', () => recargarErroresConDebounce());
    filtroErrFechaHasta.addEventListener('change', () => recargarErroresConDebounce());

    document.getElementById('btn-err-limpiar-filtros').addEventListener('click', () => {
        filtroErrUsuario.value = '';
        filtroErrSucursal.value = '';
        filtroErrModulo.value = '';
        filtroErrBusqueda.value = '';
        filtroErrFechaDesde.value = '';
        filtroErrFechaHasta.value = '';
        sessionStorage.removeItem(STORAGE_KEY_FILTROS_ERRORES);
        paginaErroresActual = 1;
        cargarErroresSistema();
    });

    document.getElementById('btn-err-pagina-anterior').addEventListener('click', () => {
        if (paginaErroresActual <= 1) return;
        paginaErroresActual -= 1;
        cargarErroresSistema();
    });

    document.getElementById('btn-err-pagina-siguiente').addEventListener('click', () => {
        if (paginaErroresActual * PAGE_SIZE >= totalErroresRegistros) return;
        paginaErroresActual += 1;
        cargarErroresSistema();
    });

    // Igual que en Reporte Diario: dos vías para invalidar la tabla tras sincronizar, el push IPC
    // 'sincronizacion-completa' (lo emite el proceso principal al terminar CUALQUIER ciclo, manual
    // o automático) y el evento local 'pos-sincronizacion-completa' que dispara el botón del sidebar
    // en esta misma ventana. Sin esto, un registro de auditoría hecho en otro equipo solo aparecía
    // tras salir y volver a entrar a esta pantalla.
    const refrescarVistaActiva = () => {
        if (tabActiva === 'errores') cargarErroresSistema();
        else cargarAuditoria();
    };
    window.api.onSincronizacionCompleta(refrescarVistaActiva);
    window.addEventListener('pos-sincronizacion-completa', refrescarVistaActiva);
});

function recargarConDebounce() {
    guardarFiltrosEnStorage();
    clearTimeout(debounceFiltrosAuditoria);
    debounceFiltrosAuditoria = setTimeout(() => {
        paginaActual = 1;
        cargarAuditoria();
    }, 400);
}

function recargarErroresConDebounce() {
    guardarFiltrosErroresEnStorage();
    clearTimeout(debounceFiltrosErrores);
    debounceFiltrosErrores = setTimeout(() => {
        paginaErroresActual = 1;
        cargarErroresSistema();
    }, 400);
}

// Rellenar el selector de Sucursal con las sucursales conocidas localmente y canales remotos
async function cargarSucursalesFiltro() {
    const select = document.getElementById('filtro-sucursal');
    const selectErr = document.getElementById('filtro-err-sucursal');
    const res = await window.api.obtenerTodasSucursales();
    [{ id: 'Web-Movil', nombre: '📱 Web Móvil' }, { id: 'Catálogo', nombre: '📦 Catálogo Central' }].forEach(c => {
        mapaSucursales.set(c.id, c.nombre);
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.innerText = c.nombre;
        select.appendChild(opt);
        if (selectErr) selectErr.appendChild(opt.cloneNode(true));
    });
    if (res.success && res.data) {
        res.data.forEach(suc => {
            mapaSucursales.set(suc.id, suc.nombre);
            const opt = document.createElement('option');
            opt.value = suc.id;
            opt.innerText = suc.nombre;
            select.appendChild(opt);
            if (selectErr) selectErr.appendChild(opt.cloneNode(true));
        });
    }
}

async function cargarModulosErroresFiltro() {
    const select = document.getElementById('filtro-err-modulo');
    if (!select || !window.api.obtenerModulosErrores) return;
    const res = await window.api.obtenerModulosErrores();
    if (res.success && res.data) {
        res.data.forEach(mod => {
            const opt = document.createElement('option');
            opt.value = mod;
            opt.innerText = mod;
            select.appendChild(opt);
        });
    }
}

async function cargarUsuariosErroresFiltro() {
    const select = document.getElementById('filtro-err-usuario');
    if (!select || !window.api.obtenerUsuariosErrores) return;
    const res = await window.api.obtenerUsuariosErrores();
    if (res.success && res.data) {
        res.data.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u;
            opt.innerText = u;
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

const NOMBRES_DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const NOMBRES_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function claveDiaWallClock(fechaStr) {
    if (!fechaStr) return '';
    return String(fechaStr).trim().slice(0, 10);
}

function formatearEncabezadoDiaWallClock(fechaStr) {
    const ymd = claveDiaWallClock(fechaStr);
    const partes = ymd.split('-').map(Number);
    if (partes.length !== 3 || partes.some(isNaN)) return ymd || '-';
    const [y, m, d] = partes;
    const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    const yCalc = m < 3 ? y - 1 : y;
    const dow = (yCalc + Math.floor(yCalc / 4) - Math.floor(yCalc / 100) + Math.floor(yCalc / 400) + t[m - 1] + d) % 7;
    return `${NOMBRES_DIAS_SEMANA[dow]}, ${d} de ${NOMBRES_MESES[m - 1] || ''} de ${y}`;
}

function formatearFechaHoraWallClock(fechaStr) {
    if (!fechaStr) return '-';
    const limpio = String(fechaStr).replace('T', ' ').replace(/Z$/, '').trim();
    const [fechaParte, horaParte = ''] = limpio.split(' ');
    const [y, m, d] = (fechaParte || '').split('-');
    if (!y || !m || !d) return limpio;
    const [hh = '00', mm = '00', ss = '00'] = horaParte.split(':');
    const hNum = parseInt(hh, 10);
    if (isNaN(hNum)) return `${d}/${m}/${y}`;
    const sufijo = hNum >= 12 ? 'p. m.' : 'a. m.';
    const h12 = hNum % 12 === 0 ? 12 : hNum % 12;
    return `${d}/${m}/${y}, ${h12}:${mm}:${ss.slice(0, 2)} ${sufijo}`;
}

async function cargarErroresSistema() {
    if (!window.api.obtenerErroresSistema) return;

    const usuario = document.getElementById('filtro-err-usuario').value;
    const sucursalId = document.getElementById('filtro-err-sucursal').value;
    const modulo = document.getElementById('filtro-err-modulo').value;
    const busqueda = document.getElementById('filtro-err-busqueda').value.trim();
    const fechaDesde = document.getElementById('filtro-err-fecha-desde').value;
    const fechaHasta = document.getElementById('filtro-err-fecha-hasta').value;

    const filtros = { pagina: paginaErroresActual };
    if (usuario) filtros.usuario = usuario;
    if (sucursalId) filtros.sucursalId = sucursalId;
    if (modulo) filtros.modulo = modulo;
    if (busqueda) filtros.busqueda = busqueda;
    if (fechaDesde) filtros.fechaDesde = fechaDesde;
    if (fechaHasta) filtros.fechaHasta = fechaHasta;

    const tbody = document.querySelector('#table-errores tbody');
    const res = await window.api.obtenerErroresSistema(filtros);

    if (!res.success) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444;">Error al cargar el log de errores: ${escapeHtml(res.message || '')}</td></tr>`;
        document.getElementById('paginacion-err-resumen').innerText = '';
        actualizarBotonesPaginacionErrores();
        return;
    }

    totalErroresRegistros = res.total || 0;
    const registros = res.data || [];

    if (registros.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #6b7280;">No se encontraron errores registrados con los filtros seleccionados.</td></tr>`;
    } else {
        tbody.innerHTML = '';
        let diaActual = null;
        registros.forEach(errRow => {
            const dia = claveDiaWallClock(errRow.fecha);
            if (dia !== diaActual) {
                diaActual = dia;
                const trGrupo = document.createElement('tr');
                trGrupo.className = 'dia-header-row';
                trGrupo.innerHTML = `<td colspan="5">${escapeHtml(formatearEncabezadoDiaWallClock(errRow.fecha))}</td>`;
                tbody.appendChild(trGrupo);
            }

            const tr = document.createElement('tr');
            const esAdmin = errRow.rol === 'Administrador';
            const nombreSucursal = mapaSucursales.get(errRow.sucursal_id) || errRow.sucursal_id || 'Sin Sucursal';
            const textoSucursal = nombreSucursal !== errRow.sucursal_id && errRow.sucursal_id
                ? `${nombreSucursal} (${errRow.sucursal_id})`
                : nombreSucursal;

            tr.innerHTML = `
                <td style="vertical-align: top; white-space: nowrap;">${escapeHtml(formatearFechaHoraWallClock(errRow.fecha))}</td>
                <td style="vertical-align: top;">
                    <div style="margin-bottom: 4px;"><strong>${escapeHtml(errRow.usuario || 'Sistema')}</strong></div>
                    <div style="margin-bottom: 6px;">
                        <span class="rol-badge" style="background-color: ${esAdmin ? '#fee2e2' : '#dbeafe'}; color: ${esAdmin ? '#ef4444' : '#2563eb'};">${escapeHtml(errRow.rol || 'Sin Rol')}</span>
                    </div>
                    <div style="font-size: 0.82em; color: #475569;">📍 ${escapeHtml(textoSucursal)}</div>
                </td>
                <td style="vertical-align: top;">
                    <span class="modulo-badge">${escapeHtml(errRow.modulo || 'Sistema')}</span>
                </td>
                <td style="vertical-align: top;">
                    <div class="intento-box">${escapeHtml(errRow.intento_usuario || '-')}</div>
                </td>
                <td style="vertical-align: top;">
                    <div class="amigable-msg">${escapeHtml(errRow.mensaje_amigable || '-')}</div>
                    <details class="dev-error-details">
                        <summary>
                            <span>🔧 Ver ficha técnica completa (Desarrollador)</span>
                            <button type="button" class="btn-copy-error">📋 Copiar</button>
                        </summary>
                        <pre class="dev-error-pre">${escapeHtml(errRow.error_tecnico || '')}</pre>
                    </details>
                </td>
            `;

            const btnCopy = tr.querySelector('.btn-copy-error');
            if (btnCopy) {
                btnCopy.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.clipboard.writeText(errRow.error_tecnico || '').then(() => {
                        const originalText = btnCopy.innerText;
                        btnCopy.innerText = '✅ ¡Copiado!';
                        setTimeout(() => { btnCopy.innerText = originalText; }, 1800);
                    }).catch(() => {});
                });
            }

            tbody.appendChild(tr);
        });
    }

    const inicio = totalErroresRegistros === 0 ? 0 : (paginaErroresActual - 1) * PAGE_SIZE + 1;
    const fin = Math.min(paginaErroresActual * PAGE_SIZE, totalErroresRegistros);
    document.getElementById('paginacion-err-resumen').innerText = `Mostrando ${inicio}-${fin} de ${totalErroresRegistros} errores`;
    actualizarBotonesPaginacionErrores();
}

function actualizarBotonesPaginacionErrores() {
    document.getElementById('btn-err-pagina-anterior').disabled = paginaErroresActual <= 1;
    document.getElementById('btn-err-pagina-siguiente').disabled = (paginaErroresActual * PAGE_SIZE) >= totalErroresRegistros;
}
