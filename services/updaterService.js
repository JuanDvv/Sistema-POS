const { app, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const UPDATE_SERVER_HOST = '100.100.163.62';
const UPDATE_SERVER_PORT = 8088;
const UPDATE_URL = `http://${UPDATE_SERVER_HOST}:${UPDATE_SERVER_PORT}`;

let estadoActualizacion = {
    disponible: false,
    descargada: false,
    version: null,
    progreso: 0,
    error: null,
    plataforma: process.platform,
    rutaDmgLocal: null
};

let listenersNotificacion = [];
let intervaloSondeo = null;
let descargaEnCursoMac = false;

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
                const matchDmg = data.match(/url:\s*['"]?([^'"\r\n]+\.dmg)['"]?/i) ||
                                 data.match(/path:\s*['"]?([^'"\r\n]+\.dmg)['"]?/i);

                if (matchVersion && matchVersion[1]) {
                    const versionRemota = matchVersion[1].trim();
                    const pathRelativo = (matchDmg && matchDmg[1])
                        ? matchDmg[1].trim()
                        : `POSDelipostresTurbaco-${versionRemota}-arm64.dmg`;
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

function descargarDmgMac(infoRemota) {
    if (descargaEnCursoMac) return;
    descargaEnCursoMac = true;

    const downloadsDir = app.getPath('downloads');
    const rutaFinal = path.join(downloadsDir, infoRemota.path);
    const rutaTmp = `${rutaFinal}.tmp`;

    estadoActualizacion = {
        disponible: true,
        descargada: false,
        version: infoRemota.version,
        progreso: 0,
        error: null,
        plataforma: 'darwin',
        rutaDmgLocal: null
    };
    notificarCambioEstado();

    const fileStream = fs.createWriteStream(rutaTmp);
    const req = http.get(`${UPDATE_URL}/${infoRemota.path}`, (res) => {
        if (res.statusCode !== 200) {
            fileStream.close();
            fs.unlink(rutaTmp, () => { });
            descargaEnCursoMac = false;
            estadoActualizacion.error = `Error HTTP ${res.statusCode} al descargar actualización.`;
            notificarCambioEstado();
            return;
        }

        const totalBytes = parseInt(res.headers['content-length'], 10) || 0;
        let bytesRecibidos = 0;

        res.on('data', (chunk) => {
            bytesRecibidos += chunk.length;
            if (totalBytes > 0) {
                const nuevoProgreso = Math.min(99, Math.round((bytesRecibidos / totalBytes) * 100));
                if (nuevoProgreso !== estadoActualizacion.progreso) {
                    estadoActualizacion.progreso = nuevoProgreso;
                    notificarCambioEstado();
                }
            }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
            fileStream.close(() => {
                fs.rename(rutaTmp, rutaFinal, (errRename) => {
                    if (errRename) {
                        descargaEnCursoMac = false;
                        estadoActualizacion.error = errRename.message;
                        notificarCambioEstado();
                        return;
                    }

                    execFile('xattr', ['-cr', rutaFinal], () => {
                        descargaEnCursoMac = false;
                        estadoActualizacion.descargada = true;
                        estadoActualizacion.progreso = 100;
                        estadoActualizacion.rutaDmgLocal = rutaFinal;
                        notificarCambioEstado();
                    });
                });
            });
        });
    });

    req.on('error', (err) => {
        fileStream.close();
        fs.unlink(rutaTmp, () => { });
        descargaEnCursoMac = false;
        estadoActualizacion.error = err.message;
        notificarCambioEstado();
    });
}

async function verificarActualizaciones() {
    if (process.platform === 'darwin') {
        try {
            const infoRemota = await verificarMacEnServidor();
            if (infoRemota && esVersionMayor(infoRemota.version, app.getVersion())) {
                const downloadsDir = app.getPath('downloads');
                const rutaFinal = path.join(downloadsDir, infoRemota.path);

                if (estadoActualizacion.version === infoRemota.version && estadoActualizacion.descargada && fs.existsSync(rutaFinal)) {
                    estadoActualizacion.rutaDmgLocal = rutaFinal;
                } else if (!descargaEnCursoMac) {
                    descargarDmgMac(infoRemota);
                }
            } else {
                estadoActualizacion.disponible = false;
                estadoActualizacion.error = null;
                notificarCambioEstado();
            }
        } catch (err) {
            estadoActualizacion.error = err.message;
            notificarCambioEstado();
        }
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
        verificarActualizaciones().catch(() => { });
    }, 10000);

    // Sondeo recurrente cada 15 minutos (900,000 ms)
    intervaloSondeo = setInterval(() => {
        verificarActualizaciones().catch(() => { });
    }, 15 * 60 * 1000);
}

function aplicarActualizacion() {
    if (process.platform === 'darwin') {
        if (estadoActualizacion.descargada && estadoActualizacion.rutaDmgLocal && fs.existsSync(estadoActualizacion.rutaDmgLocal)) {
            execFile('xattr', ['-cr', estadoActualizacion.rutaDmgLocal], () => {
                shell.openPath(estadoActualizacion.rutaDmgLocal);
            });
            return { success: true, plataforma: 'darwin' };
        }
        if (descargaEnCursoMac) {
            return { success: false, message: 'La descarga de la actualización aún está en progreso.' };
        }
        return { success: false, message: 'La actualización aún no se ha descargado completamente.' };
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

