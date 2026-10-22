# Node Description Batch 11 of 25

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

- "admin_tablaitemssolicitud": "tablaItemsSolicitud()" | kind=code-symbol | source=admin.js:L952 | neighbors=[admin.js, construirDetalleSolicitudHTML()]
- "arqueo_aplicarbloqueocierredia": "aplicarBloqueoCierreDia()" | kind=code-symbol | source=arqueo.js:L209 | neighbors=[arqueo.js, cargarHistorialCierres()]
- "arqueo_eliminarcierrecaja": "eliminarCierreCaja()" | kind=code-symbol | source=arqueo.js:L280 | neighbors=[arqueo.js, refrescarHistorialTrasEdicion()]
- "dashboard_cargarproductos": "cargarProductos()" | kind=code-symbol | source=dashboard.js:L107 | neighbors=[dashboard.js, filtrarYRenderizar()]
- "dashboard_normalizestr": "normalizeStr()" | kind=code-symbol | source=dashboard.js:L47 | neighbors=[dashboard.js, filtrarYRenderizar()]
- "dashboard_renderizarproductos": "renderizarProductos()" | kind=code-symbol | source=dashboard.js:L188 | neighbors=[dashboard.js, filtrarYRenderizar()]
- "db_schema_agregarsoportelww": "agregarSoporteLWW()" | kind=code-symbol | source=db/schema.js:L28 | neighbors=[schema.js, crearTriggerUpdatedAt()]
- "db_schema_creartriggerupdatedat": "crearTriggerUpdatedAt()" | kind=code-symbol | source=db/schema.js:L16 | neighbors=[schema.js, agregarSoporteLWW()]
- "db_schema_initdb": "initDB()" | kind=code-symbol | source=db/schema.js:L41 | neighbors=[schema.js, main.js]
- "gastos_cargardescripcionesfrecuentesoperativo": "cargarDescripcionesFrecuentesOperativo()" | kind=code-symbol | source=gastos.js:L217 | neighbors=[gastos.js, cargarDatosDeSucursal()]
- "gastos_encontrarproductopornombre": "encontrarProductoPorNombre()" | kind=code-symbol | source=gastos.js:L85 | neighbors=[gastos.js, actualizarValorFila()]
- "gastos_obtenerproductosvencidos": "obtenerProductosVencidos()" | kind=code-symbol | source=gastos.js:L176 | neighbors=[gastos.js, actualizarMontoGeneral()]
- "gastos_ocultarsugerenciasdescripcion": "ocultarSugerenciasDescripcion()" | kind=code-symbol | source=gastos.js:L225 | neighbors=[gastos.js, renderizarSugerenciasDescripcion()]
- "gastos_parsenumberui": "parseNumberUI()" | kind=code-symbol | source=gastos.js:L34 | neighbors=[gastos.js, actualizarValorFila()]
- "gastos_poblarmapaproductos": "poblarMapaProductos()" | kind=code-symbol | source=gastos.js:L66 | neighbors=[gastos.js, cargarDatosDeSucursal()]
- "gastos_renderizarsugerenciasdescripcion": "renderizarSugerenciasDescripcion()" | kind=code-symbol | source=gastos.js:L230 | neighbors=[gastos.js, ocultarSugerenciasDescripcion()]
- "gestion_exportarcreditosexcel": "exportarCreditosExcel()" | kind=code-symbol | source=gestion.js:L1311 | neighbors=[gestion.js, calcularEstadoCreditos()]
- "gestion_extraerdomicilio": "extraerDomicilio()" | kind=code-symbol | source=gestion.js:L493 | neighbors=[gestion.js, parseNumberUI()]
- "gestion_parsenumberui": "parseNumberUI()" | kind=code-symbol | source=gestion.js:L485 | neighbors=[gestion.js, extraerDomicilio()]
- "gestion_poblarselectclientescredito": "poblarSelectClientesCredito()" | kind=code-symbol | source=gestion.js:L850 | neighbors=[gestion.js, cargarReporteCreditos()]
- "ipc_registerabonosipc_registerabonosipc": "registerAbonosIpc()" | kind=code-symbol | source=ipc/registerAbonosIpc.js:L7 | neighbors=[registerAbonosIpc.js, main.js]
- "ipc_registerauditoriaipc_registerauditoriaipc": "registerAuditoriaIpc()" | kind=code-symbol | source=ipc/registerAuditoriaIpc.js:L41 | neighbors=[registerAuditoriaIpc.js, main.js]
- "ipc_registercierrescajaipc_registercierrescajaipc": "registerCierresCajaIpc()" | kind=code-symbol | source=ipc/registerCierresCajaIpc.js:L7 | neighbors=[registerCierresCajaIpc.js, main.js]
- "ipc_registerclientesipc_registerclientesipc": "registerClientesIpc()" | kind=code-symbol | source=ipc/registerClientesIpc.js:L20 | neighbors=[registerClientesIpc.js, main.js]
- "ipc_registergastosipc_registergastosipc": "registerGastosIpc()" | kind=code-symbol | source=ipc/registerGastosIpc.js:L23 | neighbors=[registerGastosIpc.js, main.js]
- "ipc_registerimpresionipc_registerimpresionipc": "registerImpresionIpc()" | kind=code-symbol | source=ipc/registerImpresionIpc.js:L7 | neighbors=[registerImpresionIpc.js, main.js]
- "ipc_registerpedidosipc_registerpedidosipc": "registerPedidosIpc()" | kind=code-symbol | source=ipc/registerPedidosIpc.js:L20 | neighbors=[registerPedidosIpc.js, main.js]
- "ipc_registerpedidosugeridoipc_registerpedidosugeridoipc": "registerPedidoSugeridoIpc()" | kind=code-symbol | source=ipc/registerPedidoSugeridoIpc.js:L12 | neighbors=[registerPedidoSugeridoIpc.js, main.js]
- "ipc_registerproductosipc_registerproductosipc": "registerProductosIpc()" | kind=code-symbol | source=ipc/registerProductosIpc.js:L22 | neighbors=[registerProductosIpc.js, main.js]
- "ipc_registerreportesipc_registerreportesipc": "registerReportesIpc()" | kind=code-symbol | source=ipc/registerReportesIpc.js:L17 | neighbors=[registerReportesIpc.js, main.js]
- "ipc_registersistemaipc_registersistemaipc": "registerSistemaIpc()" | kind=code-symbol | source=ipc/registerSistemaIpc.js:L10 | neighbors=[registerSistemaIpc.js, main.js]
- "ipc_registersucursalesipc_registersucursalesipc": "registerSucursalesIpc()" | kind=code-symbol | source=ipc/registerSucursalesIpc.js:L15 | neighbors=[registerSucursalesIpc.js, main.js]
- "ipc_registertransferenciasipc_registertransferenciasipc": "registerTransferenciasIpc()" | kind=code-symbol | source=ipc/registerTransferenciasIpc.js:L10 | neighbors=[registerTransferenciasIpc.js, main.js]
- "ipc_registerusuariosipc_registerusuariosipc": "registerUsuariosIpc()" | kind=code-symbol | source=ipc/registerUsuariosIpc.js:L9 | neighbors=[registerUsuariosIpc.js, main.js]
- "ipc_registerventasipc_registerventasipc": "registerVentasIpc()" | kind=code-symbol | source=ipc/registerVentasIpc.js:L59 | neighbors=[registerVentasIpc.js, main.js]
- "pedidos_agregaralcarritopedido": "agregarAlCarritoPedido()" | kind=code-symbol | source=pedidos.js:L227 | neighbors=[pedidos.js, renderizarCarritoPedido()]
- "pedidos_agregarproductoaldetalle": "agregarProductoAlDetalle()" | kind=code-symbol | source=pedidos.js:L705 | neighbors=[pedidos.js, renderizarCarritoDetalle()]
- "pedidos_aplicarpermisosdetalle": "aplicarPermisosDetalle()" | kind=code-symbol | source=pedidos.js:L608 | neighbors=[pedidos.js, abrirDetallePedido()]
- "pedidos_badgeestado": "badgeEstado()" | kind=code-symbol | source=pedidos.js:L483 | neighbors=[pedidos.js, abrirDetallePedido()]
- "pedidos_cambiarcantidaddetalle": "cambiarCantidadDetalle()" | kind=code-symbol | source=pedidos.js:L274 | neighbors=[pedidos.js, renderizarCarritoDetalle()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-010.json

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
