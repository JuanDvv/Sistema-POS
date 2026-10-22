# Node Description Batch 21 of 25

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

- "services_abonorecoveryservice_runquery_allquery": "{ runQuery, allQuery }" | kind=code-symbol | source=services/abonoRecoveryService.js:L1 | neighbors=[abonoRecoveryService.js]
- "services_abonorecoveryservice_supabase": "{ supabase }" | kind=code-symbol | source=services/abonoRecoveryService.js:L2 | neighbors=[abonoRecoveryService.js]
- "services_auditservice_runquery": "{ runQuery }" | kind=code-symbol | source=services/auditService.js:L2 | neighbors=[auditService.js]
- "services_auditservice_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=services/auditService.js:L1 | neighbors=[auditService.js]
- "services_cierrecajaservice_obtenerfechahoyyyyymmdd": "{ obtenerFechaHoyYYYYMMDD }" | kind=code-symbol | source=services/cierreCajaService.js:L5 | neighbors=[cierreCajaService.js]
- "services_cierrecajaservice_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=services/cierreCajaService.js:L3 | neighbors=[cierreCajaService.js]
- "services_cierrecajaservice_runquery_allquery": "{ runQuery, allQuery }" | kind=code-symbol | source=services/cierreCajaService.js:L2 | neighbors=[cierreCajaService.js]
- "services_cierrecajaservice_solicitarsincronizacion": "{ solicitarSincronizacion }" | kind=code-symbol | source=services/cierreCajaService.js:L4 | neighbors=[cierreCajaService.js]
- "services_cierrecajaservice_tipos_cierre_caja": "{ TIPOS_CIERRE_CAJA }" | kind=code-symbol | source=services/cierreCajaService.js:L6 | neighbors=[cierreCajaService.js]
- "services_cierrecajaservice_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=services/cierreCajaService.js:L1 | neighbors=[cierreCajaService.js]
- "services_gastoservice_browserwindow": "{ BrowserWindow }" | kind=code-symbol | source=services/gastoService.js:L1 | neighbors=[gastoService.js]
- "services_gastoservice_db_runquery": "{ db, runQuery }" | kind=code-symbol | source=services/gastoService.js:L3 | neighbors=[gastoService.js]
- "services_gastoservice_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=services/gastoService.js:L4 | neighbors=[gastoService.js]
- "services_gastoservice_registrarmovimientoinventario": "{ registrarMovimientoInventario }" | kind=code-symbol | source=services/gastoService.js:L5 | neighbors=[gastoService.js]
- "services_gastoservice_solicitarsincronizacion": "{ solicitarSincronizacion }" | kind=code-symbol | source=services/gastoService.js:L6 | neighbors=[gastoService.js]
- "services_gastoservice_tipos_gasto_estados_devolucion_requiereajusteinventario": "{ TIPOS_GASTO, ESTADOS_DEVOLUCION, requiereAjusteInventario }" | kind=code-symbol | source=services/gastoService.js:L7 | neighbors=[gastoService.js]
- "services_gastoservice_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=services/gastoService.js:L2 | neighbors=[gastoService.js]
- "services_imagenservice_app": "{ app }" | kind=code-symbol | source=services/imagenService.js:L1 | neighbors=[imagenService.js]
- "services_imagenservice_fs": "fs" | kind=code-symbol | source=services/imagenService.js:L3 | neighbors=[imagenService.js]
- "services_imagenservice_path": "path" | kind=code-symbol | source=services/imagenService.js:L2 | neighbors=[imagenService.js]
- "services_inventariomovimientoservice_runquery": "{ runQuery }" | kind=code-symbol | source=services/inventarioMovimientoService.js:L2 | neighbors=[inventarioMovimientoService.js]
- "services_inventariomovimientoservice_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=services/inventarioMovimientoService.js:L1 | neighbors=[inventarioMovimientoService.js]
- "services_pdfhelpers_centenas": "CENTENAS" | kind=code-symbol | source=services/pdfHelpers.js:L23 | neighbors=[pdfHelpers.js]
- "services_pdfhelpers_decenas": "DECENAS" | kind=code-symbol | source=services/pdfHelpers.js:L22 | neighbors=[pdfHelpers.js]
- "services_pdfhelpers_emisor": "EMISOR" | kind=code-symbol | source=services/pdfHelpers.js:L79 | neighbors=[pdfHelpers.js]
- "services_pdfhelpers_especiales": "ESPECIALES" | kind=code-symbol | source=services/pdfHelpers.js:L21 | neighbors=[pdfHelpers.js]
- "services_pdfhelpers_formatearfechacorta": "formatearFechaCorta()" | kind=code-symbol | source=services/pdfHelpers.js:L94 | neighbors=[pdfHelpers.js]
- "services_pdfhelpers_unidades": "UNIDADES" | kind=code-symbol | source=services/pdfHelpers.js:L20 | neighbors=[pdfHelpers.js]
- "services_pedidoservice_browserwindow": "{ BrowserWindow }" | kind=code-symbol | source=services/pedidoService.js:L1 | neighbors=[pedidoService.js]
- "services_pedidoservice_db_runquery_allquery": "{ db, runQuery, allQuery }" | kind=code-symbol | source=services/pedidoService.js:L3 | neighbors=[pedidoService.js]
- "services_pedidoservice_obtenerfechahoyyyyymmdd": "{ obtenerFechaHoyYYYYMMDD }" | kind=code-symbol | source=services/pedidoService.js:L7 | neighbors=[pedidoService.js]
- "services_pedidoservice_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=services/pedidoService.js:L4 | neighbors=[pedidoService.js]
- "services_pedidoservice_registrarmovimientoinventario_registrarmovimientoreserva": "{ registrarMovimientoInventario, registrarMovimientoReserva }" | kind=code-symbol | source=services/pedidoService.js:L5 | neighbors=[pedidoService.js]
- "services_pedidoservice_solicitarsincronizacion": "{ solicitarSincronizacion }" | kind=code-symbol | source=services/pedidoService.js:L6 | neighbors=[pedidoService.js]
- "services_pedidoservice_sqlfechadia": "sqlFechaDia()" | kind=code-symbol | source=services/pedidoService.js:L14 | neighbors=[pedidoService.js]
- "services_pedidoservice_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=services/pedidoService.js:L2 | neighbors=[pedidoService.js]
- "services_pedidosugeridopasteleriaservice_columna_sugerido_por_dia": "COLUMNA_SUGERIDO_POR_DIA" | kind=code-symbol | source=services/pedidoSugeridoPasteleriaService.js:L23 | neighbors=[pedidoSugeridoPasteleriaService.js]
- "services_pedidosugeridopasteleriaservice_db_runquery_allquery": "{ db, runQuery, allQuery }" | kind=code-symbol | source=services/pedidoSugeridoPasteleriaService.js:L2 | neighbors=[pedidoSugeridoPasteleriaService.js]
- "services_pedidosugeridopasteleriaservice_dias_entrega": "DIAS_ENTREGA" | kind=code-symbol | source=services/pedidoSugeridoPasteleriaService.js:L22 | neighbors=[pedidoSugeridoPasteleriaService.js]
- "services_pedidosugeridopasteleriaservice_normalizestrserv": "normalizeStrServ()" | kind=code-symbol | source=services/pedidoSugeridoPasteleriaService.js:L11 | neighbors=[pedidoSugeridoPasteleriaService.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-020.json

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
