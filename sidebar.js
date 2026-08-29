(function () {
    // Inyectar estilos modernos y limpios para el Sidebar
    const styleId = 'sidebar-modern-styles';
    if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .spinning {
                animation: spin 1s linear infinite;
                display: inline-block;
            }

            /* Ocultar flechas de inputs numéricos */
            input::-webkit-outer-spin-button,
            input::-webkit-inner-spin-button {
                -webkit-appearance: none !important;
                margin: 0 !important;
            }
            input[type=number] {
                -moz-appearance: textfield !important;
            }

            /* Estilos Generales de Botones del Sidebar */
            .nav-btn {
                position: relative;
                display: flex !important;
                align-items: center !important;
                width: 100%;
                padding: 9px 12px;
                background: transparent;
                border: none;
                border-radius: 8px;
                color: #94a3b8;
                cursor: pointer;
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 500;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                gap: 12px;
                box-sizing: border-box;
                overflow: hidden;
            }
            .nav-btn[style*="display: none"],
            .nav-btn[style*="display:none"] {
                display: none !important;
            }
            .nav-btn:hover {
                background-color: rgba(255, 255, 255, 0.05);
                color: #f8fafc;
            }
            .nav-btn.active {
                background-color: rgba(59, 130, 246, 0.12);
                color: #3b82f6;
                font-weight: 600;
            }
            .nav-btn.active::before {
                content: '';
                position: absolute;
                left: 0;
                top: 25%;
                height: 50%;
                width: 4px;
                background-color: #3b82f6;
                border-radius: 0 4px 4px 0;
            }
            .nav-btn span:first-child {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                font-size: 1.2rem;
                flex-shrink: 0;
            }

            /* Separación uniforme entre TODOS los ítems del menú (botones sueltos y la fila
               agrupada de Registrar Venta), en vez de depender solo de flex gap. */
            .sidebar .nav-menu > *:not(:last-child) {
                margin-bottom: 6px;
            }

            /* Botón de Sincronización */
            .nav-btn-sync-new {
                display: flex;
                align-items: center;
                width: 100%;
                padding: 10px 12px;
                background-color: rgba(16, 185, 129, 0.08);
                color: #10b981;
                border: 1px solid rgba(16, 185, 129, 0.15);
                border-radius: 8px;
                cursor: pointer;
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 600;
                transition: all 0.2s ease;
                gap: 12px;
                box-sizing: border-box;
                overflow: hidden;
                margin-top: 10px;
            }
            .nav-btn-sync-new:hover:not(:disabled) {
                background-color: #10b981;
                color: white;
                border-color: #10b981;
            }
            .nav-btn-sync-new:disabled {
                background-color: rgba(16, 185, 129, 0.04);
                color: rgba(16, 185, 129, 0.4);
                border-color: rgba(16, 185, 129, 0.08);
                cursor: not-allowed;
            }
            .nav-btn-sync-new > span:first-child {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                font-size: 1.2rem;
                flex-shrink: 0;
            }
            .nav-btn-sync-new .sync-text-col {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                overflow: hidden;
                min-width: 0;
            }
            .nav-btn-sync-new .sync-next-time {
                font-size: 10px;
                font-weight: 400;
                color: rgba(16, 185, 129, 0.7);
                line-height: 1.2;
                white-space: nowrap;
            }
            .nav-btn-sync-new:hover:not(:disabled) .sync-next-time {
                color: rgba(255, 255, 255, 0.8);
            }

            /* Botón Cerrar Sesión */
            .btn-logout-new {
                display: flex;
                align-items: center;
                width: 100%;
                padding: 10px 12px;
                background-color: rgba(239, 68, 68, 0.08);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.15);
                border-radius: 8px;
                cursor: pointer;
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 600;
                transition: all 0.2s ease;
                gap: 12px;
                box-sizing: border-box;
                overflow: hidden;
            }
            .btn-logout-new:hover {
                background-color: #ef4444;
                color: white;
                border-color: #ef4444;
            }
            .btn-logout-new span:first-child {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                font-size: 1.2rem;
                flex-shrink: 0;
            }

            /* Lista de navegación: única zona con scroll dentro del sidebar (h-full/flex-column),
               para que la sección inferior (Sincronizar/Cerrar Sesión) quede siempre fija y visible
               sin importar cuántos ítems de menú haya ni la altura de la ventana. */
            .sidebar .nav-menu {
                flex: 1 1 auto !important;
                min-height: 0 !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
            }
            .sidebar .nav-menu::-webkit-scrollbar {
                width: 0px !important;
                background: transparent !important;
            }
            .sidebar .sidebar-footer {
                flex-shrink: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                padding-top: 10px !important;
            }

            /* Estilos del Sidebar Autocolapsable (Escritorio) */
            @media (min-width: 501px) {
                .sidebar {
                    position: fixed !important;
                    left: 0 !important;
                    top: 0 !important;
                    bottom: 0 !important;
                    z-index: 1000 !important;
                    width: 80px !important;
                    padding: 20px 14px !important;
                    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15) !important;
                    display: flex !important;
                    flex-direction: column !important;
                    box-sizing: border-box !important;
                    background-color: #0f172a !important;
                    border-right: 1px solid #1e293b !important;
                    color: white !important;
                    overflow-x: hidden !important;
                    overflow-y: hidden !important;
                }

                .sidebar-spacer {
                    width: 80px !important;
                    flex-shrink: 0 !important;
                    display: block !important;
                    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }

                /* Fading and static positioning for elements inside collapsed sidebar */
                .sidebar .sidebar-header-info,
                .sidebar .nav-text,
                .sidebar .sync-text,
                .sidebar .sync-next-time {
                    opacity: 0 !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                    white-space: nowrap !important;
                    transition: opacity 0.15s ease, transform 0.15s ease !important;
                    transform: translateX(-10px) !important;
                    will-change: opacity, transform;
                }

                /* Al hacer Hover en Sidebar */
                .sidebar:hover {
                    width: 260px !important;
                }

                .sidebar:hover .sidebar-header-info,
                .sidebar:hover .nav-text,
                .sidebar:hover .sync-text,
                .sidebar:hover .sync-next-time {
                    opacity: 1 !important;
                    visibility: visible !important;
                    pointer-events: auto !important;
                    transform: translateX(0) !important;
                    transition: opacity 0.2s ease 0.1s, transform 0.2s ease 0.1s !important;
                }
            }

            /* Responsive Móvil */
            @media (max-width: 500px) {
                .sidebar-spacer {
                    display: none !important;
                }
                .sidebar {
                    position: fixed !important;
                    left: -260px !important;
                    top: 0 !important;
                    height: 100vh !important;
                    width: 260px !important;
                    z-index: 1000 !important;
                    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    box-shadow: 4px 0 25px rgba(0,0,0,0.3) !important;
                    background-color: #0f172a !important;
                    color: white !important;
                    padding: 24px 20px !important;
                    box-sizing: border-box !important;
                    display: flex !important;
                    flex-direction: column !important;
                    border-right: 1px solid #1e293b !important;
                    overflow-x: hidden !important;
                    overflow-y: hidden !important;
                }
                .sidebar.open {
                    left: 0 !important;
                }
                .sidebar .sidebar-header-info,
                .sidebar .nav-text,
                .sidebar .sync-text {
                    opacity: 1 !important;
                    visibility: visible !important;
                    pointer-events: auto !important;
                    transform: translateX(0) !important;
                }
            }

            /* Aviso de "sin conexión" -- se probaron dos versiones como overlay flotante
               (abajo-centro, luego arriba-derecha) y ambas terminaron tapando contenido real en
               alguna página (botones del carrito en ventas.html, fila de un producto agregado,
               botones de encabezado en reportes/gestion/dashboard): con paneles de altura variable
               y contenido dinámico (carrito con ítems, listas largas) no existe una esquina
               garantizada libre en TODAS las páginas. En vez de perseguir esa esquina, el aviso
               vive en el propio botón "Sincronizar Nube" del sidebar -- es la única zona fija
               (sidebar-spacer) que ninguna página pinta encima, así que nunca puede tapar nada.
               Ver aplicarEstadoConexion() más abajo y notificarEstadoConexion() en
               sync/syncService.js (solo dispara en cada cambio real de estado, no en cada ciclo). */
            @keyframes pos-conexion-pulso {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.35; }
            }
            .nav-btn-sync-new > span:first-child {
                position: relative;
            }
            .sync-conexion-dot {
                display: none;
                position: absolute;
                top: -2px;
                right: -3px;
                width: 9px;
                height: 9px;
                border-radius: 50%;
                background-color: #f59e0b;
                border: 2px solid #0f172a;
                box-sizing: content-box;
                animation: pos-conexion-pulso 1.6s ease-in-out infinite;
            }
            .nav-btn-sync-new.sin-conexion .sync-conexion-dot {
                display: block;
            }
            .nav-btn-sync-new.sin-conexion {
                background-color: rgba(245, 158, 11, 0.08);
                color: #f59e0b;
                border-color: rgba(245, 158, 11, 0.2);
            }
            .nav-btn-sync-new.sin-conexion .sync-next-time {
                color: rgba(245, 158, 11, 0.75);
            }
            .nav-btn-sync-new.sin-conexion:hover:not(:disabled) {
                background-color: #f59e0b;
                color: #1e1b0a;
                border-color: #f59e0b;
            }

            /* Aviso de traslado entrante (ver onTransferenciaEntrante más abajo): apilado en la
               esquina inferior derecha, fuera del área del sidebar/spacer, para no repetir el
               problema descrito arriba para el aviso de conexión. */
            #pos-toast-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            }
            @keyframes pos-toast-entrada {
                from { transform: translateX(120%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .pos-toast {
                pointer-events: auto;
                background-color: #1e293b;
                border: 1px solid rgba(59, 130, 246, 0.4);
                border-left: 4px solid #3b82f6;
                border-radius: 10px;
                padding: 12px 16px;
                width: 320px;
                max-width: calc(100vw - 40px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
                color: #f8fafc;
                font-family: inherit;
                cursor: pointer;
                animation: pos-toast-entrada 0.25s ease-out;
            }
            .pos-toast:hover {
                border-left-color: #60a5fa;
            }
            .pos-toast-titulo {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 700;
                font-size: 0.95rem;
                margin-bottom: 4px;
            }
            .pos-toast-detalle {
                font-size: 0.85rem;
                color: #cbd5e1;
                line-height: 1.4;
            }
        `;
        document.head.appendChild(styleEl);
    }

    // 1. Encontrar el contenedor o crear el sidebar antes del contenido principal
    let container = document.getElementById('sidebar-container');
    if (!container) {
        const existingSidebar = document.querySelector('.sidebar');
        if (existingSidebar) {
            container = existingSidebar;
        } else {
            container = document.createElement('div');
            container.className = 'sidebar';
            document.body.insertBefore(container, document.body.firstChild);
        }
    }

    // Inyectar el spacer si no existe
    let spacer = document.getElementById('sidebar-spacer-el');
    if (!spacer) {
        spacer = document.createElement('div');
        spacer.id = 'sidebar-spacer-el';
        spacer.className = 'sidebar-spacer';
        container.parentNode.insertBefore(spacer, container.nextSibling);
    }

    // Datos de sesión activa
    const currentUser = sessionStorage.getItem('currentUser') || 'Invitado';
    const currentRole = sessionStorage.getItem('currentRole') || 'Sin Rol';

    // Determinar qué botón está activo
    const path = window.location.pathname;
    const isDashboard = path.includes('dashboard.html');
    const isVentas = path.includes('ventas.html');
    const isGastos = path.includes('gastos.html');
    const isTransferencias = path.includes('transferencias.html');
    const isReportes = path.includes('reportes.html');
    const isArqueo = path.includes('arqueo.html');
    const isAdmin = path.includes('admin.html') && !path.includes('admin-audit-logs.html');
    const isGestion = path.includes('gestion.html');
    const isVentasAnteriores = path.includes('ventas-anteriores.html');
    const isAuditLogs = path.includes('admin-audit-logs.html');
    const isPedidos = path.includes('pedidos.html');

    // Título dinámico de la ventana: "[App] - [Página] | Sucursal: [Sucursal]"
    const paginaActual =
        isDashboard ? 'Inventario' :
        isVentas ? 'Registrar Venta' :
        isGastos ? 'Registrar Gasto' :
        isTransferencias ? 'Traslado de Productos' :
        isReportes ? 'Reporte Diario' :
        isArqueo ? 'Cuadre de Caja' :
        isAdmin ? 'Administración' :
        isGestion ? 'Gestión' :
        isVentasAnteriores ? 'Ventas Días Anteriores' :
        isAuditLogs ? 'Logs de Auditoría' :
        isPedidos ? 'Pedidos / Apartados' :
        'Sistema Principal';

    if (window.api && window.api.obtenerSucursalId) {
        window.api.obtenerSucursalId().then(res => {
            const nombreSucursal = (res && res.success && res.id) ? res.id : 'Sin asignar';
            document.title = `POS Delipostres Turbaco - ${paginaActual} | Sucursal: ${nombreSucursal}`;
        }).catch(() => { });
    }

    // Inyectar la estructura del sidebar
    container.className = 'sidebar';
    container.innerHTML = `
        <div class="sidebar-header" style="display: flex; align-items: center; margin-bottom: 16px; gap: 12px; height: 50px; overflow: hidden; flex-shrink: 0;">
            <span style="font-size: 1.6rem; flex-shrink: 0; display: block; text-align: center; width: 24px;">🧁</span>
            <div class="sidebar-header-info" style="display: flex; flex-direction: column; overflow: hidden; min-width: 0; flex: 1;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                    <h2 class="sidebar-title" style="margin: 0; font-size: 1.1rem; color: #f8fafc; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">POS Delipostres</h2>
                    <button id="btn-nueva-ventana-sutil" onclick="window.api.abrirNuevaVentana().then(res => { if (res && !res.success) alert(res.message); })" title="Abrir nueva ventana / otra sesión (Ctrl+N)" style="background: transparent; border: 1px solid rgba(148,163,184,0.25); color: #94a3b8; cursor: pointer; font-size: 0.85rem; padding: 2px 6px; border-radius: 6px; line-height: 1; transition: all 0.2s;" onmouseenter="this.style.color='#f8fafc'; this.style.borderColor='#94a3b8'; this.style.backgroundColor='rgba(255,255,255,0.08)'" onmouseleave="this.style.color='#94a3b8'; this.style.borderColor='rgba(148,163,184,0.25)'; this.style.backgroundColor='transparent'">🗗</button>
                </div>
                <span style="font-size: 0.8rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-flex; align-items: center; gap: 4px; margin-top: 1px;">
                    <strong id="display-user">${currentUser}</strong>
                    <span id="display-role" style="color: #FCF9F5; opacity: 0.8; font-weight: 600;">(${currentRole})</span>
                </span>
            </div>
        </div>

        <div class="nav-menu" style="display: flex; flex-direction: column;">
            <button class="nav-btn ${isDashboard ? 'active' : ''}" onclick="location.href='dashboard.html'"><span>📋</span> <span class="nav-text">Ver Inventario</span></button>
            <div style="display: flex; gap: 4px; width: 100%;">
                <button class="nav-btn ${isVentas ? 'active' : ''}" onclick="location.href='ventas.html'" style="flex-grow: 1;"><span>🛒</span> <span class="nav-text">Registrar Venta</span></button>
                <button class="nav-btn" onclick="window.api.abrirVentanaVentas().then(res => { if (res && !res.success) alert(res.message); })" title="Abrir en ventana independiente" style="width: 40px; flex-shrink: 0; justify-content: center; padding: 10px 0;"><span>🗔</span></button>
            </div>
            <button class="nav-btn ${isGastos ? 'active' : ''}" onclick="location.href='gastos.html'"><span>💸</span> <span class="nav-text">Registrar Gasto</span></button>
            <button class="nav-btn ${isTransferencias ? 'active' : ''}" onclick="location.href='transferencias.html'"><span>🔄</span> <span class="nav-text">Traslado de Productos</span></button>
            <button class="nav-btn ${isPedidos ? 'active' : ''}" id="btn-nav-pedidos" onclick="location.href='pedidos.html'" style="position: relative;"><span>📦</span> <span class="nav-text">Pedidos / Apartados</span> <span id="badge-pedidos-atrasados" style="display: none; position: absolute; top: 4px; right: 6px; background-color: #ef4444; color: white; font-size: 0.7rem; font-weight: 700; line-height: 1; padding: 3px 6px; border-radius: 999px; min-width: 8px; text-align: center;"></span></button>
            <button class="nav-btn ${isArqueo ? 'active' : ''}" onclick="location.href='arqueo.html'"><span>🪙</span> <span class="nav-text">Cuadre de Caja</span></button>
            <button class="nav-btn ${isVentasAnteriores ? 'active' : ''}" onclick="location.href='ventas-anteriores.html'"><span>🗓️</span> <span class="nav-text">Edición Ventas Anteriores</span></button>
            <button class="nav-btn ${isReportes ? 'active' : ''}" onclick="location.href='reportes.html'"><span>📊</span> <span class="nav-text">Reporte Diario</span></button>
            <button class="nav-btn ${isGestion ? 'active' : ''}" id="btn-nav-gestion" onclick="location.href='gestion.html'" style="display: ${currentRole === 'Administrador' ? 'flex' : 'none'};"><span>📈</span> <span class="nav-text">Reportes Gestión</span></button>
            <button class="nav-btn ${isAdmin ? 'active' : ''}" id="btn-nav-admin" onclick="location.href='admin.html'" style="position: relative;"><span>⚙️</span> <span class="nav-text">Administración</span> <span id="badge-solicitudes-pendientes" style="display: none; position: absolute; top: 4px; right: 6px; background-color: #ef4444; color: white; font-size: 0.7rem; font-weight: 700; line-height: 1; padding: 3px 6px; border-radius: 999px; min-width: 8px; text-align: center;"></span></button>
            <button class="nav-btn ${isAuditLogs ? 'active' : ''}" id="btn-nav-audit-logs" onclick="location.href='admin-audit-logs.html'" style="display: ${currentRole === 'Administrador' ? 'flex' : 'none'};"><span>📜</span> <span class="nav-text">Logs de Auditoría</span></button>
        </div>

        <div class="sidebar-footer">
            <button class="nav-btn-sync-new" id="btn-sync-now">
                <span class="sync-icon">🔄<span class="sync-conexion-dot" id="sync-conexion-dot"></span></span>
                <span class="sync-text-col">
                    <span class="sync-text">Sincronizar Nube</span>
                    <span class="sync-next-time" id="sync-next-time"></span>
                </span>
            </button>
            <button id="btn-logout" class="btn-logout-new"><span>🚪</span> <span class="nav-text">Cerrar Sesión</span></button>
        </div>
    `;

    // El sidebar se expande al pasar el mouse (80px -> 260px) como overlay, sin desplazar el
    // contenido de la página. Si un <select> con foco queda dentro de esa franja, su desplegable
    // nativo -- que el navegador siempre pinta en la capa más alta, por encima incluso de
    // elementos position:fixed -- termina flotando visualmente sobre el sidebar expandido. No hay
    // forma de bajar esa capa vía z-index, así que en su lugar cerramos el desplegable (blur)
    // apenas el mouse entra al sidebar, antes de que llegue a taparlo.
    container.addEventListener('mouseenter', () => {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.tagName === 'SELECT') {
            activeEl.blur();
        }
    });

    // Configurar listeners de menú hamburguesa móvil
    const toggleBtn = document.getElementById('menu-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (container.classList.contains('open') && !container.contains(e.target) && e.target !== toggleBtn) {
                container.classList.remove('open');
            }
        });
    }

    // Indicador sutil de "próxima sincronización" bajo el botón. `proximaSincronizacionTs` se
    // recalcula como "ahora + intervalo del rol" cada vez que corre un ciclo de sincronización
    // (manual o automático); un ticker aparte (independiente del propio intervalo de sync) lo
    // refresca cada segundo en pantalla como cuenta regresiva. Con el intervalo en 15s, mostrar
    // solo la hora:minuto (ej. "04:14 PM") no dejaba ver cuándo iba a pasar en realidad -- toda la
    // ventana de 15s se veía igual. Si el rol no tiene cadencia automática (o no hay window.api),
    // el indicador queda vacío.
    let proximaSincronizacionTs = null;

    function actualizarProximaSincronizacion() {
        if (!intervaloRolMs) return;
        proximaSincronizacionTs = Date.now() + intervaloRolMs;
        renderContadorProximaSincronizacion();
    }

    function renderContadorProximaSincronizacion() {
        const el = document.getElementById('sync-next-time');
        if (!el || !proximaSincronizacionTs) return;
        const segundosRestantes = Math.round((proximaSincronizacionTs - Date.now()) / 1000);
        el.innerText = segundosRestantes > 0 ? `Próxima en ${segundosRestantes}s` : 'Sincronizando...';
    }

    // Ejecuta la sincronización y, sin importar quién la disparó (botón manual, intervalo
    // automático por rol o el cierre de sesión), propaga el resultado de la misma forma:
    // invalida el estado de todas las vistas abiertas (evento 'pos-sincronizacion-completa',
    // escuchado por dashboard/ventas/transferencias/ventas-anteriores; Reporte Diario además
    // recibe el push IPC 'sincronizacion-completa' desde el proceso principal) y deja rastro
    // en consola si algo falló, en vez de tragarse el error con un catch vacío.
    async function ejecutarSincronizacion({ mostrarAlertas } = {}) {
        try {
            const res = await window.api.forzarSincronizacion();
            actualizarProximaSincronizacion();

            // procesarSincronizacion() reporta success:false cuando falla puntualmente la
            // subida/descarga de ventas o gastos, pero el resto de entidades (productos,
            // inventario, transferencias, clientes, etc.) ya corrieron en ese mismo ciclo y
            // pudieron cambiar datos locales -- solo se omite si ni siquiera llegó a ejecutarse
            // (ej. "ya hay una sincronización en curso" o sin conexión), en cuyo caso no hay nada
            // que invalidar.
            const huboCiclo = res.success || (res.message !== 'La sincronización ya está en curso.' && !res.sinConexion);
            if (huboCiclo) {
                // No recargamos la página: eso destruiría el carrito activo y cualquier
                // edición en curso. Cada vista decide qué refrescar escuchando este evento.
                window.dispatchEvent(new Event('pos-sincronizacion-completa'));
                actualizarBadgeSolicitudes();
                actualizarBadgePedidosAtrasados();
            }

            if (res.success) {
                if (mostrarAlertas) alert('Sincronización exitosa con la nube.');
            } else if (res.sinConexion) {
                // Sin alert() bloqueante: el banner amigable (activado por el evento
                // 'sincronizacion-conexion' del proceso principal) ya deja claro que no hay
                // conexión, tanto si este ciclo lo disparó el botón manual como el intervalo
                // automático -- no hace falta interrumpir con un diálogo modal redundante.
                console.log('[Sync] Sin conexión a internet, ciclo de sincronización omitido.');
            } else {
                console.error('[Sync] Sincronización con error:', res.message || 'Error desconocido');
                if (mostrarAlertas) alert('Sincronización parcial: ' + (res.message || 'Error desconocido') + (huboCiclo ? '\n(El resto de los datos sí se sincronizó correctamente.)' : ''));
            }
            return res;
        } catch (err) {
            console.error('[Sync] Fallo al conectar con el sincronizador:', err.message);
            actualizarProximaSincronizacion();
            if (mostrarAlertas) alert('Error al conectar con el sincronizador: ' + err.message);
            return { success: false, message: err.message };
        }
    }

    // Sincronización automática en segundo plano. Antes Operador cada 1 min y Administrador cada
    // 5 min: esa diferencia existía porque cada ciclo re-descargaba la tabla completa de cada
    // entidad (ver descargarTodo en sync/syncService.js), y hacerlo cada minuto para todos hubiera
    // sido demasiada carga. Desde que el pull es incremental por cursor (descargarDesdeCursor --
    // ver sync/migrate_incremental_pull.sql), cada ciclo sin cambios solo pregunta "¿hay algo con
    // sync_seq mayor al que ya tengo?" -- consultas triviales, así que ya no hay razón para que
    // Administrador espere 5 minutos para enterarse de cambios hechos en otra terminal.
    const INTERVALOS_SYNC_POR_ROL = { Operador: 15000, Administrador: 15000 };
    let intervalSincronizacionRol = null;
    const intervaloRolMs = INTERVALOS_SYNC_POR_ROL[currentRole];
    if (intervaloRolMs && window.api && window.api.forzarSincronizacion) {
        // setInterval no dispara su primera ejecución de inmediato, así que sin esto el primer
        // dato fresco tras iniciar sesión tardaría hasta 5 minutos (Administrador). El login
        // (renderer.js) deja esta marca en sessionStorage justo antes de redirigir a ventas.html;
        // se consume una sola vez aquí -- no en cada navegación interna entre páginas del sidebar,
        // solo la primera vez que carga una página después de loguearse.
        if (sessionStorage.getItem('syncAlEntrarPendiente') === '1') {
            sessionStorage.removeItem('syncAlEntrarPendiente');
            ejecutarSincronizacion({ mostrarAlertas: false });
        }
        intervalSincronizacionRol = setInterval(() => {
            ejecutarSincronizacion({ mostrarAlertas: false });
        }, intervaloRolMs);
        const intervalContadorProxima = setInterval(renderContadorProximaSincronizacion, 1000);
        window.addEventListener('beforeunload', () => {
            clearInterval(intervalSincronizacionRol);
            clearInterval(intervalContadorProxima);
        });
        actualizarProximaSincronizacion();
    }

    // Atajo de teclado (Ctrl+N o Cmd+N) para abrir una nueva ventana con sesión independiente
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            if (window.api && window.api.abrirNuevaVentana) {
                window.api.abrirNuevaVentana();
            }
        }
    });

    // Configurar listener para Cerrar Sesión
    const btnLogout = container.querySelector('#btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async (evt) => {
            // Cada página (ventas.js, admin.js, gastos.js, etc.) registra su propio listener extra
            // sobre este mismo #btn-logout que solo limpia sessionStorage y redirige. Al ser este handler
            // 'async', cede el control en el primer 'await' y ese listener synchronous alcanzaría a
            // redirigir antes de que termine la sincronización o la alerta de inventario negativo de
            // abajo. stopImmediatePropagation() evita que se dispare.
            evt.stopImmediatePropagation();
            if (intervalSincronizacionRol) clearInterval(intervalSincronizacionRol);
            btnLogout.disabled = true;
            try {
                await window.api.forzarSincronizacion();
            } catch (e) {
                console.error('Sincronización previa al cierre de sesión falló:', e);
            }

            // Avisar si quedaron productos con inventario negativo (ventas registradas sin stock
            // suficiente, permitidas con confirmación desde ventas.js/ventas-anteriores.js) antes de
            // cerrar la sesión, dando la opción de cancelar el cierre para ir a abastecer primero.
            try {
                const resId = await window.api.obtenerSucursalId();
                if (resId.success && window.api.getInventory) {
                    const resInv = await window.api.getInventory(resId.id);
                    if (resInv.success) {
                        const negativos = (resInv.data || []).filter(p => Number(p.stock) < 0);
                        if (negativos.length > 0) {
                            const listado = negativos.map(p => `• ${p.nombre}: ${p.stock}`).join('\n');
                            const cerrarIgual = confirm(
                                `Atención: los siguientes productos quedaron con inventario negativo por ventas registradas sin stock suficiente:\n\n${listado}\n\n¿Deseas cerrar sesión de todas formas? Cancela para ir a abastecerlos primero.`
                            );
                            // Corrige el bug de pérdida de foco en Electron al cerrar diálogos nativos en
                            // Windows (mismo fix que usan ventas.js/reportes.js/ventas-anteriores.js).
                            if (window.api && window.api.forceRefocus) window.api.forceRefocus();
                            if (!cerrarIgual) {
                                // El usuario decidió quedarse a abastecer: se restaura el intervalo de
                                // sincronización y el botón, sin limpiar la sesión ni redirigir.
                                btnLogout.disabled = false;
                                if (intervaloRolMs && window.api && window.api.forzarSincronizacion) {
                                    intervalSincronizacionRol = setInterval(() => {
                                        ejecutarSincronizacion({ mostrarAlertas: false });
                                    }, intervaloRolMs);
                                    actualizarProximaSincronizacion();
                                }
                                return;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('No se pudo verificar inventario negativo al cerrar sesión:', err);
            }

            sessionStorage.clear();
            window.location.href = 'index.html';
        });
    }

    // Estado del botón de Sincronizar: reacciona tanto al flag global de sincronización
    // (isSyncing) como al de conectividad (ver sync/syncService.js), sea cual sea el disparador
    // (este botón, el intervalo por rol, un evento crítico o el proceso principal desde otra
    // ventana). Los dos estados se combinan en un solo render (actualizarBotonSync) en vez de dos
    // handlers separados pisándose el texto -- un ciclo que arranca sin conexión dispara primero
    // 'sincronizacion-estado' (true, "Sincronizando...") y al terminar 'sincronizacion-conexion'
    // (false) seguido de 'sincronizacion-estado' (false); con handlers independientes, el último
    // en llegar ("Sincronizar Nube") pisaba el aviso de "Sin conexión" del que llegó antes.
    const btnSync = container.querySelector('#btn-sync-now');
    if (btnSync) {
        const icon = btnSync.querySelector('.sync-icon');
        const text = btnSync.querySelector('.sync-text');
        let sincronizando = false;
        let hayConexion = true; // se asume conectado hasta que el proceso principal diga lo contrario

        function actualizarBotonSync() {
            btnSync.disabled = sincronizando;
            btnSync.classList.toggle('sin-conexion', !hayConexion);
            if (icon) icon.classList.toggle('spinning', sincronizando);
            if (text) {
                text.innerText = sincronizando
                    ? 'Sincronizando...'
                    : (hayConexion ? 'Sincronizar Nube' : 'Sin conexión');
            }
            // Sin overlay flotante (ver comentario de estilos arriba): el aviso completo y
            // amigable vive en el title -- aparece como tooltip nativo al pasar el mouse por el
            // botón, sin poder tapar nunca contenido de la página.
            btnSync.title = hayConexion ? '' : 'Sin conexión a internet. Tus datos se guardan en este equipo y se sincronizarán solos al reconectar.';
        }

        function aplicarEstadoSincronizando(enCurso) {
            sincronizando = enCurso;
            actualizarBotonSync();
        }

        function aplicarEstadoConexion(conectado) {
            hayConexion = conectado;
            actualizarBotonSync();
        }

        if (window.api && window.api.onSincronizacionEstado) {
            window.api.onSincronizacionEstado(aplicarEstadoSincronizando);
        }
        if (window.api && window.api.isSincronizando) {
            window.api.isSincronizando().then(aplicarEstadoSincronizando).catch(() => { });
        }
        if (window.api && window.api.onSincronizacionConexion) {
            window.api.onSincronizacionConexion(aplicarEstadoConexion);
        }
        if (window.api && window.api.obtenerEstadoConexion) {
            window.api.obtenerEstadoConexion().then(aplicarEstadoConexion).catch(() => { });
        }

        btnSync.addEventListener('click', () => ejecutarSincronizacion({ mostrarAlertas: true }));
    }

    // Mostrar en el botón de Administración la cantidad de solicitudes de venta pendientes de aprobar
    function actualizarBadgeSolicitudes() {
        if (!(currentRole === 'Administrador' && window.api && window.api.contarSolicitudesPendientes)) return;
        window.api.contarSolicitudesPendientes().then(res => {
            const badge = document.getElementById('badge-solicitudes-pendientes');
            if (!badge) return;
            if (res && res.success && res.count > 0) {
                badge.innerText = res.count > 99 ? '99+' : String(res.count);
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }).catch(() => { });
    }
    actualizarBadgeSolicitudes();

    // Mostrar en el botón de Pedidos/Apartados la cantidad de pedidos pendientes que ya vencieron
    // o que se entregan HOY, para que sean "fáciles de ubicar" sin entrar a la página. A diferencia
    // del badge de solicitudes, este es visible para cualquier rol (Operador y Administrador
    // pueden gestionar pedidos por igual).
    function actualizarBadgePedidosAtrasados() {
        if (!(window.api && window.api.contarPedidosAtrasados)) return;
        window.api.contarPedidosAtrasados().then(res => {
            const badge = document.getElementById('badge-pedidos-atrasados');
            if (!badge) return;
            if (res && res.success && res.count > 0) {
                badge.innerText = res.count > 99 ? '99+' : String(res.count);
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }).catch(() => { });
    }
    actualizarBadgePedidosAtrasados();

    // Aviso de traslado entrante: el proceso principal detecta, al descargar la sincronización,
    // un traslado nuevo cuya sucursal destino es esta terminal (ver notificarTransferenciaEntrante
    // en sync/syncService.js) y lo empuja aquí por IPC. Se muestra en TODAS las ventanas abiertas
    // de esta sucursal, no solo en transferencias.html, porque el traslado puede llegar mientras
    // el usuario está vendiendo o haciendo caja.
    function mostrarTransferenciaEntrante(traslado) {
        let toastContainer = document.getElementById('pos-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'pos-toast-container';
            document.body.appendChild(toastContainer);
        }

        const resumenProductos = (traslado.productos || [])
            .map(p => `${p.nombre} (x${p.cantidad})`)
            .join(', ') || 'Ver detalle en Traslado de Productos';

        const toast = document.createElement('div');
        toast.className = 'pos-toast';
        toast.innerHTML = `
            <div class="pos-toast-titulo">📥 Traslado recibido de <span></span></div>
            <div class="pos-toast-detalle"></div>
        `;
        toast.querySelector('.pos-toast-titulo span').innerText = traslado.sucursalOrigenId;
        toast.querySelector('.pos-toast-detalle').innerText = resumenProductos;
        toast.addEventListener('click', () => { location.href = 'transferencias.html'; });

        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 12000);
    }

    if (window.api && window.api.onTransferenciaEntrante) {
        window.api.onTransferenciaEntrante(mostrarTransferenciaEntrante);
    }

    // Seleccionar automáticamente todo el texto al enfocar inputs numéricos y buscadores
    document.addEventListener('focus', function (e) {
        if (e.target && e.target.tagName === 'INPUT') {
            const shouldSelectAll = e.target.type === 'number' ||
                e.target.getAttribute('inputmode') === 'numeric' ||
                e.target.id.includes('monto') ||
                e.target.id.includes('precio') ||
                e.target.id.includes('cantidad') ||
                e.target.id.includes('search');
            if (shouldSelectAll) {
                e.target.select();

                // Evitar que el evento mouseup inmediatamente posterior deseleccione el texto
                const preventMouseUp = function (event) {
                    event.preventDefault();
                    e.target.removeEventListener('mouseup', preventMouseUp);
                };
                e.target.addEventListener('mouseup', preventMouseUp);

                const clearPrevent = function () {
                    e.target.removeEventListener('mouseup', preventMouseUp);
                    e.target.removeEventListener('blur', clearPrevent);
                };
                e.target.addEventListener('blur', clearPrevent);
            }
        }
    }, true);
})();

