# Graph Report - .  (2026-10-28)

## Corpus Check
- Corpus is ~14,153 words - fits in a single context window. You may not need a graph.

## Summary
- 212 nodes · 405 edges · 12 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 148 · ON_BRANCH: 70 · calls: 63 · imports: 51 · PARENT_OF: 48 · imports_from: 25


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 16 · Candidates: 21
- Excluded: 0 untracked · 213 ignored · 0 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `b4f4e10`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 10 edges
2. `ejecutarQuery()` - 9 edges
3. `abrirModalEditarVenta()` - 7 edges
4. `calcularTurnosRango()` - 6 edges
5. `cargarCatalogo()` - 6 edges
6. `formatearFechaAuditoria()` - 6 edges
7. `obtenerFechaWallClock()` - 5 edges
8. `restaurarSesion()` - 5 edges
9. `cargarTurnosAdmin()` - 5 edges
10. `obtenerPartesWallClock()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (49): Tienda-Kary, delipostres-turbaco, main, 10222a9 refactor: enforce full payment for order delivery and implement dedicated services for pedidos and IPC management., 155d086 Use sessionStorage and add multi-window support, 1dd520d Add configurable PostgreSQL sync backend, 22e246f Add fiscal client and credit tracking improvements, 2812d87 feat: implementa módulo de cierres de caja con registro, auditoría y cálculo de ventanas de tiempo (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (39): abrirModalDetalleSolGasto(), abrirModalDetalleSolVenta(), abrirModalEditarVenta(), apiFetch(), badgeTurnoHtml(), btnReloadApp, cambiarFechaInicioTurnos(), cargarAuditoriaWeb() (+31 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (27): validarAbastecimiento(), validarDatosCategoria(), validarDatosProducto(), { buscarUsuarioPorUsername, registrarAuditoriaRemota }, { calcularTurnosRango }, config, enviarJson(), extraerTokenRequest() (+19 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (20): buscarGastoDomicilioTx(), { calcularResumenFinancieroDia }, construirTimestampParaDia(), crearGastoEnReporte(), describirCambiosProductos(), editarGastoEnReporte(), editarVentaEnReporte(), eliminarGastoEnReporte() (+12 more)

### Community 4 - "Community 4"
Cohesion: 0.23
Nodes (9): ejecutarQuery(), { obtenerConfiguracionEntorno }, obtenerPool(), pg, verificarConexionDb(), { ejecutarQuery }, listarLogsAuditoria(), { ejecutarQuery } (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (10): abastecerStockProducto(), crearProductoConInventario(), editarProductoConInventario(), eliminarCategoriaSoftDelete(), eliminarProductoSoftDelete(), guardarCategoria(), listarCatalogoPorSucursal(), { obtenerPool, ejecutarQuery } (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.31
Nodes (9): BASE_UTC, calcularDeltaDias(), calcularTurno(), calcularTurnosRango(), CICLO_TURNOS, DIAS_SEMANA, formatearUtcAYYYYMMDD(), OPERADORES_DEFAULT (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.32
Nodes (7): calcularResumenFinancieroDia(), extraerMontosMetodoPago(), normalizarMetodoPagoVenta(), TIPOS_GASTO_VALIDOS, validarDatosGasto(), validarEdicionVenta(), validarFechaReporte()

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (5): crypto, firmarTokenSesion(), normalizarCredenciales(), validarUsuarioAutenticado(), verificarTokenSesion()

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (5): buscarUsuarioPorUsername(), { ejecutarQuery }, { obtenerFechaWallClock }, registrarAuditoriaRemota(), { v4: uuidv4 }

### Community 10 - "Community 10"
Cohesion: 0.50
Nodes (4): fs, leerConfigLocalPos(), obtenerConfiguracionEntorno(), path

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (4): { ejecutarQuery }, listarOperadores(), listarSolicitudesGasto(), listarSolicitudesVenta()

## Knowledge Gaps
- **48 isolated node(s):** `CICLO_TURNOS`, `DIAS_SEMANA`, `BASE_UTC`, `OPERADORES_DEFAULT`, `crypto` (+43 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `calcularTurnosRango()` connect `Community 6` to `Community 2`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `ejecutarQuery()` connect `Community 4` to `Community 9`, `Community 5`, `Community 3`, `Community 11`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Why does `editarVentaEnReporte()` connect `Community 3` to `Community 2`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `CICLO_TURNOS`, `DIAS_SEMANA`, `BASE_UTC` to the rest of the system?**
  _48 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10034013605442177 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08309178743961353 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07816091954022988 - nodes in this community are weakly interconnected._