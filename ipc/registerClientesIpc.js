const { ipcMain, BrowserWindow, dialog, app } = require('electron');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db, runQuery, allQuery } = require('../db/connection');
const { formatearCOP, sanitizarNombreArchivo, numeroALetras, extraerDomicilioDeMetodoPago } = require('../services/pdfHelpers');

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
        const { id, nombre, tipo, identificacion, telefono, email } = datos;
        try {
            if (id) {
                await runQuery(
                    `UPDATE clientes SET nombre = ?, tipo = ?, identificacion = ?, telefono = ?, email = ?, sync_status = 'pending' WHERE id = ?`,
                    [nombre, tipo, identificacion, telefono, email, id]
                );
                return { success: true, message: 'Cliente actualizado exitosamente.' };
            } else {
                const nuevoId = 'cli-' + uuidv4().substring(0, 8);
                await runQuery(
                    `INSERT INTO clientes (id, nombre, tipo, identificacion, telefono, email, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                    [nuevoId, nombre, tipo, identificacion, telefono, email]
                );
                return { success: true, message: 'Cliente creado exitosamente.' };
            }
        } catch (err) {
            return { success: false, message: 'Error al guardar cliente: ' + err.message };
        }
    });

    ipcMain.handle('eliminar-cliente', async (event, id) => {
        try {
            await runQuery(`UPDATE clientes SET sync_status = 'deleted' WHERE id = ?`, [id]);
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

    ipcMain.handle('eliminar-abono', async (event, id) => {
        try {
            await runQuery(`UPDATE abonos_credito SET sync_status = 'deleted' WHERE id = ?`, [id]);
            return { success: true, message: 'Abono eliminado exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al eliminar abono: ' + err.message };
        }
    });

    ipcMain.handle('obtener-reporte-creditos', async (event, { sucursalId, fechaInicio, fechaFin } = {}) => {
        try {
            const clientes = await allQuery(`SELECT * FROM clientes WHERE sync_status IS NULL OR sync_status <> 'deleted'`, []);

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
                `SELECT v.id, v.total, v.fecha, v.metodo_pago
                 FROM ventas v
                 WHERE v.es_credito = 1 AND v.cliente_id = ? AND (v.sync_status IS NULL OR v.sync_status <> 'deleted')
                 ORDER BY v.fecha ASC`,
                [clienteId]
            );

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

            const ciudadFecha = `Turbaco, ${fechaActual.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`;
            const sumaEnLetras = numeroALetras(totalCreditos);

            const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 0; padding: 24px; font-size: 13px; }
    .ciudad-fecha { text-align: right; margin-bottom: 20px; }
    .title { font-size: 18px; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 18px; }
    .row { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 6px; }
    .row .label { color: #6b7280; }
    .row .value { font-weight: 600; text-align: right; }
    .beneficiario { margin: 18px 0; padding: 10px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; }
    .suma-letras { margin: 18px 0; font-weight: bold; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    th { background: #f8fafc; }
    th.num, td.num { text-align: right; }
    tfoot td { font-weight: bold; text-align: right; }
    .signature-section { margin-top: 60px; }
    .signature-line { border-top: 1px solid #111827; width: 280px; margin-top: 48px; }
  </style>
</head>
<body>
  <div class="ciudad-fecha">${ciudadFecha}</div>

  <div class="title">Cuenta de Cobro ${numeroCuenta}</div>

  <div class="row"><span class="label">${cliente.nombre}</span><span class="value">NIT/CC ${cliente.identificacion || '-'}</span></div>

  <div class="beneficiario row">
    <span class="label">Debe a: KARINA DE LEON HUETO</span>
    <span class="value">NIT / C.C. 30775919-8</span>
  </div>

  <div class="suma-letras">La suma de: ${sumaEnLetras}</div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th class="num">Cant.</th>
        <th class="num">Valor Unit.</th>
        <th class="num">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.producto}</td>
          <td class="num">${item.cantidad}</td>
          <td class="num">${formatearCOP(item.precio)}</td>
          <td class="num">${formatearCOP(item.subtotal)}</td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3">Total</td>
        <td>${formatearCOP(totalCreditos)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="signature-section">
    <div>Atte,</div>
    <div class="signature-line"></div>
    <div style="font-weight: 600;">KARINA DE LEON HUETO</div>
    <div>c.c. 30.775.919</div>
  </div>
</body>
</html>`;

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
                defaultPath: path.join(app.getPath('downloads'), `cuenta_cobro_${sanitizarNombreArchivo(cliente.nombre)}_${fechaActual.toISOString().split('T')[0]}.pdf`),
                filters: [{ name: 'Documentos PDF', extensions: ['pdf'] }]
            });

            if (filePath) {
                fs.writeFileSync(filePath, data);
                return { success: true, message: 'Cuenta de cobro exportada exitosamente.' };
            }

            return { success: false, message: 'Exportación cancelada.' };
        } catch (err) {
            return { success: false, message: 'Error al generar la cuenta de cobro: ' + err.message };
        }
    });
}

module.exports = { registerClientesIpc };
