// SRP: define exclusivamente el esquema de la base de datos local.

// Soporte LWW (Last-Write-Wins) + soft delete, igual que en Supabase (ver
// migrate_lww_soft_deletes.sql): cada tabla sincronizada gana updated_at
// (bump automático en cada UPDATE) y deleted_at (bandera lógica de borrado).
// Sin esto, la subida/descarga solo podía comparar sync_status, no "quién
// editó de último", y una versión desactualizada de otro equipo podía pisar
// una más reciente.
// Trigger de auto-bump de `updated_at`, separado de agregarSoporteLWW para poder recrearlo
// después de un backfill masivo (ver uso en los ALTER TABLE de cliente_*_registro más abajo):
// cualquier UPDATE de toda la tabla que no sea un cambio real del registro (solo rellenar una
// columna nueva) NO debe pisar `updated_at`, porque un equipo que todavía no haya descargado un
// cambio real más reciente de otro equipo puede terminar con un `updated_at` local "del futuro"
// que bloquea esa descarga para siempre (el pull incremental no reintenta filas ya vistas, ver
// sync/syncService.js). Mientras el trigger esté ausente, ningún UPDATE toca updated_at.
function crearTriggerUpdatedAt(db, tabla, columnasPk) {
    const condicion = columnasPk.map(c => `${c} = NEW.${c}`).join(' AND ');
    db.run(`
        CREATE TRIGGER IF NOT EXISTS trg_${tabla}_updated_at
        AFTER UPDATE ON ${tabla}
        FOR EACH ROW WHEN NEW.updated_at IS OLD.updated_at
        BEGIN
            UPDATE ${tabla} SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE ${condicion};
        END;
    `, [], () => { });
}

function agregarSoporteLWW(db, tabla, columnasPk) {
    // SQLite rechaza "Cannot add a column with non-constant default" cuando la
    // tabla ya tiene filas (caso real: BD con datos de producción). Por eso la
    // columna se agrega sin DEFAULT y el timestamp se rellena aparte con UPDATE,
    // que sí puede evaluar una expresión no constante por fila.
    db.run(`ALTER TABLE ${tabla} ADD COLUMN updated_at TEXT`, [], () => {
        db.run(`UPDATE ${tabla} SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE updated_at IS NULL`, [], () => { });
    });
    db.run(`ALTER TABLE ${tabla} ADD COLUMN deleted_at TEXT`, [], () => { });

    crearTriggerUpdatedAt(db, tabla, columnasPk);
}

function initDB(db) {
    db.serialize(() => {
        // 1. Tabla de Usuarios
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            rol TEXT,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT
        )`, [], () => {
            // Asegurar que la columna sync_status existe si la tabla ya había sido creada localmente.
            // El DEFAULT 'pending' backfillea también las filas existentes, forzando su re-subida.
            db.run(`ALTER TABLE usuarios ADD COLUMN sync_status TEXT DEFAULT 'pending'`, [], () => { });
            // Seed por defecto para asegurar que se pueda iniciar sesión sin conexión
            // incluso si es el primer arranque y no hay red para descargar usuarios de Supabase.
            db.run(`INSERT OR IGNORE INTO usuarios (id, username, password, rol, sync_status)
                    VALUES ('u-admin-default', 'admin', 'admin123', 'Administrador', 'synced')`);
            agregarSoporteLWW(db, 'usuarios', ['id']);
        });
        // 2. Tabla de Ventas
        db.run(`CREATE TABLE IF NOT EXISTS ventas (
            id TEXT PRIMARY KEY,
            sucursal_id TEXT,
            total REAL,
            metodo_pago TEXT,
            fecha TEXT,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT
        )`, [], () => {
            agregarSoporteLWW(db, 'ventas', ['id']);
        });

        // 3. Tabla de Detalle de Ventas
        db.run(`CREATE TABLE IF NOT EXISTS detalle_ventas (
            id TEXT PRIMARY KEY,
            venta_id TEXT,
            producto_id TEXT,
            cantidad INTEGER,
            precio_unitario REAL,
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT,
            FOREIGN KEY(venta_id) REFERENCES ventas(id)
        )`, [], () => {
            agregarSoporteLWW(db, 'detalle_ventas', ['id']);
        });

        // 3.5. Tabla de Categorías (soporta subcategorías autoreferenciadas)
        db.run(`CREATE TABLE IF NOT EXISTS categorias (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            categoria_padre_id TEXT,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT,
            FOREIGN KEY (categoria_padre_id) REFERENCES categorias(id) ON DELETE SET NULL
        )`, [], () => {
            // Seed categoría por defecto
            db.run(`INSERT OR IGNORE INTO categorias (id, nombre, sync_status) VALUES ('cat-general', 'General', 'synced')`);
            agregarSoporteLWW(db, 'categorias', ['id']);
        });

        // 4. Tabla de Productos (Catálogo global sin stock ni sucursal_id)
        db.run(`CREATE TABLE IF NOT EXISTS productos (
            id TEXT PRIMARY KEY,
            nombre TEXT,
            descripcion TEXT,
            precio REAL,
            stock_minimo INTEGER DEFAULT 5,
            foto_path TEXT,
            categoria_id TEXT,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
        )`, [], () => {
            // Asegurar que la columna categoria_id existe si la tabla ya había sido creada localmente
            db.run(`ALTER TABLE productos ADD COLUMN categoria_id TEXT`, [], () => { });
            agregarSoporteLWW(db, 'productos', ['id']);
        });

        // 4b. Tabla de Inventario por Sucursal
        db.run(`CREATE TABLE IF NOT EXISTS inventario_sucursal (
            producto_id TEXT NOT NULL,
            sucursal_id TEXT NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT,
            PRIMARY KEY (producto_id, sucursal_id),
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
            FOREIGN KEY (sucursal_id) REFERENCES config_sucursal(id) ON DELETE CASCADE
        )`, [], () => {
            agregarSoporteLWW(db, 'inventario_sucursal', ['producto_id', 'sucursal_id']);
        });
        // 5. Tabla de Gastos
        db.run(`CREATE TABLE IF NOT EXISTS gastos (
            id TEXT PRIMARY KEY,
            sucursal_id TEXT,
            tipo TEXT,
            descripcion TEXT,
            monto REAL,
            fecha TEXT,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT
        )`, [], () => {
            // Asegurar que la columna metodo_pago existe si la tabla ya había sido creada localmente
            db.run(`ALTER TABLE gastos ADD COLUMN metodo_pago TEXT DEFAULT 'Efectivo'`, [], () => { });
            // Estado de seguimiento para Devoluciones de Producto (Pendiente de Respuesta del Proveedor / Regresada a la Sucursal / Rechazada por el Proveedor)
            db.run(`ALTER TABLE gastos ADD COLUMN estado TEXT`, [], () => { });
            // Enlaza el gasto "Domicilio (Descuento de Caja)" con la venta que lo generó, para poder
            // crearlo/actualizarlo/eliminarlo cuando la venta se edita o se borra (ver editarVentaCompletaTx
            // y eliminarVentaTx en services/ventaService.js). Sin este enlace no había forma confiable de
            // encontrar el gasto correspondiente a una venta puntual.
            db.run(`ALTER TABLE gastos ADD COLUMN venta_id TEXT`, [], () => { });
            // Renombrar la clasificación "Productos Vencidos" -> "Productos Vencidos / Retirados"
            // en filas locales preexistentes; sync_status='pending' las vuelve a subir a Supabase.
            db.run(`UPDATE gastos SET tipo = 'Productos Vencidos / Retirados', sync_status = 'pending' WHERE tipo = 'Productos Vencidos'`, [], () => { });
            // Reagrupación de clasificaciones: "Mercancía" -> "Gastos Administrativos" (arriendo, servicios,
            // mercancía, aseo, etc. a cargo de directivos) y "Productos Vencidos / Retirados" -> "Gasto de
            // Inventario" (vencimiento o retiro por administradores). sync_status='pending' las resube a Supabase.
            db.run(`UPDATE gastos SET tipo = 'Gastos Administrativos', sync_status = 'pending' WHERE tipo = 'Mercancía'`, [], () => { });
            db.run(`UPDATE gastos SET tipo = 'Gasto de Inventario', sync_status = 'pending' WHERE tipo = 'Productos Vencidos / Retirados'`, [], () => { });
            agregarSoporteLWW(db, 'gastos', ['id']);
        });

        // 6. Tabla de Configuración de Sucursal
        db.run(`CREATE TABLE IF NOT EXISTS config_sucursal (
            id TEXT PRIMARY KEY,
            nombre TEXT,
            direccion TEXT,
            telefono TEXT,
            activa INTEGER DEFAULT 0,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT
        )`, [], () => {
            // Asegurar migración de columna activa si la tabla fue creada previamente
            db.run(`ALTER TABLE config_sucursal ADD COLUMN activa INTEGER DEFAULT 0`, [], () => { });
            // sync_status no existía: sin ella, la descarga de la nube sobrescribía
            // ediciones locales recién guardadas. El DEFAULT 'pending' fuerza su re-subida.
            db.run(`ALTER TABLE config_sucursal ADD COLUMN sync_status TEXT DEFAULT 'pending'`, [], () => { });
            agregarSoporteLWW(db, 'config_sucursal', ['id']);
        });
        // 7. Tabla local de cola de auditoría (para soporte offline-first)
        db.run(`CREATE TABLE IF NOT EXISTS cola_auditoria (
            id TEXT PRIMARY KEY,
            usuario TEXT NOT NULL,
            rol TEXT NOT NULL,
            sucursal_id TEXT NOT NULL,
            accion TEXT NOT NULL,
            detalles TEXT,
            fecha TEXT,
            sync_status TEXT DEFAULT 'pending'
        )`);

        // 7b. Cursor local de pull incremental (ver sync/migrate_incremental_pull.sql): guarda,
        // por tabla, el mayor sync_seq ya recibido de Supabase, para que descargarDesdeCursor()
        // (sync/syncService.js) solo pida "lo nuevo desde ahí" en vez de re-descargar la tabla
        // completa en cada ciclo. cursor=0 (o fila ausente) equivale a "nunca sincronizada":
        // trae todo, igual que el comportamiento anterior de descargarTodo().
        db.run(`CREATE TABLE IF NOT EXISTS sync_cursores (
            tabla TEXT PRIMARY KEY,
            cursor INTEGER NOT NULL DEFAULT 0
        )`);

        // 8. Tabla de Transferencias de Inventario
        db.run(`CREATE TABLE IF NOT EXISTS transferencias (
            id TEXT PRIMARY KEY,
            sucursal_origen_id TEXT NOT NULL,
            sucursal_destino_id TEXT NOT NULL,
            fecha TEXT NOT NULL,
            usuario TEXT NOT NULL,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT
        )`, [], () => {
            agregarSoporteLWW(db, 'transferencias', ['id']);
        });

        // 9. Tabla de Detalle de Transferencias
        db.run(`CREATE TABLE IF NOT EXISTS detalle_transferencias (
            id TEXT PRIMARY KEY,
            transferencia_id TEXT NOT NULL,
            producto_id TEXT NOT NULL,
            cantidad INTEGER NOT NULL,
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT,
            FOREIGN KEY(transferencia_id) REFERENCES transferencias(id) ON DELETE CASCADE,
            FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE CASCADE
        )`, [], () => {
            agregarSoporteLWW(db, 'detalle_transferencias', ['id']);
        });

        // 11. Tabla de Clientes para Crédito
        db.run(`CREATE TABLE IF NOT EXISTS clientes (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            tipo TEXT NOT NULL,
            identificacion TEXT,
            telefono TEXT,
            email TEXT,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT
        )`, [], () => {
            agregarSoporteLWW(db, 'clientes', ['id']);
        });

        // Migración: origen del cliente ('Credito' = alta manual desde Administración, 'Pedido' =
        // creado automáticamente al registrar un Pedido/Apartado). Permite diferenciar en el listado
        // de Administración los clientes de crédito de los que solo se ingresaron por un pedido.
        db.run(`ALTER TABLE clientes ADD COLUMN origen TEXT DEFAULT 'Credito'`, [], () => {});

        // 12. Tabla de Abonos de Crédito
        db.run(`CREATE TABLE IF NOT EXISTS abonos_credito (
            id TEXT PRIMARY KEY,
            cliente_id TEXT NOT NULL,
            monto REAL NOT NULL,
            fecha TEXT NOT NULL,
            metodo_pago TEXT NOT NULL,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT,
            FOREIGN KEY(cliente_id) REFERENCES clientes(id)
        )`, [], () => {
            agregarSoporteLWW(db, 'abonos_credito', ['id']);
        });

        // Migración de Ventas para soporte de Crédito
        db.run(`ALTER TABLE ventas ADD COLUMN es_credito INTEGER DEFAULT 0`, [], () => {});
        db.run(`ALTER TABLE ventas ADD COLUMN cliente_id TEXT`, [], () => {});

        // 13. Tabla de Solicitudes de Venta Retroactiva (ingreso/edición/eliminación de ventas
        // de días anteriores, pendientes de aprobación cuando las crea un Operador)
        db.run(`CREATE TABLE IF NOT EXISTS solicitudes_venta (
            id TEXT PRIMARY KEY,
            tipo TEXT NOT NULL,
            venta_id TEXT,
            sucursal_id TEXT NOT NULL,
            fecha_venta TEXT NOT NULL,
            datos TEXT,
            estado TEXT NOT NULL DEFAULT 'pendiente',
            usuario_solicitante TEXT NOT NULL,
            fecha_solicitud TEXT NOT NULL,
            usuario_revisor TEXT,
            fecha_revision TEXT,
            motivo_rechazo TEXT,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT
        )`, [], () => {
            agregarSoporteLWW(db, 'solicitudes_venta', ['id']);
        });
        db.run(`CREATE INDEX IF NOT EXISTS idx_solicitudes_venta_estado ON solicitudes_venta(estado)`);

        // 14. Tabla de Movimientos de Inventario (Kardex): registro append-only de cada cambio de
        // stock, con el delta firmado ya aplicado y el motivo (`tipo`) que lo originó. Sin esta
        // tabla, inventario_sucursal.stock solo refleja el saldo actual y no hay forma de auditar
        // ni reconstruir el historial de ventas/abastecimientos/traslados/bajas.
        db.run(`CREATE TABLE IF NOT EXISTS movimientos_inventario (
            id TEXT PRIMARY KEY,
            producto_id TEXT NOT NULL,
            sucursal_id TEXT NOT NULL,
            tipo TEXT NOT NULL,
            cantidad INTEGER NOT NULL,
            referencia_id TEXT,
            usuario TEXT,
            fecha TEXT,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT,
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
            FOREIGN KEY (sucursal_id) REFERENCES config_sucursal(id) ON DELETE CASCADE
        )`, [], () => {
            agregarSoporteLWW(db, 'movimientos_inventario', ['id']);
        });
        db.run(`CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_producto ON movimientos_inventario(producto_id, sucursal_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_referencia ON movimientos_inventario(referencia_id)`);

        // 14a. AJUSTE_EDICION_PRODUCTO guarda aquí el valor absoluto de stock que el usuario
        // tecleó ("el stock real es X"), además del delta ingenuo en `cantidad`. Es lo que permite
        // que la nube recalcule el delta real contra el stock vigente al momento de aplicar (ver
        // aplicar_correccion_stock en sync/migrate_correccion_stock.sql), en vez de sumar a ciegas
        // el delta calculado contra una copia local que pudo quedar desactualizada frente a otra
        // terminal -- la causa de que dos correcciones concurrentes al mismo valor real terminaran
        // restando dos veces en vez de converger. NULL para cualquier otro tipo de movimiento.
        db.run(`ALTER TABLE movimientos_inventario ADD COLUMN stock_objetivo INTEGER`, [], () => { });

        // 14b. Kardex del hold de Pedidos/Apartados (inventario_sucursal.stock_reservado): mismo
        // problema y misma solución que movimientos_inventario para `stock` -- stock_reservado lo
        // tocan crear/editar/cancelar/entregar pedido desde distintas terminales, así que se
        // sincroniza por delta atómico (ver aplicar_reserva_inventario en
        // sync/migrate_stock_delta_sync.sql) en vez de subir stock_reservado como foto con LWW.
        db.run(`CREATE TABLE IF NOT EXISTS movimientos_reserva_inventario (
            id TEXT PRIMARY KEY,
            producto_id TEXT NOT NULL,
            sucursal_id TEXT NOT NULL,
            tipo TEXT NOT NULL,
            cantidad INTEGER NOT NULL,
            referencia_id TEXT,
            usuario TEXT,
            fecha TEXT,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT,
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
            FOREIGN KEY (sucursal_id) REFERENCES config_sucursal(id) ON DELETE CASCADE
        )`, [], () => {
            agregarSoporteLWW(db, 'movimientos_reserva_inventario', ['id']);
        });
        db.run(`CREATE INDEX IF NOT EXISTS idx_movimientos_reserva_inventario_producto ON movimientos_reserva_inventario(producto_id, sucursal_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_movimientos_reserva_inventario_referencia ON movimientos_reserva_inventario(referencia_id)`);

        // 15. Hold de inventario para Pedidos/Apartados: cantidad comprometida que aún no sale
        // físicamente del stock (se descuenta de `stock` recién al entregar el pedido, ver
        // services/pedidoService.js). "Disponible para vender" = stock - stock_reservado.
        db.run(`ALTER TABLE inventario_sucursal ADD COLUMN stock_reservado INTEGER DEFAULT 0`, [], () => { });

        // 16. Tabla de Pedidos (Apartados): el cliente reserva productos para recoger en una fecha
        // futura, paga abonos mientras tanto y el producto queda en `stock_reservado` hasta que se
        // entrega (ahí se descuenta el stock real y se genera la venta) o se cancela (se libera el
        // hold sin tocar el stock).
        db.run(`CREATE TABLE IF NOT EXISTS pedidos (
            id TEXT PRIMARY KEY,
            sucursal_id TEXT NOT NULL,
            cliente_id TEXT NOT NULL,
            fecha_pedido TEXT NOT NULL,
            fecha_entrega_estimada TEXT NOT NULL,
            fecha_entrega_real TEXT,
            estado TEXT NOT NULL DEFAULT 'pendiente',
            total REAL NOT NULL,
            notas TEXT,
            venta_id TEXT,
            usuario_creo TEXT,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT,
            FOREIGN KEY(cliente_id) REFERENCES clientes(id)
        )`, [], () => {
            agregarSoporteLWW(db, 'pedidos', ['id']);
        });
        db.run(`CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_entrega ON pedidos(fecha_entrega_estimada)`);

        // Snapshot del nombre/identificación/teléfono del cliente al momento de crear el pedido.
        // `clientes` permite borrado físico (ver eliminar-cliente en registerClientesIpc y la
        // sincronización, que hace DELETE FROM clientes tras subir el soft-delete), así que el
        // LEFT JOIN con clientes puede perder al cliente en cualquier momento y dejar el pedido
        // sin nombre en el listado/detalle. Estas columnas garantizan que el pedido conserve los
        // datos con los que se creó incluso si el cliente se elimina después (ver COALESCE en
        // registerPedidosIpc.js).
        // Estos 3 backfills reescriben columnas derivadas en TODA la tabla `pedidos`, no un cambio
        // real de ningún pedido puntual -- por eso se quita el trigger de auto-bump de updated_at
        // mientras corren y se recrea al final (ver crearTriggerUpdatedAt arriba). Bug real que
        // esto corrige: sin quitar el trigger, este backfill pisaba el updated_at de pedidos que
        // otro equipo todavía no había descargado, haciendo que esa descarga se descartara por LWW
        // (parecía "más vieja" que el backfill) y quedara encasillada para siempre.
        db.run(`DROP TRIGGER IF EXISTS trg_pedidos_updated_at`, [], () => {
            db.run(`ALTER TABLE pedidos ADD COLUMN cliente_nombre_registro TEXT`, [], () => {
                db.run(`
                    UPDATE pedidos SET cliente_nombre_registro = (SELECT nombre FROM clientes WHERE clientes.id = pedidos.cliente_id)
                    WHERE cliente_nombre_registro IS NULL
                `, [], () => { });
            });
            db.run(`ALTER TABLE pedidos ADD COLUMN cliente_identificacion_registro TEXT`, [], () => {
                db.run(`
                    UPDATE pedidos SET cliente_identificacion_registro = (SELECT identificacion FROM clientes WHERE clientes.id = pedidos.cliente_id)
                    WHERE cliente_identificacion_registro IS NULL
                `, [], () => { });
            });
            db.run(`ALTER TABLE pedidos ADD COLUMN cliente_telefono_registro TEXT`, [], () => {
                db.run(`
                    UPDATE pedidos SET cliente_telefono_registro = (SELECT telefono FROM clientes WHERE clientes.id = pedidos.cliente_id)
                    WHERE cliente_telefono_registro IS NULL
                `, [], () => {
                    crearTriggerUpdatedAt(db, 'pedidos', ['id']);
                });
            });
        });

        // 17. Tabla de Detalle de Pedidos
        db.run(`CREATE TABLE IF NOT EXISTS detalle_pedidos (
            id TEXT PRIMARY KEY,
            pedido_id TEXT NOT NULL,
            producto_id TEXT NOT NULL,
            cantidad INTEGER NOT NULL,
            precio_unitario REAL NOT NULL,
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT,
            FOREIGN KEY(pedido_id) REFERENCES pedidos(id),
            FOREIGN KEY(producto_id) REFERENCES productos(id)
        )`, [], () => {
            agregarSoporteLWW(db, 'detalle_pedidos', ['id']);
        });
        db.run(`CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_pedido ON detalle_pedidos(pedido_id)`);

        // 18. Tabla de Abonos de Pedido (mismo shape que abonos_credito)
        db.run(`CREATE TABLE IF NOT EXISTS abonos_pedido (
            id TEXT PRIMARY KEY,
            pedido_id TEXT NOT NULL,
            monto REAL NOT NULL,
            fecha TEXT NOT NULL,
            metodo_pago TEXT NOT NULL,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT,
            FOREIGN KEY(pedido_id) REFERENCES pedidos(id)
        )`, [], () => {
            agregarSoporteLWW(db, 'abonos_pedido', ['id']);
        });
        db.run(`CREATE INDEX IF NOT EXISTS idx_abonos_pedido_pedido ON abonos_pedido(pedido_id)`);

        // 19. Tabla de Cierres de Caja: cuadre de caja por ventana de tiempo (cambios de turno,
        // verificaciones puntuales o cierre de día), ver services/cierreCajaService.js. Cada
        // cierre retira físicamente el efectivo contado a caja fuerte, así que el turno siguiente
        // siempre arranca del fondo_base fijo -- no se encadena el conteo del cierre anterior --
        // y fecha_desde/fecha_hasta delimitan la ventana exacta que cada operador contó, para que
        // cada uno responda solo por su propio turno y no por el de otro operador el mismo día.
        db.run(`CREATE TABLE IF NOT EXISTS cierres_caja (
            id TEXT PRIMARY KEY,
            sucursal_id TEXT NOT NULL,
            usuario TEXT,
            rol TEXT,
            tipo TEXT NOT NULL,
            nota TEXT,
            fecha_desde TEXT NOT NULL,
            fecha_hasta TEXT NOT NULL,
            fondo_base REAL NOT NULL,
            efectivo_esperado REAL NOT NULL,
            efectivo_contado REAL NOT NULL,
            diferencia REAL NOT NULL,
            denominaciones TEXT,
            sync_status TEXT DEFAULT 'pending',
            updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            deleted_at TEXT
        )`, [], () => {
            agregarSoporteLWW(db, 'cierres_caja', ['id']);
        });
        db.run(`CREATE INDEX IF NOT EXISTS idx_cierres_caja_sucursal_fecha ON cierres_caja(sucursal_id, fecha_hasta)`);

        // Enlaza el gasto de reembolso generado al cancelar un pedido con el pedido que lo originó
        // (mismo propósito que gastos.venta_id para el gasto de "Domicilio", ver ventaService.js).
        db.run(`ALTER TABLE gastos ADD COLUMN pedido_id TEXT`, [], () => { });

        // 10. Crear índices de optimización para búsquedas rápidas locales
        db.run(`CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_ventas_sucursal ON ventas(sucursal_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta ON detalle_ventas(venta_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_detalle_ventas_producto ON detalle_ventas(producto_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_gastos_sucursal ON gastos(sucursal_id)`);
    });
}

module.exports = { initDB };
