# Node Description Batch 6 of 24

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

- "services_printservice_listarimpresorasdisponibles": "listarImpresorasDisponibles()" | kind=code-symbol | source=services/printService.js:L186 | neighbors=[registerImpresionIpc.js, printService.js, leerImpresoraGuardada(), obtenerImpresoraPredeterminadaWindows()]
- "services_serverconfigservice_guardarconfigservidor": "guardarConfigServidor()" | kind=code-symbol | source=services/serverConfigService.js:L55 | neighbors=[registerSistemaIpc.js, serverConfigService.js, getConfigFilePath(), obtenerConfigServidor()]
- "services_ventaservice_eliminarventatx": "eliminarVentaTx()" | kind=code-symbol | source=services/ventaService.js:L169 | neighbors=[registerVentasIpc.js, ventaService.js, buscarGastoDomicilioDeVenta(), resumenCarrito()]
- "services_ventaservice_insertarventatx": "insertarVentaTx()" | kind=code-symbol | source=services/ventaService.js:L75 | neighbors=[registerVentasIpc.js, ventaService.js, notificarInventarioActualizado(), resumenCarrito()]
- "sidebar_ejecutarsincronizacion": "ejecutarSincronizacion()" | kind=code-symbol | source=sidebar.js:L580 | neighbors=[sidebar.js, actualizarBadgePedidosAtrasados(), actualizarBadgeSolicitudes(), actualizarProximaSincronizacion()]
- "sync_migrate_incremental_pull_public_assign_sync_seq": "public.assign_sync_seq()" | kind=code-symbol | source=sync/migrate_incremental_pull.sql:L50 | neighbors=[migrate_incremental_pull.sql, ON, public, ya]
- "sync_migrate_kardex_retention": "migrate_kardex_retention.sql" | kind=code-symbol | source=sync/migrate_kardex_retention.sql:L1 | neighbors=[308b9c1 feat: implement incremental syn…, public, public.kardex_checkpoints, public.podar_kardex()]
- "sync_migrate_solicitudes_gasto": "migrate_solicitudes_gasto.sql" | kind=code-symbol | source=sync/migrate_solicitudes_gasto.sql:L1 | neighbors=[bfa73bf Add pastelería sugeridos, gasto…, public.solicitudes_gasto, trg_lww_guard, trg_solicitudes_gasto_sync_seq]
- "sync_migrate_sugeridos_pasteleria": "migrate_sugeridos_pasteleria.sql" | kind=code-symbol | source=sync/migrate_sugeridos_pasteleria.sql:L1 | neighbors=[bfa73bf Add pastelería sugeridos, gasto…, public.sugeridos_pasteleria, trg_lww_guard, trg_sugeridos_pasteleria_sync_seq]
- "sync_reset_and_seed_test_borrarsqlitelocaldetest": "borrarSqliteLocalDeTest()" | kind=code-symbol | source=sync/reset_and_seed_test.js:L78 | neighbors=[reset_and_seed_test.js, nombreAppDesdePackageJson(), rutaUserDataElectron(), main()]
- "sync_schema_postgres17_completo_public": "public" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L336 | neighbors=[schema_postgres17_completo.sql, public.podar_kardex(), trg_assign_sync_seq, trg_lww_guard]
- "sync_schema_postgres17_completo_public_categorias": "public.categorias" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L66 | neighbors=[schema_postgres17_completo.sql, public.categorias, public.productos]
- "sync_schema_postgres17_completo_public_config_sucursal": "public.config_sucursal" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L43 | neighbors=[schema_postgres17_completo.sql, public.inventario_sucursal, public.movimientos_inventario, public.movimientos_reserva_inventario]
- "sync_schema_postgres17_completo_public_movimientos_reserva_inventario": "public.movimientos_reserva_inventario" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L215 | neighbors=[schema_postgres17_completo.sql, public.aplicar_reserva_inventario(), public.config_sucursal, public.productos]
- "sync_schema_postgres17_completo_public_pedidos": "public.pedidos" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L229 | neighbors=[schema_postgres17_completo.sql, public.abonos_pedido, public.detalle_pedidos, public.clientes]
- "sync_schema_test_data_public_inventario_sucursal": "public.inventario_sucursal" | kind=code-symbol | source=sync/schema_test_data.sql:L115 | neighbors=[schema_test_data.sql, config_sucursal, productos, trg_lww_guard]
- "sync_seed_test_from_prod_copiartabla": "copiarTabla()" | kind=code-symbol | source=sync/seed_test_from_prod.js:L50 | neighbors=[seed_test_from_prod.js, leerTodo(), subirLotes(), main()]
- "sync_seed_test_from_prod_main": "main()" | kind=code-symbol | source=sync/seed_test_from_prod.js:L57 | neighbors=[seed_test_from_prod.js, copiarTabla(), leerTodo(), subirLotes()]
- "sync_syncservice_eserrorfuncioninexistente": "esErrorFuncionInexistente()" | kind=code-symbol | source=sync/syncService.js:L889 | neighbors=[syncService.js, podarKardexNube(), syncMovimientosInventarioSubir(), syncReservaInventarioSubir()]
- "sync_syncservice_reparardetalleventashuerfanas": "repararDetalleVentasHuerfanas()" | kind=code-symbol | source=sync/syncService.js:L513 | neighbors=[syncService.js, procesarSincronizacion(), nowISO(), upsertConLWW()]
- "sync_syncservice_synccategoriasdescargar": "syncCategoriasDescargar()" | kind=code-symbol | source=sync/syncService.js:L1099 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor()]
- "sync_syncservice_syncgastosdescargar": "syncGastosDescargar()" | kind=code-symbol | source=sync/syncService.js:L713 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor()]
- "sync_syncservice_syncinventariodescargar": "syncInventarioDescargar()" | kind=code-symbol | source=sync/syncService.js:L1167 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor()]
- "sync_syncservice_syncproductosdescargar": "syncProductosDescargar()" | kind=code-symbol | source=sync/syncService.js:L1131 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor()]
- "sync_syncservice_syncventasdescargar": "syncVentasDescargar()" | kind=code-symbol | source=sync/syncService.js:L381 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor()]
- "sync_syncservice_syncventassubir": "syncVentasSubir()" | kind=code-symbol | source=sync/syncService.js:L238 | neighbors=[syncService.js, procesarSincronizacion(), nowISO(), upsertConLWW()]
- "utils_gastos_estados_devolucion": "ESTADOS_DEVOLUCION" | kind=code-symbol | source=utils/gastos.js:L11 | neighbors=[registerGastosIpc.js, registerReportesIpc.js, gastoService.js, gastos.js]
- "utils_gastos_tipos_gasto": "TIPOS_GASTO" | kind=code-symbol | source=utils/gastos.js:L1 | neighbors=[registerGastosIpc.js, registerReportesIpc.js, gastoService.js, gastos.js]
- "ventas_anteriores_calculartotalventa": "calcularTotalVenta()" | kind=code-symbol | source=ventas-anteriores.js:L125 | neighbors=[ventas-anteriores.js, obtenerPorcentajeDescuento(), guardarVenta(), renderizarCarrito()]
- "ventas_anteriores_cargarcatalogo": "cargarCatalogo()" | kind=code-symbol | source=ventas-anteriores.js:L711 | neighbors=[ventas-anteriores.js, filtrarYRenderizarCatalogo(), eliminarVentaExistente(), guardarVenta()]
- "ventas_anteriores_cargarlistaventasdia": "cargarListaVentasDia()" | kind=code-symbol | source=ventas-anteriores.js:L465 | neighbors=[ventas-anteriores.js, cambiarModo(), cancelarEdicion(), eliminarVentaExistente()]
- "ventas_anteriores_eliminarventaexistente": "eliminarVentaExistente()" | kind=code-symbol | source=ventas-anteriores.js:L636 | neighbors=[ventas-anteriores.js, cargarCatalogo(), cargarListaVentasDia(), cargarMisSolicitudes()]
- "ventas_anteriores_formatcop": "formatCOP()" | kind=code-symbol | source=ventas-anteriores.js:L22 | neighbors=[ventas-anteriores.js, guardarVenta(), iniciarEdicionVenta(), renderizarCarrito()]
- "ventas_anteriores_mostrarpanelcatalogo": "mostrarPanelCatalogo()" | kind=code-symbol | source=ventas-anteriores.js:L436 | neighbors=[ventas-anteriores.js, cambiarModo(), cancelarEdicion(), iniciarEdicionVenta()]
- "ventas_filtraryrenderizarcatalogo": "filtrarYRenderizarCatalogo()" | kind=code-symbol | source=ventas.js:L911 | neighbors=[ventas.js, cargarCatalogo(), normalizeStr(), renderizarCatalogo()]
- "ventas_formatcop": "formatCOP()" | kind=code-symbol | source=ventas.js:L58 | neighbors=[ventas.js, calcularDescuentoLinea(), construirTicketHTML(), renderizarCarrito()]
- "ventas_guardarcarritotemporal": "guardarCarritoTemporal()" | kind=code-symbol | source=ventas.js:L169 | neighbors=[ventas.js, agregarAlCarrito(), cambiarCantidad(), deshacerUltimoAgregado()]
- "ventas_limpiarestadoventa": "limpiarEstadoVenta()" | kind=code-symbol | source=ventas.js:L1214 | neighbors=[ventas.js, actualizarEstadoBotonDeshacer(), actualizarEstadoDescuentoUI(), renderizarCarrito()]
- "ventas_normalizestr": "normalizeStr()" | kind=code-symbol | source=ventas.js:L172 | neighbors=[ventas.js, coincideBusquedaProducto(), filtrarYRenderizarCatalogo(), obtenerTipoDescuentoItem()]
- "ventas_obtenertipodescuentoitem": "obtenerTipoDescuentoItem()" | kind=code-symbol | source=ventas.js:L83 | neighbors=[ventas.js, calcularDescuentoLinea(), esCategoriaCamiseta(), normalizeStr()]

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
