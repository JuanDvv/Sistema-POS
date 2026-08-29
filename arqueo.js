// Corregir bug de pérdida de foco en Electron al cerrar diálogos nativos en Windows
const originalAlert = window.alert;
window.alert = (msg) => {
    const result = originalAlert(msg);
    if (window.api?.forceRefocus) {
        window.api.forceRefocus();
    }
    setTimeout(() => {
        window.focus();
    }, 20);
    return result;
};
const originalConfirm = window.confirm;
window.confirm = (msg) => {
    const r = originalConfirm(msg);
    if (window.api?.forceRefocus) {
        window.api.forceRefocus();
    }
    setTimeout(() => {
        window.focus();
    }, 20);
    return r;
};

let sucursalId = '';
let efectivoEsperado = 0;
let fondoBase = 300000;
const STORAGE_KEY = 'arqueo-caja-inputs';
const SPLIT_STORAGE_KEY = 'arqueo-caja-split-width';

const BASE_CAJA_SUCURSAL = 300000; // Fallback local si obtenerVentanaCajaActual falla.
const formatCOP = (val) => `$${Math.round(val).toLocaleString('es-CO')}`;

function obtenerFechaHoyStr() {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function guardarValoresCuadre(inputs = document.querySelectorAll('.denom-input')) {
    const valores = {};
    inputs.forEach(input => {
        valores[input.getAttribute('data-value')] = input.value;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valores));
}

function restaurarValoresCuadre(inputs = document.querySelectorAll('.denom-input')) {
    try {
        const guardado = localStorage.getItem(STORAGE_KEY);
        if (!guardado) return false;

        const valores = JSON.parse(guardado);
        inputs.forEach(input => {
            const key = input.getAttribute('data-value');
            if (valores[key] !== undefined) {
                input.value = valores[key];
            }
        });
        return true;
    } catch (error) {
        console.error('No se pudieron restaurar los valores del cuadre:', error);
        return false;
    }
}

function inicializarSplitter() {
    const splitter = document.getElementById('panel-splitter');
    const leftPanel = document.querySelector('.cash-grid-section');
    if (!splitter || !leftPanel) return;

    const MIN_WIDTH = 260;

    // El ancho guardado se hizo con la ventana en otro tamaño (posiblemente mucho más ancha). Si
    // se aplica tal cual en una ventana angosta, junto con flex-shrink:0 dejaba el panel derecho
    // (Resultados del Cuadre, cierre, historial) empujado fuera del área visible y sin forma de
    // hacer scroll horizontal para llegar a él. Se reajusta al tamaño actual en cada carga/resize.
    const aplicarAnchoGuardado = () => {
        const anchoGuardado = parseInt(localStorage.getItem(SPLIT_STORAGE_KEY), 10);
        if (isNaN(anchoGuardado)) return;
        const mainContent = leftPanel.parentElement;
        const maxWidth = mainContent.getBoundingClientRect().width * 0.65;
        if (maxWidth <= 0) return;
        leftPanel.style.flexBasis = `${Math.min(Math.max(anchoGuardado, MIN_WIDTH), maxWidth)}px`;
    };
    aplicarAnchoGuardado();
    window.addEventListener('resize', aplicarAnchoGuardado);

    let arrastrando = false;
    let startX = 0;
    let startWidth = 0;

    splitter.addEventListener('pointerdown', (e) => {
        arrastrando = true;
        startX = e.clientX;
        startWidth = leftPanel.getBoundingClientRect().width;
        splitter.classList.add('dragging');
        document.body.classList.add('splitter-dragging');
        splitter.setPointerCapture(e.pointerId);
    });

    splitter.addEventListener('pointermove', (e) => {
        if (!arrastrando) return;
        const mainContent = leftPanel.parentElement;
        const maxWidth = mainContent.getBoundingClientRect().width * 0.65;
        let nuevoAncho = startWidth + (e.clientX - startX);
        nuevoAncho = Math.min(Math.max(nuevoAncho, MIN_WIDTH), maxWidth);
        leftPanel.style.flexBasis = `${nuevoAncho}px`;
    });

    const finalizarArrastre = (e) => {
        if (!arrastrando) return;
        arrastrando = false;
        splitter.classList.remove('dragging');
        document.body.classList.remove('splitter-dragging');
        localStorage.setItem(SPLIT_STORAGE_KEY, Math.round(leftPanel.getBoundingClientRect().width));
    };

    splitter.addEventListener('pointerup', finalizarArrastre);
    splitter.addEventListener('pointercancel', finalizarArrastre);
}

function limpiarValoresCuadre(inputs = document.querySelectorAll('.denom-input')) {
    inputs.forEach(input => {
        input.value = 0;
        const row = input.closest('.denom-row');
        if (row) {
            row.querySelector('.denom-total').innerText = '$0';
        }
    });
    localStorage.removeItem(STORAGE_KEY);
    calcularTotales();
}

document.addEventListener('DOMContentLoaded', async () => {
    // 0. Restaurar/activar el splitter de ancho entre paneles
    inicializarSplitter();

    // 1. Obtener ID de la sucursal actual
    const resId = await window.api.obtenerSucursalId();
    if (resId.success) {
        sucursalId = resId.id;
    }

    // 2. Obtener la ventana de caja vigente (desde el último cierre de hoy, o desde el inicio del
    // día) y el efectivo esperado en esa ventana.
    await cargarVentanaCajaActual();

    // 3. Cargar el historial de cierres para esta sucursal (por defecto, hoy; el selector de
    // fecha permite llegar a cierres de días anteriores para recalcularlos/eliminarlos).
    const inputFechaHistorial = document.getElementById('input-fecha-historial-cierres');
    inputFechaHistorial.value = obtenerFechaHoyStr();
    inputFechaHistorial.addEventListener('change', () => cargarHistorialCierres(inputFechaHistorial.value));
    await cargarHistorialCierres(inputFechaHistorial.value);

    // 4. Configurar event listeners en los inputs de denominaciones
    const inputs = document.querySelectorAll('.denom-input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            guardarValoresCuadre(inputs);
            calcularTotales();
        });
        // Cuando recibe foco, seleccionar todo el texto (además de la regla global)
        input.addEventListener('focus', function() {
            this.select();
        });
    });

    // 5. Restaurar datos guardados y configurar botón resetear
    restaurarValoresCuadre(inputs);
    document.getElementById('btn-resetear').addEventListener('click', () => {
        limpiarValoresCuadre(inputs);
    });

    // 6. Confirmar cierre de caja
    document.getElementById('btn-confirmar-cierre').addEventListener('click', confirmarCierreCaja);

    // Calcular totales iniciales
    calcularTotales();
});

async function cargarVentanaCajaActual() {
    const response = await window.api.obtenerVentanaCajaActual({ sucursalId });

    if (response.success) {
        efectivoEsperado = response.efectivoEsperado;
        fondoBase = response.fondoBase;
        document.getElementById('val-esperado').innerText = formatCOP(efectivoEsperado);
        document.getElementById('val-base-caja').innerText = formatCOP(fondoBase);

        const desde = new Date(response.fechaDesde).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const hasta = new Date(response.fechaHasta).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('val-ventana').innerText = `${desde} - ${hasta}`;
    } else {
        console.error('Error al cargar la ventana de caja:', response.message);
        document.getElementById('val-esperado').innerText = '$0 (Error)';
    }

    calcularTotales();
}

// Bloquea/desbloquea el formulario de cuadre cuando ya existe un "Cierre de Día" registrado hoy:
// ese cierre es el corte final de la jornada, así que no debe quedar forma de registrar otro
// cierre encima (de ningún tipo) hasta el día siguiente. El backend valida lo mismo en
// registrarCierreCajaTx (defensa en profundidad); esto es solo la reflexión visual en la UI.
function aplicarBloqueoCierreDia(bloqueado) {
    document.querySelectorAll('.denom-input').forEach(input => { input.disabled = bloqueado; });
    document.getElementById('select-tipo-cierre').disabled = bloqueado;
    document.getElementById('input-nota-cierre').disabled = bloqueado;
    document.getElementById('btn-confirmar-cierre').disabled = bloqueado;
    document.getElementById('aviso-cierre-dia').style.display = bloqueado ? 'block' : 'none';
}

async function cargarHistorialCierres(fecha) {
    const response = await window.api.obtenerCierresCaja({ sucursalId, fecha });

    if (fecha === obtenerFechaHoyStr()) {
        const cierreDiaHecho = response.success && response.data.some(c => c.tipo === 'Cierre de Día');
        aplicarBloqueoCierreDia(cierreDiaHecho);
    }

    const tbody = document.getElementById('body-historial-cierres');
    const titulo = document.getElementById('titulo-historial-cierres');
    titulo.innerText = fecha === obtenerFechaHoyStr() ? 'Cierres de Hoy' : `Cierres del ${fecha}`;

    if (!response.success || response.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">Sin cierres registrados ese día.</td></tr>';
        return;
    }

    const esAdministrador = (sessionStorage.getItem('currentRole') || 'Sin Rol') === 'Administrador';

    tbody.innerHTML = response.data.map(c => {
        const hora = new Date(c.fecha_hasta).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        // Recalcular: reprocesa efectivo_esperado/diferencia contra ventas/abonos/gastos actuales
        // de la MISMA ventana ya congelada del cierre (ver recalcularCierreCajaTx) -- pensado para
        // cuando una venta con componente en efectivo se registra días después de haberse cerrado
        // esa caja (ver 'Ventas de días anteriores').
        const acciones = esAdministrador
            ? `<button class="btn-edit" data-cierre-id="${c.id}" data-accion="recalcular">Recalcular</button>
               <button class="btn-delete" data-cierre-id="${c.id}" data-accion="eliminar">Eliminar</button>`
            : '';
        return `
            <tr>
                <td>${hora}</td>
                <td>${c.usuario || '-'}</td>
                <td>${c.tipo}</td>
                <td class="num">${formatCOP(c.efectivo_esperado)}</td>
                <td class="num">${formatCOP(c.efectivo_contado)}</td>
                <td class="num">${formatCOP(c.diferencia)}</td>
                <td>${acciones}</td>
            </tr>
        `;
    }).join('');

    if (esAdministrador) {
        tbody.querySelectorAll('[data-accion="eliminar"]').forEach(btn => {
            btn.addEventListener('click', () => eliminarCierreCaja(btn.getAttribute('data-cierre-id')));
        });
        tbody.querySelectorAll('[data-accion="recalcular"]').forEach(btn => {
            btn.addEventListener('click', () => recalcularCierreCaja(btn.getAttribute('data-cierre-id')));
        });
    }
}

// Tras eliminar/recalcular un cierre, refresca el historial de la fecha que se esté viendo; la
// ventana de caja vigente ("hoy") solo se refresca si esa es la fecha seleccionada, para no
// recalcular el turno de hoy por una corrección hecha sobre un día anterior.
async function refrescarHistorialTrasEdicion() {
    const fechaSeleccionada = document.getElementById('input-fecha-historial-cierres').value;
    await cargarHistorialCierres(fechaSeleccionada);
    if (fechaSeleccionada === obtenerFechaHoyStr()) {
        await cargarVentanaCajaActual();
    }
}

async function eliminarCierreCaja(cierreId) {
    if (!confirm('¿Eliminar este cierre de caja? Esta acción no se puede deshacer.')) return;

    const auditoriaUsuario = sessionStorage.getItem('currentUser') || 'Invitado';
    const auditoriaRol = sessionStorage.getItem('currentRole') || 'Sin Rol';

    const response = await window.api.eliminarCierreCaja({ cierreId, auditoriaUsuario, auditoriaRol });
    if (response.success) {
        await refrescarHistorialTrasEdicion();
    } else {
        alert(response.message || 'No se pudo eliminar el cierre de caja.');
    }
}

async function recalcularCierreCaja(cierreId) {
    if (!confirm('¿Recalcular el efectivo esperado de este cierre contra las ventas, abonos y gastos actuales de su ventana? El efectivo contado (conteo físico) no cambia.')) return;

    const auditoriaUsuario = sessionStorage.getItem('currentUser') || 'Invitado';
    const auditoriaRol = sessionStorage.getItem('currentRole') || 'Sin Rol';

    const response = await window.api.recalcularCierreCaja({ cierreId, auditoriaUsuario, auditoriaRol });
    if (!response.success) {
        alert(response.message || 'No se pudo recalcular el cierre de caja.');
        return;
    }

    if (response.sinCambios) {
        alert(response.message);
        return;
    }

    alert(`Cierre recalculado.\nEsperado: ${formatCOP(response.efectivoEsperadoAnterior)} → ${formatCOP(response.efectivoEsperado)}\nDiferencia: ${formatCOP(response.diferenciaAnterior)} → ${formatCOP(response.diferencia)}`);
    await refrescarHistorialTrasEdicion();
}

async function confirmarCierreCaja() {
    const denominaciones = Array.from(document.querySelectorAll('.denom-input')).map(input => ({
        valor: parseInt(input.getAttribute('data-value')) || 0,
        cantidad: parseInt(input.value) || 0
    }));

    const tipo = document.getElementById('select-tipo-cierre').value;
    const nota = document.getElementById('input-nota-cierre').value.trim();
    const auditoriaUsuario = sessionStorage.getItem('currentUser') || 'Invitado';
    const auditoriaRol = sessionStorage.getItem('currentRole') || 'Sin Rol';

    const totalContado = denominaciones.reduce((sum, d) => sum + (d.valor * d.cantidad), 0);
    const base = fondoBase || BASE_CAJA_SUCURSAL;
    const diferencia = (totalContado - base) - efectivoEsperado;
    const diferenciaTexto = diferencia === 0
        ? 'Caja cuadrada (sin diferencia).'
        : diferencia < 0
            ? `Faltan ${formatCOP(Math.abs(diferencia))} en caja.`
            : `Sobran ${formatCOP(diferencia)} en caja.`;

    const advertenciaCierreDia = tipo === 'Cierre de Día'
        ? '\n\n⚠️ Este es el Cierre de Día: después de confirmarlo NO se podrán registrar más cierres de caja hasta mañana.'
        : '';

    const confirmado = confirm(
        `¿Confirmar el cierre de caja (${tipo})?\n\n` +
        `Efectivo contado: ${formatCOP(totalContado)}\n` +
        `Efectivo esperado: ${formatCOP(efectivoEsperado)}\n` +
        `${diferenciaTexto}` +
        advertenciaCierreDia +
        `\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    const btn = document.getElementById('btn-confirmar-cierre');
    btn.disabled = true;
    btn.innerText = 'Guardando...';

    try {
        const response = await window.api.registrarCierreCaja({
            sucursalId, tipo, nota, denominaciones, auditoriaUsuario, auditoriaRol
        });

        if (response.success) {
            limpiarValoresCuadre();
            document.getElementById('input-nota-cierre').value = '';
            await cargarVentanaCajaActual();
            const inputFechaHistorial = document.getElementById('input-fecha-historial-cierres');
            inputFechaHistorial.value = obtenerFechaHoyStr();
            await cargarHistorialCierres(inputFechaHistorial.value);
        } else {
            alert(response.message || 'No se pudo registrar el cierre de caja.');
            // Resincroniza el bloqueo con el backend: si el rechazo fue porque otra sesión ya
            // registró el Cierre de Día de hoy, esto refleja el candado en esta pantalla también.
            await cargarHistorialCierres(obtenerFechaHoyStr());
        }
    } finally {
        btn.innerText = 'Confirmar Cierre de Caja';
        btn.disabled = document.getElementById('aviso-cierre-dia').style.display === 'block';
    }
}

function calcularTotales() {
    let totalBilletes = 0;
    let totalMonedas = 0;

    // Calcular billetes
    const billetesInputs = document.querySelectorAll('#billetes-group .denom-input');
    billetesInputs.forEach(input => {
        const denom = parseInt(input.getAttribute('data-value')) || 0;
        const cant = parseInt(input.value) || 0;
        const total = denom * cant;
        totalBilletes += total;

        const row = input.closest('.denom-row');
        if (row) {
            row.querySelector('.denom-total').innerText = formatCOP(total);
        }
    });

    // Calcular monedas
    const monedasInputs = document.querySelectorAll('#monedas-group .denom-input');
    monedasInputs.forEach(input => {
        const denom = parseInt(input.getAttribute('data-value')) || 0;
        const cant = parseInt(input.value) || 0;
        const total = denom * cant;
        totalMonedas += total;

        const row = input.closest('.denom-row');
        if (row) {
            row.querySelector('.denom-total').innerText = formatCOP(total);
        }
    });

    const totalContado = totalBilletes + totalMonedas;
    const base = fondoBase || BASE_CAJA_SUCURSAL;
    const diferencia = (totalContado - base) - efectivoEsperado;

    // Actualizar resumen
    document.getElementById('val-billetes').innerText = formatCOP(totalBilletes);
    document.getElementById('val-monedas').innerText = formatCOP(totalMonedas);
    document.getElementById('val-contado').innerText = formatCOP(totalContado);

    // Alerta silenciosa dinámica
    const alertDiv = document.getElementById('alert-resultado');
    const allInputs = document.querySelectorAll('.denom-input');
    const algunValorIngresado = Array.from(allInputs).some(input => (parseInt(input.value) || 0) > 0);

    if (!algunValorIngresado) {
        alertDiv.style.display = 'none';
    } else {
        alertDiv.style.display = 'block';
        if (diferencia === 0) {
            alertDiv.className = 'alert-card cuadrada';
            alertDiv.innerText = '🟢 ¡Caja cuadrada! El efectivo coincide perfectamente.';
        } else if (diferencia < 0) {
            alertDiv.className = 'alert-card diferencia-menor';
            alertDiv.innerText = `⚠️ Faltan ${formatCOP(Math.abs(diferencia))} en caja.`;
        } else {
            alertDiv.className = 'alert-card diferencia-mayor';
            alertDiv.innerText = `📈 Sobran ${formatCOP(diferencia)} en caja.`;
        }
    }
}
