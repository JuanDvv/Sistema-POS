const { execFile, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { construirTicketBuffer, construirTicketPedidoBuffer } = require('./ticketEscPos');

// SRP: encapsula la selección de impresora y el envío del ticket en modo RAW (ESC/POS),
// aislando al IPC handler del detalle de WinSpool/PowerShell.

// La impresora elegida en Administración es una configuración de ESTE EQUIPO. Se guarda en
// el Registro de Windows (HKCU), NO en un archivo de la app ni en localStorage: debe
// sobrevivir a reinstalaciones de la app y a limpiezas de userData (estamos en fase de
// pruebas en producción, reinstalando seguido) y al logout, que hace localStorage.clear()
// en todas las pantallas. Solo debe cambiar si alguien la reconfigura desde Administración.
const REGISTRY_KEY = 'HKCU\\Software\\POSDelipostresTurbaco';
const REGISTRY_VALUE = 'ImpresoraTickets';

function leerImpresoraGuardada() {
    if (process.platform !== 'win32') return '';
    try {
        const salida = execFileSync('reg', ['query', REGISTRY_KEY, '/v', REGISTRY_VALUE], { windowsHide: true, encoding: 'utf8' });
        const match = salida.match(/ImpresoraTickets\s+REG_SZ\s+(.*)/);
        return match ? match[1].trim() : '';
    } catch (_) {
        return ''; // La clave no existe aún (primera vez en este equipo) u otro error de lectura.
    }
}

function guardarImpresoraLocal(nombre) {
    if (process.platform !== 'win32') return;
    execFileSync('reg', ['add', REGISTRY_KEY, '/v', REGISTRY_VALUE, '/d', String(nombre), '/t', 'REG_SZ', '/f'], { windowsHide: true });
}

// Nota: Electron ya no expone `isDefault` en PrinterInfo (a partir de v18), por lo que no hay
// forma de saber cuál es la predeterminada a través de getPrintersAsync(). Se consulta
// directamente a Windows cuál es la impresora predeterminada del sistema.
function obtenerImpresoraPredeterminadaWindows() {
    return new Promise((resolve) => {
        if (process.platform !== 'win32') return resolve('');
        execFile('powershell.exe', [
            '-NoProfile', '-NonInteractive', '-Command',
            '(Get-CimInstance -ClassName Win32_Printer | Where-Object { $_.Default }).Name'
        ], { windowsHide: true, timeout: 5000 }, (err, stdout) => {
            resolve(err ? '' : String(stdout || '').trim());
        });
    });
}

// Helper clásico de WinSpool (variante del artículo de Microsoft KB322091) para enviar bytes
// en bruto (datatype RAW) a una impresora por su nombre de cola. RAW le dice al spooler que
// NO deje que el driver procese/renderice los datos: los bytes van directo al puerto (USB).
// Esto es indispensable para impresoras térmicas con drivers genéricos que no soportan el
// pipeline gráfico de Chromium (ver el historial de "Invalid printer settings" que motivó
// este cambio: falló igual con deviceName explícito, pageSize a medida y sin OopPrintDrivers).
const RAW_PRINT_PS1 = `
param([string]$PrinterName, [string]$FilePath)
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }
    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);
    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] bytes) {
        IntPtr hPrinter;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "Ticket POS";
        di.pDataType = "RAW";
        bool bSuccess = false;
        if (OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
                    Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
                    int dwWritten;
                    bSuccess = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                    Marshal.FreeCoTaskMem(pUnmanagedBytes);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        return bSuccess;
    }
}
'@
$bytes = [System.IO.File]::ReadAllBytes($FilePath)
$ok = [RawPrinterHelper]::SendBytesToPrinter($PrinterName, $bytes)
if (-not $ok) { throw "WinSpool rechazó el trabajo RAW (impresora fuera de línea, nombre inválido o sin permisos)." }
`;

function enviarBytesCrudosAImpresora(deviceName, buffer) {
    return new Promise((resolve) => {
        const tmpDir = os.tmpdir();
        const dataFile = path.join(tmpDir, `pos-ticket-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`);
        const scriptFile = path.join(tmpDir, 'pos-raw-print-helper.ps1');

        try {
            fs.writeFileSync(dataFile, buffer);
            fs.writeFileSync(scriptFile, RAW_PRINT_PS1);
        } catch (err) {
            resolve({ success: false, message: `Error de impresión: no se pudo preparar el trabajo (${err.message})` });
            return;
        }

        execFile('powershell.exe', [
            '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
            '-File', scriptFile, '-PrinterName', deviceName, '-FilePath', dataFile
        ], { windowsHide: true, timeout: 15000 }, (err, stdout, stderr) => {
            try { fs.unlinkSync(dataFile); } catch (_) { /* best-effort cleanup */ }
            resolve(
                err
                    ? { success: false, message: `Error de impresión: ${String(stderr || err.message).trim()}` }
                    : { success: true }
            );
        });
    });
}

// Impresoras virtuales/de documento que Windows instala por defecto y que nunca son la
// térmica real de tickets. Se usan para descartar candidatas cuando no hay predeterminada
// configurada (p.ej. Windows "administra" el default y lo movió a otra cosa tras un update).
const PATRONES_IMPRESORA_VIRTUAL = [
    /onenote/i, /xps document writer/i, /^fax$/i, /print to pdf/i, /microsoft print to pdf/i,
];

function esImpresoraVirtual(nombre) {
    return PATRONES_IMPRESORA_VIRTUAL.some(regex => regex.test(nombre));
}

async function seleccionarImpresora(win, printerName) {
    const impresoras = await win.webContents.getPrintersAsync();
    let deviceName = Boolean(printerName) && impresoras.some(p => p.name === printerName) ? printerName : '';

    if (!deviceName) {
        const guardada = leerImpresoraGuardada();
        if (guardada && impresoras.some(p => p.name === guardada)) {
            deviceName = guardada;
        }
    }

    if (!deviceName) {
        const predeterminada = await obtenerImpresoraPredeterminadaWindows();
        if (predeterminada && impresoras.some(p => p.name === predeterminada)) {
            deviceName = predeterminada;
        }
    }

    if (!deviceName) {
        const fisicas = impresoras.filter(p => !esImpresoraVirtual(p.name));
        if (fisicas.length === 1) {
            deviceName = fisicas[0].name;
        }
    }

    if (!deviceName) {
        const lista = impresoras.map(p => `"${p.name}"`).join(', ') || '(ninguna detectada)';
        return { deviceName: '', error: `Error de impresión: no se encontró una impresora válida. Impresoras detectadas: ${lista}` };
    }

    return { deviceName, error: null };
}

// Para la pantalla de administración: lista las impresoras del sistema y cuál se usaría
// automáticamente si el usuario no selecciona ninguna (mismo criterio que seleccionarImpresora,
// sin depender de un printerName guardado).
async function listarImpresorasDisponibles(win) {
    const impresoras = await win.webContents.getPrintersAsync();
    const guardada = leerImpresoraGuardada();
    const predeterminada = await obtenerImpresoraPredeterminadaWindows();

    let sugerida = '';
    if (predeterminada && impresoras.some(p => p.name === predeterminada)) {
        sugerida = predeterminada;
    } else {
        const fisicas = impresoras.filter(p => !esImpresoraVirtual(p.name));
        if (fisicas.length === 1) sugerida = fisicas[0].name;
    }

    return {
        nombres: impresoras.map(p => p.name),
        sugerida,
        guardada: guardada && impresoras.some(p => p.name === guardada) ? guardada : '',
    };
}

async function imprimirTicket(win, { printerName, datosTicket } = {}) {
    const { deviceName, error } = await seleccionarImpresora(win, printerName);
    if (!deviceName) return { success: false, message: error };

    const buffer = construirTicketBuffer(datosTicket);
    return enviarBytesCrudosAImpresora(deviceName, buffer);
}

async function imprimirTicketPedido(win, { printerName, datosTicket } = {}) {
    const { deviceName, error } = await seleccionarImpresora(win, printerName);
    if (!deviceName) return { success: false, message: error };

    const buffer = construirTicketPedidoBuffer(datosTicket);
    return enviarBytesCrudosAImpresora(deviceName, buffer);
}

module.exports = { imprimirTicket, imprimirTicketPedido, listarImpresorasDisponibles, guardarImpresoraLocal, leerImpresoraGuardada };
