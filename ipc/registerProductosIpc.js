const { ipcMain, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { runQuery, allQuery } = require('../db/connection');
const { registrarAuditoria } = require('../services/auditService');
const { processLocalProductImage } = require('../services/imagenService');
const { registrarMovimientoInventario } = require('../services/inventarioMovimientoService');
const { generarPlantillaAbastecimiento, leerPlantillaAbastecimiento } = require('../utils/excelAbastecimiento');
const { solicitarSincronizacion } = require('../sync/syncService');

// SRP: catálogo de productos, inventario por sucursal y categorías.

function notificarInventarioActualizado() {
    BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
            win.webContents.send('inventario-actualizado');
        }
    });
}

function registerProductosIpc() {
    // Obtener Inventario (con JOIN para traer el nombre de la categoría)
    ipcMain.handle('get-inventory', async (event, sucursalId) => {
        try {
            const rows = await allQuery(
                `SELECT p.*, COALESCE(i.stock, 0) as stock, COALESCE(i.stock_reservado, 0) as stock_reservado, c.nombre as categoria_nombre,
                        COALESCE((SELECT SUM(cantidad) FROM detalle_ventas WHERE producto_id = p.id), 0) as ventas_historicas
                 FROM productos p
                 LEFT JOIN inventario_sucursal i ON p.id = i.producto_id AND i.sucursal_id = ?
                 LEFT JOIN categorias c ON p.categoria_id = c.id
                 WHERE (p.sync_status IS NULL OR p.sync_status <> 'deleted')`,
                [sucursalId]
            );
            return { success: true, data: rows };
        } catch (err) {
            return { success: false, data: [], message: err.message };
        }
    });

    // Obtener Categorías y Subcategorías
    ipcMain.handle('obtener-categorias', async () => {
        try {
            const rows = await allQuery(
                `SELECT c.*, cp.nombre as padre_nombre
                 FROM categorias c
                 LEFT JOIN categorias cp ON c.categoria_padre_id = cp.id
                 WHERE (c.sync_status IS NULL OR c.sync_status <> 'deleted')`,
                []
            );
            return { success: true, data: rows };
        } catch (err) {
            return { success: false, message: 'Error al obtener categorías: ' + err.message };
        }
    });

    // Guardar Categoría
    ipcMain.handle('guardar-categoria', async (event, datos) => {
        const { id, nombre, categoriaPadreId, auditoriaUsuario, auditoriaRol } = datos;
        try {
            if (id) {
                // Edición
                await runQuery(
                    `UPDATE categorias SET nombre = ?, categoria_padre_id = ?, sync_status = 'pending' WHERE id = ?`,
                    [nombre, categoriaPadreId || null, id]
                );
                await registrarAuditoria(auditoriaUsuario, auditoriaRol, 'Catálogo', 'Editar Categoría', `Nombre: ${nombre} - ID: ${id}`);
                solicitarSincronizacion('categoría editada');
                return { success: true, message: 'Categoría actualizada exitosamente.' };
            } else {
                // Creación
                const nuevoId = 'cat-' + uuidv4().substring(0, 8);
                await runQuery(
                    `INSERT INTO categorias (id, nombre, categoria_padre_id, sync_status, updated_at) VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                    [nuevoId, nombre, categoriaPadreId || null]
                );
                await registrarAuditoria(auditoriaUsuario, auditoriaRol, 'Catálogo', 'Crear Categoría', `Nombre: ${nombre} - ID: ${nuevoId}`);
                solicitarSincronizacion('categoría creada');
                return { success: true, message: 'Categoría creada exitosamente.' };
            }
        } catch (err) {
            return { success: false, message: 'Error al guardar categoría: ' + err.message };
        }
    });

    // Eliminar Categoría
    ipcMain.handle('eliminar-categoria', async (event, datos) => {
        const { id, nombre, auditoriaUsuario, auditoriaRol } = datos;
        try {
            // En vez de borrar físico, marcamos para sincronizar soft delete
            await runQuery(`UPDATE categorias SET sync_status = 'deleted' WHERE id = ?`, [id]);
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, 'Catálogo', 'Eliminar Categoría', `Nombre: ${nombre} - ID: ${id}`);
            solicitarSincronizacion('categoría eliminada');
            return { success: true, message: 'Categoría eliminada exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al eliminar categoría: ' + err.message };
        }
    });

    // Registrar Producto
    ipcMain.handle('registrar-producto', async (event, datosProducto) => {
        const { nombre, descripcion, precio, stock, stockMinimo, sucursalId, fotoPath, categoriaId, auditoriaUsuario, auditoriaRol } = datosProducto;
        const productoId = 'p-' + uuidv4().substring(0, 8);
        try {
            await runQuery("BEGIN TRANSACTION", []);
            const finalFotoPath = processLocalProductImage(productoId, fotoPath);

            // 1. Insertar datos globales
            // updated_at se fija explícitamente en cada INSERT (no se deja al DEFAULT de la
            // columna): en bases de datos migradas ese DEFAULT no existe a nivel de columna (ver
            // agregarSoporteLWW en db/schema.js) y solo se rellena una vez por arranque de la
            // app, dejando NULL cualquier fila creada a mitad de sesión -- lo que Supabase
            // rechaza por su constraint NOT NULL al sincronizar.
            await runQuery(
                `INSERT INTO productos (id, nombre, descripcion, precio, stock_minimo, foto_path, categoria_id, sync_status, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                [productoId, nombre, descripcion, precio, stockMinimo, finalFotoPath || null, categoriaId || null]
            );

            // 2. Insertar existencias por sucursal
            await runQuery(
                `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                 VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
                [productoId, sucursalId, stock]
            );
            if (Number(stock) > 0) {
                await registrarMovimientoInventario({
                    productoId, sucursalId, tipo: 'ENTRADA',
                    cantidad: Number(stock), referenciaId: productoId, usuario: auditoriaUsuario
                });
            }

            // Registrar en logs de auditoría
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucursalId, 'Registrar Producto', `Nombre: ${nombre} - ID: ${productoId} - Stock Inicial: ${stock}`);

            await runQuery("COMMIT", []);
            solicitarSincronizacion('producto registrado');
            return { success: true, message: 'Producto registrado exitosamente.' };
        } catch (err) {
            await runQuery("ROLLBACK", []).catch(() => {});
            return { success: false, message: 'Error al registrar el producto: ' + err.message };
        }
    });

    // Editar Producto
    ipcMain.handle('editar-producto', async (event, datosProducto) => {
        const { id, nombre, descripcion, precio, stock, stockMinimo, sucursalId, fotoPath, categoriaId, auditoriaUsuario, auditoriaRol } = datosProducto;
        try {
            await runQuery("BEGIN TRANSACTION", []);
            const finalFotoPath = processLocalProductImage(id, fotoPath);

            // 1. Modificar propiedades globales
            await runQuery(
                `UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock_minimo = ?, foto_path = ?, categoria_id = ?, sync_status = 'pending' WHERE id = ?`,
                [nombre, descripcion, precio, stockMinimo, finalFotoPath || null, categoriaId || null, id]
            );

            // 2. Modificar existencias por sucursal si se pasa sucursalId
            let stockAnterior = null;
            let delta = 0;
            if (sucursalId) {
                const filasPrevias = await allQuery(`SELECT stock FROM inventario_sucursal WHERE producto_id = ? AND sucursal_id = ?`, [id, sucursalId]);
                stockAnterior = Number(filasPrevias[0]?.stock || 0);
                delta = Number(stock) - stockAnterior;

                await runQuery(
                    `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                     VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                     ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                        stock = excluded.stock,
                        sync_status = 'pending'`,
                    [id, sucursalId, stock]
                );

                // Deja rastro en el kardex del ajuste manual de stock, para que los reportes históricos
                // (ej. stock al cierre del día en el Reporte BiBI) puedan reconstruir el stock correctamente.
                if (delta !== 0) {
                    // stockObjetivo (valor absoluto tecleado) viaja junto al delta local para que la nube
                    // recalcule el delta real contra el stock vigente al sincronizar -- ver aplicar_correccion_stock.
                    await registrarMovimientoInventario({
                        productoId: id, sucursalId, tipo: 'AJUSTE_EDICION_PRODUCTO',
                        cantidad: delta, referenciaId: id, usuario: auditoriaUsuario, stockObjetivo: Number(stock)
                    });
                }
            }

            // Registrar en logs de auditoría, incluyendo el stock anterior cuando hubo un cambio real
            // (útil para detectar ajustes manuales sospechosos o errores de digitación).
            const detalleStock = stockAnterior === null
                ? `Stock: ${stock}`
                : delta !== 0
                    ? `Stock: ${stockAnterior} -> ${stock} (${delta > 0 ? '+' : ''}${delta})`
                    : `Stock: ${stock} (sin cambios)`;
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucursalId || 'Catálogo', 'Editar Producto', `Nombre: ${nombre} - ID: ${id} - ${detalleStock}`);
            await runQuery("COMMIT", []);
            notificarInventarioActualizado();
            solicitarSincronizacion('producto editado');
            return { success: true, message: 'Producto modificado exitosamente.' };
        } catch (err) {
            await runQuery("ROLLBACK", []).catch(() => { });
            return { success: false, message: 'Error al modificar el producto: ' + err.message };
        }
    });

    // Abastecer Stock (Añadir unidades al inventario por sucursal)
    ipcMain.handle('abastecer-stock', async (event, datos) => {
        const { id, cantidad, sucursalId, auditoriaUsuario, auditoriaRol } = datos;
        try {
            await runQuery("BEGIN TRANSACTION", []);
            await runQuery(
                `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                 VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                 ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                    stock = stock + excluded.stock,
                    sync_status = 'pending'`,
                [id, sucursalId, cantidad]
            );
            await registrarMovimientoInventario({
                productoId: id, sucursalId, tipo: 'ABASTECIMIENTO',
                cantidad: Number(cantidad), referenciaId: null, usuario: auditoriaUsuario
            });
            // Registrar en logs de auditoría
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucursalId, 'Abastecer Stock', `Producto ID: ${id} - Cantidad: +${cantidad}`);
            await runQuery("COMMIT", []);
            notificarInventarioActualizado();
            solicitarSincronizacion('stock abastecido');
            return { success: true, message: 'Stock abastecido exitosamente.' };
        } catch (err) {
            await runQuery("ROLLBACK", []).catch(() => {});
            return { success: false, message: 'Error al abastecer stock: ' + err.message };
        }
    });

    async function obtenerProductosConStock(sucursalId) {
        return allQuery(
            `SELECT p.id, p.nombre, COALESCE(i.stock, 0) as stock, c.nombre as categoria_nombre
             FROM productos p
             LEFT JOIN inventario_sucursal i ON p.id = i.producto_id AND i.sucursal_id = ?
             LEFT JOIN categorias c ON p.categoria_id = c.id
             WHERE (p.sync_status IS NULL OR p.sync_status <> 'deleted')
             ORDER BY c.nombre ASC, p.nombre ASC`,
            [sucursalId]
        );
    }

    // Generar Plantilla de Abastecimiento (.xlsx real, con columnas propias -- no depende del
    // separador de CSV ni de la configuración regional de Excel del operador).
    ipcMain.handle('generar-plantilla-abastecimiento', async (event, { sucursalId }) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) console.error('[abastecimiento] BrowserWindow.fromWebContents devolvió null al generar plantilla; se abrirá el diálogo sin ventana padre.');
        try {
            const productos = await obtenerProductosConStock(sucursalId);
            if (productos.length === 0) {
                return { success: false, message: 'No hay productos para generar la plantilla.' };
            }

            const dialogOptions = {
                title: 'Guardar plantilla de abastecimiento',
                defaultPath: `plantilla-abastecimiento-${sucursalId}-${new Date().toISOString().split('T')[0]}.xlsx`,
                filters: [{ name: 'Excel', extensions: ['xlsx'] }]
            };
            const { canceled, filePath } = win
                ? await dialog.showSaveDialog(win, dialogOptions)
                : await dialog.showSaveDialog(dialogOptions);
            if (canceled || !filePath) {
                return { success: false, cancelado: true };
            }

            const buffer = await generarPlantillaAbastecimiento(productos);
            fs.writeFileSync(filePath, buffer);
            return { success: true, message: 'Plantilla generada exitosamente.' };
        } catch (err) {
            console.error('[abastecimiento] Error al generar la plantilla:', err);
            return { success: false, message: 'Error al generar la plantilla: ' + err.message };
        }
    });

    // Previsualizar Abastecimiento Masivo desde archivo Excel (carga parcial: solo las filas
    // con Cantidad a Ingresar > 0 entran a la previsualización; el resto del catálogo no se toca).
    ipcMain.handle('previsualizar-abastecimiento-archivo', async (event, { sucursalId }) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) console.error('[abastecimiento] BrowserWindow.fromWebContents devolvió null al abrir el selector de archivo; se abrirá el diálogo sin ventana padre.');
        try {
            const dialogOptions = {
                title: 'Seleccionar archivo de abastecimiento',
                filters: [{ name: 'Excel', extensions: ['xlsx'] }],
                properties: ['openFile']
            };
            const { canceled, filePaths } = win
                ? await dialog.showOpenDialog(win, dialogOptions)
                : await dialog.showOpenDialog(dialogOptions);
            if (canceled || !filePaths || filePaths.length === 0) {
                return { success: false, cancelado: true };
            }

            const filas = await leerPlantillaAbastecimiento(filePaths[0]);
            const filasConCantidad = filas.filter((f) => Number.isFinite(f.cantidad) && f.cantidad > 0);

            if (filasConCantidad.length === 0) {
                return { success: false, message: 'El archivo no tiene productos con una Cantidad a Ingresar mayor a 0.' };
            }

            const productos = await obtenerProductosConStock(sucursalId);
            const productosPorId = new Map(productos.map((p) => [p.id, p]));

            const items = filasConCantidad.map((fila) => {
                const producto = productosPorId.get(fila.id);
                if (!producto) {
                    return { id: fila.id, nombre: fila.nombreArchivo || fila.id, stockActual: null, cantidad: fila.cantidad, valido: false, motivo: 'ID de producto no encontrado en esta sucursal' };
                }
                return { id: fila.id, nombre: producto.nombre, stockActual: producto.stock, cantidad: fila.cantidad, valido: true, motivo: null };
            });

            return { success: true, items, archivo: path.basename(filePaths[0]) };
        } catch (err) {
            console.error('[abastecimiento] Error al leer el archivo:', err);
            return { success: false, message: 'Error al leer el archivo: ' + err.message };
        }
    });

    // Confirmar Abastecimiento Masivo: aplica solo los items marcados como válidos, con el mismo
    // efecto que abastecer producto por producto (misma tabla, mismo kardex), en una transacción.
    ipcMain.handle('confirmar-abastecimiento-masivo', async (event, datos) => {
        const { sucursalId, items, archivo, auditoriaUsuario, auditoriaRol } = datos;
        const validos = (items || []).filter((it) => it.valido && Number(it.cantidad) > 0);
        if (validos.length === 0) {
            return { success: false, message: 'No hay productos válidos para abastecer.' };
        }
        try {
            await runQuery('BEGIN TRANSACTION', []);
            for (const item of validos) {
                await runQuery(
                    `INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
                     VALUES (?, ?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                     ON CONFLICT(producto_id, sucursal_id) DO UPDATE SET
                        stock = stock + excluded.stock,
                        sync_status = 'pending'`,
                    [item.id, sucursalId, item.cantidad]
                );
                await registrarMovimientoInventario({
                    productoId: item.id, sucursalId, tipo: 'ABASTECIMIENTO_MASIVO',
                    cantidad: Number(item.cantidad), referenciaId: null, usuario: auditoriaUsuario
                });
            }

            const totalUnidades = validos.reduce((sum, it) => sum + Number(it.cantidad), 0);
            const detalleProductos = validos.map((it) => `${it.nombre}: +${it.cantidad}`).join(', ');
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, sucursalId, 'Abastecimiento Masivo (Archivo)', `Archivo: ${archivo || 'N/D'} - Productos: ${validos.length} - Total unidades: ${totalUnidades} - Detalle: ${detalleProductos}`);
            await runQuery('COMMIT', []);
            notificarInventarioActualizado();
            solicitarSincronizacion('abastecimiento masivo aplicado');
            return { success: true, message: `Abastecimiento aplicado: ${validos.length} productos, ${totalUnidades} unidades en total.` };
        } catch (err) {
            await runQuery('ROLLBACK', []).catch(() => { });
            return { success: false, message: 'Error al aplicar el abastecimiento masivo: ' + err.message };
        }
    });

    // Eliminar Producto
    ipcMain.handle('eliminar-producto', async (event, datos) => {
        const { id, auditoriaUsuario, auditoriaRol } = datos;
        try {
            await runQuery(`UPDATE productos SET sync_status = 'deleted' WHERE id = ?`, [id]);
            // Registrar en logs de auditoría
            await registrarAuditoria(auditoriaUsuario, auditoriaRol, 'Catálogo', 'Eliminar Producto', `Producto ID: ${id}`);
            solicitarSincronizacion('producto eliminado');
            return { success: true, message: 'Producto eliminado exitosamente.' };
        } catch (err) {
            return { success: false, message: 'Error al eliminar el producto: ' + err.message };
        }
    });
}

module.exports = { registerProductosIpc };
