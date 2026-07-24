// Corregir bug de pérdida de foco en Electron al cerrar diálogos nativos en Windows
const originalAlert = window.alert;
window.alert = (msg) => { originalAlert(msg); window.api.forceRefocus(); };
const originalConfirm = window.confirm;
window.confirm = (msg) => { const r = originalConfirm(msg); window.api.forceRefocus(); return r; };

let productosLocales = []; // Guarda los productos cargados del inventario
let carrito = []; // Guarda los items agregados temporalmente para la venta
let sucursalId = 'sucursal-norte'; // ID de la sucursal actual
let sucursalDetalle = null; // { id, nombre, direccion, telefono } para el ticket de impresión
let ultimoTicket = null; // Snapshot de la última venta registrada, para reimprimir
let metodoPagoSelected = 'Efectivo';
let categoriasCargadas = [];
let filtroCategorias = null; // Instancia del selector múltiple de categorías (ver categoriaFiltro.js)
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
const obtenerTotalCarrito = () => carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
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
const guardarCarritoTemporal = () => {
    localStorage.setItem('carrito_temporal', JSON.stringify(carrito));
};
const normalizeStr = (value) => {
    if (value == null) return '';
    return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Comprobante Informativo (no fiscal) para impresora t\u00e9rmica 58/80mm.
function construirTicketHTML({ ventaId, fecha, items, total, metodoPago }) {
    const nombreSucursal = sucursalDetalle?.nombre || sucursalId;
    const direccion = sucursalDetalle?.direccion || '';
    const telefono = sucursalDetalle?.telefono || '';
    const fechaTexto = new Date(fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

    const filasItems = items.map(item => `
        <tr>
            <td class="col-cant">${item.cantidad}x</td>
            <td>${item.nombre}</td>
            <td class="col-sub">$${formatCOP(item.precio * item.cantidad)}</td>
        </tr>
    `).join('');

    return `
        <div class="ticket-aviso">*** COMPROBANTE INFORMATIVO ***<br>NO ES FACTURA DE VENTA</div>
        <div class="ticket-separador"></div>
        <div class="ticket-centro ticket-negrita">Delipostres Venecia ${nombreSucursal}</div>
        ${direccion ? `<div class="ticket-centro">${direccion}</div>` : ''}
        ${telefono ? `<div class="ticket-centro">Tel: ${telefono}</div>` : ''}
        <div class="ticket-separador"></div>
        <div>Fecha: ${fechaTexto}</div>
        <div>Venta ID: ${String(ventaId || '').slice(0, 8)}</div>
        <div>M\u00e9todo: ${metodoPago}</div>
        <div class="ticket-separador"></div>
        <table class="ticket-tabla">
            <tbody>${filasItems}</tbody>
        </table>
        <div class="ticket-separador"></div>
        <div class="ticket-total">TOTAL: $${formatCOP(total)}</div>
        <div class="ticket-separador"></div>
        <div class="ticket-aviso">*** COMPROBANTE INFORMATIVO ***<br>NO ES FACTURA DE VENTA</div>
    `;
}

async function imprimirTicket(datosTicket) {
    const area = document.getElementById('area-ticket-impresion');
    if (area) area.innerHTML = construirTicketHTML(datosTicket);

    const res = await window.api.imprimirTicket({
        ...datosTicket,
        sucursalNombre: sucursalDetalle?.nombre || sucursalId,
        direccion: sucursalDetalle?.direccion || '',
        telefono: sucursalDetalle?.telefono || ''
    });
    if (!res.success) {
        alert(res.message);
    }
}
function actualizarEstadoDescuentoUI() {
    const chkDescuento = document.getElementById('chk-descuento');
    const selectDescuento = document.getElementById('select-descuento');
    const descuentoContainer = document.getElementById('descuento-input-container');

    if (!chkDescuento || !selectDescuento || !descuentoContainer) return;

    const hayPasteleria = carrito.some(item => esCategoriaPasteleria(item));
    const puedeAplicar = hayPasteleria;

    chkDescuento.disabled = !puedeAplicar;
    selectDescuento.disabled = !chkDescuento.checked || !puedeAplicar;

    if (!puedeAplicar) {
        chkDescuento.checked = false;
        selectDescuento.value = '';
        descuentoContainer.style.display = 'none';
    } else if (chkDescuento.checked) {
        descuentoContainer.style.display = 'flex';
        selectDescuento.disabled = false;
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    // Obtener ID de la sucursal actual de la base de datos
    const resId = await window.api.obtenerSucursalId();
    if (resId.success) {
        sucursalId = resId.id;
        const resSucursal = await window.api.obtenerSucursal(sucursalId);
        if (resSucursal.success && resSucursal.data) {
            sucursalDetalle = resSucursal.data;
        }
    }
    // 1. Mostrar información del usuario logueado en la barra lateral
    const user = localStorage.getItem('currentUser') || 'Invitado';
    const role = localStorage.getItem('currentRole') || 'Sin Rol';
    document.getElementById('display-user').innerText = user;
    document.getElementById('display-role').innerText = role;

    // Cargar carrito temporal si existe para que persista al cambiar de pestaña (excepto en ventanas secundarias)
    const queryParams = new URLSearchParams(window.location.search);
    const esNuevaVentana = queryParams.get('nueva_ventana') === 'true';

    if (!esNuevaVentana) {
        const savedCarrito = localStorage.getItem('carrito_temporal');
        if (savedCarrito) {
            try {
                carrito = JSON.parse(savedCarrito);
                renderizarCarrito();
            } catch (e) {
                console.error("Error al cargar carrito temporal:", e);
            }
        }
    }

    if (role === 'Administrador') {
        const btnAdmin = document.getElementById('btn-nav-admin');
        if (btnAdmin) btnAdmin.style.display = 'block';
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

    // Configurar cierre del modal de previsualización de imágenes
    const imagePreviewModal = document.getElementById('image-preview-modal');
    if (imagePreviewModal) {
        imagePreviewModal.addEventListener('click', () => {
            imagePreviewModal.style.display = 'none';
        });
    }

    // (normalizeStr is now global)

    // Modal post-venta: imprimir comprobante informativo o cerrar
    const modalPostVenta = document.getElementById('modal-post-venta');
    const btnImprimirComprobante = document.getElementById('btn-imprimir-comprobante');
    const btnCerrarPostVenta = document.getElementById('btn-cerrar-post-venta');
    if (btnImprimirComprobante) {
        btnImprimirComprobante.addEventListener('click', () => {
            if (ultimoTicket) imprimirTicket(ultimoTicket);
        });
    }
    if (btnCerrarPostVenta) {
        btnCerrarPostVenta.addEventListener('click', () => {
            if (modalPostVenta) modalPostVenta.style.display = 'none';
        });
    }

    // Buscador de productos en catálogo (insensible a tildes)
    const searchInput = document.getElementById('search-productos');
    const filterCat = document.getElementById('filter-categoria');

    // Cargar y montar el selector múltiple de categorías
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
        searchInput.addEventListener('input', () => {
            filtrarYRenderizarCatalogo();
        });
        searchInput.addEventListener('focus', () => {
            setTimeout(() => {
                if (document.activeElement !== searchInput) {
                    searchInput.focus();
                }
            }, 10);
        });
    }

    // Manejar selección visual de botones de método de pago
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
                btn.style.backgroundColor = 'var(--bg-accent)';
                btn.style.color = 'var(--text-primary)';
                btn.style.borderColor = 'var(--bg-accent)';
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
                // Reset inputs and auto-fill
                const total = calcularTotalVenta();
                if (inputEfectivo) inputEfectivo.value = formatNumberUI(total);
                if (inputTransferencia) inputTransferencia.value = "0";
            }
        }

        // Reset received amount and calculate change
        if (inputPagaCon) inputPagaCon.value = '';
        calcularCambio();
    };

    if (btnEfectivo) btnEfectivo.addEventListener('click', () => selectMethod('Efectivo'));
    if (btnTransferencia) btnTransferencia.addEventListener('click', () => selectMethod('Transferencia'));
    if (btnMixto) btnMixto.addEventListener('click', () => selectMethod('Mixto'));

    const autoCalculateMixto = (changedInput) => {
        let valorDomicilio = 0;
        const chkDomicilio = document.getElementById('chk-domicilio');
        if (chkDomicilio && chkDomicilio.checked) {
            const inputDom = document.getElementById('input-valor-domicilio');
            if (inputDom) valorDomicilio = parseNumberUI(inputDom.value);
        }
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

        let valorDomicilio = 0;
        const chkDomicilio = document.getElementById('chk-domicilio');
        if (chkDomicilio && chkDomicilio.checked) {
            const inputDom = document.getElementById('input-valor-domicilio');
            if (inputDom) valorDomicilio = parseNumberUI(inputDom.value);
        }
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

        // Parse received cash
        const rawPagaCon = parseNumberUI(inputPagaCon.value);
        inputPagaCon.value = rawPagaCon === 0 ? '' : formatNumberUI(rawPagaCon); // format on type

        if (rawPagaCon >= targetCashToPay && targetCashToPay > 0) {
            const cambio = rawPagaCon - targetCashToPay;
            displayCambio.innerText = formatCOP(cambio);
            displayCambio.style.color = '#15803d'; // Green
        } else {
            displayCambio.innerText = '$0';
            displayCambio.style.color = '#dc2626'; // Red if not enough
        }
    };

    window.triggerCalcularCambio = calcularCambio; // Expose to renderizarCarrito

    if (inputPagaCon) {
        inputPagaCon.addEventListener('input', calcularCambio);
        inputPagaCon.addEventListener('focus', function () { this.select(); });
    }

    // Manejar domicilio
    const chkDomicilio = document.getElementById('chk-domicilio');
    const inputDomicilio = document.getElementById('input-valor-domicilio');
    const domContainer = document.getElementById('domicilio-input-container');

    if (chkDomicilio && inputDomicilio && domContainer) {
        chkDomicilio.addEventListener('change', () => {
            const btnEfectivo = document.getElementById('btn-pay-efectivo');
            const btnMixto = document.getElementById('btn-pay-mixto');
            
            if (chkDomicilio.checked) {
                domContainer.style.display = 'flex';
                inputDomicilio.focus();
                
                // Forzar método de pago a Transferencia
                selectMethod('Transferencia');
                if (btnEfectivo) {
                    btnEfectivo.disabled = true;
                    btnEfectivo.style.opacity = '0.5';
                    btnEfectivo.style.cursor = 'not-allowed';
                }
                if (btnMixto) {
                    btnMixto.disabled = true;
                    btnMixto.style.opacity = '0.5';
                    btnMixto.style.cursor = 'not-allowed';
                }
            } else {
                domContainer.style.display = 'none';
                inputDomicilio.value = '';
                
                // Habilitar todos los métodos
                if (btnEfectivo) {
                    btnEfectivo.disabled = false;
                    btnEfectivo.style.opacity = '1';
                    btnEfectivo.style.cursor = 'pointer';
                }
                if (btnMixto) {
                    btnMixto.disabled = false;
                    btnMixto.style.opacity = '1';
                    btnMixto.style.cursor = 'pointer';
                }
            }
            renderizarCarrito();
            calcularCambio();
            
            // Si es mixto, recalcular
            if (metodoPagoSelected === 'Mixto') {
                autoCalculateMixto('efectivo');
            }
        });

        inputDomicilio.addEventListener('input', (e) => {
            e.target.value = formatNumberUI(e.target.value);
            renderizarCarrito();
            calcularCambio();
            
            // Si es mixto, recalcular
            if (metodoPagoSelected === 'Mixto') {
                autoCalculateMixto('efectivo');
            }
        });

        inputDomicilio.addEventListener('focus', function () {
            this.select();
        });
    }

    // Manejar descuento
    const chkDescuento = document.getElementById('chk-descuento');
    const selectDescuento = document.getElementById('select-descuento');
    const descuentoContainer = document.getElementById('descuento-input-container');

    if (chkDescuento && selectDescuento && descuentoContainer) {
        chkDescuento.addEventListener('change', () => {
            if (chkDescuento.checked) {
                descuentoContainer.style.display = 'flex';
                if (!selectDescuento.value) {
                    selectDescuento.value = '10';
                }
            } else {
                descuentoContainer.style.display = 'none';
                selectDescuento.value = '';
            }
            renderizarCarrito();
        });

        selectDescuento.addEventListener('change', () => {
            renderizarCarrito();
        });

        actualizarEstadoDescuentoUI();
    }

    // Cargar y rellenar selector de clientes para crédito
    const chkCredito = document.getElementById('chk-credito');
    const selectClienteCredito = document.getElementById('select-cliente-credito');
    const creditoContainer = document.getElementById('credito-input-container');

    if (chkCredito && selectClienteCredito && creditoContainer) {
        // Cargar clientes
        const resClientes = await window.api.obtenerClientes();
        if (resClientes.success && resClientes.data) {
            selectClienteCredito.innerHTML = '<option value="">-- Seleccionar Cliente --</option>';
            resClientes.data.forEach(cli => {
                const opt = document.createElement('option');
                opt.value = cli.id;
                opt.innerText = `${cli.nombre} (${cli.tipo} - ${cli.identificacion || 'Sin ID'})`;
                selectClienteCredito.appendChild(opt);
            });
        }

        chkCredito.addEventListener('change', () => {
            const mixtoContainer = document.getElementById('mixto-inputs-container');
            const changeContainer = document.getElementById('cash-change-container');

            if (chkCredito.checked) {
                creditoContainer.style.display = 'flex';
                selectClienteCredito.focus();
                
                // Desactivar y desmarcar domicilio si está marcado
                const chkDomicilio = document.getElementById('chk-domicilio');
                if (chkDomicilio && chkDomicilio.checked) {
                    chkDomicilio.checked = false;
                    chkDomicilio.dispatchEvent(new Event('change'));
                }
                
                // Deshabilitar botones de método de pago
                const buttons = document.querySelectorAll('#payment-methods-container button');
                buttons.forEach(btn => {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.style.backgroundColor = 'var(--bg-accent)';
                    btn.style.color = 'var(--text-primary)';
                });
                
                if (mixtoContainer) mixtoContainer.style.display = 'none';
                if (changeContainer) changeContainer.style.display = 'none';
                
                metodoPagoSelected = 'Crédito';
            } else {
                creditoContainer.style.display = 'none';
                selectClienteCredito.value = '';
                
                // Re-habilitar botones de método de pago
                const buttons = document.querySelectorAll('#payment-methods-container button');
                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                });
                
                // Volver a seleccionar Efectivo por defecto
                selectMethod('Efectivo');
            }
        });
    }

    // 2. Cargar catálogo de productos
    await cargarCatalogo();

    // Escuchar actualizaciones de inventario en tiempo real
    if (window.api && window.api.onInventarioActualizado) {
        window.api.onInventarioActualizado(() => {
            cargarCatalogo();
        });
    }

    // Al terminar una sincronización, refrescar solo el catálogo (precios/stock).
    // El carrito activo (persistido en localStorage) y los inputs del formulario no se tocan.
    window.addEventListener('pos-sincronizacion-completa', () => {
        cargarCatalogo();
    });
});

function filtrarYRenderizarCatalogo() {
    const searchInput = document.getElementById('search-productos');

    let query = "";
    if (searchInput) {
        query = normalizeStr(searchInput.value);
    }

    // Selección del filtro múltiple de categorías: puede traer 'disponibles', 'negativos' y/o ids
    // de categoría reales combinados (ej. "Disponibles" + "Tortas Frías Libra" para ver qué hay
    // disponible solo de esa categoría).
    const seleccion = filtroCategorias ? filtroCategorias.getSeleccion() : new Set();
    const filtrarDisponibles = seleccion.has('disponibles');
    const filtrarNegativos = seleccion.has('negativos');
    const catIdsSeleccionadas = [...seleccion].filter(id => id !== 'disponibles' && id !== 'negativos');
    let allowedCatIds = [];
    catIdsSeleccionadas.forEach(catId => {
        allowedCatIds.push(catId);
        // Agregar subcategorías
        const subcats = categoriasCargadas.filter(cat => cat.categoria_padre_id === catId);
        subcats.forEach(sub => {
            allowedCatIds.push(sub.id);
        });
    });

    const productosFiltrados = productosLocales.filter(prod => {
        // Filtro de estado de stock: si hay alguna opción marcada, el producto debe cumplir al
        // menos una (disponible con stock>0, o negativo con stock<0).
        if (filtrarDisponibles || filtrarNegativos) {
            const stock = Number(prod.stock || 0);
            const cumpleDisponible = filtrarDisponibles && stock > 0;
            const cumpleNegativo = filtrarNegativos && stock < 0;
            if (!cumpleDisponible && !cumpleNegativo) return false;
        }
        // Filtro por categoría (unión entre las categorías marcadas)
        if (catIdsSeleccionadas.length > 0 && !allowedCatIds.includes(prod.categoria_id)) {
            return false;
        }
        // Filtro por término de búsqueda
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
        // Ordenar alfabéticamente por nombre
        productosLocales.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }));
        // La opción "Con Unidades Negativas" del filtro solo se ofrece mientras exista al menos un
        // producto con stock negativo en esta sucursal (ver punto 3 de negativos al cerrar sesión).
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
            const sinStock = Number(prod.stock) <= 0;
            const stockBajo = Number(prod.stock) <= (Number(prod.stock_minimo) || 2) && !sinStock;
            const productoNombre = prod.nombre || prod.name || prod.producto_nombre || 'Sin nombre';
            const productoPrecio = Number(prod.precio ?? prod.price ?? 0);
            const productoStock = Number(prod.stock ?? 0);

            // Ya no se deshabilita la tarjeta cuando no hay stock: se permite vender productos
            // agotados (quedan con inventario negativo), pidiendo confirmación al cobrar.
            card.className = 'product-card';

            const imgUrl = (prod.foto_path && (prod.foto_path.startsWith('http') || prod.foto_path.startsWith('file:///')))
                ? prod.foto_path
                : (prod.foto_path ? `app-image://${prod.foto_path}` : 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200');

            let badgeHtml = '';
            if (sinStock) {
                badgeHtml = `<span style="background-color: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: bold; flex-shrink: 0;">Agotado</span>`;
            } else if (stockBajo) {
                badgeHtml = `<span style="background-color: #fef3c7; color: #d97706; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: bold; flex-shrink: 0;">Pocas Uds.</span>`;
            }

            card.innerHTML = `
                <div style="position: relative; width: 100% !important; height: 90px !important;">
                    <img src="${imgUrl}" alt="${productoNombre}" style="width: 100% !important; height: 90px !important; object-fit: cover !important; border-radius: 6px !important; display: block !important;">
                    <div style="position: absolute; top: 4px; right: 4px; display: flex; flex-direction: column; gap: 4px; align-items: flex-end; z-index: 5;">
                        ${badgeHtml}
                    </div>
                    <button class="eye-preview-btn" style="position: absolute; bottom: 4px; right: 4px; background-color: rgba(255, 255, 255, 0.9); border: 1px solid #d1d5db; border-radius: 50%; width: 26px; height: 26px; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.15); z-index: 6; font-size: 0.9em; padding: 0;" title="Ver imagen en grande">
                        👁️
                    </button>
                </div>
                <div class="product-card-body" style="width: 100% !important; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; padding-top: 4px;">
                    <div style="margin-bottom: 6px;">
                        <div style="font-size: 0.8em; font-weight: 600; color: #111827; line-height: 1.25; min-height: 2.5em; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${productoNombre}</div>
                    </div>
                    <div>
                        <div class="product-price" style="color: #059669; font-weight: 700; font-size: 0.95em; text-align: center;">${formatCOP(productoPrecio)}</div>
                        <div class="product-stock" style="font-size: 0.75em; color: #6b7280; text-align: center;">Disp: <strong>${productoStock}</strong></div>
                    </div>
                </div>
            `;

            // Event listener para abrir la previsualización al dar click en el ojo
            const eyeBtn = card.querySelector('.eye-preview-btn');
            if (eyeBtn) {
                eyeBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evita que se agregue al carrito al dar clic en el ojo
                    const modal = document.getElementById('image-preview-modal');
                    const modalImg = document.getElementById('image-preview-src');
                    if (modal && modalImg) {
                        modalImg.src = imgUrl;
                        modal.style.display = 'flex';
                    }
                });
            }

            // Al hacer clic en cualquier parte de la tarjeta (incluyendo la foto o textos) se agrega al
            // carrito, incluso sin stock disponible (la confirmación se pide al momento de cobrar).
            card.addEventListener('click', () => agregarAlCarrito(prod));

            grid.appendChild(card);
        });
    } else {
        grid.innerHTML = '<p style="text-align: center; color: #6b7280; width:100%; margin-top: 40px;">No se encontraron productos.</p>';
    }
}

function agregarAlCarrito(producto) {
    // Verificar si el producto ya está en el carrito
    const itemExistente = carrito.find(item => item.id === producto.id);

    const stockDisponible = Number(producto.stock ?? 0);

    if (itemExistente) {
        // Si no hay stock (0 o negativo) se permite seguir sumando unidades sin límite: la venta
        // quedará pendiente de abastecimiento. Con stock disponible, se sigue topando ahí.
        if (stockDisponible <= 0 || itemExistente.cantidad < stockDisponible) {
            itemExistente.cantidad++;
        } else {
            alert(`No puedes agregar más unidades de ${producto.nombre}. Stock máximo alcanzado.`);
            return;
        }
    } else {
        // Agregamos por primera vez
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            stockMaximo: stockDisponible,
            categoria_id: producto.categoria_id,
            categoria_nombre: producto.categoria_nombre || producto.categoria || ''
        });
    }

    renderizarCarrito();
    guardarCarritoTemporal();
}

function cambiarCantidad(productoId, delta) {
    const item = carrito.find(item => item.id === productoId);
    if (!item) return;

    item.cantidad += delta;

    // Si la cantidad llega a 0, eliminar el producto del carrito
    if (item.cantidad <= 0) {
        carrito = carrito.filter(i => i.id !== productoId);
    } else if (item.stockMaximo > 0 && item.cantidad > item.stockMaximo) {
        // Impedir que suba del stock disponible (si ya estaba en 0 o negativo, no hay límite:
        // la venta se registrará igual, pidiendo confirmación al cobrar).
        item.cantidad = item.stockMaximo;
        alert("Límite de stock disponible alcanzado.");
    }

    actualizarEstadoDescuentoUI();
    renderizarCarrito();
    guardarCarritoTemporal();
}

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

    const totalFinal = calcularTotalVenta();
    cartTotal.innerText = formatCOP(totalFinal);

    // Auto-scroll al final del carrito para mostrar siempre el último producto agregado
    cartList.scrollTop = cartList.scrollHeight;

    // Si el método de pago es Mixto, recalcular los montos
    if (metodoPagoSelected === 'Mixto') {
        const inputEfectivo = document.getElementById('input-mixto-efectivo');
        const inputTransferencia = document.getElementById('input-mixto-transferencia');
        if (inputEfectivo && inputTransferencia) {
            inputEfectivo.value = formatNumberUI(totalAcumulado);
            inputTransferencia.value = "0";
        }
    }

    if (window.triggerCalcularCambio) {
        window.triggerCalcularCambio();
    }
}

function setProcessingState(isProcessing) {
    const cobrarBtn = document.getElementById('btn-cobrar');
    if (!cobrarBtn) return;
    cobrarBtn.disabled = isProcessing;
    cobrarBtn.innerText = isProcessing ? 'Procesando...' : 'Registrar y Cobrar';
    cobrarBtn.style.opacity = isProcessing ? '0.75' : '1';
    cobrarBtn.style.cursor = isProcessing ? 'wait' : 'pointer';
}

function limpiarEstadoVenta() {
    carrito = [];

    try {
        localStorage.setItem('carrito_temporal', JSON.stringify(carrito));
    } catch (e) {
        console.error('No se pudo actualizar carrito temporal:', e);
    }

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
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });

    if (btnEfectivo && btnTransferencia && btnMixto) {
        metodoPagoSelected = 'Efectivo';
        btnEfectivo.style.backgroundColor = 'var(--brand-color)';
        btnEfectivo.style.color = 'white';
        btnEfectivo.style.borderColor = 'var(--brand-color)';

        btnTransferencia.style.backgroundColor = 'var(--bg-accent)';
        btnTransferencia.style.color = 'var(--text-primary)';
        btnTransferencia.style.borderColor = 'var(--bg-accent)';

        btnMixto.style.backgroundColor = 'var(--bg-accent)';
        btnMixto.style.color = 'var(--text-primary)';
        btnMixto.style.borderColor = 'var(--bg-accent)';

        if (mixtoContainer) mixtoContainer.style.display = 'none';
    }

    if (inputPagaCon) inputPagaCon.value = '';
    if (displayCambio) displayCambio.innerText = '$0';
}

// Procesar el pago y registrar en base de datos
document.getElementById('btn-cobrar').addEventListener('click', async () => {
    if (carrito.length === 0) {
        alert("El carrito está vacío. Agrega productos para cobrar.");
        return;
    }

    if (document.getElementById('btn-cobrar').disabled) return;

    // Vender con inventario insuficiente (típicamente 0) está permitido, pero requiere
    // confirmación explícita: el producto quedará con stock negativo hasta el próximo abastecimiento.
    const itemsSinStockSuficiente = carrito.filter(item => item.cantidad > Number(item.stockMaximo ?? 0));
    if (itemsSinStockSuficiente.length > 0) {
        const listado = itemsSinStockSuficiente
            .map(i => `• ${i.nombre} (x${i.cantidad}, disponible: ${Number(i.stockMaximo ?? 0)})`)
            .join('\n');
        const continuar = confirm(
            `Los siguientes productos no tienen inventario suficiente y quedarán con stock negativo tras esta venta:\n\n${listado}\n\n¿Deseas continuar de todas formas?`
        );
        if (!continuar) return;
    }

    setProcessingState(true);
    let metodoPago = metodoPagoSelected;
    try {
        const chkCredito = document.getElementById('chk-credito');
        const selectClienteCredito = document.getElementById('select-cliente-credito');
        const esCredito = chkCredito && chkCredito.checked;
        let clienteId = null;

        // Calculamos el total incluyendo domicilio y descuento
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
                alert(`El total de los montos ingresados (${formatCOP(efVal + trVal)}) debe coincidir con el total a pagar (${formatCOP(total)}).`);
                setProcessingState(false);
                return;
            }
            metodoPago = `Mixto (Efectivo: ${efVal}, Transferencia: ${trVal})`;
        }

        if (esDomicilio) {
            metodoPago += ` (Domicilio: ${formatCOP(valorDomicilio)})`;
        }

        const porcentajeDescuento = obtenerPorcentajeDescuento();
        const descuentoAplicado = porcentajeDescuento > 0 ? porcentajeDescuento : 0;

        const auditoriaUsuario = localStorage.getItem('currentUser') || 'Invitado';
        const auditoriaRol = localStorage.getItem('currentRole') || 'Sin Rol';

        const payload = {
            sucursalId: sucursalId,
            metodoPago: metodoPago,
            total: total,
            carrito: carrito,
            valorDomicilio: valorDomicilio,
            auditoriaUsuario: auditoriaUsuario,
            auditoriaRol: auditoriaRol,
            es_credito: esCredito ? 1 : 0,
            cliente_id: clienteId,
            descuento_porcentaje: descuentoAplicado
        };

        // Llamamos a la base de datos a través de Electron (IPC)
        const response = await window.api.registrarVenta(payload);

        if (response.success) {
            const carritoProcesado = carrito;
            ultimoTicket = {
                ventaId: response.ventaId,
                fecha: new Date().toISOString(),
                items: carritoProcesado.map(i => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
                total,
                metodoPago
            };
            limpiarEstadoVenta();

            const msgEl = document.getElementById('post-venta-msg');
            if (msgEl) msgEl.innerText = response.message;
            const modalPostVenta = document.getElementById('modal-post-venta');
            if (modalPostVenta) modalPostVenta.style.display = 'flex';

            productosLocales = productosLocales.map(prod => {
                const item = carritoProcesado.find(i => i.id === prod.id);
                if (item) {
                    // Sin Math.max(0, ...): si la venta se confirmó sin stock suficiente, el
                    // catálogo debe reflejar el saldo real (negativo) hasta el próximo abastecimiento.
                    const stockActual = Number(prod.stock ?? 0);
                    prod.stock = stockActual - item.cantidad;
                }
                return prod;
            });
            filtrarYRenderizarCatalogo();
            const searchInput = document.getElementById('search-productos');
            if (searchInput) {
                searchInput.value = '';
                setTimeout(() => {
                    searchInput.focus();
                    searchInput.select();
                }, 50);
            }

        } else {
            alert(`Error: ${response.message}`);
        }
    } finally {
        setProcessingState(false);
    }
});

// Manejo del botón de cerrar sesión
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        carrito = [];
        try {
            localStorage.setItem('carrito_temporal', '[]');
        } catch (e) {
            console.error('No se pudo limpiar carrito temporal al cerrar sesión:', e);
        }
        localStorage.clear();
        window.location.href = 'index.html';
    });
}

undefined


undefined