# Node Description Batch 7 of 24

Engram is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the prompt below and write
your JSON answer to the answer file.

## Prompt

You are documenting nodes in a knowledge graph.
For each entry below, write ONE concise factual plain-language sentence
describing what it is or does. Use only the provided context.
For a code symbol (kind=code-symbol — a function, class, or constant),
describe what the function/symbol does based on its name, source location
and neighbors — e.g. "Resolves the configured ontology profile from graphify.yaml.".
For an entity node (any other kind — e.g. a person, place, event, object),
describe what the entity is and its role, grounded in its type, its
relations (neighbors) and the provided citations/evidence — e.g.
"Lady Carfax, a wealthy heiress who disappears en route to Lausanne.".
Ground entity descriptions in the citations/evidence when present; do not
speculate beyond the context, so a node with no supporting context may be
left out of the reply.
Write every description in English (en). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "admin_audit_logs_productoidspornombre": "productoIdsPorNombre()" | kind=code-symbol | source=admin-audit-logs.js:L206 | neighbors=[admin-audit-logs.js, cargarAuditoria(), normalizeStr()]
- "arqueo_limpiarvalorescuadre": "limpiarValoresCuadre()" | kind=code-symbol | source=arqueo.js:L101 | neighbors=[arqueo.js, confirmarCierreCaja(), calcularTotales()]
- "arqueo_recalcularcierrecaja": "recalcularCierreCaja()" | kind=code-symbol | source=arqueo.js:L269 | neighbors=[arqueo.js, formatCOP(), refrescarHistorialTrasEdicion()]
- "categoriafiltro": "categoriaFiltro.js" | kind=code-symbol | source=categoriaFiltro.js:L1 | neighbors=[crearFiltroCategorias(), 29d31c1 feat: implement complete POS sy…, 821d5ac feat: implement system-wide ord…]
- "commit:repo:github.com/JuanDvv/Sistema-POS@98e677833a15dc6e902b7af3ff1c9a1bdb1ec05c": "98e6778 Update package.json" | kind=Commit | source=git | neighbors=[753cf10 Add revert-delivery feature and…, delipostres-turbaco, b08f3b6 Aislar configuración de Supabas…]
- "dashboard_normalizestr": "normalizeStr()" | kind=code-symbol | source=dashboard.js:L29 | neighbors=[dashboard.js, coincideBusquedaProducto(), filtrarYRenderizar()]
- "gastos_actualizarmontogeneral": "actualizarMontoGeneral()" | kind=code-symbol | source=gastos.js:L181 | neighbors=[gastos.js, formatNumberUI(), obtenerProductosVencidos()]
- "gastos_cargardatosdesucursal": "cargarDatosDeSucursal()" | kind=code-symbol | source=gastos.js:L246 | neighbors=[gastos.js, cargarDescripcionesFrecuentesOperativo(), poblarMapaProductos()]
- "gastos_formatnumberui": "formatNumberUI()" | kind=code-symbol | source=gastos.js:L11 | neighbors=[gastos.js, actualizarMontoGeneral(), actualizarValorFila()]
- "gestion_calcularrangofechasfiltro": "calcularRangoFechasFiltro()" | kind=code-symbol | source=gestion.js:L504 | neighbors=[gestion.js, cargarReporteCreditos(), cargarReportesGestion()]
- "gestion_formatcop": "formatCOP()" | kind=code-symbol | source=gestion.js:L1 | neighbors=[gestion.js, cargarReportesGestion(), renderizarTabCreditos()]
- "gestion_renderizartabcreditos": "renderizarTabCreditos()" | kind=code-symbol | source=gestion.js:L945 | neighbors=[gestion.js, cargarReporteCreditos(), formatCOP()]
- "pedidos_actualizarsaldopendientedetalle": "actualizarSaldoPendienteDetalle()" | kind=code-symbol | source=pedidos.js:L238 | neighbors=[pedidos.js, formatCOP(), renderizarCarritoDetalle()]
- "pedidos_cancelarpedidoactual": "cancelarPedidoActual()" | kind=code-symbol | source=pedidos.js:L719 | neighbors=[pedidos.js, cargarCatalogo(), cargarPedidos()]
- "pedidos_combinarfechahoraentrega": "combinarFechaHoraEntrega()" | kind=code-symbol | source=pedidos.js:L94 | neighbors=[pedidos.js, guardarCambiosPedido(), registrarPedido()]
- "pedidos_limpiarformularionuevopedido": "limpiarFormularioNuevoPedido()" | kind=code-symbol | source=pedidos.js:L354 | neighbors=[pedidos.js, renderizarCarritoPedido(), registrarPedido()]
- "pedidos_normalizestr": "normalizeStr()" | kind=code-symbol | source=pedidos.js:L39 | neighbors=[pedidos.js, coincideBusquedaProducto(), filtrarYRenderizarCatalogoPedido()]
- "pedidos_parsenumberui": "parseNumberUI()" | kind=code-symbol | source=pedidos.js:L34 | neighbors=[pedidos.js, agregarAbono(), registrarPedido()]
- "pedidos_revertirentregapedidoactual": "revertirEntregaPedidoActual()" | kind=code-symbol | source=pedidos.js:L732 | neighbors=[pedidos.js, cargarCatalogo(), cargarPedidos()]
- "pedidos_separarfechahoraentrega": "separarFechaHoraEntrega()" | kind=code-symbol | source=pedidos.js:L134 | neighbors=[pedidos.js, abrirDetallePedido(), entregaTieneHoraEspecifica()]
- "reportes_crearfilaseparadorcierre": "crearFilaSeparadorCierre()" | kind=code-symbol | source=reportes.js:L18 | neighbors=[reportes.js, cargarReporte(), formatCOP()]
- "reportes_renderizaritemsedicionventa": "renderizarItemsEdicionVenta()" | kind=code-symbol | source=reportes.js:L1433 | neighbors=[reportes.js, calcularTotalEdicionVenta(), formatCOP()]
- "scripts_seed_apliques_generarproductos": "generarProductos()" | kind=code-symbol | source=scripts/seed_apliques.js:L29 | neighbors=[seed_apliques.sql, formatearNumeroCOP(), main()]
- "scripts_seed_camisetas_generarcatalogo": "generarCatalogo()" | kind=code-symbol | source=scripts/seed_camisetas.js:L103 | neighbors=[seed_camisetas.sql, slugify(), main()]
- "scripts_seed_camisetas_viscosas_generarcatalogo": "generarCatalogo()" | kind=code-symbol | source=scripts/seed_camisetas_viscosas.js:L62 | neighbors=[seed_camisetas_viscosas.sql, slugify(), main()]
- "services_auditservice_obtenermensajesync": "obtenerMensajeSync()" | kind=code-symbol | source=services/auditService.js:L11 | neighbors=[auditService.js, esErrorRls(), syncService.js]
- "services_cierrecajaservice_calcularefectivoventana": "calcularEfectivoVentana()" | kind=code-symbol | source=services/cierreCajaService.js:L26 | neighbors=[cierreCajaService.js, calcularVentanaYEsperado(), recalcularCierreCajaTx()]
- "services_cierrecajaservice_recalcularcierrecajatx": "recalcularCierreCajaTx()" | kind=code-symbol | source=services/cierreCajaService.js:L194 | neighbors=[registerCierresCajaIpc.js, cierreCajaService.js, calcularEfectivoVentana()]
- "services_cierrecajaservice_registrarcierrecajatx": "registrarCierreCajaTx()" | kind=code-symbol | source=services/cierreCajaService.js:L93 | neighbors=[registerCierresCajaIpc.js, cierreCajaService.js, calcularVentanaYEsperado()]
- "services_fechaservice_construirfechaisodedia": "construirFechaISODeDia()" | kind=code-symbol | source=services/fechaService.js:L18 | neighbors=[registerGastosIpc.js, registerVentasIpc.js, fechaService.js]
- "services_gastoservice_insertargastotx": "insertarGastoTx()" | kind=code-symbol | source=services/gastoService.js:L21 | neighbors=[registerGastosIpc.js, gastoService.js, notificarInventarioActualizado()]
- "services_pdfhelpers_formatearcop": "formatearCOP()" | kind=code-symbol | source=services/pdfHelpers.js:L3 | neighbors=[registerClientesIpc.js, pdfHelpers.js, construirHtmlCuentaCobro()]
- "services_pdfhelpers_numeroaletras": "numeroALetras()" | kind=code-symbol | source=services/pdfHelpers.js:L49 | neighbors=[pdfHelpers.js, construirHtmlCuentaCobro(), convertirGrupo()]
- "services_pedidoservice_describircambiospedido": "describirCambiosPedido()" | kind=code-symbol | source=services/pedidoService.js:L32 | neighbors=[pedidoService.js, resumenCarrito(), editarPedidoTx()]
- "services_pedidoservice_resumencarrito": "resumenCarrito()" | kind=code-symbol | source=services/pedidoService.js:L22 | neighbors=[pedidoService.js, crearPedidoTx(), describirCambiosPedido()]
- "services_pedidoservice_revertirentregapedidotx": "revertirEntregaPedidoTx()" | kind=code-symbol | source=services/pedidoService.js:L516 | neighbors=[registerPedidosIpc.js, pedidoService.js, notificarInventarioActualizado()]
- "services_printservice_enviarbytescrudosaimpresora": "enviarBytesCrudosAImpresora()" | kind=code-symbol | source=services/printService.js:L111 | neighbors=[printService.js, imprimirTicket(), imprimirTicketPedido()]
- "services_printservice_obtenerimpresorapredeterminadawindows": "obtenerImpresoraPredeterminadaWindows()" | kind=code-symbol | source=services/printService.js:L37 | neighbors=[printService.js, listarImpresorasDisponibles(), seleccionarImpresora()]
- "services_serverconfigservice_getconfigfilepath": "getConfigFilePath()" | kind=code-symbol | source=services/serverConfigService.js:L14 | neighbors=[serverConfigService.js, guardarConfigServidor(), obtenerConfigServidor()]
- "services_ticketescpos_avance_papel": "AVANCE_PAPEL()" | kind=code-symbol | source=services/ticketEscPos.js:L24 | neighbors=[ticketEscPos.js, construirTicketBuffer(), construirTicketPedidoBuffer()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-006.json

Keep each description factual and concise (one sentence). No markdown, no prose
outside the JSON object. It is acceptable to omit a node if context is
insufficient — but include every node you can ground confidently.

Example answer format:
```json
{
  "node_id_1": "Resolves the configured ontology profile from graphify.yaml.",
  "node_id_2": "Colonel James Barclay, an antagonist in The Crooked Man."
}
```
