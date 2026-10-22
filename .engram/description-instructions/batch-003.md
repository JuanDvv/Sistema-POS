# Node Description Batch 4 of 24

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

- "sync_migrate_correccion_stock": "migrate_correccion_stock.sql" | kind=code-symbol | source=sync/migrate_correccion_stock.sql:L1 | neighbors=[308b9c1 feat: implement incremental syn…, public.aplicar_correccion_stock(), public.inventario_sucursal, public.movimientos_inventario, v_delta_real, v_stock_actual]
- "sync_migrate_incremental_pull": "migrate_incremental_pull.sql" | kind=code-symbol | source=sync/migrate_incremental_pull.sql:L1 | neighbors=[308b9c1 feat: implement incremental syn…, ON, public, public.assign_sync_seq(), trg_, ya]
- "sync_schema_postgres17_completo_public_inventario_sucursal": "public.inventario_sucursal" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L88 | neighbors=[schema_postgres17_completo.sql, public.aplicar_correccion_stock(), public.aplicar_movimiento_inventario(), public.aplicar_reserva_inventario(), public.config_sucursal, public.productos]
- "sync_schema_postgres17_completo_public_productos": "public.productos" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L75 | neighbors=[schema_postgres17_completo.sql, public.detalle_pedidos, public.inventario_sucursal, public.movimientos_inventario, public.movimientos_reserva_inventario, public.categorias]
- "sync_syncservice_syncabonos": "syncAbonos()" | kind=code-symbol | source=sync/syncService.js:L1551 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), softDeleteConLWW(), upsertConLWW()]
- "sync_syncservice_synccierrescaja": "syncCierresCaja()" | kind=code-symbol | source=sync/syncService.js:L1822 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), softDeleteConLWW(), upsertConLWW()]
- "sync_syncservice_syncclientes": "syncClientes()" | kind=code-symbol | source=sync/syncService.js:L1482 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), softDeleteConLWW(), upsertConLWW()]
- "sync_syncservice_syncusuarios": "syncUsuarios()" | kind=code-symbol | source=sync/syncService.js:L1398 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), softDeleteConLWW(), upsertConLWW()]
- "utils_excelabastecimiento": "excelAbastecimiento.js" | kind=code-symbol | source=utils/excelAbastecimiento.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, registerProductosIpc.js, COLUMNAS, ExcelJS, generarPlantillaAbastecimiento(), leerPlantillaAbastecimiento()]
- "ventas_agregaralcarrito": "agregarAlCarrito()" | kind=code-symbol | source=ventas.js:L1063 | neighbors=[ventas.js, actualizarEstadoBotonDeshacer(), guardarCarritoTemporal(), mostrarToast(), renderizarCarrito(), reproducirBeep()]
- "ventas_anteriores_cancelaredicion": "cancelarEdicion()" | kind=code-symbol | source=ventas-anteriores.js:L623 | neighbors=[ventas-anteriores.js, cambiarModo(), cargarListaVentasDia(), limpiarCarrito(), mostrarPanelCatalogo(), guardarVenta()]
- "ventas_anteriores_limpiarcarrito": "limpiarCarrito()" | kind=code-symbol | source=ventas-anteriores.js:L886 | neighbors=[ventas-anteriores.js, cambiarModo(), cancelarEdicion(), guardarVenta(), actualizarEstadoDescuentoUI(), renderizarCarrito()]
- "ventas_calculardescuentolinea": "calcularDescuentoLinea()" | kind=code-symbol | source=ventas.js:L110 | neighbors=[ventas.js, esClienteMayoristaActivo(), formatCOP(), obtenerPorcentajeDescuentoManual(), obtenerTipoDescuentoItem(), obtenerTotalUnidadesElegibles()]
- "ventas_deshacerultimoagregado": "deshacerUltimoAgregado()" | kind=code-symbol | source=ventas.js:L266 | neighbors=[ventas.js, actualizarEstadoBotonDeshacer(), actualizarEstadoDescuentoUI(), guardarCarritoTemporal(), mostrarToast(), renderizarCarrito()]
- "admin_audit_logs_cargarauditoria": "cargarAuditoria()" | kind=code-symbol | source=admin-audit-logs.js:L268 | neighbors=[admin-audit-logs.js, actualizarBotonesPaginacion(), fechaDesdeBogotaAUTC(), fechaHastaBogotaAUTC(), productoIdsPorNombre()]
- "arqueo_cargarhistorialcierres": "cargarHistorialCierres()" | kind=code-symbol | source=arqueo.js:L192 | neighbors=[arqueo.js, aplicarBloqueoCierreDia(), obtenerFechaHoyStr(), confirmarCierreCaja(), refrescarHistorialTrasEdicion()]
- "arqueo_cargarventanacajaactual": "cargarVentanaCajaActual()" | kind=code-symbol | source=arqueo.js:L160 | neighbors=[arqueo.js, calcularTotales(), formatCOP(), confirmarCierreCaja(), refrescarHistorialTrasEdicion()]
- "arqueo_formatcop": "formatCOP()" | kind=code-symbol | source=arqueo.js:L8 | neighbors=[arqueo.js, calcularTotales(), cargarVentanaCajaActual(), confirmarCierreCaja(), recalcularCierreCaja()]
- "commit:repo:github.com/JuanDvv/Sistema-POS@283a3fc80eb6448d910205eaba750aaccbefd209": "283a3fc feat: agrega splitter arrastrable para ajustar ancho de paneles en arqu…" | kind=Commit | source=git | neighbors=[arqueo.js, Tienda-Kary, delipostres-turbaco, 6f9f2fb Merge branch 'delipostres-turba…, 4986e5d refactor: migrate temporary car…]
- "commit:repo:github.com/JuanDvv/Sistema-POS@4986e5daa31f8d198cacd03169450cea2a90a7eb": "4986e5d refactor: migrate temporary cart storage from localStorage to sessionSt…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 283a3fc feat: agrega splitter arrastrab…, ventas.js, 68defea style: optimize layout and resp…]
- "commit:repo:github.com/JuanDvv/Sistema-POS@4c924e99f29bfcddc8203f3558313ffc6e863b50": "4c924e9 feat: implement robust sync engine with LWW conflict resolution, increm…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, ee31f83 feat: improve order list format…, syncService.js, 85893e4 feat: implement IPC handlers fo…]
- "commit:repo:github.com/JuanDvv/Sistema-POS@68efa368f46b75b066c8fd2ecafdbfb41cb294c7": "68efa36 refactor: replace localStorage with sessionStorage for cart persistence…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 6f9f2fb Merge branch 'delipostres-turba…, ventas.js, 84696d5 feat: enable client management …]
- "commit:repo:github.com/JuanDvv/Sistema-POS@9b92df4e55b373cf3834c983fdb609101fa40758": "9b92df4 feat: add event listener to refresh master data tables upon POS synchro…" | kind=Commit | source=git | neighbors=[admin.js, Tienda-Kary, delipostres-turbaco, bda8c3f feat: add branch location badge…, ed98665 feat: add payment method select…]
- "commit:repo:github.com/JuanDvv/Sistema-POS@ed98665e347d3b71901fab6d96ec5a6fab620c95": "ed98665 feat: add payment method selection modal for orders with pending balanc…" | kind=Commit | source=git | neighbors=[aa81749 feat: implement real-time inven…, Tienda-Kary, delipostres-turbaco, 9b92df4 feat: add event listener to ref…, pedidos.js]
- "gestion_cargarreportecreditos": "cargarReporteCreditos()" | kind=code-symbol | source=gestion.js:L905 | neighbors=[gestion.js, calcularRangoFechasFiltro(), poblarSelectClientesCredito(), renderizarTabCreditos(), cargarReportesGestion()]
- "pedidos_formatcop": "formatCOP()" | kind=code-symbol | source=pedidos.js:L28 | neighbors=[pedidos.js, abrirDetallePedido(), actualizarSaldoPendienteDetalle(), entregarPedidoActual(), renderizarCarritoEn()]
- "pedidos_guardarcambiospedido": "guardarCambiosPedido()" | kind=code-symbol | source=pedidos.js:L633 | neighbors=[pedidos.js, abrirDetallePedido(), cargarCatalogo(), cargarPedidos(), combinarFechaHoraEntrega()]
- "pedidos_renderizarcarritopedido": "renderizarCarritoPedido()" | kind=code-symbol | source=pedidos.js:L191 | neighbors=[pedidos.js, agregarAlCarritoPedido(), cambiarCantidadPedido(), limpiarFormularioNuevoPedido(), renderizarCarritoEn()]
- "reportes_cargarreporte": "cargarReporte()" | kind=code-symbol | source=reportes.js:L187 | neighbors=[reportes.js, crearFilaSeparadorCierre(), filtrarVentasPorMetodo(), formatCOP(), refrescarReportePorSincronizacion()]
- "reportes_formatcop": "formatCOP()" | kind=code-symbol | source=reportes.js:L10 | neighbors=[reportes.js, cargarReporte(), construirTicketHTML(), crearFilaSeparadorCierre(), renderizarItemsEdicionVenta()]
- "services_cierrecajaservice_calcularventanayesperado": "calcularVentanaYEsperado()" | kind=code-symbol | source=services/cierreCajaService.js:L72 | neighbors=[registerCierresCajaIpc.js, cierreCajaService.js, calcularEfectivoVentana(), inicioDeHoyISO(), registrarCierreCajaTx()]
- "services_pedidoservice_editarpedidotx": "editarPedidoTx()" | kind=code-symbol | source=services/pedidoService.js:L274 | neighbors=[registerPedidosIpc.js, pedidoService.js, ajustarStockReservado(), describirCambiosPedido(), notificarInventarioActualizado()]
- "services_printservice_seleccionarimpresora": "seleccionarImpresora()" | kind=code-symbol | source=services/printService.js:L150 | neighbors=[printService.js, imprimirTicket(), imprimirTicketPedido(), leerImpresoraGuardada(), obtenerImpresoraPredeterminadaWindows()]
- "services_ventaservice_editarventacompletatx": "editarVentaCompletaTx()" | kind=code-symbol | source=services/ventaService.js:L227 | neighbors=[registerVentasIpc.js, ventaService.js, buscarGastoDomicilioDeVenta(), describirCambiosProductos(), notificarInventarioActualizado()]
- "sync_migrate_correccion_stock_public_aplicar_correccion_stock": "public.aplicar_correccion_stock()" | kind=code-symbol | source=sync/migrate_correccion_stock.sql:L29 | neighbors=[migrate_correccion_stock.sql, public.inventario_sucursal, public.movimientos_inventario, v_delta_real, v_stock_actual]
- "sync_schema_postgres17_completo_public_aplicar_correccion_stock": "public.aplicar_correccion_stock()" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L418 | neighbors=[schema_postgres17_completo.sql, public.inventario_sucursal, public.movimientos_inventario, v_delta_real, v_stock_actual]
- "sync_schema_postgres17_completo_public_movimientos_inventario": "public.movimientos_inventario" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L200 | neighbors=[schema_postgres17_completo.sql, public.aplicar_correccion_stock(), public.aplicar_movimiento_inventario(), public.config_sucursal, public.productos]
- "sync_syncservice_nowiso": "nowISO()" | kind=code-symbol | source=sync/syncService.js:L46 | neighbors=[syncService.js, repararDetalleVentasHuerfanas(), softDeleteConLWW(), syncPedidosSubir(), syncVentasSubir()]
- "sync_syncservice_syncmovimientosinventariodescargar": "syncMovimientosInventarioDescargar()" | kind=code-symbol | source=sync/syncService.js:L1201 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), esErrorTablaInexistente()]
- "sync_syncservice_syncmovimientosinventariosubir": "syncMovimientosInventarioSubir()" | kind=code-symbol | source=sync/syncService.js:L969 | neighbors=[syncService.js, procesarSincronizacion(), esErrorFuncionInexistente(), esErrorTablaInexistente(), liberarInventarioSiSinPendientes()]

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
