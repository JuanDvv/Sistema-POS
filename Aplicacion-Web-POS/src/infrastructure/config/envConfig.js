const fs = require('fs');
const path = require('path');

function leerConfigLocalPos() {
    const candidatos = [
        path.resolve(__dirname, '../../../config.json'),
        path.resolve(__dirname, '../../../../config.json')
    ];
    for (const ruta of candidatos) {
        try {
            if (fs.existsSync(ruta)) {
                return JSON.parse(fs.readFileSync(ruta, 'utf-8'));
            }
        } catch (_) {}
    }
    return {};
}

function obtenerConfiguracionEntorno() {
    const localPos = leerConfigLocalPos();
    return {
        httpHost: process.env.WEB_HOST || '0.0.0.0',
        httpPort: Number(process.env.WEB_PORT || process.env.PORT || 3080),
        sessionSecret: process.env.SESSION_SECRET || 'delipostres-tailscale-mobile-secret-key',
        db: {
            host: String(process.env.DB_HOST || localPos.host || '127.0.0.1').trim(),
            port: Number(process.env.DB_PORT || localPos.port || 5432),
            database: String(process.env.DB_NAME || localPos.database || 'pos_delipostres').trim(),
            user: String(process.env.DB_USER || localPos.user || 'postgres').trim(),
            password: String(process.env.DB_PASSWORD ?? localPos.password ?? ''),
            ssl: process.env.DB_SSL !== undefined ? process.env.DB_SSL === 'true' : Boolean(localPos.ssl)
        }
    };
}

module.exports = {
    obtenerConfiguracionEntorno
};

