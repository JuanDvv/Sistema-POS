const { ipcMain, BrowserWindow, dialog, app } = require('electron');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db, runQuery, allQuery } = require('../db/connection');
const { formatearCOP, sanitizarNombreArchivo, construirHtmlCuentaCobro, extraerDomicilioDeMetodoPago } = require('../services/pdfHelpers');
const { registrarAuditoria } = require('../services/auditService');
const { obtenerFechaHoyYYYYMMDD } = require('../services/fechaService');

// SRP: clientes, créditos, abonos y su cuenta de cobro en PDF.

function registerClientesIpc() {
    // Módulo de clientes para créditos
    ipcMain.handle('obtener-clientes', async () => {
        try {
            const rows = await allQuery(`SELECT * FROM clientes WHERE sync_status IS NULL OR sync_status <> 'deleted'`, []);
            return { success: true, data: rows };
        } catch (err) {
            return { success: false, message: 'Error al obtener clientes: ' + err.message };
        }
    });

    ipcMain.handle('guardar-cliente', async (event, datos) => {
        const { id, nombre, tipo, identificacion, telefono, email, categoria, auditoriaUsuario, auditoriaRol } = datos;
        const categoriaFinal = categoria || 'Normal';
        try {
            if (id) {
                await runQuery(
                    `UPDATE clientes SET nombre = ?, tipo = ?, identificacion = ?, telefono = ?, email = ?, categoria = ?, sync_status = 'pending' WHERE id = ?`,
                    [nombre, tipo, identificacion, telefono, email, categoriaFinal, id]
                );
                await registrarAuditoria(auditoriaUsuario, auditoriaRol, 'Administración', 'Editar Cliente', `Nombre: ${nombre} - ID: ${id}`);
                return { success: true, message: 'Cliente actualizado exitosamente.' };
            } else {
                const nuevoId = 'cli-' + uuidv4().substring(0, 8);
                await runQuery(
                    `INSERT INTO clientes (id, nombre, tipo, identificacion, telefono, email, origen, categoria, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'Credito', ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                    [nuevoId, nombre, tipo, identificacion, telefono, email, categoriaFinal]
                );
                await registrarAuditoria(auditoriaUsuario, auditoriaRol, 'Administración', 'Crear Cliente', `Nombre: ${nombre} - ID: ${nuevoId}`);
                return { success: true, message: 'Cliente creado exitosamente.', clienteId: nuevoId };
            }
        } catch (err) {
            return { success: false, message: 'Error al guardar cliente: ' + err.message };
        }
    });

    ipcMain.handle('eliminar-cliente', async (event, datos) => {
        const { id, nombre, auditoriaUsuario, auditoriaRol } = datos;
        try {
            await runQuery(`UPDATE clientes SET sync_status = 'deleted' WHERE id = ?`, [id]);
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, 'Administración', 'Eliminar Cliente', `Nombre: ${nombre} - ID: ${id}`);
            return { success: true, message: 'Cliente eliminado exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al eliminar cliente: ' + err.message };
        }
    });

    ipcMain.handle('obtener-abonos', async (event, clienteId) => {
        try {
            let rows;
            if (clienteId) {
                rows = await allQuery(`SELECT a.*, c.nombre as cliente_nombre FROM abonos_credito a JOIN clientes c ON a.cliente_id = c.id WHERE a.cliente_id = ? AND (a.sync_status IS NULL OR a.sync_status <> 'deleted')`, [clienteId]);
            } else {
                rows = await allQuery(`SELECT a.*, c.nombre as cliente_nombre FROM abonos_credito a JOIN clientes c ON a.cliente_id = c.id WHERE (a.sync_status IS NULL OR a.sync_status <> 'deleted')`, []);
            }
            return { success: true, data: rows };
        } catch (err) {
            return { success: false, message: 'Error al obtener abonos: ' + err.message };
        }
    });

    ipcMain.handle('registrar-abono', async (event, datos) => {
        const { clienteId, monto, metodoPago, fecha } = datos;
        const abonoId = 'ab-' + uuidv4().substring(0, 8);
        const fechaActual = fecha || new Date().toISOString();
        try {
            await runQuery(
                `INSERT INTO abonos_credito (id, cliente_id, monto, fecha, metodo_pago, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                [abonoId, clienteId, monto, fechaActual, metodoPago]
            );
            return { success: true, message: 'Abono registrado con éxito.' };
        } catch (err) {
            return { success: false, message: 'Error al registrar abono: ' + err.message };
        }
    });

    ipcMain.handle('eliminar-abono', async (event, datos) => {
        const { id, auditoriaUsuario, auditoriaRol } = datos;
        try {
            const abono = await new Promise((resolve) => {
                db.get(`SELECT cliente_id, monto, metodo_pago, strftime('%Y-%m-%d', fecha, 'localtime') as fecha_dia FROM abonos_credito WHERE id = ?`, [id], (err, row) => resolve(row));
            });
            // Un abono de un día anterior solo lo puede eliminar un Administrador (y queda
            // recuperable desde Administración > Abonos Eliminados) -- mismo criterio que
            // gastos/ventas de fecha anterior y que abonos de Pedidos (ver eliminarAbonoPedidoTx).
            if (abono && auditoriaRol !== 'Administrador' && abono.fecha_dia !== obtenerFechaHoyYYYYMMDD()) {
                return { success: false, message: 'Solo un Administrador puede eliminar un abono de un día anterior.' };
            }
            await runQuery(`UPDATE abonos_credito SET sync_status = 'deleted' WHERE id = ?`, [id]);
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, 'Administración', 'Eliminar Abono', `Abono ID: ${id} - Cliente ID: ${abono ? abono.cliente_id : 'desconocido'} - Monto: $${abono ? abono.monto : '?'}`);
            return { success: true, message: 'Abono eliminado exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al eliminar abono: ' + err.message };
        }
    });

    ipcMain.handle('obtener-reporte-creditos', async (event, { sucursalId, fechaInicio, fechaFin } = {}) => {
        try {
            // Los clientes Fiscal nunca se fían (pagan de inmediato y solo piden cuenta de cobro),
            // así que no pertenecen al reporte/listados de Crédito y Abonos.
            const clientes = await allQuery(
                `SELECT * FROM clientes WHERE (sync_status IS NULL OR sync_status <> 'deleted') AND (categoria IS NULL OR categoria <> 'Fiscal')`,
                []
            );

            let queryVentas = `
                SELECT
                    v.id, v.fecha, v.total, v.cliente_id, v.metodo_pago,
                    group_concat(p.nombre || ' (x' || dv.cantidad || ')', ', ') as productos_vendidos
                 FROM ventas v
                 LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
                 LEFT JOIN productos p ON dv.producto_id = p.id
                 WHERE v.es_credito = 1 AND (v.sync_status IS NULL OR v.sync_status <> 'deleted')
            `;
            const paramsVentas = [];
            if (fechaInicio && fechaFin) {
                queryVentas += ` AND strftime('%Y-%m-%d', v.fecha) >= ? AND strftime('%Y-%m-%d', v.fecha) <= ?`;
                paramsVentas.push(fechaInicio, fechaFin);
            }
            if (sucursalId) {
                queryVentas += ` AND v.sucursal_id = ?`;
                paramsVentas.push(sucursalId);
            }
            queryVentas += ` GROUP BY v.id ORDER BY v.fecha DESC`;
            const ventas = await allQuery(queryVentas, paramsVentas);

            // abonos_credito no tiene sucursal_id (los clientes no están ligados a una sucursal),
            // por lo que solo se filtra por fecha, igual que en el balance financiero.
            let queryAbonos = `SELECT id, cliente_id, monto, fecha, metodo_pago FROM abonos_credito WHERE (sync_status IS NULL OR sync_status <> 'deleted')`;
            const paramsAbonos = [];
            if (fechaInicio && fechaFin) {
                queryAbonos += ` AND strftime('%Y-%m-%d', fecha) >= ? AND strftime('%Y-%m-%d', fecha) <= ?`;
                paramsAbonos.push(fechaInicio, fechaFin);
            }
            queryAbonos += ` ORDER BY fecha DESC`;
            const abonos = await allQuery(queryAbonos, paramsAbonos);

            return { success: true, clientes, ventas, abonos };
        } catch (err) {
            return { success: false, message: 'Error al obtener reporte de créditos: ' + err.message };
        }
    });

    ipcMain.handle('generar-cuenta-cobro-pdf', async (event, clienteId) => {
        const win = BrowserWindow.fromWebContents(event.sender);

        try {
            const cliente = await new Promise((resolve) => {
                db.get(`SELECT * FROM clientes WHERE id = ?`, [clienteId], (err, row) => resolve(row));
            });
            if (!cliente) {
                return { success: false, message: 'No se encontró el cliente.' };
            }

            const ventasCredito = await allQuery(
                `SELECT v.id, v.total, v.fecha, v.metodo_pago, v.sucursal_id
                 FROM ventas v
                 WHERE v.es_credito = 1 AND v.cliente_id = ? AND (v.sync_status IS NULL OR v.sync_status <> 'deleted')
                 ORDER BY v.fecha ASC`,
                [clienteId]
            );

            const { label: sucursalLabel, direccion, telefono: telefonoSucursal } = await obtenerSucursalInfo(ventasCredito.map(v => v.sucursal_id));

            const totalCreditos = ventasCredito.reduce((sum, venta) => sum + Number(venta.total || 0), 0);

            const items = [];
            for (const venta of ventasCredito) {
                const detalles = await allQuery(
                    `SELECT dv.cantidad, dv.precio_unitario, p.nombre AS producto_nombre
                     FROM detalle_ventas dv
                     LEFT JOIN productos p ON p.id = dv.producto_id
                     WHERE dv.venta_id = ?`,
                    [venta.id]
                );

                detalles.forEach(detalle => {
                    items.push({
                        ventaId: venta.id,
                        fecha: venta.fecha,
                        producto: detalle.producto_nombre || 'Producto sin nombre',
                        cantidad: detalle.cantidad,
                        precio: Number(detalle.precio_unitario || 0),
                        subtotal: Number(detalle.cantidad || 0) * Number(detalle.precio_unitario || 0)
                    });
                });

                const valorDomicilio = extraerDomicilioDeMetodoPago(venta.metodo_pago);
                if (valorDomicilio > 0) {
                    items.push({
                        ventaId: venta.id,
                        fecha: venta.fecha,
                        producto: 'Domicilio (envío)',
                        cantidad: 1,
                        precio: valorDomicilio,
                        subtotal: valorDomicilio
                    });
                }
            }

            const fechaActual = new Date();
            const numeroCuenta = `CC-${fechaActual.getFullYear()}${String(fechaActual.getMonth() + 1).padStart(2, '0')}${String(fechaActual.getDate()).padStart(2, '0')}-${String(ventasCredito.length + 1).padStart(4, '0')}`;

            const html = construirHtmlCuentaCobro({
                cliente, numeroCuenta, items, total: totalCreditos,
                sucursalLabel, direccion, telefonoSucursal, firmaDataUri: obtenerFirmaDataUri()
            });

            return await exportarCuentaCobroPDF({ win, html, nombreCliente: cliente.nombre });
        } catch (err) {
            return { success: false, message: 'Error al generar la cuenta de cobro: ' + err.message };
        }
    });

    // Cuenta de cobro de una única venta (flujo de clientes "Fiscal" desde ventas.js): a
    // diferencia de 'generar-cuenta-cobro-pdf' (que acumula todas las ventas a crédito pendientes
    // del cliente), esta genera el documento solo con los ítems de la venta indicada.
    ipcMain.handle('generar-cuenta-cobro-venta-pdf', async (event, { ventaId, clienteId }) => {
        const win = BrowserWindow.fromWebContents(event.sender);

        try {
            const cliente = await new Promise((resolve) => {
                db.get(`SELECT * FROM clientes WHERE id = ?`, [clienteId], (err, row) => resolve(row));
            });
            if (!cliente) {
                return { success: false, message: 'No se encontró el cliente.' };
            }

            const venta = await new Promise((resolve) => {
                db.get(`SELECT id, total, fecha, metodo_pago, sucursal_id FROM ventas WHERE id = ?`, [ventaId], (err, row) => resolve(row));
            });
            if (!venta) {
                return { success: false, message: 'No se encontró la venta.' };
            }

            const { label: sucursalLabel, direccion, telefono: telefonoSucursal } = await obtenerSucursalInfo([venta.sucursal_id]);

            const detalles = await allQuery(
                `SELECT dv.cantidad, dv.precio_unitario, p.nombre AS producto_nombre
                 FROM detalle_ventas dv
                 LEFT JOIN productos p ON p.id = dv.producto_id
                 WHERE dv.venta_id = ?`,
                [venta.id]
            );

            const items = detalles.map(detalle => ({
                fecha: venta.fecha,
                producto: detalle.producto_nombre || 'Producto sin nombre',
                cantidad: detalle.cantidad,
                precio: Number(detalle.precio_unitario || 0),
                subtotal: Number(detalle.cantidad || 0) * Number(detalle.precio_unitario || 0)
            }));

            const valorDomicilio = extraerDomicilioDeMetodoPago(venta.metodo_pago);
            if (valorDomicilio > 0) {
                items.push({
                    fecha: venta.fecha,
                    producto: 'Domicilio (envío)',
                    cantidad: 1,
                    precio: valorDomicilio,
                    subtotal: valorDomicilio
                });
            }

            const fechaVenta = new Date(venta.fecha);
            const numeroCuenta = `CC-${fechaVenta.getFullYear()}${String(fechaVenta.getMonth() + 1).padStart(2, '0')}${String(fechaVenta.getDate()).padStart(2, '0')}-${venta.id.substring(0, 8)}`;

            const html = construirHtmlCuentaCobro({
                cliente, numeroCuenta, items, total: Number(venta.total || 0),
                sucursalLabel, direccion, telefonoSucursal, firmaDataUri: obtenerFirmaDataUri()
            });

            return await exportarCuentaCobroPDF({ win, html, nombreCliente: cliente.nombre });
        } catch (err) {
            return { success: false, message: 'Error al generar la cuenta de cobro: ' + err.message };
        }
    });
}

// Resuelve la info de sucursal a partir de los sucursal_id de las ventas que entran en la cuenta
// de cobro: `label` siempre se arma (uno o varios nombres separados por coma), pero `direccion` y
// `telefono` solo se completan cuando todas las ventas pertenecen a UNA sola sucursal -- con varias
// sucursales mezcladas no hay una dirección/teléfono único que mostrar sin inventar cuál usar.
async function obtenerSucursalInfo(sucursalIds) {
    const idsUnicos = [...new Set((sucursalIds || []).filter(Boolean))];
    if (idsUnicos.length === 0) return { label: '', direccion: '', telefono: '' };

    const placeholders = idsUnicos.map(() => '?').join(', ');
    const rows = await allQuery(`SELECT id, nombre, direccion, telefono FROM config_sucursal WHERE id IN (${placeholders})`, idsUnicos);
    const filasPorId = new Map(rows.map(r => [r.id, r]));

    const label = idsUnicos.map(id => (filasPorId.get(id) || {}).nombre || id).join(', ');

    if (idsUnicos.length === 1) {
        const unica = filasPorId.get(idsUnicos[0]) || {};
        return { label, direccion: unica.direccion || '', telefono: unica.telefono || '' };
    }

    return { label, direccion: '', telefono: '' };
}

// Ruta del PNG/JPG con la firma escaneada de Karina, embebido como data URI en el PDF. Se lee una
// sola vez (cacheado en memoria) y si el archivo no existe se cae de vuelta al nombre en cursiva
// (ver construirHtmlCuentaCobro) en lugar de romper la generación del documento.
let firmaDataUriCache;
function obtenerFirmaDataUri() {
    if (firmaDataUriCache !== undefined) return firmaDataUriCache;
    try {
        const rutaFirma = path.join(__dirname, '..', 'build', 'Firma Karina.jpg');
        const buffer = fs.readFileSync(rutaFirma);
        firmaDataUriCache = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } catch (err) {
        firmaDataUriCache = null;
    }
    return firmaDataUriCache;
}

// Renderiza el HTML de una cuenta de cobro en una ventana oculta, lo exporta a PDF y pide al
// usuario dónde guardarlo. Compartido por los dos flujos de generación (crédito acumulado y venta puntual).
async function exportarCuentaCobroPDF({ win, html, nombreCliente }) {
    const pdfOptions = {
        marginsType: 0,
        pageSize: 'A4',
        printBackground: true,
        landscape: false
    };

    const tempWindow = new BrowserWindow({
        show: false,
        width: 900,
        height: 1200,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    await tempWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const data = await tempWindow.webContents.printToPDF(pdfOptions);
    tempWindow.close();

    const { filePath } = await dialog.showSaveDialog(win, {
        title: 'Guardar cuenta de cobro en PDF',
        defaultPath: path.join(app.getPath('downloads'), `cuenta_cobro_${sanitizarNombreArchivo(nombreCliente)}_${new Date().toISOString().split('T')[0]}.pdf`),
        filters: [{ name: 'Documentos PDF', extensions: ['pdf'] }]
    });

    if (filePath) {
        fs.writeFileSync(filePath, data);
        return { success: true, message: 'Cuenta de cobro exportada exitosamente.' };
    }

    return { success: false, message: 'Exportación cancelada.' };
}

module.exports = { registerClientesIpc };
