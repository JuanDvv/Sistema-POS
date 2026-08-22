const formatCOP = (val) => `$${Math.round(val).toLocaleString('es-CO')}`;
const auditoriaUsuario = localStorage.getItem('currentUser') || 'Invitado';
const auditoriaRol = localStorage.getItem('currentRole') || 'Sin Rol';
let datosReporteGlobal = { ventas: [], gastos: [], ranking: [], abonos: [], abonosPedido: [] };

// Mismo día calendario LOCAL (no solo "hace menos de 24h"). Mismo criterio que usa el backend
// (strftime('%Y-%m-%d', fecha, 'localtime')) para bloquear el borrado de abonos de un día anterior.
function esFechaDeHoy(iso) {
    if (!iso) return false;
    const d = new Date(iso);
    const hoy = new Date();
    return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth() && d.getDate() === hoy.getDate();
}
let gFechaInicio = '';
let gFechaFin = '';

// Debounce compartido: agrupa cambios rápidos de filtros en una sola consulta
let debounceFiltrosGestion = null;
function recargarReporteConDebounce() {
    clearTimeout(debounceFiltrosGestion);
    debounceFiltrosGestion = setTimeout(() => {
        cargarReportesGestion();
    }, 400);
}

const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const originalAlert = window.alert;
window.alert = (msg) => {
    const result = originalAlert(msg);
    if (window.api?.forceRefocus) {
        window.api.forceRefocus();
    }
    return result;
};

const originalConfirm = window.confirm;
window.confirm = (msg) => {
    const result = originalConfirm(msg);
    if (window.api?.forceRefocus) {
        window.api.forceRefocus();
    }
    return result;
};

function restaurarFocoSelectoresCredito() {
    const selects = [
        document.getElementById('select-filtro-cliente-reporte'),
        document.getElementById('abono-cliente-select')
    ];

    selects.forEach((select) => {
        if (!select) return;
        select.blur();
        requestAnimationFrame(() => {
            if (document.activeElement !== select) {
                select.focus({ preventScroll: true });
            }
        });
    });
}

async function actualizarMesesDisponibles(anio, mesSeleccionadoDefault = null) {
    const selectMes = document.getElementById('select-mes');
    const valorSeleccionadoPrevio = selectMes.value;
    selectMes.innerHTML = '';
    
    const resMeses = await window.api.obtenerMesesDisponibles(anio);
    let meses = [];
    if (resMeses.success && resMeses.meses && resMeses.meses.length > 0) {
        meses = resMeses.meses;
    } else {
        // Fallback a todos los meses si no hay datos
        meses = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    }
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    // Asegurar que el mes actual esté disponible si seleccionamos el año actual
    if (parseInt(anio) === currentYear && !meses.includes(currentMonth)) {
        meses.push(currentMonth);
        meses.sort((a, b) => a - b);
    }
    
    meses.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.innerText = nombresMeses[m];
        selectMes.appendChild(opt);
    });
    
    // Decidir qué mes dejar seleccionado
    const targetMes = mesSeleccionadoDefault !== null ? mesSeleccionadoDefault : parseInt(valorSeleccionadoPrevio);
    if (!isNaN(targetMes) && meses.includes(targetMes)) {
        selectMes.value = targetMes;
    } else if (meses.includes(currentMonth) && parseInt(anio) === currentYear) {
        selectMes.value = currentMonth;
    } else if (meses.length > 0) {
        selectMes.value = meses[0];
    }
}

// Puebla el selector de categorías del Ranking de Productos, agrupando cada subcategoría bajo
// su categoría padre (mismo agrupado que usa categoriaFiltro.js en otras páginas).
function poblarSelectorCategoriasRanking(categorias) {
    const select = document.getElementById('select-categoria-ranking');
    if (!select) return;

    const parentMap = {};
    const conPadre = [];
    categorias.forEach(cat => {
        if (!cat.categoria_padre_id) {
            parentMap[cat.id] = { id: cat.id, nombre: cat.nombre, subcategorias: [] };
        } else {
            conPadre.push(cat);
        }
    });
    conPadre.forEach(cat => {
        const pid = cat.categoria_padre_id;
        if (parentMap[pid]) {
            parentMap[pid].subcategorias.push(cat);
        } else {
            parentMap[cat.id] = { id: cat.id, nombre: cat.nombre, subcategorias: [] };
        }
    });

    Object.values(parentMap).forEach(parent => {
        const optParent = document.createElement('option');
        optParent.value = parent.id;
        optParent.innerText = parent.nombre;
        select.appendChild(optParent);
        parent.subcategorias.forEach(sub => {
            const optSub = document.createElement('option');
            optSub.value = sub.id;
            optSub.innerText = `↳ ${sub.nombre}`;
            select.appendChild(optSub);
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar Sucursales en el Selector
    const selectSucursal = document.getElementById('select-sucursal');
    const resSuc = await window.api.obtenerTodasSucursales();
    if (resSuc.success && resSuc.data) {
        resSuc.data.forEach(suc => {
            const opt = document.createElement('option');
            opt.value = suc.id;
            opt.innerText = suc.nombre;
            selectSucursal.appendChild(opt);
        });
    }

    // 1b. Cargar Categorías en el filtro del Ranking de Productos
    const resCats = await window.api.obtenerCategorias();
    if (resCats.success && resCats.data) {
        poblarSelectorCategoriasRanking(resCats.data);
    }

    // 2. Poblar selectores de Año Dinámicamente
    const selectAnio = document.getElementById('select-anio');
    const currentYear = new Date().getFullYear();
    const resAnios = await window.api.obtenerAniosDisponibles();
    
    let anios = [];
    if (resAnios.success && resAnios.anios && resAnios.anios.length > 0) {
        anios = resAnios.anios;
    } else {
        anios = [currentYear]; // Fallback to current year if no data
    }
    
    // Asegurar que el año actual esté en la lista
    if (!anios.includes(currentYear)) {
        anios.push(currentYear);
        anios.sort((a, b) => b - a);
    }
    
    anios.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.innerText = y;
        selectAnio.appendChild(opt);
    });

    // Default select current month & year
    const currentMonth = new Date().getMonth();
    selectAnio.value = currentYear;
    
    // Cargar los meses correspondientes al año seleccionado
    await actualizarMesesDisponibles(currentYear, currentMonth);

    // Escuchar cambios en el selector de año para actualizar los meses y recargar
    selectAnio.addEventListener('change', async () => {
        await actualizarMesesDisponibles(selectAnio.value);
        recargarReporteConDebounce();
    });

    // Set default dates for range mode
    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('fecha-desde').value = todayStr;
    document.getElementById('fecha-hasta').value = todayStr;

    // 3. Alternar paneles de filtrado
    const selectTipoFiltro = document.getElementById('select-tipo-filtro');
    const filterRangoGroup = document.getElementById('filter-rango-group');
    const filterMesGroup = document.getElementById('filter-mes-group');
    const filterSelectMesWrapper = document.getElementById('filter-select-mes-wrapper');

    selectTipoFiltro.addEventListener('change', () => {
        if (selectTipoFiltro.value === 'mes') {
            filterMesGroup.style.display = 'block';
            filterSelectMesWrapper.style.display = 'block';
            filterRangoGroup.style.display = 'none';
        } else if (selectTipoFiltro.value === 'anio') {
            filterMesGroup.style.display = 'block';
            filterSelectMesWrapper.style.display = 'none';
            filterRangoGroup.style.display = 'none';
        } else {
            filterMesGroup.style.display = 'none';
            filterRangoGroup.style.display = 'block';
        }
    });

    // 4. Carga automática al cambiar cualquier filtro, con debounce para no saturar la BD
    // (select-anio ya dispara la recarga tras actualizar los meses, ver arriba)
    ['select-tipo-filtro', 'select-sucursal', 'select-metodo-ingreso', 'select-tipo-gasto', 'select-categoria-ranking', 'select-mes', 'fecha-desde', 'fecha-hasta']
        .forEach(id => document.getElementById(id).addEventListener('change', recargarReporteConDebounce));

    // Búsqueda de texto libre por concepto/descripción: se recarga mientras se escribe (con debounce)
    const inputConceptoGasto = document.getElementById('input-concepto-gasto');
    if (inputConceptoGasto) {
        inputConceptoGasto.addEventListener('input', recargarReporteConDebounce);
    }

    // EXPORTACIÓN EXCEL/CSV (Compatible nativamente con Microsoft Excel)
    document.getElementById('btn-exportar').addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-btn.active').id;
        if (activeTab === 'tab-creditos') {
            exportarCreditosExcel();
            return;
        }

        const { ventas, gastos, ranking, abonos, abonosPedido } = datosReporteGlobal;

        if (!ventas && !gastos && !ranking) {
            alert("No hay datos para exportar.");
            return;
        }

        let csvContent = "\uFEFF"; // BOM for Excel UTF-8

        // 1. Resumen de Balance
        csvContent += "--- BALANCE GENERAL DE GESTION ---\n";

        let totalIngresos = 0;
        let subtotalEfectivo = 0;
        let subtotalTransferencia = 0;
        if (ventas) {
            ventas.forEach(v => {
                totalIngresos += v.total;
                if (v.metodo_pago === 'Efectivo') {
                    subtotalEfectivo += v.total;
                } else if (v.metodo_pago === 'Transferencia') {
                    subtotalTransferencia += v.total;
                } else if (v.metodo_pago && v.metodo_pago.startsWith('Mixto')) {
                    const matchEf = v.metodo_pago.match(/Efectivo:\s*(\d+(\.\d+)?)/);
                    const matchTr = v.metodo_pago.match(/Transferencia:\s*(\d+(\.\d+)?)/);
                    subtotalEfectivo += matchEf ? parseFloat(matchEf[1]) : 0;
                    subtotalTransferencia += matchTr ? parseFloat(matchTr[1]) : 0;
                } else {
                    subtotalTransferencia += v.total;
                }
            });
        }

        // Abonos de cartera: dinero real cobrado de ventas a cr\u00E9dito, reconocido el d\u00EDa del pago.
        let subtotalAbonos = 0;
        if (abonos) {
            abonos.forEach(a => {
                totalIngresos += a.total;
                subtotalAbonos += a.total;
                if (a.metodo_pago === 'Efectivo') {
                    subtotalEfectivo += a.total;
                } else {
                    subtotalTransferencia += a.total;
                }
            });
        }

        let totalGastos = 0;
        const desgloseGastosMap = {};
        if (gastos) {
            gastos.forEach(g => {
                if (g.tipo === 'Gasto de Inventario' || g.tipo === 'Devolución de Producto') {
                    return;
                }
                const monto = Number(g.monto || g.total_monto || 0);
                totalGastos += monto;
                desgloseGastosMap[g.tipo] = (desgloseGastosMap[g.tipo] || 0) + monto;
            });
        }

        // Abonos de Pedidos/Apartados: dinero real cobrado de pedidos aún no entregados, reconocido
        // el día del pago (mismo criterio que los abonos de cartera de arriba).
        let subtotalAbonosPedido = 0;
        if (abonosPedido) {
            abonosPedido.forEach(a => {
                totalIngresos += a.total;
                subtotalAbonosPedido += a.total;
                if (a.metodo_pago === 'Efectivo') {
                    subtotalEfectivo += a.total;
                } else {
                    subtotalTransferencia += a.total;
                }
            });
        }

        csvContent += `Periodo;${gFechaInicio} a ${gFechaFin}\n`;
        csvContent += `Ingresos Efectivo;${subtotalEfectivo}\n`;
        csvContent += `Ingresos Transferencia;${subtotalTransferencia}\n`;
        csvContent += `(de los cuales, Abonos de Cartera Cobrados);${subtotalAbonos}\n`;
        csvContent += `(de los cuales, Abonos de Pedidos Cobrados);${subtotalAbonosPedido}\n`;
        csvContent += `Total Ingresos;${totalIngresos}\n`;
        csvContent += `Total Gastos;${totalGastos}\n`;
        csvContent += `Utilidad Neta;${totalIngresos - totalGastos}\n\n`;

        // 2. Desglose de Gastos
        csvContent += "--- DESGLOSE DE GASTOS ---\n";
        csvContent += "Clasificacion;Monto\n";
        Object.entries(desgloseGastosMap).forEach(([tipo, monto]) => {
            csvContent += `${tipo};${monto}\n`;
        });
        csvContent += "\n";

        // 3. Ranking de Productos
        csvContent += "--- RANKING DE PRODUCTOS MAS VENDIDOS ---\n";
        csvContent += "Puesto;Producto;Categoria;Cantidad Vendida;Total Ingreso ($ COP)\n";
        if (ranking) {
            ranking.forEach((prod, index) => {
                csvContent += `${index + 1};${prod.producto_nombre};${prod.categoria_nombre};${prod.total_cantidad};${prod.total_ingreso}\n`;
            });
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_Gestion_${gFechaInicio}_a_${gFechaFin}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    // EXPORTACIÓN PDF
    document.getElementById('btn-pdf').addEventListener('click', async () => {
        const activeTab = document.querySelector('.tab-btn.active')?.id;
        if (activeTab === 'tab-creditos') {
            const selectFiltroCliente = document.getElementById('select-filtro-cliente-reporte');
            const clienteId = selectFiltroCliente ? selectFiltroCliente.value : '';
            if (!clienteId) {
                alert('Seleccione un cliente para generar la cuenta de cobro.');
                return;
            }

            const response = await window.api.generarCuentaCobroPDF(clienteId);
            if (!response.success && response.message !== 'Exportación cancelada.') {
                alert(response.message);
            }
            return;
        }

        const response = await window.api.exportarPDF();
        if (!response.success && response.message !== 'Exportación cancelada.') {
            alert(response.message);
        }
    });

    // Cargar inicial
    await cargarReportesGestion();

    // Eventos de Abonos y Filtros de Crédito
    const selectFiltroCliente = document.getElementById('select-filtro-cliente-reporte');
    if (selectFiltroCliente) {
        selectFiltroCliente.addEventListener('change', () => {
            filtroClienteCreditoActual = selectFiltroCliente.value || '';
            renderizarTabCreditos();
        });
    }

    const modalAbono = document.getElementById('modal-abono');
    const btnRegistrarAbonoDirecto = document.getElementById('btn-registrar-abono-directo');
    const btnCloseAbonoModal = document.getElementById('btn-close-abono-modal');
    const formAbono = document.getElementById('form-abono');

    if (btnRegistrarAbonoDirecto) {
        btnRegistrarAbonoDirecto.addEventListener('click', () => {
            const modalAbono = document.getElementById('modal-abono');
            document.getElementById('form-abono').reset();
            document.getElementById('abono-fecha').value = new Date().toISOString().split('T')[0];
            if (modalAbono) modalAbono.style.display = 'flex';
        });
    }

    if (btnCloseAbonoModal) {
        btnCloseAbonoModal.addEventListener('click', () => {
            if (modalAbono) modalAbono.style.display = 'none';
        });
    }

    const modalDetalleCliente = document.getElementById('modal-detalle-cliente');
    const btnCloseDetalleCliente = document.getElementById('btn-close-detalle-cliente-modal');
    if (btnCloseDetalleCliente) {
        btnCloseDetalleCliente.addEventListener('click', () => {
            if (modalDetalleCliente) modalDetalleCliente.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalAbono) {
            modalAbono.style.display = 'none';
        }
        if (e.target === modalDetalleCliente) {
            modalDetalleCliente.style.display = 'none';
        }
    });

    if (formAbono) {
        formAbono.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clienteId = document.getElementById('abono-cliente-select').value;
            const montoRaw = document.getElementById('abono-monto').value;
            const metodoPago = document.getElementById('abono-metodo').value;
            const fecha = document.getElementById('abono-fecha').value;

            const monto = parseNumberUI(montoRaw);

            if (!clienteId || monto <= 0 || !metodoPago) {
                alert("Por favor rellene los campos obligatorios con valores válidos.");
                return;
            }

            const res = await window.api.registrarAbono({
                clienteId,
                monto,
                metodoPago,
                fecha
            });

            alert(res.message);
            if (res.success) {
                modalAbono.style.display = 'none';
                formAbono.reset();
                await cargarReporteCreditos();
                await cargarReportesGestion(); // Recargar balance
                restaurarFocoSelectoresCredito();
            }
        });

        // Formatear monto de abono al escribir
        const abonoMontoInput = document.getElementById('abono-monto');
        if (abonoMontoInput) {
            abonoMontoInput.addEventListener('input', (event) => {
                event.target.value = formatNumberUI(event.target.value);
            });
            abonoMontoInput.addEventListener('focus', function () {
                this.select();
            });
        }
    }
});

// Helper para parsear números formateados
const formatNumberUI = (val) => {
    const clean = String(val).replace(/\D/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString('es-CO');
};

const parseNumberUI = (str) => {
    const normalized = String(str ?? '').replace(/\./g, '').replace(/,/g, '.');
    const numeric = parseFloat(normalized);
    return Number.isFinite(numeric) ? numeric : 0;
};



// Cambiar de Pestaña
window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`content-${tabName}`).classList.add('active');
    
    if (tabName === 'creditos') {
        cargarReporteCreditos();
    }
};

// Calcula el rango de fechas vigente según el panel de filtros (mes, año o rango libre).
// Se usa tanto para el balance/ranking como para el reporte de créditos, así ambos quedan
// siempre consolidados según el mismo período seleccionado.
function calcularRangoFechasFiltro() {
    const tipoFiltro = document.getElementById('select-tipo-filtro').value;
    let fechaInicio = '';
    let fechaFin = '';

    if (tipoFiltro === 'mes') {
        const mes = parseInt(document.getElementById('select-mes').value);
        const anio = parseInt(document.getElementById('select-anio').value);

        // Primer día del mes
        const firstDay = new Date(anio, mes, 1);
        const yearStart = firstDay.getFullYear();
        const monthStart = String(firstDay.getMonth() + 1).padStart(2, '0');
        const dayStart = String(firstDay.getDate()).padStart(2, '0');
        fechaInicio = `${yearStart}-${monthStart}-${dayStart}`;

        // Último día del mes
        const lastDay = new Date(anio, mes + 1, 0);
        const yearEnd = lastDay.getFullYear();
        const monthEnd = String(lastDay.getMonth() + 1).padStart(2, '0');
        const dayEnd = String(lastDay.getDate()).padStart(2, '0');
        fechaFin = `${yearEnd}-${monthEnd}-${dayEnd}`;
    } else if (tipoFiltro === 'anio') {
        const anio = parseInt(document.getElementById('select-anio').value);
        fechaInicio = `${anio}-01-01`;
        fechaFin = `${anio}-12-31`;
    } else {
        fechaInicio = document.getElementById('fecha-desde').value;
        fechaFin = document.getElementById('fecha-hasta').value;
    }

    return { fechaInicio, fechaFin };
}

// Cargar Datos de Reportes de Gestión
async function cargarReportesGestion() {
    const sucursalId = document.getElementById('select-sucursal').value;
    const metodoIngreso = document.getElementById('select-metodo-ingreso').value;
    const tipoGasto = document.getElementById('select-tipo-gasto').value;
    const conceptoGasto = document.getElementById('input-concepto-gasto').value.trim();
    const { fechaInicio, fechaFin } = calcularRangoFechasFiltro();

    gFechaInicio = fechaInicio;
    gFechaFin = fechaFin;

    if (!fechaInicio || !fechaFin) {
        alert("Por favor seleccione las fechas del rango.");
        return;
    }

    // 1. Cargar Balance Financiero
    const resBalance = await window.api.obtenerBalanceFinanciero({ sucursalId, fechaInicio, fechaFin, tipoGasto, conceptoGasto });
    if (resBalance.success) {
        datosReporteGlobal.ventas = resBalance.ventas;
        datosReporteGlobal.gastos = resBalance.gastos;
        datosReporteGlobal.abonos = resBalance.abonos || [];
        datosReporteGlobal.abonosPedido = resBalance.abonosPedido || [];
        let totalIngresos = 0;
        let totalGastos = 0;

        // Desglose de ingresos (Agrupando por día y método de pago)
        // Las ventas a crédito ya vienen excluidas desde el backend (no son dinero recibido);
        // los abonos de cartera (dinero real cobrado) se muestran aparte, día por día.
        const tbodyIngresos = document.querySelector('#table-desglose-ingresos tbody');
        tbodyIngresos.innerHTML = '';

        const ventasPorDia = {};
        const ensureDia = (dia) => {
            if (!ventasPorDia[dia]) {
                ventasPorDia[dia] = { efectivo: 0, transferencia: 0, abonoEfectivo: 0, abonoTransferencia: 0, total: 0 };
            }
            return ventasPorDia[dia];
        };

        (resBalance.ventas || []).forEach(v => {
            const data = ensureDia(v.dia || 'Sin Fecha');

            let cashVal = 0;
            let transVal = 0;
            if (v.metodo_pago === 'Efectivo') {
                cashVal = v.total;
            } else if (v.metodo_pago === 'Transferencia') {
                transVal = v.total;
            } else if (v.metodo_pago && v.metodo_pago.startsWith('Mixto')) {
                const matchEf = v.metodo_pago.match(/Efectivo:\s*(\d+(\.\d+)?)/);
                const matchTr = v.metodo_pago.match(/Transferencia:\s*(\d+(\.\d+)?)/);
                cashVal = matchEf ? parseFloat(matchEf[1]) : 0;
                transVal = matchTr ? parseFloat(matchTr[1]) : 0;
            } else {
                transVal = v.total;
            }

            // Filtro "Método de Ingreso": deja en 0 la porción del método que no se quiere ver,
            // así una venta Mixta también aporta solo su parte de Transferencia (o Efectivo) al
            // filtrar, en vez de excluirse/incluirse entera.
            if (metodoIngreso === 'Efectivo') transVal = 0;
            if (metodoIngreso === 'Transferencia') cashVal = 0;

            data.efectivo += cashVal;
            data.transferencia += transVal;
            data.total += (cashVal + transVal);
            totalIngresos += (cashVal + transVal);
        });

        (resBalance.abonos || []).forEach(a => {
            if (metodoIngreso === 'Efectivo' && a.metodo_pago !== 'Efectivo') return;
            if (metodoIngreso === 'Transferencia' && a.metodo_pago === 'Efectivo') return;

            const data = ensureDia(a.dia || 'Sin Fecha');
            if (a.metodo_pago === 'Efectivo') {
                data.abonoEfectivo += a.total;
            } else {
                data.abonoTransferencia += a.total;
            }
            data.total += a.total;
            totalIngresos += a.total;
        });

        (resBalance.abonosPedido || []).forEach(a => {
            if (metodoIngreso === 'Efectivo' && a.metodo_pago !== 'Efectivo') return;
            if (metodoIngreso === 'Transferencia' && a.metodo_pago === 'Efectivo') return;

            const data = ensureDia(a.dia || 'Sin Fecha');
            if (a.metodo_pago === 'Efectivo') {
                data.efectivo += a.total;
            } else {
                data.transferencia += a.total;
            }
            data.total += a.total;
            totalIngresos += a.total;
        });

        if (Object.keys(ventasPorDia).length > 0) {
            // Renderizar agrupados por día de más reciente a más antiguo
            Object.keys(ventasPorDia).sort().reverse().forEach(dia => {
                const data = ventasPorDia[dia];

                // Encabezado del día destacado visualmente
                const trDia = document.createElement('tr');
                trDia.innerHTML = `
                    <td colspan="2" style="background-color: #e2e8f0; font-weight: 700; color: #1e293b; padding: 10px 12px; border-bottom: 2px solid #cbd5e1;">
                        📅 ${dia} (Total: ${formatCOP(data.total)})
                    </td>
                `;
                tbodyIngresos.appendChild(trDia);

                if (data.efectivo > 0) {
                    const trEf = document.createElement('tr');
                    trEf.innerHTML = `
                        <td style="padding-left: 35px; color: #475569; font-weight: 500; padding-top: 8px; padding-bottom: 8px;">💵 Efectivo</td>
                        <td style="font-weight: 600; color: #334155;">${formatCOP(data.efectivo)}</td>
                    `;
                    tbodyIngresos.appendChild(trEf);
                }

                if (data.transferencia > 0) {
                    const trTr = document.createElement('tr');
                    trTr.innerHTML = `
                        <td style="padding-left: 35px; color: #475569; font-weight: 500; padding-top: 8px; padding-bottom: 8px;">📱 Transferencia</td>
                        <td style="font-weight: 600; color: #334155;">${formatCOP(data.transferencia)}</td>
                    `;
                    tbodyIngresos.appendChild(trTr);
                }

                if (data.abonoEfectivo > 0) {
                    const trAbEf = document.createElement('tr');
                    trAbEf.innerHTML = `
                        <td style="padding-left: 35px; color: #065f46; font-weight: 500; padding-top: 8px; padding-bottom: 8px;">💳 Abono de Cartera (Efectivo)</td>
                        <td style="font-weight: 600; color: #10b981;">${formatCOP(data.abonoEfectivo)}</td>
                    `;
                    tbodyIngresos.appendChild(trAbEf);
                }

                if (data.abonoTransferencia > 0) {
                    const trAbTr = document.createElement('tr');
                    trAbTr.innerHTML = `
                        <td style="padding-left: 35px; color: #065f46; font-weight: 500; padding-top: 8px; padding-bottom: 8px;">💳 Abono de Cartera (Transferencia)</td>
                        <td style="font-weight: 600; color: #10b981;">${formatCOP(data.abonoTransferencia)}</td>
                    `;
                    tbodyIngresos.appendChild(trAbTr);
                }

            });
        } else {
            tbodyIngresos.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#94a3b8;">Sin ventas registradas</td></tr>';
        }

        // Desglose de gastos (Agrupando por día y por clasificación)
        const tbodyGastos = document.querySelector('#table-desglose-gastos tbody');
        tbodyGastos.innerHTML = '';
        if (resBalance.gastos && resBalance.gastos.length > 0) {
            const gastosPorDia = {};
            resBalance.gastos.forEach(g => {
                const dia = g.dia || 'Sin Fecha';
                if (!gastosPorDia[dia]) {
                    gastosPorDia[dia] = { categorias: {}, total: 0 };
                }
                
                const tipo = g.tipo || 'Varios';
                if (!gastosPorDia[dia].categorias[tipo]) {
                    gastosPorDia[dia].categorias[tipo] = [];
                }
                
                gastosPorDia[dia].categorias[tipo].push({
                    descripcion: g.descripcion,
                    monto: g.monto,
                    sucursal: g.sucursal_nombre
                });
                
                gastosPorDia[dia].total += g.monto;
                if (g.tipo !== 'Gasto de Inventario' && g.tipo !== 'Devolución de Producto') {
                    totalGastos += g.monto;
                }
            });

            // Renderizar agrupados por día de más reciente a más antiguo
            Object.keys(gastosPorDia).sort().reverse().forEach(dia => {
                const data = gastosPorDia[dia];
                
                // Encabezado del día destacado visualmente
                const trDia = document.createElement('tr');
                trDia.innerHTML = `
                    <td colspan="2" style="background-color: #e2e8f0; font-weight: 700; color: #1e293b; padding: 10px 12px; border-bottom: 2px solid #cbd5e1;">
                        📅 ${dia} (Total: ${formatCOP(data.total)})
                    </td>
                `;
                tbodyGastos.appendChild(trDia);

                // Renderizar categorías del día y sus gastos individuales
                Object.keys(data.categorias).sort().forEach(tipo => {
                    const items = data.categorias[tipo];
                    
                    // Calcular el subtotal de esta categoría en este día
                    const totalCategoria = items.reduce((sum, item) => sum + item.monto, 0);
                    
                    // Fila de la clasificación (Mostrando el subtotal con estilo diferenciado)
                    const trCat = document.createElement('tr');
                    trCat.innerHTML = `
                        <td style="padding-left: 20px; font-weight: 600; color: ${tipo === 'Gastos Administrativos' ? '#3b82f6' : tipo === 'Gasto de Inventario' ? '#7c3aed' : tipo === 'Devolución de Producto' ? '#0891b2' : '#f59e0b'}; padding-top: 8px; padding-bottom: 4px;">
                            📁 ${tipo}
                        </td>
                        <td style="font-weight: 600; color: #64748b; font-size: 0.95em; padding-top: 8px; padding-bottom: 4px; border-bottom: 1px dashed #e2e8f0;">
                            ${formatCOP(totalCategoria)}
                        </td>
                    `;
                    tbodyGastos.appendChild(trCat);

                    // Fila para cada gasto individual
                    items.forEach(item => {
                        const trItem = document.createElement('tr');
                        trItem.innerHTML = `
                            <td style="padding-left: 40px; color: #4b5563; font-size: 0.9em; padding-top: 4px; padding-bottom: 4px;">
                                • ${item.descripcion}${item.sucursal ? ` <span style="color: #cbd5e1; font-size: 0.85em;">(${item.sucursal})</span>` : ''}
                            </td>
                            <td style="font-weight: 500; color: #1e293b; font-size: 0.9em; padding-top: 4px; padding-bottom: 4px;">
                                ${formatCOP(item.monto)}
                            </td>
                        `;
                        tbodyGastos.appendChild(trItem);
                    });
                });
            });
        } else {
            tbodyGastos.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#94a3b8;">Sin gastos registrados</td></tr>';
        }

        // Utilidad Neta
        const utilidad = totalIngresos - totalGastos;
        document.getElementById('kpi-total-ingresos').innerText = formatCOP(totalIngresos);
        const kpiIngresosDesc = document.getElementById('kpi-ingresos-desc');
        if (kpiIngresosDesc) {
            kpiIngresosDesc.innerText = metodoIngreso ? `Filtrado: ${metodoIngreso}` : 'Efectivo + Transferencias';
        }
        document.getElementById('kpi-total-gastos').innerText = formatCOP(totalGastos);
        const kpiGastosDesc = document.getElementById('kpi-gastos-desc');
        if (kpiGastosDesc) {
            const partesFiltro = [tipoGasto, conceptoGasto ? `"${conceptoGasto}"` : ''].filter(Boolean);
            kpiGastosDesc.innerText = partesFiltro.length > 0 ? `Filtrado: ${partesFiltro.join(' - ')}` : 'Operativos + Administrativos';
        }

        const kpiTotalUtilidad = document.getElementById('kpi-total-utilidad');
        kpiTotalUtilidad.innerText = formatCOP(utilidad);
 
        const cardNet = document.getElementById('kpi-card-net');
        cardNet.className = 'kpi-card';
        if (utilidad >= 0) {
            cardNet.classList.add('net-positive');
        } else {
            cardNet.classList.add('net-negative');
        }
    }
 
    // 2. Cargar Ranking de Productos
    const categoriaRanking = document.getElementById('select-categoria-ranking').value;
    const resRanking = await window.api.obtenerRankingProductos({ sucursalId, fechaInicio, fechaFin, categoriaId: categoriaRanking || null });
    if (resRanking.success) {
        datosReporteGlobal.ranking = resRanking.ranking;
        const tbodyRanking = document.querySelector('#table-ranking-productos tbody');
        tbodyRanking.innerHTML = '';
        if (resRanking.ranking && resRanking.ranking.length > 0) {
            resRanking.ranking.forEach((prod, index) => {
                const tr = document.createElement('tr');
                let badgeClass = 'color: #475569;';
                if (index === 0) badgeClass = 'color: #fbbf24; font-size: 1.25rem; font-weight: bold;';
                if (index === 1) badgeClass = 'color: #94a3b8; font-size: 1.15rem; font-weight: bold;';
                if (index === 2) badgeClass = 'color: #b45309; font-size: 1.05rem; font-weight: bold;';
 
                tr.innerHTML = `
                    <td style="text-align: center; ${badgeClass}">#${index + 1}</td>
                    <td><strong>${prod.producto_nombre}</strong></td>
                    <td><span style="background: #e2e8f0; padding: 4px 8px; border-radius: 12px; font-size: 0.85em; font-weight: 500;">${prod.categoria_nombre}</span></td>
                    <td><strong>${prod.total_cantidad} uds</strong></td>
                    <td><strong>${formatCOP(prod.total_ingreso)}</strong></td>
                `;
                tbodyRanking.appendChild(tr);
            });
        } else {
            tbodyRanking.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">No hay ventas de productos en este período.</td></tr>';
        }
    }

    // 3. Si la pestaña de créditos está activa, recargarla también para que respete
    // el mismo período seleccionado (de lo contrario quedaría desactualizada).
    if (document.getElementById('tab-creditos')?.classList.contains('active')) {
        await cargarReporteCreditos();
    }
}

// Variables locales del reporte de créditos
let datosReporteCreditos = { clientes: [], ventas: [], abonos: [] };
let filtroClienteCreditoActual = '';
let clienteAbonoSeleccionadoActual = '';

function poblarSelectClientesCredito(select, placeholderText, valorActual) {
    if (!select) return '';

    const clientes = datosReporteCreditos.clientes || [];
    const valorValido = valorActual && clientes.some(cli => String(cli.id) === String(valorActual))
        ? valorActual
        : '';

    const estabaActivo = document.activeElement === select;
    const opcionesActuales = Array.from(select.options || []).map(opt => ({
        value: opt.value,
        text: opt.textContent
    }));
    const opcionesDeseadas = [
        { value: '', text: placeholderText },
        ...clientes.map(cli => ({
            value: String(cli.id),
            text: `${cli.nombre} (${cli.tipo})`
        }))
    ];
    const mismoContenido = JSON.stringify(opcionesActuales) === JSON.stringify(opcionesDeseadas);

    if (!mismoContenido) {
        const valorPrevio = select.value;
        const fragment = document.createDocumentFragment();
        const optPlaceholder = document.createElement('option');
        optPlaceholder.value = '';
        optPlaceholder.textContent = placeholderText;
        fragment.appendChild(optPlaceholder);

        clientes.forEach(cli => {
            const opt = document.createElement('option');
            opt.value = cli.id;
            opt.textContent = `${cli.nombre} (${cli.tipo})`;
            fragment.appendChild(opt);
        });

        select.replaceChildren(fragment);

        if (valorValido) {
            select.value = valorValido;
        } else if (valorPrevio && Array.from(select.options).some(opt => opt.value === valorPrevio)) {
            select.value = valorPrevio;
        } else {
            select.value = '';
            if (select.options.length > 0) {
                select.selectedIndex = 0;
            }
        }

        if (estabaActivo) {
            requestAnimationFrame(() => {
                select.blur();
                select.focus({ preventScroll: true });
            });
        }
    } else if (valorValido) {
        select.value = valorValido;
    } else {
        select.value = '';
        if (select.options.length > 0) {
            select.selectedIndex = 0;
        }
    }

    return valorValido;
}

async function cargarReporteCreditos() {
    const selectFiltroCliente = document.getElementById('select-filtro-cliente-reporte');
    const abonoClienteSelect = document.getElementById('abono-cliente-select');
    if (!selectFiltroCliente || !abonoClienteSelect) return;

    const sucursalId = document.getElementById('select-sucursal').value;
    const { fechaInicio, fechaFin } = calcularRangoFechasFiltro();
    if (!fechaInicio || !fechaFin) return;
    gFechaInicio = fechaInicio;
    gFechaFin = fechaFin;

    // Obtener los datos desde Electron, respetando el mismo período de los filtros de la página
    const res = await window.api.obtenerReporteCreditos({ sucursalId, fechaInicio, fechaFin });
    if (!res.success) {
        console.error(res.message);
        return;
    }
    
    datosReporteCreditos = res;
    
    const selectedFilterVal = filtroClienteCreditoActual;
    const selectedAbonoVal = clienteAbonoSeleccionadoActual;

    const filterValValido = poblarSelectClientesCredito(
        selectFiltroCliente,
        '-- Todos los Clientes --',
        selectedFilterVal
    );
    const abonoValValido = poblarSelectClientesCredito(
        abonoClienteSelect,
        '-- Seleccionar Cliente --',
        selectedAbonoVal
    );

    filtroClienteCreditoActual = filterValValido;
    clienteAbonoSeleccionadoActual = abonoValValido;
    
    renderizarTabCreditos();
}

function renderizarTabCreditos() {
    const selectFiltroCliente = document.getElementById('select-filtro-cliente-reporte');
    const filterClienteId = selectFiltroCliente ? (selectFiltroCliente.value || filtroClienteCreditoActual) : filtroClienteCreditoActual;
    if (selectFiltroCliente) {
        filtroClienteCreditoActual = selectFiltroCliente.value || '';
    }
    
    // Calcular agregaciones por cliente
    const balancePorCliente = {};
    datosReporteCreditos.clientes.forEach(cli => {
        balancePorCliente[cli.id] = {
            cliente: cli,
            totalCreditos: 0,
            totalAbonos: 0,
            saldo: 0
        };
    });

    // Sumar ventas a crédito
    datosReporteCreditos.ventas.forEach(v => {
        if (balancePorCliente[v.cliente_id]) {
            balancePorCliente[v.cliente_id].totalCreditos += v.total;
        }
    });
    
    // Sumar abonos
    datosReporteCreditos.abonos.forEach(ab => {
        if (balancePorCliente[ab.cliente_id]) {
            balancePorCliente[ab.cliente_id].totalAbonos += ab.monto;
        }
    });
    
    // Calcular saldos y KPIs
    let kpiCreditos = 0;
    let kpiAbonos = 0;
    let kpiSaldo = 0;
    
    const tbodyClientes = document.querySelector('#table-estado-clientes tbody');
    if (tbodyClientes) tbodyClientes.innerHTML = '';
    
    Object.values(balancePorCliente).forEach(item => {
        item.saldo = item.totalCreditos - item.totalAbonos;
        
        // Sumar a los KPIs globales o filtrados
        if (!filterClienteId || item.cliente.id === filterClienteId) {
            kpiCreditos += item.totalCreditos;
            kpiAbonos += item.totalAbonos;
            kpiSaldo += item.saldo;
        }
        
        // Renderizar en la tabla de estados por cliente si no está filtrado
        if (filterClienteId && item.cliente.id !== filterClienteId) return;

        // Solo mostrar clientes con créditos activos (saldo pendiente > 0)
        if (item.saldo <= 0) return;

        if (tbodyClientes) {
            const tr = document.createElement('tr');
            const escId = item.cliente.id.replace(/'/g, "\\'");
            tr.innerHTML = `
                <td><strong>${item.cliente.nombre}</strong></td>
                <td><span style="background: ${item.cliente.tipo === 'Empresa' ? '#dfe7fd' : '#f0ebd8'}; padding: 4px 8px; border-radius: 4px; font-weight: 600; color: #1e293b;">${item.cliente.tipo}</span></td>
                <td>${item.cliente.identificacion || '-'}</td>
                <td style="color: #3b82f6; font-weight: 600;">${formatCOP(item.totalCreditos)}</td>
                <td style="color: #10b981; font-weight: 600;">${formatCOP(item.totalAbonos)}</td>
                <td style="color: ${item.saldo > 0 ? '#ef4444' : '#10b981'}; font-weight: bold;">${formatCOP(item.saldo)}</td>
                <td>
                    <div class="actions-cell" style="display: flex; gap: 6px;">
                        <button class="btn-edit" style="background-color: #10b981;" onclick="iniciarAbonoCliente('${escId}')">💵 Abonar</button>
                        <button class="btn-edit" onclick="verDetalleCliente('${escId}')">🔍 Ver Ventas</button>
                    </div>
                </td>
            `;
            tbodyClientes.appendChild(tr);
        }
    });
    
    // Actualizar KPIs
    const elKpiCred = document.getElementById('kpi-total-creditos');
    const elKpiAb = document.getElementById('kpi-total-abonos');
    const elKpiSaldo = document.getElementById('kpi-saldo-pendiente');
    const cardNetSaldo = document.getElementById('kpi-card-net-saldo');
    
    if (elKpiCred) elKpiCred.innerText = formatCOP(kpiCreditos);
    if (elKpiAb) elKpiAb.innerText = formatCOP(kpiAbonos);
    if (elKpiSaldo) {
        elKpiSaldo.innerText = formatCOP(kpiSaldo);
        if (kpiSaldo > 0) {
            elKpiSaldo.style.color = '#ef4444';
            if (cardNetSaldo) {
                cardNetSaldo.style.backgroundColor = '#fef2f2';
                cardNetSaldo.style.borderLeftColor = '#ef4444';
            }
        } else {
            elKpiSaldo.style.color = '#10b981';
            if (cardNetSaldo) {
                cardNetSaldo.style.backgroundColor = '#f0fdf4';
                cardNetSaldo.style.borderLeftColor = '#10b981';
            }
        }
    }
    
    // Renderizar Historial Detallado de Movimientos (Ventas y Abonos combinados)
    const tbodyMovimientos = document.querySelector('#table-movimientos-creditos tbody');
    if (!tbodyMovimientos) return;
    tbodyMovimientos.innerHTML = '';
    
    const movimientos = [];
    
    // Agregar ventas
    datosReporteCreditos.ventas.forEach(v => {
        const cli = datosReporteCreditos.clientes.find(c => c.id === v.cliente_id);
        if (!cli) return;
        
        // Si hay filtro por cliente y no coincide, ignorar
        if (filterClienteId && v.cliente_id !== filterClienteId) return;
        
        movimientos.push({
            id: v.id,
            fecha: v.fecha,
            clienteNombre: cli.nombre,
            tipo: 'Venta Crédito',
            monto: v.total,
            metodo: v.metodo_pago,
            isVenta: true
        });
    });
    
    // Agregar abonos
    datosReporteCreditos.abonos.forEach(ab => {
        const cli = datosReporteCreditos.clientes.find(c => c.id === ab.cliente_id);
        if (!cli) return;
        
        // Si hay filtro por cliente y no coincide, ignorar
        if (filterClienteId && ab.cliente_id !== filterClienteId) return;
        
        movimientos.push({
            id: ab.id,
            fecha: ab.fecha,
            clienteNombre: cli.nombre,
            tipo: 'Abono Recibido',
            monto: ab.monto,
            metodo: ab.metodo_pago,
            isVenta: false
        });
    });
    
    // Ordenar movimientos por fecha desc
    movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    if (movimientos.length === 0) {
        tbodyMovimientos.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #94a3b8;">No se encontraron movimientos.</td></tr>';
        return;
    }
    
    movimientos.forEach(mov => {
        const tr = document.createElement('tr');
        const fechaLegible = new Date(mov.fecha).toLocaleString('es-CO');
        const escId = mov.id.replace(/'/g, "\\'");
        // Un abono de un día anterior solo lo puede borrar un Administrador (el backend ya lo
        // bloquea, ver 'eliminar-abono' en ipc/registerClientesIpc.js; esto solo evita mostrarle
        // el botón a quien de todas formas recibiría el error al hacer clic).
        const puedeEliminarAbono = !mov.isVenta && (auditoriaRol === 'Administrador' || esFechaDeHoy(mov.fecha));
        const btnDeleteHtml = puedeEliminarAbono
            ? `<button class="btn-delete" onclick="eliminarAbono('${escId}')">🗑️ Borrar</button>`
            : '-';

        tr.innerHTML = `
            <td>${fechaLegible}</td>
            <td><strong>${mov.clienteNombre}</strong></td>
            <td><span style="background: ${mov.isVenta ? '#ffe3e3' : '#d1fae5'}; color: ${mov.isVenta ? '#c53030' : '#065f46'}; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.85em;">${mov.tipo}</span></td>
            <td style="font-size: 0.85em; color: #64748b;">${mov.id.substring(0, 8)}...</td>
            <td style="font-weight: bold; color: ${mov.isVenta ? '#c53030' : '#065f46'};">${mov.isVenta ? '-' : '+'}${formatCOP(mov.monto)}</td>
            <td>${mov.metodo}</td>
            <td>${btnDeleteHtml}</td>
        `;
        tbodyMovimientos.appendChild(tr);
    });
}

window.iniciarAbonoCliente = (clienteId) => {
    const modalAbono = document.getElementById('modal-abono');
    const select = document.getElementById('abono-cliente-select');
    document.getElementById('form-abono').reset();
    document.getElementById('abono-fecha').value = new Date().toISOString().split('T')[0];
    
    if (select) {
        select.value = clienteId;
        clienteAbonoSeleccionadoActual = clienteId;
    }
    if (modalAbono) modalAbono.style.display = 'flex';
};

window.verDetalleCliente = (clienteId) => {
    const modal = document.getElementById('modal-detalle-cliente');
    const tbody = document.querySelector('#table-detalle-cliente tbody');
    if (!modal || !tbody) return;

    const cliente = datosReporteCreditos.clientes.find(c => c.id === clienteId);
    document.getElementById('modal-detalle-cliente-title').innerText = `Ventas a Crédito - ${cliente ? cliente.nombre : ''}`;

    const ventasCliente = datosReporteCreditos.ventas
        .filter(v => v.cliente_id === clienteId)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    tbody.innerHTML = '';
    if (ventasCliente.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#9ca3af;">Sin ventas a crédito registradas.</td></tr>';
    } else {
        ventasCliente.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(v.fecha).toLocaleString('es-CO')}</td>
                <td>${v.productos_vendidos || 'Sin detalle'}</td>
                <td style="color:#3b82f6; font-weight:600;">${formatCOP(v.total)}</td>
                <td>${v.metodo_pago}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    modal.style.display = 'flex';
};

window.eliminarAbono = async (abonoId) => {
    if (confirm("¿Estás seguro de que deseas eliminar este abono? El saldo del cliente se incrementará correspondiente al monto del abono.")) {
        const res = await window.api.eliminarAbono({ id: abonoId, auditoriaUsuario, auditoriaRol });
        alert(res.message);
        if (res.success) {
            await cargarReporteCreditos();
            await cargarReportesGestion(); // Refrescar balance también
            restaurarFocoSelectoresCredito();
        }
    }
};

function exportarCreditosExcel() {
    const selectFiltroCliente = document.getElementById('select-filtro-cliente-reporte');
    const filterClienteId = selectFiltroCliente ? selectFiltroCliente.value : '';
    const filterClienteOpt = selectFiltroCliente ? selectFiltroCliente.selectedOptions[0] : null;
    const clienteNombre = filterClienteOpt ? filterClienteOpt.innerText : 'Todos';
 
    let csvContent = "\uFEFF"; // BOM for Excel UTF-8
    csvContent += `--- REPORTE DE CREDITOS Y ABONOS ---\n`;
    csvContent += `Periodo:;${gFechaInicio} a ${gFechaFin}\n`;
    csvContent += `Cliente Filtrado:;${clienteNombre}\n`;
    csvContent += `Fecha de Exportacion:;${new Date().toLocaleString('es-CO')}\n\n`;
 
    // 1. Estado de Cartera
    csvContent += "--- ESTADO DE CARTERA ---\n";
    csvContent += "Cliente;Tipo;Identificacion;Total Creditos;Total Abonos;Saldo Pendiente\n";

    const balancePorCliente = {};
    datosReporteCreditos.clientes.forEach(cli => {
        balancePorCliente[cli.id] = {
            cliente: cli,
            totalCreditos: 0,
            totalAbonos: 0,
            saldo: 0
        };
    });
    datosReporteCreditos.ventas.forEach(v => {
        if (balancePorCliente[v.cliente_id]) {
            balancePorCliente[v.cliente_id].totalCreditos += v.total;
        }
    });
    datosReporteCreditos.abonos.forEach(ab => {
        if (balancePorCliente[ab.cliente_id]) balancePorCliente[ab.cliente_id].totalAbonos += ab.monto;
    });

    Object.values(balancePorCliente).forEach(item => {
        item.saldo = item.totalCreditos - item.totalAbonos;
        if (filterClienteId && item.cliente.id !== filterClienteId) return;
        csvContent += `${item.cliente.nombre};${item.cliente.tipo};${item.cliente.identificacion || '-'};${item.totalCreditos};${item.totalAbonos};${item.saldo}\n`;
    });
    csvContent += "\n";
 
    // 2. Historial de Movimientos
    csvContent += "--- HISTORIAL DETALLADO DE MOVIMIENTOS ---\n";
    csvContent += "Fecha;Cliente;Tipo Movimiento;Referencia;Monto;Metodo de Pago\n";
 
    const movimientos = [];
    datosReporteCreditos.ventas.forEach(v => {
        const cli = datosReporteCreditos.clientes.find(c => c.id === v.cliente_id);
        if (!cli) return;
        if (filterClienteId && v.cliente_id !== filterClienteId) return;
        movimientos.push({
            fecha: v.fecha,
            clienteNombre: cli.nombre,
            tipo: 'Venta Credito',
            monto: v.total,
            metodo: v.metodo_pago
        });
    });
    datosReporteCreditos.abonos.forEach(ab => {
        const cli = datosReporteCreditos.clientes.find(c => c.id === ab.cliente_id);
        if (!cli) return;
        if (filterClienteId && ab.cliente_id !== filterClienteId) return;
        movimientos.push({
            fecha: ab.fecha,
            clienteNombre: cli.nombre,
            tipo: 'Abono Recibido',
            monto: ab.monto,
            metodo: ab.metodo_pago
        });
    });
    movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
 
    movimientos.forEach(mov => {
        csvContent += `${new Date(mov.fecha).toLocaleString('es-CO')};${mov.clienteNombre};${mov.tipo};${mov.monto};${mov.metodo}\n`;
    });
 
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Creditos_${clienteNombre.replace(/\s+/g, '_')}_${gFechaInicio}_a_${gFechaFin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
