const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const pkg = require('../package.json');

const SERVER_USER = 'adminj';
const SERVER_HOST = '100.100.163.62';
const SERVER_DEST = '/home/adminj/pos-updates/';
const isMac = process.argv.includes('--mac');

const distDir = path.join(__dirname, '..', 'dist');
const filesToUpload = [];

if (isMac) {
    filesToUpload.push(
        path.join(distDir, 'latest-mac.yml'),
        path.join(distDir, `POSDelipostresTurbaco-${pkg.version}-arm64.dmg`),
        path.join(distDir, `POSDelipostresTurbaco-${pkg.version}-arm64-mac.zip`)
    );
} else {
    filesToUpload.push(
        path.join(distDir, 'latest.yml'),
        path.join(distDir, `POSDelipostresTurbaco Setup ${pkg.version}.exe`),
        path.join(distDir, `POSDelipostresTurbaco Setup ${pkg.version}.exe.blockmap`)
    );
}

// 1. Validar que los artefactos existan antes de transferir
for (const file of filesToUpload) {
    if (!fs.existsSync(file)) {
        console.error(`\x1b[31m[Error] Archivo no encontrado:\x1b[0m ${path.basename(file)}`);
        console.error('Asegúrate de compilar primero ("npm run build" o "npm run build:mac").');
        process.exit(1);
    }
}

console.log(`\n\x1b[36m🚀 Subiendo versión v${pkg.version} (${isMac ? 'macOS arm64' : 'Windows'}) a ${SERVER_USER}@${SERVER_HOST}:${SERVER_DEST}...\x1b[0m\n`);

// 2. Transferencia de los nuevos artefactos mediante SCP
const scpArgs = [...filesToUpload, `${SERVER_USER}@${SERVER_HOST}:${SERVER_DEST}`];
const res = spawnSync('scp', scpArgs, { stdio: 'inherit' });

if (res.status !== 0) {
    console.error(`\n\x1b[31m✖ Falló la transferencia SCP (código de salida: ${res.status})\x1b[0m\n`);
    process.exit(res.status || 1);
}

console.log(`\n\x1b[32m✔ Subida de v${pkg.version} completada.\x1b[0m`);

// 3. Limpieza remota en Ubuntu: Eliminar instaladores antiguos para no saturar disco
console.log('\x1b[33m🧹 Limpiando instaladores de versiones anteriores en el servidor Ubuntu...\x1b[0m');

const purgeCommand = isMac
    ? `find ${SERVER_DEST} -maxdepth 1 -type f \\( -name "*.dmg" -o -name "*.zip" \\) ! -name "*${pkg.version}*" -delete`
    : `find ${SERVER_DEST} -maxdepth 1 -type f \\( -name "*.exe" -o -name "*.blockmap" \\) ! -name "*${pkg.version}*" -delete`;

const cleanRes = spawnSync('ssh', [`${SERVER_USER}@${SERVER_HOST}`, purgeCommand], { stdio: 'inherit' });

if (cleanRes.status === 0) {
    console.log(`\x1b[32m✔ Servidor limpio: únicamente se conserva la versión activa v${pkg.version}.\x1b[0m\n`);
} else {
    console.warn('\x1b[33m[Aviso] No se pudo ejecutar la purga remota por SSH (la subida sí fue exitosa).\x1b[0m\n');
}
