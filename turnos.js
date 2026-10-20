// ==============================================================================
// GESTIÓN Y CÁLCULO DINÁMICO DE TURNOS DE OPERADORES (VENTANA RODANTE SEMANAL)
// Modelo de rotación continua:
//   Se muestran los próximos N días (por defecto 7 días) iniciando hoy.
//   A medida que pasa cada día, el día anterior desaparece y se añade uno nuevo.
// Ciclo de 3 días:
//   Slot 1 (Liliana):  [San Roque -> Granja -> Descanso] (Base al 2026-10-10: San Roque)
//   Slot 2 (Tatiana):  [Granja -> Descanso -> San Roque] (Base al 2026-10-10: Granja)
//   Slot 3 (Danna):    [Descanso -> San Roque -> Granja] (Base al 2026-10-10: Descanso)
// ==============================================================================

(function () {
    const CICLO_TURNOS = ['San Roque', 'Granja', 'Descanso'];
    const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const MESES_ABR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Fecha base de referencia: 10 de Octubre de 2026
    const BASE_ANIO = 2026;
    const BASE_MES = 9; // Octubre (0-indexed)
    const BASE_DIA = 10;
    const BASE_UTC = Date.UTC(BASE_ANIO, BASE_MES, BASE_DIA);

    const NOMBRES_DEFAULT = ['Liliana', 'Tatiana', 'Danna'];
    const STORAGE_KEY = 'pos_turnos_operadores_v1';

    let operadoresActivos = [...NOMBRES_DEFAULT];

    // Ventana móvil: inicia en la fecha actual (medianoche local)
    const hoyReal = new Date();
    let fechaInicioVentana = new Date(hoyReal.getFullYear(), hoyReal.getMonth(), hoyReal.getDate());
    let diasVentana = 14;

    function obtenerDeltaDias(anio, mes, dia) {
        const targetUtc = Date.UTC(anio, mes, dia);
        const msPorDia = 24 * 60 * 60 * 1000;
        return Math.round((targetUtc - BASE_UTC) / msPorDia);
    }

    function calcularTurno(deltaDias, slotIndex) {
        const indice = (((deltaDias + slotIndex) % 3) + 3) % 3;
        return CICLO_TURNOS[indice];
    }

    function cargarOperadoresStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length === 3) {
                    operadoresActivos = parsed.map(n => String(n || '').trim()).map((n, i) => n || NOMBRES_DEFAULT[i]);
                    return;
                }
            }
        } catch (e) {
            console.warn('[Turnos] Error al leer localStorage:', e);
        }
        operadoresActivos = [...NOMBRES_DEFAULT];
    }

    function guardarOperadoresStorage(nombres) {
        try {
            operadoresActivos = nombres.map((n, i) => String(n || '').trim() || NOMBRES_DEFAULT[i]);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(operadoresActivos));
        } catch (e) {
            console.warn('[Turnos] Error al guardar en localStorage:', e);
        }
    }

    async function poblarSelectoresOperadores() {
        let listaOperadores = [];
        if (window.api && window.api.obtenerUsuarios) {
            try {
                const res = await window.api.obtenerUsuarios();
                if (res && res.success && Array.isArray(res.data)) {
                    listaOperadores = res.data
                        .filter(u => String(u.rol || '').toLowerCase().includes('operad'))
                        .map(u => u.username)
                        .filter(Boolean);
                }
            } catch (err) {
                console.error('[Turnos] Error al consultar usuarios operadores:', err);
            }
        }

        for (let i = 0; i < 3; i++) {
            const selectEl = document.getElementById(`select-op-${i + 1}`);
            const inputEl = document.getElementById(`input-op-${i + 1}`);
            if (!selectEl || !inputEl) continue;

            selectEl.innerHTML = `<option value="">(Seleccionar operador...)</option>`;
            listaOperadores.forEach(nombre => {
                const opt = document.createElement('option');
                opt.value = nombre;
                opt.textContent = nombre;
                if (nombre.toLowerCase() === operadoresActivos[i].toLowerCase()) {
                    opt.selected = true;
                }
                selectEl.appendChild(opt);
            });

            inputEl.value = operadoresActivos[i];

            selectEl.addEventListener('change', () => {
                if (selectEl.value) {
                    inputEl.value = selectEl.value;
                }
            });
        }
    }

    function renderizarTabla() {
        const tbody = document.getElementById('tbody-turnos');
        const thOp1 = document.getElementById('th-op-1');
        const thOp2 = document.getElementById('th-op-2');
        const thOp3 = document.getElementById('th-op-3');
        const labelRango = document.getElementById('label-rango-turnos');
        if (!tbody) return;

        if (thOp1) thOp1.textContent = operadoresActivos[0];
        if (thOp2) thOp2.textContent = operadoresActivos[1];
        if (thOp3) thOp3.textContent = operadoresActivos[2];

        tbody.innerHTML = '';

        const hoy = new Date();
        const hoyAnio = hoy.getFullYear();
        const hoyMes = hoy.getMonth();
        const hoyDia = hoy.getDate();

        const fechaFin = new Date(fechaInicioVentana.getFullYear(), fechaInicioVentana.getMonth(), fechaInicioVentana.getDate() + diasVentana - 1);

        if (labelRango) {
            const fIniStr = `${fechaInicioVentana.getDate()} ${MESES_ABR[fechaInicioVentana.getMonth()]}`;
            const fFinStr = `${fechaFin.getDate()} ${MESES_ABR[fechaFin.getMonth()]} ${fechaFin.getFullYear()}`;
            labelRango.textContent = `${fIniStr} - ${fFinStr} (${diasVentana} días)`;
        }

        for (let offset = 0; offset < diasVentana; offset++) {
            const fechaFila = new Date(fechaInicioVentana.getFullYear(), fechaInicioVentana.getMonth(), fechaInicioVentana.getDate() + offset);
            const y = fechaFila.getFullYear();
            const m = fechaFila.getMonth();
            const d = fechaFila.getDate();

            const diaSemanaIdx = fechaFila.getDay();
            const diaNombre = DIAS_SEMANA[diaSemanaIdx];
            const esFinSemana = (diaSemanaIdx === 0 || diaSemanaIdx === 6);
            const esHoy = (y === hoyAnio && m === hoyMes && d === hoyDia);

            const deltaDias = obtenerDeltaDias(y, m, d);
            const turnoOp1 = calcularTurno(deltaDias, 0);
            const turnoOp2 = calcularTurno(deltaDias, 1);
            const turnoOp3 = calcularTurno(deltaDias, 2);

            const mesPadded = String(m + 1).padStart(2, '0');
            const diaPadded = String(d).padStart(2, '0');
            const fechaStr = `${y}-${mesPadded}-${diaPadded}`;

            const tr = document.createElement('tr');
            if (esHoy) {
                tr.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                tr.style.outline = '2px solid #3b82f6';
                tr.style.outlineOffset = '-1px';
            }

            const bgFinSemana = esFinSemana ? 'background-color: #fef08a; font-weight: bold; color: #1e293b;' : '';

            tr.innerHTML = `
                <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 0.95em; ${bgFinSemana}">
                    ${fechaStr} ${esHoy ? '<span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-family: sans-serif; font-weight: bold; margin-left: 4px;">HOY</span>' : ''}
                </td>
                <td style="padding: 10px 12px; border: 1px solid #e2e8f0; ${bgFinSemana}">
                    ${diaNombre}
                </td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                    ${generarBadgeTurno(turnoOp1)}
                </td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                    ${generarBadgeTurno(turnoOp2)}
                </td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                    ${generarBadgeTurno(turnoOp3)}
                </td>
            `;

            tbody.appendChild(tr);
        }
    }

    function generarBadgeTurno(turno) {
        if (turno === 'San Roque') {
            return `<span style="background-color: #fef9c3; color: #713f12; border: 1px solid #fef08a; padding: 5px 12px; border-radius: 4px; font-weight: 600; display: inline-block; min-width: 95px;">San Roque</span>`;
        }
        if (turno === 'Granja') {
            return `<span style="background-color: #dcfce7; color: #14532d; border: 1px solid #bbf7d0; padding: 5px 12px; border-radius: 4px; font-weight: 600; display: inline-block; min-width: 95px;">Granja</span>`;
        }
        return `<span style="background-color: #e0e7ff; color: #312e81; border: 1px solid #c7d2fe; padding: 5px 12px; border-radius: 4px; font-weight: 600; display: inline-block; min-width: 95px;">Descanso</span>`;
    }

    function inicializarModuloTurnos() {
        const role = sessionStorage.getItem('currentRole') || '';
        const esAdmin = role === 'Administrador';

        cargarOperadoresStorage();
        if (esAdmin) {
            poblarSelectoresOperadores();
        } else {
            const contenedorAsignacion = document.getElementById('contenedor-asignacion-turnos');
            if (contenedorAsignacion) {
                contenedorAsignacion.style.display = 'none';
            }
        }
        renderizarTabla();

        const btnAnt = document.getElementById('btn-turno-anterior');
        const btnSig = document.getElementById('btn-turno-siguiente');
        const btnHoy = document.getElementById('btn-turno-hoy');
        const selectDias = document.getElementById('select-turno-dias');
        const btnGuardarOp = document.getElementById('btn-guardar-operadores-turnos');

        if (selectDias) {
            selectDias.value = String(diasVentana);
            selectDias.addEventListener('change', () => {
                diasVentana = Number(selectDias.value) || 7;
                renderizarTabla();
            });
        }

        if (btnAnt) {
            btnAnt.addEventListener('click', () => {
                fechaInicioVentana.setDate(fechaInicioVentana.getDate() - diasVentana);
                renderizarTabla();
            });
        }

        if (btnSig) {
            btnSig.addEventListener('click', () => {
                fechaInicioVentana.setDate(fechaInicioVentana.getDate() + diasVentana);
                renderizarTabla();
            });
        }

        if (btnHoy) {
            btnHoy.addEventListener('click', () => {
                const h = new Date();
                fechaInicioVentana = new Date(h.getFullYear(), h.getMonth(), h.getDate());
                renderizarTabla();
            });
        }

        if (btnGuardarOp) {
            btnGuardarOp.addEventListener('click', () => {
                const roleActual = sessionStorage.getItem('currentRole') || '';
                if (roleActual !== 'Administrador') {
                    alert('Solo los administradores pueden modificar la asignación de operadores.');
                    return;
                }
                const op1 = document.getElementById('input-op-1')?.value || NOMBRES_DEFAULT[0];
                const op2 = document.getElementById('input-op-2')?.value || NOMBRES_DEFAULT[1];
                const op3 = document.getElementById('input-op-3')?.value || NOMBRES_DEFAULT[2];

                guardarOperadoresStorage([op1, op2, op3]);
                renderizarTabla();
                alert('Asignación de operadores de turnos actualizada exitosamente.');
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarModuloTurnos);
    } else {
        inicializarModuloTurnos();
    }
})();
