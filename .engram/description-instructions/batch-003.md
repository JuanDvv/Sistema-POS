# Node Description Batch 4 of 25

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

- "reportes_cargarreporte": "cargarReporte()" | kind=code-symbol | source=reportes.js:L628 | neighbors=[reportes.js, filtrarVentasPorMetodo(), formatCOP(), renderizarProductosNoVendidos(), renderizarReporteBiBi(), renderizarTablaVentas()]
- "services_fechaservice_obtenerfechahoyyyyymmdd": "obtenerFechaHoyYYYYMMDD()" | kind=code-symbol | source=services/fechaService.js:L3 | neighbors=[registerClientesIpc.js, registerGastosIpc.js, registerPedidosIpc.js, cierreCajaService.js, fechaService.js, esFechaAnteriorValida()]
- "services_inventariomovimientoservice_registrarmovimientoinventario": "registrarMovimientoInventario()" | kind=code-symbol | source=services/inventarioMovimientoService.js:L8 | neighbors=[registerGastosIpc.js, registerProductosIpc.js, registerTransferenciasIpc.js, gastoService.js, inventarioMovimientoService.js, pedidoService.js]
- "sync_syncservice_synccierrescaja": "syncCierresCaja()" | kind=code-symbol | source=sync/syncService.js:L2085 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), normalizarFechaString(), softDeleteConLWW()]
- "arqueo_confirmarcierrecaja": "confirmarCierreCaja()" | kind=code-symbol | source=arqueo.js:L315 | neighbors=[arqueo.js, cargarHistorialCierres(), cargarVentanaCajaActual(), formatCOP(), limpiarValoresCuadre(), obtenerFechaHoyStr()]
- "arqueo_refrescarhistorialtrasedicion": "refrescarHistorialTrasEdicion()" | kind=code-symbol | source=arqueo.js:L272 | neighbors=[arqueo.js, eliminarCierreCaja(), recalcularCierreCaja(), cargarHistorialCierres(), cargarVentanaCajaActual(), obtenerFechaHoyStr()]
- "pedidos_guardarcambiospedido": "guardarCambiosPedido()" | kind=code-symbol | source=pedidos.js:L673 | neighbors=[pedidos.js, abrirDetallePedido(), cargarCatalogo(), cargarPedidos(), combinarFechaHoraEntrega(), leerValorDomicilio()]
- "pedidos_leervalordomicilio": "leerValorDomicilio()" | kind=code-symbol | source=pedidos.js:L176 | neighbors=[pedidos.js, guardarCambiosPedido(), parseNumberUI(), registrarPedido(), renderizarCarritoDetalle(), renderizarCarritoPedido()]
- "reportes_formatcop": "formatCOP()" | kind=code-symbol | source=reportes.js:L28 | neighbors=[reportes.js, cargarReporte(), coincideTotalBusqueda(), construirTicketHTML(), crearFilaSeparadorCierre(), renderizarItemsEdicionVenta()]
- "reportes_normalizestr": "normalizeStr()" | kind=code-symbol | source=reportes.js:L29 | neighbors=[reportes.js, coincideAbonoFiltro(), coincideVentaFiltro(), renderizarProductosNoVendidos(), renderizarReporteBiBi(), renderizarTablaVentas()]
- "services_pedidoservice_crearpedidotx": "crearPedidoTx()" | kind=code-symbol | source=services/pedidoService.js:L158 | neighbors=[registerPedidosIpc.js, pedidoService.js, ajustarStockReservado(), notificarInventarioActualizado(), resolverOCrearClienteId(), resumenCarrito()]
- "services_pedidoservice_notificarinventarioactualizado": "notificarInventarioActualizado()" | kind=code-symbol | source=services/pedidoService.js:L22 | neighbors=[pedidoService.js, cancelarPedidoTx(), crearPedidoTx(), editarPedidoTx(), entregarPedidoTx(), revertirEntregaPedidoTx()]
- "services_serverconfigservice_obtenerconfigservidor": "obtenerConfigServidor()" | kind=code-symbol | source=services/serverConfigService.js:L24 | neighbors=[registerSistemaIpc.js, serverConfigService.js, guardarConfigServidor(), getConfigFilePath(), remoteDbClient.js, supabaseClients.js]
- "sync_migrate_cierres_caja": "migrate_cierres_caja.sql" | kind=code-symbol | source=sync/migrate_cierres_caja.sql:L1 | neighbors=[2812d87 feat: implementa módulo de cier…, 6f9f2fb Merge branch 'delipostres-turba…, bfa73bf Add pastelería sugeridos, gasto…, public.cierres_caja, trg_cierres_caja_sync_seq, trg_lww_guard]
- "sync_migrate_correccion_stock": "migrate_correccion_stock.sql" | kind=code-symbol | source=sync/migrate_correccion_stock.sql:L1 | neighbors=[308b9c1 feat: implement incremental syn…, public.aplicar_correccion_stock(), public.inventario_sucursal, public.movimientos_inventario, v_delta_real, v_stock_actual]
- "sync_migrate_incremental_pull": "migrate_incremental_pull.sql" | kind=code-symbol | source=sync/migrate_incremental_pull.sql:L1 | neighbors=[308b9c1 feat: implement incremental syn…, ON, public, public.assign_sync_seq(), trg_, ya]
- "sync_schema_postgres17_completo_public_inventario_sucursal": "public.inventario_sucursal" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L91 | neighbors=[schema_postgres17_completo.sql, public.aplicar_correccion_stock(), public.aplicar_movimiento_inventario(), public.aplicar_reserva_inventario(), public.config_sucursal, public.productos]
- "sync_syncservice_nowiso": "nowISO()" | kind=code-symbol | source=sync/syncService.js:L46 | neighbors=[syncService.js, repararDetalleVentasHuerfanas(), softDeleteConLWW(), syncPedidosSubir(), syncTransferenciasSubir(), syncVentasSubir()]
- "sync_syncservice_syncabonos": "syncAbonos()" | kind=code-symbol | source=sync/syncService.js:L1793 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), softDeleteConLWW(), upsertConLWW()]
- "sync_syncservice_syncclientes": "syncClientes()" | kind=code-symbol | source=sync/syncService.js:L1661 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), softDeleteConLWW(), upsertConLWW()]
- "sync_syncservice_syncmovimientosinventariodescargar": "syncMovimientosInventarioDescargar()" | kind=code-symbol | source=sync/syncService.js:L1221 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), esErrorTablaInexistente(), normalizarFechaString()]
- "sync_syncservice_syncpedidosdescargar": "syncPedidosDescargar()" | kind=code-symbol | source=sync/syncService.js:L1930 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), esErrorTablaInexistente(), normalizarFechaString()]
- "sync_syncservice_syncreservainventariodescargar": "syncReservaInventarioDescargar()" | kind=code-symbol | source=sync/syncService.js:L1263 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), esErrorTablaInexistente(), normalizarFechaString()]
- "sync_syncservice_syncsolicitudesgasto": "syncSolicitudesGasto()" | kind=code-symbol | source=sync/syncService.js:L2226 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), normalizarFechaString(), upsertConLWW()]
- "sync_syncservice_syncsolicitudesventa": "syncSolicitudesVenta()" | kind=code-symbol | source=sync/syncService.js:L2158 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), normalizarFechaString(), upsertConLWW()]
- "sync_syncservice_synctransferenciasdescargar": "syncTransferenciasDescargar()" | kind=code-symbol | source=sync/syncService.js:L1567 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), normalizarFechaString(), notificarTransferenciaEntrante()]
- "sync_syncservice_syncusuarios": "syncUsuarios()" | kind=code-symbol | source=sync/syncService.js:L1416 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), softDeleteConLWW(), upsertConLWW()]
- "utils_excelabastecimiento": "excelAbastecimiento.js" | kind=code-symbol | source=utils/excelAbastecimiento.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, registerProductosIpc.js, COLUMNAS, ExcelJS, generarPlantillaAbastecimiento(), leerPlantillaAbastecimiento()]
- "utils_excelpedidoextra": "excelPedidoExtra.js" | kind=code-symbol | source=utils/excelPedidoExtra.js:L1 | neighbors=[bd7e03e Rebrand to Tienda de Kary and a…, bfa73bf Add pastelería sugeridos, gasto…, registerPedidoSugeridoIpc.js, COLUMNAS, ExcelJS, generarExcelPedidoExtra()]
- "utils_excelsugeridospasteleria": "excelSugeridosPasteleria.js" | kind=code-symbol | source=utils/excelSugeridosPasteleria.js:L1 | neighbors=[bd7e03e Rebrand to Tienda de Kary and a…, bfa73bf Add pastelería sugeridos, gasto…, registerPedidoSugeridoIpc.js, COLUMNAS, ExcelJS, generarExcelSugeridosPasteleria()]
- "ventas_agregaralcarrito": "agregarAlCarrito()" | kind=code-symbol | source=ventas.js:L1168 | neighbors=[ventas.js, actualizarEstadoBotonDeshacer(), guardarCarritoTemporal(), mostrarToast(), renderizarCarrito(), reproducirBeep()]
- "ventas_anteriores_cancelaredicion": "cancelarEdicion()" | kind=code-symbol | source=ventas-anteriores.js:L686 | neighbors=[ventas-anteriores.js, cambiarModo(), cargarListaVentasDia(), limpiarCarrito(), mostrarPanelCatalogo(), guardarVenta()]
- "ventas_anteriores_limpiarcarrito": "limpiarCarrito()" | kind=code-symbol | source=ventas-anteriores.js:L964 | neighbors=[ventas-anteriores.js, cambiarModo(), cancelarEdicion(), guardarVenta(), actualizarEstadoDescuentoUI(), renderizarCarrito()]
- "ventas_deshacerultimoagregado": "deshacerUltimoAgregado()" | kind=code-symbol | source=ventas.js:L234 | neighbors=[ventas.js, actualizarEstadoBotonDeshacer(), actualizarEstadoDescuentoUI(), guardarCarritoTemporal(), mostrarToast(), renderizarCarrito()]
- "admin_audit_logs_cargarauditoria": "cargarAuditoria()" | kind=code-symbol | source=admin-audit-logs.js:L288 | neighbors=[admin-audit-logs.js, actualizarBotonesPaginacion(), fechaDesdeBogotaAUTC(), fechaHastaBogotaAUTC(), productoIdsPorNombre()]
- "arqueo_cargarhistorialcierres": "cargarHistorialCierres()" | kind=code-symbol | source=arqueo.js:L217 | neighbors=[arqueo.js, aplicarBloqueoCierreDia(), obtenerFechaHoyStr(), confirmarCierreCaja(), refrescarHistorialTrasEdicion()]
- "arqueo_cargarventanacajaactual": "cargarVentanaCajaActual()" | kind=code-symbol | source=arqueo.js:L185 | neighbors=[arqueo.js, calcularTotales(), formatCOP(), confirmarCierreCaja(), refrescarHistorialTrasEdicion()]
- "arqueo_formatcop": "formatCOP()" | kind=code-symbol | source=arqueo.js:L32 | neighbors=[arqueo.js, calcularTotales(), cargarVentanaCajaActual(), confirmarCierreCaja(), recalcularCierreCaja()]
- "commit:repo:github.com/JuanDvv/Sistema-POS@283a3fc80eb6448d910205eaba750aaccbefd209": "283a3fc feat: agrega splitter arrastrable para ajustar ancho de paneles en arqu…" | kind=Commit | source=git | neighbors=[arqueo.js, Tienda-Kary, delipostres-turbaco, 6f9f2fb Merge branch 'delipostres-turba…, 4986e5d refactor: migrate temporary car…]
- "commit:repo:github.com/JuanDvv/Sistema-POS@4986e5daa31f8d198cacd03169450cea2a90a7eb": "4986e5d refactor: migrate temporary cart storage from localStorage to sessionSt…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 283a3fc feat: agrega splitter arrastrab…, ventas.js, 68defea style: optimize layout and resp…]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-003.json

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
