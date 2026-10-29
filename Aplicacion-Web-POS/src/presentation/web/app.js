const state = {
    token: localStorage.getItem('pos_mobile_token') || null,
    usuario: null,
    sucursales: [],
    sucursalActivaId: localStorage.getItem('pos_mobile_sucursal_id') || '',
    productos: [],
    categorias: [],
    filtroBusqueda: '',
    filtroCategoriaId: '',
    filtroBajoStock: false,
    tabActiva: 'reporte',
    fechaReporte: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date()),
    subtabReporte: 'ventas',
    filtroBusquedaVentas: '',
    reporte: null,
    editingVenta: null,
    editingVentaItems: [],
    ultimoCampoMixtoEditado: 'efectivo',
    productoSeleccionadoVenta: null,
    subtabAdmin: 'turnos',
    fechaInicioTurnos: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date()),
    diasTurnos: 14,
    operadoresTurnos: ['Liliana', 'Tatiana', 'Danna'],
    filtroSolVentas: 'pendiente',
    filtroSolGastos: 'pendiente',
    solicitudesVentasCache: {},
    solicitudesGastosCache: {}
};

const els = {
    dbIndicator: document.getElementById('db-indicator'),
    dbStatusText: document.getElementById('db-status-text'),
    infoPlantTime: document.getElementById('info-plant-time'),
    toast: document.getElementById('toast'),
    viewLogin: document.getElementById('view-login'),
    viewApp: document.getElementById('view-app'),
    formLogin: document.getElementById('form-login'),
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
    btnLogout: document.getElementById('btn-logout'),
    userDisplayName: document.getElementById('user-display-name'),
    userDisplayRole: document.getElementById('user-display-role'),
    selectSucursal: document.getElementById('select-sucursal'),
    tabReporte: document.getElementById('tab-reporte'),
    tabProductos: document.getElementById('tab-productos'),
    tabCategorias: document.getElementById('tab-categorias'),
    reporteFecha: document.getElementById('reporte-fecha'),
    btnFechaAyer: document.getElementById('btn-fecha-ayer'),
    btnFechaHoy: document.getElementById('btn-fecha-hoy'),
    btnRefreshReporte: document.getElementById('btn-refresh-reporte'),
    resCajaNeta: document.getElementById('res-caja-neta'),
    resDesgloseCajaNeta: document.getElementById('res-desglose-caja-neta'),
    resEfectivoCaja: document.getElementById('res-efectivo-caja'),
    resDesgloseEfectivo: document.getElementById('res-desglose-efectivo'),
    resVentasEfectivo: document.getElementById('res-ventas-efectivo'),
    resVentasTransferencia: document.getElementById('res-ventas-transferencia'),
    resTotalGastos: document.getElementById('res-total-gastos'),
    resVentasCredito: document.getElementById('res-ventas-credito'),
    countVentas: document.getElementById('count-ventas'),
    countGastos: document.getElementById('count-gastos'),
    searchVentas: document.getElementById('search-ventas'),
    btnNuevoGasto: document.getElementById('btn-nuevo-gasto'),
    listaVentas: document.getElementById('lista-ventas'),
    listaGastos: document.getElementById('lista-gastos'),
    searchProducto: document.getElementById('search-producto'),
    filterCategoria: document.getElementById('filter-categoria'),
    btnFilterBajoStock: document.getElementById('btn-filter-bajo-stock'),
    productosCountLabel: document.getElementById('productos-count-label'),
    btnRefreshCatalogo: document.getElementById('btn-refresh-catalogo'),
    listaProductos: document.getElementById('lista-productos'),
    listaCategorias: document.getElementById('lista-categorias'),
    btnNuevoProducto: document.getElementById('btn-nuevo-producto'),
    modalProducto: document.getElementById('modal-producto'),
    modalProductoTitulo: document.getElementById('modal-producto-titulo'),
    btnCerrarModalProducto: document.getElementById('btn-cerrar-modal-producto'),
    formProducto: document.getElementById('form-producto'),
    prodId: document.getElementById('prod-id'),
    prodNombre: document.getElementById('prod-nombre'),
    prodPrecio: document.getElementById('prod-precio'),
    prodStock: document.getElementById('prod-stock'),
    prodCategoria: document.getElementById('prod-categoria'),
    prodStockMinimo: document.getElementById('prod-stock-minimo'),
    prodDescripcion: document.getElementById('prod-descripcion'),
    prodError: document.getElementById('prod-error'),
    btnEliminarProducto: document.getElementById('btn-eliminar-producto'),
    modalAbastecer: document.getElementById('modal-abastecer'),
    btnCerrarModalAbastecer: document.getElementById('btn-cerrar-modal-abastecer'),
    formAbastecer: document.getElementById('form-abastecer'),
    abastProdId: document.getElementById('abast-prod-id'),
    abastProdNombre: document.getElementById('abast-prod-nombre'),
    abastCantidad: document.getElementById('abast-cantidad'),
    abastError: document.getElementById('abast-error'),
    btnNuevaCategoria: document.getElementById('btn-nueva-categoria'),
    modalCategoria: document.getElementById('modal-categoria'),
    modalCategoriaTitulo: document.getElementById('modal-categoria-titulo'),
    btnCerrarModalCategoria: document.getElementById('btn-cerrar-modal-categoria'),
    formCategoria: document.getElementById('form-categoria'),
    catId: document.getElementById('cat-id'),
    catNombre: document.getElementById('cat-nombre'),
    catPadre: document.getElementById('cat-padre'),
    catError: document.getElementById('cat-error'),
    btnEliminarCategoria: document.getElementById('btn-eliminar-categoria'),
    modalEditarVenta: document.getElementById('modal-editar-venta'),
    btnCerrarModalVenta: document.getElementById('btn-cerrar-modal-venta'),
    formEditarVenta: document.getElementById('form-editar-venta'),
    editVentaId: document.getElementById('edit-venta-id'),
    editVentaHora: document.getElementById('edit-venta-hora'),
    editVentaCliente: document.getElementById('edit-venta-cliente'),
    editVentaMetodoPago: document.getElementById('edit-venta-metodo-pago'),
    editVentaDomicilio: document.getElementById('edit-venta-domicilio'),
    wrapperMixto: document.getElementById('wrapper-mixto'),
    editVentaEfectivo: document.getElementById('edit-venta-efectivo'),
    editVentaTransferencia: document.getElementById('edit-venta-transferencia'),
    editVentaItemsList: document.getElementById('edit-venta-items-list'),
    editVentaProdCombobox: document.getElementById('edit-venta-prod-combobox'),
    editVentaAddProdSearch: document.getElementById('edit-venta-add-prod-search'),
    btnClearProdSearch: document.getElementById('btn-clear-prod-search'),
    editVentaProdDropdown: document.getElementById('edit-venta-prod-dropdown'),
    editVentaAddCant: document.getElementById('edit-venta-add-cant'),
    btnEditVentaAddItem: document.getElementById('btn-edit-venta-add-item'),
    editVentaTotalCalc: document.getElementById('edit-venta-total-calc'),
    editVentaError: document.getElementById('edit-venta-error'),
    btnAnularVenta: document.getElementById('btn-anular-venta'),
    modalGasto: document.getElementById('modal-gasto'),
    modalGastoTitulo: document.getElementById('modal-gasto-titulo'),
    btnCerrarModalGasto: document.getElementById('btn-cerrar-modal-gasto'),
    formGasto: document.getElementById('form-gasto'),
    gastoId: document.getElementById('gasto-id'),
    gastoTipo: document.getElementById('gasto-tipo'),
    gastoDescripcion: document.getElementById('gasto-descripcion'),
    gastoMonto: document.getElementById('gasto-monto'),
    gastoMetodoPago: document.getElementById('gasto-metodo-pago'),
    gastoError: document.getElementById('gasto-error'),
    btnEliminarGasto: document.getElementById('btn-eliminar-gasto'),
    btnVerAuditoria: document.getElementById('btn-ver-auditoria'),
    modalAuditoria: document.getElementById('modal-auditoria'),
    btnCerrarModalAuditoria: document.getElementById('btn-cerrar-modal-auditoria'),
    searchAuditoria: document.getElementById('search-auditoria'),
    btnRefreshAuditoria: document.getElementById('btn-refresh-auditoria'),
    auditoriaCountLabel: document.getElementById('auditoria-count-label'),
    listaAuditoria: document.getElementById('lista-auditoria'),
    tabAdmin: document.getElementById('tab-admin'),
    adminSubtabTurnos: document.getElementById('admin-subtab-turnos'),
    adminSubtabSolVentas: document.getElementById('admin-subtab-sol-ventas'),
    adminSubtabSolGastos: document.getElementById('admin-subtab-sol-gastos'),
    countAdminSolVentas: document.getElementById('count-admin-sol-ventas'),
    countAdminSolGastos: document.getElementById('count-admin-sol-gastos'),
    btnAdminTurnoAnt: document.getElementById('btn-admin-turno-ant'),
    btnAdminTurnoSig: document.getElementById('btn-admin-turno-sig'),
    btnAdminTurnoHoy: document.getElementById('btn-admin-turno-hoy'),
    labelAdminRangoTurnos: document.getElementById('label-admin-rango-turnos'),
    selectAdminTurnoDias: document.getElementById('select-admin-turno-dias'),
    thAdminOp1: document.getElementById('th-admin-op-1'),
    thAdminOp2: document.getElementById('th-admin-op-2'),
    thAdminOp3: document.getElementById('th-admin-op-3'),
    tbodyAdminTurnos: document.getElementById('tbody-admin-turnos'),
    filtroAdminSolVentas: document.getElementById('filtro-admin-sol-ventas'),
    btnRefreshSolVentas: document.getElementById('btn-refresh-sol-ventas'),
    listaAdminSolVentas: document.getElementById('lista-admin-sol-ventas'),
    filtroAdminSolGastos: document.getElementById('filtro-admin-sol-gastos'),
    btnRefreshSolGastos: document.getElementById('btn-refresh-sol-gastos'),
    listaAdminSolGastos: document.getElementById('lista-admin-sol-gastos'),
    modalAdminSolVenta: document.getElementById('modal-admin-sol-venta'),
    btnCerrarModalAdminSolVenta: document.getElementById('btn-cerrar-modal-admin-sol-venta'),
    btnCerrarModalAdminSolVentaPie: document.getElementById('btn-cerrar-modal-admin-sol-venta-pie'),
    modalAdminSolVentaBody: document.getElementById('modal-admin-sol-venta-body'),
    modalAdminSolGasto: document.getElementById('modal-admin-sol-gasto'),
    btnCerrarModalAdminSolGasto: document.getElementById('btn-cerrar-modal-admin-sol-gasto'),
    btnCerrarModalAdminSolGastoPie: document.getElementById('btn-cerrar-modal-admin-sol-gasto-pie'),
    modalAdminSolGastoBody: document.getElementById('modal-admin-sol-gasto-body')
};

const formatoMoneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
});

let toastTimer = null;
function mostrarToast(mensaje) {
    els.toast.textContent = mensaje;
    els.toast.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 2600);
}

async function apiFetch(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        ...(options.headers || {})
    };
    if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }
    const sep = url.includes('?') ? '&' : '?';
    const cacheBustedUrl = `${url}${sep}_ts=${Date.now()}`;
    const res = await fetch(cacheBustedUrl, {
        cache: 'no-store',
        ...options,
        headers
    });
    if (res.status === 401 && !url.includes('/api/auth/session')) {
        state.token = null;
        state.usuario = null;
        localStorage.removeItem('pos_mobile_token');
        restaurarSesion();
        return { status: 401, data: { ok: false, error: 'Sesión expirada' } };
    }
    const data = await res.json().catch(() => ({ ok: false, error: 'Error de respuesta' }));
    return { status: res.status, data };
}

async function verificarSaludServidor() {
    try {
        const { data } = await apiFetch('/api/health');
        if (data.ok) {
            els.dbIndicator.className = 'brand-dot online';
            els.dbStatusText.textContent = `PostgreSQL conectado (${data.dbHost})`;
            els.infoPlantTime.textContent = data.horaPlanta || '-';
        } else {
            els.dbIndicator.className = 'brand-dot offline';
            els.dbStatusText.textContent = `Sin conexión DB: ${data.error || 'Error'}`;
        }
    } catch (_) {
        els.dbIndicator.className = 'brand-dot offline';
        els.dbStatusText.textContent = 'Servidor web sin conexión';
    }
}

function renderSucursales() {
    els.selectSucursal.innerHTML = '';
    if (state.sucursales.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Sin sucursales registradas';
        els.selectSucursal.appendChild(opt);
        return;
    }

    const preferida = state.sucursales.find(s => s.id === state.sucursalActivaId)
        || state.sucursales[0];

    state.sucursalActivaId = preferida.id;
    localStorage.setItem('pos_mobile_sucursal_id', state.sucursalActivaId);

    for (const suc of state.sucursales) {
        const opt = document.createElement('option');
        opt.value = suc.id;
        opt.textContent = suc.nombre;
        if (suc.id === state.sucursalActivaId) opt.selected = true;
        els.selectSucursal.appendChild(opt);
    }
}

function poblarSelectoresCategorias() {
    const valorActualFiltro = els.filterCategoria.value;
    els.filterCategoria.innerHTML = '<option value="">Todas las categorías</option>';
    els.prodCategoria.innerHTML = '<option value="">Sin categoría</option>';
    els.catPadre.innerHTML = '<option value="">Ninguna (Categoría principal)</option>';

    for (const cat of state.categorias) {
        const etiqueta = cat.padre_nombre ? `${cat.padre_nombre} > ${cat.nombre}` : cat.nombre;

        const optFiltro = document.createElement('option');
        optFiltro.value = cat.id;
        optFiltro.textContent = etiqueta;
        els.filterCategoria.appendChild(optFiltro);

        const optProd = document.createElement('option');
        optProd.value = cat.id;
        optProd.textContent = etiqueta;
        els.prodCategoria.appendChild(optProd);

        const optPadre = document.createElement('option');
        optPadre.value = cat.id;
        optPadre.textContent = etiqueta;
        els.catPadre.appendChild(optPadre);
    }

    els.filterCategoria.value = valorActualFiltro;
}

function renderProductos() {
    const busqueda = state.filtroBusqueda.toLowerCase();
    const filtrados = state.productos.filter(p => {
        if (busqueda && !String(p.nombre || '').toLowerCase().includes(busqueda)) {
            return false;
        }
        if (state.filtroCategoriaId && p.categoria_id !== state.filtroCategoriaId) {
            return false;
        }
        if (state.filtroBajoStock && Number(p.stock) > Number(p.stock_minimo)) {
            return false;
        }
        return true;
    });

    els.productosCountLabel.textContent = `${filtrados.length} de ${state.productos.length} producto(s)`;
    els.listaProductos.innerHTML = '';

    if (filtrados.length === 0) {
        els.listaProductos.innerHTML = '<div class="card empty-state">No se encontraron productos con este filtro.</div>';
        return;
    }

    for (const p of filtrados) {
        const stock = Number(p.stock || 0);
        const reservado = Number(p.stock_reservado || 0);
        const min = Number(p.stock_minimo ?? 5);
        const esBajo = stock <= min;

        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
            <div class="product-top">
                <div>
                    <div class="product-title"></div>
                    <div class="product-meta"></div>
                </div>
                <div class="product-price">${formatoMoneda.format(Number(p.precio || 0))}</div>
            </div>
            <div class="product-bottom">
                <span class="stock-pill ${esBajo ? 'low' : ''}">
                    Stock: ${stock}${reservado > 0 ? ` (Res: ${reservado})` : ''} · Mín: ${min}
                </span>
                <div class="item-actions">
                    <button type="button" class="btn-action supply" data-action="abastecer">+ Stock</button>
                    <button type="button" class="btn-action" data-action="editar">Editar</button>
                </div>
            </div>
        `;

        item.querySelector('.product-title').textContent = p.nombre;
        item.querySelector('.product-meta').textContent = p.categoria_nombre || 'Sin categoría';

        item.querySelector('[data-action="abastecer"]').addEventListener('click', () => abrirModalAbastecer(p));
        item.querySelector('[data-action="editar"]').addEventListener('click', () => abrirModalProducto(p));

        els.listaProductos.appendChild(item);
    }
}

function renderCategorias() {
    els.listaCategorias.innerHTML = '';
    if (state.categorias.length === 0) {
        els.listaCategorias.innerHTML = '<div class="card empty-state">No hay categorías registradas.</div>';
        return;
    }

    for (const c of state.categorias) {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
            <div class="product-top">
                <div>
                    <div class="product-title"></div>
                    <div class="product-meta"></div>
                </div>
                <button type="button" class="btn-action">Editar</button>
            </div>
        `;
        item.querySelector('.product-title').textContent = c.nombre;
        item.querySelector('.product-meta').textContent = c.padre_nombre ? `Subcategoría de: ${c.padre_nombre}` : 'Categoría principal';
        item.querySelector('button').addEventListener('click', () => abrirModalCategoria(c));
        els.listaCategorias.appendChild(item);
    }
}

async function cargarCatalogo() {
    if (!state.usuario) return;
    const qs = encodeURIComponent(state.sucursalActivaId || '');
    const { status, data } = await apiFetch(`/api/catalogo?sucursalId=${qs}`);
    if (status === 200 && data.ok) {
        state.productos = data.productos || [];
        state.categorias = data.categorias || [];
        poblarSelectoresCategorias();
        renderProductos();
        renderCategorias();
    }
}

function abrirModalProducto(prod = null) {
    els.prodError.classList.add('hidden');
    if (prod) {
        els.modalProductoTitulo.textContent = 'Editar Producto';
        els.prodId.value = prod.id;
        els.prodNombre.value = prod.nombre || '';
        els.prodPrecio.value = Number(prod.precio || 0);
        els.prodStock.value = Number(prod.stock || 0);
        els.prodCategoria.value = prod.categoria_id || '';
        els.prodStockMinimo.value = Number(prod.stock_minimo ?? 5);
        els.prodDescripcion.value = prod.descripcion || '';
        els.btnEliminarProducto.classList.remove('hidden');
    } else {
        els.modalProductoTitulo.textContent = 'Nuevo Producto';
        els.prodId.value = '';
        els.prodNombre.value = '';
        els.prodPrecio.value = '';
        els.prodStock.value = '0';
        els.prodCategoria.value = state.filtroCategoriaId || '';
        els.prodStockMinimo.value = '5';
        els.prodDescripcion.value = '';
        els.btnEliminarProducto.classList.add('hidden');
    }
    els.modalProducto.classList.remove('hidden');
}

function abrirModalAbastecer(prod) {
    els.abastError.classList.add('hidden');
    els.abastProdId.value = prod.id;
    els.abastProdNombre.textContent = `${prod.nombre} (Stock actual: ${prod.stock || 0})`;
    els.abastCantidad.value = '';
    els.modalAbastecer.classList.remove('hidden');
    setTimeout(() => els.abastCantidad.focus(), 60);
}

function abrirModalCategoria(cat = null) {
    els.catError.classList.add('hidden');
    if (cat) {
        els.modalCategoriaTitulo.textContent = 'Editar Categoría';
        els.catId.value = cat.id;
        els.catNombre.value = cat.nombre || '';
        els.catPadre.value = cat.categoria_padre_id || '';
        els.btnEliminarCategoria.classList.remove('hidden');
    } else {
        els.modalCategoriaTitulo.textContent = 'Nueva Categoría';
        els.catId.value = '';
        els.catNombre.value = '';
        els.catPadre.value = '';
        els.btnEliminarCategoria.classList.add('hidden');
    }
    els.modalCategoria.classList.remove('hidden');
}

async function restaurarSesion() {
    if (!state.token) {
        els.viewApp.classList.add('hidden');
        els.btnLogout.classList.add('hidden');
        if (els.btnVerAuditoria) {
            els.btnVerAuditoria.classList.add('hidden');
        }
        els.viewLogin.classList.remove('hidden');
        return;
    }

    const { status, data } = await apiFetch('/api/auth/session');
    if (status === 200 && data.ok) {
        state.usuario = data.usuario;
        state.sucursales = data.sucursales || [];
        els.userDisplayName.textContent = state.usuario.username;
        els.userDisplayRole.textContent = state.usuario.rol;
        els.infoPlantTime.textContent = data.horaPlanta || '-';
        renderSucursales();

        const esAdmin = state.usuario.rol === 'Administrador';
        if (els.btnVerAuditoria) {
            els.btnVerAuditoria.classList.toggle('hidden', !esAdmin);
        }

        els.viewLogin.classList.add('hidden');
        els.viewApp.classList.remove('hidden');
        els.btnLogout.classList.remove('hidden');
        await cargarCatalogo();
        await cargarReporteDiario();
    } else {
        els.viewApp.classList.add('hidden');
        els.btnLogout.classList.add('hidden');
        if (els.btnVerAuditoria) {
            els.btnVerAuditoria.classList.add('hidden');
        }
        els.viewLogin.classList.remove('hidden');
    }
}

els.formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.loginError.classList.add('hidden');
    const username = els.loginUsername.value.trim();
    const password = els.loginPassword.value;

    const { status, data } = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });

    if (status === 200 && data.ok) {
        state.token = data.token;
        localStorage.setItem('pos_mobile_token', data.token);
        els.loginPassword.value = '';
        await restaurarSesion();
    } else {
        els.loginError.textContent = data.error || 'No se pudo iniciar sesión.';
        els.loginError.classList.remove('hidden');
    }
});

els.btnLogout.addEventListener('click', async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    state.token = null;
    state.usuario = null;
    localStorage.removeItem('pos_mobile_token');
    await restaurarSesion();
});

els.selectSucursal.addEventListener('change', async (e) => {
    state.sucursalActivaId = e.target.value;
    localStorage.setItem('pos_mobile_sucursal_id', state.sucursalActivaId);
    await cargarCatalogo();
    await cargarReporteDiario();
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        state.tabActiva = tab;
        els.tabReporte.classList.toggle('hidden', tab !== 'reporte');
        els.tabProductos.classList.toggle('hidden', tab !== 'productos');
        els.tabCategorias.classList.toggle('hidden', tab !== 'categorias');
        if (els.tabAdmin) {
            els.tabAdmin.classList.toggle('hidden', tab !== 'admin');
        }
        if (tab === 'reporte' && !state.reporte) {
            cargarReporteDiario();
        }
        if (tab === 'admin') {
            if (state.subtabAdmin === 'turnos') cargarTurnosAdmin();
            else if (state.subtabAdmin === 'sol-ventas') cargarSolicitudesVentasAdmin();
            else if (state.subtabAdmin === 'sol-gastos') cargarSolicitudesGastosAdmin();
        }
    });
});

els.searchProducto.addEventListener('input', (e) => {
    state.filtroBusqueda = e.target.value;
    renderProductos();
});

els.filterCategoria.addEventListener('change', (e) => {
    state.filtroCategoriaId = e.target.value;
    renderProductos();
});

els.btnFilterBajoStock.addEventListener('click', () => {
    state.filtroBajoStock = !state.filtroBajoStock;
    els.btnFilterBajoStock.classList.toggle('active', state.filtroBajoStock);
    renderProductos();
});

if (els.btnRefreshCatalogo) {
    els.btnRefreshCatalogo.addEventListener('click', async () => {
        const btn = els.btnRefreshCatalogo;
        btn.disabled = true;
        const txtOriginal = btn.textContent;
        btn.textContent = 'Actualizando...';
        try {
            await verificarSaludServidor();
            await cargarCatalogo();
            mostrarToast('Catálogo actualizado');
        } catch (_) {
            mostrarToast('Error al actualizar catálogo');
        } finally {
            btn.disabled = false;
            btn.textContent = txtOriginal;
        }
    });
}

els.btnNuevoProducto.addEventListener('click', () => abrirModalProducto(null));
els.btnCerrarModalProducto.addEventListener('click', () => els.modalProducto.classList.add('hidden'));

els.formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.prodError.classList.add('hidden');
    const id = els.prodId.value;
    const payload = {
        nombre: els.prodNombre.value.trim(),
        precio: Number(els.prodPrecio.value),
        stock: Number(els.prodStock.value),
        stockMinimo: Number(els.prodStockMinimo.value),
        categoriaId: els.prodCategoria.value || null,
        descripcion: els.prodDescripcion.value.trim(),
        sucursalId: state.sucursalActivaId
    };

    const url = id ? `/api/productos/${encodeURIComponent(id)}` : '/api/productos';
    const method = id ? 'PUT' : 'POST';

    const { status, data } = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
    });

    if ((status === 200 || status === 201) && data.ok) {
        els.modalProducto.classList.add('hidden');
        await cargarCatalogo();
        mostrarToast(data.message || 'Guardado');
    } else {
        els.prodError.textContent = data.error || 'Error al guardar producto.';
        els.prodError.classList.remove('hidden');
    }
});

els.btnEliminarProducto.addEventListener('click', async () => {
    const id = els.prodId.value;
    if (!id || !confirm('¿Eliminar este producto del catálogo sincronizado?')) return;

    const { status, data } = await apiFetch(
        `/api/productos/${encodeURIComponent(id)}?sucursalId=${encodeURIComponent(state.sucursalActivaId)}`,
        { method: 'DELETE' }
    );

    if (status === 200 && data.ok) {
        els.modalProducto.classList.add('hidden');
        await cargarCatalogo();
        mostrarToast('Producto eliminado');
    } else {
        els.prodError.textContent = data.error || 'No se pudo eliminar.';
        els.prodError.classList.remove('hidden');
    }
});

els.btnCerrarModalAbastecer.addEventListener('click', () => els.modalAbastecer.classList.add('hidden'));

document.querySelectorAll('.quick-add').forEach(btn => {
    btn.addEventListener('click', () => {
        const actual = Number(els.abastCantidad.value || 0);
        els.abastCantidad.value = actual + Number(btn.dataset.add);
    });
});

els.formAbastecer.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.abastError.classList.add('hidden');
    const id = els.abastProdId.value;
    const cantidad = Number(els.abastCantidad.value);

    const { status, data } = await apiFetch(`/api/productos/${encodeURIComponent(id)}/abastecer`, {
        method: 'POST',
        body: JSON.stringify({
            sucursalId: state.sucursalActivaId,
            cantidad
        })
    });

    if (status === 200 && data.ok) {
        els.modalAbastecer.classList.add('hidden');
        await cargarCatalogo();
        mostrarToast(data.message || 'Stock abastecido');
    } else {
        els.abastError.textContent = data.error || 'Error al abastecer stock.';
        els.abastError.classList.remove('hidden');
    }
});

els.btnNuevaCategoria.addEventListener('click', () => abrirModalCategoria(null));
els.btnCerrarModalCategoria.addEventListener('click', () => els.modalCategoria.classList.add('hidden'));

els.formCategoria.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.catError.classList.add('hidden');
    const id = els.catId.value;
    const payload = {
        nombre: els.catNombre.value.trim(),
        categoriaPadreId: els.catPadre.value || null
    };

    const url = id ? `/api/categorias/${encodeURIComponent(id)}` : '/api/categorias';
    const method = id ? 'PUT' : 'POST';

    const { status, data } = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
    });

    if ((status === 200 || status === 201) && data.ok) {
        els.modalCategoria.classList.add('hidden');
        await cargarCatalogo();
        mostrarToast(data.message || 'Categoría guardada');
    } else {
        els.catError.textContent = data.error || 'Error al guardar categoría.';
        els.catError.classList.remove('hidden');
    }
});

els.btnEliminarCategoria.addEventListener('click', async () => {
    const id = els.catId.value;
    if (!id || !confirm('¿Eliminar esta categoría?')) return;

    const { status, data } = await apiFetch(`/api/categorias/${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });

    if (status === 200 && data.ok) {
        els.modalCategoria.classList.add('hidden');
        await cargarCatalogo();
        mostrarToast('Categoría eliminada');
    } else {
        els.catError.textContent = data.error || 'No se pudo eliminar la categoría.';
        els.catError.classList.remove('hidden');
    }
});

// ==========================================
// REPORTE DIARIO: LOGICA Y CONTROLADORES
// ==========================================

function formatearHoraVenta(fechaStr) {
    if (!fechaStr) return '';
    try {
        const d = new Date(fechaStr);
        if (!isNaN(d.getTime())) {
            return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
    } catch (_) {}
    return String(fechaStr).substring(11, 16);
}

function obtenerFechaAyerString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(d);
}

async function cargarReporteDiario() {
    if (!state.usuario || !state.sucursalActivaId) return false;
    if (els.reporteFecha && els.reporteFecha.value) {
        state.fechaReporte = els.reporteFecha.value;
    } else if (els.reporteFecha) {
        els.reporteFecha.value = state.fechaReporte;
    }

    const qs = `sucursalId=${encodeURIComponent(state.sucursalActivaId)}&fecha=${encodeURIComponent(state.fechaReporte)}`;
    const { status, data } = await apiFetch(`/api/reporte-diario?${qs}`);
    if (status === 200 && data.ok) {
        state.reporte = data;
        renderReporteDiario();
        return true;
    }
    return false;
}

function renderReporteDiario() {
    if (!state.reporte) return;
    const { resumen, ventas, gastos } = state.reporte;

    const cajaNeta = resumen.cajaNeta !== undefined
        ? resumen.cajaNeta
        : ((resumen.totalIngresosRecibidos || 0) - (resumen.totalGastosCaja || 0));

    if (els.resCajaNeta) {
        els.resCajaNeta.textContent = formatoMoneda.format(cajaNeta);
        els.resCajaNeta.style.color = cajaNeta >= 0 ? '#38bdf8' : '#ef4444';
    }
    if (els.resDesgloseCajaNeta) {
        els.resDesgloseCajaNeta.textContent = `Ingresos: ${formatoMoneda.format(resumen.totalIngresosRecibidos || 0)} - Gastos: ${formatoMoneda.format(resumen.totalGastosCaja || 0)}`;
    }

    if (els.resEfectivoCaja) {
        els.resEfectivoCaja.textContent = formatoMoneda.format(resumen.efectivoEnCaja || 0);
        els.resEfectivoCaja.style.color = (resumen.efectivoEnCaja || 0) >= 0 ? '#10b981' : '#ef4444';
    }
    if (els.resDesgloseEfectivo) {
        els.resDesgloseEfectivo.textContent = `Ventas Ef: ${formatoMoneda.format(resumen.ventasEfectivo || 0)} - Gastos Ef: ${formatoMoneda.format(resumen.gastosEfectivo || 0)}`;
    }

    if (els.resVentasEfectivo) {
        els.resVentasEfectivo.textContent = formatoMoneda.format(resumen.ventasEfectivo || 0);
    }
    if (els.resVentasTransferencia) {
        els.resVentasTransferencia.textContent = formatoMoneda.format(resumen.ventasTransferencia || 0);
    }
    if (els.resTotalGastos) {
        els.resTotalGastos.textContent = formatoMoneda.format(resumen.totalGastosCaja || 0);
    }
    if (els.resVentasCredito) {
        els.resVentasCredito.textContent = formatoMoneda.format(resumen.ventasCredito || 0);
    }

    els.countVentas.textContent = ventas ? ventas.length : 0;
    els.countGastos.textContent = gastos ? gastos.length : 0;

    renderVentas();
    renderGastos();
}

function renderVentas() {
    const ventas = (state.reporte && state.reporte.ventas) || [];
    els.listaVentas.innerHTML = '';

    if (ventas.length === 0) {
        els.countVentas.textContent = 0;
        els.listaVentas.innerHTML = '<div class="card empty-state">No se registraron ventas en esta fecha.</div>';
        return;
    }

    const termino = normalizarTextoBusqueda(state.filtroBusquedaVentas).replace(/\s+/g, ' ');
    const terminoNumerico = termino.replace(/[$.\s]/g, '');

    const filtradas = !termino ? ventas : ventas.filter(v => {
        const hora = formatearHoraVenta(v.fecha).replace(/\s+/g, ' ');
        const horaCompacta = hora.replace(/[.\s]/g, '');
        const totalNum = String(Number(v.total || 0));
        const subtotalNum = String(Number(v.subtotal_productos || v.total || 0));
        const domNum = String(Number(v.valor_domicilio || 0));
        const totalFmt = formatoMoneda.format(Number(v.total || 0)).replace(/\s+/g, ' ');
        const subtotalFmt = formatoMoneda.format(Number(v.subtotal_productos || v.total || 0)).replace(/\s+/g, ' ');

        const textoIndexado = normalizarTextoBusqueda(
            `${v.productos_vendidos || ''} ${v.cliente_nombre || ''} ${hora} ${horaCompacta} ${v.fecha || ''} ${v.metodo_pago || 'Efectivo'} ${totalFmt} ${subtotalFmt} ${totalNum} ${subtotalNum} ${domNum}`
        ).replace(/\s+/g, ' ');

        if (textoIndexado.includes(termino)) return true;
        if (terminoNumerico && (totalNum.includes(terminoNumerico) || subtotalNum.includes(terminoNumerico))) return true;
        return false;
    });

    els.countVentas.textContent = filtradas.length;

    if (filtradas.length === 0) {
        els.listaVentas.innerHTML = '<div class="card empty-state">No se encontraron ventas con este filtro.</div>';
        return;
    }

    for (const v of filtradas) {
        const item = document.createElement('div');
        item.className = 'product-item';

        const esPedido = Number(v.es_pedido) === 1;
        const hora = formatearHoraVenta(v.fecha);
        const dom = Number(v.valor_domicilio || 0);

        item.innerHTML = `
            <div class="product-top">
                <div>
                    <div class="product-title">
                        <span>${hora}</span>
                        ${v.cliente_nombre ? `<span class="badge-subtle">${v.cliente_nombre}</span>` : ''}
                        ${esPedido ? `<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">Pedido</span>` : ''}
                    </div>
                    <div class="product-meta">${v.productos_vendidos || 'Sin detalle de productos'}</div>
                </div>
                <div style="text-align: right;">
                    <div class="product-price">${formatoMoneda.format(Number(v.total || 0))}</div>
                    <small class="clock-text">${v.metodo_pago || 'Efectivo'}</small>
                </div>
            </div>
            <div class="product-bottom">
                <span class="stock-pill" style="background: rgba(245, 158, 11, 0.12); color: var(--primary);">
                    ${dom > 0 ? `Incluye Domicilio: ${formatoMoneda.format(dom)}` : `Productos: ${formatoMoneda.format(v.subtotal_productos || v.total)}`}
                </span>
                <div class="item-actions">
                    <button type="button" class="btn-action" data-action="editar-venta">Editar</button>
                </div>
            </div>
        `;

        item.querySelector('[data-action="editar-venta"]').addEventListener('click', () => abrirModalEditarVenta(v.id));
        els.listaVentas.appendChild(item);
    }
}

function renderGastos() {
    const gastos = (state.reporte && state.reporte.gastos) || [];
    els.listaGastos.innerHTML = '';

    if (gastos.length === 0) {
        els.listaGastos.innerHTML = '<div class="card empty-state">No se registraron gastos en esta fecha.</div>';
        return;
    }

    for (const g of gastos) {
        const item = document.createElement('div');
        item.className = 'product-item';

        const hora = formatearHoraVenta(g.fecha);
        const esDomicilioAuto = g.descripcion === 'Domicilio (Descuento de Caja)';

        item.innerHTML = `
            <div class="product-top">
                <div>
                    <div class="product-title">
                        <span>${g.descripcion}</span>
                        <span class="badge-subtle">${g.tipo}</span>
                    </div>
                    <div class="product-meta">${hora ? `${hora} · ` : ''}Pago: ${g.metodo_pago || 'Efectivo'}</div>
                </div>
                <div class="product-price" style="color: #fca5a5;">${formatoMoneda.format(Number(g.monto || 0))}</div>
            </div>
            <div class="product-bottom">
                <span class="clock-text">${esDomicilioAuto ? 'Automático por venta' : (g.estado || 'Confirmado')}</span>
                <div class="item-actions">
                    ${esDomicilioAuto ? '' : `<button type="button" class="btn-action" data-action="editar-gasto">Editar</button>`}
                </div>
            </div>
        `;

        if (!esDomicilioAuto) {
            item.querySelector('[data-action="editar-gasto"]').addEventListener('click', () => abrirModalGasto(g));
        }

        els.listaGastos.appendChild(item);
    }
}

// ------------------------------------------
// MODAL EDICION DE VENTA
// ------------------------------------------

function normalizarTextoBusqueda(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function limpiarBuscadorProductoVenta() {
    state.productoSeleccionadoVenta = null;
    if (els.editVentaAddProdSearch) els.editVentaAddProdSearch.value = '';
    if (els.btnClearProdSearch) els.btnClearProdSearch.classList.add('hidden');
    if (els.editVentaProdDropdown) els.editVentaProdDropdown.classList.add('hidden');
}

function seleccionarProductoParaVenta(prod) {
    state.productoSeleccionadoVenta = prod;
    if (els.editVentaAddProdSearch) {
        els.editVentaAddProdSearch.value = `${prod.nombre} (${formatoMoneda.format(Number(prod.precio || 0))})`;
    }
    if (els.btnClearProdSearch) els.btnClearProdSearch.classList.remove('hidden');
    if (els.editVentaProdDropdown) els.editVentaProdDropdown.classList.add('hidden');
}

function renderDropdownProductosVenta(terminoRaw = '') {
    if (!els.editVentaProdDropdown) return;
    const termino = normalizarTextoBusqueda(terminoRaw);
    const coincidencias = state.productos.filter(p => {
        if (!termino) return true;
        return normalizarTextoBusqueda(p.nombre).includes(termino);
    });

    els.editVentaProdDropdown.innerHTML = '';

    if (coincidencias.length === 0) {
        els.editVentaProdDropdown.innerHTML = '<div class="combobox-empty">No se encontraron productos</div>';
        return;
    }

    for (const p of coincidencias) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'combobox-option';
        btn.innerHTML = `
            <span class="combobox-option-name"></span>
            <span class="combobox-option-price">${formatoMoneda.format(Number(p.precio || 0))}</span>
        `;
        btn.querySelector('.combobox-option-name').textContent = p.nombre;
        btn.addEventListener('click', () => seleccionarProductoParaVenta(p));
        els.editVentaProdDropdown.appendChild(btn);
    }
}

function poblarSelectProductosEnVenta() {
    limpiarBuscadorProductoVenta();
    renderDropdownProductosVenta('');
}

function renderEditingVentaItems() {
    els.editVentaItemsList.innerHTML = '';

    state.editingVentaItems.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'edit-item-row';
        row.innerHTML = `
            <div class="item-info">
                <strong>${item.nombre}</strong>
                <small class="clock-text" style="display: block;">${formatoMoneda.format(item.precio)} c/u</small>
            </div>
            <div class="item-qty-controls">
                <button type="button" class="btn-qty" data-op="dec">-</button>
                <span style="font-weight: 800; min-width: 22px; text-align: center;">${item.cantidad}</span>
                <button type="button" class="btn-qty" data-op="inc">+</button>
                <button type="button" class="btn-remove-item" title="Quitar">&times;</button>
            </div>
        `;

        row.querySelector('[data-op="dec"]').addEventListener('click', () => {
            if (item.cantidad > 1) {
                item.cantidad -= 1;
                renderEditingVentaItems();
                recalcularTotalVentaModal();
            }
        });

        row.querySelector('[data-op="inc"]').addEventListener('click', () => {
            item.cantidad += 1;
            renderEditingVentaItems();
            recalcularTotalVentaModal();
        });

        row.querySelector('.btn-remove-item').addEventListener('click', () => {
            if (state.editingVentaItems.length <= 1) {
                alert('La venta debe conservar al menos un producto. Si deseas cancelarla por completo, presiona "Anular Venta".');
                return;
            }
            state.editingVentaItems.splice(index, 1);
            renderEditingVentaItems();
            recalcularTotalVentaModal();
        });

        els.editVentaItemsList.appendChild(row);
    });
}

function calcularTotalVentaModal() {
    const subtotal = state.editingVentaItems.reduce((acc, it) => acc + (it.cantidad * it.precio), 0);
    const dom = Number(els.editVentaDomicilio.value || 0);
    return subtotal + dom;
}

function recalcularTotalVentaModal() {
    const total = calcularTotalVentaModal();
    els.editVentaTotalCalc.textContent = formatoMoneda.format(total);

    if (els.editVentaMetodoPago.value === 'Mixto') {
        const tieneEfectivo = els.editVentaEfectivo.value !== '';
        const tieneTransferencia = els.editVentaTransferencia.value !== '';
        if (!tieneEfectivo && !tieneTransferencia) return;

        if (state.ultimoCampoMixtoEditado === 'transferencia' || (!tieneEfectivo && tieneTransferencia)) {
            const tr = Number(els.editVentaTransferencia.value || 0);
            if (tr <= total) {
                els.editVentaEfectivo.value = Math.max(0, total - tr);
            }
        } else {
            const ef = Number(els.editVentaEfectivo.value || 0);
            if (ef <= total) {
                els.editVentaTransferencia.value = Math.max(0, total - ef);
            }
        }
    }
}

async function abrirModalEditarVenta(ventaId) {
    els.editVentaError.classList.add('hidden');
    state.ultimoCampoMixtoEditado = 'efectivo';
    poblarSelectProductosEnVenta();

    const { status, data } = await apiFetch(`/api/ventas/${encodeURIComponent(ventaId)}`);
    if (status !== 200 || !data.ok) {
        mostrarToast('Error al cargar detalle de venta');
        return;
    }

    const { venta, detalle, valorDomicilio } = data;
    state.editingVenta = venta;
    els.editVentaId.value = venta.id;
    els.editVentaHora.textContent = `Hora: ${formatearHoraVenta(venta.fecha)}`;
    els.editVentaCliente.textContent = venta.cliente_id ? 'Venta con Cliente' : 'Consumidor Final';
    els.editVentaDomicilio.value = valorDomicilio || 0;

    let metodo = venta.metodo_pago || 'Efectivo';
    if (metodo.startsWith('Mixto')) {
        els.editVentaMetodoPago.value = 'Mixto';
        els.wrapperMixto.classList.remove('hidden');
        const matchEf = metodo.match(/Efectivo:\s*(\d+(?:\.\d+)?)/i);
        const matchTr = metodo.match(/Transferencia:\s*(\d+(?:\.\d+)?)/i);
        els.editVentaEfectivo.value = matchEf ? Number(matchEf[1]) : 0;
        els.editVentaTransferencia.value = matchTr ? Number(matchTr[1]) : 0;
    } else {
        els.editVentaMetodoPago.value = ['Transferencia', 'Crédito'].includes(metodo) ? metodo : 'Efectivo';
        els.wrapperMixto.classList.add('hidden');
        els.editVentaEfectivo.value = '';
        els.editVentaTransferencia.value = '';
    }

    state.editingVentaItems = (detalle || []).map(d => ({
        id: d.producto_id,
        nombre: d.nombre,
        cantidad: Number(d.cantidad || 1),
        precio: Number(d.precio_unitario || 0)
    }));

    renderEditingVentaItems();
    recalcularTotalVentaModal();
    els.modalEditarVenta.classList.remove('hidden');
}

els.btnCerrarModalVenta.addEventListener('click', () => els.modalEditarVenta.classList.add('hidden'));

els.editVentaMetodoPago.addEventListener('change', (e) => {
    const esMixto = e.target.value === 'Mixto';
    els.wrapperMixto.classList.toggle('hidden', !esMixto);
    recalcularTotalVentaModal();
});

els.editVentaDomicilio.addEventListener('input', recalcularTotalVentaModal);

els.editVentaEfectivo.addEventListener('input', () => {
    state.ultimoCampoMixtoEditado = 'efectivo';
    const total = calcularTotalVentaModal();
    const ef = Number(els.editVentaEfectivo.value || 0);
    els.editVentaTransferencia.value = Math.max(0, total - ef);
});

els.editVentaTransferencia.addEventListener('input', () => {
    state.ultimoCampoMixtoEditado = 'transferencia';
    const total = calcularTotalVentaModal();
    const tr = Number(els.editVentaTransferencia.value || 0);
    els.editVentaEfectivo.value = Math.max(0, total - tr);
});

function resolverProductoSeleccionadoOEscrito() {
    if (state.productoSeleccionadoVenta) return state.productoSeleccionadoVenta;
    const termino = normalizarTextoBusqueda(els.editVentaAddProdSearch ? els.editVentaAddProdSearch.value : '');
    if (!termino) return null;
    const exacto = state.productos.find(p => normalizarTextoBusqueda(p.nombre) === termino);
    if (exacto) return exacto;
    const filtrados = state.productos.filter(p => normalizarTextoBusqueda(p.nombre).includes(termino));
    return filtrados.length === 1 ? filtrados[0] : null;
}

if (els.editVentaAddProdSearch) {
    els.editVentaAddProdSearch.addEventListener('focus', () => {
        const filtro = state.productoSeleccionadoVenta ? '' : els.editVentaAddProdSearch.value;
        renderDropdownProductosVenta(filtro);
        els.editVentaProdDropdown.classList.remove('hidden');
    });

    els.editVentaAddProdSearch.addEventListener('input', (e) => {
        state.productoSeleccionadoVenta = null;
        const val = e.target.value;
        els.btnClearProdSearch.classList.toggle('hidden', !val);
        renderDropdownProductosVenta(val);
        els.editVentaProdDropdown.classList.remove('hidden');
    });

    els.editVentaAddProdSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const prod = resolverProductoSeleccionadoOEscrito();
            if (prod) {
                seleccionarProductoParaVenta(prod);
                els.btnEditVentaAddItem.click();
            }
        }
    });
}

if (els.btnClearProdSearch) {
    els.btnClearProdSearch.addEventListener('click', () => {
        limpiarBuscadorProductoVenta();
        renderDropdownProductosVenta('');
        els.editVentaProdDropdown.classList.remove('hidden');
        els.editVentaAddProdSearch.focus();
    });
}

document.addEventListener('click', (e) => {
    if (els.editVentaProdCombobox && !els.editVentaProdCombobox.contains(e.target)) {
        els.editVentaProdDropdown.classList.add('hidden');
    }
});

els.btnEditVentaAddItem.addEventListener('click', () => {
    const prod = resolverProductoSeleccionadoOEscrito();
    const cant = Number(els.editVentaAddCant.value || 1);
    if (!prod) {
        mostrarToast('Selecciona un producto de la lista');
        if (els.editVentaAddProdSearch) els.editVentaAddProdSearch.focus();
        return;
    }

    const prodId = prod.id;
    const nombre = prod.nombre || 'Producto';
    const precio = Number(prod.precio || 0);

    const existente = state.editingVentaItems.find(it => it.id === prodId);
    if (existente) {
        existente.cantidad += cant;
    } else {
        state.editingVentaItems.push({ id: prodId, nombre, cantidad: cant, precio });
    }

    els.editVentaAddCant.value = '1';
    limpiarBuscadorProductoVenta();
    renderEditingVentaItems();
    recalcularTotalVentaModal();
});

els.formEditarVenta.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.editVentaError.classList.add('hidden');
    const ventaId = els.editVentaId.value;

    const payload = {
        carrito: state.editingVentaItems,
        valorDomicilio: Number(els.editVentaDomicilio.value || 0),
        metodoPago: els.editVentaMetodoPago.value,
        efectivoMixto: Number(els.editVentaEfectivo.value || 0),
        transferenciaMixto: Number(els.editVentaTransferencia.value || 0)
    };

    const { status, data } = await apiFetch(`/api/ventas/${encodeURIComponent(ventaId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });

    if (status === 200 && data.ok) {
        els.modalEditarVenta.classList.add('hidden');
        await cargarReporteDiario();
        await cargarCatalogo();
        mostrarToast(data.message || 'Venta actualizada');
    } else {
        els.editVentaError.textContent = data.error || 'Error al modificar venta.';
        els.editVentaError.classList.remove('hidden');
    }
});

els.btnAnularVenta.addEventListener('click', async () => {
    const ventaId = els.editVentaId.value;
    if (!ventaId || !confirm('¿Anular esta venta? El stock de los productos será devuelto inmediatamente al inventario.')) return;

    const { status, data } = await apiFetch(`/api/ventas/${encodeURIComponent(ventaId)}`, {
        method: 'DELETE'
    });

    if (status === 200 && data.ok) {
        els.modalEditarVenta.classList.add('hidden');
        await cargarReporteDiario();
        await cargarCatalogo();
        mostrarToast('Venta anulada y stock devuelto');
    } else {
        els.editVentaError.textContent = data.error || 'No se pudo anular la venta.';
        els.editVentaError.classList.remove('hidden');
    }
});

// ------------------------------------------
// MODAL REGISTRO / EDICION DE GASTOS
// ------------------------------------------

function abrirModalGasto(gasto = null) {
    els.gastoError.classList.add('hidden');
    if (gasto) {
        els.modalGastoTitulo.textContent = 'Editar Gasto';
        els.gastoId.value = gasto.id;
        els.gastoTipo.value = gasto.tipo || 'Operativo';
        els.gastoDescripcion.value = gasto.descripcion || '';
        els.gastoMonto.value = Number(gasto.monto || 0);
        els.gastoMetodoPago.value = gasto.metodo_pago || 'Efectivo';
        els.btnEliminarGasto.classList.remove('hidden');
    } else {
        els.modalGastoTitulo.textContent = 'Registrar Gasto';
        els.gastoId.value = '';
        els.gastoTipo.value = 'Operativo';
        els.gastoDescripcion.value = '';
        els.gastoMonto.value = '';
        els.gastoMetodoPago.value = 'Efectivo';
        els.btnEliminarGasto.classList.add('hidden');
    }
    els.modalGasto.classList.remove('hidden');
}

els.btnNuevoGasto.addEventListener('click', () => abrirModalGasto(null));
els.btnCerrarModalGasto.addEventListener('click', () => els.modalGasto.classList.add('hidden'));

els.formGasto.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.gastoError.classList.add('hidden');
    const id = els.gastoId.value;
    const payload = {
        sucursalId: state.sucursalActivaId,
        fecha: state.fechaReporte,
        tipo: els.gastoTipo.value,
        descripcion: els.gastoDescripcion.value.trim(),
        monto: Number(els.gastoMonto.value),
        metodoPago: els.gastoMetodoPago.value
    };

    const url = id ? `/api/gastos/${encodeURIComponent(id)}` : '/api/gastos';
    const method = id ? 'PUT' : 'POST';

    const { status, data } = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
    });

    if ((status === 200 || status === 201) && data.ok) {
        els.modalGasto.classList.add('hidden');
        await cargarReporteDiario();
        mostrarToast(data.message || 'Gasto guardado');
    } else {
        els.gastoError.textContent = data.error || 'Error al guardar gasto.';
        els.gastoError.classList.remove('hidden');
    }
});

els.btnEliminarGasto.addEventListener('click', async () => {
    const id = els.gastoId.value;
    if (!id || !confirm('¿Eliminar este registro de gasto?')) return;

    const { status, data } = await apiFetch(`/api/gastos/${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });

    if (status === 200 && data.ok) {
        els.modalGasto.classList.add('hidden');
        await cargarReporteDiario();
        mostrarToast('Gasto eliminado');
    } else {
        els.gastoError.textContent = data.error || 'No se pudo eliminar el gasto.';
        els.gastoError.classList.remove('hidden');
    }
});

// ------------------------------------------
// CONTROLES DE FECHA Y SUBTABS DE REPORTE
// ------------------------------------------

els.reporteFecha.addEventListener('change', async (e) => {
    state.fechaReporte = e.target.value;
    await cargarReporteDiario();
});

els.btnFechaHoy.addEventListener('click', async () => {
    state.fechaReporte = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
    els.reporteFecha.value = state.fechaReporte;
    await cargarReporteDiario();
});

els.btnFechaAyer.addEventListener('click', async () => {
    state.fechaReporte = obtenerFechaAyerString();
    els.reporteFecha.value = state.fechaReporte;
    await cargarReporteDiario();
});

if (els.btnRefreshReporte) {
    els.btnRefreshReporte.addEventListener('click', async () => {
        const btn = els.btnRefreshReporte;
        btn.disabled = true;
        const txtOriginal = btn.textContent;
        btn.textContent = 'Actualizando...';
        try {
            await verificarSaludServidor();
            const ok = await cargarReporteDiario();
            if (ok) {
                mostrarToast('Reporte diario actualizado');
            } else {
                mostrarToast('No se pudo actualizar el reporte');
            }
        } catch (_) {
            mostrarToast('Error de conexión al actualizar');
        } finally {
            btn.disabled = false;
            btn.textContent = txtOriginal;
        }
    });
}

if (els.searchVentas) {
    els.searchVentas.addEventListener('input', (e) => {
        state.filtroBusquedaVentas = e.target.value;
        renderVentas();
    });
}

document.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const subtab = btn.dataset.subtab;
        state.subtabReporte = subtab;
        els.listaVentas.classList.toggle('hidden', subtab !== 'ventas');
        els.listaGastos.classList.toggle('hidden', subtab !== 'gastos');
        if (els.searchVentas) {
            els.searchVentas.classList.toggle('hidden', subtab !== 'ventas');
        }
        els.btnNuevoGasto.classList.toggle('hidden', subtab !== 'gastos');
    });
});

// ------------------------------------------
// MODAL LOGS DE AUDITORIA (SOLO ADMINISTRADOR)
// ------------------------------------------

let debounceBusquedaAuditoria = null;

function formatearFechaAuditoria(fechaStr) {
    if (!fechaStr) return '-';
    try {
        const d = new Date(fechaStr);
        if (!isNaN(d.getTime())) {
            return d.toLocaleString('es-CO', {
                timeZone: 'America/Bogota',
                dateStyle: 'short',
                timeStyle: 'medium'
            });
        }
    } catch (_) {}
    return String(fechaStr);
}

async function cargarAuditoriaWeb(busqueda = '') {
    if (!state.usuario || state.usuario.rol !== 'Administrador') return;
    els.listaAuditoria.innerHTML = '<div class="card empty-state">Cargando registros...</div>';

    const qs = busqueda ? `?busqueda=${encodeURIComponent(busqueda.trim())}` : '';
    const { status, data } = await apiFetch(`/api/auditoria${qs}`);

    if (status === 200 && data.ok) {
        renderAuditoriaWeb(data.logs || [], data.total || 0);
    } else {
        els.listaAuditoria.innerHTML = `<div class="card empty-state">${data.error || 'No se pudo cargar la auditoría.'}</div>`;
        els.auditoriaCountLabel.textContent = '0 registros';
    }
}

function renderAuditoriaWeb(logs, total) {
    els.auditoriaCountLabel.textContent = `${total} registro${total === 1 ? '' : 's'}`;
    els.listaAuditoria.innerHTML = '';

    if (!logs || logs.length === 0) {
        els.listaAuditoria.innerHTML = '<div class="card empty-state">No hay registros de auditoría disponibles.</div>';
        return;
    }

    for (const log of logs) {
        const item = document.createElement('div');
        item.className = 'audit-item';

        const fechaFormateada = formatearFechaAuditoria(log.fecha);
        const suc = log.sucursal_id || 'Sin Sucursal';
        const detalles = log.detalles || 'Sin detalles adicionales';

        item.innerHTML = `
            <div class="audit-top">
                <span class="audit-accion"></span>
                <span class="audit-fecha"></span>
            </div>
            <div class="audit-user-row">
                <strong class="audit-usuario"></strong>
                <span class="badge-subtle audit-rol"></span>
                <span class="badge-subtle audit-sucursal"></span>
            </div>
            <div class="audit-detalles"></div>
        `;

        item.querySelector('.audit-accion').textContent = log.accion || 'Operación';
        item.querySelector('.audit-fecha').textContent = fechaFormateada;
        item.querySelector('.audit-usuario').textContent = log.usuario || 'Sistema';
        item.querySelector('.audit-rol').textContent = log.rol || 'Sin Rol';
        item.querySelector('.audit-sucursal').textContent = suc;
        item.querySelector('.audit-detalles').textContent = detalles;

        els.listaAuditoria.appendChild(item);
    }
}

if (els.btnVerAuditoria) {
    els.btnVerAuditoria.addEventListener('click', () => {
        els.modalAuditoria.classList.remove('hidden');
        els.searchAuditoria.value = '';
        cargarAuditoriaWeb();
    });
}

if (els.btnCerrarModalAuditoria) {
    els.btnCerrarModalAuditoria.addEventListener('click', () => {
        els.modalAuditoria.classList.add('hidden');
    });
}

if (els.btnRefreshAuditoria) {
    els.btnRefreshAuditoria.addEventListener('click', () => {
        cargarAuditoriaWeb(els.searchAuditoria.value);
    });
}

if (els.searchAuditoria) {
    els.searchAuditoria.addEventListener('input', (e) => {
        clearTimeout(debounceBusquedaAuditoria);
        debounceBusquedaAuditoria = setTimeout(() => {
            cargarAuditoriaWeb(e.target.value);
        }, 350);
    });
}

// ------------------------------------------
// MÓDULO ADMINISTRACIÓN (SOLO VISUALIZACIÓN)
// ------------------------------------------

const OPERADORES_STORAGE_KEY = 'pos_turnos_operadores_v1';

function cargarOperadoresTurnosStorage() {
    try {
        const raw = localStorage.getItem(OPERADORES_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length === 3) {
                state.operadoresTurnos = parsed.map(n => String(n || '').trim()).map((n, i) => n || ['Liliana', 'Tatiana', 'Danna'][i]);
            }
        }
    } catch (_) {}
}

function badgeTurnoHtml(turno) {
    if (turno === 'San Roque') return '<span class="badge-turno badge-san-roque">San Roque</span>';
    if (turno === 'Granja') return '<span class="badge-turno badge-granja">Granja</span>';
    return '<span class="badge-turno badge-descanso">Descanso</span>';
}

function cambiarFechaInicioTurnos(deltaDias) {
    const [y, m, d] = state.fechaInicioTurnos.split('-').map(Number);
    const dateUtc = Date.UTC(y, m - 1, d) + (deltaDias * 86400000);
    const nueva = new Date(dateUtc);
    const nuevoY = nueva.getUTCFullYear();
    const nuevoM = String(nueva.getUTCMonth() + 1).padStart(2, '0');
    const nuevoD = String(nueva.getUTCDate()).padStart(2, '0');
    state.fechaInicioTurnos = `${nuevoY}-${nuevoM}-${nuevoD}`;
    cargarTurnosAdmin();
}

async function cargarTurnosAdmin() {
    if (!els.tbodyAdminTurnos) return;
    els.tbodyAdminTurnos.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:16px; color:var(--muted);">Cargando programación de turnos...</td></tr>';

    cargarOperadoresTurnosStorage();
    const opsParam = encodeURIComponent(state.operadoresTurnos.join(','));
    const url = `/api/admin/turnos?fechaInicio=${encodeURIComponent(state.fechaInicioTurnos)}&dias=${state.diasTurnos}&operadores=${opsParam}`;
    const { status, data } = await apiFetch(url);

    if (status !== 200 || !data.ok) {
        els.tbodyAdminTurnos.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:16px; color:var(--danger);">${data.error || 'No se pudieron calcular los turnos.'}</td></tr>`;
        return;
    }

    if (els.thAdminOp1) els.thAdminOp1.textContent = state.operadoresTurnos[0];
    if (els.thAdminOp2) els.thAdminOp2.textContent = state.operadoresTurnos[1];
    if (els.thAdminOp3) els.thAdminOp3.textContent = state.operadoresTurnos[2];

    const turnos = data.turnos || [];
    if (turnos.length > 0 && els.labelAdminRangoTurnos) {
        const primera = turnos[0].fecha;
        const ultima = turnos[turnos.length - 1].fecha;
        els.labelAdminRangoTurnos.textContent = `${primera.slice(5)} al ${ultima.slice(5)} (${data.dias}d)`;
    }

    els.tbodyAdminTurnos.innerHTML = '';
    const hoyStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());

    for (const t of turnos) {
        const esHoy = t.fecha === hoyStr;
        const tr = document.createElement('tr');
        if (esHoy) tr.className = 'fila-hoy';
        else if (t.esFinSemana) tr.className = 'fila-fin-semana';

        tr.innerHTML = `
            <td class="col-fecha">
                ${t.fecha} <small>(${t.diaSemana.slice(0, 3)})</small>
                ${esHoy ? '<span class="badge-hoy">HOY</span>' : ''}
            </td>
            <td>${badgeTurnoHtml(t.asignaciones[0]?.turno)}</td>
            <td>${badgeTurnoHtml(t.asignaciones[1]?.turno)}</td>
            <td>${badgeTurnoHtml(t.asignaciones[2]?.turno)}</td>
        `;
        els.tbodyAdminTurnos.appendChild(tr);
    }
}

function resumenSolicitudVentaWeb(sol) {
    try {
        const datos = typeof sol.datos === 'string' ? JSON.parse(sol.datos || '{}') : (sol.datos || {});
        if (sol.tipo === 'nueva' || sol.tipo === 'edicion') {
            const p = datos.propuesta || {};
            const carrito = Array.isArray(p.carrito) ? p.carrito : [];
            const prods = carrito.slice(0, 3).map(i => `${i.nombre} (x${i.cantidad})`).join(', ') + (carrito.length > 3 ? ` (+${carrito.length - 3} más)` : '');
            return `${prods || 'Sin productos'} · Total: ${formatoMoneda.format(p.total || 0)} · ${p.metodoPago || ''}`;
        }
        if (sol.tipo === 'eliminacion') {
            const snap = datos.snapshotOriginal || {};
            return `Venta original · Total: ${formatoMoneda.format(snap.venta?.total || 0)} · ${snap.venta?.metodo_pago || ''}`;
        }
    } catch (_) {}
    return '-';
}

async function cargarSolicitudesVentasAdmin() {
    if (!els.listaAdminSolVentas) return;
    els.listaAdminSolVentas.innerHTML = '<div class="card empty-state">Cargando solicitudes de venta...</div>';

    const estado = state.filtroSolVentas || '';
    const url = `/api/admin/solicitudes-venta${estado ? `?estado=${encodeURIComponent(estado)}` : ''}`;
    const { status, data } = await apiFetch(url);

    if (status !== 200 || !data.ok) {
        els.listaAdminSolVentas.innerHTML = `<div class="card empty-state">${data.error || 'Error al cargar solicitudes de venta.'}</div>`;
        return;
    }

    const solicitudes = data.solicitudes || [];
    state.solicitudesVentasCache = {};
    if (els.countAdminSolVentas) els.countAdminSolVentas.textContent = data.total || 0;

    els.listaAdminSolVentas.innerHTML = '';
    if (solicitudes.length === 0) {
        els.listaAdminSolVentas.innerHTML = `<div class="card empty-state">No hay solicitudes ${estado === 'pendiente' ? 'pendientes' : 'registradas'}.</div>`;
        return;
    }

    const etiquetasTipo = { nueva: 'Nueva venta', edicion: 'Edición', eliminacion: 'Eliminación' };

    for (const sol of solicitudes) {
        state.solicitudesVentasCache[sol.id] = sol;
        const item = document.createElement('div');
        item.className = 'product-item';
        const tipoLabel = etiquetasTipo[sol.tipo] || sol.tipo;
        const fechaSolStr = formatearFechaAuditoria(sol.fecha_solicitud);
        const resumen = resumenSolicitudVentaWeb(sol);

        item.innerHTML = `
            <div class="product-top">
                <div style="display:flex; align-items:center; gap:6px;">
                    <span class="badge-sol-tipo">${tipoLabel}</span>
                    <span class="badge-sol-estado badge-sol-${sol.estado}">${sol.estado}</span>
                </div>
                <small class="audit-fecha">${fechaSolStr}</small>
            </div>
            <div class="audit-user-row">
                <strong>${sol.usuario_solicitante}</strong>
                <span class="badge-subtle">Venta: ${sol.fecha_venta}</span>
                <span class="badge-subtle">${sol.sucursal_id}</span>
            </div>
            <div class="audit-detalles">${resumen}</div>
            ${sol.motivo_rechazo ? `<div style="font-size:0.74rem; color:var(--danger); margin-top:2px;">Motivo rechazo: ${sol.motivo_rechazo}</div>` : ''}
            <div class="product-bottom" style="margin-top:6px;">
                <span></span>
                <button type="button" class="btn-action" data-action="ver-sol-venta">👁️ Ver Detalle</button>
            </div>
        `;

        item.querySelector('[data-action="ver-sol-venta"]').addEventListener('click', () => abrirModalDetalleSolVenta(sol.id));
        els.listaAdminSolVentas.appendChild(item);
    }
}

function abrirModalDetalleSolVenta(id) {
    const sol = state.solicitudesVentasCache[id];
    if (!sol || !els.modalAdminSolVenta) return;

    let datos = {};
    try { datos = typeof sol.datos === 'string' ? JSON.parse(sol.datos || '{}') : (sol.datos || {}); } catch (_) {}

    const tablaItems = (carrito) => {
        if (!Array.isArray(carrito) || carrito.length === 0) return '<p style="color:var(--muted); font-size:0.78rem;">Sin productos.</p>';
        const filas = carrito.map(i => `
            <tr>
                <td>${i.nombre || 'Producto'}</td>
                <td style="text-align:center;">${i.cantidad}</td>
                <td style="text-align:right;">${formatoMoneda.format(Number(i.precio_unitario ?? i.precio ?? 0))}</td>
            </tr>
        `).join('');
        return `
            <table class="sol-modal-table">
                <thead><tr><th>Producto</th><th style="text-align:center;">Cant.</th><th style="text-align:right;">Unit.</th></tr></thead>
                <tbody>${filas}</tbody>
            </table>
        `;
    };

    let contenidoHtml = `
        <div class="sol-modal-info">
            <div><strong>Solicitante:</strong> ${sol.usuario_solicitante}</div>
            <div><strong>Fecha de la venta:</strong> ${sol.fecha_venta}</div>
            <div><strong>Sucursal:</strong> ${sol.sucursal_id}</div>
            <div><strong>Estado:</strong> ${sol.estado} ${sol.motivo_rechazo ? `(${sol.motivo_rechazo})` : ''}</div>
            ${sol.usuario_revisor ? `<div><strong>Revisado por:</strong> ${sol.usuario_revisor} el ${formatearFechaAuditoria(sol.fecha_revision)}</div>` : ''}
        </div>
    `;

    if (sol.tipo === 'nueva') {
        const p = datos.propuesta || {};
        contenidoHtml += `
            <div style="font-weight:700; font-size:0.85rem; margin-top:8px;">Venta Propuesta a Registrar:</div>
            ${tablaItems(p.carrito)}
            <div class="sol-modal-total">
                <span>Total: ${formatoMoneda.format(p.total || 0)}</span>
                <span class="badge-subtle">${p.metodoPago || ''}</span>
            </div>
        `;
    } else if (sol.tipo === 'eliminacion') {
        const snap = datos.snapshotOriginal || {};
        contenidoHtml += `
            <div style="font-weight:700; font-size:0.85rem; color:var(--danger); margin-top:8px;">Venta a Eliminar:</div>
            ${tablaItems(snap.detalle)}
            <div class="sol-modal-total">
                <span>Total: ${formatoMoneda.format(snap.venta?.total || 0)}</span>
                <span class="badge-subtle">${snap.venta?.metodo_pago || ''}</span>
            </div>
        `;
    } else {
        const antes = datos.snapshotOriginal || {};
        const despues = datos.propuesta || {};
        contenidoHtml += `
            <div style="font-weight:700; font-size:0.85rem; color:var(--primary); margin-top:8px;">Antes (Original):</div>
            ${tablaItems(antes.detalle)}
            <div class="sol-modal-total"><span>Total Original: ${formatoMoneda.format(antes.venta?.total || 0)}</span></div>

            <div style="font-weight:700; font-size:0.85rem; color:var(--success); margin-top:12px;">Después (Propuesta):</div>
            ${tablaItems(despues.carrito)}
            <div class="sol-modal-total"><span>Nuevo Total: ${formatoMoneda.format(despues.total || 0)}</span></div>
        `;
    }

    els.modalAdminSolVentaBody.innerHTML = contenidoHtml;
    els.modalAdminSolVenta.classList.remove('hidden');
}

function resumenSolicitudGastoWeb(sol) {
    try {
        const datos = typeof sol.datos === 'string' ? JSON.parse(sol.datos || '{}') : (sol.datos || {});
        const p = datos.propuesta || {};
        if (Array.isArray(p.productosVencidos) && p.productosVencidos.length > 0) {
            const prods = p.productosVencidos.slice(0, 3).map(i => `${i.nombre} (x${i.cantidad})`).join(', ') + (p.productosVencidos.length > 3 ? ` (+${p.productosVencidos.length - 3} más)` : '');
            return `${p.tipo || 'Inventario'} · ${prods}`;
        }
        return `${p.tipo || 'Operativo'} · ${formatoMoneda.format(p.monto || 0)} · ${p.descripcion || ''}`;
    } catch (_) {}
    return '-';
}

async function cargarSolicitudesGastosAdmin() {
    if (!els.listaAdminSolGastos) return;
    els.listaAdminSolGastos.innerHTML = '<div class="card empty-state">Cargando solicitudes de gasto...</div>';

    const estado = state.filtroSolGastos || '';
    const url = `/api/admin/solicitudes-gasto${estado ? `?estado=${encodeURIComponent(estado)}` : ''}`;
    const { status, data } = await apiFetch(url);

    if (status !== 200 || !data.ok) {
        els.listaAdminSolGastos.innerHTML = `<div class="card empty-state">${data.error || 'Error al cargar solicitudes de gasto.'}</div>`;
        return;
    }

    const solicitudes = data.solicitudes || [];
    state.solicitudesGastosCache = {};
    if (els.countAdminSolGastos) els.countAdminSolGastos.textContent = data.total || 0;

    els.listaAdminSolGastos.innerHTML = '';
    if (solicitudes.length === 0) {
        els.listaAdminSolGastos.innerHTML = `<div class="card empty-state">No hay solicitudes ${estado === 'pendiente' ? 'pendientes' : 'registradas'}.</div>`;
        return;
    }

    for (const sol of solicitudes) {
        state.solicitudesGastosCache[sol.id] = sol;
        const item = document.createElement('div');
        item.className = 'product-item';
        const fechaSolStr = formatearFechaAuditoria(sol.fecha_solicitud);
        const resumen = resumenSolicitudGastoWeb(sol);

        item.innerHTML = `
            <div class="product-top">
                <div style="display:flex; align-items:center; gap:6px;">
                    <span class="badge-sol-tipo">Gasto</span>
                    <span class="badge-sol-estado badge-sol-${sol.estado}">${sol.estado}</span>
                </div>
                <small class="audit-fecha">${fechaSolStr}</small>
            </div>
            <div class="audit-user-row">
                <strong>${sol.usuario_solicitante}</strong>
                <span class="badge-subtle">Fecha Gasto: ${sol.fecha_gasto}</span>
                <span class="badge-subtle">${sol.sucursal_id}</span>
            </div>
            <div class="audit-detalles">${resumen}</div>
            ${sol.motivo_rechazo ? `<div style="font-size:0.74rem; color:var(--danger); margin-top:2px;">Motivo rechazo: ${sol.motivo_rechazo}</div>` : ''}
            <div class="product-bottom" style="margin-top:6px;">
                <span></span>
                <button type="button" class="btn-action" data-action="ver-sol-gasto">👁️ Ver Detalle</button>
            </div>
        `;

        item.querySelector('[data-action="ver-sol-gasto"]').addEventListener('click', () => abrirModalDetalleSolGasto(sol.id));
        els.listaAdminSolGastos.appendChild(item);
    }
}

function abrirModalDetalleSolGasto(id) {
    const sol = state.solicitudesGastosCache[id];
    if (!sol || !els.modalAdminSolGasto) return;

    let datos = {};
    try { datos = typeof sol.datos === 'string' ? JSON.parse(sol.datos || '{}') : (sol.datos || {}); } catch (_) {}
    const p = datos.propuesta || {};

    let filasProductos = '';
    if (Array.isArray(p.productosVencidos) && p.productosVencidos.length > 0) {
        const filas = p.productosVencidos.map(i => `
            <tr>
                <td>${i.nombre || 'Producto'}</td>
                <td style="text-align:center;">${i.cantidad}</td>
                <td style="text-align:right;">${formatoMoneda.format(Number(i.valor || 0))}</td>
            </tr>
        `).join('');
        filasProductos = `
            <div style="font-weight:700; font-size:0.85rem; margin-top:10px;">Productos Afectados:</div>
            <table class="sol-modal-table">
                <thead><tr><th>Producto</th><th style="text-align:center;">Cant.</th><th style="text-align:right;">Valor</th></tr></thead>
                <tbody>${filas}</tbody>
            </table>
        `;
    }

    const contenidoHtml = `
        <div class="sol-modal-info">
            <div><strong>Solicitante:</strong> ${sol.usuario_solicitante}</div>
            <div><strong>Fecha del gasto:</strong> ${sol.fecha_gasto}</div>
            <div><strong>Sucursal:</strong> ${sol.sucursal_id}</div>
            <div><strong>Estado:</strong> ${sol.estado} ${sol.motivo_rechazo ? `(${sol.motivo_rechazo})` : ''}</div>
            ${sol.usuario_revisor ? `<div><strong>Revisado por:</strong> ${sol.usuario_revisor} el ${formatearFechaAuditoria(sol.fecha_revision)}</div>` : ''}
        </div>
        <div style="font-weight:700; font-size:0.85rem; margin-top:8px;">Gasto Solicitado:</div>
        <div class="sol-modal-total">
            <span>${p.tipo || 'Operativo'}</span>
            <span>${formatoMoneda.format(Number(p.monto || 0))}</span>
        </div>
        <div style="font-size:0.8rem; color:var(--muted-light); margin-top:4px;"><strong>Concepto:</strong> ${p.descripcion || '-'}</div>
        ${p.metodoPago ? `<div style="font-size:0.8rem; color:var(--muted); margin-top:2px;"><strong>Método de Pago:</strong> ${p.metodoPago}</div>` : ''}
        ${filasProductos}
    `;

    els.modalAdminSolGastoBody.innerHTML = contenidoHtml;
    els.modalAdminSolGasto.classList.remove('hidden');
}

// Listeners de navegación de Administración
document.querySelectorAll('.subtab-admin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.subtab-admin-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sub = btn.dataset.subtabAdmin;
        state.subtabAdmin = sub;
        els.adminSubtabTurnos.classList.toggle('hidden', sub !== 'turnos');
        els.adminSubtabSolVentas.classList.toggle('hidden', sub !== 'sol-ventas');
        els.adminSubtabSolGastos.classList.toggle('hidden', sub !== 'sol-gastos');
        if (sub === 'turnos') cargarTurnosAdmin();
        else if (sub === 'sol-ventas') cargarSolicitudesVentasAdmin();
        else if (sub === 'sol-gastos') cargarSolicitudesGastosAdmin();
    });
});

if (els.btnAdminTurnoAnt) els.btnAdminTurnoAnt.addEventListener('click', () => cambiarFechaInicioTurnos(-state.diasTurnos));
if (els.btnAdminTurnoSig) els.btnAdminTurnoSig.addEventListener('click', () => cambiarFechaInicioTurnos(state.diasTurnos));
if (els.btnAdminTurnoHoy) els.btnAdminTurnoHoy.addEventListener('click', () => {
    state.fechaInicioTurnos = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
    cargarTurnosAdmin();
});

if (els.selectAdminTurnoDias) {
    els.selectAdminTurnoDias.addEventListener('change', (e) => {
        state.diasTurnos = Number(e.target.value) || 14;
        cargarTurnosAdmin();
    });
}

if (els.filtroAdminSolVentas) {
    els.filtroAdminSolVentas.addEventListener('change', (e) => {
        state.filtroSolVentas = e.target.value;
        cargarSolicitudesVentasAdmin();
    });
}
if (els.btnRefreshSolVentas) {
    els.btnRefreshSolVentas.addEventListener('click', async () => {
        await cargarSolicitudesVentasAdmin();
        mostrarToast('Solicitudes de venta actualizadas');
    });
}

if (els.filtroAdminSolGastos) {
    els.filtroAdminSolGastos.addEventListener('change', (e) => {
        state.filtroSolGastos = e.target.value;
        cargarSolicitudesGastosAdmin();
    });
}
if (els.btnRefreshSolGastos) {
    els.btnRefreshSolGastos.addEventListener('click', async () => {
        await cargarSolicitudesGastosAdmin();
        mostrarToast('Solicitudes de gasto actualizadas');
    });
}

if (els.btnCerrarModalAdminSolVenta) els.btnCerrarModalAdminSolVenta.addEventListener('click', () => els.modalAdminSolVenta.classList.add('hidden'));
if (els.btnCerrarModalAdminSolVentaPie) els.btnCerrarModalAdminSolVentaPie.addEventListener('click', () => els.modalAdminSolVenta.classList.add('hidden'));

if (els.btnCerrarModalAdminSolGasto) els.btnCerrarModalAdminSolGasto.addEventListener('click', () => els.modalAdminSolGasto.classList.add('hidden'));
if (els.btnCerrarModalAdminSolGastoPie) els.btnCerrarModalAdminSolGastoPie.addEventListener('click', () => els.modalAdminSolGasto.classList.add('hidden'));

const btnReloadApp = document.getElementById('btn-reload-app');
if (btnReloadApp) {
    btnReloadApp.addEventListener('click', () => {
        window.location.reload();
    });
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.token) {
        verificarSaludServidor();
        if (state.tabActiva === 'reporte') {
            cargarReporteDiario();
        }
    }
});

verificarSaludServidor();
restaurarSesion();
setInterval(verificarSaludServidor, 15000);
