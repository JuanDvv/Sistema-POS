# Node Description Batch 22 of 24

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

- "sync_diagnostico_sync_seq_test": "TEST" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L28 | neighbors=[diagnostico_sync_seq.js]
- "sync_diagnostico_sync_seq_usarprod": "usarProd" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L41 | neighbors=[diagnostico_sync_seq.js]
- "sync_diagnostico_sync_seq_usartest": "usarTest" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L42 | neighbors=[diagnostico_sync_seq.js]
- "sync_import_old_data_fs": "fs" | kind=code-symbol | source=sync/import_old_data.js:L1 | neighbors=[import_old_data.js]
- "sync_import_old_data_newdb": "newDb" | kind=code-symbol | source=sync/import_old_data.js:L25 | neighbors=[import_old_data.js]
- "sync_import_old_data_newdbpath": "newDbPath" | kind=code-symbol | source=sync/import_old_data.js:L14 | neighbors=[import_old_data.js]
- "sync_import_old_data_olddb": "oldDb" | kind=code-symbol | source=sync/import_old_data.js:L24 | neighbors=[import_old_data.js]
- "sync_import_old_data_olddbpath": "oldDbPath" | kind=code-symbol | source=sync/import_old_data.js:L13 | neighbors=[import_old_data.js]
- "sync_import_old_data_path": "path" | kind=code-symbol | source=sync/import_old_data.js:L2 | neighbors=[import_old_data.js]
- "sync_import_old_data_sqlite3": "sqlite3" | kind=code-symbol | source=sync/import_old_data.js:L3 | neighbors=[import_old_data.js]
- "sync_import_old_data_userdatapath": "userDataPath" | kind=code-symbol | source=sync/import_old_data.js:L8 | neighbors=[import_old_data.js]
- "sync_migrate_auditoria_busqueda_insensible_public_buscar_auditoria": "public.buscar_auditoria()" | kind=code-symbol | source=sync/migrate_auditoria_busqueda_insensible.sql:L36 | neighbors=[migrate_auditoria_busqueda_insensible.s…]
- "sync_migrate_monto_recibido_venta": "migrate_monto_recibido_venta.sql" | kind=code-symbol | source=sync/migrate_monto_recibido_venta.sql:L1 | neighbors=[bfa73bf Add pastelería sugeridos, gasto…]
- "sync_migrate_pedidos_domicilio": "migrate_pedidos_domicilio.sql" | kind=code-symbol | source=sync/migrate_pedidos_domicilio.sql:L1 | neighbors=[bfa73bf Add pastelería sugeridos, gasto…]
- "sync_migrate_stock_delta_sync_public_lww_guard": "public.lww_guard()" | kind=code-symbol | source=sync/migrate_stock_delta_sync.sql:L29 | neighbors=[migrate_stock_delta_sync.sql]
- "sync_remotedbclient_obtenerconfigservidor": "{ obtenerConfigServidor }" | kind=code-symbol | source=sync/remoteDbClient.js:L1 | neighbors=[remoteDbClient.js]
- "sync_remotedbclient_querybuilder_constructor": ".constructor()" | kind=code-symbol | source=sync/remoteDbClient.js:L78 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_delete": ".delete()" | kind=code-symbol | source=sync/remoteDbClient.js:L219 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_eq": ".eq()" | kind=code-symbol | source=sync/remoteDbClient.js:L120 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_gt": ".gt()" | kind=code-symbol | source=sync/remoteDbClient.js:L132 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_gte": ".gte()" | kind=code-symbol | source=sync/remoteDbClient.js:L138 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_in": ".in()" | kind=code-symbol | source=sync/remoteDbClient.js:L166 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_insert": ".insert()" | kind=code-symbol | source=sync/remoteDbClient.js:L200 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_is": ".is()" | kind=code-symbol | source=sync/remoteDbClient.js:L156 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_limit": ".limit()" | kind=code-symbol | source=sync/remoteDbClient.js:L110 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_lt": ".lt()" | kind=code-symbol | source=sync/remoteDbClient.js:L144 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_lte": ".lte()" | kind=code-symbol | source=sync/remoteDbClient.js:L150 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_maybesingle": ".maybeSingle()" | kind=code-symbol | source=sync/remoteDbClient.js:L195 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_neq": ".neq()" | kind=code-symbol | source=sync/remoteDbClient.js:L126 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_not": ".not()" | kind=code-symbol | source=sync/remoteDbClient.js:L180 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_order": ".order()" | kind=code-symbol | source=sync/remoteDbClient.js:L115 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_range": ".range()" | kind=code-symbol | source=sync/remoteDbClient.js:L104 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_select": ".select()" | kind=code-symbol | source=sync/remoteDbClient.js:L94 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_single": ".single()" | kind=code-symbol | source=sync/remoteDbClient.js:L190 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_update": ".update()" | kind=code-symbol | source=sync/remoteDbClient.js:L213 | neighbors=[QueryBuilder]
- "sync_remotedbclient_querybuilder_upsert": ".upsert()" | kind=code-symbol | source=sync/remoteDbClient.js:L206 | neighbors=[QueryBuilder]
- "sync_reset_and_seed_test_createclient": "{ createClient }" | kind=code-symbol | source=sync/reset_and_seed_test.js:L19 | neighbors=[reset_and_seed_test.js]
- "sync_reset_and_seed_test_execfilesync": "{ execFileSync }" | kind=code-symbol | source=sync/reset_and_seed_test.js:L20 | neighbors=[reset_and_seed_test.js]
- "sync_reset_and_seed_test_fs": "fs" | kind=code-symbol | source=sync/reset_and_seed_test.js:L21 | neighbors=[reset_and_seed_test.js]
- "sync_reset_and_seed_test_path": "path" | kind=code-symbol | source=sync/reset_and_seed_test.js:L22 | neighbors=[reset_and_seed_test.js]

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
