// Corregir bug de pérdida de foco en Electron al cerrar diálogos nativos en Windows
const originalAlert = window.alert;
window.alert = (msg) => { originalAlert(msg); window.api.forceRefocus(); };
const originalConfirm = window.confirm;
window.confirm = (msg) => { const r = originalConfirm(msg); window.api.forceRefocus(); return r; };

let sucursalId = 'sucursal-norte'; // Dinámico a partir de la DB
let sucursalLocalId = 'sucursal-norte';
let editingProductId = null; // ID del producto en edición (null si es creación)
let productosCargados = []; // Copia local para búsqueda offline
let categoriasCargadas = [];
let filtroCategorias = null; // Instancia del selector múltiple de categorías (ver categoriaFiltro.js)

const formatCOP = (val) => `${Math.round(val).toLocaleString('es-CO')}`;
const formatNumberUI = (val) => {
    const clean = String(val).replace(/\D/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString('es-CO');
};
const parseNumberUI = (str) => {
    return parseFloat(String(str).replace(/\./g, "")) || 0;
};
const normalizeStr = (str) => {
    return String(str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

// Rellena un <select> simple de categorías (usado para asignarle UNA categoría a un producto en el
// modal de Nuevo/Editar Producto). Distinto del selector múltiple del filtro del catálogo, que ahora
// vive en categoriaFiltro.js -- este no necesita las opciones especiales "Disponibles"/"Negativos".
function rellenarSelectorAgrupado(select, categories, defaultText) {
    select.innerHTML = '';

    if (defaultText) {
        const optDefault = document.createElement('option');
        optDefault.value = '';
        optDefault.innerText = defaultText;
        select.appendChild(optDefault);
    }

    const parentMap = {};
    const sinPadre = [];

    categories.forEach(cat => {
        if (!cat.categoria_padre_id) {
            parentMap[cat.id] = {
                id: cat.id,
                nombre: cat.nombre,
                subcategorias: []
            };
        } else {
            sinPadre.push(cat);
        }
    });

    sinPadre.forEach(cat => {
        const pid = cat.categoria_padre_id;
        if (parentMap[pid]) {
            parentMap[pid].subcategorias.push(cat);
        } else {
            parentMap[cat.id] = {
                id: cat.id,
                nombre: cat.nombre,
                subcategorias: []
            };
        }
    });

    Object.values(parentMap).forEach(parent => {
        const optParent = document.createElement('option');
        optParent.value = parent.id;
        optParent.innerText = parent.nombre;
        select.appendChild(optParent);

        parent.subcategorias.forEach(sub => {
            const optSub = document.createElement('option');
            optSub.value = sub.id;
            optSub.innerText = `↳ ${sub.nombre}`;
            select.appendChild(optSub);
        });
    });
}

async function cargarProductos() {
    const response = await window.api.getInventory(sucursalId);
    if (response.success) {
        productosCargados = response.data || [];
        // Ordenar alfabéticamente por nombre
        productosCargados.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }));
        if (filtroCategorias) {
            filtroCategorias.actualizarNegativos(productosCargados.some(p => Number(p.stock || 0) < 0));
        }
        filtrarYRenderizar();
    } else {
        alert("Error al cargar inventario: " + response.message);
    }
}

function filtrarYRenderizar() {
    const searchInput = document.getElementById('search-productos');

    let query = "";
    if (searchInput) {
        query = normalizeStr(searchInput.value);
    }

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

    const productosFiltrados = productosCargados.filter(prod => {
        if (filtrarDisponibles || filtrarNegativos) {
            const stock = Number(prod.stock || 0);
            const cumpleDisponible = filtrarDisponibles && stock > 0;
            const cumpleNegativo = filtrarNegativos && stock < 0;
            if (!cumpleDisponible && !cumpleNegativo) return false;
        }
        if (catIdsSeleccionadas.length > 0 && !allowedCatIds.includes(prod.categoria_id)) {
            return false;
        }
        if (query) {
            const terms = query.split(/\s+/).filter(Boolean);
            const nombre = normalizeStr(prod.nombre);
            const desc = normalizeStr(prod.descripcion || "");
            return terms.every(term => nombre.includes(term) || desc.includes(term));
        }
        return true;
    });

    renderizarProductos(productosFiltrados);
}

function renderizarProductos(productos) {
    const tbody = document.querySelector('#table-products tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const userRole = localStorage.getItem('currentRole') || 'Sin Rol';

    // Calcular y actualizar estadísticas
    let totalVariedad = productos.length;
    let totalUnidades = 0;
    let valorTotal = 0;

    productos.forEach(prod => {
        const stock = Number(prod.stock || 0);
        const precio = Number(prod.precio || 0);
        totalUnidades += stock;
        valorTotal += (stock * precio);
    });

    const varietyEl = document.getElementById('summary-total-variedad');
    const unitsEl = document.getElementById('summary-total-unidades');
    const valueEl = document.getElementById('summary-valor-total');

    if (varietyEl) varietyEl.innerText = totalVariedad.toLocaleString('es-CO');
    if (unitsEl) unitsEl.innerText = totalUnidades.toLocaleString('es-CO');
    if (valueEl) valueEl.innerText = `$${Math.round(valorTotal).toLocaleString('es-CO')}`;

    if (productos.length > 0) {
        productos.forEach(prod => {
            const tr = document.createElement('tr');

            const stockBajo = prod.stock <= prod.stock_minimo;
            const badge = stockBajo
                ? `<span class="badge-alert">¡Stock Bajo! (Mín: ${prod.stock_minimo})</span>`
                : `<span class="badge-ok">Óptimo</span>`;

            const imgUrl = (prod.foto_path && (prod.foto_path.startsWith('http') || prod.foto_path.startsWith('file:///')))
                ? prod.foto_path
                : (prod.foto_path ? `app-image://${prod.foto_path}` : 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=100');

            tr.innerHTML = `
                <td>
                    <div style="position: relative; width: 70px; height: 70px;">
                        <img src="${imgUrl}" alt="${prod.nombre}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid #d1d5db; display: block;">
                        <button class="eye-preview-btn" style="position: absolute; bottom: 2px; right: 2px; background-color: rgba(255, 255, 255, 0.9); border: 1px solid #d1d5db; border-radius: 50%; width: 22px; height: 22px; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.15); font-size: 0.8em; padding: 0;" title="Ver imagen en grande">👁️</button>
                    </div>
                </td>
                <td><strong>${prod.nombre}</strong></td>
                <td><span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold; color: #4b5563;">${prod.categoria_nombre || '<span style="color:#9ca3af; font-style:italic;">Sin categoría</span>'}</span></td>
                <td>${prod.descripcion}</td>
                <td>${formatCOP(prod.precio)}</td>
                <td style="${stockBajo ? 'color: #dc2626; font-weight: bold;' : ''}">
                    ${prod.stock} unidades
                    ${Number(prod.stock_reservado || 0) > 0 ? `<br><span style="font-size: 0.8em; font-weight: normal; color: #d97706;">📦 Apartado: ${prod.stock_reservado} (disp: ${Number(prod.stock) - Number(prod.stock_reservado)})</span>` : ''}
                </td>
                <td>${badge}</td>
            `;

            if (userRole === 'Administrador' || userRole === 'Operador') {
                const tdAcciones = document.createElement('td');
                const container = document.createElement('div');
                container.className = 'actions-cell';

                const isRemoteSucursal = sucursalId !== sucursalLocalId;

                if (userRole === 'Administrador') {
                    const select = document.createElement('select');
                    select.className = 'select-actions';
                    select.style.cssText = 'padding: 5px 8px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 0.85em; font-family: inherit; font-weight: 500; background: white; color: #334155; cursor: pointer; outline: none;';
                    
                    const optPlaceholder = document.createElement('option');
                    optPlaceholder.value = '';
                    optPlaceholder.innerText = '⚙️ Acciones';
                    select.appendChild(optPlaceholder);

                    const optEdit = document.createElement('option');
                    optEdit.value = 'editar';
                    optEdit.innerText = '✏️ Editar';
                    select.appendChild(optEdit);

                    const optDel = document.createElement('option');
                    optDel.value = 'borrar';
                    optDel.innerText = '🗑️ Borrar';
                    select.appendChild(optDel);

                    select.addEventListener('change', (e) => {
                        const val = e.target.value;
                        if (val === 'editar') {
                            iniciarEdicion(prod.id, prod.nombre, prod.descripcion, prod.precio, prod.stock, prod.stock_minimo, prod.foto_path, prod.categoria_id);
                        } else if (val === 'borrar') {
                            eliminarProducto(prod.id);
                        }
                        select.value = '';
                    });

                    container.appendChild(select);
                } else if (userRole === 'Operador') {
                    const btnAbastecer = document.createElement('button');
                    btnAbastecer.className = 'btn-primary';
                    if (isRemoteSucursal) {
                        btnAbastecer.style.cssText = 'padding: 6px 12px; font-size: 0.85em; font-weight: bold; background-color: #9ca3af; border: none; color: white; border-radius: 4px; cursor: not-allowed;';
                        btnAbastecer.innerText = '🔒 Solo Lectura';
                        btnAbastecer.disabled = true;
                    } else {
                        btnAbastecer.style.cssText = 'padding: 6px 12px; font-size: 0.85em; font-weight: bold; background-color: #10b981; border: none; color: white; border-radius: 4px; cursor: pointer;';
                        btnAbastecer.innerText = '➕ Abastecer';
                        btnAbastecer.addEventListener('click', () => {
                            abastecerStock(prod.id, prod.nombre);
                        });
                    }
                    container.appendChild(btnAbastecer);
                }

                tdAcciones.appendChild(container);
                tr.appendChild(tdAcciones);
            }

            const eyeBtn = tr.querySelector('.eye-preview-btn');
            if (eyeBtn) {
                eyeBtn.addEventListener('click', () => {
                    const modal = document.getElementById('image-preview-modal');
                    const modalImg = document.getElementById('image-preview-src');
                    if (modal && modalImg) {
                        modalImg.src = imgUrl;
                        modal.style.display = 'flex';
                    }
                });
            }

            tbody.appendChild(tr);
        });
    } else {
        const cols = (userRole === 'Administrador' || userRole === 'Operador') ? 8 : 7;
        tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align: center;">No se encontraron productos.</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const imagePreviewModal = document.getElementById('image-preview-modal');
    if (imagePreviewModal) {
        imagePreviewModal.addEventListener('click', () => {
            imagePreviewModal.style.display = 'none';
        });
    }

    const resId = await window.api.obtenerSucursalId();
    if (resId.success) {
        sucursalLocalId = resId.id;
        sucursalId = resId.id;
    }

    const user = localStorage.getItem('currentUser') || 'Invitado';
    const role = localStorage.getItem('currentRole') || 'Sin Rol';
    const displayUser = document.getElementById('display-user');
    const displayRole = document.getElementById('display-role');
    if (displayUser) displayUser.innerText = user;
    if (displayRole) displayRole.innerText = role;

    const thAcciones = document.getElementById('th-acciones');
    if (role === 'Administrador' || role === 'Operador') {
        if (thAcciones) thAcciones.style.display = '';

        const btnPlantilla = document.getElementById('btn-plantilla-abastecimiento');
        const btnCargarAbastecimiento = document.getElementById('btn-cargar-abastecimiento');
        if (btnPlantilla) btnPlantilla.style.display = 'inline-flex';
        if (btnCargarAbastecimiento) btnCargarAbastecimiento.style.display = 'inline-flex';
        actualizarAccesoAbastecimientoMasivo();
    }

    // Un Operador solo puede abastecer (individual o masivo) la sucursal activa del PC; al ver una
    // sucursal remota en el select, el botón "Abastecer" individual ya se bloquea (ver isRemoteSucursal
    // en renderizarProductos) -- esta función aplica el mismo candado al botón de carga masiva por
    // archivo, que antes quedaba habilitado sin importar la sucursal seleccionada.
    function actualizarAccesoAbastecimientoMasivo() {
        const btn = document.getElementById('btn-cargar-abastecimiento');
        if (!btn) return;
        const bloqueado = role === 'Operador' && sucursalId !== sucursalLocalId;
        btn.disabled = bloqueado;
        btn.style.opacity = bloqueado ? '0.6' : '';
        btn.style.cursor = bloqueado ? 'not-allowed' : '';
        btn.title = bloqueado ? 'Solo lectura: no puede abastecer una sucursal remota' : '';
    }

    if (role === 'Administrador') {
        const btnNuevo = document.getElementById('btn-nuevo-producto');
        if (btnNuevo) btnNuevo.style.display = 'inline-flex';
        
        const btnAdmin = document.getElementById('btn-nav-admin');
        if (btnAdmin) btnAdmin.style.display = 'block';
    }

    if (role === 'Administrador' || role === 'Operador') {
        const resSucs = await window.api.obtenerSucursalesDisponibles();
        if (resSucs.success && resSucs.data) {
            const selectSucs = document.getElementById('select-sucursal-inventario');
            const displaySuc = document.getElementById('display-sucursal');
            
            if (selectSucs && displaySuc) {
                displaySuc.style.display = 'none';
                selectSucs.innerHTML = '';
                resSucs.data.forEach(id => {
                    const opt = document.createElement('option');
                    opt.value = id;
                    opt.innerText = `🏢 ${id === sucursalLocalId ? 'Sucursal Local: ' : ''}${id}`;
                    selectSucs.appendChild(opt);
                });
                selectSucs.value = sucursalId;
                selectSucs.style.display = 'inline-block';

                selectSucs.addEventListener('change', async (e) => {
                    sucursalId = e.target.value;
                    actualizarAccesoAbastecimientoMasivo();
                    await cargarProductos();
                });
            }
        }
    } else {
        const displaySuc = document.getElementById('display-sucursal');
        if (displaySuc) {
            displaySuc.innerText = `🏢 Sucursal: ${sucursalId}`;
        }
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

    const prodPrecioInput = document.getElementById('prod-precio');
    if (prodPrecioInput) {
        prodPrecioInput.addEventListener('input', (e) => {
            e.target.value = formatNumberUI(e.target.value);
        });
        prodPrecioInput.addEventListener('focus', function() {
            this.select();
        });
    }

    // Cargar las categorías y montar el selector múltiple de filtro
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
            onChange: () => filtrarYRenderizar()
        });
    }

    // Buscador de productos
    const searchInput = document.getElementById('search-productos');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filtrarYRenderizar();
        });
    }

    await cargarProductos();

    // Escuchar actualizaciones de inventario en tiempo real
    if (window.api && window.api.onInventarioActualizado) {
        window.api.onInventarioActualizado(() => {
            cargarProductos();
        });
    }

    // Refresca la tabla tras sincronizar sin cerrar modales ni tocar el formulario abierto
    window.addEventListener('pos-sincronizacion-completa', () => {
        cargarProductos();
    });

    // Modales de producto
    const modal = document.getElementById('modal-producto');
    const btnNuevo = document.getElementById('btn-nuevo-producto');
    const btnClose = document.getElementById('btn-close-modal');
    const formProducto = document.getElementById('form-producto');
    const btnSelectFoto = document.getElementById('btn-buscar-foto');
    const fileInputFoto = document.getElementById('prod-foto-file');
    const txtProdFoto = document.getElementById('prod-foto');

    const rellenarModalCategorias = async (selectedCategoriaId = '') => {
        const resCat = await window.api.obtenerCategorias();
        const select = document.getElementById('prod-categoria');
        if (select) {
            if (resCat.success && resCat.data) {
                rellenarSelectorAgrupado(select, resCat.data, "-- Sin Categoría --");
                select.value = selectedCategoriaId || '';
            }
        }
    };

    if (btnNuevo) {
        btnNuevo.addEventListener('click', async () => {
            editingProductId = null;
            const modalTitle = modal.querySelector('.modal-header h3');
            const submitBtn = formProducto.querySelector('button[type="submit"]');
            if (modalTitle) modalTitle.innerText = "Agregar Nuevo Producto";
            if (submitBtn) submitBtn.innerText = "Registrar Producto";
            formProducto.reset();
            await rellenarModalCategorias();
            modal.style.display = 'flex';
        });
    }

    if (btnClose) {
        btnClose.addEventListener('click', () => {
            modal.style.display = 'none';
            formProducto.reset();
            editingProductId = null;
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            formProducto.reset();
            editingProductId = null;
        }
    });

    if (btnSelectFoto && fileInputFoto) {
        btnSelectFoto.addEventListener('click', () => {
            fileInputFoto.click();
        });

        fileInputFoto.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const absolutePath = window.api.getPathForFile(file);
                if (absolutePath) {
                    txtProdFoto.value = `file:///${absolutePath.replace(/\\/g, '/')}`;
                } else {
                    alert("No se pudo obtener la ruta del archivo seleccionado.");
                }
            }
        });
    }

    if (formProducto) {
        formProducto.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('prod-nombre').value.trim();
            const descripcion = document.getElementById('prod-descripcion').value.trim();
            const precio = parseNumberUI(document.getElementById('prod-precio').value);
            const stock = parseInt(document.getElementById('prod-stock').value, 10);
            const stockMinimo = parseInt(document.getElementById('prod-stock-minimo').value, 10);
            const categoriaId = document.getElementById('prod-categoria').value;
            const fotoPath = txtProdFoto.value.trim();

            if (!nombre || isNaN(precio) || isNaN(stock) || isNaN(stockMinimo)) {
                alert("Por favor rellena correctamente todos los campos obligatorios.");
                return;
            }

            const currentUser = localStorage.getItem('currentUser') || 'Invitado';
            const currentRole = localStorage.getItem('currentRole') || 'Sin Rol';

            let response;
            if (editingProductId) {
                response = await window.api.editarProducto({
                    id: editingProductId,
                    nombre,
                    descripcion,
                    precio,
                    stock,
                    stockMinimo,
                    sucursalId,
                    fotoPath,
                    categoriaId,
                    auditoriaUsuario: currentUser,
                    auditoriaRol: currentRole
                });
            } else {
                response = await window.api.registrarProducto({
                    sucursalId,
                    nombre,
                    descripcion,
                    precio,
                    stock,
                    stockMinimo,
                    fotoPath,
                    categoriaId,
                    auditoriaUsuario: currentUser,
                    auditoriaRol: currentRole
                });
            }

            if (response.success) {
                alert(response.message);
                modal.style.display = 'none';
                formProducto.reset();
                editingProductId = null;
                await cargarProductos();
            } else {
                alert(response.message);
            }
        });
    }

    // Modal de abastecer stock
    const modalAbastecer = document.getElementById('modal-abastecer');
    const btnCloseAbastecer = document.getElementById('btn-close-abastecer-modal');
    const formAbastecer = document.getElementById('form-abastecer');

    if (btnCloseAbastecer) {
        btnCloseAbastecer.addEventListener('click', () => {
            modalAbastecer.style.display = 'none';
            formAbastecer.reset();
            abastecerProductId = null;
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalAbastecer) {
            modalAbastecer.style.display = 'none';
            formAbastecer.reset();
            abastecerProductId = null;
        }
    });

    if (formAbastecer) {
        formAbastecer.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cantidad = parseInt(document.getElementById('abastecer-cantidad').value, 10);
            if (isNaN(cantidad) || cantidad <= 0) {
                alert("Por favor, ingrese un número entero positivo válido.");
                return;
            }

            const currentUser = localStorage.getItem('currentUser') || 'Invitado';
            const currentRole = localStorage.getItem('currentRole') || 'Sin Rol';

            const response = await window.api.abastecerStock({ 
                id: abastecerProductId, 
                cantidad, 
                sucursalId, 
                auditoriaUsuario: currentUser, 
                auditoriaRol: currentRole 
            });
            alert(response.message);
            if (response.success) {
                modalAbastecer.style.display = 'none';
                formAbastecer.reset();
                abastecerProductId = null;
                await cargarProductos();
            }
        });
    }

    // Exportar plantilla de abastecimiento: un Excel (.xlsx) real con el catalogo actual de la
    // sucursal y "Cantidad a Ingresar" en 0, para que el usuario solo llene los productos de ese
    // pedido puntual (carga parcial, no hace falta llenar todos). Se genera en el proceso
    // principal (Node/exceljs) y se guarda con el dialogo nativo de Windows.
    const btnPlantilla = document.getElementById('btn-plantilla-abastecimiento');
    if (btnPlantilla) {
        btnPlantilla.addEventListener('click', async () => {
            const response = await window.api.generarPlantillaAbastecimiento({ sucursalId });
            if (response.cancelado) return;
            alert(response.message);
        });
    }

    // Cargar Abastecimiento desde archivo: abre el selector nativo, valida contra el catálogo
    // y muestra una previsualización para reconfirmar el total antes de tocar el inventario.
    const modalMasivo = document.getElementById('modal-abastecimiento-masivo');
    const btnCargarAbastecimiento = document.getElementById('btn-cargar-abastecimiento');
    const btnCloseMasivo = document.getElementById('btn-close-abastecimiento-masivo-modal');
    const btnConfirmarMasivo = document.getElementById('btn-confirmar-abastecimiento-masivo');
    let itemsAbastecimientoMasivo = [];
    let archivoAbastecimientoMasivo = '';

    function renderizarPreviewAbastecimientoMasivo() {
        const tbody = document.querySelector('#table-abastecimiento-masivo tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        itemsAbastecimientoMasivo.forEach((item) => {
            const tr = document.createElement('tr');
            const estado = item.valido
                ? '<span style="color:#16a34a; font-weight:500;">✅ Válido</span>'
                : `<span style="color:#dc2626; font-weight:500;">⚠️ ${item.motivo}</span>`;
            tr.innerHTML = `
                <td>${item.nombre}</td>
                <td>${item.stockActual === null ? '-' : item.stockActual + ' unidades'}</td>
                <td>${item.cantidad}</td>
                <td>${estado}</td>
            `;
            tbody.appendChild(tr);
        });

        const validos = itemsAbastecimientoMasivo.filter((i) => i.valido);
        const totalUnidades = validos.reduce((sum, i) => sum + Number(i.cantidad), 0);
        document.getElementById('abastecimiento-masivo-resumen').innerText =
            `${validos.length} producto(s) válido(s) - ${totalUnidades} unidades en total`;

        if (btnConfirmarMasivo) btnConfirmarMasivo.disabled = validos.length === 0;
    }

    if (btnCargarAbastecimiento) {
        btnCargarAbastecimiento.addEventListener('click', async () => {
            if (role === 'Operador' && sucursalId !== sucursalLocalId) {
                alert('No tiene permiso para abastecer una sucursal remota.');
                return;
            }
            const response = await window.api.previsualizarAbastecimientoArchivo({ sucursalId });
            if (response.cancelado) return;
            if (!response.success) {
                alert(response.message || 'No se pudo leer el archivo.');
                return;
            }
            itemsAbastecimientoMasivo = response.items;
            archivoAbastecimientoMasivo = response.archivo;
            document.getElementById('abastecimiento-masivo-archivo').innerText = `Archivo: ${response.archivo}`;
            renderizarPreviewAbastecimientoMasivo();
            if (modalMasivo) modalMasivo.style.display = 'flex';
        });
    }

    if (btnCloseMasivo) {
        btnCloseMasivo.addEventListener('click', () => {
            if (modalMasivo) modalMasivo.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalMasivo) {
            modalMasivo.style.display = 'none';
        }
    });

    if (btnConfirmarMasivo) {
        btnConfirmarMasivo.addEventListener('click', async () => {
            if (role === 'Operador' && sucursalId !== sucursalLocalId) {
                alert('No tiene permiso para abastecer una sucursal remota.');
                return;
            }
            const validos = itemsAbastecimientoMasivo.filter((i) => i.valido);
            if (validos.length === 0) return;
            if (!confirm(`¿Confirmas ingresar ${validos.length} producto(s) al inventario de esta sucursal?`)) return;

            const currentUser = localStorage.getItem('currentUser') || 'Invitado';
            const currentRole = localStorage.getItem('currentRole') || 'Sin Rol';

            const response = await window.api.confirmarAbastecimientoMasivo({
                sucursalId,
                items: validos,
                archivo: archivoAbastecimientoMasivo,
                auditoriaUsuario: currentUser,
                auditoriaRol: currentRole
            });
            alert(response.message);
            if (response.success) {
                if (modalMasivo) modalMasivo.style.display = 'none';
                itemsAbastecimientoMasivo = [];
                await cargarProductos();
            }
        });
    }

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
});

let abastecerProductId = null;

// Abastecer Stock (Exclusivo Operadores/Administradores)
window.abastecerStock = (id, nombre) => {
    abastecerProductId = id;
    const modalAbastecer = document.getElementById('modal-abastecer');
    const nameEl = document.getElementById('abastecer-prod-nombre');
    if (nameEl) nameEl.innerText = `Producto: ${nombre}`;
    if (modalAbastecer) modalAbastecer.style.display = 'flex';
};

window.iniciarEdicion = async (id, nombre, descripcion, precio, stock, stockMinimo, fotoPath, categoriaId) => {
    editingProductId = id;
    const modal = document.getElementById('modal-producto');
    const formProducto = document.getElementById('form-producto');
    if (modal && formProducto) {
        const modalTitle = modal.querySelector('.modal-header h3');
        const submitBtn = formProducto.querySelector('button[type="submit"]');
        if (modalTitle) modalTitle.innerText = "Editar Producto";
        if (submitBtn) submitBtn.innerText = "Guardar Cambios";

        document.getElementById('prod-nombre').value = nombre;
        document.getElementById('prod-descripcion').value = descripcion;
        document.getElementById('prod-precio').value = formatNumberUI(precio);
        document.getElementById('prod-stock').value = stock;
        document.getElementById('prod-stock-minimo').value = stockMinimo;
        
        const txtProdFoto = document.getElementById('prod-foto');
        if (txtProdFoto) txtProdFoto.value = fotoPath || '';

        // Rellenar categorías y preseleccionar la del producto
        const resCat = await window.api.obtenerCategorias();
        const select = document.getElementById('prod-categoria');
        if (select) {
            if (resCat.success && resCat.data) {
                rellenarSelectorAgrupado(select, resCat.data, "-- Sin Categoría --");
                select.value = categoriaId || '';
            }
        }

        modal.style.display = 'flex';
    }
};

window.eliminarProducto = async (id) => {
    if (confirm("¿Estás seguro de que deseas borrar este producto?")) {
        const currentUser = localStorage.getItem('currentUser') || 'Invitado';
        const currentRole = localStorage.getItem('currentRole') || 'Sin Rol';

        const response = await window.api.eliminarProducto({ 
            id, 
            auditoriaUsuario: currentUser, 
            auditoriaRol: currentRole 
        });
        alert(response.message);
        if (response.success) {
            await cargarProductos();
        }
    }
};