const { execSync } = require('child_process');
const pkg = require('../package.json');

const isMac = process.argv.includes('--mac');
const isWin = process.argv.includes('--win');

let suffix = '';
let targetDesc = 'multiplataforma (Windows y macOS)';
if (isMac && !isWin) {
    suffix = '-mac';
    targetDesc = 'solo macOS';
} else if (isWin && !isMac) {
    suffix = '-win';
    targetDesc = 'solo Windows';
}

const tag = `v${pkg.version}${suffix}`;
console.log(`\n🚀 Preparando release ${targetDesc} [${tag}]...`);

try {
    execSync(`git tag -f -a ${tag} -m "Release ${tag}"`, { stdio: 'ignore' });
} catch (e) {
    // Si falla crear tag anotado, intentar tag ligero
    try { execSync(`git tag -f ${tag}`, { stdio: 'ignore' }); } catch (_) {}
}

try {
    console.log(`Enviando commits y tag ${tag} a GitHub...`);
    execSync('git push origin', { stdio: 'inherit' });
    execSync(`git push origin -f ${tag}`, { stdio: 'inherit' });
    console.log(`\n✔ Tag ${tag} publicado con éxito.`);
    console.log(`GitHub Actions ha comenzado a compilar y desplegar ${targetDesc}.\n`);
} catch (err) {
    console.error('\n✖ Error al enviar los cambios a GitHub. Revisa tu conexión y estado de git.\n');
    process.exit(1);
}

