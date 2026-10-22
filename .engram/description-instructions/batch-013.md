# Node Description Batch 14 of 24

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

- "sync_syncservice_descargartodo": "descargarTodo()" | kind=code-symbol | source=sync/syncService.js:L66 | neighbors=[syncService.js, descargarDesdeCursor()]
- "sync_syncservice_eserrorcolumnainexistente": "esErrorColumnaInexistente()" | kind=code-symbol | source=sync/syncService.js:L105 | neighbors=[syncService.js, descargarDesdeCursor()]
- "sync_syncservice_hayconexionconocida": "hayConexionConocida()" | kind=code-symbol | source=sync/syncService.js:L2077 | neighbors=[registerSistemaIpc.js, syncService.js]
- "sync_syncservice_hayconexionconsupabase": "hayConexionConSupabase()" | kind=code-symbol | source=sync/syncService.js:L2052 | neighbors=[syncService.js, procesarSincronizacion()]
- "sync_syncservice_issincronizando": "isSincronizando()" | kind=code-symbol | source=sync/syncService.js:L44 | neighbors=[registerSistemaIpc.js, syncService.js]
- "sync_syncservice_liberarinventariopendientehuerfano": "liberarInventarioPendienteHuerfano()" | kind=code-symbol | source=sync/syncService.js:L929 | neighbors=[syncService.js, procesarSincronizacion()]
- "sync_syncservice_notificarestadoconexion": "notificarEstadoConexion()" | kind=code-symbol | source=sync/syncService.js:L2080 | neighbors=[syncService.js, procesarSincronizacion()]
- "sync_syncservice_notificarestadosincronizacion": "notificarEstadoSincronizacion()" | kind=code-symbol | source=sync/syncService.js:L2023 | neighbors=[syncService.js, procesarSincronizacion()]
- "sync_syncservice_notificarventanasreportes": "notificarVentanasReportes()" | kind=code-symbol | source=sync/syncService.js:L2033 | neighbors=[syncService.js, procesarSincronizacion()]
- "sync_syncservice_obtenercursor": "obtenerCursor()" | kind=code-symbol | source=sync/syncService.js:L87 | neighbors=[syncService.js, descargarDesdeCursor()]
- "sync_syncservice_reparardetalleventasduplicado": "repararDetalleVentasDuplicado()" | kind=code-symbol | source=sync/syncService.js:L461 | neighbors=[syncService.js, procesarSincronizacion()]
- "sync_syncservice_synccolaauditoria": "syncColaAuditoria()" | kind=code-symbol | source=sync/syncService.js:L197 | neighbors=[syncService.js, procesarSincronizacion()]
- "utils_cierrescaja_tipos_cierre_caja": "TIPOS_CIERRE_CAJA" | kind=code-symbol | source=utils/cierresCaja.js:L1 | neighbors=[cierreCajaService.js, cierresCaja.js]
- "utils_excelabastecimiento_generarplantillaabastecimiento": "generarPlantillaAbastecimiento()" | kind=code-symbol | source=utils/excelAbastecimiento.js:L17 | neighbors=[registerProductosIpc.js, excelAbastecimiento.js]
- "utils_excelabastecimiento_leerplantillaabastecimiento": "leerPlantillaAbastecimiento()" | kind=code-symbol | source=utils/excelAbastecimiento.js:L36 | neighbors=[registerProductosIpc.js, excelAbastecimiento.js]
- "ventas_anteriores_coincidebusquedaproducto": "coincideBusquedaProducto()" | kind=code-symbol | source=ventas-anteriores.js:L40 | neighbors=[ventas-anteriores.js, normalizeStr()]
- "ventas_anteriores_isotofechadia": "isoToFechaDia()" | kind=code-symbol | source=ventas-anteriores.js:L80 | neighbors=[ventas-anteriores.js, iniciarEdicionVenta()]
- "ventas_anteriores_obtenerfechaayeryyyymmdd": "obtenerFechaAyerYYYYMMDD()" | kind=code-symbol | source=ventas-anteriores.js:L71 | neighbors=[ventas-anteriores.js, guardarVenta()]
- "ventas_anteriores_obtenerstockdisponible": "obtenerStockDisponible()" | kind=code-symbol | source=ventas-anteriores.js:L88 | neighbors=[ventas-anteriores.js, agregarAlCarrito()]
- "ventas_anteriores_parsenumberui": "parseNumberUI()" | kind=code-symbol | source=ventas-anteriores.js:L28 | neighbors=[ventas-anteriores.js, guardarVenta()]
- "ventas_anteriores_renderizarcatalogo": "renderizarCatalogo()" | kind=code-symbol | source=ventas-anteriores.js:L725 | neighbors=[ventas-anteriores.js, filtrarYRenderizarCatalogo()]
- "ventas_anteriores_setprocessingstate": "setProcessingState()" | kind=code-symbol | source=ventas-anteriores.js:L877 | neighbors=[ventas-anteriores.js, guardarVenta()]
- "ventas_calculartotalventa": "calcularTotalVenta()" | kind=code-symbol | source=ventas.js:L166 | neighbors=[ventas.js, renderizarCarrito()]
- "ventas_cargarcatalogo": "cargarCatalogo()" | kind=code-symbol | source=ventas.js:L961 | neighbors=[ventas.js, filtrarYRenderizarCatalogo()]
- "ventas_coincidebusquedaproducto": "coincideBusquedaProducto()" | kind=code-symbol | source=ventas.js:L179 | neighbors=[ventas.js, normalizeStr()]
- "ventas_escategoriacamiseta": "esCategoriaCamiseta()" | kind=code-symbol | source=ventas.js:L106 | neighbors=[ventas.js, obtenerTipoDescuentoItem()]
- "ventas_esclientemayoristaactivo": "esClienteMayoristaActivo()" | kind=code-symbol | source=ventas.js:L78 | neighbors=[ventas.js, calcularDescuentoLinea()]
- "ventas_formatnumberui": "formatNumberUI()" | kind=code-symbol | source=ventas.js:L59 | neighbors=[ventas.js, renderizarCarrito()]
- "ventas_imprimirticket": "imprimirTicket()" | kind=code-symbol | source=ventas.js:L344 | neighbors=[ventas.js, construirTicketHTML()]
- "ventas_obtenerporcentajedescuentomanual": "obtenerPorcentajeDescuentoManual()" | kind=code-symbol | source=ventas.js:L70 | neighbors=[ventas.js, calcularDescuentoLinea()]
- "ventas_obtenertotalunidadeselegibles": "obtenerTotalUnidadesElegibles()" | kind=code-symbol | source=ventas.js:L107 | neighbors=[ventas.js, calcularDescuentoLinea()]
- "ventas_renderizarcatalogo": "renderizarCatalogo()" | kind=code-symbol | source=ventas.js:L985 | neighbors=[ventas.js, filtrarYRenderizarCatalogo()]
- "ventas_reproducirbeep": "reproducirBeep()" | kind=code-symbol | source=ventas.js:L239 | neighbors=[ventas.js, agregarAlCarrito()]
- "ventas_setprocessingstate": "setProcessingState()" | kind=code-symbol | source=ventas.js:L1205 | neighbors=[ventas.js, actualizarEstadoBotonCobrar()]
- "admin_abrirmodalconfoco": "abrirModalConFoco()" | kind=code-symbol | source=admin.js:L13 | neighbors=[admin.js]
- "admin_audit_logs_cargaraccionesfiltro": "cargarAccionesFiltro()" | kind=code-symbol | source=admin-audit-logs.js:L146 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_cargarproductosparaauditoria": "cargarProductosParaAuditoria()" | kind=code-symbol | source=admin-audit-logs.js:L188 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_cargarsucursalesfiltro": "cargarSucursalesFiltro()" | kind=code-symbol | source=admin-audit-logs.js:L132 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_cargarusuariosfiltro": "cargarUsuariosFiltro()" | kind=code-symbol | source=admin-audit-logs.js:L160 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_clavediabogota": "claveDiaBogota()" | kind=code-symbol | source=admin-audit-logs.js:L251 | neighbors=[admin-audit-logs.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-013.json

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
