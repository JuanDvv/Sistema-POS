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

let editingUserId = null; // ID del usuario en edición (null si es creación)
let editingSucursalId = null; // ID de la sucursal en edición (null si es creación)
let editingCategoriaId = null; // ID de la categoría en edición (null si es creación)
let editingClienteId = null; // ID del cliente en edición (null si es creación)
let activeUserSession = ''; // Guardará el username de quien está logueado para no auto-eliminarse


document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validar Rol: Administrador ve el panel completo; Operador ve Cambiar Contraseña,
    // Impresora de Tickets y Clientes (las demás secciones de gestión general quedan ocultas,
    // no bloqueadas con redirección, para que ambos roles puedan llegar a esta página desde el sidebar).
    const user = sessionStorage.getItem('currentUser') || 'Invitado';
    const role = sessionStorage.getItem('currentRole') || 'Sin Rol';
    const esAdministrador = role === 'Administrador';
    activeUserSession = user;

    document.getElementById('display-user').innerText = user;
    document.getElementById('display-role').innerText = role;

    if (esAdministrador) {
        const seccionPassword = document.getElementById('section-cambiar-password');
        if (seccionPassword) seccionPassword.style.display = 'none';
    } else {
        ['section-solicitudes', 'section-solicitudes-gasto', 'section-abonos-eliminados', 'section-sucursales', 'section-usuarios', 'section-categorias', 'section-sugeridos-pasteleria'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        const titulo = document.querySelector('.header-title h1');
        if (titulo) titulo.innerText = 'Mi Cuenta';
        const subtitulo = document.querySelector('.header-title span');
        if (subtitulo) subtitulo.innerText = 'Configuración Personal';
    }

    // Cambiar mi Contraseña (disponible para Operador)
    const formCambiarPassword = document.getElementById('form-cambiar-password');
    if (formCambiarPassword) {
        formCambiarPassword.addEventListener('submit', async (e) => {
            e.preventDefault();
            const passwordActual = document.getElementById('cambiar-password-actual').value;
            const passwordNueva = document.getElementById('cambiar-password-nueva').value;
            const passwordConfirmar = document.getElementById('cambiar-password-confirmar').value;

            if (passwordNueva !== passwordConfirmar) {
                alert('La nueva contraseña y su confirmación no coinciden.');
                return;
            }

            const res = await window.api.cambiarPasswordPropio({
                username: user,
                passwordActual,
                passwordNueva,
                auditoriaRol: role
            });

            alert(res.message);
            if (res.success) {
                formCambiarPassword.reset();
            }
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

    // Impresora de tickets de este equipo (disponible para Operador y Administrador)
    await cargarSeccionImpresora();

    // Clientes (disponible para Operador y Administrador)
    await cargarClientes();

    const filtroClientes = document.getElementById('filtro-clientes');
    if (filtroClientes) {
        filtroClientes.addEventListener('change', () => renderizarClientes());
    }

    const buscadorClientes = document.getElementById('buscador-clientes');
    if (buscadorClientes) {
        buscadorClientes.addEventListener('input', () => renderizarClientes());
    }

    const modalCliente = document.getElementById('modal-cliente');
    const btnNuevoCliente = document.getElementById('btn-nuevo-cliente');
    const btnCloseModalCliente = document.getElementById('btn-close-cliente-modal');
    const formCliente = document.getElementById('form-cliente');

    if (btnNuevoCliente) {
        btnNuevoCliente.addEventListener('click', () => {
            editingClienteId = null;
            document.getElementById('modal-cliente-title').innerText = "Agregar Cliente";
            formCliente.reset();
            modalCliente.style.display = 'flex';
        });
    }

    if (btnCloseModalCliente) {
        btnCloseModalCliente.addEventListener('click', () => {
            modalCliente.style.display = 'none';
            formCliente.reset();
            editingClienteId = null;
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalCliente) {
            modalCliente.style.display = 'none';
            formCliente.reset();
            editingClienteId = null;
        }
    });

    if (formCliente) {
        formCliente.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('cliente-nombre').value.trim();
            const tipo = document.getElementById('cliente-tipo').value;
            const categoria = document.getElementById('cliente-categoria').value;
            const identificacion = document.getElementById('cliente-identificacion').value.trim();
            const telefono = document.getElementById('cliente-telefono').value.trim();
            const email = document.getElementById('cliente-email').value.trim();

            if (!nombre || !tipo) {
                alert("Por favor ingrese los campos obligatorios.");
                return;
            }

            const res = await window.api.guardarCliente({
                id: editingClienteId,
                nombre,
                tipo,
                categoria,
                identificacion,
                telefono,
                email,
                auditoriaUsuario: activeUserSession,
                auditoriaRol: role
            });

            alert(res.message);
            if (res.success) {
                modalCliente.style.display = 'none';
                formCliente.reset();
                editingClienteId = null;
                await cargarClientes();
            }
        });
    }

    window.addEventListener('pos-sincronizacion-completa', () => {
        cargarClientes();
    });

    if (!esAdministrador) {
        return;
    }

    // 2. Cargar Datos de Sucursales
    await cargarSucursales();

    // 3. Cargar Usuarios
    await cargarUsuarios();

    // 4. Modales y Formularios
    const modalUsuario = document.getElementById('modal-usuario');
    const btnNuevoUsuario = document.getElementById('btn-nuevo-usuario');
    const btnCloseModalUsuario = document.getElementById('btn-close-modal');
    const formUsuario = document.getElementById('form-usuario');

    const modalSucursal = document.getElementById('modal-sucursal');
    const btnNuevaSucursal = document.getElementById('btn-nueva-sucursal');
    const btnCloseModalSucursal = document.getElementById('btn-close-sucursal-modal');
    const formSucursal = document.getElementById('form-sucursal');

    // Botones Abrir/Cerrar modales de Usuarios
    if (btnNuevoUsuario) {
        btnNuevoUsuario.addEventListener('click', () => {
            editingUserId = null;
            document.getElementById('modal-title').innerText = "Agregar Nuevo Usuario";
            formUsuario.reset();
            modalUsuario.style.display = 'flex';
        });
    }

    if (btnCloseModalUsuario) {
        btnCloseModalUsuario.addEventListener('click', () => {
            modalUsuario.style.display = 'none';
            formUsuario.reset();
            editingUserId = null;
        });
    }

    // Botones Abrir/Cerrar modales de Sucursales
    if (btnNuevaSucursal) {
        btnNuevaSucursal.addEventListener('click', () => {
            editingSucursalId = null;
            document.getElementById('modal-sucursal-title').innerText = "Agregar Nueva Sucursal";
            document.getElementById('sucursal-id-input').disabled = false;
            formSucursal.reset();
            modalSucursal.style.display = 'flex';
        });
    }

    if (btnCloseModalSucursal) {
        btnCloseModalSucursal.addEventListener('click', () => {
            modalSucursal.style.display = 'none';
            formSucursal.reset();
            editingSucursalId = null;
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalUsuario) {
            modalUsuario.style.display = 'none';
            formUsuario.reset();
            editingUserId = null;
        }
        if (e.target === modalSucursal) {
            modalSucursal.style.display = 'none';
            formSucursal.reset();
            editingSucursalId = null;
        }
    });

    // Guardar / Crear Sucursal
    if (formSucursal) {
        formSucursal.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newId = document.getElementById('sucursal-id-input').value.trim();
            const nombre = document.getElementById('sucursal-nombre').value.trim();
            const direccion = document.getElementById('sucursal-direccion').value.trim();
            const telefono = document.getElementById('sucursal-telefono').value.trim();

            if (!newId || !nombre) {
                alert("Por favor ingrese el ID y el Nombre de la sucursal.");
                return;
            }

            const res = await window.api.guardarSucursal({
                oldId: editingSucursalId,
                newId,
                nombre,
                direccion,
                telefono,
                auditoriaUsuario: activeUserSession,
                auditoriaRol: 'Administrador'
            });

            if (res.success) {
                alert("Sucursal guardada exitosamente.");
                if (res.message && res.message.includes('⚠️')) {
                    console.error('[Sucursales] Sync en segundo plano:', res.message);
                }
                modalSucursal.style.display = 'none';
                formSucursal.reset();
                editingSucursalId = null;
                await cargarSucursales();
            } else {
                alert(res.message);
            }
        });
    }

    // Guardar / Editar Usuario
    if (formUsuario) {
        formUsuario.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('user-name').value.trim();
            const password = document.getElementById('user-password').value.trim();
            const rol = document.getElementById('user-rol').value;

            if (!username || !password || !rol) {
                alert("Por favor rellene todos los campos obligatorios.");
                return;
            }

            const res = await window.api.guardarUsuario({
                id: editingUserId,
                username,
                password,
                rol,
                auditoriaUsuario: activeUserSession,
                auditoriaRol: 'Administrador'
            });

            alert(res.message);
            if (res.success) {
                modalUsuario.style.display = 'none';
                formUsuario.reset();
                editingUserId = null;
                await cargarUsuarios();
            }
        });
    }

    // --- 5. Cargar e Iniciar Categorías ---
    await cargarCategorias();

    const modalCategoria = document.getElementById('modal-categoria');
    const btnNuevaCategoria = document.getElementById('btn-nueva-categoria');
    const btnCloseModalCategoria = document.getElementById('btn-close-categoria-modal');
    const formCategoria = document.getElementById('form-categoria');

    if (btnNuevaCategoria) {
        btnNuevaCategoria.addEventListener('click', async () => {
            editingCategoriaId = null;
            document.getElementById('modal-categoria-title').innerText = "Agregar Categoría/Subcategoría";
            formCategoria.reset();
            await rellenarCategoriasPadreSelect();
            modalCategoria.style.display = 'flex';
        });
    }

    if (btnCloseModalCategoria) {
        btnCloseModalCategoria.addEventListener('click', () => {
            modalCategoria.style.display = 'none';
            formCategoria.reset();
            editingCategoriaId = null;
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalCategoria) {
            modalCategoria.style.display = 'none';
            formCategoria.reset();
            editingCategoriaId = null;
        }
    });

    if (formCategoria) {
        formCategoria.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('categoria-nombre').value.trim();
            const categoriaPadreId = document.getElementById('categoria-padre-select').value;

            if (!nombre) {
                alert("Por favor ingrese el Nombre de la categoría.");
                return;
            }

            const res = await window.api.guardarCategoria({
                id: editingCategoriaId,
                nombre,
                categoriaPadreId,
                auditoriaUsuario: activeUserSession,
                auditoriaRol: 'Administrador'
            });

            alert(res.message);
            if (res.success) {
                modalCategoria.style.display = 'none';
                formCategoria.reset();
                editingCategoriaId = null;
                await cargarCategorias();
            }
        });
    }

    // --- 6. Cargar e Iniciar Solicitudes de Ventas de Fecha Anterior ---
    await cargarSolicitudes();

    const filtroSolicitudes = document.getElementById('filtro-solicitudes');
    if (filtroSolicitudes) {
        filtroSolicitudes.addEventListener('change', () => cargarSolicitudes());
    }

    // --- 6b. Cargar e Iniciar Solicitudes de Gastos de Fecha Anterior ---
    await cargarSolicitudesGasto();

    const filtroSolicitudesGasto = document.getElementById('filtro-solicitudes-gasto');
    if (filtroSolicitudesGasto) {
        filtroSolicitudesGasto.addEventListener('change', () => cargarSolicitudesGasto());
    }

    // --- 6c. Cargar e Iniciar Abonos Eliminados (recuperación). A diferencia de las solicitudes
    // (consulta local), esto lee directo de Supabase -- se omite para Operador, que igual no ve
    // la sección, para no gastar una consulta de red ni mostrarle un error si está sin internet.
    if (esAdministrador) {
        await cargarAbonosEliminados();
        const btnRefrescarAbonosEliminados = document.getElementById('btn-refrescar-abonos-eliminados');
        if (btnRefrescarAbonosEliminados) {
            btnRefrescarAbonosEliminados.addEventListener('click', () => cargarAbonosEliminados());
        }

        // --- 6d. Sugeridos Semanales de Pastelería (solo Administrador) ---
        await inicializarSugeridosPasteleria();
    }

    // --- 6e. Calculadora de Pedido Extra de Pastelería (Administrador y Operador) ---
    await inicializarCalculadoraPedidoExtra();

    // Al terminar un ciclo de sincronización (automático cada 15s o manual), refrescar las
    // tablas que dependen de datos que otra terminal pudo haber cambiado. Sin esto, un cambio
    // de sucursal/usuario/cliente hecho en otro equipo solo se veía tras salir y volver a
    // entrar (lo que forzaba una recarga completa de la página).
    window.addEventListener('pos-sincronizacion-completa', () => {
        cargarSucursales();
        cargarUsuarios();
    });
});

// Cargar información de sucursales
async function cargarSucursales() {
    const res = await window.api.obtenerTodasSucursales();
    const tbody = document.querySelector('#table-sucursales tbody');
    tbody.innerHTML = '';

    if (res.success && res.data) {
        res.data.forEach(suc => {
            const tr = document.createElement('tr');

            // Renderizar insignias y botones condicionales según estado 'activa'
            const isActiva = suc.activa === 1;
            const badge = isActiva 
                ? `<span style="background-color: #d1fae5; color: #065f46; padding: 3px 8px; border-radius: 12px; font-size: 0.85em; font-weight: bold;">🟢 Activa en este PC</span>` 
                : `<span style="background-color: #f3f4f6; color: #374151; padding: 3px 8px; border-radius: 12px; font-size: 0.85em;">Inactiva</span>`;
            
            const activateBtn = isActiva 
                ? '' 
                : `<button class="btn-activate" onclick="activarSucursal('${suc.id}')">🔌 Activar</button>`;

            // Escapar comillas
            const escId = (suc.id || '').replace(/'/g, "\\'");
            const escNombre = (suc.nombre || '').replace(/'/g, "\\'");
            const escDireccion = (suc.direccion || '').replace(/'/g, "\\'");
            const escTelefono = (suc.telefono || '').replace(/'/g, "\\'");

            tr.innerHTML = `
                <td><code>${suc.id}</code></td>
                <td><strong>${suc.nombre}</strong></td>
                <td>${suc.direccion || '<span style="color:#9ca3af;">Sin Dirección</span>'}</td>
                <td>${suc.telefono || '<span style="color:#9ca3af;">Sin Teléfono</span>'}</td>
                <td>${badge}</td>
                <td>
                    <div class="actions-cell">
                        ${activateBtn}
                        <button class="btn-edit" onclick="iniciarEdicionSucursal('${escId}', '${escNombre}', '${escDireccion}', '${escTelefono}')">✏️ Editar</button>
                        <button class="btn-delete" onclick="eliminarSucursal('${escId}')">🗑️ Borrar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">Error al cargar sucursales.</td></tr>`;
    }
}

// Cargar listado de usuarios
async function cargarUsuarios() {
    const res = await window.api.obtenerUsuarios();
    const tbody = document.querySelector('#table-users tbody');
    tbody.innerHTML = '';

    if (res.success && res.data) {
        res.data.forEach(usr => {
            const tr = document.createElement('tr');

            // Botones de acción
            const isSelf = usr.username.toLowerCase() === activeUserSession.toLowerCase();
            const deleteBtn = isSelf 
                ? `<span style="color: #9ca3af; font-size: 0.85em; font-style: italic;">Sesión Activa</span>` 
                : `<button class="btn-delete" onclick="eliminarUsuario('${usr.id}', '${usr.username}')">🗑️ Borrar</button>`;

            const escUser = (usr.username || '').replace(/'/g, "\\'");
            const escPass = (usr.password || '').replace(/'/g, "\\'");
            const escPassAttr = (usr.password || '').replace(/"/g, '&quot;');

            tr.innerHTML = `
                <td><strong>${usr.username}</strong></td>
                <td><span style="background-color: ${usr.rol === 'Administrador' ? '#fee2e2' : '#dbeafe'}; color: ${usr.rol === 'Administrador' ? '#ef4444' : '#2563eb'}; padding: 3px 8px; border-radius: 12px; font-size: 0.85em; font-weight: 500;">${usr.rol}</span></td>
                <td>
                    <span class="pass-mask" data-pass="${escPassAttr}" style="font-family: monospace;">••••••••</span>
                    <button type="button" onclick="togglePasswordCell(this)" title="Mostrar contraseña" style="background:none; border:none; cursor:pointer; font-size:0.9em; vertical-align:middle;">👁️</button>
                </td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-edit" onclick="iniciarEdicionUsuario('${usr.id}', '${escUser}', '${escPass}', '${usr.rol}')">✏️ Editar</button>
                        ${deleteBtn}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ef4444;">Error al cargar usuarios.</td></tr>`;
    }
}

// Métodos Globales para Sucursales
window.iniciarEdicionSucursal = (id, nombre, direccion, telefono) => {
    editingSucursalId = id;
    const modalSucursal = document.getElementById('modal-sucursal');
    document.getElementById('modal-sucursal-title').innerText = "Editar Sucursal";
    
    document.getElementById('sucursal-id-input').value = id;
    document.getElementById('sucursal-id-input').disabled = true; // No permitir cambiar ID en edición
    document.getElementById('sucursal-nombre').value = nombre;
    document.getElementById('sucursal-direccion').value = direccion === 'undefined' ? '' : direccion;
    document.getElementById('sucursal-telefono').value = telefono === 'undefined' ? '' : telefono;

    modalSucursal.style.display = 'flex';
};

window.activarSucursal = async (id) => {
    const res = await window.api.activarSucursal({ id, auditoriaUsuario: activeUserSession, auditoriaRol: 'Administrador' });
    alert(res.message);
    if (res.success) {
        await cargarSucursales();
    }
};

window.eliminarSucursal = async (id) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la sucursal "${id}"?`)) {
        const res = await window.api.eliminarSucursal({ id, auditoriaUsuario: activeUserSession, auditoriaRol: 'Administrador' });
        if (res.success) {
            alert(res.message);
            await cargarSucursales();
            return;
        }
        mostrarModalSucursalBloqueada(id, res);
    }
};

// Cuando el borrado se bloquea por stock pendiente, en vez de un alert sin salida se ofrecen las
// dos formas reales de vaciar el inventario que ya existen en el sistema (Transferencias y Gastos
// > Gasto de Inventario), preseleccionando la sucursal para no obligar al admin a repetir la
// búsqueda. Otros motivos de bloqueo (sucursal activa, pedidos pendientes) no tienen una acción
// de navegación asociada, así que solo se muestra el mensaje.
function mostrarModalSucursalBloqueada(id, res) {
    const modal = document.getElementById('modal-sucursal-bloqueada');
    const body = document.getElementById('modal-sucursal-bloqueada-body');
    if (!modal || !body) {
        alert(res.message);
        return;
    }

    if (res.code === 'STOCK_PENDIENTE') {
        body.innerHTML = `
            <p style="margin-bottom:16px;">${res.message}</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <button type="button" class="btn-primary" id="btn-ir-transferir-stock" style="width:100%; justify-content:center;">🔄 Transferir stock a otra sucursal</button>
                <button type="button" class="btn-delete" id="btn-ir-descartar-stock" style="width:100%; justify-content:center;">🗑️ Descartar / dar de baja todo el stock</button>
            </div>
        `;
        document.getElementById('btn-ir-transferir-stock').addEventListener('click', () => {
            window.location.href = 'transferencias.html?sucursalOrigen=' + encodeURIComponent(id);
        });
        document.getElementById('btn-ir-descartar-stock').addEventListener('click', () => {
            window.location.href = 'gastos.html?sucursal=' + encodeURIComponent(id) + '&tipo=' + encodeURIComponent('Gasto de Inventario');
        });
    } else {
        body.innerHTML = `<p>${res.message}</p>`;
    }

    modal.style.display = 'flex';
}

const btnCloseSucursalBloqueada = document.getElementById('btn-close-sucursal-bloqueada-modal');
if (btnCloseSucursalBloqueada) {
    btnCloseSucursalBloqueada.addEventListener('click', () => {
        document.getElementById('modal-sucursal-bloqueada').style.display = 'none';
    });
}
window.addEventListener('click', (e) => {
    const modalSucursalBloqueada = document.getElementById('modal-sucursal-bloqueada');
    if (e.target === modalSucursalBloqueada) {
        modalSucursalBloqueada.style.display = 'none';
    }
});

// Alterna entre mostrar y ocultar la contraseña de una fila de la tabla de usuarios
window.togglePasswordCell = (btn) => {
    const span = btn.previousElementSibling;
    const estaOculta = span.innerText === '••••••••';
    span.innerText = estaOculta ? span.dataset.pass : '••••••••';
    btn.innerText = estaOculta ? '🙈' : '👁️';
    btn.title = estaOculta ? 'Ocultar contraseña' : 'Mostrar contraseña';
};

// Métodos Globales para Usuarios
window.iniciarEdicionUsuario = (id, username, password, rol) => {
    editingUserId = id;
    const modal = document.getElementById('modal-usuario');
    document.getElementById('modal-title').innerText = "Editar Usuario";
    
    document.getElementById('user-name').value = username;
    document.getElementById('user-password').value = password;
    document.getElementById('user-rol').value = rol;

    modal.style.display = 'flex';
};

window.eliminarUsuario = async (id, username) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la cuenta del usuario "${username}"?`)) {
        const res = await window.api.eliminarUsuario({ id, username, auditoriaUsuario: activeUserSession, auditoriaRol: 'Administrador' });
        alert(res.message);
        if (res.success) {
            await cargarUsuarios();
        }
    }
};

// Cerrar sesión
document.getElementById('btn-logout').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
});

// Cargar categorías en la tabla
async function cargarCategorias() {
    const res = await window.api.obtenerCategorias();
    const tbody = document.querySelector('#table-categorias tbody');
    tbody.innerHTML = '';

    if (res.success && res.data) {
        // Agrupar subcategorías debajo de sus categorías padres
        const parentCategories = res.data.filter(c => !c.categoria_padre_id);
        const subCategories = res.data.filter(c => c.categoria_padre_id);
        
        const sortedList = [];
        parentCategories.forEach(parent => {
            sortedList.push(parent);
            const subs = subCategories.filter(s => s.categoria_padre_id === parent.id);
            subs.forEach(sub => {
                sortedList.push(sub);
            });
        });
        
        // Agregar subcategorías huérfanas si las hubiera
        subCategories.forEach(sub => {
            if (!sortedList.find(x => x.id === sub.id)) {
                sortedList.push(sub);
            }
        });

        sortedList.forEach(cat => {
            const tr = document.createElement('tr');
            
            const indentStyle = cat.categoria_padre_id ? 'padding-left: 30px;' : '';
            const bullet = cat.categoria_padre_id ? '↳ ' : '📁 ';
            
            const tipoText = cat.categoria_padre_id 
                ? `<span style="color:#d97706; font-weight: 500;">Subcategoría de: </span><strong>${cat.padre_nombre || cat.categoria_padre_id}</strong>` 
                : `<span style="color:#10b981; font-weight: bold;">Categoría Principal</span>`;

            const escId = (cat.id || '').replace(/'/g, "\\'");
            const escNombre = (cat.nombre || '').replace(/'/g, "\\'");
            const escPadre = (cat.categoria_padre_id || '').replace(/'/g, "\\'");

            tr.innerHTML = `
                <td style="${indentStyle}"><strong>${bullet}${cat.nombre}</strong></td>
                <td>${tipoText}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-edit" onclick="iniciarEdicionCategoria('${escId}', '${escNombre}', '${escPadre}')">✏️ Editar</button>
                        <button class="btn-delete" onclick="eliminarCategoria('${escId}', '${escNombre}')">🗑️ Borrar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #ef4444;">Error al cargar categorías.</td></tr>`;
    }
}

// Rellenar selector de categorías padres
async function rellenarCategoriasPadreSelect(selectedPadreId = '') {
    const res = await window.api.obtenerCategorias();
    const select = document.getElementById('categoria-padre-select');
    select.innerHTML = '<option value="">-- Ninguna (Categoría Principal) --</option>';

    if (res.success && res.data) {
        // Filtrar sólo categorías que no son subcategorías (o según la regla que prefieras, para evitar multinivel infinito, solo permitimos 1 nivel de subcategoría)
        const categoriasPrincipales = res.data.filter(c => !c.categoria_padre_id && c.id !== editingCategoriaId);
        
        categoriasPrincipales.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.innerText = c.nombre;
            select.appendChild(opt);
        });
        select.value = selectedPadreId || '';
    }
}

// Funciones globales expuestas para categorías
window.iniciarEdicionCategoria = async (id, nombre, padreId) => {
    editingCategoriaId = id;
    const modalCategoria = document.getElementById('modal-categoria');
    document.getElementById('modal-categoria-title').innerText = "Editar Categoría/Subcategoría";
    
    document.getElementById('categoria-nombre').value = nombre;
    await rellenarCategoriasPadreSelect(padreId === 'undefined' ? '' : padreId);

    modalCategoria.style.display = 'flex';
};

window.eliminarCategoria = async (id, nombre) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${nombre}"? Los productos asociados se desvincularán.`)) {
        const res = await window.api.eliminarCategoria({ id, nombre, auditoriaUsuario: activeUserSession, auditoriaRol: 'Administrador' });
        alert(res.message);
        if (res.success) {
            await cargarCategorias();
        }
    }
};

// Cargar Clientes en la tabla
let todosLosClientes = [];

async function cargarClientes() {
    const res = await window.api.obtenerClientes();
    const tbody = document.querySelector('#table-clientes tbody');
    if (!tbody) return;

    if (res.success && res.data) {
        todosLosClientes = res.data;
        renderizarClientes();
    } else {
        todosLosClientes = [];
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ef4444;">Error al cargar clientes.</td></tr>`;
    }
}

function renderizarClientes() {
    const tbody = document.querySelector('#table-clientes tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtro = document.getElementById('filtro-clientes')?.value || 'todos';
    const busqueda = (document.getElementById('buscador-clientes')?.value || '').trim().toLowerCase();

    let clientes = filtro === 'todos'
        ? todosLosClientes
        : todosLosClientes.filter(cli => (cli.origen || 'Credito') === filtro);

    if (busqueda) {
        clientes = clientes.filter(cli =>
            (cli.nombre || '').toLowerCase().includes(busqueda) ||
            (cli.identificacion || '').toLowerCase().includes(busqueda) ||
            (cli.telefono || '').toLowerCase().includes(busqueda) ||
            (cli.email || '').toLowerCase().includes(busqueda)
        );
    }

    if (clientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">No hay clientes para este filtro.</td></tr>`;
        return;
    }

    clientes.forEach(cli => {
        const tr = document.createElement('tr');

        const escId = (cli.id || '').replace(/'/g, "\\'");
        const escNombre = (cli.nombre || '').replace(/'/g, "\\'");
        const escTipo = (cli.tipo || '').replace(/'/g, "\\'");
        const escCategoria = (cli.categoria || 'Normal').replace(/'/g, "\\'");
        const escIdent = (cli.identificacion || '').replace(/'/g, "\\'");
        const escTel = (cli.telefono || '').replace(/'/g, "\\'");
        const escEmail = (cli.email || '').replace(/'/g, "\\'");

        const origen = cli.origen || 'Credito';
        const origenLabel = origen === 'Pedido' ? '📦 Pedido' : '💳 Crédito';
        const origenBg = origen === 'Pedido' ? '#fef3c7' : '#d1fae5';

        const categoria = cli.categoria || 'Normal';
        const categoriaLabel = categoria === 'Fiscal' ? '🧾 Fiscal' : 'Normal';
        const categoriaBg = categoria === 'Fiscal' ? '#ede9fe' : '#f1f5f9';

        const badgeStyle = (bg) => `background: ${bg}; padding: 2px 6px; border-radius: 4px; font-weight: 600; color: #1e293b; font-size: 0.78em; white-space: nowrap; display: inline-block;`;

        tr.innerHTML = `
            <td><strong>${cli.nombre}</strong></td>
            <td><span class="badge" style="${badgeStyle(cli.tipo === 'Empresa' ? '#dfe7fd' : '#f0ebd8')}">${cli.tipo}</span></td>
            <td><span class="badge" style="${badgeStyle(origenBg)}">${origenLabel}</span></td>
            <td><span class="badge" style="${badgeStyle(categoriaBg)}">${categoriaLabel}</span></td>
            <td>${cli.identificacion || '-'}</td>
            <td>${cli.telefono || '-'}</td>
            <td>${cli.email || '-'}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-edit" onclick="iniciarEdicionCliente('${escId}', '${escNombre}', '${escTipo}', '${escCategoria}', '${escIdent}', '${escTel}', '${escEmail}')">✏️ Editar</button>
                    <button class="btn-delete" onclick="eliminarCliente('${escId}', '${escNombre}')">🗑️ Borrar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.iniciarEdicionCliente = (id, nombre, tipo, categoria, identificacion, telefono, email) => {
    editingClienteId = id;
    const modalCliente = document.getElementById('modal-cliente');
    document.getElementById('modal-cliente-title').innerText = "Editar Cliente";

    document.getElementById('cliente-nombre').value = nombre;
    document.getElementById('cliente-tipo').value = tipo;
    document.getElementById('cliente-categoria').value = categoria === 'undefined' ? 'Normal' : categoria;
    document.getElementById('cliente-identificacion').value = identificacion === 'undefined' ? '' : identificacion;
    document.getElementById('cliente-telefono').value = telefono === 'undefined' ? '' : telefono;
    document.getElementById('cliente-email').value = email === 'undefined' ? '' : email;

    modalCliente.style.display = 'flex';
};

window.eliminarCliente = async (id, nombre) => {
    if (confirm(`¿Estás seguro de que deseas eliminar al cliente "${nombre}"?`)) {
        const res = await window.api.eliminarCliente({ id, nombre, auditoriaUsuario: activeUserSession, auditoriaRol: sessionStorage.getItem('currentRole') || 'Sin Rol' });
        alert(res.message);
        if (res.success) {
            await cargarClientes();
        }
    }
};

// Genera un resumen legible del contenido de una solicitud de venta de fecha anterior
function resumenSolicitud(sol) {
    try {
        const datos = JSON.parse(sol.datos || '{}');
        if (sol.tipo === 'nueva' || sol.tipo === 'edicion') {
            const p = datos.propuesta;
            if (!p) return '-';
            const carrito = Array.isArray(p.carrito) ? p.carrito : [];
            const prods = carrito.length > 3
                ? `${carrito.slice(0, 3).map(i => `${i.nombre} (x${i.cantidad})`).join(', ')}... (+${carrito.length - 3} más)`
                : carrito.map(i => `${i.nombre} (x${i.cantidad})`).join(', ');
            return `${prods || 'Sin productos'} — Total: $${Math.round(p.total || 0).toLocaleString('es-CO')} — ${p.metodoPago || ''}`;
        }
        if (sol.tipo === 'eliminacion') {
            const snap = datos.snapshotOriginal;
            if (!snap || !snap.venta) return `Venta ID: ${sol.venta_id}`;
            return `Venta original — Total: $${Math.round(snap.venta.total || 0).toLocaleString('es-CO')} — ${snap.venta.metodo_pago || ''}`;
        }
    } catch (e) {
        return '-';
    }
    return '-';
}

// Cargar Solicitudes de Ventas de Fecha Anterior en la tabla
let ultimasSolicitudesCargadas = {}; // id -> solicitud, para abrir el modal de detalle sin re-consultar

async function cargarSolicitudes() {
    const filtro = document.getElementById('filtro-solicitudes');
    const estado = filtro ? filtro.value : 'pendiente';
    const res = await window.api.obtenerSolicitudesVenta(estado ? { estado } : {});
    const tbody = document.querySelector('#table-solicitudes tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    ultimasSolicitudesCargadas = {};

    if (!res.success) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444;">Error al cargar solicitudes.</td></tr>`;
        return;
    }

    if (!res.data || res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #6b7280;">No hay solicitudes ${estado === 'pendiente' ? 'pendientes' : 'registradas'}.</td></tr>`;
        return;
    }

    const etiquetasTipo = { nueva: 'Nueva venta', edicion: 'Edición', eliminacion: 'Eliminación' };
    const coloresEstado = {
        pendiente: { bg: '#fef3c7', color: '#b45309' },
        aprobada: { bg: '#dcfce7', color: '#15803d' },
        rechazada: { bg: '#fee2e2', color: '#b91c1c' }
    };

    res.data.forEach(sol => {
        ultimasSolicitudesCargadas[sol.id] = sol;
        const tr = document.createElement('tr');
        const colorEstado = coloresEstado[sol.estado] || { bg: '#e5e7eb', color: '#374151' };

        let acciones = `<div class="actions-cell"><button class="btn-edit" onclick="verDetalleSolicitud('${sol.id}')">👁️ Ver Cambios</button>`;
        if (sol.estado === 'pendiente') {
            acciones += `
                    <button class="btn-activate" onclick="aprobarSolicitud('${sol.id}')">✅ Aprobar</button>
                    <button class="btn-delete" onclick="rechazarSolicitud('${sol.id}')">❌ Rechazar</button>
            `;
        }
        acciones += `</div>`;

        tr.innerHTML = `
            <td>${new Date(sol.fecha_solicitud).toLocaleString('es-CO')}</td>
            <td>${etiquetasTipo[sol.tipo] || sol.tipo}</td>
            <td>${sol.fecha_venta}</td>
            <td>${sol.usuario_solicitante}</td>
            <td style="max-width: 320px;">${resumenSolicitud(sol)}</td>
            <td>
                <span style="background: ${colorEstado.bg}; color: ${colorEstado.color}; padding: 3px 8px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">${sol.estado}</span>
                ${sol.motivo_rechazo ? `<div style="font-size:0.75em; color:#6b7280; margin-top:4px;">${sol.motivo_rechazo}</div>` : ''}
            </td>
            <td>${acciones}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.aprobarSolicitud = async (id) => {
    if (!confirm('¿Aprobar esta solicitud? Se aplicará de inmediato a ventas e inventario.')) return;
    const res = await window.api.aprobarSolicitudVenta({ id, auditoriaUsuario: activeUserSession, auditoriaRol: 'Administrador' });
    alert(res.message);
    await cargarSolicitudes();
};

window.rechazarSolicitud = async (id) => {
    const motivo = prompt('Motivo del rechazo (opcional):') || '';
    const res = await window.api.rechazarSolicitudVenta({ id, motivo, auditoriaUsuario: activeUserSession, auditoriaRol: 'Administrador' });
    alert(res.message);
    await cargarSolicitudes();
};

function tablaItemsSolicitud(carrito) {
    if (!Array.isArray(carrito) || carrito.length === 0) {
        return '<p style="color:#6b7280; font-size:0.85em;">Sin productos.</p>';
    }
    const filas = carrito.map(item => `
        <tr>
            <td>${item.nombre || `Producto ${item.producto_id || item.id || ''}`}</td>
            <td style="text-align:center;">${item.cantidad}</td>
            <td style="text-align:right;">${Number(item.precio_unitario ?? item.precio ?? 0).toLocaleString('es-CO')}</td>
        </tr>
    `).join('');
    return `
        <table style="width:100%; border-collapse: collapse; font-size: 0.85em;">
            <thead>
                <tr>
                    <th style="text-align:left; border-bottom:1px solid var(--bg-accent);">Producto</th>
                    <th style="text-align:center; border-bottom:1px solid var(--bg-accent);">Cant.</th>
                    <th style="text-align:right; border-bottom:1px solid var(--bg-accent);">Precio Unit.</th>
                </tr>
            </thead>
            <tbody>${filas}</tbody>
        </table>
    `;
}

function construirDetalleSolicitudHTML(sol) {
    let datos = {};
    try { datos = JSON.parse(sol.datos || '{}'); } catch (e) { /* datos corruptos, se ignora */ }

    const encabezado = `
        <div style="margin-bottom: 16px; font-size: 0.9em; color: var(--text-secondary);">
            <div><strong>Solicitante:</strong> ${sol.usuario_solicitante}</div>
            <div><strong>Fecha de la venta:</strong> ${sol.fecha_venta}</div>
            <div><strong>Estado:</strong> ${sol.estado}${sol.motivo_rechazo ? ' — ' + sol.motivo_rechazo : ''}</div>
            ${sol.usuario_revisor ? `<div><strong>${sol.estado === 'rechazada' ? 'Rechazado' : 'Aprobado'} por:</strong> ${sol.usuario_revisor}${sol.fecha_revision ? ' el ' + new Date(sol.fecha_revision).toLocaleString('es-CO') : ''}</div>` : ''}
        </div>
    `;

    if (sol.tipo === 'nueva') {
        const p = datos.propuesta || {};
        return encabezado + `
            <h4 style="margin-bottom:6px;">Venta a registrar</h4>
            ${tablaItemsSolicitud(p.carrito)}
            <div style="margin-top:10px; font-size:0.9em;"><strong>Total:</strong> $${Number(p.total || 0).toLocaleString('es-CO')} — <strong>Método:</strong> ${p.metodoPago || ''}</div>
        `;
    }

    if (sol.tipo === 'eliminacion') {
        const snap = datos.snapshotOriginal || {};
        return encabezado + `
            <h4 style="margin-bottom:6px; color:#b91c1c;">Venta a eliminar</h4>
            ${tablaItemsSolicitud(snap.detalle)}
            <div style="margin-top:10px; font-size:0.9em;"><strong>Total:</strong> $${Number(snap.venta?.total || 0).toLocaleString('es-CO')} — <strong>Método:</strong> ${snap.venta?.metodo_pago || ''}</div>
        `;
    }

    // edicion: comparación antes/después
    const antes = datos.snapshotOriginal || {};
    const despues = datos.propuesta || {};
    return encabezado + `
        <div style="display:flex; gap:16px; flex-wrap:wrap;">
            <div style="flex:1; min-width:220px;">
                <h4 style="margin-bottom:6px; color:#b45309;">Antes</h4>
                ${tablaItemsSolicitud(antes.detalle)}
                <div style="margin-top:10px; font-size:0.9em;"><strong>Total:</strong> $${Number(antes.venta?.total || 0).toLocaleString('es-CO')} — <strong>Método:</strong> ${antes.venta?.metodo_pago || ''}</div>
            </div>
            <div style="flex:1; min-width:220px;">
                <h4 style="margin-bottom:6px; color:#15803d;">Después</h4>
                ${tablaItemsSolicitud(despues.carrito)}
                <div style="margin-top:10px; font-size:0.9em;"><strong>Total:</strong> $${Number(despues.total || 0).toLocaleString('es-CO')} — <strong>Método:</strong> ${despues.metodoPago || ''}</div>
            </div>
        </div>
    `;
}

window.verDetalleSolicitud = (id) => {
    const sol = ultimasSolicitudesCargadas[id];
    if (!sol) return;
    const etiquetasTipo = { nueva: 'Nueva Venta', edicion: 'Edición de Venta', eliminacion: 'Eliminación de Venta' };
    document.getElementById('modal-detalle-solicitud-title').innerText = `Detalle — ${etiquetasTipo[sol.tipo] || sol.tipo}`;
    document.getElementById('modal-detalle-solicitud-body').innerHTML = construirDetalleSolicitudHTML(sol);
    document.getElementById('modal-detalle-solicitud').style.display = 'flex';
};

const btnCloseDetalleSolicitud = document.getElementById('btn-close-detalle-solicitud-modal');
if (btnCloseDetalleSolicitud) {
    btnCloseDetalleSolicitud.addEventListener('click', () => {
        document.getElementById('modal-detalle-solicitud').style.display = 'none';
    });
}
window.addEventListener('click', (e) => {
    const modalDetalleSolicitud = document.getElementById('modal-detalle-solicitud');
    if (e.target === modalDetalleSolicitud) {
        modalDetalleSolicitud.style.display = 'none';
    }
});

// Genera un resumen legible del contenido de una solicitud de gasto de fecha anterior
function resumenSolicitudGasto(sol) {
    try {
        const datos = JSON.parse(sol.datos || '{}');
        const p = datos.propuesta;
        if (!p) return '-';
        if (Array.isArray(p.productosVencidos) && p.productosVencidos.length > 0) {
            const prods = p.productosVencidos.length > 3
                ? `${p.productosVencidos.slice(0, 3).map(i => `${i.nombre} (x${i.cantidad})`).join(', ')}... (+${p.productosVencidos.length - 3} más)`
                : p.productosVencidos.map(i => `${i.nombre} (x${i.cantidad})`).join(', ');
            return `${p.tipo} — ${prods || 'Sin productos'}`;
        }
        return `${p.tipo} — $${Math.round(p.monto || 0).toLocaleString('es-CO')} — ${p.descripcion || ''}`;
    } catch (e) {
        return '-';
    }
}

// Cargar Solicitudes de Gastos de Fecha Anterior en la tabla
let ultimasSolicitudesGastoCargadas = {}; // id -> solicitud, para abrir el modal de detalle sin re-consultar

async function cargarSolicitudesGasto() {
    const filtro = document.getElementById('filtro-solicitudes-gasto');
    const estado = filtro ? filtro.value : 'pendiente';
    const res = await window.api.obtenerSolicitudesGasto(estado ? { estado } : {});
    const tbody = document.querySelector('#table-solicitudes-gasto tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    ultimasSolicitudesGastoCargadas = {};

    if (!res.success) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">Error al cargar solicitudes.</td></tr>`;
        return;
    }

    if (!res.data || res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #6b7280;">No hay solicitudes ${estado === 'pendiente' ? 'pendientes' : 'registradas'}.</td></tr>`;
        return;
    }

    const coloresEstado = {
        pendiente: { bg: '#fef3c7', color: '#b45309' },
        aprobada: { bg: '#dcfce7', color: '#15803d' },
        rechazada: { bg: '#fee2e2', color: '#b91c1c' }
    };

    res.data.forEach(sol => {
        ultimasSolicitudesGastoCargadas[sol.id] = sol;
        const tr = document.createElement('tr');
        const colorEstado = coloresEstado[sol.estado] || { bg: '#e5e7eb', color: '#374151' };

        let acciones = `<div class="actions-cell"><button class="btn-edit" onclick="verDetalleSolicitudGasto('${sol.id}')">👁️ Ver Detalle</button>`;
        if (sol.estado === 'pendiente') {
            acciones += `
                    <button class="btn-activate" onclick="aprobarSolicitudGasto('${sol.id}')">✅ Aprobar</button>
                    <button class="btn-delete" onclick="rechazarSolicitudGasto('${sol.id}')">❌ Rechazar</button>
            `;
        }
        acciones += `</div>`;

        tr.innerHTML = `
            <td>${new Date(sol.fecha_solicitud).toLocaleString('es-CO')}</td>
            <td>${sol.fecha_gasto}</td>
            <td>${sol.usuario_solicitante}</td>
            <td style="max-width: 320px;">${resumenSolicitudGasto(sol)}</td>
            <td>
                <span style="background: ${colorEstado.bg}; color: ${colorEstado.color}; padding: 3px 8px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">${sol.estado}</span>
                ${sol.motivo_rechazo ? `<div style="font-size:0.75em; color:#6b7280; margin-top:4px;">${sol.motivo_rechazo}</div>` : ''}
            </td>
            <td>${acciones}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.aprobarSolicitudGasto = async (id) => {
    if (!confirm('¿Aprobar esta solicitud? Se aplicará de inmediato a caja e inventario.')) return;
    const res = await window.api.aprobarSolicitudGasto({ id, auditoriaUsuario: activeUserSession, auditoriaRol: 'Administrador' });
    alert(res.message);
    await cargarSolicitudesGasto();
};

window.rechazarSolicitudGasto = async (id) => {
    const motivo = prompt('Motivo del rechazo (opcional):') || '';
    const res = await window.api.rechazarSolicitudGasto({ id, motivo, auditoriaUsuario: activeUserSession, auditoriaRol: 'Administrador' });
    alert(res.message);
    await cargarSolicitudesGasto();
};

window.verDetalleSolicitudGasto = (id) => {
    const sol = ultimasSolicitudesGastoCargadas[id];
    if (!sol) return;
    let datos = {};
    try { datos = JSON.parse(sol.datos || '{}'); } catch (e) { /* datos corruptos, se ignora */ }
    const p = datos.propuesta || {};

    const filasProductos = Array.isArray(p.productosVencidos) && p.productosVencidos.length > 0
        ? `
            <table style="width:100%; border-collapse: collapse; font-size: 0.85em; margin-top:8px;">
                <thead>
                    <tr>
                        <th style="text-align:left; border-bottom:1px solid var(--bg-accent);">Producto</th>
                        <th style="text-align:center; border-bottom:1px solid var(--bg-accent);">Cant.</th>
                        <th style="text-align:right; border-bottom:1px solid var(--bg-accent);">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${p.productosVencidos.map(item => `
                        <tr>
                            <td>${item.nombre || 'Producto'}</td>
                            <td style="text-align:center;">${item.cantidad}</td>
                            <td style="text-align:right;">${Number(item.valor || 0).toLocaleString('es-CO')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `
        : '';

    document.getElementById('modal-detalle-solicitud-gasto-body').innerHTML = `
        <div style="margin-bottom: 16px; font-size: 0.9em; color: var(--text-secondary);">
            <div><strong>Solicitante:</strong> ${sol.usuario_solicitante}</div>
            <div><strong>Fecha del gasto:</strong> ${sol.fecha_gasto}</div>
            <div><strong>Estado:</strong> ${sol.estado}${sol.motivo_rechazo ? ' — ' + sol.motivo_rechazo : ''}</div>
            ${sol.usuario_revisor ? `<div><strong>${sol.estado === 'rechazada' ? 'Rechazado' : 'Aprobado'} por:</strong> ${sol.usuario_revisor}${sol.fecha_revision ? ' el ' + new Date(sol.fecha_revision).toLocaleString('es-CO') : ''}</div>` : ''}
        </div>
        <h4 style="margin-bottom:6px;">Gasto a registrar</h4>
        <div style="font-size:0.9em;"><strong>Clasificación:</strong> ${p.tipo || ''}</div>
        <div style="font-size:0.9em;"><strong>Monto:</strong> $${Number(p.monto || 0).toLocaleString('es-CO')}</div>
        <div style="font-size:0.9em;"><strong>Concepto:</strong> ${p.descripcion || ''}</div>
        ${filasProductos}
    `;
    document.getElementById('modal-detalle-solicitud-gasto').style.display = 'flex';
};

const btnCloseDetalleSolicitudGasto = document.getElementById('btn-close-detalle-solicitud-gasto-modal');
if (btnCloseDetalleSolicitudGasto) {
    btnCloseDetalleSolicitudGasto.addEventListener('click', () => {
        document.getElementById('modal-detalle-solicitud-gasto').style.display = 'none';
    });
}
window.addEventListener('click', (e) => {
    const modalDetalleSolicitudGasto = document.getElementById('modal-detalle-solicitud-gasto');
    if (e.target === modalDetalleSolicitudGasto) {
        modalDetalleSolicitudGasto.style.display = 'none';
    }
});

// --- Abonos Eliminados (recuperación, solo Administrador) ---
// A diferencia de las demás listas de esta pantalla, lee directo de Supabase (ver
// services/abonoRecoveryService.js): el ciclo de sincronización purga la copia local de un abono
// eliminado en cuanto confirma el borrado en la nube, así que solo la nube conserva de dónde
// recuperarlo.
async function cargarAbonosEliminados() {
    const tbody = document.querySelector('#table-abonos-eliminados tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">Cargando...</td></tr>';

    const res = await window.api.listarAbonosEliminados();
    if (!res.success) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444;">${res.message || 'Error al cargar abonos eliminados.'}</td></tr>`;
        return;
    }
    if (!res.data || res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No hay abonos eliminados recientes.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    res.data.forEach(ab => {
        const tr = document.createElement('tr');
        const escId = ab.id.replace(/'/g, "\\'");
        const esCredito = ab.tipo === 'credito';
        tr.innerHTML = `
            <td><span style="background: ${esCredito ? '#dbeafe' : '#fef3c7'}; color: ${esCredito ? '#1d4ed8' : '#b45309'}; padding: 3px 8px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">${esCredito ? 'Crédito' : 'Pedido'}</span></td>
            <td>${ab.referencia}</td>
            <td>$${Math.round(ab.monto).toLocaleString('es-CO')}</td>
            <td>${ab.metodoPago || '-'}</td>
            <td>${new Date(ab.fecha).toLocaleString('es-CO')}</td>
            <td>${new Date(ab.deletedAt).toLocaleString('es-CO')}</td>
            <td><button class="btn-activate" onclick="recuperarAbonoEliminado('${ab.tipo}', '${escId}')">♻️ Recuperar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

window.recuperarAbonoEliminado = async (tipo, id) => {
    if (!confirm('¿Recuperar este abono? Volverá a contar en el saldo del cliente/pedido y en los reportes.')) return;
    const res = await window.api.recuperarAbono({ tipo, id, auditoriaUsuario: activeUserSession, auditoriaRol: 'Administrador' });
    alert(res.message);
    if (res.success) await cargarAbonosEliminados();
};

// --- Impresora de Tickets (configuración local por equipo) ---
// Se guarda en un archivo en userData (vía IPC), NO en localStorage: el botón de cerrar
// sesión hace localStorage.clear() en todas las pantallas, y eso borraría la selección en
// cada cambio de turno si viviera ahí.
async function cargarSeccionImpresora() {
    const select = document.getElementById('select-impresora');
    const estado = document.getElementById('impresora-estado');
    const btnRecargar = document.getElementById('btn-recargar-impresoras');
    const btnGuardar = document.getElementById('btn-guardar-impresora');
    if (!select || !btnGuardar) return;

    async function refrescarListaImpresoras() {
        select.innerHTML = '<option value="">(Detectando impresoras...)</option>';
        estado.innerText = '';

        const { nombres, sugerida, guardada } = await window.api.listarImpresoras();

        select.innerHTML = '';
        if (nombres.length === 0) {
            select.innerHTML = '<option value="">(No se detectaron impresoras)</option>';
            return;
        }

        nombres.forEach(nombre => {
            const opt = document.createElement('option');
            opt.value = nombre;
            opt.innerText = nombre === sugerida ? `${nombre} (sugerida)` : nombre;
            select.appendChild(opt);
        });

        // Prioridad: selección ya guardada si sigue existiendo; si no, la sugerida automática.
        if (guardada && nombres.includes(guardada)) {
            select.value = guardada;
        } else if (sugerida) {
            select.value = sugerida;
        }

        estado.innerText = guardada
            ? `Impresora guardada en este equipo: "${guardada}"`
            : 'Sin impresora guardada todavía en este equipo (se usará la sugerida automáticamente).';
    }

    if (btnRecargar) {
        btnRecargar.addEventListener('click', refrescarListaImpresoras);
    }

    btnGuardar.addEventListener('click', async () => {
        const elegida = select.value;
        if (!elegida) {
            alert('Selecciona una impresora antes de guardar.');
            return;
        }
        await window.api.guardarImpresoraLocal(elegida);
        estado.innerText = `Impresora guardada en este equipo: "${elegida}"`;
        alert(`Impresora "${elegida}" guardada para este equipo.`);
    });

    // Al entrar a Administración solo se detectan impresoras automáticamente si este equipo
    // todavía no tiene una guardada. Si ya hay una, se muestra tal cual (lectura rápida del
    // Registro, sin enumerar impresoras ni consultar PowerShell) y la detección completa
    // queda disponible solo mediante el botón "Detectar impresoras".
    const guardadaActual = await window.api.obtenerImpresoraGuardada();
    if (guardadaActual) {
        select.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = guardadaActual;
        opt.innerText = guardadaActual;
        select.appendChild(opt);
        select.value = guardadaActual;
        estado.innerText = `Impresora guardada en este equipo: "${guardadaActual}"`;
    } else {
        await refrescarListaImpresoras();
    }
}

// --- Sugeridos Semanales de Pastelería + Calculadora de Pedido Extra (proveedor) ---
// SRP: cantidad acordada con el proveedor por producto/sucursal/día de entrega (persistida, solo
// Administrador) y una calculadora de pedido extra puramente informativa (Administrador y
// Operador) -- ver services/pedidoSugeridoPasteleriaService.js. No confundir con "Pedidos /
// Apartados" (pedidos.js): esto es reabastecimiento del proveedor, no pedidos de clientes.

let categoriasCargadasPasteleria = [];
const normalizeStrPasteleria = (value) => {
    if (value == null) return '';
    return String(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
};
// Adaptado de ventas.js/ventas-anteriores.js: camina categoria_padre_id hasta la raíz y compara
// el nombre normalizado contra "pasteleria"/"pastel" (duplicado a propósito, mismo patrón ya usado
// en esos archivos para el mismo problema). También incluye "heladeria"/"helado": los sugeridos
// semanales y la calculadora de pedido extra aplican al mismo ciclo de entregas del proveedor
// para ambas categorías, no solo pastelería.
const esCategoriaPasteleriaAdmin = (producto) => {
    if (!producto) return false;
    const nombres = [];
    if (producto.categoria_nombre) nombres.push(producto.categoria_nombre);
    if (producto.categoria_id) {
        let actual = categoriasCargadasPasteleria.find(c => c.id === producto.categoria_id);
        while (actual) {
            nombres.push(actual.nombre);
            actual = categoriasCargadasPasteleria.find(c => c.id === actual.categoria_padre_id) || null;
        }
    }
    return nombres.some(n => {
        const norm = normalizeStrPasteleria(n);
        return norm.includes('pasteleria') || norm.includes('pastel') || norm.includes('heladeria') || norm.includes('helado');
    });
};

async function asegurarCategoriasPasteleriaCargadas() {
    if (categoriasCargadasPasteleria.length === 0) {
        const res = await window.api.obtenerCategorias();
        categoriasCargadasPasteleria = res.data || [];
    }
}

// Puebla un <select> de sucursales con el mismo comportamiento que "Ver Inventario"
// (dashboard.js): arranca en la sucursal local del equipo, cambiable manualmente entre las
// sucursales a las que el usuario tiene acceso.
async function poblarSelectorSucursal(selectEl, sucursalLocalId) {
    const resSucs = await window.api.obtenerSucursalesDisponibles();
    selectEl.innerHTML = '';
    (resSucs.data || []).forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.innerText = `🏢 ${id === sucursalLocalId ? 'Sucursal Local: ' : ''}${id}`;
        selectEl.appendChild(opt);
    });
    selectEl.value = sucursalLocalId;
}

// --- Sugeridos Semanales (solo Administrador) ---
// Se cachea la última lista cargada (producto + sugerido) para que el buscador filtre en el
// cliente sin volver a consultar la BD en cada tecla.
let sugeridosPasteleriaCache = [];

async function inicializarSugeridosPasteleria() {
    const select = document.getElementById('sugeridos-sucursal-select');
    const busqueda = document.getElementById('sugeridos-busqueda');
    const btnExcel = document.getElementById('btn-descargar-excel-sugeridos');
    if (!select) return;
    await asegurarCategoriasPasteleriaCargadas();
    const resId = await window.api.obtenerSucursalId();
    await poblarSelectorSucursal(select, resId.success ? resId.id : '');
    select.addEventListener('change', cargarSugeridosPasteleria);
    if (busqueda) {
        busqueda.addEventListener('input', () => renderTablaSugeridosPasteleria(busqueda.value));
        // Selecciona todo el texto al enfocar, para poder escribir una nueva búsqueda de una vez
        // sin tener que borrar manualmente lo que quedó escrito antes.
        busqueda.addEventListener('focus', () => busqueda.select());
    }
    if (btnExcel) btnExcel.addEventListener('click', descargarExcelSugeridosPasteleria);
    await cargarSugeridosPasteleria();
}

async function cargarSugeridosPasteleria() {
    const sucursalId = document.getElementById('sugeridos-sucursal-select').value;
    if (!sucursalId) return;

    const [resInv, resSug] = await Promise.all([
        window.api.getInventory(sucursalId),
        window.api.obtenerSugeridosPasteleria(sucursalId)
    ]);
    const productosPasteleria = (resInv.data || []).filter(esCategoriaPasteleriaAdmin);
    const sugeridosPorProducto = {};
    (resSug.data || []).forEach(s => { sugeridosPorProducto[s.producto_id] = s; });

    sugeridosPasteleriaCache = productosPasteleria.map(p => ({
        id: p.id,
        nombre: p.nombre,
        sugerido: sugeridosPorProducto[p.id] || { sugerido_martes: 0, sugerido_jueves: 0, sugerido_sabado: 0 }
    }));

    const busqueda = document.getElementById('sugeridos-busqueda');
    renderTablaSugeridosPasteleria(busqueda ? busqueda.value : '');
}

function renderTablaSugeridosPasteleria(filtro) {
    const tbody = document.querySelector('#table-sugeridos-pasteleria tbody');
    if (!tbody) return;

    const filtroNormalizado = normalizeStrPasteleria(filtro || '');
    const filas = sugeridosPasteleriaCache.filter(p => normalizeStrPasteleria(p.nombre).includes(filtroNormalizado));

    tbody.innerHTML = '';
    if (sugeridosPasteleriaCache.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">No hay productos de categoría Pastelería o Heladería.</td></tr>`;
        return;
    }
    if (filas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">Ningún producto coincide con la búsqueda.</td></tr>`;
        return;
    }
    filas.forEach(p => {
        const s = p.sugerido;
        const tr = document.createElement('tr');
        const escId = (p.id || '').replace(/'/g, "\\'");
        tr.innerHTML = `
            <td>${p.nombre}</td>
            <td><input type="number" min="0" step="1" value="${s.sugerido_martes}" data-dia="martes" style="width:80px;"></td>
            <td><input type="number" min="0" step="1" value="${s.sugerido_jueves}" data-dia="jueves" style="width:80px;"></td>
            <td><input type="number" min="0" step="1" value="${s.sugerido_sabado}" data-dia="sabado" style="width:80px;"></td>
            <td><button class="btn-edit" onclick="guardarSugeridoPasteleria('${escId}', this)">💾 Guardar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function descargarExcelSugeridosPasteleria() {
    const sucursalId = document.getElementById('sugeridos-sucursal-select').value;
    if (!sucursalId) return;
    const res = await window.api.exportarExcelSugeridosPasteleria(sucursalId);
    if (res.cancelado) return;
    alert(res.message || (res.success ? 'Excel generado exitosamente.' : 'No se pudo generar el Excel.'));
}

window.guardarSugeridoPasteleria = async (productoId, btn) => {
    const sucursalId = document.getElementById('sugeridos-sucursal-select').value;
    const fila = btn.closest('tr');
    const val = (dia) => Number(fila.querySelector(`input[data-dia="${dia}"]`).value) || 0;
    const sugeridoMartes = val('martes'), sugeridoJueves = val('jueves'), sugeridoSabado = val('sabado');
    const res = await window.api.guardarSugeridoPasteleria({
        productoId, sucursalId, sugeridoMartes, sugeridoJueves, sugeridoSabado,
        auditoriaUsuario: activeUserSession, auditoriaRol: 'Administrador'
    });
    // Actualizar la caché con el valor recién guardado -- si no se hace esto, el próximo
    // renderTablaSugeridosPasteleria() (disparado por el buscador, que NO vuelve a consultar la
    // BD) repinta esta fila con el valor viejo que traía la caché, dando la impresión de que el
    // guardado no funcionó aunque sí haya quedado en base de datos.
    if (res.success) {
        const cacheado = sugeridosPasteleriaCache.find(p => p.id === productoId);
        if (cacheado) cacheado.sugerido = { sugerido_martes: sugeridoMartes, sugerido_jueves: sugeridoJueves, sugerido_sabado: sugeridoSabado };
    }
    alert(res.message);
};

// --- Calculadora de Pedido Extra (Administrador y Operador) ---
// Tabla general (no un producto a la vez): todos los productos de pastelería que ya tienen algún
// sugerido configurado en la sucursal elegida, con su recomendación de pedido extra -- ver
// calcularRecomendacionesPasteleriaSucursal en services/pedidoSugeridoPasteleriaService.js
// (única fuente del cálculo, reutilizada también por el Excel).
async function inicializarCalculadoraPedidoExtra() {
    const selectSuc = document.getElementById('pedido-extra-sucursal-select');
    const btnCalcular = document.getElementById('btn-calcular-pedido-extra');
    const btnExcel = document.getElementById('btn-descargar-excel-pedido-extra');
    if (!selectSuc) return;
    const resId = await window.api.obtenerSucursalId();
    await poblarSelectorSucursal(selectSuc, resId.success ? resId.id : '');

    // A demanda: no se calcula solo, ni al entrar a la sección ni al cambiar de sucursal (esta
    // recomendación recorre ventas/inventario/sugeridos de todo el catálogo de pastelería y
    // heladería, así que solo se dispara cuando el usuario presiona "Calcular"). Cambiar de
    // sucursal sí limpia la tabla, para no dejar en pantalla números que ya no corresponden a la
    // sucursal seleccionada.
    if (btnCalcular) btnCalcular.addEventListener('click', cargarTablaPedidoExtra);
    selectSuc.addEventListener('change', limpiarTablaPedidoExtra);
    if (btnExcel) btnExcel.addEventListener('click', descargarExcelPedidoExtra);
}

function limpiarTablaPedidoExtra() {
    const tbody = document.querySelector('#table-pedido-extra tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-secondary);">Presiona "Calcular" para ver las recomendaciones.</td></tr>`;
}

async function cargarTablaPedidoExtra() {
    const sucursalId = document.getElementById('pedido-extra-sucursal-select').value;
    const tbody = document.querySelector('#table-pedido-extra tbody');
    if (!sucursalId || !tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-secondary);">Calculando...</td></tr>`;
    const res = await window.api.obtenerRecomendacionesPedidoExtra(sucursalId);
    if (!res.success) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-secondary);">${res.message || 'No se pudo calcular la recomendación.'}</td></tr>`;
        return;
    }
    if (res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-secondary);">Ningún producto de pastelería tiene sugerido configurado en esta sucursal todavía.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    res.data.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.productoNombre}</td>
            <td>${r.stockActual}</td>
            <td>${(Math.round(r.promedioDiario * 100) / 100).toLocaleString('es-CO')}</td>
            <td>${r.proximaFechaEntrega} (${r.diasHastaProximaEntrega} día${r.diasHastaProximaEntrega === 1 ? '' : 's'})</td>
            <td>${r.sugeridoDelDia}</td>
            <td style="font-weight: bold; color: ${r.cantidadRecomendada > 0 ? '#d97706' : 'inherit'};">${r.cantidadRecomendada}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function descargarExcelPedidoExtra() {
    const sucursalId = document.getElementById('pedido-extra-sucursal-select').value;
    if (!sucursalId) return;
    const res = await window.api.exportarExcelPedidoExtra(sucursalId);
    if (res.cancelado) return;
    alert(res.message || (res.success ? 'Excel generado exitosamente.' : 'No se pudo generar el Excel.'));
}