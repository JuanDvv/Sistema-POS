# Node Description Batch 5 of 24

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

- "sync_syncservice_syncpedidosdescargar": "syncPedidosDescargar()" | kind=code-symbol | source=sync/syncService.js:L1688 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), esErrorTablaInexistente()]
- "sync_syncservice_syncpedidossubir": "syncPedidosSubir()" | kind=code-symbol | source=sync/syncService.js:L1611 | neighbors=[syncService.js, procesarSincronizacion(), esErrorTablaInexistente(), nowISO(), upsertConLWW()]
- "sync_syncservice_syncreservainventariodescargar": "syncReservaInventarioDescargar()" | kind=code-symbol | source=sync/syncService.js:L1243 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), esErrorTablaInexistente()]
- "sync_syncservice_syncreservainventariosubir": "syncReservaInventarioSubir()" | kind=code-symbol | source=sync/syncService.js:L1043 | neighbors=[syncService.js, procesarSincronizacion(), esErrorFuncionInexistente(), esErrorTablaInexistente(), liberarInventarioSiSinPendientes()]
- "sync_syncservice_syncsolicitudesgasto": "syncSolicitudesGasto()" | kind=code-symbol | source=sync/syncService.js:L1963 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), upsertConLWW()]
- "sync_syncservice_syncsolicitudesventa": "syncSolicitudesVenta()" | kind=code-symbol | source=sync/syncService.js:L1895 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), upsertConLWW()]
- "sync_syncservice_syncsucursales": "syncSucursales()" | kind=code-symbol | source=sync/syncService.js:L1332 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), upsertConLWW()]
- "utils_cierrescaja": "cierresCaja.js" | kind=code-symbol | source=utils/cierresCaja.js:L1 | neighbors=[2812d87 feat: implementa módulo de cier…, 6f9f2fb Merge branch 'delipostres-turba…, bfa73bf Add pastelería sugeridos, gasto…, cierreCajaService.js, TIPOS_CIERRE_CAJA]
- "ventas_actualizarestadobotondeshacer": "actualizarEstadoBotonDeshacer()" | kind=code-symbol | source=ventas.js:L257 | neighbors=[ventas.js, agregarAlCarrito(), cambiarCantidad(), deshacerUltimoAgregado(), limpiarEstadoVenta()]
- "ventas_actualizarestadodescuentoui": "actualizarEstadoDescuentoUI()" | kind=code-symbol | source=ventas.js:L358 | neighbors=[ventas.js, cambiarCantidad(), deshacerUltimoAgregado(), limpiarEstadoVenta(), renderizarCarrito()]
- "ventas_anteriores_actualizarestadodescuentoui": "actualizarEstadoDescuentoUI()" | kind=code-symbol | source=ventas-anteriores.js:L143 | neighbors=[ventas-anteriores.js, cambiarCantidad(), iniciarEdicionVenta(), limpiarCarrito(), renderizarCarrito()]
- "ventas_anteriores_cambiarmodo": "cambiarModo()" | kind=code-symbol | source=ventas-anteriores.js:L442 | neighbors=[ventas-anteriores.js, cancelarEdicion(), cargarListaVentasDia(), limpiarCarrito(), mostrarPanelCatalogo()]
- "ventas_anteriores_filtraryrenderizarcatalogo": "filtrarYRenderizarCatalogo()" | kind=code-symbol | source=ventas-anteriores.js:L677 | neighbors=[ventas-anteriores.js, cargarCatalogo(), normalizeStr(), renderizarCatalogo(), iniciarEdicionVenta()]
- "ventas_cambiarcantidad": "cambiarCantidad()" | kind=code-symbol | source=ventas.js:L1101 | neighbors=[ventas.js, actualizarEstadoBotonDeshacer(), actualizarEstadoDescuentoUI(), guardarCarritoTemporal(), renderizarCarrito()]
- "arqueo_calculartotales": "calcularTotales()" | kind=code-symbol | source=arqueo.js:L352 | neighbors=[arqueo.js, formatCOP(), cargarVentanaCajaActual(), limpiarValoresCuadre()]
- "arqueo_obtenerfechahoystr": "obtenerFechaHoyStr()" | kind=code-symbol | source=arqueo.js:L10 | neighbors=[arqueo.js, cargarHistorialCierres(), confirmarCierreCaja(), refrescarHistorialTrasEdicion()]
- "commit:repo:github.com/JuanDvv/Sistema-POS@68defea7c15a19e358f55bae929791e7bf6e6a73": "68defea style: optimize layout and responsive spacing for denomination grid in …" | kind=Commit | source=git | neighbors=[2812d87 feat: implementa módulo de cier…, Tienda-Kary, delipostres-turbaco, 4986e5d refactor: migrate temporary car…]
- "commit:repo:github.com/JuanDvv/Sistema-POS@db673ca6ef8417b457c353a03fa434814f886987": "db673ca Initial commit" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, main, 29d31c1 feat: implement complete POS sy…]
- "dashboard_filtraryrenderizar": "filtrarYRenderizar()" | kind=code-symbol | source=dashboard.js:L159 | neighbors=[dashboard.js, cargarProductos(), normalizeStr(), renderizarProductos()]
- "gastos_actualizarvalorfila": "actualizarValorFila()" | kind=code-symbol | source=gastos.js:L72 | neighbors=[gastos.js, encontrarProductoPorNombre(), formatNumberUI(), parseNumberUI()]
- "gestion_cargarreportesgestion": "cargarReportesGestion()" | kind=code-symbol | source=gestion.js:L539 | neighbors=[gestion.js, calcularRangoFechasFiltro(), cargarReporteCreditos(), formatCOP()]
- "pedidos_agregarabono": "agregarAbono()" | kind=code-symbol | source=pedidos.js:L680 | neighbors=[pedidos.js, abrirDetallePedido(), cargarPedidos(), parseNumberUI()]
- "pedidos_entregarpedidoactual": "entregarPedidoActual()" | kind=code-symbol | source=pedidos.js:L697 | neighbors=[pedidos.js, cargarCatalogo(), cargarPedidos(), formatCOP()]
- "pedidos_entregatienehoraespecifica": "entregaTieneHoraEspecifica()" | kind=code-symbol | source=pedidos.js:L100 | neighbors=[pedidos.js, formatFechaEntregaCelda(), formatFechaEntregaLegible(), separarFechaHoraEntrega()]
- "pedidos_filtraryrenderizarcatalogopedido": "filtrarYRenderizarCatalogoPedido()" | kind=code-symbol | source=pedidos.js:L266 | neighbors=[pedidos.js, cargarCatalogo(), normalizeStr(), renderizarGridPedido()]
- "pedidos_renderizarcarritoen": "renderizarCarritoEn()" | kind=code-symbol | source=pedidos.js:L146 | neighbors=[pedidos.js, renderizarCarritoDetalle(), formatCOP(), renderizarCarritoPedido()]
- "productobuscador": "productoBuscador.js" | kind=code-symbol | source=productoBuscador.js:L1 | neighbors=[aeae7ec Smart product search and seed s…, bfa73bf Add pastelería sugeridos, gasto…, c4fc4fe Use sessionStorage; add multi-w…, crearBuscadorProducto()]
- "renderer": "renderer.js" | kind=code-symbol | source=renderer.js:L1 | neighbors=[155d086 Use sessionStorage and add mult…, 29d31c1 feat: implement complete POS sy…, 4cf89eb feat: implement centralized ven…, c4fc4fe Use sessionStorage; add multi-w…]
- "reportes_construirtickethtml": "construirTicketHTML()" | kind=code-symbol | source=reportes.js:L63 | neighbors=[reportes.js, formatCOP(), imprimirTicket(), mostrarPreviewTicket()]
- "scripts_seed_apliques_main": "main()" | kind=code-symbol | source=scripts/seed_apliques.js:L139 | neighbors=[seed_apliques.sql, generarProductos(), obtenerRutasBasesDatos(), sembrarEnBaseDeDatos()]
- "scripts_seed_camisetas_main": "main()" | kind=code-symbol | source=scripts/seed_camisetas.js:L221 | neighbors=[seed_camisetas.sql, generarCatalogo(), obtenerRutasBasesDatos(), sembrarEnBaseDeDatos()]
- "scripts_seed_camisetas_viscosas_main": "main()" | kind=code-symbol | source=scripts/seed_camisetas_viscosas.js:L174 | neighbors=[seed_camisetas_viscosas.sql, generarCatalogo(), obtenerRutasBasesDatos(), sembrarEnBaseDeDatos()]
- "services_fechaservice_esfechaanteriorvalida": "esFechaAnteriorValida()" | kind=code-symbol | source=services/fechaService.js:L11 | neighbors=[registerGastosIpc.js, registerVentasIpc.js, fechaService.js, obtenerFechaHoyYYYYMMDD()]
- "services_pdfhelpers_construirhtmlcuentacobro": "construirHtmlCuentaCobro()" | kind=code-symbol | source=services/pdfHelpers.js:L108 | neighbors=[registerClientesIpc.js, pdfHelpers.js, formatearCOP(), numeroALetras()]
- "services_pedidoservice_ajustarstockreservado": "ajustarStockReservado()" | kind=code-symbol | source=services/pedidoService.js:L109 | neighbors=[pedidoService.js, cancelarPedidoTx(), crearPedidoTx(), editarPedidoTx()]
- "services_pedidoservice_cancelarpedidotx": "cancelarPedidoTx()" | kind=code-symbol | source=services/pedidoService.js:L344 | neighbors=[registerPedidosIpc.js, pedidoService.js, ajustarStockReservado(), notificarInventarioActualizado()]
- "services_pedidoservice_entregarpedidotx": "entregarPedidoTx()" | kind=code-symbol | source=services/pedidoService.js:L403 | neighbors=[registerPedidosIpc.js, pedidoService.js, notificarInventarioActualizado(), obtenerSaldoPedido()]
- "services_printservice_imprimirticket": "imprimirTicket()" | kind=code-symbol | source=services/printService.js:L206 | neighbors=[registerImpresionIpc.js, printService.js, enviarBytesCrudosAImpresora(), seleccionarImpresora()]
- "services_printservice_imprimirticketpedido": "imprimirTicketPedido()" | kind=code-symbol | source=services/printService.js:L214 | neighbors=[registerImpresionIpc.js, printService.js, enviarBytesCrudosAImpresora(), seleccionarImpresora()]
- "services_printservice_leerimpresoraguardada": "leerImpresoraGuardada()" | kind=code-symbol | source=services/printService.js:L18 | neighbors=[registerImpresionIpc.js, printService.js, listarImpresorasDisponibles(), seleccionarImpresora()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-004.json

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
