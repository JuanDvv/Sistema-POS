# Node Description Batch 20 of 25

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

- "main_registercierrescajaipc": "{ registerCierresCajaIpc }" | kind=code-symbol | source=main.js:L21 | neighbors=[main.js]
- "main_registerclientesipc": "{ registerClientesIpc }" | kind=code-symbol | source=main.js:L15 | neighbors=[main.js]
- "main_registergastosipc": "{ registerGastosIpc }" | kind=code-symbol | source=main.js:L11 | neighbors=[main.js]
- "main_registerimpresionipc": "{ registerImpresionIpc }" | kind=code-symbol | source=main.js:L19 | neighbors=[main.js]
- "main_registerpedidosipc": "{ registerPedidosIpc }" | kind=code-symbol | source=main.js:L20 | neighbors=[main.js]
- "main_registerpedidosugeridoipc": "{ registerPedidoSugeridoIpc }" | kind=code-symbol | source=main.js:L23 | neighbors=[main.js]
- "main_registerproductosipc": "{ registerProductosIpc }" | kind=code-symbol | source=main.js:L10 | neighbors=[main.js]
- "main_registerreportesipc": "{ registerReportesIpc }" | kind=code-symbol | source=main.js:L16 | neighbors=[main.js]
- "main_registersistemaipc": "{ registerSistemaIpc }" | kind=code-symbol | source=main.js:L17 | neighbors=[main.js]
- "main_registersucursalesipc": "{ registerSucursalesIpc }" | kind=code-symbol | source=main.js:L13 | neighbors=[main.js]
- "main_registertransferenciasipc": "{ registerTransferenciasIpc }" | kind=code-symbol | source=main.js:L12 | neighbors=[main.js]
- "main_registerusuariosipc": "{ registerUsuariosIpc }" | kind=code-symbol | source=main.js:L14 | neighbors=[main.js]
- "main_registerventasipc": "{ registerVentasIpc }" | kind=code-symbol | source=main.js:L9 | neighbors=[main.js]
- "pedidos_carrito": "carrito" | kind=code-symbol | source=pedidos.js:L31 | neighbors=[pedidos.js]
- "pedidos_carritodetalle": "carritoDetalle" | kind=code-symbol | source=pedidos.js:L32 | neighbors=[pedidos.js]
- "pedidos_categoriascargadas": "categoriasCargadas" | kind=code-symbol | source=pedidos.js:L27 | neighbors=[pedidos.js]
- "pedidos_clavegrupoentrega": "claveGrupoEntrega()" | kind=code-symbol | source=pedidos.js:L513 | neighbors=[pedidos.js]
- "pedidos_clientescargados": "clientesCargados" | kind=code-symbol | source=pedidos.js:L29 | neighbors=[pedidos.js]
- "pedidos_configurardomicilioui": "configurarDomicilioUI()" | kind=code-symbol | source=pedidos.js:L185 | neighbors=[pedidos.js]
- "pedidos_construirticketdesdedetalleactual": "construirTicketDesdeDetalleActual()" | kind=code-symbol | source=pedidos.js:L815 | neighbors=[pedidos.js]
- "pedidos_esfechadehoy": "esFechaDeHoy()" | kind=code-symbol | source=pedidos.js:L569 | neighbors=[pedidos.js]
- "pedidos_formatfechagrupo": "formatFechaGrupo()" | kind=code-symbol | source=pedidos.js:L504 | neighbors=[pedidos.js]
- "pedidos_formatfechahoracelda": "formatFechaHoraCelda()" | kind=code-symbol | source=pedidos.js:L100 | neighbors=[pedidos.js]
- "pedidos_imprimircomprobantepedido": "imprimirComprobantePedido()" | kind=code-symbol | source=pedidos.js:L810 | neighbors=[pedidos.js]
- "pedidos_manejarseleccionclienteautocompletar": "manejarSeleccionClienteAutocompletar()" | kind=code-symbol | source=pedidos.js:L369 | neighbors=[pedidos.js]
- "pedidos_mapaclientesporetiqueta": "mapaClientesPorEtiqueta" | kind=code-symbol | source=pedidos.js:L30 | neighbors=[pedidos.js]
- "pedidos_productoslocales": "productosLocales" | kind=code-symbol | source=pedidos.js:L26 | neighbors=[pedidos.js]
- "preload_contextbridge_ipcrenderer_webutils": "{ contextBridge, ipcRenderer, webUtils }" | kind=code-symbol | source=preload.js:L1 | neighbors=[preload.js]
- "productobuscador_crearbuscadorproducto": "crearBuscadorProducto()" | kind=code-symbol | source=productoBuscador.js:L18 | neighbors=[productoBuscador.js]
- "reportes_cargarcatalogoedicionventa": "cargarCatalogoEdicionVenta()" | kind=code-symbol | source=reportes.js:L1899 | neighbors=[reportes.js]
- "reportes_catalogoproductosedicion": "catalogoProductosEdicion" | kind=code-symbol | source=reportes.js:L106 | neighbors=[reportes.js]
- "reportes_catalogoproductosediciontrans": "catalogoProductosEdicionTrans" | kind=code-symbol | source=reportes.js:L2018 | neighbors=[reportes.js]
- "reportes_datosreporteglobal": "datosReporteGlobal" | kind=code-symbol | source=reportes.js:L27 | neighbors=[reportes.js]
- "reportes_devolucionescache": "devolucionesCache" | kind=code-symbol | source=reportes.js:L1758 | neighbors=[reportes.js]
- "reportes_editingtranscarrito": "editingTransCarrito" | kind=code-symbol | source=reportes.js:L2017 | neighbors=[reportes.js]
- "reportes_editingventacarrito": "editingVentaCarrito" | kind=code-symbol | source=reportes.js:L103 | neighbors=[reportes.js]
- "reportes_formatnumberui": "formatNumberUI()" | kind=code-symbol | source=reportes.js:L130 | neighbors=[reportes.js]
- "reportes_getmetodopagogrupo": "getMetodoPagoGrupo()" | kind=code-symbol | source=reportes.js:L110 | neighbors=[reportes.js]
- "reportes_renderizaritemsediciontransferencia": "renderizarItemsEdicionTransferencia()" | kind=code-symbol | source=reportes.js:L2097 | neighbors=[reportes.js]
- "services_abonorecoveryservice_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=services/abonoRecoveryService.js:L3 | neighbors=[abonoRecoveryService.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-019.json

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
