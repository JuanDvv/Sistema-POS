function pad2(n) {
    return String(n).padStart(2, '0');
}

function pad3(n) {
    return String(n).padStart(3, '0');
}

function obtenerPartesWallClock() {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: process.env.TZ || 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        hour12: false
    });
    const parts = {};
    for (const p of formatter.formatToParts()) {
        parts[p.type] = p.value;
    }
    const hour = parts.hour === '24' ? '00' : parts.hour;
    return {
        year: parts.year,
        month: parts.month,
        day: parts.day,
        hour,
        minute: parts.minute,
        second: parts.second,
        ms: parts.fractionalSecond || '000'
    };
}

function obtenerFechaWallClock() {
    const p = obtenerPartesWallClock();
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

function obtenerSoloFechaWallClock() {
    const p = obtenerPartesWallClock();
    return `${p.year}-${p.month}-${p.day}`;
}

function obtenerTimestampLWW() {
    const p = obtenerPartesWallClock();
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}.${p.ms}`;
}

module.exports = {
    pad2,
    pad3,
    obtenerFechaWallClock,
    obtenerSoloFechaWallClock,
    obtenerTimestampLWW
};

