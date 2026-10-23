const CICLO_TURNOS = ['San Roque', 'Granja', 'Descanso'];
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const BASE_UTC = Date.UTC(2026, 9, 10); // 10 de Octubre de 2026
const OPERADORES_DEFAULT = ['Liliana', 'Tatiana', 'Danna'];

function parsearFechaAUtc(fechaStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
        throw new Error('Formato de fecha inválido. Se espera YYYY-MM-DD.');
    }
    const [y, m, d] = fechaStr.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
}

function formatearUtcAYYYYMMDD(utcMs) {
    const d = new Date(utcMs);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${dia}`;
}

function calcularDeltaDias(fechaStr) {
    const targetUtc = parsearFechaAUtc(fechaStr);
    const msPorDia = 24 * 60 * 60 * 1000;
    return Math.round((targetUtc - BASE_UTC) / msPorDia);
}

function calcularTurno(deltaDias, slotIndex) {
    const indice = (((deltaDias + slotIndex) % 3) + 3) % 3;
    return CICLO_TURNOS[indice];
}

function calcularTurnosRango({ fechaInicio, dias = 14, operadores = OPERADORES_DEFAULT }) {
    const totalDias = Math.min(30, Math.max(1, Number(dias) || 14));
    const nombresOps = Array.isArray(operadores) && operadores.length === 3
        ? operadores.map((n, i) => String(n || '').trim() || OPERADORES_DEFAULT[i])
        : OPERADORES_DEFAULT;

    const fechaInicioUtc = parsearFechaAUtc(fechaInicio);
    const msPorDia = 24 * 60 * 60 * 1000;
    const resultado = [];

    for (let i = 0; i < totalDias; i++) {
        const fechaActualUtc = fechaInicioUtc + (i * msPorDia);
        const fechaStr = formatearUtcAYYYYMMDD(fechaActualUtc);
        const d = new Date(fechaActualUtc);
        const diaSemanaIdx = d.getUTCDay();
        const delta = calcularDeltaDias(fechaStr);

        resultado.push({
            fecha: fechaStr,
            diaSemana: DIAS_SEMANA[diaSemanaIdx],
            esFinSemana: diaSemanaIdx === 0 || diaSemanaIdx === 6,
            asignaciones: [
                { operador: nombresOps[0], turno: calcularTurno(delta, 0) },
                { operador: nombresOps[1], turno: calcularTurno(delta, 1) },
                { operador: nombresOps[2], turno: calcularTurno(delta, 2) }
            ]
        });
    }

    return {
        fechaInicio,
        dias: totalDias,
        operadores: nombresOps,
        turnos: resultado
    };
}

module.exports = {
    CICLO_TURNOS,
    OPERADORES_DEFAULT,
    calcularDeltaDias,
    calcularTurno,
    calcularTurnosRango
};

