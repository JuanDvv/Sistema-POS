const crypto = require('crypto');

function normalizarCredenciales(payload = {}) {
    const username = String(payload.username || '').trim();
    const password = String(payload.password || '');
    if (!username || !password) {
        throw new Error('Debe ingresar usuario y contraseña.');
    }
    return { username, password };
}

function validarUsuarioAutenticado(usuarioDb, passwordPlano) {
    if (!usuarioDb || usuarioDb.deleted_at) {
        throw new Error('Credenciales inválidas.');
    }
    if (String(usuarioDb.password) !== String(passwordPlano)) {
        throw new Error('Credenciales inválidas.');
    }
    return {
        id: usuarioDb.id,
        username: usuarioDb.username,
        rol: usuarioDb.rol || 'Operador'
    };
}

function firmarTokenSesion(usuario, secret, duracionSegundos = 43200) {
    const exp = Math.floor(Date.now() / 1000) + duracionSegundos;
    const datos = {
        id: usuario.id,
        username: usuario.username,
        rol: usuario.rol,
        exp
    };
    const base64Payload = Buffer.from(JSON.stringify(datos), 'utf-8').toString('base64url');
    const firma = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');
    return `${base64Payload}.${firma}`;
}

function verificarTokenSesion(token, secret) {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
        return null;
    }
    const [base64Payload, firmaRecibida] = token.split('.');
    const firmaEsperada = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');
    const bufRecibida = Buffer.from(firmaRecibida);
    const bufEsperada = Buffer.from(firmaEsperada);
    if (bufRecibida.length !== bufEsperada.length || !crypto.timingSafeEqual(bufRecibida, bufEsperada)) {
        return null;
    }
    try {
        const datos = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf-8'));
        const ahoraSegundos = Math.floor(Date.now() / 1000);
        if (!datos.exp || datos.exp < ahoraSegundos) {
            return null;
        }
        return {
            id: datos.id,
            username: datos.username,
            rol: datos.rol
        };
    } catch (_) {
        return null;
    }
}

module.exports = {
    normalizarCredenciales,
    validarUsuarioAutenticado,
    firmarTokenSesion,
    verificarTokenSesion
};

