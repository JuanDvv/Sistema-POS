let sucursalId = '';
let expectedCash = 0;
const STORAGE_KEY = 'arqueo-caja-inputs';

const BASE_CAJA_SUCURSAL = 300000;
const formatCOP = (val) => `$${Math.round(val).toLocaleString('es-CO')}`;

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
    // 1. Obtener ID de la sucursal actual
    const resId = await window.api.obtenerSucursalId();
    if (resId.success) {
        sucursalId = resId.id;
    }

    // 2. Obtener datos de ventas y gastos de hoy para calcular el efectivo esperado
    await cargarEfectivoEsperado();

    // 3. Configurar event listeners en los inputs
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

    // 4. Restaurar datos guardados y configurar botón resetear
    restaurarValoresCuadre(inputs);
    document.getElementById('btn-resetear').addEventListener('click', () => {
        limpiarValoresCuadre(inputs);
    });

    // Calcular totales iniciales
    calcularTotales();
});

async function cargarEfectivoEsperado() {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const response = await window.api.getReporteDiario({ sucursalId, fecha: todayStr });

    if (response.success) {
        let totalEfectivo = 0;
        let totalGastosEfectivo = 0;

        // Sumar ventas en efectivo (o la porción en efectivo de las mixtas)
        if (response.ventas) {
            response.ventas.forEach(venta => {
                if (venta.metodo_pago === 'Efectivo') {
                    totalEfectivo += venta.total;
                } else if (venta.metodo_pago && venta.metodo_pago.startsWith('Mixto')) {
                    const matchEf = venta.metodo_pago.match(/Efectivo:\s*(\d+(\.\d+)?)/);
                    const cashVal = matchEf ? parseFloat(matchEf[1]) : 0;
                    totalEfectivo += cashVal;
                }
            });
        }

        // Sumar gastos pagados con efectivo de caja
        if (response.gastos) {
            response.gastos.forEach(gasto => {
                if (gasto.tipo !== 'Operativo') {
                    return;
                }
                const metodoGasto = gasto.metodo_pago || 'Efectivo';
                if (metodoGasto === 'Efectivo') {
                    totalGastosEfectivo += gasto.monto;
                }
            });
        }

        expectedCash = totalEfectivo - totalGastosEfectivo;
        document.getElementById('val-esperado').innerText = formatCOP(expectedCash);
    } else {
        console.error("Error al cargar el reporte del día:", response.message);
        document.getElementById('val-esperado').innerText = "$0 (Error)";
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
    const diferencia = (totalContado - BASE_CAJA_SUCURSAL) - expectedCash;

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
