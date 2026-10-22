# Graph Report - .  (2026-10-22)

## Corpus Check
- 96 files · ~137,298 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 990 nodes · 2189 edges · 49 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 846 · calls: 440 · MODIFIES: 419 · imports: 168 · imports_from: 107 · ON_BRANCH: 66 · PARENT_OF: 44 · references: 29 · triggers: 26 · reads_from: 24 · method: 20


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 96 · Candidates: 107
- Excluded: 0 untracked · 10771 ignored · 0 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `61749d1`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `procesarSincronizacion()` - 48 edges
2. `descargarDesdeCursor()` - 22 edges
3. `QueryBuilder` - 21 edges
4. `actualizarCursor()` - 19 edges
5. `runQuery()` - 18 edges
6. `allQuery()` - 18 edges
7. `upsertConLWW()` - 17 edges
8. `db` - 14 edges
9. `registrarAuditoria()` - 14 edges
10. `trg_lww_guard` - 14 edges

## Surprising Connections (you probably didn't know these)
- `155d086 Use sessionStorage and add multi-window support` --ON_BRANCH--> `Tienda-Kary`  [EXTRACTED]
  git → git  _Bridges community 36 → community 1_
- `155d086 Use sessionStorage and add multi-window support` --PARENT_OF--> `1dd520d Add configurable PostgreSQL sync backend`  [EXTRACTED]
  git → git  _Bridges community 36 → community 31_
- `1dd520d Add configurable PostgreSQL sync backend` --ON_BRANCH--> `Tienda-Kary`  [EXTRACTED]
  git → git  _Bridges community 31 → community 1_
- `22e246f Add fiscal client and credit tracking improvements` --ON_BRANCH--> `delipostres-turbaco`  [EXTRACTED]
  git → git  _Bridges community 10 → community 1_
- `22e246f Add fiscal client and credit tracking improvements` --PARENT_OF--> `395c0c1 Add PostgreSQL sync and turno management`  [EXTRACTED]
  git → git  _Bridges community 10 → community 26_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (64): actualizarCursor(), { BrowserWindow }, console, descargarDesdeCursor(), descargarTodo(), esErrorColumnaInexistente(), esErrorFuncionInexistente(), esErrorTablaInexistente() (+56 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (50): Tienda-Kary, delipostres-turbaco, main, 10222a9 refactor: enforce full payment for order delivery and implement dedicated services for pedidos and IPC management., 2812d87 feat: implementa módulo de cierres de caja con registro, auditoría y cálculo de ventanas de tiempo, 283a3fc feat: agrega splitter arrastrable para ajustar ancho de paneles en arqueo, 308b9c1 feat: implement incremental synchronization, atomic inventory corrections, and diagnostic tools for stock consistency., 4986e5d refactor: migrate temporary cart storage from localStorage to sessionStorage for window isolation (+42 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (46): a4cb7fc Add ability to revert delivered orders (admin), aeae7ec Smart product search and seed scripts, abrirDetallePedido(), actualizarSaldoPendienteDetalle(), agregarAbono(), agregarAlCarritoPedido(), agregarProductoAlDetalle(), aplicarPermisosDetalle() (+38 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (42): 6a58133 Make Supabase optional; use package-based DB names, initDB(), { ipcMain }, registerAuditoriaIpc(), { supabaseLogs }, registerClientesIpc(), registerGastosIpc(), registerImpresionIpc() (+34 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (33): actualizarEstadoBotonCobrar(), actualizarEstadoBotonDeshacer(), actualizarEstadoDescuentoUI(), agregarAlCarrito(), BOLSAS_ACCESO_RAPIDO, btnLogout, calcularTotalItemConDescuento(), calcularTotalVenta() (+25 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (19): asegurarCategoriasPasteleriaCargadas(), btnCloseDetalleSolicitud, btnCloseDetalleSolicitudGasto, btnCloseSucursalBloqueada, cargarClientes(), cargarSugeridosPasteleria(), categoriasCargadasPasteleria, construirDetalleSolicitudHTML() (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (32): actualizarEstadoDescuentoUI(), agregarAlCarrito(), btnLogout, calcularTotalVenta(), cambiarCantidad(), cambiarModo(), cancelarEdicion(), cargarCatalogo() (+24 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (30): public, public.abonos_credito, public.abonos_pedido, public.aplicar_correccion_stock(), public.aplicar_movimiento_inventario(), public.aplicar_reserva_inventario(), public.auditoria, public.categorias (+22 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (28): calcularTotalEdicionVenta(), cargarDevoluciones(), cargarReporte(), catalogoProductosEdicion, catalogoProductosEdicionTrans, coincideAbonoFiltro(), coincideTotalBusqueda(), coincideVentaFiltro() (+20 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (30): categorias, clientes, config_sucursal, lww_guard_movimientos_inventario, pedidos, productos, public.abonos_credito, public.abonos_pedido (+22 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (22): 22e246f Add fiscal client and credit tracking improvements, b9061d3 Mejoras de sesión, reportes y descuentos, fa97bc4 Mostrar descuentos y subtotales en ventas, { db, runQuery, allQuery }, { formatearCOP, sanitizarNombreArchivo, construirHtmlCuentaCobro, extraerDomicilioDeMetodoPago }, fs, { ipcMain, BrowserWindow, dialog, app }, { obtenerFechaHoyYYYYMMDD } (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (25): allQuery(), { app }, db, dbPath, { isProd }, path, pkg, runQuery() (+17 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (20): { db, runQuery, allQuery }, { esFechaAnteriorValida, construirFechaISODeDia }, { insertarVentaTx, eliminarVentaTx, editarVentaCompletaTx }, { ipcMain }, { registrarAuditoria }, { solicitarSincronizacion }, { v4: uuidv4 }, { BrowserWindow } (+12 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (15): bd7e03e Rebrand to Tienda de Kary and add mayorista support, bfa73bf Add pastelería sugeridos, gasto retroactivo & sync, { allQuery }, {
    calcularRecomendacionesPasteleriaSucursal,
    obtenerProductosPasteleriaConSugeridos,
    upsertSugeridoPasteleriaTx
}, fs, { generarExcelPedidoExtra }, { generarExcelSugeridosPasteleria }, { ipcMain, BrowserWindow, dialog } (+7 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (9): actualizarBotonesPaginacion(), cargarAuditoria(), fechaDesdeBogotaAUTC(), fechaHastaBogotaAUTC(), guardarFiltrosEnStorage(), mapaProductos, normalizeStr(), productoIdsPorNombre() (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (15): actualizarMontoGeneral(), actualizarValorFila(), cargarDatosDeSucursal(), cargarDescripcionesFrecuentesOperativo(), descripcionesFrecuentesOperativo, encontrarProductoPorNombre(), formatNumberUI(), mapaClavePorProductoId (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.16
Nodes (19): registrarMovimientoReserva(), ajustarStockReservado(), { BrowserWindow }, cancelarPedidoTx(), crearPedidoTx(), { db, runQuery, allQuery }, describirCambiosPedido(), editarPedidoTx() (+11 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (13): calcularEstadoCreditos(), calcularRangoFechasFiltro(), cargarReporteCreditos(), cargarReportesGestion(), datosReporteCreditos, datosReporteGlobal, exportarCreditosExcel(), extraerDomicilio() (+5 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (1): QueryBuilder

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (16): { calcularVentanaYEsperado, registrarCierreCajaTx, obtenerCierresCaja, eliminarCierreCajaTx, recalcularCierreCajaTx }, { ipcMain }, registerCierresCajaIpc(), calcularEfectivoVentana(), calcularVentanaYEsperado(), eliminarCierreCajaTx(), inicioDeHoyISO(), obtenerCierresCaja() (+8 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (14): fs, { generarPlantillaAbastecimiento, leerPlantillaAbastecimiento }, { ipcMain, BrowserWindow, dialog }, path, { processLocalProductImage }, { registrarAuditoria }, { registrarMovimientoInventario }, { runQuery, allQuery } (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.16
Nodes (13): { db, runQuery, allQuery }, { esFechaAnteriorValida, construirFechaISODeDia, obtenerFechaHoyYYYYMMDD }, { insertarGastoTx }, { ipcMain }, { registrarAuditoria }, { registrarMovimientoInventario }, { solicitarSincronizacion }, { TIPOS_GASTO, ESTADOS_DEVOLUCION, requiereAjusteInventario } (+5 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (14): esErrorRls(), obtenerMensajeSync(), registrarAuditoria(), { runQuery }, { v4: uuidv4 }, { BrowserWindow }, { db, runQuery }, insertarGastoTx() (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.19
Nodes (14): { construirTicketBuffer, construirTicketPedidoBuffer }, enviarBytesCrudosAImpresora(), { execFile, execFileSync }, fs, guardarImpresoraLocal(), imprimirTicket(), imprimirTicketPedido(), leerImpresoraGuardada() (+6 more)

### Community 24 - "Community 24"
Cohesion: 0.21
Nodes (14): actualizarDestinosDisponibles(), agregarACanasta(), cambiarCantidad(), cargarCatalogo(), cargarSucursales(), categoriasCargadas, enviarTransferencia(), filtrarYRenderizarCatalogo() (+6 more)

### Community 25 - "Community 25"
Cohesion: 0.30
Nodes (11): aplicarBloqueoCierreDia(), calcularTotales(), cargarHistorialCierres(), cargarVentanaCajaActual(), confirmarCierreCaja(), eliminarCierreCaja(), formatCOP(), limpiarValoresCuadre() (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (11): 395c0c1 Add PostgreSQL sync and turno management, 61749d1 Merge branch 'delipostres-turbaco' of https://github.com/JuanDvv/Sistema-POS into delipostres-turbaco, 9140912 Add PostgreSQL sync and turno management, { db, allQuery }, { procesarSincronizacion }, { remoteDbClient, getPool }, getPool(), { obtenerConfigServidor } (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (13): ALIGN_CENTER, ALIGN_LEFT, ALIGN_RIGHT, AVANCE_PAPEL(), BOLD_OFF, BOLD_ON, construirTicketBuffer(), construirTicketPedidoBuffer() (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (7): cargarProductos(), categoriasCargadas, filtrarYRenderizar(), idsRecienActualizados, normalizeStr(), productosCargados, renderizarProductos()

### Community 29 - "Community 29"
Cohesion: 0.19
Nodes (12): calcularProximaEntrega(), calcularRecomendacionesPasteleriaSucursal(), calcularRecomendacionExtra(), COLUMNA_SUGERIDO_POR_DIA, { db, runQuery, allQuery }, DIAS_ENTREGA, fechaLocalYMD(), obtenerProductosPasteleriaConSugeridos() (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.19
Nodes (9): 29d31c1 feat: implement complete POS system architecture with IPC handlers, audit logging, and sync services, 821d5ac feat: implement system-wide order management module including IPC integration, database schema updates, and dynamic client handling., { imprimirTicket, imprimirTicketPedido, listarImpresorasDisponibles, guardarImpresoraLocal, leerImpresoraGuardada }, { ipcMain, BrowserWindow }, { db, runQuery, allQuery }, { ipcMain }, { registrarAuditoria }, { solicitarSincronizacion } (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (12): 1dd520d Add configurable PostgreSQL sync backend, 58e2652 Add volume discounts and secure DB config, e089d11 Add volume discounts and secure DB config, f57487f Merge branch 'Tienda-Kary' of https://github.com/JuanDvv/Sistema-POS into Tienda-Kary, { ipcMain, BrowserWindow, screen }, { obtenerConfigServidor, guardarConfigServidor }, path, { procesarSincronizacion, isSincronizando, hayConexionConocida } (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (7): { allQuery }, fs, { ipcMain, BrowserWindow, dialog, app }, path, { TIPOS_GASTO, ESTADOS_DEVOLUCION }, ESTADOS_DEVOLUCION, TIPOS_GASTO

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (12): aplicar, args, calcularDiferencias(), cliente, { createClient }, leerTodo(), main(), PROD (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.20
Nodes (11): args, cliente, { createClient }, leerTodo(), main(), PROD, TABLAS, TEST (+3 more)

### Community 35 - "Community 35"
Cohesion: 0.23
Nodes (11): borrarSqliteLocalDeTest(), { createClient }, { execFileSync }, fs, main(), nombreAppDesdePackageJson(), path, rutaUserDataElectron() (+3 more)

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (9): 155d086 Use sessionStorage and add multi-window support, actualizarBadgePedidosAtrasados(), actualizarBadgeSolicitudes(), actualizarBotonSync(), actualizarProximaSincronizacion(), aplicarEstadoConexion(), aplicarEstadoSincronizando(), ejecutarSincronizacion() (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (9): 753cf10 Add revert-delivery feature and focus fixes, 98e6778 Update package.json, b08f3b6 Aislar configuración de Supabase y BD, {
    crearPedidoTx, registrarAbonoPedidoTx, eliminarAbonoPedidoTx,
    editarPedidoTx, cancelarPedidoTx, entregarPedidoTx, revertirEntregaPedidoTx
}, { db, allQuery }, { ipcMain }, { obtenerFechaHoyYYYYMMDD }, eliminarAbonoPedidoTx() (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.24
Nodes (9): { ipcMain }, { listarAbonosEliminados, recuperarAbono }, registerAbonosIpc(), listarAbonosEliminados(), purgarAbonosEliminadosAntiguos(), recuperarAbono(), { registrarAuditoria }, { runQuery, allQuery } (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (8): { app }, appEnv, { createClient }, isSyncConfigured, { obtenerConfigServidor }, pkg, { remoteDbClient }, serverConfig

### Community 40 - "Community 40"
Cohesion: 0.39
Nodes (7): calcularTurno(), cargarOperadoresStorage(), generarBadgeTurno(), inicializarModuloTurnos(), obtenerDeltaDias(), poblarSelectoresOperadores(), renderizarTabla()

### Community 41 - "Community 41"
Cohesion: 0.32
Nodes (4): c4fc4fe Use sessionStorage; add multi-window & sync, public.abonos_credito, public.abonos_pedido, public.purgar_abonos_eliminados_antiguos()

### Community 42 - "Community 42"
Cohesion: 0.36
Nodes (7): { app }, DEFAULT_CONFIG, fs, getConfigFilePath(), guardarConfigServidor(), obtenerConfigServidor(), path

### Community 43 - "Community 43"
Cohesion: 0.43
Nodes (6): public.aplicar_movimiento_inventario(), public.aplicar_reserva_inventario(), public.inventario_sucursal, public.movimientos_inventario, public.movimientos_reserva_inventario, trg_lww_guard

### Community 44 - "Community 44"
Cohesion: 0.29
Nodes (5): db, dbPath, fs, path, sqlite3

### Community 45 - "Community 45"
Cohesion: 0.60
Nodes (5): public.aplicar_correccion_stock(), public.inventario_sucursal, public.movimientos_inventario, v_delta_real, v_stock_actual

### Community 46 - "Community 46"
Cohesion: 0.60
Nodes (5): ON, public, public.assign_sync_seq(), trg_, ya

### Community 47 - "Community 47"
Cohesion: 0.83
Nodes (3): public.solicitudes_gasto, trg_lww_guard, trg_solicitudes_gasto_sync_seq

### Community 48 - "Community 48"
Cohesion: 0.83
Nodes (3): public.sugeridos_pasteleria, trg_lww_guard, trg_sugeridos_pasteleria_sync_seq

## Knowledge Gaps
- **288 isolated node(s):** `mapaProductos`, `btnCloseSucursalBloqueada`, `todosLosClientes`, `ultimasSolicitudesCargadas`, `btnCloseDetalleSolicitud` (+283 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 18`** (1 nodes): `QueryBuilder`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `QueryBuilder` connect `Community 18` to `Community 26`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `allQuery()` connect `Community 11` to `Community 26`, `Community 10`, `Community 21`, `Community 37`, `Community 13`, `Community 20`, `Community 32`, `Community 30`, `Community 12`, `Community 38`, `Community 19`, `Community 16`, `Community 29`, `Community 0`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `procesarSincronizacion()` connect `Community 0` to `Community 26`, `Community 31`, `Community 3`, `Community 11`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `mapaProductos`, `btnCloseSucursalBloqueada`, `todosLosClientes` to the rest of the system?**
  _288 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09711538461538462 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07205513784461152 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0734006734006734 - nodes in this community are weakly interconnected._