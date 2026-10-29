const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { runQuery, allQuery } = require('../db/connection');
const pkg = require('../package.json');

let sesionActiva = {
    usuario: 'Sistema',
    rol: 'Sin Rol'
};

let onNuevoErrorCallback = null;

function configurarCallbackSincronizacionErrores(cb) {
    onNuevoErrorCallback = typeof cb === 'function' ? cb : null;
}

function actualizarSesionActiva(usuario, rol) {
    if (typeof usuario === 'string' && usuario.trim() !== '' && usuario.trim() !== 'Sistema') {
        sesionActiva.usuario = usuario.trim();
    }
    if (typeof rol === 'string' && rol.trim() !== '' && rol.trim() !== 'Sin Rol') {
        sesionActiva.rol = rol.trim();
    }
}

function obtenerFechaWallClockBogota() {
    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format().replace(',', '');
}

const CLAVES_SENSIBLES = new Set([
    'password',
    'passwordactual',
    'passwordnueva',
    'clave',
    'token',
    'secret',
    'apikey',
    'supabasekey'
]);

function sanitizarPayload(valor, profundidad = 0) {
    if (profundidad > 3) return '[Objeto anidado]';
    if (valor === null || valor === undefined) return valor;
    if (typeof valor === 'string') {
        return valor.length > 300 ? `${valor.slice(0, 300)}... [truncado]` : valor;
    }
    if (typeof valor !== 'object') return valor;
    if (Array.isArray(valor)) {
        const muestra = valor.slice(0, 10).map(item => sanitizarPayload(item, profundidad + 1));
        if (valor.length > 10) muestra.push(`... (+${valor.length - 10} elementos)`);
        return muestra;
    }
    const limpio = {};
    for (const [k, v] of Object.entries(valor)) {
        if (CLAVES_SENSIBLES.has(k.toLowerCase())) {
            limpio[k] = '[PROTEGIDO]';
        } else {
            limpio[k] = sanitizarPayload(v, profundidad + 1);
        }
    }
    return limpio;
}

function extraerContextoSesionDesdePayload(payload) {
    if (!payload || typeof payload !== 'object') return {};
    const usuario =
        payload.auditoriaUsuario ||
        payload.usuario ||
        payload.usuarioSolicitante ||
        payload.usuarioRevisor ||
        payload.usuario_creo ||
        payload.currentUser ||
        payload.username ||
        null;
    const rol =
        payload.auditoriaRol ||
        payload.rol ||
        payload.currentRole ||
        null;
    const sucursalId =
        payload.sucursalId ||
        payload.sucursal_id ||
        payload.sucursalOrigenId ||
        null;

    if (usuario || rol) {
        actualizarSesionActiva(usuario, rol);
    }
    return { usuario, rol, sucursalId };
}

async function resolverSucursalLocal(sucursalIdExplicita) {
    try {
        if (sucursalIdExplicita && sucursalIdExplicita !== 'Sin Sucursal') {
            const filas = await allQuery(
                `SELECT id, nombre FROM config_sucursal WHERE id = ? LIMIT 1`,
                [sucursalIdExplicita]
            );
            if (filas && filas.length > 0) {
                return { id: filas[0].id, nombre: filas[0].nombre || filas[0].id };
            }
            return { id: sucursalIdExplicita, nombre: sucursalIdExplicita };
        }
        const activas = await allQuery(
            `SELECT id, nombre FROM config_sucursal WHERE activa = 1 AND deleted_at IS NULL LIMIT 1`,
            []
        );
        if (activas && activas.length > 0) {
            return { id: activas[0].id, nombre: activas[0].nombre || activas[0].id };
        }
    } catch (_) {}
    return { id: sucursalIdExplicita || 'Sin Sucursal', nombre: sucursalIdExplicita || 'Sin Sucursal' };
}

const MAPA_CANALES_IPC = {
    'login': { modulo: 'Autenticación', accion: 'Iniciar sesión en el sistema' },
    'get-inventory': { modulo: 'Inventario', accion: 'Consultar inventario de productos' },
    'registrar-producto': { modulo: 'Inventario', accion: 'Crear un nuevo producto en el catálogo' },
    'editar-producto': { modulo: 'Inventario', accion: 'Editar datos o stock de un producto' },
    'eliminar-producto': { modulo: 'Inventario', accion: 'Eliminar un producto del catálogo' },
    'abastecer-stock': { modulo: 'Inventario', accion: 'Abastecer stock de un producto' },
    'generar-plantilla-abastecimiento': { modulo: 'Inventario', accion: 'Generar plantilla Excel de abastecimiento' },
    'previsualizar-abastecimiento-archivo': { modulo: 'Inventario', accion: 'Cargar archivo Excel de abastecimiento masivo' },
    'confirmar-abastecimiento-masivo': { modulo: 'Inventario', accion: 'Confirmar abastecimiento masivo de inventario' },
    'obtener-categorias': { modulo: 'Inventario', accion: 'Consultar categorías de productos' },
    'guardar-categoria': { modulo: 'Inventario', accion: 'Guardar categoría de productos' },
    'eliminar-categoria': { modulo: 'Inventario', accion: 'Eliminar categoría de productos' },
    'registrar-venta': { modulo: 'Ventas', accion: 'Registrar una venta del día' },
    'editar-venta': { modulo: 'Ventas', accion: 'Editar una venta registrada' },
    'eliminar-venta': { modulo: 'Ventas', accion: 'Eliminar una venta registrada' },
    'obtener-detalle-venta': { modulo: 'Ventas', accion: 'Consultar el detalle de una venta' },
    'registrar-venta-anterior': { modulo: 'Ventas Fecha Anterior', accion: 'Registrar una venta de fecha anterior' },
    'editar-venta-anterior': { modulo: 'Ventas Fecha Anterior', accion: 'Editar una venta de fecha anterior' },
    'eliminar-venta-anterior': { modulo: 'Ventas Fecha Anterior', accion: 'Eliminar una venta de fecha anterior' },
    'obtener-solicitudes-venta': { modulo: 'Solicitudes', accion: 'Consultar solicitudes de venta pendientes' },
    'aprobar-solicitud-venta': { modulo: 'Solicitudes', accion: 'Aprobar solicitud de venta de fecha anterior' },
    'rechazar-solicitud-venta': { modulo: 'Solicitudes', accion: 'Rechazar solicitud de venta de fecha anterior' },
    'registrar-gasto': { modulo: 'Gastos', accion: 'Registrar un gasto o baja de inventario' },
    'editar-gasto': { modulo: 'Gastos', accion: 'Editar un gasto registrado' },
    'eliminar-gasto': { modulo: 'Gastos', accion: 'Eliminar un gasto registrado' },
    'registrar-gasto-anterior': { modulo: 'Gastos Fecha Anterior', accion: 'Registrar un gasto de fecha anterior' },
    'aprobar-solicitud-gasto': { modulo: 'Solicitudes', accion: 'Aprobar solicitud de gasto de fecha anterior' },
    'rechazar-solicitud-gasto': { modulo: 'Solicitudes', accion: 'Rechazar solicitud de gasto de fecha anterior' },
    'actualizar-estado-devolucion': { modulo: 'Devoluciones', accion: 'Actualizar estado de devolución de producto' },
    'realizar-transferencia': { modulo: 'Traslados', accion: 'Enviar traslado de productos entre sucursales' },
    'editar-transferencia': { modulo: 'Traslados', accion: 'Editar traslado de productos' },
    'eliminar-transferencia': { modulo: 'Traslados', accion: 'Eliminar traslado de productos' },
    'crear-pedido': { modulo: 'Pedidos / Apartados', accion: 'Crear un nuevo pedido o apartado' },
    'editar-pedido': { modulo: 'Pedidos / Apartados', accion: 'Editar un pedido o apartado' },
    'registrar-abono-pedido': { modulo: 'Pedidos / Apartados', accion: 'Registrar abono a un pedido' },
    'eliminar-abono-pedido': { modulo: 'Pedidos / Apartados', accion: 'Eliminar abono de un pedido' },
    'entregar-pedido': { modulo: 'Pedidos / Apartados', accion: 'Marcar pedido como entregado y generar venta' },
    'revertir-entrega-pedido': { modulo: 'Pedidos / Apartados', accion: 'Revertir entrega de un pedido' },
    'cancelar-pedido': { modulo: 'Pedidos / Apartados', accion: 'Cancelar un pedido o apartado' },
    'guardar-cliente': { modulo: 'Clientes y Créditos', accion: 'Guardar datos de un cliente' },
    'eliminar-cliente': { modulo: 'Clientes y Créditos', accion: 'Eliminar un cliente' },
    'registrar-abono': { modulo: 'Clientes y Créditos', accion: 'Registrar abono a crédito de cliente' },
    'eliminar-abono': { modulo: 'Clientes y Créditos', accion: 'Eliminar abono de crédito de cliente' },
    'recuperar-abono': { modulo: 'Clientes y Créditos', accion: 'Recuperar un abono eliminado' },
    'registrar-cierre-caja': { modulo: 'Cuadre de Caja', accion: 'Registrar cierre / cuadre de caja' },
    'eliminar-cierre-caja': { modulo: 'Cuadre de Caja', accion: 'Eliminar un cierre de caja' },
    'recalcular-cierre-caja': { modulo: 'Cuadre de Caja', accion: 'Recalcular valores de un cierre de caja' },
    'imprimir-ticket': { modulo: 'Impresión Térmica', accion: 'Imprimir ticket de venta en impresora térmica' },
    'imprimir-ticket-pedido': { modulo: 'Impresión Térmica', accion: 'Imprimir ticket de pedido en impresora térmica' },
    'exportar-pdf': { modulo: 'Reportes y PDF', accion: 'Exportar reporte a PDF' },
    'generar-cuenta-cobro-pdf': { modulo: 'Reportes y PDF', accion: 'Generar PDF de cuenta de cobro de cliente' },
    'generar-cuenta-cobro-venta-pdf': { modulo: 'Reportes y PDF', accion: 'Generar PDF de cuenta de cobro de venta' },
    'get-reporte-diario': { modulo: 'Reportes', accion: 'Consultar el reporte diario de ventas y gastos' },
    'obtener-balance-financiero': { modulo: 'Reportes Gestión', accion: 'Consultar balance financiero en Reportes de Gestión' },
    'obtener-ranking-productos': { modulo: 'Reportes Gestión', accion: 'Consultar ranking de productos en Reportes de Gestión' },
    'guardar-sugerido-pasteleria': { modulo: 'Pastelería', accion: 'Guardar cantidades sugeridas de pastelería' },
    'exportar-excel-sugeridos-pasteleria': { modulo: 'Pastelería', accion: 'Exportar Excel de sugeridos de pastelería' },
    'exportar-excel-pedido-extra': { modulo: 'Pastelería', accion: 'Exportar Excel de pedido extra de pastelería' },
    'guardar-usuario': { modulo: 'Administración', accion: 'Crear o editar un usuario del sistema' },
    'eliminar-usuario': { modulo: 'Administración', accion: 'Eliminar un usuario del sistema' },
    'cambiar-password-propio': { modulo: 'Administración', accion: 'Cambiar contraseña de usuario' },
    'guardar-sucursal': { modulo: 'Administración', accion: 'Guardar configuración de sucursal' },
    'activar-sucursal': { modulo: 'Administración', accion: 'Cambiar la sucursal activa de esta terminal' },
    'eliminar-sucursal': { modulo: 'Administración', accion: 'Eliminar una sucursal' },
    'forzar-sincronizacion': { modulo: 'Sincronización', accion: 'Sincronizar datos manualmente con el servidor' },
    'guardar-config-servidor': { modulo: 'Servidor PostgreSQL', accion: 'Guardar configuración de conexión al servidor PostgreSQL' },
    'probar-conexion-servidor': { modulo: 'Servidor PostgreSQL', accion: 'Probar conexión con el servidor PostgreSQL' },
    'marcar-datos-locales-pendientes': { modulo: 'Sincronización', accion: 'Marcar datos locales para re-sincronización completa' }
};

function describirIntentoPorCanal(canal, payload) {
    const base = MAPA_CANALES_IPC[canal] || {
        modulo: 'Sistema',
        accion: `Ejecutar operación '${canal}'`
    };
    let detalleExtra = '';

    if (payload && typeof payload === 'object') {
        if (canal === 'registrar-venta' || canal === 'registrar-venta-anterior' || canal === 'editar-venta') {
            const cantItems = Array.isArray(payload.carrito) ? payload.carrito.length : 0;
            const total = payload.total !== undefined ? `$${Number(payload.total).toLocaleString('es-CO')}` : '';
            const metodo = payload.metodoPago || '';
            detalleExtra = [metodo, total, cantItems ? `${cantItems} producto(s)` : ''].filter(Boolean).join(' · ');
        } else if (canal === 'registrar-gasto' || canal === 'registrar-gasto-anterior' || canal === 'editar-gasto') {
            const tipo = payload.tipo || '';
            const monto = payload.monto !== undefined ? `$${Number(payload.monto).toLocaleString('es-CO')}` : '';
            const desc = payload.descripcion || '';
            detalleExtra = [tipo, monto, desc].filter(Boolean).join(' · ');
        } else if (canal === 'crear-pedido' || canal === 'editar-pedido') {
            const cliente = payload.cliente?.nombre || payload.clienteNombre || '';
            const total = payload.total !== undefined ? `$${Number(payload.total).toLocaleString('es-CO')}` : '';
            detalleExtra = [cliente ? `Cliente: ${cliente}` : '', total].filter(Boolean).join(' · ');
        } else if (canal === 'registrar-producto' || canal === 'editar-producto') {
            if (payload.nombre) detalleExtra = `Producto: ${payload.nombre}`;
        } else if (canal === 'abastecer-stock') {
            if (payload.cantidad !== undefined) detalleExtra = `Cantidad: +${payload.cantidad}`;
        } else if (canal === 'realizar-transferencia') {
            if (payload.sucursalDestinoId) detalleExtra = `Destino: ${payload.sucursalDestinoId}`;
        } else if (canal === 'imprimir-ticket' || canal === 'imprimir-ticket-pedido') {
            if (payload.printerName) detalleExtra = `Impresora: ${payload.printerName}`;
        }
    }

    return {
        modulo: base.modulo,
        intentoUsuario: detalleExtra ? `${base.accion} (${detalleExtra})` : base.accion
    };
}

const PATRONES_VALIDACION_ESPERADA = [
    /carrito está vacío/i,
    /contraseña actual es incorrecta/i,
    /credenciales incorrectas/i,
    /usuario o contraseña incorrectos/i,
    /ya existe un usuario/i,
    /ya existe una categoría/i,
    /ya existe un cliente/i,
    /al menos un producto/i,
    /límite de 3 ventanas/i,
    /sincronización ya está en curso/i,
    /seleccione/i,
    /obligatorio/i,
    /debe ser mayor/i,
    /no puede estar vacío/i,
    /fecha seleccionada no es válida/i,
    /saldo pendiente/i,
    /debe estar pagado en su totalidad/i,
    /cancelado por el usuario/i
];

function esValidacionNegocioEsperada(mensaje) {
    if (!mensaje || typeof mensaje !== 'string') return false;
    return PATRONES_VALIDACION_ESPERADA.some(regex => regex.test(mensaje));
}

function traducirErrorAmigable(rawError, modulo = 'Sistema') {
    const msg = String(rawError?.message || rawError || '').trim();
    const lower = msg.toLowerCase();

    if (lower.includes('sqlite_busy') || lower.includes('database is locked')) {
        return 'La base de datos local estaba ocupada procesando otra operación simultánea. Intente realizar la acción nuevamente.';
    }
    if (lower.includes('sqlite_corrupt') || lower.includes('malformed')) {
        return 'Se detectó un problema de lectura en el archivo de base de datos local de este equipo.';
    }
    if (lower.includes('econnrefused') || lower.includes('etimedout') || lower.includes('enotfound') || lower.includes('pool no disponible') || lower.includes('connection terminated')) {
        return 'No se pudo establecer comunicación con el servidor central de base de datos (PostgreSQL). Verifique que el servidor esté encendido y accesible en la red.';
    }
    if (lower.includes('unique constraint') || lower.includes('duplicate key') || lower.includes('23505')) {
        return 'Se intentó guardar un registro duplicado que ya existía en la base de datos.';
    }
    if (lower.includes('foreign key constraint') || lower.includes('23503')) {
        return 'No se pudo completar la operación porque este registro está vinculado a otros datos (ej. ventas, pedidos o productos asociados).';
    }
    if (lower.includes('does not exist') || lower.includes('no such column') || lower.includes('no such table') || lower.includes('pgrst202') || lower.includes('pgrst205')) {
        return 'Falta una tabla, columna o función actualizada en la base de datos para completar esta operación (requiere aplicar migración SQL).';
    }
    if (modulo === 'Impresión Térmica' || lower.includes('impresora') || lower.includes('printer') || lower.includes('spooler')) {
        return 'Falló la comunicación con la impresora térmica. Verifique que esté encendida, conectada por USB/Red y con papel.';
    }
    if (lower.includes('ebusy') || lower.includes('eacces') || lower.includes('eperm')) {
        return 'El sistema no pudo guardar o abrir el archivo porque está abierto en otro programa (ej. Excel o visor PDF) o sin permisos.';
    }
    if (msg.length > 0 && msg.length <= 180 && !lower.includes('select ') && !lower.includes('insert into') && !lower.includes('at ')) {
        return msg;
    }
    return `Ocurrió un fallo inesperado en el módulo de ${modulo} al procesar la operación solicitada.`;
}

function construirFichaTecnicaDesarrollador({
    fecha,
    sucursalId,
    sucursalNombre,
    usuario,
    rol,
    modulo,
    origen,
    intentoUsuario,
    mensajeAmigable,
    errorCrudo,
    codigoError,
    stack,
    contextoDatos
}) {
    const appEnv = (process.env.APP_ENV || '').toLowerCase();
    const entorno = appEnv === 'production' || appEnv === 'prod' ? 'PRODUCCIÓN' : 'PRUEBA / DESARROLLO';
    const versionApp = pkg.version || 'Desconocida';
    const soInfo = `${os.type()} ${os.release()} (${process.platform}/${process.arch}) - Host: ${os.hostname()}`;
    const sucursalTexto = sucursalNombre && sucursalNombre !== sucursalId
        ? `${sucursalNombre} (ID: ${sucursalId})`
        : (sucursalId || 'Sin Sucursal');

    const lineas = [
        `=== REPORTE TÉCNICO DE ERROR (POS v${versionApp}) ===`,
        `Fecha y Hora (Bogotá): ${fecha}`,
        `Sucursal:              ${sucursalTexto}`,
        `Usuario:               ${usuario || 'Sistema'} (Rol: ${rol || 'Sin Rol'})`,
        `Módulo / Origen:       ${modulo || 'Sistema'}${origen ? ` [${origen}]` : ''}`,
        `Acción del Usuario:    ${intentoUsuario || 'No especificada'}`,
        `Resumen Administrador: ${mensajeAmigable || '-'}`,
        `Entorno / Equipo:      ${entorno} | ${soInfo}`,
        `--------------------------------------------------`,
        `ERROR ORIGINAL:        ${errorCrudo || 'Sin mensaje de error'}`
    ];

    if (codigoError) {
        lineas.push(`CÓDIGO DE ERROR:       ${codigoError}`);
    }

    if (contextoDatos !== undefined && contextoDatos !== null) {
        try {
            const jsonContexto = typeof contextoDatos === 'string'
                ? contextoDatos
                : JSON.stringify(sanitizarPayload(contextoDatos), null, 2);
            if (jsonContexto && jsonContexto !== '{}' && jsonContexto !== 'null') {
                lineas.push(`--------------------------------------------------`);
                lineas.push(`DATOS DE LA OPERACIÓN (SANITIZADOS):`);
                lineas.push(jsonContexto);
            }
        } catch (_) {}
    }

    if (stack) {
        lineas.push(`--------------------------------------------------`);
        lineas.push(`STACK TRACE:`);
        lineas.push(String(stack));
    }

    return lineas.join('\n');
}

async function registrarErrorSistema({
    usuario,
    rol,
    sucursalId,
    modulo = 'Sistema',
    origen = '',
    intentoUsuario = 'Operación del sistema',
    mensajeAmigable = '',
    error,
    contextoDatos = null
} = {}) {
    try {
        const id = uuidv4();
        const fecha = obtenerFechaWallClockBogota();
        const usuarioFinal = usuario || sesionActiva.usuario || 'Sistema';
        const rolFinal = rol || sesionActiva.rol || 'Sin Rol';
        const sucursalResuelta = await resolverSucursalLocal(sucursalId);

        const errorCrudo = error instanceof Error
            ? error.message
            : (typeof error === 'object' && error !== null ? (error.message || JSON.stringify(error)) : String(error || 'Error desconocido'));
        const codigoError = (typeof error === 'object' && error !== null && error.code) ? String(error.code) : '';
        const stack = error instanceof Error
            ? error.stack
            : (typeof error === 'object' && error !== null && error.stack ? String(error.stack) : '');

        const amigableFinal = mensajeAmigable || traducirErrorAmigable(errorCrudo, modulo);

        const fichaTecnica = construirFichaTecnicaDesarrollador({
            fecha,
            sucursalId: sucursalResuelta.id,
            sucursalNombre: sucursalResuelta.nombre,
            usuario: usuarioFinal,
            rol: rolFinal,
            modulo,
            origen,
            intentoUsuario,
            mensajeAmigable: amigableFinal,
            errorCrudo,
            codigoError,
            stack,
            contextoDatos
        });

        await runQuery(
            `INSERT INTO cola_errores (id, fecha, usuario, rol, sucursal_id, modulo, intento_usuario, mensaje_amigable, error_tecnico, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                id,
                fecha,
                usuarioFinal,
                rolFinal,
                sucursalResuelta.id,
                modulo,
                intentoUsuario,
                amigableFinal,
                fichaTecnica
            ]
        );

        if (onNuevoErrorCallback) {
            onNuevoErrorCallback();
        }
    } catch (errInterno) {
        console.error('[ErrorLogService] Fallo al guardar en cola_errores:', errInterno.message);
    }
}

const CANALES_EXCLUIDOS_INTERCEPTOR = new Set([
    'obtener-errores-sistema',
    'obtener-modulos-errores',
    'obtener-usuarios-errores',
    'registrar-error-renderer',
    'force-refocus',
    'is-sincronizando',
    'obtener-estado-conexion'
]);

function instalarInterceptorErroresIpc(ipcMain) {
    if (!ipcMain || ipcMain._interceptorErroresInstalado) return;
    ipcMain._interceptorErroresInstalado = true;

    const originalHandle = ipcMain.handle.bind(ipcMain);

    ipcMain.handle = (canal, listener) => {
        if (CANALES_EXCLUIDOS_INTERCEPTOR.has(canal)) {
            return originalHandle(canal, listener);
        }

        return originalHandle(canal, async (event, ...args) => {
            const primerArg = args[0];
            const ctx = extraerContextoSesionDesdePayload(primerArg);
            const { modulo, intentoUsuario } = describirIntentoPorCanal(canal, primerArg);

            try {
                const resultado = await listener(event, ...args);

                if (canal === 'login' && resultado && resultado.success && resultado.user) {
                    actualizarSesionActiva(resultado.user.username, resultado.user.rol);
                }

                if (
                    resultado &&
                    typeof resultado === 'object' &&
                    resultado.success === false &&
                    !resultado.sinConexion &&
                    !esValidacionNegocioEsperada(resultado.message)
                ) {
                    await registrarErrorSistema({
                        usuario: ctx.usuario,
                        rol: ctx.rol,
                        sucursalId: ctx.sucursalId,
                        modulo,
                        origen: `IPC:${canal}`,
                        intentoUsuario,
                        mensajeAmigable: traducirErrorAmigable(resultado.message, modulo),
                        error: resultado.error || resultado.message || 'Operación devolvió success:false',
                        contextoDatos: primerArg
                    });
                }

                return resultado;
            } catch (err) {
                await registrarErrorSistema({
                    usuario: ctx.usuario,
                    rol: ctx.rol,
                    sucursalId: ctx.sucursalId,
                    modulo,
                    origen: `IPC:${canal}`,
                    intentoUsuario,
                    error: err,
                    contextoDatos: primerArg
                });
                throw err;
            }
        });
    };
}

module.exports = {
    obtenerFechaWallClockBogota,
    actualizarSesionActiva,
    configurarCallbackSincronizacionErrores,
    describirIntentoPorCanal,
    traducirErrorAmigable,
    construirFichaTecnicaDesarrollador,
    registrarErrorSistema,
    instalarInterceptorErroresIpc
};

