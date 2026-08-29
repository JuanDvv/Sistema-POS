// Corregir bug de pérdida de foco en Electron al cerrar diálogos nativos en Windows (mismo fix
// que usan ventas.js/reportes.js/ventas-anteriores.js).
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

let productosLocales = [];
let categoriasCargadas = [];
let filtroCategorias = null;
let clientesCargados = [];
let mapaClientesPorEtiqueta = new Map();
let carrito = [];          // Carrito de la pestaña "Nuevo Pedido"
let carritoDetalle = [];   // Carrito del modal de detalle (edición de un pedido existente)
let sucursalId = 'sucursal-norte';
let sucursalDetalle = null;
// Sucursal cuyo listado de pedidos se está viendo en la pestaña "Listado de Pedidos". Separada de
// `sucursalId` (la sucursal ACTIVA de este equipo, usada para crear pedidos y consultar su propio
// inventario) porque un Administrador puede querer revisar los pedidos de otra sucursal sin
// activarla en este PC (ver selector en la pestaña Listado, solo visible para su rol).
let sucursalListadoId = null;
let pedidoActualId = null;
let pedidoActualDetalle = null; // snapshot de la última respuesta de obtenerDetallePedido, para reimprimir

const auditoriaUsuario = localStorage.getItem('currentUser') || 'Invitado';
const auditoriaRol = localStorage.getItem('currentRole') || 'Sin Rol';

const formatCOP = (val) => `$${Math.round(Number(val) || 0).toLocaleString('es-CO')}`;
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
    return String(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
};

function formatFechaLegible(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

// Formatea celulares colombianos (10 dígitos) como "XXX XXX-XXXX" para lectura rápida.
// Números que no calzan en 10 dígitos (fijos, extensiones, datos importados) se muestran tal cual.
function formatTelefono(tel) {
    if (!tel) return '-';
    const digitos = String(tel).replace(/\D/g, '');
    if (digitos.length !== 10) return tel;
    return `${digitos.slice(0, 3)} ${digitos.slice(3, 6)}-${digitos.slice(6)}`;
}

// La hora de entrega estimada es opcional: cuando el usuario no la indica, se guarda el día completo
// usando las 23:59:59 locales como marca. Un <input type="time"> nunca produce segundos != 00, así que
// este valor nunca se confunde con una hora real ingresada a mano.
function combinarFechaHoraEntrega(fechaStr, horaStr) {
    if (!fechaStr) return null;
    const horaFinal = horaStr ? `${horaStr}:00` : '23:59:59';
    return new Date(`${fechaStr}T${horaFinal}`).toISOString();
}

function entregaTieneHoraEspecifica(iso) {
    if (!iso) return false;
    return new Date(iso).getSeconds() !== 59;
}

function formatFechaEntregaLegible(iso) {
    if (!iso) return '-';
    const opciones = entregaTieneHoraEspecifica(iso)
        ? { dateStyle: 'medium', timeStyle: 'short' }
        : { dateStyle: 'medium' };
    return new Date(iso).toLocaleString('es-CO', opciones);
}

// Variantes para celdas de tabla: fecha arriba y hora abajo (en vez de todo en una sola línea que
// termina partiéndose en un punto cualquiera cuando la columna es angosta).
function formatFechaHoraCelda(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    const fecha = d.toLocaleDateString('es-CO', { dateStyle: 'medium' });
    const hora = d.toLocaleTimeString('es-CO', { timeStyle: 'short' });
    return `<div>${fecha}</div><div style="color: #6b7280; font-size: 0.85em;">${hora}</div>`;
}

function formatFechaEntregaCelda(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    const fecha = d.toLocaleDateString('es-CO', { dateStyle: 'medium' });
    if (!entregaTieneHoraEspecifica(iso)) return fecha;
    const hora = d.toLocaleTimeString('es-CO', { timeStyle: 'short' });
    return `<div>${fecha}</div><div style="color: #6b7280; font-size: 0.85em;">${hora}</div>`;
}

// Separa un ISO de entrega estimada en sus componentes {fecha, hora} para precargar los inputs
// separados del formulario de edición. Si es el marcador de "sin hora", hora vuelve vacía.
function separarFechaHoraEntrega(iso) {
    if (!iso) return { fecha: '', hora: '' };
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { fecha: '', hora: '' };
    const pad = n => String(n).padStart(2, '0');
    const fecha = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const hora = entregaTieneHoraEspecifica(iso) ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
    return { fecha, hora };
}

// ==================== CARRITO (compartido por "Nuevo Pedido" y el modal de detalle) ====================

function renderizarCarritoEn(carritoArr, listElId, totalElId, onCambiar) {
    const listEl = document.getElementById(listElId);
    const totalEl = totalElId ? document.getElementById(totalElId) : null;
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!carritoArr.length) {
        listEl.innerHTML = '<p style="color: #6b7280; text-align: center; margin: 20px 0;">Sin productos.</p>';
        if (totalEl) totalEl.innerText = formatCOP(0);
        return;
    }

    let total = 0;
    carritoArr.forEach(item => {
        const subtotal = Number(item.precio) * Number(item.cantidad);
        total += subtotal;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <h5 style="margin: 0; font-size: 0.9em;">${item.nombre}</h5>
                <span style="font-size: 0.8em; color: #6b7280;">${formatCOP(item.precio)} c/u</span>
            </div>
            <div class="cart-controls" style="display: flex; align-items: center; gap: 8px;">
                <button class="cart-btn" data-action="menos" data-id="${item.id}">-</button>
                <span>${item.cantidad}</span>
                <button class="cart-btn" data-action="mas" data-id="${item.id}">+</button>
                <strong style="min-width: 75px; text-align: right;">${formatCOP(subtotal)}</strong>
            </div>
        `;
        listEl.appendChild(div);
    });

    if (totalEl) totalEl.innerText = formatCOP(total);

    listEl.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const delta = btn.dataset.action === 'mas' ? 1 : -1;
            onCambiar(btn.dataset.id, delta);
        });
    });
}

// Lee el valor del domicilio de un checkbox+input (compartido por "Nuevo Pedido" y el modal de
// detalle): 0 si el checkbox no está marcado, igual que el patrón de ventas.js/ventas-anteriores.js.
function leerValorDomicilio(chkId, inputId) {
    const chk = document.getElementById(chkId);
    const input = document.getElementById(inputId);
    if (chk && chk.checked && input) return parseNumberUI(input.value);
    return 0;
}

// Cablea el checkbox+input de domicilio (mostrar/ocultar el input, formatear mientras se escribe,
// refrescar el total mostrado con cada cambio) -- mismo patrón que chkDomicilio en ventas.js.
function configurarDomicilioUI(chkId, inputId, containerId, onCambiar) {
    const chk = document.getElementById(chkId);
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);
    if (!chk || !input || !container) return;

    chk.addEventListener('change', () => {
        if (chk.checked) {
            container.style.display = 'block';
            input.focus();
        } else {
            container.style.display = 'none';
            input.value = '';
        }
        onCambiar();
    });

    input.addEventListener('input', (e) => {
        e.target.value = formatNumberUI(e.target.value);
        onCambiar();
    });

    input.addEventListener('focus', function () { this.select(); });
}

function renderizarCarritoPedido() {
    renderizarCarritoEn(carrito, 'cart-list-pedido', 'cart-total-pedido', cambiarCantidadPedido);
    const valorDomicilio = leerValorDomicilio('pedido-chk-domicilio', 'pedido-input-domicilio');
    if (valorDomicilio > 0) {
        const totalProductos = carrito.reduce((sum, i) => sum + Number(i.precio) * Number(i.cantidad), 0);
        document.getElementById('cart-total-pedido').innerText = formatCOP(totalProductos + valorDomicilio);
    }
}

function cambiarCantidadPedido(id, delta) {
    const item = carrito.find(i => i.id === id);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) carrito = carrito.filter(i => i.id !== id);
    renderizarCarritoPedido();
}

function agregarAlCarritoPedido(prod) {
    const existente = carrito.find(i => i.id === prod.id);
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            id: prod.id,
            nombre: prod.nombre,
            precio: Number(prod.precio || 0),
            cantidad: 1,
            disponible: Number(prod.stock || 0) - Number(prod.stock_reservado || 0)
        });
    }
    renderizarCarritoPedido();
}

function renderizarCarritoDetalle() {
    renderizarCarritoEn(carritoDetalle, 'detalle-cart-list', 'detalle-total', cambiarCantidadDetalle);
    const valorDomicilio = leerValorDomicilio('detalle-chk-domicilio', 'detalle-input-domicilio');
    const totalProductos = carritoDetalle.reduce((sum, i) => sum + Number(i.precio) * Number(i.cantidad), 0);
    const totalActual = totalProductos + valorDomicilio;
    if (valorDomicilio > 0) {
        document.getElementById('detalle-total').innerText = formatCOP(totalActual);
    }
    actualizarSaldoPendienteDetalle(totalActual);

    if (pedidoActualDetalle && pedidoActualDetalle.pedido.estado !== 'pendiente') {
        document.querySelectorAll('#detalle-cart-list .cart-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.display = 'none';
        });
    }
}

// El "Saldo Pendiente" venía quedando congelado con el valor con el que se abrió el modal: al
// agregar un producto o marcar domicilio, el "Total" de arriba se recalculaba al instante pero el
// saldo pendiente no, así que mostraban números que ya no cuadraban entre sí hasta guardar los
// cambios (y hacer un viaje redondo al servidor). Lo abonado no cambia al editar productos/domicilio
// (son abonos ya registrados), así que se puede derivar sin otra consulta: total guardado - saldo
// guardado = abonado.
function actualizarSaldoPendienteDetalle(totalActual) {
    const saldoEl = document.getElementById('detalle-saldo-pendiente');
    if (!saldoEl || !pedidoActualDetalle) return;
    const abonado = Number(pedidoActualDetalle.pedido.total) - Number(pedidoActualDetalle.saldo_pendiente);
    saldoEl.innerText = formatCOP(totalActual - abonado);
}

function cambiarCantidadDetalle(id, delta) {
    const item = carritoDetalle.find(i => i.id === id);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) carritoDetalle = carritoDetalle.filter(i => i.id !== id);
    renderizarCarritoDetalle();
}

// ==================== CATÁLOGO DE PRODUCTOS (pestaña "Nuevo Pedido") ====================

async function cargarCatalogo() {
    const response = await window.api.getInventory(sucursalId);
    if (!response.success) {
        alert("Error al cargar inventario: " + response.message);
        return;
    }
    productosLocales = (response.data || []).slice().sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }));

    filtrarYRenderizarCatalogoPedido();
}

function filtrarYRenderizarCatalogoPedido() {
    const searchInput = document.getElementById('search-productos-pedido');
    const query = searchInput ? normalizeStr(searchInput.value) : '';

    const seleccion = filtroCategorias ? filtroCategorias.getSeleccion() : new Set();
    const catIdsSeleccionadas = [...seleccion].filter(id => id !== 'disponibles' && id !== 'negativos');
    let allowedCatIds = [];
    catIdsSeleccionadas.forEach(catId => {
        allowedCatIds.push(catId);
        categoriasCargadas.filter(cat => cat.categoria_padre_id === catId).forEach(sub => allowedCatIds.push(sub.id));
    });

    const productosFiltrados = productosLocales.filter(prod => {
        if (catIdsSeleccionadas.length > 0 && !allowedCatIds.includes(prod.categoria_id)) return false;
        if (query) {
            const nombre = normalizeStr(prod.nombre);
            const desc = normalizeStr(prod.descripcion || '');
            return query.split(/\s+/).filter(Boolean).every(term => nombre.includes(term) || desc.includes(term));
        }
        return true;
    });

    renderizarGridPedido(productosFiltrados);
}

function renderizarGridPedido(productos) {
    const grid = document.getElementById('grid-products-pedido');
    grid.innerHTML = '';

    if (productos.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #6b7280; width: 100%; margin-top: 40px;">No se encontraron productos.</p>';
        return;
    }

    productos.forEach(prod => {
        const disponible = Number(prod.stock || 0) - Number(prod.stock_reservado || 0);
        const card = document.createElement('div');
        card.className = 'product-card';

        const imgUrl = (prod.foto_path && (prod.foto_path.startsWith('http') || prod.foto_path.startsWith('file:///')))
            ? prod.foto_path
            : (prod.foto_path ? `app-image://${prod.foto_path}` : 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200');

        card.innerHTML = `
            <img src="${imgUrl}" alt="${prod.nombre}">
            <div class="product-card-body">
                <h4>${prod.nombre}</h4>
                <p class="product-price">${formatCOP(prod.precio)}</p>
                <p class="product-stock">Disp: <strong>${disponible}</strong>${Number(prod.stock_reservado || 0) > 0 ? ` (Reservado: ${prod.stock_reservado})` : ''}</p>
            </div>
        `;
        card.addEventListener('click', () => agregarAlCarritoPedido(prod));
        grid.appendChild(card);
    });
}

// ==================== CLIENTES (autocompletar en "Nuevo Pedido") ====================

async function cargarClientes() {
    const res = await window.api.obtenerClientes();
    if (!res.success) return;
    clientesCargados = (res.data || []).filter(cli => (cli.origen || 'Credito') === 'Pedido');

    mapaClientesPorEtiqueta = new Map();
    const datalist = document.getElementById('datalist-clientes');
    if (datalist) {
        datalist.innerHTML = clientesCargados.map(cli => {
            const etiqueta = `${cli.nombre} (${cli.telefono || 's/n'})`;
            mapaClientesPorEtiqueta.set(etiqueta, cli);
            return `<option value="${etiqueta}">`;
        }).join('');
    }
}

function manejarSeleccionClienteAutocompletar() {
    const inputNombre = document.getElementById('pedido-cliente-nombre');
    const valor = inputNombre.value;
    const cliente = mapaClientesPorEtiqueta.get(valor);
    if (cliente) {
        document.getElementById('pedido-cliente-id').value = cliente.id;
        document.getElementById('pedido-cliente-nombre').value = cliente.nombre;
        document.getElementById('pedido-cliente-identificacion').value = cliente.identificacion || '';
        document.getElementById('pedido-cliente-telefono').value = cliente.telefono || '';
    } else {
        document.getElementById('pedido-cliente-id').value = '';
    }
}

// ==================== CREAR PEDIDO ====================

function limpiarFormularioNuevoPedido() {
    carrito = [];
    renderizarCarritoPedido();
    document.getElementById('pedido-cliente-id').value = '';
    document.getElementById('pedido-cliente-nombre').value = '';
    document.getElementById('pedido-cliente-identificacion').value = '';
    document.getElementById('pedido-cliente-telefono').value = '';
    document.getElementById('pedido-fecha-entrega').value = '';
    document.getElementById('pedido-hora-entrega').value = '';
    document.getElementById('pedido-notas').value = '';
    document.getElementById('pedido-abono-monto').value = '';
    document.getElementById('pedido-chk-domicilio').checked = false;
    document.getElementById('pedido-input-domicilio').value = '';
    document.getElementById('pedido-domicilio-container').style.display = 'none';
}

async function registrarPedido() {
    if (carrito.length === 0) {
        alert('Agrega al menos un producto al pedido.');
        return;
    }
    const clienteId = document.getElementById('pedido-cliente-id').value || null;
    const clienteNombre = document.getElementById('pedido-cliente-nombre').value.trim();
    const clienteIdentificacion = document.getElementById('pedido-cliente-identificacion').value.trim();
    const clienteTelefono = document.getElementById('pedido-cliente-telefono').value.trim();
    const fechaEntregaInput = document.getElementById('pedido-fecha-entrega').value;
    const horaEntregaInput = document.getElementById('pedido-hora-entrega').value;
    const notas = document.getElementById('pedido-notas').value.trim();
    const abonoMonto = parseNumberUI(document.getElementById('pedido-abono-monto').value);
    const abonoMetodo = document.getElementById('pedido-abono-metodo').value;

    if (!clienteNombre || !clienteTelefono) {
        alert('El nombre y el teléfono del cliente son obligatorios.');
        return;
    }
    if (!fechaEntregaInput) {
        alert('Selecciona la fecha estimada de entrega.');
        return;
    }

    const excedidos = carrito.filter(item => item.disponible > 0 && item.cantidad > item.disponible);
    if (excedidos.length > 0) {
        const listado = excedidos.map(i => `• ${i.nombre} (x${i.cantidad}, disponible: ${i.disponible})`).join('\n');
        if (!confirm(`Los siguientes productos no tienen suficiente inventario disponible (ya considerando otros apartados):\n\n${listado}\n\n¿Deseas continuar de todas formas?`)) {
            return;
        }
    }

    const fechaEntregaEstimada = combinarFechaHoraEntrega(fechaEntregaInput, horaEntregaInput);
    const valorDomicilio = leerValorDomicilio('pedido-chk-domicilio', 'pedido-input-domicilio');
    const total = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0) + valorDomicilio;

    const datos = {
        sucursalId, clienteId, clienteNombre, clienteIdentificacion, clienteTelefono,
        fechaEntregaEstimada, carrito, notas, valorDomicilio,
        abonoInicial: abonoMonto > 0 ? { monto: abonoMonto, metodoPago: abonoMetodo } : null,
        auditoriaUsuario, auditoriaRol
    };

    const res = await window.api.crearPedido(datos);
    if (!res.success) {
        alert(res.message);
        return;
    }

    const itemsTicket = carrito.map(i => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio }));
    if (valorDomicilio > 0) itemsTicket.push({ nombre: 'Domicilio (Envío)', cantidad: 1, precio: valorDomicilio });

    const ticketDatos = {
        pedidoId: res.pedidoId,
        clienteNombre, clienteIdentificacion, clienteTelefono,
        fechaPedido: new Date().toISOString(),
        fechaEntregaEstimada,
        items: itemsTicket,
        total,
        abonado: abonoMonto > 0 ? abonoMonto : 0,
        saldoPendiente: total - (abonoMonto > 0 ? abonoMonto : 0),
        sucursalNombre: sucursalDetalle?.nombre || sucursalId,
        direccion: sucursalDetalle?.direccion || '',
        telefono: sucursalDetalle?.telefono || ''
    };

    document.getElementById('post-pedido-msg').innerText = res.message;
    document.getElementById('modal-post-pedido').dataset.ticket = JSON.stringify(ticketDatos);
    document.getElementById('modal-post-pedido').style.display = 'flex';

    limpiarFormularioNuevoPedido();
    cargarCatalogo();
    cargarClientes();
    cambiarTab('listado');
    // Activa "Creados hoy" para que el pedido recién registrado quede como primera fila visible,
    // sin importar qué tan lejos esté su fecha de entrega ni cuántos pedidos pendientes haya.
    document.getElementById('filtro-creados-hoy').checked = true;
    cargarPedidos();
}

// ==================== LISTADO DE PEDIDOS ====================

function badgeEstado(estado) {
    const etiquetas = { pendiente: 'Pendiente', entregado: 'Entregado', cancelado: 'Cancelado' };
    return `<span class="estado-badge estado-${estado}">${etiquetas[estado] || estado}</span>`;
}

async function cargarPedidos() {
    const busqueda = document.getElementById('busqueda-pedidos').value.trim();
    const estado = document.getElementById('filtro-estado-pedidos').value;
    const soloHoy = document.getElementById('filtro-creados-hoy').checked;
    const res = await window.api.obtenerPedidos({ sucursalId: sucursalListadoId || sucursalId, estado: estado || undefined, busqueda: busqueda || undefined, soloHoy: soloHoy || undefined });
    if (!res.success) {
        alert(res.message);
        return;
    }
    // Con "Creados hoy" o "Entregados hoy" el backend ya ordena por fecha más reciente primero,
    // así que no tiene sentido volver a agrupar por fecha de entrega: mostramos la lista plana.
    const agrupar = !soloHoy && estado !== 'entregados_hoy';
    renderizarTablaPedidos(res.data || [], agrupar);
}

// Etiqueta del encabezado de grupo: el día de entrega, sin hora (agrupamos por día calendario).
function formatFechaGrupo(iso) {
    if (!iso) return 'Sin fecha de entrega';
    const texto = new Date(iso).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Clave de agrupación por día calendario LOCAL. fecha_entrega_estimada se guarda con toISOString()
// (UTC), así que tomar los primeros 10 caracteres del string agruparía por día calendario UTC en vez
// de local, desalineando pedidos cercanos a la medianoche del encabezado (que sí usa hora local).
function claveGrupoEntrega(iso) {
    if (!iso) return 'sin-fecha';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'sin-fecha';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function renderizarTablaPedidos(pedidos, agruparPorEntrega = true) {
    const tbody = document.getElementById('tbody-pedidos');
    tbody.innerHTML = '';

    if (pedidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #6b7280; padding: 20px;">No hay pedidos que coincidan con la búsqueda.</td></tr>';
        return;
    }

    // El backend ya ordena por fecha_entrega_estimada ASC, así que agrupar en ese mismo orden
    // deja los grupos de entrega más próxima primero. Cuando se desactiva (ver "Creados hoy"),
    // se respeta el orden del backend (fecha_pedido DESC) sin encabezados de grupo.
    const ahora = new Date();
    let claveGrupoActual = null;
    pedidos.forEach(p => {
        if (agruparPorEntrega) {
            const claveGrupo = claveGrupoEntrega(p.fecha_entrega_estimada);
            if (claveGrupo !== claveGrupoActual) {
                claveGrupoActual = claveGrupo;
                const trGrupo = document.createElement('tr');
                trGrupo.innerHTML = `<td colspan="8" style="background-color: #f3f4f6; font-weight: 700; color: #374151; cursor: default;">${formatFechaGrupo(p.fecha_entrega_estimada)}</td>`;
                tbody.appendChild(trGrupo);
            }
        }

        const tr = document.createElement('tr');
        const atrasado = p.estado === 'pendiente' && new Date(p.fecha_entrega_estimada) < ahora;
        if (atrasado) tr.classList.add('atrasado');
        tr.innerHTML = `
            <td>${String(p.id).slice(0, 8)}</td>
            <td>${formatFechaHoraCelda(p.fecha_pedido)}</td>
            <td>${p.cliente_nombre || '(Cliente eliminado)'}</td>
            <td style="white-space: nowrap;">${formatTelefono(p.cliente_telefono)}</td>
            <td>${p.productos_resumen || '-'}</td>
            <td>${formatFechaEntregaCelda(p.fecha_entrega_estimada)}</td>
            <td>${formatCOP(p.saldo_pendiente)}</td>
            <td>${badgeEstado(p.estado)}</td>
        `;
        tr.addEventListener('click', () => abrirDetallePedido(p.id));
        tbody.appendChild(tr);
    });
}

// ==================== DETALLE / EDICIÓN DE UN PEDIDO ====================

// Mismo día calendario LOCAL (no solo "hace menos de 24h"): un abono de hoy a las 8am sigue
// siendo "de hoy" a las 11pm. Mismo criterio que usa el backend (strftime('%Y-%m-%d', fecha,
// 'localtime')) para bloquear el borrado de abonos de un día anterior a un Operador.
function esFechaDeHoy(iso) {
    if (!iso) return false;
    const d = new Date(iso);
    const hoy = new Date();
    return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth() && d.getDate() === hoy.getDate();
}

function renderizarAbonos(abonos, esPendiente) {
    const cont = document.getElementById('detalle-abonos-list');
    if (!abonos.length) {
        cont.innerHTML = '<p style="color: #6b7280; font-size: 0.9em;">Sin abonos registrados.</p>';
        return;
    }
    cont.innerHTML = abonos.map(a => {
        // Un abono de un día anterior solo lo puede borrar un Administrador (el backend ya lo
        // bloquea, ver eliminarAbonoPedidoTx; esto solo evita mostrarle el botón a quien de
        // todas formas recibiría el error al hacer clic).
        const puedeEliminar = esPendiente && (auditoriaRol === 'Administrador' || esFechaDeHoy(a.fecha));
        return `
        <div class="abono-row">
            <span>${formatFechaLegible(a.fecha)} - ${a.metodo_pago}</span>
            <span style="display: flex; align-items: center; gap: 8px;">
                <strong>${formatCOP(a.monto)}</strong>
                ${puedeEliminar ? `<button class="btn-delete" data-abono-id="${a.id}">🗑️</button>` : ''}
            </span>
        </div>
        `;
    }).join('');

    cont.querySelectorAll('button[data-abono-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('¿Eliminar este abono?')) return;
            const res = await window.api.eliminarAbonoPedido({ id: btn.dataset.abonoId, auditoriaUsuario, auditoriaRol });
            if (!res.success) { alert(res.message); return; }
            await abrirDetallePedido(pedidoActualId);
        });
    });
}

function aplicarPermisosDetalle(estado, saldoPendiente) {
    const esPendiente = estado === 'pendiente';
    const esEntregado = estado === 'entregado';
    const esAdmin = auditoriaRol === 'Administrador';

    ['detalle-fecha-entrega', 'detalle-hora-entrega', 'detalle-notas', 'detalle-agregar-producto', 'btn-agregar-producto-detalle', 'btn-guardar-productos-pedido', 'detalle-abono-monto', 'detalle-abono-metodo', 'btn-agregar-abono', 'detalle-chk-domicilio', 'detalle-input-domicilio']
        .forEach(id => { const el = document.getElementById(id); if (el) el.disabled = !esPendiente; });
    const btnGuardar = document.getElementById('btn-guardar-productos-pedido');
    if (btnGuardar) btnGuardar.style.display = esPendiente ? 'flex' : 'none';
    const btnEntregar = document.getElementById('btn-entregar-pedido');
    btnEntregar.style.display = esPendiente ? 'flex' : 'none';
    const saldoSinSaldar = esPendiente && Number(saldoPendiente || 0) > 0;
    btnEntregar.disabled = saldoSinSaldar;
    btnEntregar.title = saldoSinSaldar ? 'No se puede entregar: aún hay saldo pendiente por abonar.' : '';
    document.getElementById('btn-cancelar-pedido').style.display = esPendiente ? 'flex' : 'none';

    const containerAgregarProd = document.getElementById('detalle-agregar-producto-container');
    if (containerAgregarProd) containerAgregarProd.style.display = esPendiente ? 'flex' : 'none';

    const bannerAdmin = document.getElementById('banner-pedido-entregado-admin');
    if (bannerAdmin) {
        bannerAdmin.style.display = (esEntregado && esAdmin) ? 'flex' : 'none';
    }
}

async function abrirDetallePedido(pedidoId) {
    const res = await window.api.obtenerDetallePedido(pedidoId);
    if (!res.success) {
        alert(res.message);
        return;
    }
    pedidoActualId = pedidoId;
    pedidoActualDetalle = res;

    const { pedido, detalle, abonos, saldo_pendiente } = res;

    document.getElementById('detalle-pedido-titulo').innerText = `Pedido ${String(pedido.id).slice(0, 8)}`;
    document.getElementById('detalle-cliente-nombre').innerText = pedido.cliente_nombre || '(Cliente eliminado)';
    document.getElementById('detalle-cliente-identificacion').innerText = pedido.cliente_identificacion || '-';
    document.getElementById('detalle-cliente-telefono').innerText = formatTelefono(pedido.cliente_telefono);
    document.getElementById('detalle-estado-badge').innerHTML = badgeEstado(pedido.estado);
    document.getElementById('detalle-fecha-pedido').innerText = formatFechaLegible(pedido.fecha_pedido);
    document.getElementById('detalle-venta-id').innerText = pedido.venta_id ? String(pedido.venta_id).slice(0, 8) : '-';

    const { fecha: fechaEntregaSep, hora: horaEntregaSep } = separarFechaHoraEntrega(pedido.fecha_entrega_estimada);
    document.getElementById('detalle-fecha-entrega').value = fechaEntregaSep;
    document.getElementById('detalle-hora-entrega').value = horaEntregaSep;
    document.getElementById('detalle-notas').value = pedido.notas || '';

    const valorDomicilioActual = Number(pedido.valor_domicilio || 0);
    document.getElementById('detalle-chk-domicilio').checked = valorDomicilioActual > 0;
    document.getElementById('detalle-input-domicilio').value = valorDomicilioActual > 0 ? formatNumberUI(valorDomicilioActual) : '';
    document.getElementById('detalle-domicilio-container').style.display = valorDomicilioActual > 0 ? 'block' : 'none';

    carritoDetalle = detalle.map(d => ({ id: d.producto_id, nombre: d.nombre || '(Producto eliminado)', precio: Number(d.precio_unitario), cantidad: Number(d.cantidad) }));
    renderizarCarritoDetalle();

    renderizarAbonos(abonos, pedido.estado === 'pendiente');
    document.getElementById('detalle-saldo-pendiente').innerText = formatCOP(saldo_pendiente);

    aplicarPermisosDetalle(pedido.estado, saldo_pendiente);

    document.getElementById('modal-detalle-pedido').style.display = 'flex';
}

async function guardarCambiosPedido() {
    if (carritoDetalle.length === 0) {
        alert('El pedido debe tener al menos un producto.');
        return;
    }
    const fechaEntregaInput = document.getElementById('detalle-fecha-entrega').value;
    const horaEntregaInput = document.getElementById('detalle-hora-entrega').value;
    if (!fechaEntregaInput) {
        alert('Selecciona la fecha estimada de entrega.');
        return;
    }
    const notas = document.getElementById('detalle-notas').value.trim();
    const valorDomicilio = leerValorDomicilio('detalle-chk-domicilio', 'detalle-input-domicilio');

    const res = await window.api.editarPedido({
        pedidoId: pedidoActualId,
        fechaEntregaEstimada: combinarFechaHoraEntrega(fechaEntregaInput, horaEntregaInput),
        notas,
        carrito: carritoDetalle,
        valorDomicilio,
        auditoriaUsuario, auditoriaRol
    });
    if (!res.success) {
        alert(res.message);
        return;
    }
    alert(res.message);
    await abrirDetallePedido(pedidoActualId);
    cargarPedidos();
    cargarCatalogo();
}

async function agregarProductoAlDetalle() {
    const input = document.getElementById('detalle-agregar-producto');
    const nombre = input.value.trim();
    if (!nombre) return;
    const prod = productosLocales.find(p => normalizeStr(p.nombre) === normalizeStr(nombre));
    if (!prod) {
        alert('No se encontró un producto con ese nombre exacto.');
        return;
    }
    const existente = carritoDetalle.find(i => i.id === prod.id);
    if (existente) existente.cantidad++;
    else carritoDetalle.push({ id: prod.id, nombre: prod.nombre, precio: Number(prod.precio || 0), cantidad: 1 });
    input.value = '';
    renderizarCarritoDetalle();
}

async function agregarAbono() {
    const monto = parseNumberUI(document.getElementById('detalle-abono-monto').value);
    if (monto <= 0) {
        alert('Ingresa un monto válido.');
        return;
    }
    const metodoPago = document.getElementById('detalle-abono-metodo').value;
    const res = await window.api.registrarAbonoPedido({ pedidoId: pedidoActualId, monto, metodoPago, auditoriaUsuario, auditoriaRol });
    if (!res.success) {
        alert(res.message);
        return;
    }
    document.getElementById('detalle-abono-monto').value = '';
    await abrirDetallePedido(pedidoActualId);
    cargarPedidos();
}

async function entregarPedidoActual() {
    const saldoPendiente = Number(pedidoActualDetalle?.saldo_pendiente || 0);

    if (saldoPendiente > 0) {
        alert(`No puedes marcar este pedido como entregado: aún tiene un saldo pendiente de ${formatCOP(saldoPendiente)}. Registra los abonos correspondientes hasta que el saldo sea $0.`);
        return;
    }
    if (!confirm('¿Confirmas que el cliente recogió el pedido? Esto descontará el inventario y lo registrará como venta.')) {
        return;
    }

    const res = await window.api.entregarPedido({ pedidoId: pedidoActualId, auditoriaUsuario, auditoriaRol });
    if (!res.success) {
        alert(res.message);
        return;
    }
    alert(res.message);
    document.getElementById('modal-detalle-pedido').style.display = 'none';
    cargarPedidos();
    cargarCatalogo();
}

async function cancelarPedidoActual() {
    if (!confirm('¿Cancelar este pedido? Se liberará el inventario reservado y se generará el reembolso de los abonos pagados en Gastos.')) return;
    const res = await window.api.cancelarPedido({ pedidoId: pedidoActualId, auditoriaUsuario, auditoriaRol });
    if (!res.success) {
        alert(res.message);
        return;
    }
    alert(res.message);
    document.getElementById('modal-detalle-pedido').style.display = 'none';
    cargarPedidos();
    cargarCatalogo();
}

async function revertirEntregaPedidoActual() {
    if (auditoriaRol !== 'Administrador') {
        alert('Solo un Administrador puede revertir la entrega de un pedido.');
        return;
    }
    if (!confirm('¿Deseas revertir la entrega de este pedido?\n\n• Se anulará la venta generada en el sistema.\n• Se restaurará el stock físico y reservado de los productos entregados.\n• El pedido volverá a estado "Pendiente" para que puedas modificar los productos llevados, ajustar abonos y volver a entregarlo.')) {
        return;
    }

    const res = await window.api.revertirEntregaPedido({
        pedidoId: pedidoActualId,
        auditoriaUsuario,
        auditoriaRol
    });

    if (!res.success) {
        alert(res.message);
        return;
    }

    alert(res.message);
    document.getElementById('modal-detalle-pedido').style.display = 'none';
    if (document.activeElement) document.activeElement.blur();

    const filtroEstado = document.getElementById('filtro-estado-pedidos');
    if (filtroEstado && (filtroEstado.value === 'entregado' || filtroEstado.value === 'entregados_hoy')) {
        filtroEstado.value = 'pendiente';
    }

    await cargarPedidos();
    await cargarCatalogo();

    if (window.api?.forceRefocus) {
        window.api.forceRefocus();
    }
}

async function imprimirComprobantePedido(datosTicket) {
    const res = await window.api.imprimirTicketPedido(datosTicket);
    if (!res.success) alert(res.message);
}

function construirTicketDesdeDetalleActual() {
    if (!pedidoActualDetalle) return null;
    const { pedido, detalle, saldo_pendiente } = pedidoActualDetalle;
    const abonado = Number(pedido.total) - Number(saldo_pendiente);
    const valorDomicilio = Number(pedido.valor_domicilio || 0);
    const itemsTicket = detalle.map(d => ({ nombre: d.nombre, cantidad: d.cantidad, precio: d.precio_unitario }));
    if (valorDomicilio > 0) itemsTicket.push({ nombre: 'Domicilio (Envío)', cantidad: 1, precio: valorDomicilio });
    return {
        pedidoId: pedido.id,
        clienteNombre: pedido.cliente_nombre,
        clienteIdentificacion: pedido.cliente_identificacion,
        clienteTelefono: pedido.cliente_telefono,
        fechaPedido: pedido.fecha_pedido,
        fechaEntregaEstimada: pedido.fecha_entrega_estimada,
        items: itemsTicket,
        total: pedido.total,
        abonado,
        saldoPendiente: saldo_pendiente,
        sucursalNombre: sucursalDetalle?.nombre || sucursalId,
        direccion: sucursalDetalle?.direccion || '',
        telefono: sucursalDetalle?.telefono || ''
    };
}

// ==================== TABS ====================

function cambiarTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    document.getElementById('tab-listado').classList.toggle('active', tab === 'listado');
    document.getElementById('tab-nuevo').classList.toggle('active', tab === 'nuevo');
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', async () => {
    const resId = await window.api.obtenerSucursalId();
    if (resId.success) {
        sucursalId = resId.id;
        const resSucursal = await window.api.obtenerSucursal(sucursalId);
        if (resSucursal.success && resSucursal.data) sucursalDetalle = resSucursal.data;
    }
    const badgeSucursal = document.getElementById('badge-sucursal-pedidos');
    if (badgeSucursal) {
        badgeSucursal.textContent = `📍 ${sucursalDetalle?.nombre || sucursalId}`;
        badgeSucursal.style.display = 'inline-block';
    }

    // Selector de sucursal del listado (solo Administrador): permite ver los pedidos de
    // cualquier sucursal sin tener que marcarla como activa en este equipo (eso cambiaría también
    // el inventario/creación de pedidos de esta terminal, que deben seguir atados a su propia
    // sucursal física). Ver sucursalListadoId arriba y su uso en cargarPedidos().
    const selectSucursalListado = document.getElementById('filtro-sucursal-pedidos');
    if (selectSucursalListado && auditoriaRol === 'Administrador') {
        const resSucs = await window.api.obtenerTodasSucursales();
        if (resSucs.success && resSucs.data) {
            selectSucursalListado.innerHTML = '';
            resSucs.data.forEach(suc => {
                const opt = document.createElement('option');
                opt.value = suc.id;
                opt.innerText = `🏢 ${suc.nombre || suc.id}${suc.id === sucursalId ? ' (activa aquí)' : ''}`;
                selectSucursalListado.appendChild(opt);
            });
            selectSucursalListado.value = sucursalId;
            sucursalListadoId = sucursalId;
            selectSucursalListado.style.display = 'inline-block';
            selectSucursalListado.addEventListener('change', () => {
                sucursalListadoId = selectSucursalListado.value;
                cargarPedidos();
            });
        }
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => cambiarTab(btn.dataset.tab));
    });

    const imagePreviewModal = document.getElementById('image-preview-modal');
    if (imagePreviewModal) {
        imagePreviewModal.addEventListener('click', () => { imagePreviewModal.style.display = 'none'; });
    }

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

    const filterCat = document.getElementById('filter-categoria-pedido');
    const resCat = await window.api.obtenerCategorias();
    if (resCat.success) categoriasCargadas = resCat.data || [];
    if (filterCat) {
        filtroCategorias = crearFiltroCategorias({
            contenedor: filterCat,
            categorias: categoriasCargadas,
            tieneNegativos: false,
            onChange: () => filtrarYRenderizarCatalogoPedido()
        });
    }

    document.getElementById('search-productos-pedido').addEventListener('input', () => filtrarYRenderizarCatalogoPedido());
    document.getElementById('pedido-cliente-nombre').addEventListener('input', manejarSeleccionClienteAutocompletar);
    document.getElementById('pedido-abono-monto').addEventListener('input', (e) => { e.target.value = formatNumberUI(e.target.value); });
    document.getElementById('detalle-abono-monto').addEventListener('input', (e) => { e.target.value = formatNumberUI(e.target.value); });
    document.getElementById('btn-guardar-pedido').addEventListener('click', registrarPedido);

    configurarDomicilioUI('pedido-chk-domicilio', 'pedido-input-domicilio', 'pedido-domicilio-container', renderizarCarritoPedido);
    configurarDomicilioUI('detalle-chk-domicilio', 'detalle-input-domicilio', 'detalle-domicilio-container', renderizarCarritoDetalle);

    let debounceBusqueda = null;
    document.getElementById('busqueda-pedidos').addEventListener('input', () => {
        clearTimeout(debounceBusqueda);
        debounceBusqueda = setTimeout(cargarPedidos, 300);
    });
    document.getElementById('filtro-estado-pedidos').addEventListener('change', cargarPedidos);
    document.getElementById('filtro-creados-hoy').addEventListener('change', cargarPedidos);

    document.getElementById('btn-close-detalle-pedido').addEventListener('click', () => {
        document.getElementById('modal-detalle-pedido').style.display = 'none';
    });
    document.getElementById('btn-guardar-productos-pedido').addEventListener('click', guardarCambiosPedido);
    document.getElementById('btn-agregar-producto-detalle').addEventListener('click', agregarProductoAlDetalle);

    // Sugerencias sin tildes y sin importar el orden de las palabras al agregar un producto al
    // detalle de un pedido existente (ver productoBuscador.js).
    const inputAgregarProductoDetalle = document.getElementById('detalle-agregar-producto');
    if (inputAgregarProductoDetalle) {
        crearBuscadorProducto({
            input: inputAgregarProductoDetalle,
            obtenerProductos: () => productosLocales,
            detalle: (p) => `stock: ${p.stock || 0}`
        });
    }
    document.getElementById('btn-agregar-abono').addEventListener('click', agregarAbono);
    document.getElementById('btn-entregar-pedido').addEventListener('click', entregarPedidoActual);
    document.getElementById('btn-cancelar-pedido').addEventListener('click', cancelarPedidoActual);
    const btnRevertirEntrega = document.getElementById('btn-revertir-entrega-pedido');
    if (btnRevertirEntrega) {
        btnRevertirEntrega.addEventListener('click', revertirEntregaPedidoActual);
    }
    document.getElementById('btn-imprimir-comprobante-detalle').addEventListener('click', () => {
        const ticket = construirTicketDesdeDetalleActual();
        if (ticket) imprimirComprobantePedido(ticket);
    });

    document.getElementById('btn-cerrar-post-pedido').addEventListener('click', () => {
        document.getElementById('modal-post-pedido').style.display = 'none';
    });
    document.getElementById('btn-imprimir-comprobante-pedido').addEventListener('click', () => {
        const raw = document.getElementById('modal-post-pedido').dataset.ticket;
        if (raw) imprimirComprobantePedido(JSON.parse(raw));
    });

    await cargarClientes();
    await cargarCatalogo();

    const urlParams = new URLSearchParams(window.location.search);
    const paramPedidoId = urlParams.get('pedidoId');
    if (paramPedidoId) {
        document.getElementById('filtro-estado-pedidos').value = '';
        await cargarPedidos();
        abrirDetallePedido(paramPedidoId);
    } else {
        await cargarPedidos();
    }

    window.addEventListener('pos-sincronizacion-completa', () => {
        cargarCatalogo();
        cargarClientes();
        cargarPedidos();
    });
    window.api.onInventarioActualizado(() => cargarCatalogo());
});
