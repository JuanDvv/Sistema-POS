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

let sucursalId = 'sucursal-norte';
let productosDisponibles = [];
let descripcionesFrecuentesOperativo = []; // [{ descripcion, usos }], gastos "Operativo" más repetidos

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

function obtenerFechaHoyYYYYMMDD() {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function construirDescripcionVencidos(items = []) {
    return items
        .map((item) => `${item.nombre} x${item.cantidad} - valor ${formatNumberUI(item.valor)}`)
        .join(' | ');
}

let mapaProductosPorClave = new Map(); // clave -> producto (match exacto al validar lo escrito)
let mapaClavePorProductoId = new Map(); // id -> clave (para mostrar la etiqueta correcta al elegir)

function obtenerClaveUnicaProducto(producto, conteoNombres) {
    const nombre = producto.nombre || 'Producto';
    const esDuplicado = (conteoNombres.get(nombre) || 0) > 1;
    return esDuplicado ? `${nombre} (ID ${String(producto.id).slice(0, 8)})` : nombre;
}

// Construye las claves unicas de producto (nombre, o "nombre (ID xxxxxxxx)" si hay nombres
// duplicados) que usan tanto la validacion de texto exacto (mapaProductosPorClave) como las
// sugerencias del buscador desplegable (ver crearBuscadorProducto en productoBuscador.js).
function poblarMapaProductos() {
    const conteoNombres = new Map();
    productosDisponibles.forEach((producto) => {
        const nombre = producto.nombre || 'Producto';
        conteoNombres.set(nombre, (conteoNombres.get(nombre) || 0) + 1);
    });

    mapaProductosPorClave = new Map();
    mapaClavePorProductoId = new Map();
    productosDisponibles.forEach((producto) => {
        const clave = obtenerClaveUnicaProducto(producto, conteoNombres);
        mapaProductosPorClave.set(clave, producto);
        mapaClavePorProductoId.set(producto.id, clave);
    });
}

// Búsqueda por coincidencia EXACTA de la clave (nombre, o "nombre (ID xxxxxxxx)" si hay duplicados).
// No se usa coincidencia parcial (includes) porque hacía que, p. ej., "Brukys" emparejara
// erróneamente con "Caja de Brukys Surtidos" y tomara su precio.
function encontrarProductoPorNombre(clave) {
    const texto = String(clave || '').trim();
    return mapaProductosPorClave.get(texto) || null;
}

function actualizarValorFila(row) {
    const inputProducto = row.querySelector('.producto-vencido-input');
    const cantidadInput = row.querySelector('.producto-vencido-cantidad');
    const valorInput = row.querySelector('.producto-vencido-valor');
    const productoSeleccionado = encontrarProductoPorNombre(inputProducto?.value || '');

    if (productoSeleccionado) {
        row.dataset.productId = productoSeleccionado.id;
        row.dataset.precioUnitario = String(productoSeleccionado.precio || 0);
    } else {
        row.dataset.productId = '';
        row.dataset.precioUnitario = '0';
    }

    const cantidad = parseInt(String(cantidadInput?.value || '').replace(/\D/g, ''), 10) || 0;
    const precioUnitario = parseNumberUI(row.dataset.precioUnitario || '0');
    const valorCalculado = cantidad * precioUnitario;
    valorInput.value = formatNumberUI(valorCalculado);
}

function crearFilaProductoVencido(productoSeleccionado = null) {
    const container = document.getElementById('lista-productos-vencidos');
    const row = document.createElement('div');
    row.className = 'producto-vencido-row';
    row.innerHTML = `
        <input type="text" class="producto-vencido-input" placeholder="Buscar producto" autocomplete="off">
        <input type="text" inputmode="numeric" class="producto-vencido-cantidad" placeholder="Cant.">
        <input type="text" inputmode="numeric" class="producto-vencido-valor" placeholder="Valor" readonly>
        <button type="button" class="btn-remove-producto">✕</button>
    `;

    const inputProducto = row.querySelector('.producto-vencido-input');
    const cantidadInput = row.querySelector('.producto-vencido-cantidad');
    const valorInput = row.querySelector('.producto-vencido-valor');
    const btnRemove = row.querySelector('.btn-remove-producto');

    if (productoSeleccionado) {
        const producto = productosDisponibles.find((item) => item.id === productoSeleccionado);
        if (producto) {
            inputProducto.value = mapaClavePorProductoId.get(producto.id) || producto.nombre;
            row.dataset.productId = producto.id;
            row.dataset.precioUnitario = String(producto.precio || 0);
        }
    }

    // Sugerencias sin tildes y sin importar el orden de las palabras (ver productoBuscador.js).
    // Elegir una opcion deja en el input la clave exacta, asi que actualizarValorFila (que valida
    // por coincidencia exacta contra mapaProductosPorClave) la resuelve igual que si se hubiera
    // tecleado a mano.
    const buscador = crearBuscadorProducto({
        input: inputProducto,
        obtenerProductos: () => productosDisponibles,
        etiqueta: (p) => mapaClavePorProductoId.get(p.id) || p.nombre,
        detalle: (p) => `stock: ${p.stock || 0}`,
        onSeleccionar: () => {
            actualizarValorFila(row);
            actualizarMontoGeneral();
        }
    });

    inputProducto.addEventListener('input', () => {
        actualizarValorFila(row);
        actualizarMontoGeneral();
    });
    cantidadInput.addEventListener('input', (e) => {
        e.target.value = String(e.target.value).replace(/\D/g, '');
        actualizarValorFila(row);
        actualizarMontoGeneral();
    });

    btnRemove.addEventListener('click', () => {
        buscador.destruir();
        row.remove();
        actualizarMontoGeneral();
    });
    container.appendChild(row);
    return row;
}

function limpiarFilasProductosVencidos() {
    const container = document.getElementById('lista-productos-vencidos');
    if (container) {
        container.innerHTML = '';
    }
}

function obtenerProductosVencidos() {
    const rows = Array.from(document.querySelectorAll('.producto-vencido-row'));
    return rows.reduce((acc, row) => {
        const inputProducto = row.querySelector('.producto-vencido-input');
        const cantidadInput = row.querySelector('.producto-vencido-cantidad');
        const valorInput = row.querySelector('.producto-vencido-valor');
        const productoId = row.dataset.productId || '';
        const cantidad = parseInt(String(cantidadInput?.value || '').replace(/\D/g, ''), 10);
        const valor = parseNumberUI(valorInput?.value || '0');

        if (productoId && cantidad > 0) {
            const producto = productosDisponibles.find((item) => item.id === productoId);
            acc.push({
                id: productoId,
                nombre: producto?.nombre || inputProducto?.value || 'Producto',
                cantidad,
                valor
            });
        }
        return acc;
    }, []);
}

function actualizarMontoGeneral() {
    const inputMonto = document.getElementById('gasto-monto');
    const containerMonto = document.getElementById('container-monto-gasto');
    const tipo = document.getElementById('gasto-tipo').value;

    if (tipo === 'Gasto de Inventario' || tipo === 'Devolución de Producto') {
        const totalVencidos = obtenerProductosVencidos().reduce((sum, item) => sum + (item.valor || 0), 0);
        inputMonto.value = formatNumberUI(totalVencidos);
        containerMonto.style.display = 'none';
        return;
    }

    containerMonto.style.display = 'block';
}

// Trae del backend los conceptos de gastos "Operativo" ya usados en esta sucursal, ordenados por
// frecuencia (ver 'obtener-descripciones-frecuentes-gasto' en ipc/registerGastosIpc.js). Sirve para
// sugerir, no para forzar: el usuario siempre puede seguir escribiendo un concepto nuevo.
async function cargarDescripcionesFrecuentesOperativo() {
    if (!window.api.obtenerDescripcionesFrecuentesGasto) return;
    const res = await window.api.obtenerDescripcionesFrecuentesGasto({ sucursalId, tipo: 'Operativo' });
    if (res.success) {
        descripcionesFrecuentesOperativo = res.data || [];
    }
}

function ocultarSugerenciasDescripcion() {
    const panel = document.getElementById('gasto-descripcion-sugerencias');
    if (panel) panel.style.display = 'none';
}

function renderizarSugerenciasDescripcion() {
    const panel = document.getElementById('gasto-descripcion-sugerencias');
    const textarea = document.getElementById('gasto-descripcion');
    if (!panel || !textarea) return;

    const filtro = textarea.value.trim().toLowerCase();
    const coincidencias = filtro
        ? descripcionesFrecuentesOperativo.filter(item => item.descripcion.toLowerCase().includes(filtro))
        : descripcionesFrecuentesOperativo;

    // No mostrar el panel si lo único que "coincide" es exactamente lo que ya está escrito.
    if (coincidencias.length === 0 || (coincidencias.length === 1 && coincidencias[0].descripcion.toLowerCase() === filtro)) {
        ocultarSugerenciasDescripcion();
        return;
    }

    panel.innerHTML = '';
    coincidencias.forEach(item => {
        const fila = document.createElement('div');
        fila.className = 'sugerencia-item';
        fila.innerHTML = `<span>${item.descripcion}</span><span class="sugerencia-usos">usado ${item.usos}x</span>`;
        fila.addEventListener('click', () => {
            textarea.value = item.descripcion;
            ocultarSugerenciasDescripcion();
            textarea.focus();
        });
        panel.appendChild(fila);
    });
    panel.style.display = 'block';
}

// Recarga todo lo que depende de la sucursal seleccionada (inventario para el datalist de
// productos vencidos, y las descripciones frecuentes de gastos Operativo): se llama al cargar la
// página y de nuevo cada vez que un Administrador cambia de sucursal en #gasto-sucursal.
async function cargarDatosDeSucursal() {
    const resInventory = await window.api.getInventory(sucursalId);
    if (resInventory.success) {
        productosDisponibles = resInventory.data || [];
    }
    poblarMapaProductos();
    await cargarDescripcionesFrecuentesOperativo();
}

document.addEventListener('DOMContentLoaded', async () => {
    // Obtener ID de la sucursal activa en este equipo (punto de partida; un Administrador puede
    // cambiarla más abajo para registrar el gasto en otra sucursal sin tener que activarla aquí).
    let sucursalLocalId = 'sucursal-norte';
    const resId = await window.api.obtenerSucursalId();
    if (resId.success) {
        sucursalLocalId = resId.id;
        sucursalId = resId.id;
    }

    // Al llegar desde "Eliminar Sucursal" (admin.js) con stock pendiente, se preselecciona esa
    // sucursal y el tipo "Gasto de Inventario" para no obligar al admin a repetir la búsqueda.
    const paramsUrl = new URLSearchParams(window.location.search);
    const sucursalParam = paramsUrl.get('sucursal');
    const tipoParam = paramsUrl.get('tipo');
    if (sucursalParam) {
        sucursalLocalId = sucursalParam;
        sucursalId = sucursalParam;
    }
    const user = localStorage.getItem('currentUser') || 'Invitado';
    const role = localStorage.getItem('currentRole') || 'Sin Rol';
    document.getElementById('display-user').innerText = user;
    document.getElementById('display-role').innerText = role;

    if (role === 'Administrador') {
        const btnAdmin = document.getElementById('btn-nav-admin');
        if (btnAdmin) btnAdmin.style.display = 'block';
    }

    // Fecha del gasto: hoy por defecto, sin tope máximo hacia atrás. Un Operador que elige un día
    // anterior a hoy envía una solicitud pendiente de aprobación (ver btn-guardar-gasto más abajo);
    // un Administrador la aplica de inmediato, igual que en Ventas de Fecha Anterior.
    const inputFechaGasto = document.getElementById('gasto-fecha');
    const helperFechaGasto = document.getElementById('gasto-fecha-helper');
    const hoyYYYYMMDD = obtenerFechaHoyYYYYMMDD();
    if (inputFechaGasto) {
        inputFechaGasto.max = hoyYYYYMMDD;
        inputFechaGasto.value = hoyYYYYMMDD;
        inputFechaGasto.addEventListener('change', () => {
            if (!inputFechaGasto.value || inputFechaGasto.value > hoyYYYYMMDD) {
                inputFechaGasto.value = hoyYYYYMMDD;
            }
            if (helperFechaGasto) {
                helperFechaGasto.style.display = (role !== 'Administrador' && inputFechaGasto.value < hoyYYYYMMDD) ? 'block' : 'none';
            }
        });
    }

    if (role === 'Operador') {
        const selectGasto = document.getElementById('gasto-tipo');
        const optAdministrativo = selectGasto.querySelector('option[value="Gastos Administrativos"]');
        if (optAdministrativo) {
            optAdministrativo.remove();
        }
    }

    // Selector de sucursal: solo un Administrador puede cambiarla desde aquí (para no repetir el
    // error de registrar/consultar gastos en la sucursal equivocada); el resto de roles solo ve
    // en qué sucursal está registrando, sin poder moverla.
    const selectSucursal = document.getElementById('gasto-sucursal');
    const displaySucursal = document.getElementById('gasto-sucursal-display');
    if (role === 'Administrador' && selectSucursal) {
        const resSucs = await window.api.obtenerSucursalesDisponibles();
        if (resSucs.success && resSucs.data) {
            if (displaySucursal) displaySucursal.style.display = 'none';
            selectSucursal.innerHTML = '';
            resSucs.data.forEach(id => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.innerText = `🏢 ${id === sucursalLocalId ? 'Sucursal Local: ' : ''}${id}`;
                selectSucursal.appendChild(opt);
            });
            selectSucursal.value = sucursalId;
            selectSucursal.style.display = 'block';

            selectSucursal.addEventListener('change', async (e) => {
                sucursalId = e.target.value;
                await cargarDatosDeSucursal();
            });
        }
    } else if (displaySucursal) {
        displaySucursal.innerText = `🏢 Sucursal: ${sucursalId}`;
    }

    await cargarDatosDeSucursal();

    // Configurar formateo visual del monto de gasto
    const inputMonto = document.getElementById('gasto-monto');
    if (inputMonto) {
        inputMonto.addEventListener('input', (e) => {
            e.target.value = formatNumberUI(e.target.value);
        });
        inputMonto.addEventListener('focus', function() {
            this.select();
        });
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

    // Mostrar/ocultar sección de productos según la clasificación
    const selectTipo = document.getElementById('gasto-tipo');
    const containerProductosVencidos = document.getElementById('container-productos-vencidos');
    const btnAgregarProductoVencido = document.getElementById('btn-agregar-producto-vencido');
    const labelProductosVencidos = document.getElementById('label-productos-vencidos');

    const descripcionHelper = document.getElementById('gasto-descripcion-helper');
    const textareaDescripcion = document.getElementById('gasto-descripcion');

    const toggleSeccion = () => {
        const esDevolucion = selectTipo.value === 'Devolución de Producto';
        const esAjusteInventario = selectTipo.value === 'Gasto de Inventario' || esDevolucion;
        const esOperativo = selectTipo.value === 'Operativo';
        containerProductosVencidos.style.display = esAjusteInventario ? 'block' : 'none';
        if (labelProductosVencidos) {
            labelProductosVencidos.textContent = esDevolucion
                ? 'Productos devueltos por mala calidad (se descuentan del inventario)'
                : 'Productos vencidos o retirados a descontar del inventario';
        }
        // Las sugerencias de concepto solo aplican a gastos Operativos (ver cargarDescripcionesFrecuentesOperativo).
        if (descripcionHelper) descripcionHelper.style.display = esOperativo ? 'block' : 'none';
        if (!esOperativo) ocultarSugerenciasDescripcion();
        actualizarMontoGeneral();
    };

    if (btnAgregarProductoVencido) {
        btnAgregarProductoVencido.addEventListener('click', () => crearFilaProductoVencido());
    }

    if (selectTipo) {
        selectTipo.addEventListener('change', toggleSeccion);
        if (tipoParam && [...selectTipo.options].some(opt => opt.value === tipoParam)) {
            selectTipo.value = tipoParam;
        }
        toggleSeccion();
    }

    // Al venir del flujo de "Descartar/dar de baja todo el stock" (ver admin.js), se precarga una
    // fila por cada producto con stock en la sucursal, con la cantidad completa, en vez de dejar
    // que el admin los vuelva a agregar uno por uno a mano.
    const esDescarteMasivo = tipoParam === 'Gasto de Inventario' && sucursalParam && productosDisponibles.some(p => p.stock > 0);
    if (esDescarteMasivo) {
        limpiarFilasProductosVencidos();
        productosDisponibles.filter(p => p.stock > 0).forEach((producto) => {
            const row = crearFilaProductoVencido(producto.id);
            const cantidadInput = row.querySelector('.producto-vencido-cantidad');
            cantidadInput.value = String(producto.stock);
            actualizarValorFila(row);
        });
        actualizarMontoGeneral();
    } else if (containerProductosVencidos) {
        crearFilaProductoVencido();
    }

    // Sugerencias de concepto para gastos Operativos: se muestran al enfocar o escribir en la
    // descripción, filtradas por lo ya tecleado, y se ocultan al hacer clic fuera.
    if (textareaDescripcion) {
        textareaDescripcion.addEventListener('focus', () => {
            if (selectTipo.value === 'Operativo') renderizarSugerenciasDescripcion();
        });
        textareaDescripcion.addEventListener('input', () => {
            if (selectTipo.value === 'Operativo') renderizarSugerenciasDescripcion();
        });
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('gasto-descripcion-sugerencias');
            if (panel && !textareaDescripcion.contains(e.target) && !panel.contains(e.target)) {
                ocultarSugerenciasDescripcion();
            }
        });
    }
});

document.getElementById('btn-guardar-gasto').addEventListener('click', async () => {
    const tipo = document.getElementById('gasto-tipo').value;
    const metodoPago = tipo === 'Operativo' ? 'Efectivo' : 'Sin Movimiento';
    const rawMonto = document.getElementById('gasto-monto').value;
    const monto = parseNumberUI(rawMonto);
    let descripcion = document.getElementById('gasto-descripcion').value.trim();
    let productosVencidos = [];
    const esAjusteInventario = tipo === 'Gasto de Inventario' || tipo === 'Devolución de Producto';

    if (esAjusteInventario) {
        productosVencidos = obtenerProductosVencidos();
        if (productosVencidos.length === 0) {
            alert('Selecciona al menos un producto con cantidad válida.');
            return;
        }
        // No sobrescribir el concepto ingresado por el usuario: se concatena con el
        // detalle de productos en vez de reemplazarlo.
        const detalleVencidos = construirDescripcionVencidos(productosVencidos);
        descripcion = descripcion ? `${descripcion} - ${detalleVencidos}` : detalleVencidos;
    } else if (isNaN(monto) || monto <= 0 || !descripcion) {
        alert('Por favor, introduce un monto válido y una descripción descriptiva.');
        return;
    }

    const fechaGasto = document.getElementById('gasto-fecha').value || obtenerFechaHoyYYYYMMDD();
    const esFechaAnterior = fechaGasto < obtenerFechaHoyYYYYMMDD();

    const datosGasto = {
        sucursalId: sucursalId,
        tipo: tipo,
        metodoPago: metodoPago,
        descripcion: descripcion,
        monto: esAjusteInventario ? 0 : monto,
        productosVencidos: productosVencidos,
        auditoriaUsuario: localStorage.getItem('currentUser') || 'Invitado',
        auditoriaRol: localStorage.getItem('currentRole') || 'Sin Rol'
    };

    const response = esFechaAnterior
        ? await window.api.registrarGastoAnterior({ ...datosGasto, fechaGasto })
        : await window.api.registrarGasto(datosGasto);

    if (response.requiereAprobacion) {
        alert(response.message);
    } else if (response.success) {
        alert(response.message);
    } else {
        alert('Error: ' + response.message);
        return;
    }

    document.getElementById('gasto-monto').value = '';
    document.getElementById('gasto-descripcion').value = '';
    const inputFechaGasto = document.getElementById('gasto-fecha');
    const helperFechaGasto = document.getElementById('gasto-fecha-helper');
    if (inputFechaGasto) inputFechaGasto.value = obtenerFechaHoyYYYYMMDD();
    if (helperFechaGasto) helperFechaGasto.style.display = 'none';
    if (tipo === 'Operativo') {
        // Refresca las sugerencias por si este concepto es nuevo o subió de frecuencia.
        cargarDescripcionesFrecuentesOperativo();
    }
    if (esAjusteInventario) {
        limpiarFilasProductosVencidos();
        crearFilaProductoVencido();
        actualizarMontoGeneral();
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});
