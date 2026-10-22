const http = require('http');
const fs = require('fs');
const path = require('path');
const { obtenerConfiguracionEntorno } = require('../../infrastructure/config/envConfig');
const { verificarConexionDb } = require('../../infrastructure/db/postgresClient');
const { buscarUsuarioPorUsername, registrarAuditoriaRemota } = require('../../infrastructure/repositories/authRepository');
const { listarSucursalesVigentes } = require('../../infrastructure/repositories/sucursalRepository');
const {
    normalizarCredenciales,
    validarUsuarioAutenticado,
    firmarTokenSesion,
    verificarTokenSesion
} = require('../../domain/auth/authDomain');
const { obtenerFechaWallClock } = require('../../domain/shared/clock');

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
                accion: 'LOGIN_WEB_MOVIL',
                detalles: { origen: 'Tailscale Web Movil' }
            });

            return enviarJson(
                res,
                200,
                { ok: true, usuario: usuarioValido, token },
                { 'Set-Cookie': `pos_mobile_token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=43200; SameSite=Strict` }
            );
        }

        if (req.method === 'POST' && pathname === '/api/auth/logout') {
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
                return enviarJson(res, 401, { ok: false, error: 'Sesión no iniciada o expirada.' });
            }
            const sucursales = await listarSucursalesVigentes();
            return enviarJson(res, 200, {
                ok: true,
                usuario: sesion,
                sucursales,
                horaPlanta: obtenerFechaWallClock()
            });
        }

        if (pathname.startsWith('/api/')) {
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

