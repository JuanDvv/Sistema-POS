# Node Description Batch 11 of 24

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

- "reportes_calculartotaledicionventa": "calcularTotalEdicionVenta()" | kind=code-symbol | source=reportes.js:L1429 | neighbors=[reportes.js, renderizarItemsEdicionVenta()]
- "reportes_cargardevoluciones": "cargarDevoluciones()" | kind=code-symbol | source=reportes.js:L1352 | neighbors=[reportes.js, renderizarDevoluciones()]
- "reportes_estatransferenciaverificadalocal": "estaTransferenciaVerificadaLocal()" | kind=code-symbol | source=reportes.js:L1312 | neighbors=[reportes.js, obtenerTransferenciasVerificadasLocal()]
- "reportes_filtrarventaspormetodo": "filtrarVentasPorMetodo()" | kind=code-symbol | source=reportes.js:L42 | neighbors=[reportes.js, cargarReporte()]
- "reportes_imprimirticket": "imprimirTicket()" | kind=code-symbol | source=reportes.js:L122 | neighbors=[reportes.js, construirTicketHTML()]
- "reportes_mostrarpreviewticket": "mostrarPreviewTicket()" | kind=code-symbol | source=reportes.js:L137 | neighbors=[reportes.js, construirTicketHTML()]
- "reportes_obtenertransferenciasverificadaslocal": "obtenerTransferenciasVerificadasLocal()" | kind=code-symbol | source=reportes.js:L1304 | neighbors=[reportes.js, estaTransferenciaVerificadaLocal()]
- "reportes_refrescarreporteporsincronizacion": "refrescarReportePorSincronizacion()" | kind=code-symbol | source=reportes.js:L948 | neighbors=[reportes.js, cargarReporte()]
- "reportes_renderizardevoluciones": "renderizarDevoluciones()" | kind=code-symbol | source=reportes.js:L1372 | neighbors=[reportes.js, cargarDevoluciones()]
- "scripts_seed_apliques_formatearnumerocop": "formatearNumeroCOP()" | kind=code-symbol | source=scripts/seed_apliques.js:L25 | neighbors=[seed_apliques.sql, generarProductos()]
- "scripts_seed_apliques_obtenerrutasbasesdatos": "obtenerRutasBasesDatos()" | kind=code-symbol | source=scripts/seed_apliques.js:L47 | neighbors=[seed_apliques.sql, main()]
- "scripts_seed_apliques_sembrarenbasededatos": "sembrarEnBaseDeDatos()" | kind=code-symbol | source=scripts/seed_apliques.js:L67 | neighbors=[seed_apliques.sql, main()]
- "scripts_seed_camisetas_obtenerrutasbasesdatos": "obtenerRutasBasesDatos()" | kind=code-symbol | source=scripts/seed_camisetas.js:L127 | neighbors=[seed_camisetas.sql, main()]
- "scripts_seed_camisetas_sembrarenbasededatos": "sembrarEnBaseDeDatos()" | kind=code-symbol | source=scripts/seed_camisetas.js:L147 | neighbors=[seed_camisetas.sql, main()]
- "scripts_seed_camisetas_slugify": "slugify()" | kind=code-symbol | source=scripts/seed_camisetas.js:L92 | neighbors=[seed_camisetas.sql, generarCatalogo()]
- "scripts_seed_camisetas_viscosas_obtenerrutasbasesdatos": "obtenerRutasBasesDatos()" | kind=code-symbol | source=scripts/seed_camisetas_viscosas.js:L83 | neighbors=[seed_camisetas_viscosas.sql, main()]
- "scripts_seed_camisetas_viscosas_sembrarenbasededatos": "sembrarEnBaseDeDatos()" | kind=code-symbol | source=scripts/seed_camisetas_viscosas.js:L100 | neighbors=[seed_camisetas_viscosas.sql, main()]
- "scripts_seed_camisetas_viscosas_slugify": "slugify()" | kind=code-symbol | source=scripts/seed_camisetas_viscosas.js:L51 | neighbors=[seed_camisetas_viscosas.sql, generarCatalogo()]
- "services_abonorecoveryservice_listarabonoseliminados": "listarAbonosEliminados()" | kind=code-symbol | source=services/abonoRecoveryService.js:L17 | neighbors=[registerAbonosIpc.js, abonoRecoveryService.js]
- "services_abonorecoveryservice_recuperarabono": "recuperarAbono()" | kind=code-symbol | source=services/abonoRecoveryService.js:L63 | neighbors=[registerAbonosIpc.js, abonoRecoveryService.js]
- "services_auditservice_eserrorrls": "esErrorRls()" | kind=code-symbol | source=services/auditService.js:L6 | neighbors=[auditService.js, obtenerMensajeSync()]
- "services_cierrecajaservice_eliminarcierrecajatx": "eliminarCierreCajaTx()" | kind=code-symbol | source=services/cierreCajaService.js:L161 | neighbors=[registerCierresCajaIpc.js, cierreCajaService.js]
- "services_cierrecajaservice_iniciodehoyiso": "inicioDeHoyISO()" | kind=code-symbol | source=services/cierreCajaService.js:L16 | neighbors=[cierreCajaService.js, calcularVentanaYEsperado()]
- "services_cierrecajaservice_obtenercierrescaja": "obtenerCierresCaja()" | kind=code-symbol | source=services/cierreCajaService.js:L147 | neighbors=[registerCierresCajaIpc.js, cierreCajaService.js]
- "services_gastoservice_notificarinventarioactualizado": "notificarInventarioActualizado()" | kind=code-symbol | source=services/gastoService.js:L13 | neighbors=[gastoService.js, insertarGastoTx()]
- "services_imagenservice_imagenesappdir": "imagenesAppDir" | kind=code-symbol | source=services/imagenService.js:L7 | neighbors=[main.js, imagenService.js]
- "services_imagenservice_processlocalproductimage": "processLocalProductImage()" | kind=code-symbol | source=services/imagenService.js:L12 | neighbors=[registerProductosIpc.js, imagenService.js]
- "services_inventariomovimientoservice_registrarmovimientoreserva": "registrarMovimientoReserva()" | kind=code-symbol | source=services/inventarioMovimientoService.js:L20 | neighbors=[inventarioMovimientoService.js, pedidoService.js]
- "services_pdfhelpers_convertirgrupo": "convertirGrupo()" | kind=code-symbol | source=services/pdfHelpers.js:L25 | neighbors=[pdfHelpers.js, numeroALetras()]
- "services_pdfhelpers_extraerdomiciliodemetodopago": "extraerDomicilioDeMetodoPago()" | kind=code-symbol | source=services/pdfHelpers.js:L67 | neighbors=[registerClientesIpc.js, pdfHelpers.js]
- "services_pdfhelpers_sanitizarnombrearchivo": "sanitizarNombreArchivo()" | kind=code-symbol | source=services/pdfHelpers.js:L11 | neighbors=[registerClientesIpc.js, pdfHelpers.js]
- "services_pedidoservice_eliminarabonopedidotx": "eliminarAbonoPedidoTx()" | kind=code-symbol | source=services/pedidoService.js:L239 | neighbors=[registerPedidosIpc.js, pedidoService.js]
- "services_pedidoservice_obtenersaldopedido": "obtenerSaldoPedido()" | kind=code-symbol | source=services/pedidoService.js:L129 | neighbors=[pedidoService.js, entregarPedidoTx()]
- "services_pedidoservice_registrarabonopedidotx": "registrarAbonoPedidoTx()" | kind=code-symbol | source=services/pedidoService.js:L210 | neighbors=[registerPedidosIpc.js, pedidoService.js]
- "services_pedidoservice_resolverocrearclienteid": "resolverOCrearClienteId()" | kind=code-symbol | source=services/pedidoService.js:L61 | neighbors=[pedidoService.js, crearPedidoTx()]
- "services_printservice_guardarimpresoralocal": "guardarImpresoraLocal()" | kind=code-symbol | source=services/printService.js:L29 | neighbors=[registerImpresionIpc.js, printService.js]
- "services_ticketescpos_formatearfilaproducto": "formatearFilaProducto()" | kind=code-symbol | source=services/ticketEscPos.js:L81 | neighbors=[ticketEscPos.js, envolverTexto()]
- "services_ticketescpos_limpiar": "limpiar()" | kind=code-symbol | source=services/ticketEscPos.js:L35 | neighbors=[ticketEscPos.js, envolverTexto()]
- "services_ventaservice_describircambiosproductos": "describirCambiosProductos()" | kind=code-symbol | source=services/ventaService.js:L29 | neighbors=[ventaService.js, editarVentaCompletaTx()]
- "sidebar_actualizarbadgepedidosatrasados": "actualizarBadgePedidosAtrasados()" | kind=code-symbol | source=sidebar.js:L797 | neighbors=[sidebar.js, ejecutarSincronizacion()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-010.json

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
