# Node Description Batch 6 of 25

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

- "pedidos_entregarpedidoactual": "entregarPedidoActual()" | kind=code-symbol | source=pedidos.js:L738 | neighbors=[pedidos.js, cargarCatalogo(), cargarPedidos(), formatCOP()]
- "pedidos_entregatienehoraespecifica": "entregaTieneHoraEspecifica()" | kind=code-symbol | source=pedidos.js:L85 | neighbors=[pedidos.js, formatFechaEntregaCelda(), formatFechaEntregaLegible(), separarFechaHoraEntrega()]
- "pedidos_filtraryrenderizarcatalogopedido": "filtrarYRenderizarCatalogoPedido()" | kind=code-symbol | source=pedidos.js:L295 | neighbors=[pedidos.js, cargarCatalogo(), normalizeStr(), renderizarGridPedido()]
- "pedidos_parsenumberui": "parseNumberUI()" | kind=code-symbol | source=pedidos.js:L52 | neighbors=[pedidos.js, agregarAbono(), leerValorDomicilio(), registrarPedido()]
- "pedidos_renderizarcarritoen": "renderizarCarritoEn()" | kind=code-symbol | source=pedidos.js:L131 | neighbors=[pedidos.js, renderizarCarritoDetalle(), formatCOP(), renderizarCarritoPedido()]
- "productobuscador": "productoBuscador.js" | kind=code-symbol | source=productoBuscador.js:L1 | neighbors=[aeae7ec Smart product search and seed s…, bfa73bf Add pastelería sugeridos, gasto…, c4fc4fe Use sessionStorage; add multi-w…, crearBuscadorProducto()]
- "renderer": "renderer.js" | kind=code-symbol | source=renderer.js:L1 | neighbors=[155d086 Use sessionStorage and add mult…, 29d31c1 feat: implement complete POS sy…, 4cf89eb feat: implement centralized ven…, c4fc4fe Use sessionStorage; add multi-w…]
- "reportes_coincidetotalbusqueda": "coincideTotalBusqueda()" | kind=code-symbol | source=reportes.js:L34 | neighbors=[reportes.js, coincideAbonoFiltro(), formatCOP(), coincideVentaFiltro()]
- "reportes_coincideventafiltro": "coincideVentaFiltro()" | kind=code-symbol | source=reportes.js:L49 | neighbors=[reportes.js, coincideTotalBusqueda(), normalizeStr(), parseNumberUI()]
- "reportes_parsenumberui": "parseNumberUI()" | kind=code-symbol | source=reportes.js:L135 | neighbors=[reportes.js, calcularTotalEdicionVenta(), coincideVentaFiltro(), construirTicketHTML()]
- "services_fechaservice_esfechaanteriorvalida": "esFechaAnteriorValida()" | kind=code-symbol | source=services/fechaService.js:L11 | neighbors=[registerGastosIpc.js, registerVentasIpc.js, fechaService.js, obtenerFechaHoyYYYYMMDD()]
- "services_pdfhelpers_construirhtmlcuentacobro": "construirHtmlCuentaCobro()" | kind=code-symbol | source=services/pdfHelpers.js:L108 | neighbors=[registerClientesIpc.js, pdfHelpers.js, formatearCOP(), numeroALetras()]
- "services_pedidoservice_ajustarstockreservado": "ajustarStockReservado()" | kind=code-symbol | source=services/pedidoService.js:L117 | neighbors=[pedidoService.js, cancelarPedidoTx(), crearPedidoTx(), editarPedidoTx()]
- "services_pedidoservice_cancelarpedidotx": "cancelarPedidoTx()" | kind=code-symbol | source=services/pedidoService.js:L352 | neighbors=[registerPedidosIpc.js, pedidoService.js, ajustarStockReservado(), notificarInventarioActualizado()]
- "services_pedidoservice_entregarpedidotx": "entregarPedidoTx()" | kind=code-symbol | source=services/pedidoService.js:L411 | neighbors=[registerPedidosIpc.js, pedidoService.js, notificarInventarioActualizado(), obtenerSaldoPedido()]
- "services_pedidosugeridopasteleriaservice_calcularrecomendacionextra": "calcularRecomendacionExtra()" | kind=code-symbol | source=services/pedidoSugeridoPasteleriaService.js:L61 | neighbors=[pedidoSugeridoPasteleriaService.js, calcularRecomendacionesPasteleriaSucurs…, calcularProximaEntrega(), fechaLocalYMD()]
- "services_printservice_imprimirticket": "imprimirTicket()" | kind=code-symbol | source=services/printService.js:L206 | neighbors=[registerImpresionIpc.js, printService.js, enviarBytesCrudosAImpresora(), seleccionarImpresora()]
- "services_printservice_imprimirticketpedido": "imprimirTicketPedido()" | kind=code-symbol | source=services/printService.js:L214 | neighbors=[registerImpresionIpc.js, printService.js, enviarBytesCrudosAImpresora(), seleccionarImpresora()]
- "services_printservice_leerimpresoraguardada": "leerImpresoraGuardada()" | kind=code-symbol | source=services/printService.js:L18 | neighbors=[registerImpresionIpc.js, printService.js, listarImpresorasDisponibles(), seleccionarImpresora()]
- "services_printservice_listarimpresorasdisponibles": "listarImpresorasDisponibles()" | kind=code-symbol | source=services/printService.js:L186 | neighbors=[registerImpresionIpc.js, printService.js, leerImpresoraGuardada(), obtenerImpresoraPredeterminadaWindows()]
- "services_serverconfigservice_guardarconfigservidor": "guardarConfigServidor()" | kind=code-symbol | source=services/serverConfigService.js:L55 | neighbors=[registerSistemaIpc.js, serverConfigService.js, getConfigFilePath(), obtenerConfigServidor()]
- "services_ventaservice_eliminarventatx": "eliminarVentaTx()" | kind=code-symbol | source=services/ventaService.js:L169 | neighbors=[registerVentasIpc.js, ventaService.js, buscarGastoDomicilioDeVenta(), resumenCarrito()]
- "services_ventaservice_insertarventatx": "insertarVentaTx()" | kind=code-symbol | source=services/ventaService.js:L75 | neighbors=[registerVentasIpc.js, ventaService.js, notificarInventarioActualizado(), resumenCarrito()]
- "sidebar_ejecutarsincronizacion": "ejecutarSincronizacion()" | kind=code-symbol | source=sidebar.js:L580 | neighbors=[sidebar.js, actualizarBadgePedidosAtrasados(), actualizarBadgeSolicitudes(), actualizarProximaSincronizacion()]
- "sync_migrate_incremental_pull_public_assign_sync_seq": "public.assign_sync_seq()" | kind=code-symbol | source=sync/migrate_incremental_pull.sql:L50 | neighbors=[migrate_incremental_pull.sql, ON, public, ya]
- "sync_migrate_kardex_retention": "migrate_kardex_retention.sql" | kind=code-symbol | source=sync/migrate_kardex_retention.sql:L1 | neighbors=[308b9c1 feat: implement incremental syn…, public, public.kardex_checkpoints, public.podar_kardex()]
- "sync_migrate_purgar_abonos_eliminados": "migrate_purgar_abonos_eliminados.sql" | kind=code-symbol | source=sync/migrate_purgar_abonos_eliminados.sql:L1 | neighbors=[c4fc4fe Use sessionStorage; add multi-w…, public.abonos_credito, public.abonos_pedido, public.purgar_abonos_eliminados_antiguo…]
- "sync_migrate_solicitudes_gasto": "migrate_solicitudes_gasto.sql" | kind=code-symbol | source=sync/migrate_solicitudes_gasto.sql:L1 | neighbors=[bfa73bf Add pastelería sugeridos, gasto…, public.solicitudes_gasto, trg_lww_guard, trg_solicitudes_gasto_sync_seq]
- "sync_migrate_sugeridos_pasteleria": "migrate_sugeridos_pasteleria.sql" | kind=code-symbol | source=sync/migrate_sugeridos_pasteleria.sql:L1 | neighbors=[bfa73bf Add pastelería sugeridos, gasto…, public.sugeridos_pasteleria, trg_lww_guard, trg_sugeridos_pasteleria_sync_seq]
- "sync_remotedbclient_getpool": "getPool()" | kind=code-symbol | source=sync/remoteDbClient.js:L23 | neighbors=[diagnostico_sync_cierre.js, remoteDbClient.js, .then(), testConnection()]
- "sync_reset_and_seed_test_borrarsqlitelocaldetest": "borrarSqliteLocalDeTest()" | kind=code-symbol | source=sync/reset_and_seed_test.js:L78 | neighbors=[reset_and_seed_test.js, nombreAppDesdePackageJson(), rutaUserDataElectron(), main()]
- "sync_schema_postgres17_completo_public_aplicar_correccion_stock": "public.aplicar_correccion_stock()" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L472 | neighbors=[schema_postgres17_completo.sql, public.inventario_sucursal, public.movimientos_inventario, v_stock_actual]
- "sync_schema_postgres17_completo_public_categorias": "public.categorias" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L67 | neighbors=[schema_postgres17_completo.sql, public.categorias, public.productos]
- "sync_schema_postgres17_completo_public_movimientos_reserva_inventario": "public.movimientos_reserva_inventario" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L250 | neighbors=[schema_postgres17_completo.sql, public.aplicar_reserva_inventario(), public.config_sucursal, public.productos]
- "sync_schema_postgres17_completo_public_pedidos": "public.pedidos" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L265 | neighbors=[schema_postgres17_completo.sql, public.abonos_pedido, public.detalle_pedidos, public.clientes]
- "sync_schema_test_data_public_inventario_sucursal": "public.inventario_sucursal" | kind=code-symbol | source=sync/schema_test_data.sql:L115 | neighbors=[schema_test_data.sql, config_sucursal, productos, trg_lww_guard]
- "sync_seed_test_from_prod_copiartabla": "copiarTabla()" | kind=code-symbol | source=sync/seed_test_from_prod.js:L50 | neighbors=[seed_test_from_prod.js, leerTodo(), subirLotes(), main()]
- "sync_seed_test_from_prod_main": "main()" | kind=code-symbol | source=sync/seed_test_from_prod.js:L57 | neighbors=[seed_test_from_prod.js, copiarTabla(), leerTodo(), subirLotes()]
- "sync_syncservice_eserrorfuncioninexistente": "esErrorFuncionInexistente()" | kind=code-symbol | source=sync/syncService.js:L910 | neighbors=[syncService.js, podarKardexNube(), syncMovimientosInventarioSubir(), syncReservaInventarioSubir()]
- "sync_syncservice_reparardetalleventashuerfanas": "repararDetalleVentasHuerfanas()" | kind=code-symbol | source=sync/syncService.js:L553 | neighbors=[syncService.js, procesarSincronizacion(), nowISO(), upsertConLWW()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-005.json

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
