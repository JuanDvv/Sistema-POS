# Node Description Batch 8 of 25

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
Write every description in English (en). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "pedidos_cancelarpedidoactual": "cancelarPedidoActual()" | kind=code-symbol | source=pedidos.js:L760 | neighbors=[pedidos.js, cargarCatalogo(), cargarPedidos()]
- "pedidos_combinarfechahoraentrega": "combinarFechaHoraEntrega()" | kind=code-symbol | source=pedidos.js:L79 | neighbors=[pedidos.js, guardarCambiosPedido(), registrarPedido()]
- "pedidos_limpiarformularionuevopedido": "limpiarFormularioNuevoPedido()" | kind=code-symbol | source=pedidos.js:L385 | neighbors=[pedidos.js, renderizarCarritoPedido(), registrarPedido()]
- "pedidos_revertirentregapedidoactual": "revertirEntregaPedidoActual()" | kind=code-symbol | source=pedidos.js:L773 | neighbors=[pedidos.js, cargarCatalogo(), cargarPedidos()]
- "pedidos_separarfechahoraentrega": "separarFechaHoraEntrega()" | kind=code-symbol | source=pedidos.js:L119 | neighbors=[pedidos.js, abrirDetallePedido(), entregaTieneHoraEspecifica()]
- "reportes_calculartotaledicionventa": "calcularTotalEdicionVenta()" | kind=code-symbol | source=reportes.js:L1837 | neighbors=[reportes.js, parseNumberUI(), renderizarItemsEdicionVenta()]
- "reportes_coincideabonofiltro": "coincideAbonoFiltro()" | kind=code-symbol | source=reportes.js:L81 | neighbors=[reportes.js, coincideTotalBusqueda(), normalizeStr()]
- "reportes_crearfilaseparadorcierre": "crearFilaSeparadorCierre()" | kind=code-symbol | source=reportes.js:L94 | neighbors=[reportes.js, formatCOP(), renderizarTablaVentas()]
- "reportes_filtrarventaspormetodo": "filtrarVentasPorMetodo()" | kind=code-symbol | source=reportes.js:L119 | neighbors=[reportes.js, cargarReporte(), renderizarTablaVentas()]
- "reportes_renderizaritemsedicionventa": "renderizarItemsEdicionVenta()" | kind=code-symbol | source=reportes.js:L1845 | neighbors=[reportes.js, calcularTotalEdicionVenta(), formatCOP()]
- "reportes_renderizarproductosnovendidos": "renderizarProductosNoVendidos()" | kind=code-symbol | source=reportes.js:L575 | neighbors=[reportes.js, cargarReporte(), normalizeStr()]
- "reportes_renderizarreportebibi": "renderizarReporteBiBi()" | kind=code-symbol | source=reportes.js:L521 | neighbors=[reportes.js, cargarReporte(), normalizeStr()]
- "services_abonorecoveryservice_listarabonoseliminados": "listarAbonosEliminados()" | kind=code-symbol | source=services/abonoRecoveryService.js:L37 | neighbors=[registerAbonosIpc.js, abonoRecoveryService.js, purgarAbonosEliminadosAntiguos()]
- "services_auditservice_obtenermensajesync": "obtenerMensajeSync()" | kind=code-symbol | source=services/auditService.js:L11 | neighbors=[auditService.js, esErrorRls(), syncService.js]
- "services_cierrecajaservice_calcularefectivoventana": "calcularEfectivoVentana()" | kind=code-symbol | source=services/cierreCajaService.js:L34 | neighbors=[cierreCajaService.js, calcularVentanaYEsperado(), recalcularCierreCajaTx()]
- "services_cierrecajaservice_recalcularcierrecajatx": "recalcularCierreCajaTx()" | kind=code-symbol | source=services/cierreCajaService.js:L199 | neighbors=[registerCierresCajaIpc.js, cierreCajaService.js, calcularEfectivoVentana()]
- "services_cierrecajaservice_registrarcierrecajatx": "registrarCierreCajaTx()" | kind=code-symbol | source=services/cierreCajaService.js:L96 | neighbors=[registerCierresCajaIpc.js, cierreCajaService.js, calcularVentanaYEsperado()]
- "services_fechaservice_construirfechaisodedia": "construirFechaISODeDia()" | kind=code-symbol | source=services/fechaService.js:L18 | neighbors=[registerGastosIpc.js, registerVentasIpc.js, fechaService.js]
- "services_gastoservice_insertargastotx": "insertarGastoTx()" | kind=code-symbol | source=services/gastoService.js:L21 | neighbors=[registerGastosIpc.js, gastoService.js, notificarInventarioActualizado()]
- "services_pdfhelpers_formatearcop": "formatearCOP()" | kind=code-symbol | source=services/pdfHelpers.js:L3 | neighbors=[registerClientesIpc.js, pdfHelpers.js, construirHtmlCuentaCobro()]
- "services_pdfhelpers_numeroaletras": "numeroALetras()" | kind=code-symbol | source=services/pdfHelpers.js:L49 | neighbors=[pdfHelpers.js, construirHtmlCuentaCobro(), convertirGrupo()]
- "services_pedidoservice_describircambiospedido": "describirCambiosPedido()" | kind=code-symbol | source=services/pedidoService.js:L40 | neighbors=[pedidoService.js, resumenCarrito(), editarPedidoTx()]
- "services_pedidoservice_resumencarrito": "resumenCarrito()" | kind=code-symbol | source=services/pedidoService.js:L30 | neighbors=[pedidoService.js, crearPedidoTx(), describirCambiosPedido()]
- "services_pedidoservice_revertirentregapedidotx": "revertirEntregaPedidoTx()" | kind=code-symbol | source=services/pedidoService.js:L524 | neighbors=[registerPedidosIpc.js, pedidoService.js, notificarInventarioActualizado()]
- "services_pedidosugeridopasteleriaservice_calcularproximaentrega": "calcularProximaEntrega()" | kind=code-symbol | source=services/pedidoSugeridoPasteleriaService.js:L39 | neighbors=[pedidoSugeridoPasteleriaService.js, fechaLocalYMD(), calcularRecomendacionExtra()]
- "services_pedidosugeridopasteleriaservice_calcularrecomendacionespasteleriasucursal": "calcularRecomendacionesPasteleriaSucursal()" | kind=code-symbol | source=services/pedidoSugeridoPasteleriaService.js:L111 | neighbors=[registerPedidoSugeridoIpc.js, pedidoSugeridoPasteleriaService.js, calcularRecomendacionExtra()]
- "services_pedidosugeridopasteleriaservice_fechalocalymd": "fechaLocalYMD()" | kind=code-symbol | source=services/pedidoSugeridoPasteleriaService.js:L29 | neighbors=[pedidoSugeridoPasteleriaService.js, calcularProximaEntrega(), calcularRecomendacionExtra()]
- "services_printservice_enviarbytescrudosaimpresora": "enviarBytesCrudosAImpresora()" | kind=code-symbol | source=services/printService.js:L111 | neighbors=[printService.js, imprimirTicket(), imprimirTicketPedido()]
- "services_printservice_obtenerimpresorapredeterminadawindows": "obtenerImpresoraPredeterminadaWindows()" | kind=code-symbol | source=services/printService.js:L37 | neighbors=[printService.js, listarImpresorasDisponibles(), seleccionarImpresora()]
- "services_serverconfigservice_getconfigfilepath": "getConfigFilePath()" | kind=code-symbol | source=services/serverConfigService.js:L14 | neighbors=[serverConfigService.js, guardarConfigServidor(), obtenerConfigServidor()]
- "services_ticketescpos_avance_papel": "AVANCE_PAPEL()" | kind=code-symbol | source=services/ticketEscPos.js:L24 | neighbors=[ticketEscPos.js, construirTicketBuffer(), construirTicketPedidoBuffer()]
- "services_ticketescpos_construirticketbuffer": "construirTicketBuffer()" | kind=code-symbol | source=services/ticketEscPos.js:L93 | neighbors=[printService.js, ticketEscPos.js, AVANCE_PAPEL()]
- "services_ticketescpos_construirticketpedidobuffer": "construirTicketPedidoBuffer()" | kind=code-symbol | source=services/ticketEscPos.js:L191 | neighbors=[printService.js, ticketEscPos.js, AVANCE_PAPEL()]
- "services_ticketescpos_envolvertexto": "envolverTexto()" | kind=code-symbol | source=services/ticketEscPos.js:L52 | neighbors=[ticketEscPos.js, limpiar(), formatearFilaProducto()]
- "services_ventaservice_buscargastodomiciliodeventa": "buscarGastoDomicilioDeVenta()" | kind=code-symbol | source=services/ventaService.js:L50 | neighbors=[ventaService.js, editarVentaCompletaTx(), eliminarVentaTx()]
- "services_ventaservice_notificarinventarioactualizado": "notificarInventarioActualizado()" | kind=code-symbol | source=services/ventaService.js:L12 | neighbors=[ventaService.js, editarVentaCompletaTx(), insertarVentaTx()]
- "services_ventaservice_resumencarrito": "resumenCarrito()" | kind=code-symbol | source=services/ventaService.js:L20 | neighbors=[ventaService.js, eliminarVentaTx(), insertarVentaTx()]
- "sidebar_actualizarbotonsync": "actualizarBotonSync()" | kind=code-symbol | source=sidebar.js:L736 | neighbors=[sidebar.js, aplicarEstadoConexion(), aplicarEstadoSincronizando()]
- "sidebar_actualizarproximasincronizacion": "actualizarProximaSincronizacion()" | kind=code-symbol | source=sidebar.js:L561 | neighbors=[sidebar.js, renderContadorProximaSincronizacion(), ejecutarSincronizacion()]
- "sync_conciliar_saldo_apertura_calculardiferencias": "calcularDiferencias()" | kind=code-symbol | source=sync/conciliar_saldo_apertura.js:L72 | neighbors=[conciliar_saldo_apertura.js, leerTodo(), main()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-007.json

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
