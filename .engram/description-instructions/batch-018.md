# Node Description Batch 19 of 24

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

- "pedidos_clavegrupoentrega": "claveGrupoEntrega()" | kind=code-symbol | source=pedidos.js:L477 | neighbors=[pedidos.js]
- "pedidos_clientescargados": "clientesCargados" | kind=code-symbol | source=pedidos.js:L11 | neighbors=[pedidos.js]
- "pedidos_construirticketdesdedetalleactual": "construirTicketDesdeDetalleActual()" | kind=code-symbol | source=pedidos.js:L774 | neighbors=[pedidos.js]
- "pedidos_esfechadehoy": "esFechaDeHoy()" | kind=code-symbol | source=pedidos.js:L533 | neighbors=[pedidos.js]
- "pedidos_formatfechagrupo": "formatFechaGrupo()" | kind=code-symbol | source=pedidos.js:L468 | neighbors=[pedidos.js]
- "pedidos_formatfechahoracelda": "formatFechaHoraCelda()" | kind=code-symbol | source=pedidos.js:L115 | neighbors=[pedidos.js]
- "pedidos_formatnumberui": "formatNumberUI()" | kind=code-symbol | source=pedidos.js:L29 | neighbors=[pedidos.js]
- "pedidos_imprimircomprobantepedido": "imprimirComprobantePedido()" | kind=code-symbol | source=pedidos.js:L769 | neighbors=[pedidos.js]
- "pedidos_manejarseleccionclienteautocompletar": "manejarSeleccionClienteAutocompletar()" | kind=code-symbol | source=pedidos.js:L338 | neighbors=[pedidos.js]
- "pedidos_mapaclientesporetiqueta": "mapaClientesPorEtiqueta" | kind=code-symbol | source=pedidos.js:L12 | neighbors=[pedidos.js]
- "pedidos_productoslocales": "productosLocales" | kind=code-symbol | source=pedidos.js:L8 | neighbors=[pedidos.js]
- "pedidos_tallas_ropa": "TALLAS_ROPA" | kind=code-symbol | source=pedidos.js:L44 | neighbors=[pedidos.js]
- "preload_contextbridge_ipcrenderer_webutils": "{ contextBridge, ipcRenderer, webUtils }" | kind=code-symbol | source=preload.js:L1 | neighbors=[preload.js]
- "productobuscador_crearbuscadorproducto": "crearBuscadorProducto()" | kind=code-symbol | source=productoBuscador.js:L18 | neighbors=[productoBuscador.js]
- "reportes_cargarcatalogoedicionventa": "cargarCatalogoEdicionVenta()" | kind=code-symbol | source=reportes.js:L1485 | neighbors=[reportes.js]
- "reportes_catalogoproductosedicion": "catalogoProductosEdicion" | kind=code-symbol | source=reportes.js:L30 | neighbors=[reportes.js]
- "reportes_datosreporteglobal": "datosReporteGlobal" | kind=code-symbol | source=reportes.js:L9 | neighbors=[reportes.js]
- "reportes_devolucionescache": "devolucionesCache" | kind=code-symbol | source=reportes.js:L1350 | neighbors=[reportes.js]
- "reportes_editingventacarrito": "editingVentaCarrito" | kind=code-symbol | source=reportes.js:L27 | neighbors=[reportes.js]
- "reportes_formatnumberui": "formatNumberUI()" | kind=code-symbol | source=reportes.js:L53 | neighbors=[reportes.js]
- "reportes_getmetodopagogrupo": "getMetodoPagoGrupo()" | kind=code-symbol | source=reportes.js:L33 | neighbors=[reportes.js]
- "reportes_normalizestr": "normalizeStr()" | kind=code-symbol | source=reportes.js:L11 | neighbors=[reportes.js]
- "reportes_parsenumberui": "parseNumberUI()" | kind=code-symbol | source=reportes.js:L58 | neighbors=[reportes.js]
- "scripts_seed_apliques_categoria": "CATEGORIA" | kind=code-symbol | source=scripts/seed_apliques.js:L16 | neighbors=[seed_apliques.sql]
- "scripts_seed_apliques_fs": "fs" | kind=code-symbol | source=scripts/seed_apliques.js:L13 | neighbors=[seed_apliques.sql]
- "scripts_seed_apliques_path": "path" | kind=code-symbol | source=scripts/seed_apliques.js:L14 | neighbors=[seed_apliques.sql]
- "scripts_seed_apliques_sqlite3": "sqlite3" | kind=code-symbol | source=scripts/seed_apliques.js:L12 | neighbors=[seed_apliques.sql]
- "scripts_seed_camisetas_categorias": "CATEGORIAS" | kind=code-symbol | source=scripts/seed_camisetas.js:L15 | neighbors=[seed_camisetas.sql]
- "scripts_seed_camisetas_colores": "COLORES" | kind=code-symbol | source=scripts/seed_camisetas.js:L50 | neighbors=[seed_camisetas.sql]
- "scripts_seed_camisetas_fs": "fs" | kind=code-symbol | source=scripts/seed_camisetas.js:L12 | neighbors=[seed_camisetas.sql]
- "scripts_seed_camisetas_grupos": "GRUPOS" | kind=code-symbol | source=scripts/seed_camisetas.js:L23 | neighbors=[seed_camisetas.sql]
- "scripts_seed_camisetas_path": "path" | kind=code-symbol | source=scripts/seed_camisetas.js:L13 | neighbors=[seed_camisetas.sql]
- "scripts_seed_camisetas_sqlite3": "sqlite3" | kind=code-symbol | source=scripts/seed_camisetas.js:L11 | neighbors=[seed_camisetas.sql]
- "scripts_seed_camisetas_viscosas_categorias": "CATEGORIAS" | kind=code-symbol | source=scripts/seed_camisetas_viscosas.js:L16 | neighbors=[seed_camisetas_viscosas.sql]
- "scripts_seed_camisetas_viscosas_fs": "fs" | kind=code-symbol | source=scripts/seed_camisetas_viscosas.js:L13 | neighbors=[seed_camisetas_viscosas.sql]
- "scripts_seed_camisetas_viscosas_grupos": "GRUPOS" | kind=code-symbol | source=scripts/seed_camisetas_viscosas.js:L24 | neighbors=[seed_camisetas_viscosas.sql]
- "scripts_seed_camisetas_viscosas_path": "path" | kind=code-symbol | source=scripts/seed_camisetas_viscosas.js:L14 | neighbors=[seed_camisetas_viscosas.sql]
- "scripts_seed_camisetas_viscosas_sqlite3": "sqlite3" | kind=code-symbol | source=scripts/seed_camisetas_viscosas.js:L12 | neighbors=[seed_camisetas_viscosas.sql]
- "services_abonorecoveryservice_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=services/abonoRecoveryService.js:L3 | neighbors=[abonoRecoveryService.js]
- "services_abonorecoveryservice_runquery_allquery": "{ runQuery, allQuery }" | kind=code-symbol | source=services/abonoRecoveryService.js:L1 | neighbors=[abonoRecoveryService.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-018.json

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
