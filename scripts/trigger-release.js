const { execSync } = require('child_process');
const pkg = require('../package.json');

const tag = `v${pkg.version}`;
console.log(`\n🚀 Preparando release multiplataforma v${pkg.version}...`);

try {
    execSync(`git tag ${tag}`, { stdio: 'ignore' });
} catch (e) {
    // Si el tag ya existe localmente, se reutiliza
}

try {
    console.log(`Enviando commits y tag ${tag} a GitHub...`);
    execSync('git push origin', { stdio: 'inherit' });
    execSync(`git push origin ${tag}`, { stdio: 'inherit' });
    console.log(`\n✔ Tag ${tag} publicado con éxito.`);
    console.log('GitHub Actions ha comenzado a compilar y desplegar Windows y macOS en paralelo.\n');
} catch (err) {
    console.error('\n✖ Error al enviar los cambios a GitHub. Revisa tu conexión y estado de git.\n');
    process.exit(1);
}

