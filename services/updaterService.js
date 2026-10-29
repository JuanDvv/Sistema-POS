const { app, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const http = require('http');

const UPDATE_SERVER_HOST = '100.100.163.62';
const UPDATE_SERVER_PORT = 8088;
const UPDATE_URL = `http://${UPDATE_SERVER_HOST}:${UPDATE_SERVER_PORT}`;

let estadoActualizacion = {
    disponible: false,
    descargada: false,
    version: null,
    progreso: 0,
    error: null,
    plataforma: process.platform
};

let listenersNotificacion = [];
let intervaloSondeo = null;

function notificarCambioEstado() {
    for (const listener of listenersNotificacion) {
        try {
            listener({ ...estadoActualizacion });
        } catch {
            // Ignorar errores de notificación si la ventana ya cerró
        }
    }
}

function registrarListenerEstado(callback) {
    if (typeof callback === 'function') {
        listenersNotificacion.push(callback);
        callback({ ...estadoActualizacion });
    }
}

function esVersionMayor(versionRemota, versionActual) {
    const vRemota = String(versionRemota).trim().replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const vActual = String(versionActual).trim().replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const len = Math.max(vRemota.length, vActual.length);

    for (let i = 0; i < len; i++) {
        const r = vRemota[i] || 0;
        const a = vActual[i] || 0;
        if (r > a) return true;
        if (r < a) return false;
    }
    return false;
}

function verificarMacEnServidor() {
    return new Promise((resolve) => {
        const req = http.get(`${UPDATE_URL}/latest-mac.yml`, { timeout: 5000 }, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                return resolve(null);
            }

            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                const matchVersion = data.match(/version:\s*['"]?([^'"\r\n]+)['"]?/);
                const matchPath = data.match(/path:\s*['"]?([^'"\r\n]+)['"]?/);

                if (matchVersion && matchVersion[1]) {
                    const versionRemota = matchVersion[1].trim();
                    const pathRelativo = matchPath ? matchPath[1].trim() : `POSDelipostresTurbaco-${versionRemota}-arm64.dmg`;
                    resolve({ version: versionRemota, path: pathRelativo });
                } else {
                    resolve(null);
                }
            });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => {
            req.destroy();
            resolve(null);
        });
    });
}

async function verificarActualizaciones() {
    if (process.platform === 'darwin') {
        try {
            const infoRemota = await verificarMacEnServidor();
            if (infoRemota && esVersionMayor(infoRemota.version, app.getVersion())) {
                estadoActualizacion = {
                    disponible: true,
                    descargada: true, // En Mac no firmado el instalador se descarga directamente
                    version: infoRemota.version,
                    urlDmg: `${UPDATE_URL}/${infoRemota.path}`,
                    progreso: 100,
                    error: null,
                    plataforma: 'darwin'
                };
            } else {
                estadoActualizacion.disponible = false;
                estadoActualizacion.error = null;
            }
        } catch (err) {
            estadoActualizacion.error = err.message;
        }
        notificarCambioEstado();
        return estadoActualizacion;
    }

    // Windows (electron-updater estándar con NSIS diferencial)
    try {
        await autoUpdater.checkForUpdates();
    } catch (err) {
        estadoActualizacion.error = err.message;
        notificarCambioEstado();
    }
    return estadoActualizacion;
}

function configurarAutoUpdaterWindows() {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;

    autoUpdater.on('update-available', (info) => {
        estadoActualizacion.disponible = true;
        estadoActualizacion.version = info.version;
        estadoActualizacion.error = null;
        notificarCambioEstado();
    });

    autoUpdater.on('update-not-available', () => {
        estadoActualizacion.disponible = false;
        estadoActualizacion.error = null;
        notificarCambioEstado();
    });

    autoUpdater.on('download-progress', (progressObj) => {
        estadoActualizacion.progreso = Math.round(progressObj.percent || 0);
        notificarCambioEstado();
    });

    autoUpdater.on('update-downloaded', (info) => {
        estadoActualizacion.disponible = true;
        estadoActualizacion.descargada = true;
        estadoActualizacion.version = info.version;
        estadoActualizacion.progreso = 100;
        estadoActualizacion.error = null;
        notificarCambioEstado();
    });

    autoUpdater.on('error', (err) => {
        estadoActualizacion.error = err ? err.message : 'Error desconocido al actualizar';
        notificarCambioEstado();
    });
}

function iniciarServicioActualizaciones() {
    if (process.platform === 'win32') {
        configurarAutoUpdaterWindows();
    }

    // Sondeo inicial a los 10 segundos del arranque
    setTimeout(() => {
        verificarActualizaciones().catch(() => {});
    }, 10000);

    // Sondeo recurrente cada 15 minutos (900,000 ms)
    intervaloSondeo = setInterval(() => {
        verificarActualizaciones().catch(() => {});
    }, 15 * 60 * 1000);
}

function aplicarActualizacion() {
    if (process.platform === 'darwin') {
        if (estadoActualizacion.urlDmg) {
            shell.openExternal(estadoActualizacion.urlDmg);
        }
        return { success: true, plataforma: 'darwin' };
    }

    if (estadoActualizacion.descargada) {
        // Ejecución silenciosa y reinicio inmediato
        setImmediate(() => {
            autoUpdater.quitAndInstall(true, true);
        });
        return { success: true, plataforma: 'win32' };
    }

    return { success: false, message: 'La actualización aún no se ha descargado completamente.' };
}

function detenerServicioActualizaciones() {
    if (intervaloSondeo) {
        clearInterval(intervaloSondeo);
        intervaloSondeo = null;
    }
}

module.exports = {
    iniciarServicioActualizaciones,
    detenerServicioActualizaciones,
    verificarActualizaciones,
    aplicarActualizacion,
    registrarListenerEstado,
    obtenerEstadoActualizacion: () => ({ ...estadoActualizacion })
};

