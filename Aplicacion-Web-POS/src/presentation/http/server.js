const http = require('http');
const fs = require('fs');
const path = require('path');
const { obtenerConfiguracionEntorno } = require('../../infrastructure/config/envConfig');
const { verificarConexionDb } = require('../../infrastructure/db/postgresClient');
const { buscarUsuarioPorUsername, registrarAuditoriaRemota } = require('../../infrastructure/repositories/authRepository');
const { listarLogsAuditoria } = require('../../infrastructure/repositories/auditoriaRepository');
const { listarSucursalesVigentes } = require('../../infrastructure/repositories/sucursalRepository');
const {
    listarCatalogoPorSucursal,
    crearProductoConInventario,
    editarProductoConInventario,
    abastecerStockProducto,
    eliminarProductoSoftDelete,
    guardarCategoria,
    eliminarCategoriaSoftDelete
} = require('../../infrastructure/repositories/catalogoRepository');
const {
    validarDatosProducto,
    validarAbastecimiento,
    validarDatosCategoria
} = require('../../domain/catalogo/catalogoDomain');
const {
    obtenerReporteDiario,
    obtenerDetalleVentaPorId,
    editarVentaEnReporte,
    eliminarVentaEnReporte,
    crearGastoEnReporte,
    editarGastoEnReporte,
    eliminarGastoEnReporte
} = require('../../infrastructure/repositories/reporteDiarioRepository');
const {
    validarFechaReporte,
    validarEdicionVenta,
    validarDatosGasto
} = require('../../domain/reportes/reporteDiarioDomain');
const {
    normalizarCredenciales,
    validarUsuarioAutenticado,
    firmarTokenSesion,
    verificarTokenSesion
} = require('../../domain/auth/authDomain');
const { obtenerFechaWallClock, obtenerSoloFechaWallClock } = require('../../domain/shared/clock');

const config = obtenerConfiguracionEntorno();
const WEB_DIR = path.join(__dirname, '../web');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function enviarJson(res, status, payload, extraHeaders = {}) {
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...extraHeaders
    });
    res.end(JSON.stringify(payload));
}

function leerBodyJson(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => {
            raw += chunk;
            if (raw.length > 1e6) {
                req.destroy();
                reject(new Error('Payload demasiado grande.'));
            }
        });
        req.on('end', () => {
            if (!raw) return resolve({});
            try {
                resolve(JSON.parse(raw));
            } catch (_) {
                reject(new Error('JSON inválido.'));
            }
        });
        req.on('error', reject);
    });
}

function extraerTokenRequest(req) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }
    const cookieHeader = req.headers['cookie'] || '';
    const partes = cookieHeader.split(';').map(c => c.trim());
    for (const parte of partes) {
        if (parte.startsWith('pos_mobile_token=')) {
            return decodeURIComponent(parte.substring('pos_mobile_token='.length));
        }
    }
    return null;
}

function obtenerSesionRequest(req) {
    const token = extraerTokenRequest(req);
    return verificarTokenSesion(token, config.sessionSecret);
}

function servirArchivoEstatico(reqPath, res) {
    const rutaRelativa = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
    const rutaSegura = path.normalize(path.join(WEB_DIR, rutaRelativa));
    if (!rutaSegura.startsWith(WEB_DIR)) {
        return enviarJson(res, 403, { ok: false, error: 'Acceso denegado.' });
    }
    if (!fs.existsSync(rutaSegura) || fs.statSync(rutaSegura).isDirectory()) {
        return enviarJson(res, 404, { ok: false, error: 'Recurso no encontrado.' });
    }
    const ext = path.extname(rutaSegura).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    fs.createReadStream(rutaSegura).pipe(res);
}

const server = http.createServer(async (req, res) => {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;

    try {
        if (req.method === 'GET' && pathname === '/favicon.ico') {
            res.writeHead(204);
            return res.end();
        }

        if (req.method === 'GET' && pathname === '/api/health') {
            const estadoDb = await verificarConexionDb();
            return enviarJson(res, estadoDb.conectado ? 200 : 503, {
                ok: estadoDb.conectado,
                dbHost: config.db.host,
                database: config.db.database,
                horaPlanta: obtenerFechaWallClock(),
                error: estadoDb.error || null
            });
        }

        if (req.method === 'POST' && pathname === '/api/auth/login') {
            const body = await leerBodyJson(req);
            const { username, password } = normalizarCredenciales(body);
            const usuarioDb = await buscarUsuarioPorUsername(username);
            const usuarioValido = validarUsuarioAutenticado(usuarioDb, password);
            const token = firmarTokenSesion(usuarioValido, config.sessionSecret);

            await registrarAuditoriaRemota({
                usuario: usuarioValido.username,
                rol: usuarioValido.rol,
                sucursalId: 'Web-Movil',
                accion: 'Inicio Sesión (Web Móvil)',
                detalles: 'Inicio de sesión exitoso en portal móvil'
            });

            return enviarJson(
                res,
                200,
                { ok: true, usuario: usuarioValido, token },
                { 'Set-Cookie': `pos_mobile_token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=43200; SameSite=Strict` }
            );
        }

        if (req.method === 'POST' && pathname === '/api/auth/logout') {
            const sesion = obtenerSesionRequest(req);
            if (sesion) {
                await registrarAuditoriaRemota({
                    usuario: sesion.username,
                    rol: sesion.rol,
                    sucursalId: 'Web-Movil',
                    accion: 'Cierre Sesión (Web Móvil)',
                    detalles: 'Cierre de sesión voluntario en portal web móvil'
                });
            }
            return enviarJson(
                res,
                200,
                { ok: true },
                { 'Set-Cookie': 'pos_mobile_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict' }
            );
        }

        if (req.method === 'GET' && pathname === '/api/auth/session') {
            const sesion = obtenerSesionRequest(req);
            if (!sesion) {
                return enviarJson(res, 200, { ok: false, authenticated: false });
            }
            const sucursales = await listarSucursalesVigentes();
            return enviarJson(res, 200, {
                ok: true,
                authenticated: true,
                usuario: sesion,
                sucursales,
                horaPlanta: obtenerFechaWallClock()
            });
        }

        if (pathname.startsWith('/api/')) {
            const sesion = obtenerSesionRequest(req);
            if (!sesion) {
                return enviarJson(res, 401, { ok: false, error: 'Sesión no iniciada o expirada.' });
            }

            if (req.method === 'GET' && pathname === '/api/auditoria') {
                if (sesion.rol !== 'Administrador') {
                    return enviarJson(res, 403, { ok: false, error: 'Acceso denegado. Solo administradores pueden ver los logs de auditoría.' });
                }
                const limite = Number(urlObj.searchParams.get('limite')) || 50;
                const offset = Number(urlObj.searchParams.get('offset')) || 0;
                const busqueda = urlObj.searchParams.get('busqueda') || '';
                const accion = urlObj.searchParams.get('accion') || '';
                const usuario = urlObj.searchParams.get('usuario') || '';

                const resultado = await listarLogsAuditoria({ limite, offset, busqueda, accion, usuario });
                return enviarJson(res, 200, { ok: true, ...resultado });
            }

            if (req.method === 'GET' && pathname === '/api/catalogo') {
                const sucursalId = urlObj.searchParams.get('sucursalId') || '';
                const catalogo = await listarCatalogoPorSucursal(sucursalId);
                return enviarJson(res, 200, { ok: true, ...catalogo });
            }

            if (req.method === 'POST' && pathname === '/api/productos') {
                const body = await leerBodyJson(req);
                const datos = validarDatosProducto(body, true);
                const creado = await crearProductoConInventario({ datos, usuario: sesion });
                return enviarJson(res, 201, { ok: true, id: creado.id, message: 'Producto creado y sincronizado.' });
            }

            const matchAbastecer = pathname.match(/^\/api\/productos\/([^/]+)\/abastecer$/);
            if (req.method === 'POST' && matchAbastecer) {
                const productoId = decodeURIComponent(matchAbastecer[1]);
                const body = await leerBodyJson(req);
                const { sucursalId, cantidad } = validarAbastecimiento(body);
                const resultado = await abastecerStockProducto({
                    productoId,
                    sucursalId,
                    cantidad,
                    usuario: sesion
                });
                return enviarJson(res, 200, {
                    ok: true,
                    ...resultado,
                    message: `Se abastecieron +${cantidad} unidades.`
                });
            }

            const matchProductoId = pathname.match(/^\/api\/productos\/([^/]+)$/);
            if (matchProductoId) {
                const productoId = decodeURIComponent(matchProductoId[1]);

                if (req.method === 'PUT') {
                    const body = await leerBodyJson(req);
                    const datos = validarDatosProducto(body, false);
                    const resultado = await editarProductoConInventario({
                        productoId,
                        datos,
                        usuario: sesion
                    });
                    return enviarJson(res, 200, {
                        ok: true,
                        ...resultado,
                        message: 'Producto actualizado y sincronizado.'
                    });
                }

                if (req.method === 'DELETE') {
                    const sucursalId = urlObj.searchParams.get('sucursalId') || 'Catálogo';
                    await eliminarProductoSoftDelete({ productoId, sucursalId, usuario: sesion });
                    return enviarJson(res, 200, { ok: true, message: 'Producto eliminado (Soft Delete sincronizado).' });
                }
            }

            if (req.method === 'POST' && pathname === '/api/categorias') {
                const body = await leerBodyJson(req);
                const datos = validarDatosCategoria(body);
                const resultado = await guardarCategoria({ categoriaId: null, datos, usuario: sesion });
                return enviarJson(res, 201, { ok: true, ...resultado, message: 'Categoría creada.' });
            }

            const matchCategoriaId = pathname.match(/^\/api\/categorias\/([^/]+)$/);
            if (matchCategoriaId) {
                const categoriaId = decodeURIComponent(matchCategoriaId[1]);

                if (req.method === 'PUT') {
                    const body = await leerBodyJson(req);
                    const datos = validarDatosCategoria(body);
                    const resultado = await guardarCategoria({ categoriaId, datos, usuario: sesion });
                    return enviarJson(res, 200, { ok: true, ...resultado, message: 'Categoría actualizada.' });
                }

                if (req.method === 'DELETE') {
                    await eliminarCategoriaSoftDelete({ categoriaId, usuario: sesion });
                    return enviarJson(res, 200, { ok: true, message: 'Categoría eliminada.' });
                }
            }

            if (req.method === 'GET' && pathname === '/api/reporte-diario') {
                const sucursalId = urlObj.searchParams.get('sucursalId') || '';
                if (!sucursalId) {
                    throw new Error('Debe seleccionar una sucursal activa.');
                }
                const fechaParam = urlObj.searchParams.get('fecha') || obtenerSoloFechaWallClock();
                const fecha = validarFechaReporte(fechaParam);
                const reporte = await obtenerReporteDiario({ sucursalId, fecha });
                return enviarJson(res, 200, { ok: true, ...reporte });
            }

            const matchVentaId = pathname.match(/^\/api\/ventas\/([^/]+)$/);
            if (matchVentaId) {
                const ventaId = decodeURIComponent(matchVentaId[1]);

                if (req.method === 'GET') {
                    const detalleVenta = await obtenerDetalleVentaPorId(ventaId);
                    return enviarJson(res, 200, { ok: true, ...detalleVenta });
                }

                if (req.method === 'PUT') {
                    const body = await leerBodyJson(req);
                    const datos = validarEdicionVenta(body);
                    await editarVentaEnReporte({ ventaId, datos, usuario: sesion });
                    return enviarJson(res, 200, { ok: true, message: 'Venta actualizada y sincronizada.' });
                }

                if (req.method === 'DELETE') {
                    await eliminarVentaEnReporte({ ventaId, usuario: sesion });
                    return enviarJson(res, 200, { ok: true, message: 'Venta eliminada y stock devuelto.' });
                }
            }

            if (req.method === 'POST' && pathname === '/api/gastos') {
                const body = await leerBodyJson(req);
                const sucursalId = String(body.sucursalId || '').trim();
                if (!sucursalId) {
                    throw new Error('Debe seleccionar una sucursal activa.');
                }
                const fechaDia = validarFechaReporte(body.fecha || obtenerSoloFechaWallClock());
                const datos = validarDatosGasto(body);
                const creado = await crearGastoEnReporte({ sucursalId, fechaDia, datos, usuario: sesion });
                return enviarJson(res, 201, { ok: true, ...creado, message: 'Gasto registrado y sincronizado.' });
            }

            const matchGastoId = pathname.match(/^\/api\/gastos\/([^/]+)$/);
            if (matchGastoId) {
                const gastoId = decodeURIComponent(matchGastoId[1]);

                if (req.method === 'PUT') {
                    const body = await leerBodyJson(req);
                    const datos = validarDatosGasto(body);
                    await editarGastoEnReporte({ gastoId, datos, usuario: sesion });
                    return enviarJson(res, 200, { ok: true, message: 'Gasto actualizado y sincronizado.' });
                }

                if (req.method === 'DELETE') {
                    await eliminarGastoEnReporte({ gastoId, usuario: sesion });
                    return enviarJson(res, 200, { ok: true, message: 'Gasto eliminado y sincronizado.' });
                }
            }

            return enviarJson(res, 404, { ok: false, error: 'Endpoint no encontrado.' });
        }

        return servirArchivoEstatico(pathname, res);
    } catch (err) {
        const status = err.message.includes('Credenciales') || err.message.includes('Debe ingresar') ? 401 : 500;
        return enviarJson(res, status, { ok: false, error: err.message });
    }
});

server.listen(config.httpPort, config.httpHost, () => {
    const urlVisible = config.httpHost === '0.0.0.0' ? 'localhost' : config.httpHost;
    console.log(`[Aplicacion-Web-POS] Servidor activo en http://${urlVisible}:${config.httpPort}`);
    console.log(`[Aplicacion-Web-POS] PostgreSQL destino -> ${config.db.host}:${config.db.port}/${config.db.database}`);
});

