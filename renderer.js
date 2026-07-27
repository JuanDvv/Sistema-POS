document.getElementById('btn-toggle-password').addEventListener('click', () => {
    const passwordInput = document.getElementById('password');
    const btnToggle = document.getElementById('btn-toggle-password');
    const isHidden = passwordInput.type === 'password';

    passwordInput.type = isHidden ? 'text' : 'password';
    btnToggle.innerText = isHidden ? '🙈' : '👁️';
    btnToggle.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-msg');

    // Limpiamos mensajes anteriores
    errorDiv.innerText = '';

    if (!user || !pass) {
        errorDiv.innerText = 'Por favor, introduce usuario y contraseña.';
        return;
    }

    // Enviamos los datos de forma segura al Proceso Principal
    const response = await window.api.login({ username: user, password: pass });

    if (response.success) {
        // Guardamos temporalmente el rol y usuario en el almacenamiento del navegador de Electron
        localStorage.setItem('currentUser', response.username);
        localStorage.setItem('currentRole', response.role);

        // Marca para que sidebar.js dispare una sincronización inmediata al cargar ventas.html,
        // en vez de esperar al primer intervalo automático (hasta 5 min para Administrador). Sin
        // esto, un cajero que inicia sesión en una app que llevaba rato abierta podía empezar a
        // vender con inventario desactualizado respecto a lo que otras terminales ya sincronizaron.
        localStorage.setItem('syncAlEntrarPendiente', '1');

        // Redireccionamos al panel principal (Ventas)
        window.location.href = 'ventas.html';
    } else {
        errorDiv.innerText = response.message;
    }
});