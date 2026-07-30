// Corregir bug de pérdida de foco en Electron al cerrar diálogos nativos en Windows
const originalAlert = window.alert;
window.alert = (msg) => { originalAlert(msg); window.api.forceRefocus(); };
const originalConfirm = window.confirm;
window.confirm = (msg) => { const r = originalConfirm(msg); window.api.forceRefocus(); return r; };

let sucursalId = 'sucursal-norte';
let sucursalDetalle = null; // { id, nombre, direccion, telefono } para el ticket de impresión
let datosReporteGlobal = { ventas: [], gastos: [], transferencias: [] };
const formatCOP = (val) => `${Math.round(val).toLocaleString('es-CO')}`;
let editingGastoId = null; // ID del gasto en edición
let editingVentaId = null; // ID de la venta en edición
let editingVentaCarrito = []; // Productos/cantidades editables de la venta en edición
let editingVentaEsCredito = false; // Si la venta en edición es a crédito (el método de pago queda bloqueado)
let editingVentaMetodoPagoOriginal = ''; // Método de pago tal cual venía de la venta, por si es a crédito y no se toca
let catalogoProductosEdicion = []; // Cache del inventario para el selector "Agregar producto"
let metodoFiltroVentas = 'Todos';

const getMetodoPagoGrupo = (venta) => {
    const metodo = String(venta.metodo_pago || '').trim();
    if (!metodo) return 'Otro';
    if (metodo.startsWith('Mixto')) return 'Mixto';
    if (metodo.startsWith('Transferencia')) return 'Transferencia';
    if (metodo.startsWith('Efectivo')) return 'Efectivo';
    return 'Otro';
};

const filtrarVentasPorMetodo = (ventas, metodo) => {
    if (!metodo || metodo === 'Todos') return ventas;
    if (metodo === 'Transferencia') {
        return ventas.filter(venta => {
            const grupo = getMetodoPagoGrupo(venta);
            return grupo === 'Transferencia' || grupo === 'Mixto';
        });
    }
    return ventas.filter(venta => getMetodoPagoGrupo(venta) === metodo);
};

const formatNumberUI = (val) => {
    const clean = String(val).replace(/\D/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString('es-CO');
};
const parseNumberUI = (str) => {
    return parseFloat(String(str).replace(/\./g, "")) || 0;
};

// Comprobante Informativo (no fiscal) para impresora térmica 58/80mm.
function construirTicketHTML({ ventaId, fecha, items, total, metodoPago }) {
    const nombreSucursal = sucursalDetalle?.nombre || sucursalId;
    const direccion = sucursalDetalle?.direccion || '';
    const telefono = sucursalDetalle?.telefono || '';
    const fechaTexto = new Date(fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

    const filasItems = items.map(item => `
        <tr>
            <td class="col-cant">${item.cantidad}x</td>
            <td>${item.nombre}</td>
            <td class="col-sub">$${formatCOP(item.precio * item.cantidad)}</td>
        </tr>
    `).join('');

    return `
        <div class="ticket-aviso">*** COMPROBANTE INFORMATIVO ***<br>NO ES FACTURA DE VENTA</div>
        <div class="ticket-separador"></div>
        <div class="ticket-centro ticket-negrita">Delipostres Venecia ${nombreSucursal}</div>
        ${direccion ? `<div class="ticket-centro">${direccion}</div>` : ''}
        ${telefono ? `<div class="ticket-centro">Tel: ${telefono}</div>` : ''}
        <div class="ticket-separador"></div>
        <div>Fecha: ${fechaTexto}</div>
        <div>Venta ID: ${String(ventaId || '').slice(0, 8)}</div>
        <div>Método: ${metodoPago}</div>
        <div class="ticket-separador"></div>
        <table class="ticket-tabla">
            <tbody>${filasItems}</tbody>
        </table>
        <div class="ticket-separador"></div>
        <div class="ticket-total">TOTAL: $${formatCOP(total)}</div>
        <div class="ticket-separador"></div>
        <div class="ticket-aviso">*** COMPROBANTE INFORMATIVO ***<br>NO ES FACTURA DE VENTA</div>
    `;
}

let ticketEnPreview = null; // Último ticket mostrado en el modal de vista previa

async function imprimirTicket(datosTicket) {
    const area = document.getElementById('area-ticket-impresion');
    if (area) area.innerHTML = construirTicketHTML(datosTicket);

    const res = await window.api.imprimirTicket({
        ...datosTicket,
        sucursalNombre: sucursalDetalle?.nombre || sucursalId,
        direccion: sucursalDetalle?.direccion || '',
        telefono: sucursalDetalle?.telefono || ''
    });
    if (!res.success) {
        alert(res.message);
    }
}

function mostrarPreviewTicket(datosTicket) {
    ticketEnPreview = datosTicket;
    const contenido = document.getElementById('ticket-preview-contenido');
    const modal = document.getElementById('modal-preview-ticket');
    if (contenido) contenido.innerHTML = construirTicketHTML(datosTicket);
    if (modal) modal.style.display = 'flex';
}

// Vista previa + reimpresión del comprobante de una venta ya registrada (historial del día)
window.imprimirComprobanteHistorial = async (ventaId) => {
    const res = await window.api.obtenerDetalleVenta(ventaId);
    if (!res.success) {
        alert('No se pudo obtener el detalle de la venta: ' + res.message);
        return;
    }
    mostrarPreviewTicket({
        ventaId: res.venta.id,
        fecha: res.venta.fecha,
        items: res.detalle.map(d => ({ nombre: d.nombre || 'Producto', cantidad: d.cantidad, precio: d.precio_unitario })),
        total: res.venta.total,
        metodoPago: res.venta.metodo_pago
    });
};

// Cargar Reporte Diario
async function cargarReporte(fecha) {
    if (!fecha) return;
    const userRole = localStorage.getItem('currentRole') || 'Sin Rol';

    // Obtener las categorías seleccionadas del filtro
    const selectedCats = [];
    const checkboxes = document.querySelectorAll('.cat-checkbox:checked');
    checkboxes.forEach(cb => {
        selectedCats.push(cb.value);
    });

    const selectMetodoVentas = document.getElementById('filtro-metodo-ventas');
    if (selectMetodoVentas) {
        metodoFiltroVentas = selectMetodoVentas.value || 'Todos';
    }

    const response = await window.api.getReporteDiario({ 
        sucursalId, 
        fecha, 
        categoriaIds: selectedCats.length > 0 ? selectedCats : null 
    });

    if (response.success) {
        datosReporteGlobal = {
            ventas: response.ventas || [],
            gastos: response.gastos || [],
            transferencias: response.transferencias || [],
            abonosPedido: response.abonosPedido || []
        };

        const ventasVisibles = filtrarVentasPorMetodo(datosReporteGlobal.ventas, metodoFiltroVentas);

        let totalEfectivo = 0;
        let totalTransferencia = 0;
        let totalGastos = 0;
        let totalGastosEfectivo = 0;

        // 1. Renderizar Tabla Ventas y sumar KPIs
        const tbodyVentas = document.querySelector('#table-ventas-dia tbody');
        const contadorVentasDia = document.getElementById('contador-ventas-dia');
        if (contadorVentasDia) {
            const cantidad = ventasVisibles.length;
            contadorVentasDia.textContent = `(${cantidad} ${cantidad === 1 ? 'movimiento' : 'movimientos'})`;
        }
        if (tbodyVentas) {
            tbodyVentas.innerHTML = '';

            ventasVisibles.forEach(venta => {
                // El dinero de un pedido/apartado entregado ya se contó día a día con sus abonos (ver
                // más abajo), así que la venta que genera la entrega NO se vuelve a sumar aquí -- solo
                // se lista para que quede constancia de qué salió hoy.
                if (venta.es_pedido) {
                    // no suma a totalEfectivo/totalTransferencia
                } else if (venta.metodo_pago === 'Efectivo') {
                    totalEfectivo += venta.total;
                } else if (venta.metodo_pago === 'Transferencia') {
                    totalTransferencia += venta.total;
                } else if (venta.metodo_pago && venta.metodo_pago.startsWith('Mixto')) {
                    const matchEf = venta.metodo_pago.match(/Efectivo:\s*(\d+(\.\d+)?)/);
                    const matchTr = venta.metodo_pago.match(/Transferencia:\s*(\d+(\.\d+)?)/);
                    const cashVal = matchEf ? parseFloat(matchEf[1]) : 0;
                    const transVal = matchTr ? parseFloat(matchTr[1]) : 0;
                    totalEfectivo += cashVal;
                    totalTransferencia += transVal;
                } else {
                    totalTransferencia += venta.total;
                }

                const hora = new Date(venta.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                let botonesEdicion = '';
                if (userRole === 'Administrador' && !venta.es_pedido) {
                    const metodoPagoEscapado = String(venta.metodo_pago || '').replace(/'/g, "\\'");
                    botonesEdicion = `
                        <button class="btn-edit" onclick="iniciarEdicionVenta('${venta.id}', '${metodoPagoEscapado}', ${Number(venta.total || 0)})">✏️ Editar</button>
                        <button class="btn-delete" onclick="eliminarVenta('${venta.id}')">🗑️ Borrar</button>
                    `;
                }
                const tdVentaAcciones = `
                    <td>
                        <div class="actions-cell">
                            <button class="btn-edit" style="background-color: #6b7280;" onclick="imprimirComprobanteHistorial('${venta.id}')" title="Imprimir comprobante informativo">🖨️</button>
                            ${botonesEdicion}
                        </div>
                    </td>
                `;

                let metodoPagoText = venta.metodo_pago;
                let tieneComponenteTransferencia = !!venta.metodo_pago && venta.metodo_pago.startsWith('Transferencia');
                if (venta.metodo_pago && venta.metodo_pago.startsWith('Mixto')) {
                    const matchEf = venta.metodo_pago.match(/Efectivo:\s*(\d+(\.\d+)?)/);
                    const matchTr = venta.metodo_pago.match(/Transferencia:\s*(\d+(\.\d+)?)/);
                    const cashVal = matchEf ? parseFloat(matchEf[1]) : 0;
                    const transVal = matchTr ? parseFloat(matchTr[1]) : 0;
                    metodoPagoText = `Mixto (Efectivo: ${Math.round(cashVal).toLocaleString('es-CO')}, Transferencia: ${Math.round(transVal).toLocaleString('es-CO')})`;
                    tieneComponenteTransferencia = transVal > 0;
                } else if (venta.metodo_pago === 'Crédito') {
                    metodoPagoText = `Crédito (${venta.cliente_nombre || 'Cliente sin registrar'})`;
                }
                if (venta.es_pedido) {
                    metodoPagoText = `📦 Pedido Entregado (ya cobrado en abonos)`;
                }

                let checkboxVerificada = '';
                if (tieneComponenteTransferencia) {
                    checkboxVerificada = `
                        <label style="display:flex; align-items:center; gap:4px; margin-top:4px; font-size:0.85em; color:#4b5563; cursor:pointer;">
                            <input type="checkbox" ${estaTransferenciaVerificadaLocal(venta.id) ? 'checked' : ''}
                                onchange="toggleVerificacionTransferencia('${venta.id}', this.checked)">
                            Verificada en movimientos
                        </label>
                    `;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${hora}</td>
                    <td>
                        ${(venta.productos_vendidos || 'Sin detalles')
                                .split(', ')
                                .map((prod, idx, arr) => `
                                <div style="padding: 3px 0; ${idx < arr.length - 1 ? 'border-bottom: 1px dashed #e5e7eb;' : ''}">
                                    • ${prod}
                                </div>
                            `).join('')}
                    </td>
                    <td>${metodoPagoText}${checkboxVerificada}</td>
                    <td><strong>${formatCOP(venta.total)}</strong></td>
                    ${tdVentaAcciones}
                `;
                tbodyVentas.appendChild(tr);
            });

            if (ventasVisibles.length === 0) {
                const cols = 5;
                const mensaje = metodoFiltroVentas === 'Todos'
                    ? 'No hay ventas hoy.'
                    : `No hay ventas con método ${metodoFiltroVentas.toLowerCase()}.`;
                tbodyVentas.innerHTML = `<tr><td colspan="${cols}" style="text-align:center; color:#9ca3af;">${mensaje}</td></tr>`;
            }
        }

        // 1.5. Abonos de Pedidos recibidos hoy: dinero real cobrado que aún no aparece como venta
        // (el pedido puede entregarse otro día), reconocido el día en que se recibió.
        const tbodyAbonosPedido = document.querySelector('#table-abonos-pedido-dia tbody');
        const abonosPedidoVisibles = (datosReporteGlobal.abonosPedido || []).filter(a => {
            if (metodoFiltroVentas === 'Efectivo') return a.metodo_pago === 'Efectivo';
            if (metodoFiltroVentas === 'Transferencia') return a.metodo_pago !== 'Efectivo';
            return true;
        });
        abonosPedidoVisibles.forEach(abono => {
            if (abono.metodo_pago === 'Efectivo') {
                totalEfectivo += Number(abono.monto);
            } else {
                totalTransferencia += Number(abono.monto);
            }
        });
        if (tbodyAbonosPedido) {
            tbodyAbonosPedido.innerHTML = '';
            if (abonosPedidoVisibles.length > 0) {
                [...abonosPedidoVisibles]
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .forEach(abono => {
                    const hora = new Date(abono.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${hora}</td>
                        <td>${abono.cliente_nombre || '(Sin nombre)'}</td>
                        <td>${abono.metodo_pago}</td>
                        <td><strong>${formatCOP(abono.monto)}</strong></td>
                    `;
                    tbodyAbonosPedido.appendChild(tr);
                });
            } else {
                tbodyAbonosPedido.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#9ca3af;">No hay abonos de pedidos hoy.</td></tr>';
            }
        }

        // 2. Renderizar Tabla Gastos y sumar KPIs
        const tbodyGastos = document.querySelector('#table-gastos-dia tbody');
        if (tbodyGastos) {
            tbodyGastos.innerHTML = '';
            let countGastosVisibles = 0;

            datosReporteGlobal.gastos.forEach(gasto => {
                if (userRole === 'Operador' && gasto.tipo === 'Gastos Administrativos') {
                    return;
                }

                const esNoFinanciero = gasto.tipo === 'Gasto de Inventario' || gasto.tipo === 'Devolución de Producto';
                if (!esNoFinanciero && gasto.tipo !== 'Gastos Administrativos') {
                    totalGastos += gasto.monto;
                }
                const metodoGasto = gasto.metodo_pago || 'Efectivo';
                if (gasto.tipo === 'Operativo' && metodoGasto === 'Efectivo') {
                    totalGastosEfectivo += gasto.monto;
                }
                countGastosVisibles++;

                // Escapar descripción del gasto para llamadas inline
                const escDesc = (gasto.descripcion || '').replace(/'/g, "\\'");

                const isEfectivo = (gasto.metodo_pago || 'Efectivo') === 'Efectivo';
                const etiquetasSinCaja = {
                    'Gastos Administrativos': '🧾 Gasto Administrativo / Sin Caja',
                    'Gasto de Inventario': '📦 Retiro de Inventario / Sin Caja',
                    'Devolución de Producto': '↩️ Devolución de Producto / Sin Caja',
                    'Operativo': '📋 Consumo Interno / Sin Caja'
                };
                const metodoPagoBadge = isEfectivo
                    ? `<span style="color:#dc2626; font-weight:500;">💸 Salida de Efectivo</span>`
                    : `<span style="color:#4b5563; font-weight:500;">${etiquetasSinCaja[gasto.tipo] || 'Sin Movimiento de Caja'}</span>`;

                const coloresTipo = {
                    'Gastos Administrativos': '#3b82f6',
                    'Gasto de Inventario': '#7c3aed',
                    'Devolución de Producto': '#0891b2'
                };
                const colorTipo = coloresTipo[gasto.tipo] || '#f59e0b';

                const tr = document.createElement('tr');
                const valorGasto = esNoFinanciero ? 'Sin impacto financiero' : formatCOP(gasto.monto);
                const esDevolucion = gasto.tipo === 'Devolución de Producto';
                const estadoDevolucion = gasto.estado || 'Pendiente de Respuesta del Proveedor';
                const estadoBadge = esDevolucion
                    ? `<div style="font-size:0.8em; margin-top:2.5px;">${estadoDevolucion === 'Regresada a la Sucursal'
                        ? `<span style="color:#16a34a; font-weight:500;">✅ ${estadoDevolucion}</span>`
                        : estadoDevolucion === 'Rechazada por el Proveedor'
                            ? `<span style="color:#dc2626; font-weight:500;">❌ ${estadoDevolucion}</span>`
                            : `<span style="color:#d97706; font-weight:500;">⏳ ${estadoDevolucion}</span>`}</div>`
                    : '';
                const esDevolucionPendiente = esDevolucion && estadoDevolucion === 'Pendiente de Respuesta del Proveedor';
                const accionesDevolucion = esDevolucionPendiente
                    ? `<button class="btn-edit" onclick="resolverDevolucion('${gasto.id}', 'Regresada a la Sucursal')">📥 Regresó a Sucursal</button>
                       <button class="btn-delete" onclick="resolverDevolucion('${gasto.id}', 'Rechazada por el Proveedor')">❌ Rechazar</button>`
                    : '';
                // El modal de edición solo soporta Gastos Administrativos/Operativo (monto y método de pago);
                // Inventario y Devolución se editan/gestionan por sus propios flujos para no corromper el tipo.
                // "Domicilio (Descuento de Caja)" tampoco se edita/borra aquí: lo genera y reconcilia
                // automáticamente insertarVentaTx/editarVentaCompletaTx (ver services/ventaService.js) según
                // el domicilio de su venta asociada, así que modificarlo desde este listado lo desincronizaría
                // de la venta (la próxima edición de esa venta lo pisaría o duplicaría).
                const esGastoDomicilioAutomatico = gasto.descripcion === 'Domicilio (Descuento de Caja)';
                const botonEditar = (esNoFinanciero || esGastoDomicilioAutomatico)
                    ? ''
                    : `<button class="btn-edit" onclick="iniciarEdicionGasto('${gasto.id}', '${gasto.tipo}', '${escDesc}', ${gasto.monto})">✏️ Editar</button>`;
                const botonBorrar = esGastoDomicilioAutomatico
                    ? ''
                    : `<button class="btn-delete" onclick="eliminarGasto('${gasto.id}')">🗑️ Borrar</button>`;
                const notaAutomatico = esGastoDomicilioAutomatico
                    ? `<span style="color:#9ca3af; font-size:0.85em;">Se gestiona desde la venta</span>`
                    : '';
                tr.innerHTML = `
                    <td>
                        <span style="font-weight:600; color:${colorTipo};">${gasto.tipo}</span>
                        <div style="font-size:0.8em; margin-top:2.5px;">${metodoPagoBadge}</div>
                        ${estadoBadge}
                    </td>
                    <td>${gasto.descripcion}</td>
                    <td><strong>${valorGasto}</strong></td>
                    <td>
                        <div class="actions-cell">
                            ${accionesDevolucion}
                            ${botonEditar}
                            ${botonBorrar}
                            ${notaAutomatico}
                        </div>
                    </td>
                `;
                tbodyGastos.appendChild(tr);
            });

            if (countGastosVisibles === 0) {
                tbodyGastos.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#9ca3af;">No hay gastos hoy.</td></tr>';
            }
        }

        // 2.5. Renderizar Resumen de Ventas por Categoría (Agrupado por Padre)
        const tbodyCats = document.querySelector('#table-categorias-resumen tbody');
        if (tbodyCats) {
            tbodyCats.innerHTML = '';
            if (response.categoriasResumen && response.categoriasResumen.length > 0) {
                // Agrupar en memoria:
                const parentMap = {};

                // 1. Inicializar categorías principales
                response.categoriasResumen.forEach(item => {
                    if (!item.categoria_padre_id) {
                        const pid = item.categoria_id || 'sin-categoria';
                        parentMap[pid] = {
                            id: pid,
                            nombre: item.categoria_nombre,
                            total_cantidad: item.total_cantidad,
                            total_ingreso: item.total_ingreso,
                            subcategorias: []
                        };
                    }
                });

                // 2. Agregar subcategorías a sus categorías principales correspondientes
                response.categoriasResumen.forEach(item => {
                    if (item.categoria_padre_id) {
                        const pid = item.categoria_padre_id;
                        const pName = item.padre_nombre || 'Categoría General';

                        if (!parentMap[pid]) {
                            parentMap[pid] = {
                                id: pid,
                                nombre: pName,
                                total_cantidad: 0,
                                total_ingreso: 0,
                                subcategorias: []
                            };
                        }

                        parentMap[pid].total_cantidad += item.total_cantidad;
                        parentMap[pid].total_ingreso += item.total_ingreso;

                        parentMap[pid].subcategorias.push({
                            id: item.categoria_id,
                            nombre: item.categoria_nombre,
                            total_cantidad: item.total_cantidad,
                            total_ingreso: item.total_ingreso
                        });
                    }
                });

                // 3. Renderizar en orden
                Object.values(parentMap).forEach(parent => {
                    // Renderizar la Categoría General (Padre)
                    const trParent = document.createElement('tr');
                    const folderIcon = parent.id === 'sin-categoria' ? '' : '📁 ';
                    trParent.innerHTML = `
                        <td><strong>${folderIcon}${parent.nombre} (General)</strong></td>
                        <td><strong>${parent.total_cantidad} unidades</strong></td>
                        <td><strong>${formatCOP(parent.total_ingreso)}</strong></td>
                    `;
                    tbodyCats.appendChild(trParent);

                    // Renderizar sus Subcategorías
                    parent.subcategorias.forEach(sub => {
                        const trSub = document.createElement('tr');
                        trSub.innerHTML = `
                            <td style="padding-left: 25px; color: #4b5563;">↳ ${sub.nombre}</td>
                            <td style="color: #4b5563;">${sub.total_cantidad} unidades</td>
                            <td style="color: #4b5563;">${formatCOP(sub.total_ingreso)}</td>
                        `;
                        tbodyCats.appendChild(trSub);
                    });
                });
            } else {
                tbodyCats.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#9ca3af;">No hay datos de categorías hoy.</td></tr>';
            }
        }

        // 2.6. Renderizar Reporte BiBI (Resumen por Producto agrupado por Categoría)
        const tbodyProds = document.querySelector('#table-productos-resumen tbody');
        if (tbodyProds) {
            tbodyProds.innerHTML = '';
            if (response.productosResumen && response.productosResumen.length > 0) {
                // Agrupar productos por categoría
                const agrupadosPorCategoria = {};
                response.productosResumen.forEach(item => {
                    const catName = item.categoria_nombre || 'Sin Categoría';
                    if (!agrupadosPorCategoria[catName]) {
                        agrupadosPorCategoria[catName] = [];
                    }
                    agrupadosPorCategoria[catName].push(item);
                });

                // Renderizar categorías y sus productos
                Object.keys(agrupadosPorCategoria).sort().forEach(catName => {
                    // Fila de encabezado de la categoría
                    const trCat = document.createElement('tr');
                    trCat.innerHTML = `
                        <td colspan="4" style="background-color: #f9fafb; font-weight: 700; color: #1f2937; padding: 10px 15px; border-bottom: 2px solid #e5e7eb;">
                            📂 ${catName}
                        </td>
                    `;
                    tbodyProds.appendChild(trCat);

                    // Filas de productos en esta categoría
                    agrupadosPorCategoria[catName].forEach(item => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td style="padding-left: 30px;">${item.producto_nombre}</td>
                            <td>${item.total_cantidad} unidades</td>
                            <td>${item.stock_actual} unidades</td>
                            <td><strong>${formatCOP(item.total_ingreso)}</strong></td>
                        `;
                        tbodyProds.appendChild(tr);
                    });
                });
            } else {
                tbodyProds.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#9ca3af;">No hay datos de productos hoy.</td></tr>';
            }
        }

        // 2.7. Renderizar Tabla Transferencias
        const tbodyTrans = document.querySelector('#table-transferencias-dia tbody');
        if (tbodyTrans) {
            tbodyTrans.innerHTML = '';
            if (datosReporteGlobal.transferencias && datosReporteGlobal.transferencias.length > 0) {
                [...datosReporteGlobal.transferencias]
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .forEach(trans => {
                    const hora = new Date(trans.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${hora}</td>
                        <td><span style="font-weight:600; color:#ef4444;">${trans.sucursal_origen_id}</span></td>
                        <td><span style="font-weight:600; color:#10b981;">${trans.sucursal_destino_id}</span></td>
                        <td>
                            ${(trans.productos_detalle || 'Sin detalles')
                                .split(', ')
                                .map((prod, idx, arr) => `
                                    <div style="padding: 3px 0; ${idx < arr.length - 1 ? 'border-bottom: 1px dashed #e5e7eb;' : ''}">
                                        • ${prod}
                                    </div>
                                `).join('')}
                        </td>
                        <td>${trans.usuario}</td>
                    `;
                    tbodyTrans.appendChild(tr);
                });
            } else {
                tbodyTrans.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#9ca3af;">No hay transferencias hoy.</td></tr>';
            }
        }

        // 3. Pintar KPIs
        const balanceNeto = (totalEfectivo + totalTransferencia) - totalGastos;
        const efectivoCaja = totalEfectivo - totalGastosEfectivo;

        document.getElementById('kpi-efectivo').innerText = formatCOP(totalEfectivo);
        document.getElementById('kpi-transferencia').innerText = formatCOP(totalTransferencia);
        document.getElementById('kpi-gastos').innerText = formatCOP(totalGastos);

        const kpiBalance = document.getElementById('kpi-balance');
        if (kpiBalance) {
            kpiBalance.innerText = formatCOP(balanceNeto);
            kpiBalance.style.color = balanceNeto >= 0 ? '#10b981' : '#ef4444';
        }

        const kpiEfectivoCaja = document.getElementById('kpi-efectivo-caja');
        if (kpiEfectivoCaja) {
            kpiEfectivoCaja.innerText = formatCOP(efectivoCaja);
            kpiEfectivoCaja.style.color = efectivoCaja >= 0 ? '#10b981' : '#ef4444';
        }

    } else {
        alert("Error al cargar reporte: " + response.message);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Obtener ID de la sucursal actual de la base de datos
    const resId = await window.api.obtenerSucursalId();
    if (resId.success) {
        sucursalId = resId.id;
        const resSucursal = await window.api.obtenerSucursal(sucursalId);
        if (resSucursal.success && resSucursal.data) {
            sucursalDetalle = resSucursal.data;
        }
    }
    const user = localStorage.getItem('currentUser') || 'Invitado';
    const role = localStorage.getItem('currentRole') || 'Sin Rol';
    document.getElementById('display-user').innerText = user;
    document.getElementById('display-role').innerText = role;

    const selectSucs = document.getElementById('select-sucursal-reportes');
    const sucursalFilterGroup = document.getElementById('sucursal-filter-group');

    if (role === 'Administrador') {
        const btnAdmin = document.getElementById('btn-nav-admin');
        if (btnAdmin) btnAdmin.style.display = 'block';

        // Cargar y mostrar selector de sucursales en reportes
        const resSucs = await window.api.obtenerSucursalesDisponibles();
        if (resSucs.success && resSucs.data) {
            if (selectSucs) {
                selectSucs.innerHTML = '';
                resSucs.data.forEach(id => {
                    const opt = document.createElement('option');
                    opt.value = id;
                    opt.innerText = `🏢 ${id === resId.id ? 'Activa: ' : ''}${id}`;
                    selectSucs.appendChild(opt);
                });
                selectSucs.value = sucursalId;
                selectSucs.disabled = false;
                if (sucursalFilterGroup) sucursalFilterGroup.style.display = 'block';

                selectSucs.addEventListener('change', async (e) => {
                    sucursalId = e.target.value;
                    const inputFecha = document.getElementById('fecha-filtro');
                    await cargarReporte(inputFecha.value);
                });
            }
        }
    } else {
        // Para operadores, mostrar el mismo selector pero deshabilitado (solo lectura)
        if (selectSucs) {
            selectSucs.innerHTML = '';
            const opt = document.createElement('option');
            opt.value = sucursalId;
            opt.innerText = `🏢 ${sucursalId}`;
            selectSucs.appendChild(opt);
            selectSucs.value = sucursalId;
            selectSucs.disabled = true; // Deshabilita la interacción
            if (sucursalFilterGroup) sucursalFilterGroup.style.display = 'block';
        }
    }

    // Si es operador, ocultamos opción de Gastos Administrativos en el formulario de edición de gastos
    if (role === 'Operador') {
        const selectTipo = document.getElementById('edit-gasto-tipo');
        if (selectTipo) {
            const optAdministrativo = selectTipo.querySelector('option[value="Gastos Administrativos"]');
            if (optAdministrativo) {
                optAdministrativo.remove();
            }
        }
    }

    // Soporte para menú móvil flotante
    const toggleBtn = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggleBtn) {
                sidebar.classList.remove('open');
            }
        });
    }

    // Configurar el input de fecha al día de hoy por defecto y cargar el reporte
    const inputFecha = document.getElementById('fecha-filtro');
    const selectMetodoVentas = document.getElementById('filtro-metodo-ventas');
    if (inputFecha) {
        const hoy = new Date().toLocaleDateString('sv-SE'); // Formato YYYY-MM-DD
        inputFecha.value = hoy;
        
        inputFecha.addEventListener('change', async (e) => {
            await cargarReporte(e.target.value);
        });
    }

    if (selectMetodoVentas) {
        selectMetodoVentas.value = metodoFiltroVentas;
        selectMetodoVentas.addEventListener('change', async () => {
            metodoFiltroVentas = selectMetodoVentas.value || 'Todos';
            await cargarReporte(inputFecha ? inputFecha.value : '');
        });
    }

    // Cargar categorías y poblar el dropdown
    // const resCats = await window.api.obtenerCategorias();
    // if (resCats.success && resCats.data) {
    //     const dropList = document.getElementById('categorias-dropdown-list');
    //     const btnDrop = document.getElementById('btn-categorias-dropdown');
    //     if (dropList && btnDrop) {
    //         dropList.innerHTML = '';
            
    //         // Opción Sin Categoría
    //         const divSinCat = document.createElement('div');
    //         divSinCat.style.padding = '3px 0';
    //         divSinCat.innerHTML = `
    //             <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.9em;">
    //                 <input type="checkbox" class="cat-checkbox" value="sin-categoria"> Sin Categoría
    //             </label>
    //         `;
    //         dropList.appendChild(divSinCat);

    //         resCats.data.forEach(cat => {
    //             const div = document.createElement('div');
    //             div.style.padding = '3px 0';
    //             div.innerHTML = `
    //                 <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.9em;">
    //                     <input type="checkbox" class="cat-checkbox" value="${cat.id}"> ${cat.nombre}
    //                 </label>
    //             `;
    //             dropList.appendChild(div);
    //         });

    //         btnDrop.addEventListener('click', (e) => {
    //             e.stopPropagation();
    //             dropList.style.display = dropList.style.display === 'none' ? 'block' : 'none';
    //         });

    //         btnDrop.style.display = 'inline-flex';
    //         btnDrop.style.alignItems = 'center';
    //         btnDrop.style.justifyContent = 'center';

    //         document.addEventListener('click', (e) => {
    //             if (!btnDrop.contains(e.target) && !dropList.contains(e.target)) {
    //                 dropList.style.display = 'none';
    //             }
    //         });

    //         dropList.addEventListener('change', async () => {
    //             const checked = document.querySelectorAll('.cat-checkbox:checked');
    //             if (checked.length === 0) {
    //                 btnDrop.innerText = '🏷️ Categorías: Todas';
    //             } else {
    //                 btnDrop.innerText = `🏷️ Categorías: (${checked.length}) seleccionadas`;
    //             }
    //             await cargarReporte(inputFecha.value);
    //         });
    //     }
    // }

    // Cargar reporte por primera vez una vez inicializados los filtros y fecha
    if (inputFecha) {
        await cargarReporte(inputFecha.value);
    }
    // Dos vías para invalidar el reporte tras sincronizar, igual que en las demás vistas:
    // el push IPC 'sincronizacion-completa' (lo emite el proceso principal al terminar
    // CUALQUIER ciclo, manual o automático) y el evento local 'pos-sincronizacion-completa'
    // que dispara el botón del sidebar en esta misma ventana. Si uno de los dos falla en
    // llegar, el otro igual refresca la tabla.
    function refrescarReportePorSincronizacion(origen) {
        console.log(`Sincronización completada (${origen}), actualizando reporte diario...`);
        const inputFecha = document.getElementById('fecha-filtro');
        if (inputFecha && inputFecha.value) {
            cargarReporte(inputFecha.value);
        }
    }
    window.api.onSincronizacionCompleta(() => refrescarReportePorSincronizacion('ipc'));
    window.addEventListener('pos-sincronizacion-completa', () => refrescarReportePorSincronizacion('evento local'));

    // Controles del modal de gastos
    const modalGasto = document.getElementById('modal-gasto');
    const btnCloseGasto = document.getElementById('btn-close-gasto-modal');
    const formGasto = document.getElementById('form-gasto');

    if (btnCloseGasto) {
        btnCloseGasto.addEventListener('click', () => {
            modalGasto.style.display = 'none';
            formGasto.reset();
            editingGastoId = null;
        });
    }

    // Controles del modal de seguimiento de devoluciones (persistente, no depende del día filtrado)
    const modalDevoluciones = document.getElementById('modal-devoluciones');
    const btnAbrirDevoluciones = document.getElementById('btn-abrir-devoluciones');
    const btnCloseDevoluciones = document.getElementById('btn-close-devoluciones-modal');
    const filtroEstadoDevoluciones = document.getElementById('filtro-estado-devoluciones');

    if (btnAbrirDevoluciones) {
        btnAbrirDevoluciones.addEventListener('click', async () => {
            modalDevoluciones.style.display = 'flex';
            if (filtroEstadoDevoluciones) filtroEstadoDevoluciones.value = 'pendientes';
            await cargarDevoluciones();
        });
    }
    if (btnCloseDevoluciones) {
        btnCloseDevoluciones.addEventListener('click', () => {
            modalDevoluciones.style.display = 'none';
        });
    }
    if (filtroEstadoDevoluciones) {
        filtroEstadoDevoluciones.addEventListener('change', renderizarDevoluciones);
    }

    // Controles del modal de ventas
    const modalVenta = document.getElementById('modal-venta');
    const btnCloseVenta = document.getElementById('btn-close-venta-modal');
    const formVenta = document.getElementById('form-venta');

    if (btnCloseVenta) {
        btnCloseVenta.addEventListener('click', () => {
            modalVenta.style.display = 'none';
            formVenta.reset();
            editingVentaId = null;
        });
    }

    // Controles del modal de vista previa del comprobante
    const modalPreviewTicket = document.getElementById('modal-preview-ticket');
    const btnClosePreviewTicket = document.getElementById('btn-close-preview-ticket');
    const btnCerrarPreviewTicket = document.getElementById('btn-cerrar-preview-ticket');
    const btnConfirmarImpresion = document.getElementById('btn-confirmar-impresion');

    const cerrarPreviewTicket = () => {
        if (modalPreviewTicket) modalPreviewTicket.style.display = 'none';
    };
    if (btnClosePreviewTicket) btnClosePreviewTicket.addEventListener('click', cerrarPreviewTicket);
    if (btnCerrarPreviewTicket) btnCerrarPreviewTicket.addEventListener('click', cerrarPreviewTicket);
    if (btnConfirmarImpresion) {
        btnConfirmarImpresion.addEventListener('click', () => {
            if (ticketEnPreview) imprimirTicket(ticketEnPreview);
        });
    }

    const editGastoMontoInput = document.getElementById('edit-gasto-monto');
    if (editGastoMontoInput) {
        editGastoMontoInput.addEventListener('input', (e) => {
            e.target.value = formatNumberUI(e.target.value);
        });
        editGastoMontoInput.addEventListener('focus', function () {
            this.select();
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalGasto) {
            modalGasto.style.display = 'none';
            formGasto.reset();
            editingGastoId = null;
        }
        if (e.target === modalVenta) {
            modalVenta.style.display = 'none';
            formVenta.reset();
            editingVentaId = null;
        }
    });

    // Formulario de edición de gastos
    if (formGasto) {
        formGasto.addEventListener('submit', async (e) => {
            e.preventDefault();

            const tipo = document.getElementById('edit-gasto-tipo').value;
            const metodoPago = tipo === 'Operativo' ? 'Efectivo' : 'Sin Movimiento';
            const descripcion = document.getElementById('edit-gasto-descripcion').value.trim();
            const monto = parseNumberUI(document.getElementById('edit-gasto-monto').value);

            if (isNaN(monto) || monto <= 0 || !descripcion) {
                alert("Por favor, introduce valores válidos.");
                return;
            }

            const user = localStorage.getItem('currentUser') || 'Invitado';
            const role = localStorage.getItem('currentRole') || 'Sin Rol';

            const response = await window.api.editarGasto({
                id: editingGastoId,
                tipo,
                metodoPago,
                descripcion,
                monto,
                auditoriaUsuario: user,
                auditoriaRol: role
            });

            if (response.success) {
                alert(response.message);
                modalGasto.style.display = 'none';
                formGasto.reset();
                editingGastoId = null;
                await cargarReporte(inputFecha.value);
            } else {
                alert("Error al editar gasto: " + response.message);
            }
        });

    }

    // Formulario de edición de ventas
    const editVentaMetodo = document.getElementById('edit-venta-metodo');
    const ventaMixtaFields = document.getElementById('venta-mixta-fields');
    const editVentaEfectivo = document.getElementById('edit-venta-efectivo');
    const editVentaTransferencia = document.getElementById('edit-venta-transferencia');
    const editVentaChkDomicilio = document.getElementById('edit-venta-chk-domicilio');
    const editVentaDomicilioContainer = document.getElementById('edit-venta-domicilio-container');
    const editVentaInputDomicilio = document.getElementById('edit-venta-input-domicilio');

    if (editVentaChkDomicilio) {
        editVentaChkDomicilio.addEventListener('change', () => {
            if (editingVentaEsCredito) return;
            const marcado = editVentaChkDomicilio.checked;
            if (editVentaDomicilioContainer) editVentaDomicilioContainer.style.display = marcado ? 'block' : 'none';
            // Los domicilios siempre se pagan por transferencia (misma regla que en Nueva Venta).
            if (editVentaMetodo) {
                if (marcado) editVentaMetodo.value = 'Transferencia';
                editVentaMetodo.disabled = marcado;
            }
            if (ventaMixtaFields && marcado) ventaMixtaFields.style.display = 'none';
            if (marcado && editVentaInputDomicilio) {
                editVentaInputDomicilio.value = '';
                editVentaInputDomicilio.focus();
            } else if (!marcado && editVentaInputDomicilio) {
                editVentaInputDomicilio.value = '';
            }
            renderizarItemsEdicionVenta();
        });
    }
    if (editVentaInputDomicilio) {
        editVentaInputDomicilio.addEventListener('input', (e) => {
            e.target.value = formatNumberUI(e.target.value);
            renderizarItemsEdicionVenta();
        });
        editVentaInputDomicilio.addEventListener('focus', function () { this.select(); });
    }

    const sincronizarCamposMixtos = () => {
        if (!editVentaMetodo || editVentaMetodo.value !== 'Mixto' || !editVentaEfectivo || !editVentaTransferencia) return;
        const total = calcularTotalEdicionVenta();
        const efectivoActual = parseNumberUI(editVentaEfectivo.value);
        const transferenciaActual = parseNumberUI(editVentaTransferencia.value);

        if (document.activeElement === editVentaEfectivo) {
            const nuevoValorTransferencia = Math.max(0, total - efectivoActual);
            editVentaTransferencia.value = formatNumberUI(nuevoValorTransferencia);
        } else if (document.activeElement === editVentaTransferencia) {
            const nuevoValorEfectivo = Math.max(0, total - transferenciaActual);
            editVentaEfectivo.value = formatNumberUI(nuevoValorEfectivo);
        }
    };

    if (editVentaMetodo) {
        editVentaMetodo.addEventListener('change', () => {
            const isMixto = editVentaMetodo.value === 'Mixto';
            if (ventaMixtaFields) {
                ventaMixtaFields.style.display = isMixto ? 'flex' : 'none';
            }
        });
    }

    if (editVentaEfectivo) {
        editVentaEfectivo.addEventListener('input', sincronizarCamposMixtos);
        editVentaEfectivo.addEventListener('focus', function () { this.select(); });
    }
    if (editVentaTransferencia) {
        editVentaTransferencia.addEventListener('input', sincronizarCamposMixtos);
        editVentaTransferencia.addEventListener('focus', function () { this.select(); });
    }

    if (formVenta) {
        formVenta.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (editingVentaCarrito.length === 0) {
                alert('La venta debe tener al menos un producto.');
                return;
            }

            const user = localStorage.getItem('currentUser') || 'Invitado';
            const role = localStorage.getItem('currentRole') || 'Sin Rol';

            let metodoPagoValue;
            let valorDomicilio = 0;
            if (editingVentaEsCredito) {
                // El método de pago de una venta a crédito no se edita desde este modal: se conserva
                // tal cual venía (incluye el sufijo de domicilio si lo tenía).
                metodoPagoValue = editingVentaMetodoPagoOriginal || 'Crédito';
                const matchDomOriginal = editingVentaMetodoPagoOriginal.match(/\(Domicilio:\s*\$?([\d.,]+)\)/);
                if (matchDomOriginal) valorDomicilio = parseNumberUI(matchDomOriginal[1]);
            } else {
                const metodoPago = editVentaMetodo.value;
                if (!metodoPago) {
                    alert('Selecciona un método de pago válido.');
                    return;
                }
                metodoPagoValue = metodoPago;
                if (metodoPago === 'Mixto') {
                    const efectivo = parseNumberUI(editVentaEfectivo ? editVentaEfectivo.value : '0');
                    const transferencia = parseNumberUI(editVentaTransferencia ? editVentaTransferencia.value : '0');
                    if (efectivo < 0 || transferencia < 0) {
                        alert('Los valores de efectivo y transferencia no pueden ser negativos.');
                        return;
                    }
                    metodoPagoValue = `Mixto (Efectivo: ${efectivo}, Transferencia: ${transferencia})`;
                }

                if (editVentaChkDomicilio && editVentaChkDomicilio.checked) {
                    valorDomicilio = parseNumberUI(editVentaInputDomicilio ? editVentaInputDomicilio.value : '0');
                    if (valorDomicilio <= 0) {
                        alert('Ingresa el valor del domicilio.');
                        return;
                    }
                    metodoPagoValue += ` (Domicilio: ${formatCOP(valorDomicilio)})`;
                }
            }

            const response = await window.api.editarVenta({
                id: editingVentaId,
                metodoPago: metodoPagoValue,
                carrito: editingVentaCarrito,
                valorDomicilio,
                auditoriaUsuario: user,
                auditoriaRol: role
            });

            if (response.success) {
                alert(response.message);
                modalVenta.style.display = 'none';
                formVenta.reset();
                editingVentaId = null;
                editingVentaCarrito = [];
                editingVentaEsCredito = false;
                editingVentaMetodoPagoOriginal = '';
                if (editVentaDomicilioContainer) editVentaDomicilioContainer.style.display = 'none';
                if (editVentaMetodo) editVentaMetodo.disabled = false;
                if (editVentaChkDomicilio) editVentaChkDomicilio.disabled = false;
                await cargarReporte(inputFecha.value);
            } else {
                alert("Error al editar venta: " + response.message);
            }
        });
    }

    // EXPORTACIÓN LOCAL TOTALMENTE OFFLINE A CSV (Compatible nativamente con Microsoft Excel)
    const btnExportar = document.getElementById('btn-exportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            const { ventas, gastos, transferencias, abonosPedido } = datosReporteGlobal;

            if (!ventas && !gastos && !transferencias) {
                alert("No hay datos para exportar.");
                return;
            }

            // Usar punto y coma ';' como delimitador y agregar BOM \uFEFF para que Excel lo abra correctamente
            let csvContent = "\uFEFF";

            // Encabezado de Ventas
            csvContent += "--- REPORTE DE VENTAS ---\n";
            csvContent += "ID Venta;Productos Vendidos;Metodo Pago;Total;Fecha\n";
            if (ventas) {
                ventas.forEach(v => {
                    const prodsEscaped = `"${(v.productos_vendidos || '').replace(/"/g, '""').replace(/;/g, ',')}"`;
                    const metodo = v.es_pedido ? 'Pedido Entregado (ya cobrado en abonos)' : v.metodo_pago;
                    csvContent += `${v.id};${prodsEscaped};${metodo};${v.total};${v.fecha}\n`;
                });
            }

            csvContent += "\n--- REPORTE DE ABONOS DE PEDIDOS ---\n";
            csvContent += "ID Abono;Cliente;Metodo Pago;Monto;Fecha\n";
            if (abonosPedido) {
                abonosPedido.forEach(a => {
                    csvContent += `${a.id};${a.cliente_nombre || ''};${a.metodo_pago};${a.monto};${a.fecha}\n`;
                });
            }

            csvContent += "\n--- REPORTE DE GASTOS ---\n";
            csvContent += "ID Gasto;Clasificacion;Descripcion;Monto;Fecha\n";
            if (gastos) {
                gastos.forEach(g => {
                    if (role === 'Operador' && g.tipo === 'Gastos Administrativos') {
                        return;
                    }
                    const descEscaped = `"${(g.descripcion || '').replace(/"/g, '""').replace(/;/g, ',')}"`;
                    csvContent += `${g.id};${g.tipo};${descEscaped};${g.monto};${g.fecha}\n`;
                });
            }

            csvContent += "\n--- REPORTE DE TRANSFERENCIAS ---\n";
            csvContent += "ID Transferencia;Origen;Destino;Productos;Usuario;Fecha\n";
            if (transferencias) {
                transferencias.forEach(t => {
                    const prodsEscaped = `"${(t.productos_detalle || '').replace(/"/g, '""').replace(/;/g, ',')}"`;
                    csvContent += `${t.id};${t.sucursal_origen_id};${t.sucursal_destino_id};${prodsEscaped};${t.usuario};${t.fecha}\n`;
                });
            }

            // Crear un Blob de tipo CSV y descargarlo
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Reporte_POS_${document.getElementById('fecha-filtro').value}.csv`);
            document.body.appendChild(link);

            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }

    // EXPORTACIÓN A PDF NATIVA EN ELECTRON
    const btnPdf = document.getElementById('btn-pdf');
    if (btnPdf) {
        btnPdf.addEventListener('click', async () => {
            const response = await window.api.exportarPDF();
            if (!response.success && response.message !== 'Exportación cancelada.') {
                alert(response.message);
            }
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
});

// Funciones globales expuestas para los callbacks inline (onclick) en la tabla
window.iniciarEdicionGasto = function(id, tipo, descripcion, monto) {
    editingGastoId = id;
    const modalGasto = document.getElementById('modal-gasto');
    if (modalGasto) {
        document.getElementById('edit-gasto-tipo').value = tipo;
        document.getElementById('edit-gasto-descripcion').value = descripcion;
        document.getElementById('edit-gasto-monto').value = formatNumberUI(monto);

        modalGasto.style.display = 'block';
    }
};

// Checkbox puramente visual: marca en este PC (localStorage) que una venta por Transferencia ya
// se verificó contra los movimientos bancarios. No se guarda en la base de datos ni se sincroniza
// entre equipos/sucursales -- cada terminal lleva su propia marca.
const LS_KEY_TRANSFERENCIAS_VERIFICADAS = 'transferenciasVerificadasLocal';

function obtenerTransferenciasVerificadasLocal() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY_TRANSFERENCIAS_VERIFICADAS) || '{}');
    } catch {
        return {};
    }
}

function estaTransferenciaVerificadaLocal(ventaId) {
    return !!obtenerTransferenciasVerificadasLocal()[ventaId];
}

window.toggleVerificacionTransferencia = function(ventaId, checked) {
    const marcadas = obtenerTransferenciasVerificadasLocal();
    if (checked) {
        marcadas[ventaId] = true;
    } else {
        delete marcadas[ventaId];
    }
    localStorage.setItem(LS_KEY_TRANSFERENCIAS_VERIFICADAS, JSON.stringify(marcadas));
};

window.resolverDevolucion = async function(id, nuevoEstado) {
    const mensajeConfirmacion = nuevoEstado === 'Regresada a la Sucursal'
        ? '¿Confirmas que el proveedor regresó el producto a la sucursal? Esto reingresará la cantidad al inventario.'
        : '¿Confirmas que el proveedor rechazó la devolución (el producto se queda con ellos)? El stock no se modificará.';
    if (confirm(mensajeConfirmacion)) {
        const user = localStorage.getItem('currentUser') || 'Invitado';
        const role = localStorage.getItem('currentRole') || 'Sin Rol';
        const response = await window.api.actualizarEstadoDevolucion({ id, nuevoEstado, auditoriaUsuario: user, auditoriaRol: role });
        if (response.success) {
            alert(response.message);
            const inputFecha = document.getElementById('fecha-filtro');
            await cargarReporte(inputFecha.value);
            const modalDevoluciones = document.getElementById('modal-devoluciones');
            if (modalDevoluciones && modalDevoluciones.style.display === 'flex') {
                await cargarDevoluciones();
            }
        } else {
            alert(response.message);
        }
    }
};

// Seguimiento de devoluciones: vista independiente del día filtrado en el reporte diario,
// para que una devolución pendiente no "desaparezca" al cambiar de fecha.
let devolucionesCache = [];

async function cargarDevoluciones() {
    const tbody = document.querySelector('#table-devoluciones tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#9ca3af;">Cargando...</td></tr>';

    const response = await window.api.obtenerReporteDevoluciones({ sucursalId });
    if (!response.success) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#dc2626;">${response.message}</td></tr>`;
        return;
    }

    const { devoluciones, resumen } = response;
    devolucionesCache = devoluciones || [];
    document.getElementById('resumen-devoluciones-pendientes').innerText = resumen.pendientes;
    document.getElementById('resumen-devoluciones-devueltas').innerText = resumen.devueltas;
    document.getElementById('resumen-devoluciones-rechazadas').innerText = resumen.rechazadas;

    renderizarDevoluciones();
}

function renderizarDevoluciones() {
    const tbody = document.querySelector('#table-devoluciones tbody');
    if (!tbody) return;

    const selectEstado = document.getElementById('filtro-estado-devoluciones');
    const estadoFiltro = selectEstado ? selectEstado.value : 'pendientes';
    // Cualquier estado que no sea "Devuelta" ni "Rechazada" cuenta como pendiente (mismo criterio
    // que el resumen del backend), porque en datos históricos el texto exacto de "pendiente" varió.
    const devoluciones = estadoFiltro === 'todas'
        ? devolucionesCache
        : estadoFiltro === 'pendientes'
            ? devolucionesCache.filter(d => d.estado !== 'Regresada a la Sucursal' && d.estado !== 'Rechazada por el Proveedor')
            : devolucionesCache.filter(d => d.estado === estadoFiltro);

    tbody.innerHTML = '';
    if (!devoluciones || devoluciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#9ca3af;">No hay devoluciones registradas.</td></tr>';
        return;
    }

    devoluciones.forEach((d) => {
        const estadoBadge = d.estado === 'Regresada a la Sucursal'
            ? `<span style="color:#16a34a; font-weight:500;">✅ ${d.estado}</span>`
            : d.estado === 'Rechazada por el Proveedor'
                ? `<span style="color:#dc2626; font-weight:500;">❌ ${d.estado}</span>`
                : `<span style="color:#d97706; font-weight:500;">⏳ ${d.estado}</span>`;
        const accion = d.estado === 'Regresada a la Sucursal' || d.estado === 'Rechazada por el Proveedor'
            ? ''
            : `<button class="btn-edit" onclick="resolverDevolucion('${d.id}', 'Regresada a la Sucursal')">📥 Regresó</button>
               <button class="btn-delete" onclick="resolverDevolucion('${d.id}', 'Rechazada por el Proveedor')">❌ Rechazar</button>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${d.dia}</td>
            <td>${d.descripcion}</td>
            <td>${estadoBadge}</td>
            <td><div class="actions-cell">${accion}</div></td>
        `;
        tbody.appendChild(tr);
    });
}

window.eliminarGasto = async function(id) {
    if (confirm("¿Estás seguro de que deseas borrar este gasto?")) {
        const user = localStorage.getItem('currentUser') || 'Invitado';
        const role = localStorage.getItem('currentRole') || 'Sin Rol';
        const response = await window.api.eliminarGasto({ id, auditoriaUsuario: user, auditoriaRol: role });
        if (response.success) {
            alert(response.message);
            const inputFecha = document.getElementById('fecha-filtro');
            await cargarReporte(inputFecha.value);
        } else {
            alert(response.message);
        }
    }
};

function calcularTotalEdicionVenta() {
    const subtotalProductos = editingVentaCarrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const chkDomicilio = document.getElementById('edit-venta-chk-domicilio');
    const inputDomicilio = document.getElementById('edit-venta-input-domicilio');
    const valorDomicilio = (chkDomicilio && chkDomicilio.checked && inputDomicilio) ? parseNumberUI(inputDomicilio.value) : 0;
    return subtotalProductos + valorDomicilio;
}

function renderizarItemsEdicionVenta() {
    const cont = document.getElementById('edit-venta-items');
    if (cont) {
        cont.innerHTML = editingVentaCarrito.length === 0
            ? '<p style="color:#6b7280; text-align:center; margin:10px 0;">Sin productos.</p>'
            : editingVentaCarrito.map((item, idx) => `
                <div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px dashed #e5e7eb;">
                    <div style="flex:1; font-size:0.85em;">${item.nombre}<br><span style="color:#6b7280;">$${formatCOP(item.precio)} c/u</span></div>
                    <button type="button" class="btn-edit" style="padding:2px 8px;" onclick="cambiarCantidadEdicionVenta(${idx}, -1)">-</button>
                    <span style="min-width:22px; text-align:center;">${item.cantidad}</span>
                    <button type="button" class="btn-edit" style="padding:2px 8px;" onclick="cambiarCantidadEdicionVenta(${idx}, 1)">+</button>
                    <div style="min-width:70px; text-align:right; font-weight:600;">$${formatCOP(item.precio * item.cantidad)}</div>
                    <button type="button" class="btn-delete" style="padding:4px 8px;" onclick="eliminarItemEdicionVenta(${idx})">✕</button>
                </div>
            `).join('');
    }
    const totalEl = document.getElementById('edit-venta-total-productos');
    if (totalEl) totalEl.innerText = `$${formatCOP(calcularTotalEdicionVenta())}`;
}

window.cambiarCantidadEdicionVenta = function (idx, delta) {
    const item = editingVentaCarrito[idx];
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) editingVentaCarrito.splice(idx, 1);
    renderizarItemsEdicionVenta();
};

window.eliminarItemEdicionVenta = function (idx) {
    editingVentaCarrito.splice(idx, 1);
    renderizarItemsEdicionVenta();
};

window.agregarProductoEdicionVenta = function () {
    const input = document.getElementById('edit-venta-input-producto');
    if (!input || !input.value.trim()) return;
    const texto = input.value.trim().toLowerCase();
    const prod = catalogoProductosEdicion.find(p => (p.nombre || '').trim().toLowerCase() === texto);
    if (!prod) {
        alert('Selecciona un producto válido de la lista.');
        return;
    }
    const existente = editingVentaCarrito.find(i => i.id === prod.id);
    if (existente) {
        existente.cantidad += 1;
    } else {
        editingVentaCarrito.push({ id: prod.id, nombre: prod.nombre, precio: Number(prod.precio || 0), cantidad: 1 });
    }
    input.value = '';
    renderizarItemsEdicionVenta();
};

async function cargarCatalogoEdicionVenta() {
    if (catalogoProductosEdicion.length > 0) return;
    const res = await window.api.getInventory(sucursalId);
    if (res.success) {
        catalogoProductosEdicion = (res.data || []).slice().sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
        const datalist = document.getElementById('datalist-edit-venta-productos');
        if (datalist) {
            datalist.innerHTML = catalogoProductosEdicion
                .map(p => `<option value="${p.nombre}">${p.nombre} — $${formatCOP(p.precio)}</option>`)
                .join('');
        }
    }
}

window.iniciarEdicionVenta = async function(id, metodoPago) {
    editingVentaId = id;
    const modalVenta = document.getElementById('modal-venta');
    const editVentaMetodo = document.getElementById('edit-venta-metodo');
    const ventaMixtaFields = document.getElementById('venta-mixta-fields');
    const editVentaEfectivo = document.getElementById('edit-venta-efectivo');
    const editVentaTransferencia = document.getElementById('edit-venta-transferencia');
    const chkDomicilio = document.getElementById('edit-venta-chk-domicilio');
    const domicilioContainer = document.getElementById('edit-venta-domicilio-container');
    const inputDomicilio = document.getElementById('edit-venta-input-domicilio');
    const avisoCredito = document.getElementById('edit-venta-credito-aviso');

    const resDetalle = await window.api.obtenerDetalleVenta(id);
    if (!resDetalle.success) {
        alert('No se pudo cargar el detalle de la venta: ' + resDetalle.message);
        return;
    }
    editingVentaCarrito = resDetalle.detalle.map(det => ({
        id: det.producto_id,
        nombre: det.nombre || 'Producto eliminado',
        precio: Number(det.precio_unitario || 0),
        cantidad: Number(det.cantidad || 0)
    }));
    await cargarCatalogoEdicionVenta();

    if (modalVenta) {
        // El domicilio se guarda como sufijo "(Domicilio: $X)" dentro de metodo_pago. Hay que
        // separarlo ANTES de mapear al <select>: si se deja pegado, el valor completo no matchea
        // ninguna <option>, el <select> queda sin selección (value=""), y al guardar eso borraba
        // el método de pago de la venta.
        editingVentaMetodoPagoOriginal = String(metodoPago || '').trim();
        let metodoBase = editingVentaMetodoPagoOriginal;
        const matchDomicilio = metodoBase.match(/\(Domicilio:\s*\$?([\d.,]+)\)/);
        const valorDomicilioDetectado = matchDomicilio ? parseNumberUI(matchDomicilio[1]) : 0;
        if (matchDomicilio) {
            metodoBase = metodoBase.replace(/\s*\(Domicilio:.*?\)/, '').trim();
        }

        editingVentaEsCredito = metodoBase === 'Crédito';

        if (chkDomicilio) {
            chkDomicilio.checked = !!matchDomicilio;
            chkDomicilio.disabled = editingVentaEsCredito;
        }
        if (domicilioContainer) domicilioContainer.style.display = matchDomicilio ? 'block' : 'none';
        if (inputDomicilio) inputDomicilio.value = matchDomicilio ? formatNumberUI(valorDomicilioDetectado) : '';
        if (avisoCredito) avisoCredito.style.display = editingVentaEsCredito ? 'block' : 'none';

        const isMixto = metodoBase.startsWith('Mixto');
        if (editVentaMetodo) {
            // Los domicilios siempre se pagan por transferencia (misma regla que en Nueva Venta).
            editVentaMetodo.value = matchDomicilio ? 'Transferencia' : (isMixto ? 'Mixto' : (metodoBase || 'Efectivo'));
            editVentaMetodo.disabled = editingVentaEsCredito || !!matchDomicilio;
        }

        if (ventaMixtaFields) {
            ventaMixtaFields.style.display = (isMixto && !matchDomicilio) ? 'flex' : 'none';
        }

        if (isMixto && !matchDomicilio) {
            const matchEf = metodoBase.match(/Efectivo:\s*(\d+(?:\.\d+)?)/);
            const matchTr = metodoBase.match(/Transferencia:\s*(\d+(?:\.\d+)?)/);
            const efectivoInicial = matchEf ? parseFloat(matchEf[1]) : 0;
            const transferenciaInicial = matchTr ? parseFloat(matchTr[1]) : 0;
            if (editVentaEfectivo) {
                editVentaEfectivo.value = formatNumberUI(efectivoInicial);
            }
            if (editVentaTransferencia) {
                editVentaTransferencia.value = formatNumberUI(transferenciaInicial);
            }
        } else {
            if (editVentaEfectivo) editVentaEfectivo.value = '';
            if (editVentaTransferencia) editVentaTransferencia.value = '';
        }

        renderizarItemsEdicionVenta();
        modalVenta.style.display = 'flex';
    }
};

window.eliminarVenta = async function(id) {
    if (confirm("¿Estás seguro de que deseas borrar esta venta? Se devolverán los productos al inventario.")) {
        const user = localStorage.getItem('currentUser') || 'Invitado';
        const role = localStorage.getItem('currentRole') || 'Sin Rol';
        const response = await window.api.eliminarVenta({ id, auditoriaUsuario: user, auditoriaRol: role });
        if (response.success) {
            alert(response.message);
            const inputFecha = document.getElementById('fecha-filtro');
            await cargarReporte(inputFecha.value);
        } else {
            alert(response.message);
        }
    }
};