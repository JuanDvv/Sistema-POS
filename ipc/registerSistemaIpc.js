const { ipcMain, BrowserWindow, screen } = require('electron');
const path = require('path');
const { runQuery } = require('../db/connection');
const { procesarSincronizacion, isSincronizando, hayConexionConocida } = require('../sync/syncService');
const { obtenerConfigServidor, guardarConfigServidor } = require('../services/serverConfigService');
const { testConnection, resetPool } = require('../sync/remoteDbClient');

// SRP: utilidades transversales de la app (ventanas secundarias, foco, sincronización manual).

function registerSistemaIpc() {
    let ventanasVentas = [];
    let ventanasAbiertas = [];

    // Abrir nueva ventana independiente (con su propia sesión/pantalla de login)
    ipcMain.handle('abrir-nueva-ventana', async (event) => {
        const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
        const minWidth = Math.round(screenWidth * 0.5);

        const win = new BrowserWindow({
            width: 1150,
            height: 800,
            minWidth: minWidth,
            minHeight: 600,
            icon: path.join(__dirname, '..', 'build/icon.png'),
            autoHideMenuBar: true,
            webPreferences: {
                preload: path.join(__dirname, '..', 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false
            }
        });

        win.webContents.session.clearCache().then(() => {
            win.loadFile('index.html');
        });

        ventanasAbiertas.push(win);
        win.on('closed', () => {
            ventanasAbiertas = ventanasAbiertas.filter(w => w !== win);
        });

        return { success: true };
    });

    // Abrir ventana de ventas secundaria
    ipcMain.handle('abrir-ventana-ventas', async (event, sessionData) => {
        if (ventanasVentas.length >= 3) {
            return { success: false, message: 'Límite de 3 ventanas secundarias de ventas alcanzado.' };
        }

        const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
        const minWidth = Math.round(screenWidth * 0.5);

        const win = new BrowserWindow({
            width: 1100,
            height: 750,
            minWidth: minWidth,
            minHeight: 600,
            icon: path.join(__dirname, '..', 'build/icon.png'),
            webPreferences: {
                preload: path.join(__dirname, '..', 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false
            }
        });

        const query = { nueva_ventana: 'true' };
        if (sessionData?.currentUser) query.usuario = sessionData.currentUser;
        if (sessionData?.currentRole) query.rol = sessionData.currentRole;

        win.loadFile('ventas.html', { query });
        ventanasVentas.push(win);

        win.on('closed', () => {
            ventanasVentas = ventanasVentas.filter(w => w !== win);
        });

        return { success: true };
    });

    // Forzar re-enfoque de la ventana para corregir bug de entrada de texto en Electron
    ipcMain.handle('force-refocus', async (event) => {
        try {
            const win = BrowserWindow.fromWebContents(event.sender);
            if (win) {
                if (win.isMinimized()) {
                    win.restore();
                }
                // Evitamos win.blur() ya que en Windows puede causar que la ventana se minimice o se envíe al fondo
                win.focus();
            }
            return { success: true };
        } catch (err) {
            return { success: false };
        }
    });

    // Consultar si hay una sincronización en curso (ej. al montar el sidebar)
    ipcMain.handle('is-sincronizando', async () => {
        return isSincronizando();
    });

    // Consultar el último estado de conexión conocido (ej. al montar el sidebar o abrir una
    // ventana secundaria a mitad de un período sin conexión, para que el banner amigable
    // aparezca de inmediato en vez de esperar al próximo cambio de estado).
    ipcMain.handle('obtener-estado-conexion', async () => {
        return hayConexionConocida();
    });

    // Forzar Sincronización Manualmente
    ipcMain.handle('forzar-sincronizacion', async () => {
        if (isSincronizando()) {
            return { success: false, message: 'La sincronización ya está en curso.' };
        }
        try {
            await procesarSincronizacion();
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message, sinConexion: err.sinConexion === true };
        }
    });

    ipcMain.handle('obtener-config-servidor', async () => {
        try {
            const config = obtenerConfigServidor();
            return { success: true, data: config };
        } catch (err) {
            return { success: false, message: err.message };
        }
    });

    ipcMain.handle('guardar-config-servidor', async (event, nuevaConfig) => {
        try {
            const guardada = guardarConfigServidor(nuevaConfig);
            resetPool();
            return { success: true, data: guardada };
        } catch (err) {
            return { success: false, message: err.message };
        }
    });

    ipcMain.handle('probar-conexion-servidor', async (event, configAProbar) => {
        try {
            if (configAProbar) {
                guardarConfigServidor(configAProbar);
                resetPool();
            }
            const ok = await testConnection();
            return { success: ok, conectado: ok };
        } catch (err) {
            return { success: false, conectado: false, message: err.message };
        }
    });

    ipcMain.handle('marcar-datos-locales-pendientes', async () => {
        const tablas = [
            'config_sucursal',
            'usuarios',
            'categorias',
            'productos',
            'clientes',
            'ventas',
            'gastos',
            'abonos_credito',
            'pedidos',
            'abonos_pedido',
            'cierres_caja',
            'solicitudes_venta',
            'solicitudes_gasto',
            'movimientos_inventario',
            'movimientos_reserva_inventario',
            'cola_auditoria'
        ];
        const resultados = {};
        for (const tabla of tablas) {
            try {
                const res = await runQuery(`UPDATE ${tabla} SET sync_status = 'pending' WHERE sync_status <> 'pending' OR sync_status IS NULL`);
                resultados[tabla] = res?.changes || 0;
            } catch (e) {
                resultados[tabla] = e.message;
            }
        }
        return { success: true, cambios: resultados };
    });
}

module.exports = { registerSistemaIpc };
