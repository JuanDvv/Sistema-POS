# Node Description Batch 23 of 25

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

- "sync_diagnostico_stock_vs_kardex_createclient": "{ createClient }" | kind=code-symbol | source=sync/diagnostico_stock_vs_kardex.js:L31 | neighbors=[diagnostico_stock_vs_kardex.js]
- "sync_diagnostico_stock_vs_kardex_prod": "PROD" | kind=code-symbol | source=sync/diagnostico_stock_vs_kardex.js:L33 | neighbors=[diagnostico_stock_vs_kardex.js]
- "sync_diagnostico_stock_vs_kardex_test": "TEST" | kind=code-symbol | source=sync/diagnostico_stock_vs_kardex.js:L37 | neighbors=[diagnostico_stock_vs_kardex.js]
- "sync_diagnostico_stock_vs_kardex_usarprod": "usarProd" | kind=code-symbol | source=sync/diagnostico_stock_vs_kardex.js:L43 | neighbors=[diagnostico_stock_vs_kardex.js]
- "sync_diagnostico_stock_vs_kardex_usartest": "usarTest" | kind=code-symbol | source=sync/diagnostico_stock_vs_kardex.js:L44 | neighbors=[diagnostico_stock_vs_kardex.js]
- "sync_diagnostico_sync_seq_args": "args" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L40 | neighbors=[diagnostico_sync_seq.js]
- "sync_diagnostico_sync_seq_cliente": "cliente" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L51 | neighbors=[diagnostico_sync_seq.js]
- "sync_diagnostico_sync_seq_createclient": "{ createClient }" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L22 | neighbors=[diagnostico_sync_seq.js]
- "sync_diagnostico_sync_seq_prod": "PROD" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L24 | neighbors=[diagnostico_sync_seq.js]
- "sync_diagnostico_sync_seq_tablas": "TABLAS" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L33 | neighbors=[diagnostico_sync_seq.js]
- "sync_diagnostico_sync_seq_test": "TEST" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L28 | neighbors=[diagnostico_sync_seq.js]
- "sync_diagnostico_sync_seq_usarprod": "usarProd" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L41 | neighbors=[diagnostico_sync_seq.js]
- "sync_diagnostico_sync_seq_usartest": "usarTest" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L42 | neighbors=[diagnostico_sync_seq.js]
- "sync_migrate_auditoria_busqueda_insensible_public_buscar_auditoria": "public.buscar_auditoria()" | kind=code-symbol | source=sync/migrate_auditoria_busqueda_insensible.sql:L36 | neighbors=[migrate_auditoria_busqueda_insensible.s…]
- "sync_migrate_clientes_categoria": "migrate_clientes_categoria.sql" | kind=code-symbol | source=sync/migrate_clientes_categoria.sql:L1 | neighbors=[22e246f Add fiscal client and credit tr…]
- "sync_migrate_monto_recibido_venta": "migrate_monto_recibido_venta.sql" | kind=code-symbol | source=sync/migrate_monto_recibido_venta.sql:L1 | neighbors=[bfa73bf Add pastelería sugeridos, gasto…]
- "sync_migrate_pedidos_domicilio": "migrate_pedidos_domicilio.sql" | kind=code-symbol | source=sync/migrate_pedidos_domicilio.sql:L1 | neighbors=[bfa73bf Add pastelería sugeridos, gasto…]
- "sync_migrate_stock_delta_sync_public_lww_guard": "public.lww_guard()" | kind=code-symbol | source=sync/migrate_stock_delta_sync.sql:L29 | neighbors=[migrate_stock_delta_sync.sql]
- "sync_remotedbclient_obtenerconfigservidor": "{ obtenerConfigServidor }" | kind=code-symbol | source=sync/remoteDbClient.js:L1 | neighbors=[remoteDbClient.js]
- "sync_remotedbclient_querybuilder_constructor": ".constructor()" | kind=code-symbol | source=sync/remoteDbClient.js:L83 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_delete": ".delete()" | kind=code-symbol | source=sync/remoteDbClient.js:L218 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_eq": ".eq()" | kind=code-symbol | source=sync/remoteDbClient.js:L125 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_gt": ".gt()" | kind=code-symbol | source=sync/remoteDbClient.js:L137 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_gte": ".gte()" | kind=code-symbol | source=sync/remoteDbClient.js:L143 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_in": ".in()" | kind=code-symbol | source=sync/remoteDbClient.js:L171 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_is": ".is()" | kind=code-symbol | source=sync/remoteDbClient.js:L161 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_limit": ".limit()" | kind=code-symbol | source=sync/remoteDbClient.js:L115 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_lt": ".lt()" | kind=code-symbol | source=sync/remoteDbClient.js:L149 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_lte": ".lte()" | kind=code-symbol | source=sync/remoteDbClient.js:L155 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_maybesingle": ".maybeSingle()" | kind=code-symbol | source=sync/remoteDbClient.js:L200 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_neq": ".neq()" | kind=code-symbol | source=sync/remoteDbClient.js:L131 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_not": ".not()" | kind=code-symbol | source=sync/remoteDbClient.js:L185 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_order": ".order()" | kind=code-symbol | source=sync/remoteDbClient.js:L120 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_range": ".range()" | kind=code-symbol | source=sync/remoteDbClient.js:L109 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_select": ".select()" | kind=code-symbol | source=sync/remoteDbClient.js:L99 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_single": ".single()" | kind=code-symbol | source=sync/remoteDbClient.js:L195 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_update": ".update()" | kind=code-symbol | source=sync/remoteDbClient.js:L212 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_upsert": ".upsert()" | kind=code-symbol | source=sync/remoteDbClient.js:L205 | neighbors=[QueryBuilder]
- "sync_repararfechassqlite_db": "db" | kind=code-symbol | source=sync/repararFechasSQLite.js:L14 | neighbors=[repararFechasSQLite.js]
- "sync_repararfechassqlite_dbpath": "dbPath" | kind=code-symbol | source=sync/repararFechasSQLite.js:L6 | neighbors=[repararFechasSQLite.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-022.json

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
