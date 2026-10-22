# Graph Report - .  (2026-10-22)

## Corpus Check
- 94 files · ~132,625 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 939 nodes · 1986 edges · 53 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 803 · calls: 377 · MODIFIES: 365 · imports: 140 · imports_from: 89 · ON_BRANCH: 61 · triggers: 43 · PARENT_OF: 37 · reads_from: 25 · references: 25 · method: 21


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 94 · Candidates: 103
- Excluded: 0 untracked · 10770 ignored · 0 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `1dd520d`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `procesarSincronizacion()` - 42 edges
2. `QueryBuilder` - 22 edges
3. `descargarDesdeCursor()` - 20 edges
4. `actualizarCursor()` - 17 edges
5. `runQuery()` - 16 edges
6. `trg_lww_guard` - 15 edges
7. `upsertConLWW()` - 15 edges
8. `allQuery()` - 14 edges
9. `trg_lww_guard` - 14 edges
10. `softDeleteConLWW()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `155d086 Use sessionStorage and add multi-window support` --ON_BRANCH--> `Tienda-Kary`  [EXTRACTED]
  git → git  _Bridges community 32 → community 8_
- `155d086 Use sessionStorage and add multi-window support` --PARENT_OF--> `1dd520d Add configurable PostgreSQL sync backend`  [EXTRACTED]
  git → git  _Bridges community 32 → community 37_
- `1dd520d Add configurable PostgreSQL sync backend` --ON_BRANCH--> `Tienda-Kary`  [EXTRACTED]
  git → git  _Bridges community 37 → community 8_
- `22e246f Add fiscal client and credit tracking improvements` --ON_BRANCH--> `delipostres-turbaco`  [EXTRACTED]
  git → git  _Bridges community 2 → community 8_
- `22e246f Add fiscal client and credit tracking improvements` --PARENT_OF--> `9140912 Add PostgreSQL sync and turno management`  [EXTRACTED]
  git → git  _Bridges community 2 → community 40_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (59): isSyncConfigured, actualizarCursor(), { BrowserWindow }, console, descargarDesdeCursor(), descargarTodo(), esErrorColumnaInexistente(), esErrorFuncionInexistente() (+51 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (44): abrirDetallePedido(), actualizarSaldoPendienteDetalle(), agregarAbono(), agregarAlCarritoPedido(), agregarProductoAlDetalle(), aplicarPermisosDetalle(), badgeEstado(), cambiarCantidadDetalle() (+36 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (39): 22e246f Add fiscal client and credit tracking improvements, b9061d3 Mejoras de sesión, reportes y descuentos, { db, runQuery, allQuery }, { formatearCOP, sanitizarNombreArchivo, construirHtmlCuentaCobro, extraerDomicilioDeMetodoPago }, fs, { ipcMain, BrowserWindow, dialog, app }, { obtenerFechaHoyYYYYMMDD }, path (+31 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (38): initDB(), { ipcMain }, { listarAbonosEliminados, recuperarAbono }, registerAbonosIpc(), registerAuditoriaIpc(), registerCierresCajaIpc(), registerClientesIpc(), registerImpresionIpc() (+30 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (34): actualizarEstadoBotonCobrar(), actualizarEstadoBotonDeshacer(), actualizarEstadoDescuentoUI(), agregarAlCarrito(), btnLogout, calcularDescuentoLinea(), calcularTotalVenta(), cambiarCantidad() (+26 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (33): actualizarEstadoDescuentoUI(), agregarAlCarrito(), btnLogout, calcularTotalVenta(), cambiarCantidad(), cambiarModo(), cancelarEdicion(), cargarCatalogo() (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (29): public, public.abonos_credito, public.abonos_pedido, public.aplicar_correccion_stock(), public.aplicar_movimiento_inventario(), public.aplicar_reserva_inventario(), public.auditoria, public.categorias (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (30): categorias, clientes, config_sucursal, lww_guard_movimientos_inventario, pedidos, productos, public.abonos_credito, public.abonos_pedido (+22 more)

### Community 8 - "Community 8"
Cohesion: 0.20
Nodes (24): Tienda-Kary, delipostres-turbaco, 10222a9 refactor: enforce full payment for order delivery and implement dedicated services for pedidos and IPC management., 2812d87 feat: implementa módulo de cierres de caja con registro, auditoría y cálculo de ventanas de tiempo, 283a3fc feat: agrega splitter arrastrable para ajustar ancho de paneles en arqueo, 308b9c1 feat: implement incremental synchronization, atomic inventory corrections, and diagnostic tools for stock consistency., 4986e5d refactor: migrate temporary cart storage from localStorage to sessionStorage for window isolation, 4c924e9 feat: implement robust sync engine with LWW conflict resolution, incremental pulls, and UI layout fix for save button (+16 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (22): { db, runQuery, allQuery }, { esFechaAnteriorValida, construirFechaISODeDia }, { insertarVentaTx, eliminarVentaTx, editarVentaCompletaTx }, { ipcMain }, registerVentasIpc(), { registrarAuditoria }, { solicitarSincronizacion }, { v4: uuidv4 } (+14 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (22): lww_guard_movimientos_inventario, public.abonos_credito, public.abonos_pedido, public.categorias, public.clientes, public.config_sucursal, public.detalle_pedidos, public.detalle_transferencias (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (10): btnCloseDetalleSolicitud, btnCloseDetalleSolicitudGasto, btnCloseSucursalBloqueada, cargarClientes(), construirDetalleSolicitudHTML(), renderizarClientes(), tablaItemsSolicitud(), todosLosClientes (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (20): 5bfc128 feat: implement synchronization engine and database infrastructure to support multi-environment data consistency and inventory tracking, allQuery(), { app }, db, dbPath, { isProd }, path, pkg (+12 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (14): 753cf10 Add revert-delivery feature and focus fixes, 98e6778 Update package.json, a4cb7fc Add ability to revert delivered orders (admin), b08f3b6 Aislar configuración de Supabase y BD, bd7e03e Rebrand to Tienda de Kary and add mayorista support, bfa73bf Add pastelería sugeridos, gasto retroactivo & sync, c4fc4fe Use sessionStorage; add multi-window & sync, {
    crearPedidoTx, registrarAbonoPedidoTx, eliminarAbonoPedidoTx,
    editarPedidoTx, cancelarPedidoTx, entregarPedidoTx, revertirEntregaPedidoTx
} (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (21): registrarMovimientoReserva(), ajustarStockReservado(), { BrowserWindow }, cancelarPedidoTx(), crearPedidoTx(), { db, runQuery, allQuery }, describirCambiosPedido(), editarPedidoTx() (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (9): actualizarBotonesPaginacion(), cargarAuditoria(), fechaDesdeBogotaAUTC(), fechaHastaBogotaAUTC(), guardarFiltrosEnStorage(), mapaProductos, normalizeStr(), productoIdsPorNombre() (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (15): actualizarMontoGeneral(), actualizarValorFila(), cargarDatosDeSucursal(), cargarDescripcionesFrecuentesOperativo(), descripcionesFrecuentesOperativo, encontrarProductoPorNombre(), formatNumberUI(), mapaClavePorProductoId (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (1): QueryBuilder

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (16): { imprimirTicket, imprimirTicketPedido, listarImpresorasDisponibles, guardarImpresoraLocal, leerImpresoraGuardada }, { ipcMain, BrowserWindow }, { construirTicketBuffer, construirTicketPedidoBuffer }, enviarBytesCrudosAImpresora(), { execFile, execFileSync }, fs, guardarImpresoraLocal(), imprimirTicket() (+8 more)

### Community 19 - "Community 19"
Cohesion: 0.16
Nodes (9): calcularRangoFechasFiltro(), cargarReporteCreditos(), cargarReportesGestion(), datosReporteCreditos, datosReporteGlobal, formatCOP(), nombresMeses, poblarSelectClientesCredito() (+1 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (14): fs, { generarPlantillaAbastecimiento, leerPlantillaAbastecimiento }, { ipcMain, BrowserWindow, dialog }, path, { processLocalProductImage }, { registrarAuditoria }, { registrarMovimientoInventario }, { runQuery, allQuery } (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.16
Nodes (9): cargarProductos(), categoriasCargadas, coincideBusquedaProducto(), filtrarYRenderizar(), idsRecienActualizados, normalizeStr(), productosCargados, renderizarProductos() (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (14): { db, runQuery, allQuery }, { esFechaAnteriorValida, construirFechaISODeDia, obtenerFechaHoyYYYYMMDD }, { insertarGastoTx }, { ipcMain }, registerGastosIpc(), { registrarAuditoria }, { registrarMovimientoInventario }, { solicitarSincronizacion } (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.30
Nodes (11): aplicarBloqueoCierreDia(), calcularTotales(), cargarHistorialCierres(), cargarVentanaCajaActual(), confirmarCierreCaja(), eliminarCierreCaja(), formatCOP(), limpiarValoresCuadre() (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.17
Nodes (14): calcularEfectivoVentana(), calcularVentanaYEsperado(), eliminarCierreCajaTx(), inicioDeHoyISO(), obtenerCierresCaja(), { obtenerFechaHoyYYYYMMDD }, recalcularCierreCajaTx(), { registrarAuditoria } (+6 more)

### Community 25 - "Community 25"
Cohesion: 0.17
Nodes (13): ALIGN_CENTER, ALIGN_LEFT, ALIGN_RIGHT, AVANCE_PAPEL(), BOLD_OFF, BOLD_ON, construirTicketBuffer(), construirTicketPedidoBuffer() (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (12): { BrowserWindow }, { db, runQuery }, insertarGastoTx(), notificarInventarioActualizado(), { registrarAuditoria }, { registrarMovimientoInventario }, { solicitarSincronizacion }, { TIPOS_GASTO, ESTADOS_DEVOLUCION, requiereAjusteInventario } (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (12): aplicar, args, calcularDiferencias(), cliente, { createClient }, leerTodo(), main(), PROD (+4 more)

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (7): { allQuery }, fs, { ipcMain, BrowserWindow, dialog, app }, path, { TIPOS_GASTO, ESTADOS_DEVOLUCION }, ESTADOS_DEVOLUCION, TIPOS_GASTO

### Community 29 - "Community 29"
Cohesion: 0.23
Nodes (11): CATEGORIAS, COLORES, fs, generarCatalogo(), GRUPOS, main(), obtenerRutasBasesDatos(), path (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.20
Nodes (11): args, cliente, { createClient }, leerTodo(), main(), PROD, TABLAS, TEST (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.23
Nodes (11): borrarSqliteLocalDeTest(), { createClient }, { execFileSync }, fs, main(), nombreAppDesdePackageJson(), path, rutaUserDataElectron() (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (6): 155d086 Use sessionStorage and add multi-window support, 6a58133 Make Supabase optional; use package-based DB names, aeae7ec Smart product search and seed scripts, fa97bc4 Mostrar descuentos y subtotales en ventas, { ipcMain }, { supabaseLogs }

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (10): CATEGORIAS, fs, generarCatalogo(), GRUPOS, main(), obtenerRutasBasesDatos(), path, sembrarEnBaseDeDatos() (+2 more)

### Community 34 - "Community 34"
Cohesion: 0.20
Nodes (10): copiarTabla(), fs, migrar(), newDb, newDbPath, oldDb, oldDbPath, path (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.29
Nodes (9): CATEGORIA, formatearNumeroCOP(), fs, generarProductos(), main(), obtenerRutasBasesDatos(), path, sembrarEnBaseDeDatos() (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (9): args, cliente, { createClient }, leerTodo(), main(), PROD, TEST, usarProd (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.31
Nodes (8): 1dd520d Add configurable PostgreSQL sync backend, { app }, DEFAULT_CONFIG, fs, getConfigFilePath(), guardarConfigServidor(), obtenerConfigServidor(), path

### Community 38 - "Community 38"
Cohesion: 0.22
Nodes (8): { ipcMain, BrowserWindow, screen }, { obtenerConfigServidor, guardarConfigServidor }, path, { procesarSincronizacion, isSincronizando, hayConexionConocida }, registerSistemaIpc(), { runQuery }, { testConnection, resetPool }, hayConexionConocida()

### Community 39 - "Community 39"
Cohesion: 0.39
Nodes (8): actualizarBadgePedidosAtrasados(), actualizarBadgeSolicitudes(), actualizarBotonSync(), actualizarProximaSincronizacion(), aplicarEstadoConexion(), aplicarEstadoSincronizando(), ejecutarSincronizacion(), renderContadorProximaSincronizacion()

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (6): 9140912 Add PostgreSQL sync and turno management, getPool(), { obtenerConfigServidor }, remoteDbClient, resetPool(), testConnection()

### Community 41 - "Community 41"
Cohesion: 0.43
Nodes (6): public.aplicar_movimiento_inventario(), public.aplicar_reserva_inventario(), public.inventario_sucursal, public.movimientos_inventario, public.movimientos_reserva_inventario, trg_lww_guard

### Community 42 - "Community 42"
Cohesion: 0.43
Nodes (7): copiarTabla(), { createClient }, leerTodo(), main(), PROD, subirLotes(), TEST

### Community 43 - "Community 43"
Cohesion: 0.25
Nodes (7): { app }, appEnv, { createClient }, { obtenerConfigServidor }, pkg, { remoteDbClient }, serverConfig

### Community 44 - "Community 44"
Cohesion: 0.40
Nodes (4): main, 29d31c1 feat: implement complete POS system architecture with IPC handlers, audit logging, and sync services, 821d5ac feat: implement system-wide order management module including IPC integration, database schema updates, and dynamic client handling., db673ca Initial commit

### Community 45 - "Community 45"
Cohesion: 0.40
Nodes (5): esErrorRls(), obtenerMensajeSync(), registrarAuditoria(), { runQuery }, { v4: uuidv4 }

### Community 46 - "Community 46"
Cohesion: 0.60
Nodes (5): public.aplicar_correccion_stock(), public.inventario_sucursal, public.movimientos_inventario, v_delta_real, v_stock_actual

### Community 47 - "Community 47"
Cohesion: 0.60
Nodes (5): ON, public, public.assign_sync_seq(), trg_, ya

### Community 48 - "Community 48"
Cohesion: 0.83
Nodes (3): public.cierres_caja, trg_cierres_caja_sync_seq, trg_lww_guard

### Community 49 - "Community 49"
Cohesion: 0.83
Nodes (3): public, public.kardex_checkpoints, public.podar_kardex()

### Community 50 - "Community 50"
Cohesion: 0.83
Nodes (3): public.solicitudes_gasto, trg_lww_guard, trg_solicitudes_gasto_sync_seq

### Community 51 - "Community 51"
Cohesion: 0.83
Nodes (3): public.sugeridos_pasteleria, trg_lww_guard, trg_sugeridos_pasteleria_sync_seq

### Community 52 - "Community 52"
Cohesion: 1.00
Nodes (2): public.auditoria, public.limpiar_auditoria_antigua()

## Knowledge Gaps
- **272 isolated node(s):** `mapaProductos`, `btnCloseSucursalBloqueada`, `todosLosClientes`, `ultimasSolicitudesCargadas`, `btnCloseDetalleSolicitud` (+267 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 17`** (1 nodes): `QueryBuilder`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `public.auditoria`, `public.limpiar_auditoria_antigua()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `QueryBuilder` connect `Community 17` to `Community 40`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `procesarSincronizacion()` connect `Community 0` to `Community 38`, `Community 3`, `Community 9`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `runQuery()` connect `Community 12` to `Community 2`, `Community 22`, `Community 20`, `Community 38`, `Community 9`, `Community 13`, `Community 45`, `Community 24`, `Community 26`, `Community 14`, `Community 0`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `mapaProductos`, `btnCloseSucursalBloqueada`, `todosLosClientes` to the rest of the system?**
  _272 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09774011299435029 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07184325108853411 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05647058823529412 - nodes in this community are weakly interconnected._