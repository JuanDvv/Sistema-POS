// Corregir bug de pérdida de foco en Electron al cerrar diálogos nativos en Windows
const originalAlert = window.alert;
window.alert = (msg) => { originalAlert(msg); window.api.forceRefocus(); };
const originalConfirm = window.confirm;
window.confirm = (msg) => { const r = originalConfirm(msg); window.api.forceRefocus(); return r; };

let productosLocales = [];
let carrito = [];
let sucursalId = 'sucursal-norte';
let metodoPagoSelected = 'Efectivo';
let categoriasCargadas = [];
let filtroCategorias = null; // Instancia del selector múltiple de categorías (ver categoriaFiltro.js)

// Estado propio de este módulo: 'nueva' (registrar venta olvidada) | 'lista' (ver ventas del día) | 'editando'
let modo = 'nueva';
let ventaIdEnEdicion = null;
let reservaOriginalPorProducto = {}; // producto_id -> cantidad ya vendida en la venta que se está editando

const currentUser = localStorage.getItem('currentUser') || 'Invitado';
const currentRole = localStorage.getItem('currentRole') || 'Sin Rol';

const formatCOP = (val) => `${Math.round(val).toLocaleString('es-CO')}`;
const formatNumberUI = (val) => {
    const clean = String(val).replace(/\D/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString('es-CO');
};
const parseNumberUI = (str) => {
    const normalized = String(str ?? '').replace(/\./g, '').replace(/,/g, '.');
    const numeric = parseFloat(normalized);
    return Number.isFinite(numeric) ? numeric : 0;
};
const normalizeStr = (value) => {
    if (value == null) return '';
    return String(value).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
};

function obtenerFechaAyerYYYYMMDD() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function isoToFechaDia(iso) {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function obtenerStockDisponible(productoId, stockCatalogo) {
    return Number(stockCatalogo || 0) + Number(reservaOriginalPorProducto[productoId] || 0);
}

const obtenerPorcentajeDescuento = () => {
    const chkDescuento = document.getElementById('chk-descuento');
    const selectDescuento = document.getElementById('select-descuento');
    if (!chkDescuento || !chkDescuento.checked || !selectDescuento || !selectDescuento.value) {
        return 0;
    }
    return Number(selectDescuento.value || 0);
};

const esCategoriaPasteleria = (categoria) => {
    if (!categoria) return false;
    const nombres = [];
    if (typeof categoria === 'string') {
        nombres.push(categoria);
    } else if (categoria && typeof categoria === 'object') {
        if (categoria.categoria_nombre) nombres.push(categoria.categoria_nombre);
        if (categoria.nombre) nombres.push(categoria.nombre);
        if (categoria.categoria) nombres.push(categoria.categoria);
        if (categoria.categoria_id || categoria.id) {
            const categoriaId = categoria.categoria_id || categoria.id;
            const categoriaEncontrada = categoriasCargadas.find(cat => String(cat.id) === String(categoriaId));
            if (categoriaEncontrada) {
                let actual = categoriaEncontrada;
                while (actual) {
                    nombres.push(actual.nombre);
                    actual = categoriasCargadas.find(cat => String(cat.id) === String(actual.categoria_padre_id)) || null;
                }
            }
        }
    }
    return nombres.some(nombre => normalizeStr(nombre).includes('pasteleria') || normalizeStr(nombre).includes('pastel'));
};

const calcularTotalVenta = () => {
    let subtotalProductos = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    let valorDomicilio = 0;
    const chkDomicilio = document.getElementById('chk-domicilio');
    if (chkDomicilio && chkDomicilio.checked) {
        const inputDom = document.getElementById('input-valor-domicilio');
        if (inputDom) valorDomicilio = parseNumberUI(inputDom.value);
    }

    const porcentaje = obtenerPorcentajeDescuento();
    if (porcentaje > 0) {
        const subtotalPasteleria = carrito.reduce((sum, item) => {
            if (esCategoriaPasteleria(item)) {
                return sum + (item.precio * item.cantidad);
            }
            return sum;
        }, 0);
        const descuento = subtotalPasteleria * (porcentaje / 100);
        subtotalProductos = Math.max(0, subtotalProductos - descuento);
    }

    return subtotalProductos + valorDomicilio;
};

function actualizarEstadoDescuentoUI() {
    const chkDescuento = document.getElementById('chk-descuento');
    const selectDescuento = document.getElementById('select-descuento');
    const descuentoContainer = document.getElementById('descuento-input-container');
    if (!chkDescuento || !selectDescuento || !descuentoContainer) return;

    const hayPasteleria = carrito.some(item => esCategoriaPasteleria(item));
    chkDescuento.disabled = !hayPasteleria;
    selectDescuento.disabled = !chkDescuento.checked || !hayPasteleria;

    if (!hayPasteleria) {
        chkDescuento.checked = false;
        selectDescuento.value = '';
        descuentoContainer.style.display = 'none';
    } else if (chkDescuento.checked) {
        descuentoContainer.style.display = 'flex';
        selectDescuento.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const resId = await window.api.obtenerSucursalId();
    if (resId.success) sucursalId = resId.id;

    document.getElementById('display-user').innerText = currentUser;
    document.getElementById('display-role').innerText = currentRole;

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

    const imagePreviewModal = document.getElementById('image-preview-modal');
    if (imagePreviewModal) {
        imagePreviewModal.addEventListener('click', () => { imagePreviewModal.style.display = 'none'; });
    }

    // Fecha por defecto: ayer. Tope máximo: ayer (no se permite hoy ni futuro).
    const inputFecha = document.getElementById('input-fecha-venta');
    const ayer = obtenerFechaAyerYYYYMMDD();
    inputFecha.max = ayer;
    inputFecha.value = ayer;
    inputFecha.addEventListener('change', () => {
        if (inputFecha.value > ayer) {
            alert('Solo se permiten fechas anteriores a hoy.');
            inputFecha.value = ayer;
        }
        if (modo === 'editando') {
            cancelarEdicion();
        }
        if (modo === 'lista') {
            cargarListaVentasDia();
        }
    });

    // Buscador y filtro de categorías
    const searchInput = document.getElementById('search-productos');
    const filterCat = document.getElementById('filter-categoria');
    if (filterCat) {
        const resCat = await window.api.obtenerCategorias();
        if (resCat.success && resCat.data) {
            categoriasCargadas = resCat.data;
        }
        filtroCategorias = crearFiltroCategorias({
            contenedor: filterCat,
            categorias: categoriasCargadas,
            tieneNegativos: false,
            onChange: () => filtrarYRenderizarCatalogo()
        });
    }
    if (searchInput) {
        searchInput.addEventListener('input', () => filtrarYRenderizarCatalogo());
    }

    // Método de pago
    const btnEfectivo = document.getElementById('btn-pay-efectivo');
    const btnTransferencia = document.getElementById('btn-pay-transferencia');
    const btnMixto = document.getElementById('btn-pay-mixto');
    const mixtoContainer = document.getElementById('mixto-inputs-container');
    const inputEfectivo = document.getElementById('input-mixto-efectivo');
    const inputTransferencia = document.getElementById('input-mixto-transferencia');

    const selectMethod = (method) => {
        metodoPagoSelected = method;
        [btnEfectivo, btnTransferencia, btnMixto].forEach(btn => {
            if (btn) {
                btn.style.backgroundColor = 'white';
                btn.style.color = '#374151';
                btn.style.borderColor = '#d1d5db';
            }
        });
        if (method === 'Efectivo' && btnEfectivo) {
            btnEfectivo.style.backgroundColor = '#3b82f6';
            btnEfectivo.style.color = 'white';
            btnEfectivo.style.borderColor = '#3b82f6';
            if (mixtoContainer) mixtoContainer.style.display = 'none';
        } else if (method === 'Transferencia' && btnTransferencia) {
            btnTransferencia.style.backgroundColor = '#3b82f6';
            btnTransferencia.style.color = 'white';
            btnTransferencia.style.borderColor = '#3b82f6';
            if (mixtoContainer) mixtoContainer.style.display = 'none';
        } else if (method === 'Mixto' && btnMixto) {
            btnMixto.style.backgroundColor = '#3b82f6';
            btnMixto.style.color = 'white';
            btnMixto.style.borderColor = '#3b82f6';
            if (mixtoContainer) {
                mixtoContainer.style.display = 'flex';
                const total = calcularTotalVenta();
                if (inputEfectivo) inputEfectivo.value = formatNumberUI(total);
                if (inputTransferencia) inputTransferencia.value = "0";
            }
        }
        if (inputPagaCon) inputPagaCon.value = '';
        calcularCambio();
    };
    window.__selectMethod = selectMethod;

    if (btnEfectivo) btnEfectivo.addEventListener('click', () => selectMethod('Efectivo'));
    if (btnTransferencia) btnTransferencia.addEventListener('click', () => selectMethod('Transferencia'));
    if (btnMixto) btnMixto.addEventListener('click', () => selectMethod('Mixto'));

    const autoCalculateMixto = (changedInput) => {
        const total = calcularTotalVenta();
        if (changedInput === 'efectivo') {
            const rawVal = parseNumberUI(inputEfectivo.value);
            if (rawVal > total) {
                inputEfectivo.value = formatNumberUI(total);
                if (inputTransferencia) inputTransferencia.value = "0";
            } else {
                inputEfectivo.value = formatNumberUI(rawVal);
                if (inputTransferencia) inputTransferencia.value = formatNumberUI(Math.max(0, total - rawVal));
            }
        } else if (changedInput === 'transferencia') {
            const rawVal = parseNumberUI(inputTransferencia.value);
            if (rawVal > total) {
                inputTransferencia.value = formatNumberUI(total);
                if (inputEfectivo) inputEfectivo.value = "0";
            } else {
                inputTransferencia.value = formatNumberUI(rawVal);
                if (inputEfectivo) inputEfectivo.value = formatNumberUI(Math.max(0, total - rawVal));
            }
        }
        calcularCambio();
    };
    if (inputEfectivo) {
        inputEfectivo.addEventListener('input', () => autoCalculateMixto('efectivo'));
        inputEfectivo.addEventListener('focus', function () { this.select(); });
    }
    if (inputTransferencia) {
        inputTransferencia.addEventListener('input', () => autoCalculateMixto('transferencia'));
        inputTransferencia.addEventListener('focus', function () { this.select(); });
    }

    const changeContainer = document.getElementById('cash-change-container');
    const inputPagaCon = document.getElementById('input-paga-con');
    const displayCambio = document.getElementById('display-cambio');
    const lblPagaCon = document.getElementById('lbl-paga-con');

    const calcularCambio = () => {
        if (!changeContainer || !inputPagaCon || !displayCambio) return;
        const total = calcularTotalVenta();
        let targetCashToPay = 0;
        if (metodoPagoSelected === 'Efectivo') {
            targetCashToPay = total;
            lblPagaCon.innerText = "Cliente Paga con ($):";
        } else if (metodoPagoSelected === 'Mixto') {
            targetCashToPay = parseNumberUI(inputEfectivo.value);
            lblPagaCon.innerText = "Cliente Paga con (Efectivo) ($):";
        } else {
            changeContainer.style.display = 'none';
            return;
        }
        changeContainer.style.display = 'flex';
        const rawPagaCon = parseNumberUI(inputPagaCon.value);
        inputPagaCon.value = rawPagaCon === 0 ? '' : formatNumberUI(rawPagaCon);
        if (rawPagaCon >= targetCashToPay && targetCashToPay > 0) {
            displayCambio.innerText = formatCOP(rawPagaCon - targetCashToPay);
            displayCambio.style.color = '#15803d';
        } else {
            displayCambio.innerText = '$0';
            displayCambio.style.color = '#dc2626';
        }
    };
    window.triggerCalcularCambio = calcularCambio;
    if (inputPagaCon) {
        inputPagaCon.addEventListener('input', calcularCambio);
        inputPagaCon.addEventListener('focus', function () { this.select(); });
    }

    // Domicilio
    const chkDomicilio = document.getElementById('chk-domicilio');
    const inputDomicilio = document.getElementById('input-valor-domicilio');
    const domContainer = document.getElementById('domicilio-input-container');
    if (chkDomicilio && inputDomicilio && domContainer) {
        chkDomicilio.addEventListener('change', () => {
            if (chkDomicilio.checked) {
                domContainer.style.display = 'flex';
                inputDomicilio.focus();
                selectMethod('Transferencia');
                if (btnEfectivo) { btnEfectivo.disabled = true; btnEfectivo.style.opacity = '0.5'; btnEfectivo.style.cursor = 'not-allowed'; }
                if (btnMixto) { btnMixto.disabled = true; btnMixto.style.opacity = '0.5'; btnMixto.style.cursor = 'not-allowed'; }
            } else {
                domContainer.style.display = 'none';
                inputDomicilio.value = '';
                if (btnEfectivo) { btnEfectivo.disabled = false; btnEfectivo.style.opacity = '1'; btnEfectivo.style.cursor = 'pointer'; }
                if (btnMixto) { btnMixto.disabled = false; btnMixto.style.opacity = '1'; btnMixto.style.cursor = 'pointer'; }
            }
            renderizarCarrito();
            calcularCambio();
            if (metodoPagoSelected === 'Mixto') autoCalculateMixto('efectivo');
        });
        inputDomicilio.addEventListener('input', (e) => {
            e.target.value = formatNumberUI(e.target.value);
            renderizarCarrito();
            calcularCambio();
            if (metodoPagoSelected === 'Mixto') autoCalculateMixto('efectivo');
        });
        inputDomicilio.addEventListener('focus', function () { this.select(); });
    }

    // Descuento
    const chkDescuento = document.getElementById('chk-descuento');
    const selectDescuento = document.getElementById('select-descuento');
    const descuentoContainer = document.getElementById('descuento-input-container');
    if (chkDescuento && selectDescuento && descuentoContainer) {
        chkDescuento.addEventListener('change', () => {
            if (chkDescuento.checked) {
                descuentoContainer.style.display = 'flex';
                if (!selectDescuento.value) selectDescuento.value = '10';
            } else {
                descuentoContainer.style.display = 'none';
                selectDescuento.value = '';
            }
            renderizarCarrito();
        });
        selectDescuento.addEventListener('change', () => renderizarCarrito());
        actualizarEstadoDescuentoUI();
    }

    // Crédito
    const chkCredito = document.getElementById('chk-credito');
    const selectClienteCredito = document.getElementById('select-cliente-credito');
    const creditoContainer = document.getElementById('credito-input-container');
    if (chkCredito && selectClienteCredito && creditoContainer) {
        const resClientes = await window.api.obtenerClientes();
        if (resClientes.success && resClientes.data) {
            selectClienteCredito.innerHTML = '<option value="">-- Seleccionar Cliente --</option>';
            resClientes.data
                .filter(cli => (cli.origen || 'Credito') === 'Credito')
                .forEach(cli => {
                    const opt = document.createElement('option');
                    opt.value = cli.id;
                    opt.innerText = `${cli.nombre} (${cli.tipo} - ${cli.identificacion || 'Sin ID'})`;
                    selectClienteCredito.appendChild(opt);
                });
        }
        chkCredito.addEventListener('change', () => {
            if (chkCredito.checked) {
                creditoContainer.style.display = 'flex';
                selectClienteCredito.focus();
                if (chkDomicilio && chkDomicilio.checked) {
                    chkDomicilio.checked = false;
                    chkDomicilio.dispatchEvent(new Event('change'));
                }
                const buttons = document.querySelectorAll('#payment-methods-container button');
                buttons.forEach(btn => { btn.disabled = true; btn.style.opacity = '0.5'; btn.style.cursor = 'not-allowed'; });
                if (mixtoContainer) mixtoContainer.style.display = 'none';
                if (changeContainer) changeContainer.style.display = 'none';
                metodoPagoSelected = 'Crédito';
            } else {
                creditoContainer.style.display = 'none';
                selectClienteCredito.value = '';
                const buttons = document.querySelectorAll('#payment-methods-container button');
                buttons.forEach(btn => { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; });
                selectMethod('Efectivo');
            }
        });
    }

    // Pestañas
    document.getElementById('tab-btn-nueva').addEventListener('click', () => cambiarModo('nueva'));
    document.getElementById('tab-btn-editar').addEventListener('click', () => cambiarModo('lista'));
    document.getElementById('btn-cancelar-edicion').addEventListener('click', cancelarEdicion);
    document.getElementById('btn-guardar-venta').addEventListener('click', guardarVenta);

    const modalSolicitudes = document.getElementById('modal-solicitudes');
    document.getElementById('btn-ver-mis-solicitudes').addEventListener('click', async () => {
        await cargarMisSolicitudes();
        modalSolicitudes.style.display = 'flex';
    });
    document.getElementById('btn-cerrar-modal-solicitudes').addEventListener('click', () => {
        modalSolicitudes.style.display = 'none';
    });
    modalSolicitudes.addEventListener('click', (e) => {
        if (e.target === modalSolicitudes) modalSolicitudes.style.display = 'none';
    });

    await cargarCatalogo();

    if (window.api && window.api.onInventarioActualizado) {
        window.api.onInventarioActualizado(() => cargarCatalogo());
    }

    // Refresca solo el catálogo tras sincronizar; no toca el carrito ni la venta en edición
    // (modo/ventaIdEnEdicion), que solo viven en memoria y sobreviven porque ya no recargamos la página.
    window.addEventListener('pos-sincronizacion-completa', () => {
        cargarCatalogo();
    });
});

function mostrarPanelCatalogo(mostrar) {
    document.getElementById('grid-products').style.display = mostrar ? 'grid' : 'none';
    document.getElementById('fila-busqueda-catalogo').style.display = mostrar ? 'flex' : 'none';
    document.getElementById('panel-lista-ventas').style.display = mostrar ? 'none' : 'block';
}

function cambiarModo(nuevoModo) {
    if (modo === 'editando' && nuevoModo !== 'editando') {
        cancelarEdicion(false);
    }
    modo = nuevoModo;

    document.getElementById('tab-btn-nueva').classList.toggle('active', nuevoModo === 'nueva');
    document.getElementById('tab-btn-editar').classList.toggle('active', nuevoModo === 'lista' || nuevoModo === 'editando');

    if (nuevoModo === 'nueva') {
        mostrarPanelCatalogo(true);
        document.getElementById('editor-banner').style.display = 'none';
        document.getElementById('btn-guardar-venta').innerText = 'Guardar Venta';
        limpiarCarrito();
    } else if (nuevoModo === 'lista') {
        mostrarPanelCatalogo(false);
        cargarListaVentasDia();
    } else if (nuevoModo === 'editando') {
        mostrarPanelCatalogo(true);
        document.getElementById('btn-guardar-venta').innerText = 'Guardar Cambios';
    }
}

async function cargarListaVentasDia() {
    const fecha = document.getElementById('input-fecha-venta').value;
    const tbody = document.querySelector('#table-ventas-dia tbody');
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#6b7280;">Cargando...</td></tr>`;

    const res = await window.api.getReporteDiario({ sucursalId, fecha, categoriaIds: null });
    if (!res.success) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#dc2626;">Error al cargar: ${res.message}</td></tr>`;
        return;
    }

    const ventas = res.ventas || [];
    if (ventas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#6b7280;">No hay ventas registradas ese día.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    ventas.forEach(venta => {
        const hora = new Date(venta.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const metodoPagoText = venta.metodo_pago === 'Crédito'
            ? `Crédito (${venta.cliente_nombre || 'Cliente sin registrar'})`
            : (venta.metodo_pago || '');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${hora}</td>
            <td>${venta.productos_vendidos || 'Sin detalles'}</td>
            <td>${metodoPagoText}</td>
            <td><strong>${formatCOP(venta.total)}</strong></td>
            <td>
                <button type="button" class="btn-mini btn-mini-edit" data-id="${venta.id}">✏️ Editar</button>
                <button type="button" class="btn-mini btn-mini-delete" data-id="${venta.id}">🗑️ Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-mini-edit').forEach(btn => {
        btn.addEventListener('click', () => iniciarEdicionVenta(btn.dataset.id));
    });
    tbody.querySelectorAll('.btn-mini-delete').forEach(btn => {
        btn.addEventListener('click', () => eliminarVentaExistente(btn.dataset.id));
    });
}

async function iniciarEdicionVenta(ventaId) {
    const res = await window.api.obtenerDetalleVenta(ventaId);
    if (!res.success) {
        alert('Error al cargar la venta: ' + res.message);
        return;
    }

    const { venta, detalle } = res;

    modo = 'editando';
    ventaIdEnEdicion = ventaId;
    reservaOriginalPorProducto = {};
    detalle.forEach(det => {
        reservaOriginalPorProducto[det.producto_id] = (reservaOriginalPorProducto[det.producto_id] || 0) + Number(det.cantidad || 0);
    });

    carrito = detalle.map(det => {
        const prodCatalogo = productosLocales.find(p => p.id === det.producto_id);
        const stockCatalogo = prodCatalogo ? Number(prodCatalogo.stock || 0) : 0;
        return {
            id: det.producto_id,
            nombre: det.nombre || 'Producto eliminado',
            precio: Number(det.precio_unitario || 0),
            cantidad: Number(det.cantidad || 0),
            stockMaximo: obtenerStockDisponible(det.producto_id, stockCatalogo),
            categoria_id: det.categoria_id,
            categoria_nombre: det.categoria_nombre || ''
        };
    });

    document.getElementById('input-fecha-venta').value = isoToFechaDia(venta.fecha);

    // Restablecer selectores antes de precargar
    document.getElementById('chk-domicilio').checked = false;
    document.getElementById('domicilio-input-container').style.display = 'none';
    document.getElementById('chk-credito').checked = false;
    document.getElementById('credito-input-container').style.display = 'none';
    document.getElementById('chk-descuento').checked = false;
    document.getElementById('descuento-input-container').style.display = 'none';

    let metodoBase = String(venta.metodo_pago || '');
    const matchDomicilio = metodoBase.match(/\(Domicilio:\s*\$?([\d.,]+)\)/);
    if (matchDomicilio) {
        document.getElementById('chk-domicilio').checked = true;
        document.getElementById('input-valor-domicilio').value = formatNumberUI(parseNumberUI(matchDomicilio[1]));
        document.getElementById('domicilio-input-container').style.display = 'flex';
        metodoBase = metodoBase.replace(/\s*\(Domicilio:.*?\)/, '').trim();
    }

    // El % de descuento no se persiste; se infiere de la diferencia entre el total real
    // y la suma de líneas (+domicilio) para que el Total recalculado no quede por encima del real.
    const valorDomicilioDetectado = matchDomicilio ? parseNumberUI(matchDomicilio[1]) : 0;
    const subtotalProductos = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const subtotalPasteleria = carrito.reduce((sum, item) => esCategoriaPasteleria(item) ? sum + (item.precio * item.cantidad) : sum, 0);
    const diferenciaDescuento = subtotalProductos + valorDomicilioDetectado - Number(venta.total || 0);
    if (diferenciaDescuento > 0 && subtotalPasteleria > 0) {
        const porcentajeImplicito = (diferenciaDescuento / subtotalPasteleria) * 100;
        const selectDescuento = document.getElementById('select-descuento');
        const opciones = Array.from(selectDescuento.options).map(o => Number(o.value)).filter(v => v > 0);
        const opcionMasCercana = opciones.reduce((mejor, actual) =>
            Math.abs(actual - porcentajeImplicito) < Math.abs(mejor - porcentajeImplicito) ? actual : mejor
        , opciones[0]);
        if (opcionMasCercana && Math.abs(opcionMasCercana - porcentajeImplicito) < 1) {
            document.getElementById('chk-descuento').checked = true;
            selectDescuento.value = String(opcionMasCercana);
            document.getElementById('descuento-input-container').style.display = 'flex';
        }
    }

    if (venta.es_credito) {
        document.getElementById('chk-credito').checked = true;
        document.getElementById('credito-input-container').style.display = 'flex';
        document.getElementById('select-cliente-credito').value = venta.cliente_id || '';
        metodoPagoSelected = 'Crédito';
        const buttons = document.querySelectorAll('#payment-methods-container button');
        buttons.forEach(btn => { btn.disabled = true; btn.style.opacity = '0.5'; btn.style.cursor = 'not-allowed'; });
    } else if (metodoBase.startsWith('Mixto')) {
        const matchEf = metodoBase.match(/Efectivo:\s*(\d+(?:\.\d+)?)/);
        const matchTr = metodoBase.match(/Transferencia:\s*(\d+(?:\.\d+)?)/);
        window.__selectMethod('Mixto');
        if (matchEf) document.getElementById('input-mixto-efectivo').value = formatNumberUI(parseFloat(matchEf[1]));
        if (matchTr) document.getElementById('input-mixto-transferencia').value = formatNumberUI(parseFloat(matchTr[1]));
    } else if (metodoBase.startsWith('Transferencia')) {
        window.__selectMethod('Transferencia');
    } else {
        window.__selectMethod('Efectivo');
    }

    document.getElementById('editor-banner').style.display = 'flex';
    document.getElementById('editor-banner-texto').innerText =
        `Editando venta de ${new Date(venta.fecha).toLocaleString('es-CO')} - Total original: $${formatCOP(venta.total)}`;
    document.getElementById('btn-guardar-venta').innerText = 'Guardar Cambios';

    document.getElementById('tab-btn-editar').classList.add('active');
    document.getElementById('tab-btn-nueva').classList.remove('active');
    mostrarPanelCatalogo(true);

    actualizarEstadoDescuentoUI();
    renderizarCarrito();
    filtrarYRenderizarCatalogo();
}

function cancelarEdicion(volverALista = true) {
    modo = volverALista ? 'lista' : modo;
    ventaIdEnEdicion = null;
    reservaOriginalPorProducto = {};
    limpiarCarrito();
    document.getElementById('editor-banner').style.display = 'none';
    document.getElementById('btn-guardar-venta').innerText = 'Guardar Venta';
    if (volverALista) {
        mostrarPanelCatalogo(false);
        cargarListaVentasDia();
    }
}

async function eliminarVentaExistente(ventaId) {
    if (!confirm('¿Seguro que deseas eliminar esta venta? El inventario se restablecerá.')) return;
    const res = await window.api.eliminarVentaAnterior({ ventaId, auditoriaUsuario: currentUser, auditoriaRol: currentRole });
    if (res.requiereAprobacion) {
        alert('Solicitud de eliminación enviada. Un administrador debe confirmarla.');
    } else {
        alert(res.message);
    }
    if (res.success || res.requiereAprobacion) {
        await cargarListaVentasDia();
        await cargarMisSolicitudes();
        await cargarCatalogo();
    }
}

async function cargarMisSolicitudes() {
    const res = await window.api.obtenerSolicitudesVenta({ usuario: currentUser });
    const tbody = document.querySelector('#table-mis-solicitudes tbody');
    if (!res.success || !res.data || res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#6b7280;">Sin solicitudes registradas.</td></tr>`;
        return;
    }

    const etiquetasTipo = { nueva: 'Nueva venta', edicion: 'Edición', eliminacion: 'Eliminación' };
    const clasesEstado = { pendiente: 'pill-pendiente', aprobada: 'pill-aprobada', rechazada: 'pill-rechazada' };
    const etiquetasEstado = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' };

    tbody.innerHTML = '';
    res.data.slice(0, 20).forEach(sol => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(sol.fecha_solicitud).toLocaleString('es-CO')}</td>
            <td>${etiquetasTipo[sol.tipo] || sol.tipo}</td>
            <td>${sol.fecha_venta}</td>
            <td><span class="pill-estado ${clasesEstado[sol.estado] || ''}">${etiquetasEstado[sol.estado] || sol.estado}</span></td>
            <td>${sol.motivo_rechazo || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarYRenderizarCatalogo() {
    const searchInput = document.getElementById('search-productos');

    let query = "";
    if (searchInput) query = normalizeStr(searchInput.value);

    const seleccion = filtroCategorias ? filtroCategorias.getSeleccion() : new Set();
    const filtrarDisponibles = seleccion.has('disponibles');
    const filtrarNegativos = seleccion.has('negativos');
    const catIdsSeleccionadas = [...seleccion].filter(id => id !== 'disponibles' && id !== 'negativos');
    let allowedCatIds = [];
    catIdsSeleccionadas.forEach(catId => {
        allowedCatIds.push(catId);
        const subcats = categoriasCargadas.filter(cat => cat.categoria_padre_id === catId);
        subcats.forEach(sub => allowedCatIds.push(sub.id));
    });

    const productosFiltrados = productosLocales.filter(prod => {
        if (filtrarDisponibles || filtrarNegativos) {
            const stock = Number(prod.stock || 0);
            const cumpleDisponible = filtrarDisponibles && stock > 0;
            const cumpleNegativo = filtrarNegativos && stock < 0;
            if (!cumpleDisponible && !cumpleNegativo) return false;
        }
        if (catIdsSeleccionadas.length > 0 && !allowedCatIds.includes(prod.categoria_id)) return false;
        if (query) {
            const terms = query.split(/\s+/).filter(Boolean);
            const nombre = normalizeStr(prod.nombre);
            const desc = normalizeStr(prod.descripcion || "");
            return terms.every(term => nombre.includes(term) || desc.includes(term));
        }
        return true;
    });

    renderizarCatalogo(productosFiltrados);
}

async function cargarCatalogo() {
    const response = await window.api.getInventory(sucursalId);
    if (response.success) {
        productosLocales = response.data || [];
        productosLocales.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }));
        if (filtroCategorias) {
            filtroCategorias.actualizarNegativos(productosLocales.some(p => Number(p.stock || 0) < 0));
        }
        filtrarYRenderizarCatalogo();
    } else {
        alert("Error al cargar inventario: " + response.message);
    }
}

function renderizarCatalogo(productos) {
    const grid = document.getElementById('grid-products');
    grid.innerHTML = '';

    if (productos.length > 0) {
        productos.forEach(prod => {
            const card = document.createElement('div');
            const disponible = obtenerStockDisponible(prod.id, prod.stock);
            const sinStock = disponible <= 0;
            const stockBajo = disponible <= (Number(prod.stock_minimo) || 2) && !sinStock;
            const productoNombre = prod.nombre || 'Sin nombre';
            const productoPrecio = Number(prod.precio ?? 0);

            card.className = `product-card ${sinStock ? 'disabled' : ''}`;

            const imgUrl = (prod.foto_path && (prod.foto_path.startsWith('http') || prod.foto_path.startsWith('file:///')))
                ? prod.foto_path
                : (prod.foto_path ? `app-image://${prod.foto_path}` : 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200');

            let badgeHtml = '';
            if (sinStock) {
                badgeHtml = `<span style="background-color: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: bold;">Agotado</span>`;
            } else if (stockBajo) {
                badgeHtml = `<span style="background-color: #fef3c7; color: #d97706; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: bold;">Pocas Uds.</span>`;
            }

            card.innerHTML = `
                <div style="position: relative; width: 100% !important; height: 90px !important;">
                    <img src="${imgUrl}" alt="${productoNombre}" style="width: 100% !important; height: 90px !important; object-fit: cover !important; border-radius: 6px !important; display: block !important;">
                    <div style="position: absolute; top: 4px; right: 4px; display: flex; flex-direction: column; gap: 4px; align-items: flex-end; z-index: 5;">
                        ${badgeHtml}
                    </div>
                </div>
                <div class="product-card-body" style="width: 100% !important; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; padding-top: 4px;">
                    <div style="margin-bottom: 6px;">
                        <div style="font-size: 0.8em; font-weight: 600; color: #111827; line-height: 1.25; min-height: 2.5em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${productoNombre}</div>
                    </div>
                    <div>
                        <div class="product-price" style="text-align: center;">${formatCOP(productoPrecio)}</div>
                        <div class="product-stock" style="text-align: center;">Disp: <strong>${disponible}</strong></div>
                    </div>
                </div>
            `;

            if (!sinStock) {
                card.addEventListener('click', () => agregarAlCarrito(prod));
            }
            grid.appendChild(card);
        });
    } else {
        grid.innerHTML = '<p style="text-align: center; color: #6b7280; width:100%; margin-top: 40px;">No se encontraron productos.</p>';
    }
}

function agregarAlCarrito(producto) {
    const disponible = obtenerStockDisponible(producto.id, producto.stock);
    const itemExistente = carrito.find(item => item.id === producto.id);

    if (itemExistente) {
        if (itemExistente.cantidad < disponible) {
            itemExistente.cantidad++;
        } else {
            alert(`No puedes agregar más unidades de ${producto.nombre}. Stock máximo alcanzado.`);
            return;
        }
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            stockMaximo: disponible,
            categoria_id: producto.categoria_id,
            categoria_nombre: producto.categoria_nombre || producto.categoria || ''
        });
    }

    renderizarCarrito();
}

function cambiarCantidad(productoId, delta) {
    const item = carrito.find(item => item.id === productoId);
    if (!item) return;

    item.cantidad += delta;

    if (item.cantidad <= 0) {
        carrito = carrito.filter(i => i.id !== productoId);
    } else if (item.cantidad > item.stockMaximo) {
        item.cantidad = item.stockMaximo;
        alert("Límite de stock disponible alcanzado.");
    }

    actualizarEstadoDescuentoUI();
    renderizarCarrito();
}
window.cambiarCantidad = cambiarCantidad;

function renderizarCarrito() {
    actualizarEstadoDescuentoUI();
    const cartList = document.getElementById('cart-list');
    const cartTotal = document.getElementById('cart-total');
    cartList.innerHTML = '';

    if (carrito.length === 0) {
        cartList.innerHTML = '<p style="color: #6b7280; text-align: center; margin-top: 40px;">El carrito está vacío.</p>';
        cartTotal.innerText = '$0.00';
        return;
    }

    let totalAcumulado = 0;
    const porcentajeDescuento = obtenerPorcentajeDescuento();

    carrito.forEach(item => {
        const itemBase = item.precio * item.cantidad;
        const aplicaDescuento = porcentajeDescuento > 0 && esCategoriaPasteleria(item);
        const itemTotal = aplicaDescuento ? itemBase * (1 - porcentajeDescuento / 100) : itemBase;
        totalAcumulado += itemBase;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <h5>${item.nombre}</h5>
                <span style="font-size: 0.85em; color: #6b7280;">${formatCOP(item.precio)} c/u</span>
                ${aplicaDescuento ? `<div style="font-size: 0.75em; color: #dc2626; margin-top: 4px;">-${porcentajeDescuento}% en pastelería</div>` : ''}
            </div>
            <div class="cart-controls">
                <button class="cart-btn" onclick="cambiarCantidad('${item.id}', -1)">-</button>
                <strong>${item.cantidad}</strong>
                <button class="cart-btn" onclick="cambiarCantidad('${item.id}', 1)">+</button>
                <span style="font-weight: bold; min-width: 60px; text-align: right;">${formatCOP(itemTotal)}</span>
            </div>
        `;
        cartList.appendChild(div);
    });

    cartTotal.innerText = formatCOP(calcularTotalVenta());
    cartList.scrollTop = cartList.scrollHeight;

    if (metodoPagoSelected === 'Mixto') {
        const inputEfectivo = document.getElementById('input-mixto-efectivo');
        const inputTransferencia = document.getElementById('input-mixto-transferencia');
        if (inputEfectivo && inputTransferencia) {
            inputEfectivo.value = formatNumberUI(totalAcumulado);
            inputTransferencia.value = "0";
        }
    }

    if (window.triggerCalcularCambio) window.triggerCalcularCambio();
}

function setProcessingState(isProcessing) {
    const btn = document.getElementById('btn-guardar-venta');
    if (!btn) return;
    btn.disabled = isProcessing;
    btn.innerText = isProcessing ? 'Procesando...' : (modo === 'editando' ? 'Guardar Cambios' : 'Guardar Venta');
    btn.style.opacity = isProcessing ? '0.75' : '1';
    btn.style.cursor = isProcessing ? 'wait' : 'pointer';
}

function limpiarCarrito() {
    carrito = [];
    renderizarCarrito();

    const chkDom = document.getElementById('chk-domicilio');
    const inputDom = document.getElementById('input-valor-domicilio');
    const domContainer = document.getElementById('domicilio-input-container');
    const chkCred = document.getElementById('chk-credito');
    const selectCliCred = document.getElementById('select-cliente-credito');
    const credContainer = document.getElementById('credito-input-container');
    const chkDesc = document.getElementById('chk-descuento');
    const selectDesc = document.getElementById('select-descuento');
    const descContainer = document.getElementById('descuento-input-container');
    const btnEfectivo = document.getElementById('btn-pay-efectivo');
    const btnMixto = document.getElementById('btn-pay-mixto');
    const btnTransferencia = document.getElementById('btn-pay-transferencia');
    const mixtoContainer = document.getElementById('mixto-inputs-container');
    const inputPagaCon = document.getElementById('input-paga-con');
    const displayCambio = document.getElementById('display-cambio');

    if (chkDom) chkDom.checked = false;
    if (inputDom) inputDom.value = '';
    if (domContainer) domContainer.style.display = 'none';

    if (chkCred) chkCred.checked = false;
    if (selectCliCred) selectCliCred.value = '';
    if (credContainer) credContainer.style.display = 'none';

    if (chkDesc) chkDesc.checked = false;
    if (selectDesc) selectDesc.value = '';
    if (descContainer) descContainer.style.display = 'none';
    actualizarEstadoDescuentoUI();

    const buttons = document.querySelectorAll('#payment-methods-container button');
    buttons.forEach(btn => { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; });

    if (btnEfectivo && btnTransferencia && btnMixto) {
        window.__selectMethod('Efectivo');
        if (mixtoContainer) mixtoContainer.style.display = 'none';
    }

    if (inputPagaCon) inputPagaCon.value = '';
    if (displayCambio) displayCambio.innerText = '$0';
}

async function guardarVenta() {
    if (carrito.length === 0) {
        alert("El carrito está vacío. Agrega productos para continuar.");
        return;
    }
    if (document.getElementById('btn-guardar-venta').disabled) return;

    const fechaVenta = document.getElementById('input-fecha-venta').value;
    const ayer = obtenerFechaAyerYYYYMMDD();
    if (!fechaVenta || fechaVenta > ayer) {
        alert('Selecciona una fecha anterior a hoy.');
        return;
    }

    setProcessingState(true);
    let metodoPago = metodoPagoSelected;
    try {
        const chkCredito = document.getElementById('chk-credito');
        const selectClienteCredito = document.getElementById('select-cliente-credito');
        const esCredito = chkCredito && chkCredito.checked;
        let clienteId = null;

        let valorDomicilio = 0;
        const chkDomicilio = document.getElementById('chk-domicilio');
        const esDomicilio = chkDomicilio && chkDomicilio.checked;
        if (esDomicilio) {
            const inputDom = document.getElementById('input-valor-domicilio');
            if (inputDom) valorDomicilio = parseNumberUI(inputDom.value);
        }

        const total = calcularTotalVenta();

        if (esCredito) {
            if (!selectClienteCredito || !selectClienteCredito.value) {
                alert("Por favor seleccione el cliente para la venta a crédito.");
                setProcessingState(false);
                return;
            }
            clienteId = selectClienteCredito.value;
            metodoPago = "Crédito";
        } else if (metodoPagoSelected === 'Mixto') {
            const efVal = parseNumberUI(document.getElementById('input-mixto-efectivo').value);
            const trVal = parseNumberUI(document.getElementById('input-mixto-transferencia').value);
            if (efVal + trVal !== total) {
                alert(`El total de los montos ingresados (${formatCOP(efVal + trVal)}) debe coincidir con el total (${formatCOP(total)}).`);
                setProcessingState(false);
                return;
            }
            metodoPago = `Mixto (Efectivo: ${efVal}, Transferencia: ${trVal})`;
        }

        if (esDomicilio) {
            metodoPago += ` (Domicilio: ${formatCOP(valorDomicilio)})`;
        }

        const payloadBase = {
            sucursalId,
            metodoPago,
            total,
            carrito,
            valorDomicilio,
            es_credito: esCredito ? 1 : 0,
            cliente_id: clienteId,
            fechaVenta,
            auditoriaUsuario: currentUser,
            auditoriaRol: currentRole
        };

        let response;
        if (modo === 'editando') {
            response = await window.api.editarVentaAnterior({ ...payloadBase, ventaId: ventaIdEnEdicion });
        } else {
            response = await window.api.registrarVentaAnterior(payloadBase);
        }

        if (response.requiereAprobacion) {
            alert(response.message);
        } else if (response.success) {
            alert(response.message);
        } else {
            alert('Error: ' + response.message);
            setProcessingState(false);
            return;
        }

        await cargarCatalogo();
        await cargarMisSolicitudes();

        if (modo === 'editando') {
            cancelarEdicion(true);
        } else {
            limpiarCarrito();
        }
    } finally {
        setProcessingState(false);
    }
}

const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
}
