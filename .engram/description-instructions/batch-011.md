# Node Description Batch 12 of 25

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

- "pedidos_cambiarcantidadpedido": "cambiarCantidadPedido()" | kind=code-symbol | source=pedidos.js:L219 | neighbors=[pedidos.js, renderizarCarritoPedido()]
- "pedidos_cambiartab": "cambiarTab()" | kind=code-symbol | source=pedidos.js:L841 | neighbors=[pedidos.js, registrarPedido()]
- "pedidos_cargarclientes": "cargarClientes()" | kind=code-symbol | source=pedidos.js:L353 | neighbors=[pedidos.js, registrarPedido()]
- "pedidos_formatfechaentregacelda": "formatFechaEntregaCelda()" | kind=code-symbol | source=pedidos.js:L108 | neighbors=[pedidos.js, entregaTieneHoraEspecifica()]
- "pedidos_formatfechaentregalegible": "formatFechaEntregaLegible()" | kind=code-symbol | source=pedidos.js:L90 | neighbors=[pedidos.js, entregaTieneHoraEspecifica()]
- "pedidos_formatfechalegible": "formatFechaLegible()" | kind=code-symbol | source=pedidos.js:L62 | neighbors=[pedidos.js, abrirDetallePedido()]
- "pedidos_formatnumberui": "formatNumberUI()" | kind=code-symbol | source=pedidos.js:L47 | neighbors=[pedidos.js, abrirDetallePedido()]
- "pedidos_formattelefono": "formatTelefono()" | kind=code-symbol | source=pedidos.js:L69 | neighbors=[pedidos.js, abrirDetallePedido()]
- "pedidos_normalizestr": "normalizeStr()" | kind=code-symbol | source=pedidos.js:L57 | neighbors=[pedidos.js, filtrarYRenderizarCatalogoPedido()]
- "pedidos_renderizarabonos": "renderizarAbonos()" | kind=code-symbol | source=pedidos.js:L576 | neighbors=[pedidos.js, abrirDetallePedido()]
- "pedidos_renderizargridpedido": "renderizarGridPedido()" | kind=code-symbol | source=pedidos.js:L320 | neighbors=[pedidos.js, filtrarYRenderizarCatalogoPedido()]
- "pedidos_renderizartablapedidos": "renderizarTablaPedidos()" | kind=code-symbol | source=pedidos.js:L521 | neighbors=[pedidos.js, cargarPedidos()]
- "reportes_cargardevoluciones": "cargarDevoluciones()" | kind=code-symbol | source=reportes.js:L1760 | neighbors=[reportes.js, renderizarDevoluciones()]
- "reportes_estatransferenciaverificadalocal": "estaTransferenciaVerificadaLocal()" | kind=code-symbol | source=reportes.js:L1720 | neighbors=[reportes.js, obtenerTransferenciasVerificadasLocal()]
- "reportes_imprimirticket": "imprimirTicket()" | kind=code-symbol | source=reportes.js:L214 | neighbors=[reportes.js, construirTicketHTML()]
- "reportes_mostrarpreviewticket": "mostrarPreviewTicket()" | kind=code-symbol | source=reportes.js:L229 | neighbors=[reportes.js, construirTicketHTML()]
- "reportes_obtenertransferenciasverificadaslocal": "obtenerTransferenciasVerificadasLocal()" | kind=code-symbol | source=reportes.js:L1712 | neighbors=[reportes.js, estaTransferenciaVerificadaLocal()]
- "reportes_refrescarreporteporsincronizacion": "refrescarReportePorSincronizacion()" | kind=code-symbol | source=reportes.js:L1238 | neighbors=[reportes.js, cargarReporte()]
- "reportes_renderizardevoluciones": "renderizarDevoluciones()" | kind=code-symbol | source=reportes.js:L1780 | neighbors=[reportes.js, cargarDevoluciones()]
- "services_abonorecoveryservice_purgarabonoseliminadosantiguos": "purgarAbonosEliminadosAntiguos()" | kind=code-symbol | source=services/abonoRecoveryService.js:L18 | neighbors=[abonoRecoveryService.js, listarAbonosEliminados()]
- "services_abonorecoveryservice_recuperarabono": "recuperarAbono()" | kind=code-symbol | source=services/abonoRecoveryService.js:L88 | neighbors=[registerAbonosIpc.js, abonoRecoveryService.js]
- "services_auditservice_eserrorrls": "esErrorRls()" | kind=code-symbol | source=services/auditService.js:L6 | neighbors=[auditService.js, obtenerMensajeSync()]
- "services_cierrecajaservice_eliminarcierrecajatx": "eliminarCierreCajaTx()" | kind=code-symbol | source=services/cierreCajaService.js:L166 | neighbors=[registerCierresCajaIpc.js, cierreCajaService.js]
- "services_cierrecajaservice_iniciodehoyiso": "inicioDeHoyISO()" | kind=code-symbol | source=services/cierreCajaService.js:L24 | neighbors=[cierreCajaService.js, calcularVentanaYEsperado()]
- "services_cierrecajaservice_obtenercierrescaja": "obtenerCierresCaja()" | kind=code-symbol | source=services/cierreCajaService.js:L151 | neighbors=[registerCierresCajaIpc.js, cierreCajaService.js]
- "services_gastoservice_notificarinventarioactualizado": "notificarInventarioActualizado()" | kind=code-symbol | source=services/gastoService.js:L13 | neighbors=[gastoService.js, insertarGastoTx()]
- "services_imagenservice_imagenesappdir": "imagenesAppDir" | kind=code-symbol | source=services/imagenService.js:L7 | neighbors=[main.js, imagenService.js]
- "services_imagenservice_processlocalproductimage": "processLocalProductImage()" | kind=code-symbol | source=services/imagenService.js:L12 | neighbors=[registerProductosIpc.js, imagenService.js]
- "services_inventariomovimientoservice_registrarmovimientoreserva": "registrarMovimientoReserva()" | kind=code-symbol | source=services/inventarioMovimientoService.js:L20 | neighbors=[inventarioMovimientoService.js, pedidoService.js]
- "services_pdfhelpers_convertirgrupo": "convertirGrupo()" | kind=code-symbol | source=services/pdfHelpers.js:L25 | neighbors=[pdfHelpers.js, numeroALetras()]
- "services_pdfhelpers_extraerdomiciliodemetodopago": "extraerDomicilioDeMetodoPago()" | kind=code-symbol | source=services/pdfHelpers.js:L67 | neighbors=[registerClientesIpc.js, pdfHelpers.js]
- "services_pdfhelpers_sanitizarnombrearchivo": "sanitizarNombreArchivo()" | kind=code-symbol | source=services/pdfHelpers.js:L11 | neighbors=[registerClientesIpc.js, pdfHelpers.js]
- "services_pedidoservice_eliminarabonopedidotx": "eliminarAbonoPedidoTx()" | kind=code-symbol | source=services/pedidoService.js:L247 | neighbors=[registerPedidosIpc.js, pedidoService.js]
- "services_pedidoservice_obtenersaldopedido": "obtenerSaldoPedido()" | kind=code-symbol | source=services/pedidoService.js:L137 | neighbors=[pedidoService.js, entregarPedidoTx()]
- "services_pedidoservice_registrarabonopedidotx": "registrarAbonoPedidoTx()" | kind=code-symbol | source=services/pedidoService.js:L218 | neighbors=[registerPedidosIpc.js, pedidoService.js]
- "services_pedidoservice_resolverocrearclienteid": "resolverOCrearClienteId()" | kind=code-symbol | source=services/pedidoService.js:L69 | neighbors=[pedidoService.js, crearPedidoTx()]
- "services_pedidosugeridopasteleriaservice_obtenerproductospasteleriaconsugeridos": "obtenerProductosPasteleriaConSugeridos()" | kind=code-symbol | source=services/pedidoSugeridoPasteleriaService.js:L140 | neighbors=[registerPedidoSugeridoIpc.js, pedidoSugeridoPasteleriaService.js]
- "services_pedidosugeridopasteleriaservice_upsertsugeridopasteleriatx": "upsertSugeridoPasteleriaTx()" | kind=code-symbol | source=services/pedidoSugeridoPasteleriaService.js:L182 | neighbors=[registerPedidoSugeridoIpc.js, pedidoSugeridoPasteleriaService.js]
- "services_printservice_guardarimpresoralocal": "guardarImpresoraLocal()" | kind=code-symbol | source=services/printService.js:L29 | neighbors=[registerImpresionIpc.js, printService.js]
- "services_ticketescpos_formatearfilaproducto": "formatearFilaProducto()" | kind=code-symbol | source=services/ticketEscPos.js:L81 | neighbors=[ticketEscPos.js, envolverTexto()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-011.json

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
