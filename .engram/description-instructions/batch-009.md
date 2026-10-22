# Node Description Batch 10 of 25

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

- "sync_syncservice_podarkardexnube": "podarKardexNube()" | kind=code-symbol | source=sync/syncService.js:L1309 | neighbors=[syncService.js, esErrorFuncionInexistente(), procesarSincronizacion()]
- "sync_syncservice_synccategoriaseliminaciones": "syncCategoriasEliminaciones()" | kind=code-symbol | source=sync/syncService.js:L847 | neighbors=[syncService.js, procesarSincronizacion(), softDeleteConLWW()]
- "sync_syncservice_synccategoriassubir": "syncCategoriasSubir()" | kind=code-symbol | source=sync/syncService.js:L822 | neighbors=[syncService.js, procesarSincronizacion(), upsertConLWW()]
- "sync_syncservice_synccolaauditoria": "syncColaAuditoria()" | kind=code-symbol | source=sync/syncService.js:L221 | neighbors=[registerUsuariosIpc.js, syncService.js, procesarSincronizacion()]
- "sync_syncservice_syncdetalleventaseliminaciones": "syncDetalleVentasEliminaciones()" | kind=code-symbol | source=sync/syncService.js:L405 | neighbors=[syncService.js, procesarSincronizacion(), softDeleteConLWW()]
- "sync_syncservice_syncgastoseliminaciones": "syncGastosEliminaciones()" | kind=code-symbol | source=sync/syncService.js:L707 | neighbors=[syncService.js, procesarSincronizacion(), softDeleteConLWW()]
- "sync_syncservice_syncgastossubir": "syncGastosSubir()" | kind=code-symbol | source=sync/syncService.js:L672 | neighbors=[syncService.js, procesarSincronizacion(), upsertConLWW()]
- "sync_syncservice_syncproductoseliminaciones": "syncProductosEliminaciones()" | kind=code-symbol | source=sync/syncService.js:L1101 | neighbors=[syncService.js, procesarSincronizacion(), softDeleteConLWW()]
- "sync_syncservice_syncproductossubir": "syncProductosSubir()" | kind=code-symbol | source=sync/syncService.js:L793 | neighbors=[syncService.js, procesarSincronizacion(), upsertConLWW()]
- "sync_syncservice_syncsucursaleseliminaciones": "syncSucursalesEliminaciones()" | kind=code-symbol | source=sync/syncService.js:L1334 | neighbors=[syncService.js, procesarSincronizacion(), softDeleteConLWW()]
- "sync_syncservice_synctransferenciaseliminaciones": "syncTransferenciasEliminaciones()" | kind=code-symbol | source=sync/syncService.js:L1547 | neighbors=[syncService.js, procesarSincronizacion(), softDeleteConLWW()]
- "sync_syncservice_syncventaseliminaciones": "syncVentasEliminaciones()" | kind=code-symbol | source=sync/syncService.js:L349 | neighbors=[syncService.js, procesarSincronizacion(), softDeleteConLWW()]
- "transferencias_enviartransferencia": "enviarTransferencia()" | kind=code-symbol | source=transferencias.js:L359 | neighbors=[transferencias.js, cargarCatalogo(), renderizarCarrito()]
- "transferencias_renderizarcatalogo": "renderizarCatalogo()" | kind=code-symbol | source=transferencias.js:L254 | neighbors=[transferencias.js, cargarSucursales(), filtrarYRenderizarCatalogo()]
- "utils_gastos_requiereajusteinventario": "requiereAjusteInventario()" | kind=code-symbol | source=utils/gastos.js:L28 | neighbors=[registerGastosIpc.js, gastoService.js, gastos.js]
- "ventas_actualizarestadobotoncobrar": "actualizarEstadoBotonCobrar()" | kind=code-symbol | source=ventas.js:L1301 | neighbors=[ventas.js, renderizarCarrito(), setProcessingState()]
- "ventas_anteriores_agregaralcarrito": "agregarAlCarrito()" | kind=code-symbol | source=ventas-anteriores.js:L857 | neighbors=[ventas-anteriores.js, obtenerStockDisponible(), renderizarCarrito()]
- "ventas_anteriores_cambiarcantidad": "cambiarCantidad()" | kind=code-symbol | source=ventas-anteriores.js:L883 | neighbors=[ventas-anteriores.js, actualizarEstadoDescuentoUI(), renderizarCarrito()]
- "ventas_anteriores_cargarmissolicitudes": "cargarMisSolicitudes()" | kind=code-symbol | source=ventas-anteriores.js:L714 | neighbors=[ventas-anteriores.js, eliminarVentaExistente(), guardarVenta()]
- "ventas_anteriores_formatnumberui": "formatNumberUI()" | kind=code-symbol | source=ventas-anteriores.js:L41 | neighbors=[ventas-anteriores.js, iniciarEdicionVenta(), renderizarCarrito()]
- "ventas_anteriores_normalizestr": "normalizeStr()" | kind=code-symbol | source=ventas-anteriores.js:L51 | neighbors=[ventas-anteriores.js, detectarTamanoLibra(), filtrarYRenderizarCatalogo()]
- "ventas_anteriores_obtenerporcentajedescuento": "obtenerPorcentajeDescuento()" | kind=code-symbol | source=ventas-anteriores.js:L110 | neighbors=[ventas-anteriores.js, calcularTotalVenta(), renderizarCarrito()]
- "ventas_calculartotalitemcondescuento": "calcularTotalItemConDescuento()" | kind=code-symbol | source=ventas.js:L113 | neighbors=[ventas.js, esCategoriaPasteleria(), redondearACentena()]
- "ventas_formatcop": "formatCOP()" | kind=code-symbol | source=ventas.js:L66 | neighbors=[ventas.js, construirTicketHTML(), renderizarCarrito()]
- "ventas_mostrartoast": "mostrarToast()" | kind=code-symbol | source=ventas.js:L196 | neighbors=[ventas.js, agregarAlCarrito(), deshacerUltimoAgregado()]
- "ventas_normalizestr": "normalizeStr()" | kind=code-symbol | source=ventas.js:L135 | neighbors=[ventas.js, detectarTamanoLibra(), filtrarYRenderizarCatalogo()]
- "ventas_obtenerporcentajedescuento": "obtenerPorcentajeDescuento()" | kind=code-symbol | source=ventas.js:L78 | neighbors=[ventas.js, calcularTotalVenta(), renderizarCarrito()]
- "ventas_parsenumberui": "parseNumberUI()" | kind=code-symbol | source=ventas.js:L72 | neighbors=[ventas.js, calcularTotalVenta(), construirTicketHTML()]
- "admin_asegurarcategoriaspasteleriacargadas": "asegurarCategoriasPasteleriaCargadas()" | kind=code-symbol | source=admin.js:L1350 | neighbors=[admin.js, inicializarSugeridosPasteleria()]
- "admin_audit_logs_actualizarbotonespaginacion": "actualizarBotonesPaginacion()" | kind=code-symbol | source=admin-audit-logs.js:L362 | neighbors=[admin-audit-logs.js, cargarAuditoria()]
- "admin_audit_logs_fechadesdebogotaautc": "fechaDesdeBogotaAUTC()" | kind=code-symbol | source=admin-audit-logs.js:L195 | neighbors=[admin-audit-logs.js, cargarAuditoria()]
- "admin_audit_logs_fechahastabogotaautc": "fechaHastaBogotaAUTC()" | kind=code-symbol | source=admin-audit-logs.js:L200 | neighbors=[admin-audit-logs.js, cargarAuditoria()]
- "admin_audit_logs_guardarfiltrosenstorage": "guardarFiltrosEnStorage()" | kind=code-symbol | source=admin-audit-logs.js:L37 | neighbors=[admin-audit-logs.js, recargarConDebounce()]
- "admin_audit_logs_normalizestr": "normalizeStr()" | kind=code-symbol | source=admin-audit-logs.js:L218 | neighbors=[admin-audit-logs.js, productoIdsPorNombre()]
- "admin_audit_logs_recargarcondebounce": "recargarConDebounce()" | kind=code-symbol | source=admin-audit-logs.js:L142 | neighbors=[admin-audit-logs.js, guardarFiltrosEnStorage()]
- "admin_cargarclientes": "cargarClientes()" | kind=code-symbol | source=admin.js:L747 | neighbors=[admin.js, renderizarClientes()]
- "admin_construirdetallesolicitudhtml": "construirDetalleSolicitudHTML()" | kind=code-symbol | source=admin.js:L977 | neighbors=[admin.js, tablaItemsSolicitud()]
- "admin_inicializarcalculadorapedidoextra": "inicializarCalculadoraPedidoExtra()" | kind=code-symbol | source=admin.js:L1482 | neighbors=[admin.js, poblarSelectorSucursal()]
- "admin_normalizestrpasteleria": "normalizeStrPasteleria()" | kind=code-symbol | source=admin.js:L1324 | neighbors=[admin.js, renderTablaSugeridosPasteleria()]
- "admin_renderizarclientes": "renderizarClientes()" | kind=code-symbol | source=admin.js:L761 | neighbors=[admin.js, cargarClientes()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-009.json

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
