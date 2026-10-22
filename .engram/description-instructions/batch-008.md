# Node Description Batch 9 of 24

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

- "sync_schema_test_data_ventas": "ventas" | kind=code-symbol | source=sync/schema_test_data.sql:L266 | neighbors=[schema_test_data.sql, public.detalle_ventas, public.gastos]
- "sync_schema_test_logs": "schema_test_logs.sql" | kind=code-symbol | source=sync/schema_test_logs.sql:L1 | neighbors=[5bfc128 feat: implement synchronization…, public.auditoria, public.limpiar_auditoria_antigua()]
- "sync_seed_test_from_prod_leertodo": "leerTodo()" | kind=code-symbol | source=sync/seed_test_from_prod.js:L24 | neighbors=[seed_test_from_prod.js, copiarTabla(), main()]
- "sync_seed_test_from_prod_subirlotes": "subirLotes()" | kind=code-symbol | source=sync/seed_test_from_prod.js:L37 | neighbors=[seed_test_from_prod.js, copiarTabla(), main()]
- "sync_syncservice_liberarinventariosisinpendientes": "liberarInventarioSiSinPendientes()" | kind=code-symbol | source=sync/syncService.js:L902 | neighbors=[syncService.js, syncMovimientosInventarioSubir(), syncReservaInventarioSubir()]
- "sync_syncservice_podarkardexnube": "podarKardexNube()" | kind=code-symbol | source=sync/syncService.js:L1289 | neighbors=[syncService.js, esErrorFuncionInexistente(), procesarSincronizacion()]
- "sync_syncservice_synccategoriaseliminaciones": "syncCategoriasEliminaciones()" | kind=code-symbol | source=sync/syncService.js:L808 | neighbors=[syncService.js, procesarSincronizacion(), softDeleteConLWW()]
- "sync_syncservice_synccategoriassubir": "syncCategoriasSubir()" | kind=code-symbol | source=sync/syncService.js:L782 | neighbors=[syncService.js, procesarSincronizacion(), upsertConLWW()]
- "sync_syncservice_syncdetalleventaseliminaciones": "syncDetalleVentasEliminaciones()" | kind=code-symbol | source=sync/syncService.js:L365 | neighbors=[syncService.js, procesarSincronizacion(), softDeleteConLWW()]
- "sync_syncservice_syncgastoseliminaciones": "syncGastosEliminaciones()" | kind=code-symbol | source=sync/syncService.js:L667 | neighbors=[syncService.js, procesarSincronizacion(), softDeleteConLWW()]
- "sync_syncservice_syncgastossubir": "syncGastosSubir()" | kind=code-symbol | source=sync/syncService.js:L632 | neighbors=[syncService.js, procesarSincronizacion(), upsertConLWW()]
- "sync_syncservice_syncproductoseliminaciones": "syncProductosEliminaciones()" | kind=code-symbol | source=sync/syncService.js:L1080 | neighbors=[syncService.js, procesarSincronizacion(), softDeleteConLWW()]
- "sync_syncservice_syncproductossubir": "syncProductosSubir()" | kind=code-symbol | source=sync/syncService.js:L753 | neighbors=[syncService.js, procesarSincronizacion(), upsertConLWW()]
- "sync_syncservice_syncsucursaleseliminaciones": "syncSucursalesEliminaciones()" | kind=code-symbol | source=sync/syncService.js:L1314 | neighbors=[syncService.js, procesarSincronizacion(), softDeleteConLWW()]
- "sync_syncservice_syncventaseliminaciones": "syncVentasEliminaciones()" | kind=code-symbol | source=sync/syncService.js:L309 | neighbors=[syncService.js, procesarSincronizacion(), softDeleteConLWW()]
- "utils_gastos_requiereajusteinventario": "requiereAjusteInventario()" | kind=code-symbol | source=utils/gastos.js:L28 | neighbors=[registerGastosIpc.js, gastoService.js, gastos.js]
- "ventas_actualizarestadobotoncobrar": "actualizarEstadoBotonCobrar()" | kind=code-symbol | source=ventas.js:L1196 | neighbors=[ventas.js, renderizarCarrito(), setProcessingState()]
- "ventas_anteriores_agregaralcarrito": "agregarAlCarrito()" | kind=code-symbol | source=ventas-anteriores.js:L779 | neighbors=[ventas-anteriores.js, obtenerStockDisponible(), renderizarCarrito()]
- "ventas_anteriores_cambiarcantidad": "cambiarCantidad()" | kind=code-symbol | source=ventas-anteriores.js:L805 | neighbors=[ventas-anteriores.js, actualizarEstadoDescuentoUI(), renderizarCarrito()]
- "ventas_anteriores_cargarmissolicitudes": "cargarMisSolicitudes()" | kind=code-symbol | source=ventas-anteriores.js:L651 | neighbors=[ventas-anteriores.js, eliminarVentaExistente(), guardarVenta()]
- "ventas_anteriores_formatnumberui": "formatNumberUI()" | kind=code-symbol | source=ventas-anteriores.js:L23 | neighbors=[ventas-anteriores.js, iniciarEdicionVenta(), renderizarCarrito()]
- "ventas_anteriores_normalizestr": "normalizeStr()" | kind=code-symbol | source=ventas-anteriores.js:L33 | neighbors=[ventas-anteriores.js, coincideBusquedaProducto(), filtrarYRenderizarCatalogo()]
- "ventas_anteriores_obtenerporcentajedescuento": "obtenerPorcentajeDescuento()" | kind=code-symbol | source=ventas-anteriores.js:L92 | neighbors=[ventas-anteriores.js, calcularTotalVenta(), renderizarCarrito()]
- "ventas_construirtickethtml": "construirTicketHTML()" | kind=code-symbol | source=ventas.js:L284 | neighbors=[ventas.js, formatCOP(), imprimirTicket()]
- "ventas_mostrartoast": "mostrarToast()" | kind=code-symbol | source=ventas.js:L228 | neighbors=[ventas.js, agregarAlCarrito(), deshacerUltimoAgregado()]
- "admin_audit_logs_actualizarbotonespaginacion": "actualizarBotonesPaginacion()" | kind=code-symbol | source=admin-audit-logs.js:L342 | neighbors=[admin-audit-logs.js, cargarAuditoria()]
- "admin_audit_logs_fechadesdebogotaautc": "fechaDesdeBogotaAUTC()" | kind=code-symbol | source=admin-audit-logs.js:L175 | neighbors=[admin-audit-logs.js, cargarAuditoria()]
- "admin_audit_logs_fechahastabogotaautc": "fechaHastaBogotaAUTC()" | kind=code-symbol | source=admin-audit-logs.js:L180 | neighbors=[admin-audit-logs.js, cargarAuditoria()]
- "admin_audit_logs_guardarfiltrosenstorage": "guardarFiltrosEnStorage()" | kind=code-symbol | source=admin-audit-logs.js:L17 | neighbors=[admin-audit-logs.js, recargarConDebounce()]
- "admin_audit_logs_normalizestr": "normalizeStr()" | kind=code-symbol | source=admin-audit-logs.js:L198 | neighbors=[admin-audit-logs.js, productoIdsPorNombre()]
- "admin_audit_logs_recargarcondebounce": "recargarConDebounce()" | kind=code-symbol | source=admin-audit-logs.js:L122 | neighbors=[admin-audit-logs.js, guardarFiltrosEnStorage()]
- "admin_cargarclientes": "cargarClientes()" | kind=code-symbol | source=admin.js:L774 | neighbors=[admin.js, renderizarClientes()]
- "admin_construirdetallesolicitudhtml": "construirDetalleSolicitudHTML()" | kind=code-symbol | source=admin.js:L1008 | neighbors=[admin.js, tablaItemsSolicitud()]
- "admin_renderizarclientes": "renderizarClientes()" | kind=code-symbol | source=admin.js:L788 | neighbors=[admin.js, cargarClientes()]
- "admin_tablaitemssolicitud": "tablaItemsSolicitud()" | kind=code-symbol | source=admin.js:L983 | neighbors=[admin.js, construirDetalleSolicitudHTML()]
- "arqueo_aplicarbloqueocierredia": "aplicarBloqueoCierreDia()" | kind=code-symbol | source=arqueo.js:L184 | neighbors=[arqueo.js, cargarHistorialCierres()]
- "arqueo_eliminarcierrecaja": "eliminarCierreCaja()" | kind=code-symbol | source=arqueo.js:L255 | neighbors=[arqueo.js, refrescarHistorialTrasEdicion()]
- "dashboard_cargarproductos": "cargarProductos()" | kind=code-symbol | source=dashboard.js:L122 | neighbors=[dashboard.js, filtrarYRenderizar()]
- "dashboard_coincidebusquedaproducto": "coincideBusquedaProducto()" | kind=code-symbol | source=dashboard.js:L35 | neighbors=[dashboard.js, normalizeStr()]
- "dashboard_renderizarproductos": "renderizarProductos()" | kind=code-symbol | source=dashboard.js:L200 | neighbors=[dashboard.js, filtrarYRenderizar()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-008.json

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
