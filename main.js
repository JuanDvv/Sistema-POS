const { app, BrowserWindow, protocol, screen } = require('electron');
const path = require('path');

const { db } = require('./db/connection');
const { initDB } = require('./db/schema');
const { imagenesAppDir } = require('./services/imagenService');
const { procesarSincronizacion } = require('./sync/syncService');

const { registerVentasIpc } = require('./ipc/registerVentasIpc');
const { registerProductosIpc } = require('./ipc/registerProductosIpc');
const { registerGastosIpc } = require('./ipc/registerGastosIpc');
const { registerTransferenciasIpc } = require('./ipc/registerTransferenciasIpc');
const { registerSucursalesIpc } = require('./ipc/registerSucursalesIpc');
const { registerUsuariosIpc } = require('./ipc/registerUsuariosIpc');
const { registerClientesIpc } = require('./ipc/registerClientesIpc');
const { registerReportesIpc } = require('./ipc/registerReportesIpc');
const { registerSistemaIpc } = require('./ipc/registerSistemaIpc');
const { registerAuditoriaIpc } = require('./ipc/registerAuditoriaIpc');
const { registerImpresionIpc } = require('./ipc/registerImpresionIpc');

// main.js es exclusivamente el "composition root": ciclo de vida de la app/ventanas y el cableado
// de los módulos de dominio (db, servicios, sincronización, handlers IPC). La lógica de negocio y
// de sincronización vive en services/ y sync/; los canales IPC están agrupados por dominio en ipc/.

function createWindow() {
    const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
    const minWidth = Math.round(screenWidth * 0.5);

    const win = new BrowserWindow({
        width: 1150,
        height: 800,
        minWidth: minWidth,
        minHeight: 600,
        icon: path.join(__dirname, 'build/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.webContents.session.clearCache().then(() => {
        win.loadFile('index.html');
    });
}

function registerAllIpcHandlers() {
    registerVentasIpc();
    registerProductosIpc();
    registerGastosIpc();
    registerTransferenciasIpc();
    registerSucursalesIpc();
    registerUsuariosIpc();
    registerClientesIpc();
    registerReportesIpc();
    registerSistemaIpc();
    registerAuditoriaIpc();
    registerImpresionIpc();
}

app.whenReady().then(async () => {
    initDB(db);
    registerAllIpcHandlers();

    // Registrar protocolo seguro local app-image mapeado a imagenesAppDir
    protocol.registerFileProtocol('app-image', (request, callback) => {
        const url = request.url.replace('app-image://', '');
        const filePath = path.join(imagenesAppDir, decodeURIComponent(url));
        callback({ path: filePath });
    });

    createWindow();

    // Sincronización inicial a los 2 segundos de iniciar la app (catch-up antes de login,
    // ej. para tener credenciales de usuarios actualizadas sin conexión). El polling periódico
    // por rol (Operador/Administrador) y los eventos críticos los dispara sidebar.js/IPC vía
    // solicitarSincronizacion(), evitando un segundo intervalo redundante aquí.
    setTimeout(() => {
        procesarSincronizacion().catch(err => console.error('[Sincronizador] Sincronización inicial falló:', err.message));
    }, 2000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        db.close();
        app.quit();
    }
});
