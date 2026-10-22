# Node Description Batch 22 of 25

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

- "services_pedidosugeridopasteleriaservice_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=services/pedidoSugeridoPasteleriaService.js:L3 | neighbors=[pedidoSugeridoPasteleriaService.js]
- "services_pedidosugeridopasteleriaservice_solicitarsincronizacion": "{ solicitarSincronizacion }" | kind=code-symbol | source=services/pedidoSugeridoPasteleriaService.js:L4 | neighbors=[pedidoSugeridoPasteleriaService.js]
- "services_pedidosugeridopasteleriaservice_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=services/pedidoSugeridoPasteleriaService.js:L1 | neighbors=[pedidoSugeridoPasteleriaService.js]
- "services_printservice_construirticketbuffer_construirticketpedidobuffer": "{ construirTicketBuffer, construirTicketPedidoBuffer }" | kind=code-symbol | source=services/printService.js:L5 | neighbors=[printService.js]
- "services_printservice_esimpresoravirtual": "esImpresoraVirtual()" | kind=code-symbol | source=services/printService.js:L146 | neighbors=[printService.js]
- "services_printservice_execfile_execfilesync": "{ execFile, execFileSync }" | kind=code-symbol | source=services/printService.js:L1 | neighbors=[printService.js]
- "services_printservice_fs": "fs" | kind=code-symbol | source=services/printService.js:L2 | neighbors=[printService.js]
- "services_printservice_os": "os" | kind=code-symbol | source=services/printService.js:L3 | neighbors=[printService.js]
- "services_printservice_path": "path" | kind=code-symbol | source=services/printService.js:L4 | neighbors=[printService.js]
- "services_printservice_patrones_impresora_virtual": "PATRONES_IMPRESORA_VIRTUAL" | kind=code-symbol | source=services/printService.js:L142 | neighbors=[printService.js]
- "services_serverconfigservice_app": "{ app }" | kind=code-symbol | source=services/serverConfigService.js:L3 | neighbors=[serverConfigService.js]
- "services_serverconfigservice_default_config": "DEFAULT_CONFIG" | kind=code-symbol | source=services/serverConfigService.js:L5 | neighbors=[serverConfigService.js]
- "services_serverconfigservice_fs": "fs" | kind=code-symbol | source=services/serverConfigService.js:L1 | neighbors=[serverConfigService.js]
- "services_serverconfigservice_path": "path" | kind=code-symbol | source=services/serverConfigService.js:L2 | neighbors=[serverConfigService.js]
- "services_ticketescpos_align_center": "ALIGN_CENTER" | kind=code-symbol | source=services/ticketEscPos.js:L18 | neighbors=[ticketEscPos.js]
- "services_ticketescpos_align_left": "ALIGN_LEFT" | kind=code-symbol | source=services/ticketEscPos.js:L17 | neighbors=[ticketEscPos.js]
- "services_ticketescpos_align_right": "ALIGN_RIGHT" | kind=code-symbol | source=services/ticketEscPos.js:L19 | neighbors=[ticketEscPos.js]
- "services_ticketescpos_bold_off": "BOLD_OFF" | kind=code-symbol | source=services/ticketEscPos.js:L12 | neighbors=[ticketEscPos.js]
- "services_ticketescpos_bold_on": "BOLD_ON" | kind=code-symbol | source=services/ticketEscPos.js:L11 | neighbors=[ticketEscPos.js]
- "services_ticketescpos_corte_parcial": "CORTE_PARCIAL" | kind=code-symbol | source=services/ticketEscPos.js:L20 | neighbors=[ticketEscPos.js]
- "services_ticketescpos_init": "INIT" | kind=code-symbol | source=services/ticketEscPos.js:L10 | neighbors=[ticketEscPos.js]
- "services_ticketescpos_separador": "separador()" | kind=code-symbol | source=services/ticketEscPos.js:L39 | neighbors=[ticketEscPos.js]
- "services_ventaservice_browserwindow": "{ BrowserWindow }" | kind=code-symbol | source=services/ventaService.js:L1 | neighbors=[ventaService.js]
- "services_ventaservice_db_runquery_allquery": "{ db, runQuery, allQuery }" | kind=code-symbol | source=services/ventaService.js:L3 | neighbors=[ventaService.js]
- "services_ventaservice_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=services/ventaService.js:L4 | neighbors=[ventaService.js]
- "services_ventaservice_registrarmovimientoinventario": "{ registrarMovimientoInventario }" | kind=code-symbol | source=services/ventaService.js:L5 | neighbors=[ventaService.js]
- "services_ventaservice_solicitarsincronizacion": "{ solicitarSincronizacion }" | kind=code-symbol | source=services/ventaService.js:L6 | neighbors=[ventaService.js]
- "services_ventaservice_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=services/ventaService.js:L2 | neighbors=[ventaService.js]
- "sidebar_mostrartransferenciaentrante": "mostrarTransferenciaEntrante()" | kind=code-symbol | source=sidebar.js:L817 | neighbors=[sidebar.js]
- "sync_conciliar_saldo_apertura_aplicar": "aplicar" | kind=code-symbol | source=sync/conciliar_saldo_apertura.js:L45 | neighbors=[conciliar_saldo_apertura.js]
- "sync_conciliar_saldo_apertura_args": "args" | kind=code-symbol | source=sync/conciliar_saldo_apertura.js:L42 | neighbors=[conciliar_saldo_apertura.js]
- "sync_conciliar_saldo_apertura_cliente": "cliente" | kind=code-symbol | source=sync/conciliar_saldo_apertura.js:L54 | neighbors=[conciliar_saldo_apertura.js]
- "sync_conciliar_saldo_apertura_createclient": "{ createClient }" | kind=code-symbol | source=sync/conciliar_saldo_apertura.js:L30 | neighbors=[conciliar_saldo_apertura.js]
- "sync_conciliar_saldo_apertura_prod": "PROD" | kind=code-symbol | source=sync/conciliar_saldo_apertura.js:L33 | neighbors=[conciliar_saldo_apertura.js]
- "sync_conciliar_saldo_apertura_test": "TEST" | kind=code-symbol | source=sync/conciliar_saldo_apertura.js:L37 | neighbors=[conciliar_saldo_apertura.js]
- "sync_conciliar_saldo_apertura_usarprod": "usarProd" | kind=code-symbol | source=sync/conciliar_saldo_apertura.js:L43 | neighbors=[conciliar_saldo_apertura.js]
- "sync_conciliar_saldo_apertura_usartest": "usarTest" | kind=code-symbol | source=sync/conciliar_saldo_apertura.js:L44 | neighbors=[conciliar_saldo_apertura.js]
- "sync_conciliar_saldo_apertura_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=sync/conciliar_saldo_apertura.js:L31 | neighbors=[conciliar_saldo_apertura.js]
- "sync_diagnostico_stock_vs_kardex_args": "args" | kind=code-symbol | source=sync/diagnostico_stock_vs_kardex.js:L42 | neighbors=[diagnostico_stock_vs_kardex.js]
- "sync_diagnostico_stock_vs_kardex_cliente": "cliente" | kind=code-symbol | source=sync/diagnostico_stock_vs_kardex.js:L53 | neighbors=[diagnostico_stock_vs_kardex.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-021.json

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
