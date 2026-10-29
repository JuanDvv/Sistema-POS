const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

if (fs.existsSync(distDir)) {
    try {
        fs.rmSync(distDir, { recursive: true, force: true });
        console.log('\x1b[33m🧹 Carpeta dist limpiada exitosamente.\x1b[0m');
    } catch (err) {
        console.warn(`[Advertencia] No se pudo limpiar dist por completo: ${err.message}`);
    }
}

