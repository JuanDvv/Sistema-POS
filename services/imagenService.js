const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// SRP: manejo del almacenamiento local de fotos de productos.

const imagenesAppDir = path.join(app.getPath('userData'), 'imagenes_productos');
if (!fs.existsSync(imagenesAppDir)) {
    fs.mkdirSync(imagenesAppDir, { recursive: true });
}

function processLocalProductImage(productId, fotoPath) {
    if (!fotoPath) return null;
    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) {
        return fotoPath;
    }

    let cleanPath = fotoPath;
    if (fotoPath.startsWith('file:///')) {
        cleanPath = fotoPath.replace('file:///', '');
    } else if (fotoPath.startsWith('file://')) {
        cleanPath = fotoPath.replace('file://', '');
    }

    cleanPath = decodeURIComponent(cleanPath);

    try {
        if (fs.existsSync(cleanPath)) {
            const ext = path.extname(cleanPath) || '.png';
            const destFilename = `${productId}${ext}`;
            const destPath = path.join(imagenesAppDir, destFilename);
            fs.copyFileSync(cleanPath, destPath);
            return destFilename;
        }
    } catch (err) {
        console.error("Error al copiar imagen local:", err);
    }
    return fotoPath;
}

module.exports = { imagenesAppDir, processLocalProductImage };
