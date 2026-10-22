const state = {
    token: localStorage.getItem('pos_mobile_token') || null,
    usuario: null,
    sucursales: [],
    sucursalActivaId: localStorage.getItem('pos_mobile_sucursal_id') || ''
};

const els = {
    dbIndicator: document.getElementById('db-indicator'),
    dbStatusText: document.getElementById('db-status-text'),
    infoDbName: document.getElementById('info-db-name'),
    infoPlantTime: document.getElementById('info-plant-time'),
    viewLogin: document.getElementById('view-login'),
    viewApp: document.getElementById('view-app'),
    formLogin: document.getElementById('form-login'),
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
    btnLogout: document.getElementById('btn-logout'),
    userDisplayName: document.getElementById('user-display-name'),
    userDisplayRole: document.getElementById('user-display-role'),
    selectSucursal: document.getElementById('select-sucursal')
};

async function apiFetch(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({ ok: false, error: 'Error de respuesta' }));
    return { status: res.status, data };
}

async function verificarSaludServidor() {
    try {
        const { data } = await apiFetch('/api/health');
        if (data.ok) {
            els.dbIndicator.className = 'brand-dot online';
            els.dbStatusText.textContent = `PostgreSQL conectado (${data.dbHost})`;
            els.infoDbName.textContent = `${data.database} @ ${data.dbHost}`;
            els.infoPlantTime.textContent = data.horaPlanta || '-';
        } else {
            els.dbIndicator.className = 'brand-dot offline';
            els.dbStatusText.textContent = `Sin conexión DB: ${data.error || 'Error'}`;
        }
    } catch (_) {
        els.dbIndicator.className = 'brand-dot offline';
        els.dbStatusText.textContent = 'Servidor web sin conexión';
    }
}

function renderSucursales() {
    els.selectSucursal.innerHTML = '';
    if (state.sucursales.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Sin sucursales registradas';
        els.selectSucursal.appendChild(opt);
        return;
    }

    const preferida = state.sucursales.find(s => s.id === state.sucursalActivaId)
        || state.sucursales.find(s => Number(s.activa) === 1)
        || state.sucursales[0];

    state.sucursalActivaId = preferida.id;
    localStorage.setItem('pos_mobile_sucursal_id', state.sucursalActivaId);

    for (const suc of state.sucursales) {
        const opt = document.createElement('option');
        opt.value = suc.id;
        opt.textContent = suc.nombre;
        if (suc.id === state.sucursalActivaId) opt.selected = true;
        els.selectSucursal.appendChild(opt);
    }
}

async function restaurarSesion() {
    const { status, data } = await apiFetch('/api/auth/session');
    if (status === 200 && data.ok) {
        state.usuario = data.usuario;
        state.sucursales = data.sucursales || [];
        els.userDisplayName.textContent = state.usuario.username;
        els.userDisplayRole.textContent = state.usuario.rol;
        els.infoPlantTime.textContent = data.horaPlanta || '-';
        renderSucursales();
        els.viewLogin.classList.add('hidden');
        els.viewApp.classList.remove('hidden');
        els.btnLogout.classList.remove('hidden');
    } else {
        els.viewApp.classList.add('hidden');
        els.btnLogout.classList.add('hidden');
        els.viewLogin.classList.remove('hidden');
    }
}

els.formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.loginError.classList.add('hidden');
    const username = els.loginUsername.value.trim();
    const password = els.loginPassword.value;

    const { status, data } = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });

    if (status === 200 && data.ok) {
        state.token = data.token;
        localStorage.setItem('pos_mobile_token', data.token);
        els.loginPassword.value = '';
        await restaurarSesion();
    } else {
        els.loginError.textContent = data.error || 'No se pudo iniciar sesión.';
        els.loginError.classList.remove('hidden');
    }
});

els.btnLogout.addEventListener('click', async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    state.token = null;
    state.usuario = null;
    localStorage.removeItem('pos_mobile_token');
    await restaurarSesion();
});

els.selectSucursal.addEventListener('change', (e) => {
    state.sucursalActivaId = e.target.value;
    localStorage.setItem('pos_mobile_sucursal_id', state.sucursalActivaId);
});

verificarSaludServidor();
restaurarSesion();
setInterval(verificarSaludServidor, 15000);

