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

let sucursalOrigenId = "";
let sucursalDestinoId = "";
let productosLocales = [];
let transferCart = []; // Elementos que se van a transferir: { id, nombre, cantidad, stockMaximo }
let sucursalesDisponibles = [];
let categoriasCargadas = [];
let filtroCategorias = null; // Instancia del selector múltiple de categorías (ver categoriaFiltro.js)
const formatCOP = (val) => `${Math.round(val).toLocaleString('es-CO')}`;

// Datos de sesión activa
const currentUser = localStorage.getItem('currentUser') || 'Invitado';
const currentRole = localStorage.getItem('currentRole') || 'Sin Rol';

document.addEventListener('DOMContentLoaded', async () => {
    const selectOrigen = document.getElementById('select-sucursal-origen');
    const selectDestino = document.getElementById('select-sucursal-destino');
    const searchInput = document.getElementById('search-productos');
    const filterCat = document.getElementById('filter-categoria');

    // Event listeners
    if (selectOrigen) {
        selectOrigen.addEventListener('change', async (e) => {
            sucursalOrigenId = e.target.value;
            transferCart = []; // Limpiar carrito si cambia el origen
            renderizarCarrito();
            await actualizarDestinosDisponibles();
            await cargarCatalogo();
        });
    }

    if (selectDestino) {
        selectDestino.addEventListener('change', (e) => {
            sucursalDestinoId = e.target.value;
        });
    }

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
    }

    const btnEnviarTransferencia = document.getElementById('btn-enviar-transferencia');
    if (btnEnviarTransferencia) {
        btnEnviarTransferencia.addEventListener('click', enviarTransferencia);
    }

    // Menú colapsable en móvil
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Escuchar actualizaciones de inventario en tiempo real
    if (window.api && window.api.onInventarioActualizado) {
        window.api.onInventarioActualizado(() => {
            cargarCatalogo();
        });
    }

    // Refresca el catálogo de origen tras sincronizar; la canasta de traslado en curso no se toca
    window.addEventListener('pos-sincronizacion-completa', () => {
        cargarCatalogo();
    });

    // Inicializar menús y cargar datos de sucursales
    await cargarSucursales();
});

function normalizeStr(str) {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function cargarSucursales() {
    const response = await window.api.obtenerTodasSucursales();
    const selectOrigen = document.getElementById('select-sucursal-origen');
    const selectDestino = document.getElementById('select-sucursal-destino');

    if (!selectOrigen || !selectDestino) return;

    selectOrigen.innerHTML = '';
    selectDestino.innerHTML = '';

    let allSucursales = [];
    if (response && response.success && response.data && response.data.length > 0) {
        allSucursales = response.data;
    }

    sucursalesDisponibles = allSucursales;

    if (allSucursales.length > 0) {
        allSucursales.forEach(suc => {
            const opt = document.createElement('option');
            opt.value = suc.id;
            opt.innerText = suc.nombre;
            selectOrigen.appendChild(opt.cloneNode(true));
        });

        let initialOrigenId = '';
        const activeSucursalResponse = await window.api.obtenerSucursalId();
        if (activeSucursalResponse.success && activeSucursalResponse.id) {
            initialOrigenId = activeSucursalResponse.id;
        } else {
            initialOrigenId = allSucursales[0]?.id || '';
        }

        // Al llegar desde "Eliminar Sucursal" (admin.js) con stock pendiente, se preselecciona esa
        // sucursal como origen para no obligar al admin a buscarla de nuevo en el selector.
        const sucursalOrigenParam = new URLSearchParams(window.location.search).get('sucursalOrigen');
        if (sucursalOrigenParam && allSucursales.some(suc => suc.id === sucursalOrigenParam)) {
            initialOrigenId = sucursalOrigenParam;
        }

        if (!allSucursales.some(suc => suc.id === initialOrigenId)) {
            initialOrigenId = allSucursales[0]?.id || '';
        }

        selectOrigen.value = initialOrigenId;
        sucursalOrigenId = initialOrigenId;
        await actualizarDestinosDisponibles();
        await cargarCatalogo();
    } else {
        selectOrigen.innerHTML = '<option value="">No hay sucursales disponibles</option>';
        selectDestino.innerHTML = '<option value="">No hay sucursales disponibles</option>';
        sucursalOrigenId = '';
        sucursalDestinoId = '';
        renderizarCatalogo([]);
    }
}

async function actualizarDestinosDisponibles(selectedDestinoId = sucursalDestinoId) {
    const selectDestino = document.getElementById('select-sucursal-destino');
    if (!selectDestino) return;

    selectDestino.innerHTML = '';

    const opcionesDestino = sucursalesDisponibles.filter(suc => suc.id !== sucursalOrigenId);

    if (opcionesDestino.length === 0) {
        selectDestino.innerHTML = '<option value="">No hay otras sucursales disponibles</option>';
        sucursalDestinoId = '';
        return;
    }

    opcionesDestino.forEach(suc => {
        const opt = document.createElement('option');
        opt.value = suc.id;
        opt.innerText = suc.nombre;
        selectDestino.appendChild(opt);
    });

    const destinoValido = selectedDestinoId && opcionesDestino.some(suc => suc.id === selectedDestinoId)
        ? selectedDestinoId
        : opcionesDestino[0]?.id || '';

    selectDestino.value = destinoValido;
    sucursalDestinoId = destinoValido;
}

async function cargarCatalogo() {
    if (!sucursalOrigenId) return;
    const response = await window.api.getInventory(sucursalOrigenId);
    if (response.success) {
        productosLocales = response.data || [];
        // Ordenar alfabéticamente por nombre
        productosLocales.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }));
        filtrarYRenderizarCatalogo();
    }
}

function filtrarYRenderizarCatalogo() {
    const searchInput = document.getElementById('search-productos');
    const query = searchInput ? normalizeStr(searchInput.value) : "";

    // Selección del filtro múltiple de categorías: puede traer ids de categoría reales (la opción
    // "Con Unidades Negativas" no se ofrece aquí, ver tieneNegativos: false más arriba).
    const seleccion = filtroCategorias ? filtroCategorias.getSeleccion() : new Set();
    const filtrarDisponibles = seleccion.has('disponibles');
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
        if (filtrarDisponibles && Number(prod.stock || 0) <= 0) {
            return false;
        }
        if (catIdsSeleccionadas.length > 0 && !allowedCatIds.includes(prod.categoria_id)) {
            return false;
        }
        if (query) {
            const terms = query.split(/\s+/).filter(Boolean);
            const nombre = normalizeStr(prod.nombre);
            const desc = normalizeStr(prod.descripcion || '');
            return terms.every(term => nombre.includes(term) || desc.includes(term));
        }
        return true;
    });

    renderizarCatalogo(productosFiltrados);
}

function renderizarCatalogo(productos) {
    const grid = document.getElementById('grid-products');
    grid.innerHTML = '';

    if (productos.length > 0) {
        productos.forEach(prod => {
            const card = document.createElement('div');
            const sinStock = prod.stock <= 0;
            card.className = `product-card ${sinStock ? 'disabled' : ''}`;

            const imgUrl = (prod.foto_path && (prod.foto_path.startsWith('http') || prod.foto_path.startsWith('file:///')))
                ? prod.foto_path
                : (prod.foto_path ? `app-image://${prod.foto_path}` : 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200');

            let badgeHtml = '';
            if (sinStock) {
                badgeHtml = `<span style="background-color: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: bold; flex-shrink: 0;">Agotado</span>`;
            }

            card.innerHTML = `
                <div style="position: relative; width: 100% !important; height: 90px !important;">
                    <img src="${imgUrl}" alt="${prod.nombre}" style="width: 100% !important; height: 90px !important; object-fit: cover !important; border-radius: 6px !important; display: block !important;">
                    <div style="position: absolute; top: 4px; right: 4px; display: flex; flex-direction: column; gap: 4px; align-items: flex-end; z-index: 5;">
                        ${badgeHtml}
                    </div>
                </div>
                <h4 title="${prod.nombre}">${prod.nombre}</h4>
                <span class="product-price">${formatCOP(prod.precio)}</span>
                <span class="product-stock">Disp: ${prod.stock}</span>
            `;

            // Al hacer clic, agregar a la lista de envíos si hay stock disponible
            if (!sinStock) {
                card.addEventListener('click', () => {
                    agregarACanasta(prod);
                });
            }

            grid.appendChild(card);
        });
    } else {
        grid.innerHTML = '<p style="text-align: center; color: #6b7280; width:100%; margin-top: 40px;">No se encontraron productos en origen.</p>';
    }
}

function agregarACanasta(prod) {
    const existente = transferCart.find(i => i.id === prod.id);
    if (existente) {
        if (existente.cantidad < prod.stock) {
            existente.cantidad++;
        } else {
            alert(`No puedes transferir más unidades de las disponibles en origen (${prod.stock}).`);
        }
    } else {
        transferCart.push({
            id: prod.id,
            nombre: prod.nombre,
            cantidad: 1,
            stockMaximo: prod.stock
        });
    }
    renderizarCarrito();
}

function cambiarCantidad(prodId, delta) {
    const item = transferCart.find(i => i.id === prodId);
    if (!item) return;

    item.cantidad += delta;
    if (item.cantidad <= 0) {
        transferCart = transferCart.filter(i => i.id !== prodId);
    } else if (item.cantidad > item.stockMaximo) {
        item.cantidad = item.stockMaximo;
        alert(`Límite máximo de stock en origen alcanzado (${item.stockMaximo} uds).`);
    }
    renderizarCarrito();
}

function renderizarCarrito() {
    const list = document.getElementById('transfer-list');
    list.innerHTML = '';

    if (transferCart.length === 0) {
        list.innerHTML = '<p style="color: #6b7280; text-align: center; margin-top: 40px;">No has agregado productos a transferir.</p>';
        return;
    }

    transferCart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'transfer-item';
        row.innerHTML = `
            <div class="transfer-item-info">
                <p class="transfer-item-title">${item.nombre}</p>
                <span style="font-size:0.8em; color:#6b7280;">Límite en origen: ${item.stockMaximo}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button class="btn-qty" onclick="cambiarCantidad('${item.id}', -1)">-</button>
                <strong style="width:20px; text-align:center;">${item.cantidad}</strong>
                <button class="btn-qty" onclick="cambiarCantidad('${item.id}', 1)">+</button>
            </div>
        `;
        list.appendChild(row);
    });
}

async function enviarTransferencia() {
    if (!sucursalOrigenId || !sucursalDestinoId) {
        alert("Selecciona sucursales válidas de origen y destino.");
        return;
    }

    if (sucursalOrigenId === sucursalDestinoId) {
        alert("La sucursal de origen y destino no pueden ser la misma.");
        return;
    }

    if (transferCart.length === 0) {
        alert("La canasta de envío está vacía. Selecciona al menos un producto.");
        return;
    }

    const confirmar = confirm("¿Estás seguro de registrar esta transferencia de productos?");
    if (!confirmar) return;

    const payload = {
        sucursalOrigenId,
        sucursalDestinoId,
        productos: transferCart,
        usuario: currentUser,
        rol: currentRole
    };

    const response = await window.api.realizarTransferencia(payload);
    if (response.success) {
        alert(response.message);
        transferCart = [];
        renderizarCarrito();
        await cargarCatalogo();
    } else {
        alert("Error al procesar transferencia: " + response.message);
    }
}

// Manejo de Cerrar Sesión
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});
