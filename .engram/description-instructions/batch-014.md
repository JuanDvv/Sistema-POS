# Node Description Batch 15 of 25

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

- "turnos_obtenerdeltadias": "obtenerDeltaDias()" | kind=code-symbol | source=turnos.js:L33 | neighbors=[turnos.js, renderizarTabla()]
- "turnos_poblarselectoresoperadores": "poblarSelectoresOperadores()" | kind=code-symbol | source=turnos.js:L69 | neighbors=[turnos.js, inicializarModuloTurnos()]
- "utils_cierrescaja_tipos_cierre_caja": "TIPOS_CIERRE_CAJA" | kind=code-symbol | source=utils/cierresCaja.js:L1 | neighbors=[cierreCajaService.js, cierresCaja.js]
- "utils_excelabastecimiento_generarplantillaabastecimiento": "generarPlantillaAbastecimiento()" | kind=code-symbol | source=utils/excelAbastecimiento.js:L17 | neighbors=[registerProductosIpc.js, excelAbastecimiento.js]
- "utils_excelabastecimiento_leerplantillaabastecimiento": "leerPlantillaAbastecimiento()" | kind=code-symbol | source=utils/excelAbastecimiento.js:L36 | neighbors=[registerProductosIpc.js, excelAbastecimiento.js]
- "utils_excelpedidoextra_generarexcelpedidoextra": "generarExcelPedidoExtra()" | kind=code-symbol | source=utils/excelPedidoExtra.js:L18 | neighbors=[registerPedidoSugeridoIpc.js, excelPedidoExtra.js]
- "utils_excelsugeridospasteleria_generarexcelsugeridospasteleria": "generarExcelSugeridosPasteleria()" | kind=code-symbol | source=utils/excelSugeridosPasteleria.js:L16 | neighbors=[registerPedidoSugeridoIpc.js, excelSugeridosPasteleria.js]
- "ventas_anteriores_detectartamanolibra": "detectarTamanoLibra()" | kind=code-symbol | source=ventas-anteriores.js:L58 | neighbors=[ventas-anteriores.js, normalizeStr()]
- "ventas_anteriores_isotofechadia": "isoToFechaDia()" | kind=code-symbol | source=ventas-anteriores.js:L98 | neighbors=[ventas-anteriores.js, iniciarEdicionVenta()]
- "ventas_anteriores_obtenerfechaayeryyyymmdd": "obtenerFechaAyerYYYYMMDD()" | kind=code-symbol | source=ventas-anteriores.js:L89 | neighbors=[ventas-anteriores.js, guardarVenta()]
- "ventas_anteriores_obtenerstockdisponible": "obtenerStockDisponible()" | kind=code-symbol | source=ventas-anteriores.js:L106 | neighbors=[ventas-anteriores.js, agregarAlCarrito()]
- "ventas_anteriores_renderizarcatalogo": "renderizarCatalogo()" | kind=code-symbol | source=ventas-anteriores.js:L791 | neighbors=[ventas-anteriores.js, filtrarYRenderizarCatalogo()]
- "ventas_anteriores_setprocessingstate": "setProcessingState()" | kind=code-symbol | source=ventas-anteriores.js:L955 | neighbors=[ventas-anteriores.js, guardarVenta()]
- "ventas_cargarcatalogo": "cargarCatalogo()" | kind=code-symbol | source=ventas.js:L1054 | neighbors=[ventas.js, filtrarYRenderizarCatalogo()]
- "ventas_detectartamanolibra": "detectarTamanoLibra()" | kind=code-symbol | source=ventas.js:L157 | neighbors=[ventas.js, normalizeStr()]
- "ventas_escategoriapasteleria": "esCategoriaPasteleria()" | kind=code-symbol | source=ventas.js:L86 | neighbors=[ventas.js, calcularTotalItemConDescuento()]
- "ventas_formatnumberui": "formatNumberUI()" | kind=code-symbol | source=ventas.js:L67 | neighbors=[ventas.js, renderizarCarrito()]
- "ventas_imprimirticket": "imprimirTicket()" | kind=code-symbol | source=ventas.js:L324 | neighbors=[ventas.js, construirTicketHTML()]
- "ventas_redondearacentena": "redondearACentena()" | kind=code-symbol | source=ventas.js:L112 | neighbors=[ventas.js, calcularTotalItemConDescuento()]
- "ventas_renderizarcatalogo": "renderizarCatalogo()" | kind=code-symbol | source=ventas.js:L1078 | neighbors=[ventas.js, filtrarYRenderizarCatalogo()]
- "ventas_reproducirbeep": "reproducirBeep()" | kind=code-symbol | source=ventas.js:L207 | neighbors=[ventas.js, agregarAlCarrito()]
- "ventas_setprocessingstate": "setProcessingState()" | kind=code-symbol | source=ventas.js:L1310 | neighbors=[ventas.js, actualizarEstadoBotonCobrar()]
- "admin_audit_logs_cargaraccionesfiltro": "cargarAccionesFiltro()" | kind=code-symbol | source=admin-audit-logs.js:L166 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_cargarproductosparaauditoria": "cargarProductosParaAuditoria()" | kind=code-symbol | source=admin-audit-logs.js:L208 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_cargarsucursalesfiltro": "cargarSucursalesFiltro()" | kind=code-symbol | source=admin-audit-logs.js:L152 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_cargarusuariosfiltro": "cargarUsuariosFiltro()" | kind=code-symbol | source=admin-audit-logs.js:L180 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_clavediabogota": "claveDiaBogota()" | kind=code-symbol | source=admin-audit-logs.js:L271 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_escapehtml": "escapeHtml()" | kind=code-symbol | source=admin-audit-logs.js:L255 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_formateardetallesconnombreproducto": "formatearDetallesConNombreProducto()" | kind=code-symbol | source=admin-audit-logs.js:L238 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_formatearencabezadodia": "formatearEncabezadoDia()" | kind=code-symbol | source=admin-audit-logs.js:L277 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_formatearfechabogota": "formatearFechaBogota()" | kind=code-symbol | source=admin-audit-logs.js:L261 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_formatearfechasisoendetalles": "formatearFechasIsoEnDetalles()" | kind=code-symbol | source=admin-audit-logs.js:L249 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_mapaproductos": "mapaProductos" | kind=code-symbol | source=admin-audit-logs.js:L29 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_restaurarfiltrosdesdestorage": "restaurarFiltrosDesdeStorage()" | kind=code-symbol | source=admin-audit-logs.js:L51 | neighbors=[admin-audit-logs.js]
- "admin_btnclosedetallesolicitud": "btnCloseDetalleSolicitud" | kind=code-symbol | source=admin.js:L1036 | neighbors=[admin.js]
- "admin_btnclosedetallesolicitudgasto": "btnCloseDetalleSolicitudGasto" | kind=code-symbol | source=admin.js:L1184 | neighbors=[admin.js]
- "admin_btnclosesucursalbloqueada": "btnCloseSucursalBloqueada" | kind=code-symbol | source=admin.js:L593 | neighbors=[admin.js]
- "admin_cargarabonoseliminados": "cargarAbonosEliminados()" | kind=code-symbol | source=admin.js:L1202 | neighbors=[admin.js]
- "admin_cargarcategorias": "cargarCategorias()" | kind=code-symbol | source=admin.js:L645 | neighbors=[admin.js]
- "admin_cargarseccionimpresora": "cargarSeccionImpresora()" | kind=code-symbol | source=admin.js:L1246 | neighbors=[admin.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-014.json

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
