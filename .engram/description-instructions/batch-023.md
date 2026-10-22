# Node Description Batch 24 of 25

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

- "sync_repararfechassqlite_fs": "fs" | kind=code-symbol | source=sync/repararFechasSQLite.js:L3 | neighbors=[repararFechasSQLite.js]
- "sync_repararfechassqlite_path": "path" | kind=code-symbol | source=sync/repararFechasSQLite.js:L1 | neighbors=[repararFechasSQLite.js]
- "sync_repararfechassqlite_reparartabla": "repararTabla()" | kind=code-symbol | source=sync/repararFechasSQLite.js:L16 | neighbors=[repararFechasSQLite.js]
- "sync_repararfechassqlite_sqlite3": "sqlite3" | kind=code-symbol | source=sync/repararFechasSQLite.js:L2 | neighbors=[repararFechasSQLite.js]
- "sync_reset_and_seed_test_createclient": "{ createClient }" | kind=code-symbol | source=sync/reset_and_seed_test.js:L19 | neighbors=[reset_and_seed_test.js]
- "sync_reset_and_seed_test_execfilesync": "{ execFileSync }" | kind=code-symbol | source=sync/reset_and_seed_test.js:L20 | neighbors=[reset_and_seed_test.js]
- "sync_reset_and_seed_test_fs": "fs" | kind=code-symbol | source=sync/reset_and_seed_test.js:L21 | neighbors=[reset_and_seed_test.js]
- "sync_reset_and_seed_test_path": "path" | kind=code-symbol | source=sync/reset_and_seed_test.js:L22 | neighbors=[reset_and_seed_test.js]
- "sync_reset_and_seed_test_tablas_en_orden": "TABLAS_EN_ORDEN" | kind=code-symbol | source=sync/reset_and_seed_test.js:L38 | neighbors=[reset_and_seed_test.js]
- "sync_reset_and_seed_test_test": "TEST" | kind=code-symbol | source=sync/reset_and_seed_test.js:L33 | neighbors=[reset_and_seed_test.js]
- "sync_schema_postgres17_completo_public_assign_sync_seq": "public.assign_sync_seq()" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L14 | neighbors=[schema_postgres17_completo.sql]
- "sync_schema_postgres17_completo_public_auditoria": "public.auditoria" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L357 | neighbors=[schema_postgres17_completo.sql]
- "sync_schema_postgres17_completo_public_buscar_auditoria": "public.buscar_auditoria()" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L513 | neighbors=[schema_postgres17_completo.sql]
- "sync_schema_postgres17_completo_public_cierres_caja": "public.cierres_caja" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L311 | neighbors=[schema_postgres17_completo.sql]
- "sync_schema_postgres17_completo_public_detalle_ventas": "public.detalle_ventas" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L134 | neighbors=[schema_postgres17_completo.sql]
- "sync_schema_postgres17_completo_public_gastos": "public.gastos" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L146 | neighbors=[schema_postgres17_completo.sql]
- "sync_schema_postgres17_completo_public_kardex_checkpoints": "public.kardex_checkpoints" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L345 | neighbors=[schema_postgres17_completo.sql]
- "sync_schema_postgres17_completo_public_lww_guard": "public.lww_guard()" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L27 | neighbors=[schema_postgres17_completo.sql]
- "sync_schema_postgres17_completo_public_solicitudes_gasto": "public.solicitudes_gasto" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L217 | neighbors=[schema_postgres17_completo.sql]
- "sync_schema_postgres17_completo_public_solicitudes_venta": "public.solicitudes_venta" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L198 | neighbors=[schema_postgres17_completo.sql]
- "sync_schema_postgres17_completo_public_usuarios": "public.usuarios" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L56 | neighbors=[schema_postgres17_completo.sql]
- "sync_schema_postgres17_completo_public_ventas": "public.ventas" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L118 | neighbors=[schema_postgres17_completo.sql]
- "sync_seed_test_from_prod_createclient": "{ createClient }" | kind=code-symbol | source=sync/seed_test_from_prod.js:L11 | neighbors=[seed_test_from_prod.js]
- "sync_seed_test_from_prod_prod": "PROD" | kind=code-symbol | source=sync/seed_test_from_prod.js:L13 | neighbors=[seed_test_from_prod.js]
- "sync_seed_test_from_prod_test": "TEST" | kind=code-symbol | source=sync/seed_test_from_prod.js:L17 | neighbors=[seed_test_from_prod.js]
- "sync_supabaseclients_app": "{ app }" | kind=code-symbol | source=sync/supabaseClients.js:L1 | neighbors=[supabaseClients.js]
- "sync_supabaseclients_appenv": "appEnv" | kind=code-symbol | source=sync/supabaseClients.js:L15 | neighbors=[supabaseClients.js]
- "sync_supabaseclients_createclient": "{ createClient }" | kind=code-symbol | source=sync/supabaseClients.js:L2 | neighbors=[supabaseClients.js]
- "sync_supabaseclients_obtenerconfigservidor": "{ obtenerConfigServidor }" | kind=code-symbol | source=sync/supabaseClients.js:L33 | neighbors=[supabaseClients.js]
- "sync_supabaseclients_pkg": "pkg" | kind=code-symbol | source=sync/supabaseClients.js:L4 | neighbors=[supabaseClients.js]
- "sync_supabaseclients_remotedbclient": "{ remoteDbClient }" | kind=code-symbol | source=sync/supabaseClients.js:L32 | neighbors=[supabaseClients.js]
- "sync_supabaseclients_serverconfig": "serverConfig" | kind=code-symbol | source=sync/supabaseClients.js:L35 | neighbors=[supabaseClients.js]
- "sync_syncservice_browserwindow": "{ BrowserWindow }" | kind=code-symbol | source=sync/syncService.js:L1 | neighbors=[syncService.js]
- "sync_syncservice_console": "console" | kind=code-symbol | source=sync/syncService.js:L11 | neighbors=[syncService.js]
- "sync_syncservice_nativeconsole": "nativeConsole" | kind=code-symbol | source=sync/syncService.js:L10 | neighbors=[syncService.js]
- "sync_syncservice_obtenermensajesync": "{ obtenerMensajeSync }" | kind=code-symbol | source=sync/syncService.js:L3 | neighbors=[syncService.js]
- "sync_syncservice_runquery_allquery": "{ runQuery, allQuery }" | kind=code-symbol | source=sync/syncService.js:L2 | neighbors=[syncService.js]
- "sync_syncservice_supabase_supabaselogs_supabaseurl_supabasekey_isprod_issyncconfigured": "{ supabase, supabaseLogs, supabaseUrl, supabaseKey, isProd, isSyncConfigured }" | kind=code-symbol | source=sync/syncService.js:L4 | neighbors=[syncService.js]
- "sync_syncservice_tablassinsyncseq": "tablasSinSyncSeq" | kind=code-symbol | source=sync/syncService.js:L125 | neighbors=[syncService.js]
- "transferencias_categoriascargadas": "categoriasCargadas" | kind=code-symbol | source=transferencias.js:L30 | neighbors=[transferencias.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-023.json

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
