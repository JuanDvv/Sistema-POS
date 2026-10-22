# Node Description Batch 5 of 25

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

- "commit:repo:github.com/JuanDvv/Sistema-POS@4c924e99f29bfcddc8203f3558313ffc6e863b50": "4c924e9 feat: implement robust sync engine with LWW conflict resolution, increm…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, ee31f83 feat: improve order list format…, syncService.js, 85893e4 feat: implement IPC handlers fo…]
- "commit:repo:github.com/JuanDvv/Sistema-POS@68efa368f46b75b066c8fd2ecafdbfb41cb294c7": "68efa36 refactor: replace localStorage with sessionStorage for cart persistence…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 6f9f2fb Merge branch 'delipostres-turba…, ventas.js, 84696d5 feat: enable client management …]
- "commit:repo:github.com/JuanDvv/Sistema-POS@9b92df4e55b373cf3834c983fdb609101fa40758": "9b92df4 feat: add event listener to refresh master data tables upon POS synchro…" | kind=Commit | source=git | neighbors=[admin.js, Tienda-Kary, delipostres-turbaco, bda8c3f feat: add branch location badge…, ed98665 feat: add payment method select…]
- "commit:repo:github.com/JuanDvv/Sistema-POS@ed98665e347d3b71901fab6d96ec5a6fab620c95": "ed98665 feat: add payment method selection modal for orders with pending balanc…" | kind=Commit | source=git | neighbors=[aa81749 feat: implement real-time inven…, Tienda-Kary, delipostres-turbaco, 9b92df4 feat: add event listener to ref…, pedidos.js]
- "gestion_cargarreportecreditos": "cargarReporteCreditos()" | kind=code-symbol | source=gestion.js:L918 | neighbors=[gestion.js, calcularRangoFechasFiltro(), poblarSelectClientesCredito(), renderizarTabCreditos(), cargarReportesGestion()]
- "reportes_construirtickethtml": "construirTicketHTML()" | kind=code-symbol | source=reportes.js:L140 | neighbors=[reportes.js, formatCOP(), parseNumberUI(), imprimirTicket(), mostrarPreviewTicket()]
- "reportes_renderizartablaventas": "renderizarTablaVentas()" | kind=code-symbol | source=reportes.js:L302 | neighbors=[reportes.js, cargarReporte(), crearFilaSeparadorCierre(), filtrarVentasPorMetodo(), normalizeStr()]
- "services_cierrecajaservice_calcularventanayesperado": "calcularVentanaYEsperado()" | kind=code-symbol | source=services/cierreCajaService.js:L81 | neighbors=[registerCierresCajaIpc.js, cierreCajaService.js, calcularEfectivoVentana(), inicioDeHoyISO(), registrarCierreCajaTx()]
- "services_pedidoservice_editarpedidotx": "editarPedidoTx()" | kind=code-symbol | source=services/pedidoService.js:L282 | neighbors=[registerPedidosIpc.js, pedidoService.js, ajustarStockReservado(), describirCambiosPedido(), notificarInventarioActualizado()]
- "services_printservice_seleccionarimpresora": "seleccionarImpresora()" | kind=code-symbol | source=services/printService.js:L150 | neighbors=[printService.js, imprimirTicket(), imprimirTicketPedido(), leerImpresoraGuardada(), obtenerImpresoraPredeterminadaWindows()]
- "services_ventaservice_editarventacompletatx": "editarVentaCompletaTx()" | kind=code-symbol | source=services/ventaService.js:L227 | neighbors=[registerVentasIpc.js, ventaService.js, buscarGastoDomicilioDeVenta(), describirCambiosProductos(), notificarInventarioActualizado()]
- "sync_migrate_correccion_stock_public_aplicar_correccion_stock": "public.aplicar_correccion_stock()" | kind=code-symbol | source=sync/migrate_correccion_stock.sql:L29 | neighbors=[migrate_correccion_stock.sql, public.inventario_sucursal, public.movimientos_inventario, v_delta_real, v_stock_actual]
- "sync_schema_postgres17_completo_public_config_sucursal": "public.config_sucursal" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L44 | neighbors=[schema_postgres17_completo.sql, public.inventario_sucursal, public.movimientos_inventario, public.movimientos_reserva_inventario, public.sugeridos_pasteleria]
- "sync_schema_postgres17_completo_public_movimientos_inventario": "public.movimientos_inventario" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L234 | neighbors=[schema_postgres17_completo.sql, public.aplicar_correccion_stock(), public.aplicar_movimiento_inventario(), public.config_sucursal, public.productos]
- "sync_syncservice_syncgastosdescargar": "syncGastosDescargar()" | kind=code-symbol | source=sync/syncService.js:L753 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), normalizarFechaString()]
- "sync_syncservice_syncmovimientosinventariosubir": "syncMovimientosInventarioSubir()" | kind=code-symbol | source=sync/syncService.js:L990 | neighbors=[syncService.js, procesarSincronizacion(), esErrorFuncionInexistente(), esErrorTablaInexistente(), liberarInventarioSiSinPendientes()]
- "sync_syncservice_syncpedidossubir": "syncPedidosSubir()" | kind=code-symbol | source=sync/syncService.js:L1853 | neighbors=[syncService.js, procesarSincronizacion(), esErrorTablaInexistente(), nowISO(), upsertConLWW()]
- "sync_syncservice_syncreservainventariosubir": "syncReservaInventarioSubir()" | kind=code-symbol | source=sync/syncService.js:L1064 | neighbors=[syncService.js, procesarSincronizacion(), esErrorFuncionInexistente(), esErrorTablaInexistente(), liberarInventarioSiSinPendientes()]
- "sync_syncservice_syncsucursales": "syncSucursales()" | kind=code-symbol | source=sync/syncService.js:L1352 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), upsertConLWW()]
- "sync_syncservice_syncsugeridospasteleria": "syncSugeridosPasteleria()" | kind=code-symbol | source=sync/syncService.js:L1739 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), upsertConLWW()]
- "sync_syncservice_syncventasdescargar": "syncVentasDescargar()" | kind=code-symbol | source=sync/syncService.js:L421 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), normalizarFechaString()]
- "turnos_renderizartabla": "renderizarTabla()" | kind=code-symbol | source=turnos.js:L111 | neighbors=[turnos.js, inicializarModuloTurnos(), calcularTurno(), generarBadgeTurno(), obtenerDeltaDias()]
- "utils_cierrescaja": "cierresCaja.js" | kind=code-symbol | source=utils/cierresCaja.js:L1 | neighbors=[2812d87 feat: implementa módulo de cier…, 6f9f2fb Merge branch 'delipostres-turba…, bfa73bf Add pastelería sugeridos, gasto…, cierreCajaService.js, TIPOS_CIERRE_CAJA]
- "ventas_actualizarestadobotondeshacer": "actualizarEstadoBotonDeshacer()" | kind=code-symbol | source=ventas.js:L225 | neighbors=[ventas.js, agregarAlCarrito(), cambiarCantidad(), deshacerUltimoAgregado(), limpiarEstadoVenta()]
- "ventas_actualizarestadodescuentoui": "actualizarEstadoDescuentoUI()" | kind=code-symbol | source=ventas.js:L338 | neighbors=[ventas.js, cambiarCantidad(), deshacerUltimoAgregado(), limpiarEstadoVenta(), renderizarCarrito()]
- "ventas_anteriores_actualizarestadodescuentoui": "actualizarEstadoDescuentoUI()" | kind=code-symbol | source=ventas-anteriores.js:L167 | neighbors=[ventas-anteriores.js, cambiarCantidad(), iniciarEdicionVenta(), limpiarCarrito(), renderizarCarrito()]
- "ventas_anteriores_calculartotalventa": "calcularTotalVenta()" | kind=code-symbol | source=ventas-anteriores.js:L143 | neighbors=[ventas-anteriores.js, obtenerPorcentajeDescuento(), parseNumberUI(), guardarVenta(), renderizarCarrito()]
- "ventas_anteriores_cambiarmodo": "cambiarModo()" | kind=code-symbol | source=ventas-anteriores.js:L499 | neighbors=[ventas-anteriores.js, cancelarEdicion(), cargarListaVentasDia(), limpiarCarrito(), mostrarPanelCatalogo()]
- "ventas_anteriores_filtraryrenderizarcatalogo": "filtrarYRenderizarCatalogo()" | kind=code-symbol | source=ventas-anteriores.js:L740 | neighbors=[ventas-anteriores.js, cargarCatalogo(), normalizeStr(), renderizarCatalogo(), iniciarEdicionVenta()]
- "ventas_cambiarcantidad": "cambiarCantidad()" | kind=code-symbol | source=ventas.js:L1205 | neighbors=[ventas.js, actualizarEstadoBotonDeshacer(), actualizarEstadoDescuentoUI(), guardarCarritoTemporal(), renderizarCarrito()]
- "admin_inicializarsugeridospasteleria": "inicializarSugeridosPasteleria()" | kind=code-symbol | source=admin.js:L1377 | neighbors=[admin.js, asegurarCategoriasPasteleriaCargadas(), cargarSugeridosPasteleria(), poblarSelectorSucursal()]
- "arqueo_calculartotales": "calcularTotales()" | kind=code-symbol | source=arqueo.js:L378 | neighbors=[arqueo.js, formatCOP(), cargarVentanaCajaActual(), limpiarValoresCuadre()]
- "arqueo_obtenerfechahoystr": "obtenerFechaHoyStr()" | kind=code-symbol | source=arqueo.js:L34 | neighbors=[arqueo.js, cargarHistorialCierres(), confirmarCierreCaja(), refrescarHistorialTrasEdicion()]
- "commit:repo:github.com/JuanDvv/Sistema-POS@68defea7c15a19e358f55bae929791e7bf6e6a73": "68defea style: optimize layout and responsive spacing for denomination grid in …" | kind=Commit | source=git | neighbors=[2812d87 feat: implementa módulo de cier…, Tienda-Kary, delipostres-turbaco, 4986e5d refactor: migrate temporary car…]
- "commit:repo:github.com/JuanDvv/Sistema-POS@db673ca6ef8417b457c353a03fa434814f886987": "db673ca Initial commit" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, main, 29d31c1 feat: implement complete POS sy…]
- "dashboard_filtraryrenderizar": "filtrarYRenderizar()" | kind=code-symbol | source=dashboard.js:L144 | neighbors=[dashboard.js, cargarProductos(), normalizeStr(), renderizarProductos()]
- "gastos_actualizarvalorfila": "actualizarValorFila()" | kind=code-symbol | source=gastos.js:L90 | neighbors=[gastos.js, encontrarProductoPorNombre(), formatNumberUI(), parseNumberUI()]
- "gestion_cargarreportesgestion": "cargarReportesGestion()" | kind=code-symbol | source=gestion.js:L549 | neighbors=[gestion.js, calcularRangoFechasFiltro(), cargarReporteCreditos(), formatCOP()]
- "gestion_renderizartabcreditos": "renderizarTabCreditos()" | kind=code-symbol | source=gestion.js:L1050 | neighbors=[gestion.js, cargarReporteCreditos(), calcularEstadoCreditos(), formatCOP()]
- "pedidos_agregarabono": "agregarAbono()" | kind=code-symbol | source=pedidos.js:L721 | neighbors=[pedidos.js, abrirDetallePedido(), cargarPedidos(), parseNumberUI()]

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
