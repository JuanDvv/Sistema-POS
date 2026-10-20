const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULT_CONFIG = {
    host: '127.0.0.1',
    port: 5432,
    database: 'TiendaKary',
    user: 'postgres',
    password: '',
    ssl: false
};

function getConfigFilePath() {
    if (app && app.isPackaged) {
        return path.join(app.getPath('userData'), 'config.json');
    }
    const localPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(localPath)) return localPath;
    const userDataDir = app ? app.getPath('userData') : path.join(process.cwd(), 'data');
    return path.join(userDataDir, 'config.json');
}

function obtenerConfigServidor() {
    const filePath = getConfigFilePath();
    try {
        if (app && app.isPackaged && !fs.existsSync(filePath)) {
            const bundledPath = path.join(app.getAppPath(), 'config.json');
            if (fs.existsSync(bundledPath)) {
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.copyFileSync(bundledPath, filePath);
            }
        }
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const parsed = JSON.parse(raw);
            return {
                host: String(parsed.host || DEFAULT_CONFIG.host).trim(),
                port: Number(parsed.port) || DEFAULT_CONFIG.port,
                database: String(parsed.database || DEFAULT_CONFIG.database).trim(),
                user: String(parsed.user || DEFAULT_CONFIG.user).trim(),
                password: String(parsed.password ?? DEFAULT_CONFIG.password),
                ssl: Boolean(parsed.ssl)
            };
        }
    } catch (err) {
        console.error('[serverConfigService] Error al leer config.json:', err.message);
    }
    return { ...DEFAULT_CONFIG };
}

function guardarConfigServidor(nuevaConfig = {}) {
    const filePath = getConfigFilePath();
    const configActual = obtenerConfigServidor();

    const merged = {
        host: String(nuevaConfig.host ?? configActual.host).trim(),
        port: Number(nuevaConfig.port) || configActual.port,
        database: String(nuevaConfig.database ?? configActual.database).trim(),
        user: String(nuevaConfig.user ?? configActual.user).trim(),
        password: String(nuevaConfig.password ?? configActual.password),
        ssl: Boolean(nuevaConfig.ssl ?? configActual.ssl)
    };

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(merged, null, 4), 'utf-8');
    return merged;
}

module.exports = {
    DEFAULT_CONFIG,
    getConfigFilePath,
    obtenerConfigServidor,
    guardarConfigServidor
};

