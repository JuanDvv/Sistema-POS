# Node Description Batch 12 of 24

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

- "sidebar_actualizarbadgesolicitudes": "actualizarBadgeSolicitudes()" | kind=code-symbol | source=sidebar.js:L778 | neighbors=[sidebar.js, ejecutarSincronizacion()]
- "sidebar_aplicarestadoconexion": "aplicarEstadoConexion()" | kind=code-symbol | source=sidebar.js:L756 | neighbors=[sidebar.js, actualizarBotonSync()]
- "sidebar_aplicarestadosincronizando": "aplicarEstadoSincronizando()" | kind=code-symbol | source=sidebar.js:L751 | neighbors=[sidebar.js, actualizarBotonSync()]
- "sidebar_rendercontadorproximasincronizacion": "renderContadorProximaSincronizacion()" | kind=code-symbol | source=sidebar.js:L567 | neighbors=[sidebar.js, actualizarProximaSincronizacion()]
- "sync_conciliar_saldo_apertura_leertodo": "leerTodo()" | kind=code-symbol | source=sync/conciliar_saldo_apertura.js:L59 | neighbors=[conciliar_saldo_apertura.js, calcularDiferencias()]
- "sync_conciliar_saldo_apertura_main": "main()" | kind=code-symbol | source=sync/conciliar_saldo_apertura.js:L103 | neighbors=[conciliar_saldo_apertura.js, calcularDiferencias()]
- "sync_diagnostico_stock_vs_kardex_leertodo": "leerTodo()" | kind=code-symbol | source=sync/diagnostico_stock_vs_kardex.js:L57 | neighbors=[diagnostico_stock_vs_kardex.js, main()]
- "sync_diagnostico_stock_vs_kardex_main": "main()" | kind=code-symbol | source=sync/diagnostico_stock_vs_kardex.js:L70 | neighbors=[diagnostico_stock_vs_kardex.js, leerTodo()]
- "sync_diagnostico_sync_seq_leertodo": "leerTodo()" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L55 | neighbors=[diagnostico_sync_seq.js, validarTabla()]
- "sync_diagnostico_sync_seq_main": "main()" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L88 | neighbors=[diagnostico_sync_seq.js, validarTabla()]
- "sync_import_old_data_copiartabla": "copiarTabla()" | kind=code-symbol | source=sync/import_old_data.js:L28 | neighbors=[import_old_data.js, migrar()]
- "sync_import_old_data_migrar": "migrar()" | kind=code-symbol | source=sync/import_old_data.js:L64 | neighbors=[import_old_data.js, copiarTabla()]
- "sync_migrate_auditoria_busqueda_insensible": "migrate_auditoria_busqueda_insensible.sql" | kind=code-symbol | source=sync/migrate_auditoria_busqueda_insensible.sql:L1 | neighbors=[bfa73bf Add pastelería sugeridos, gasto…, public.buscar_auditoria()]
- "sync_migrate_cierres_caja_trg_cierres_caja_sync_seq": "trg_cierres_caja_sync_seq" | kind=code-symbol | source=sync/migrate_cierres_caja.sql:L56 | neighbors=[migrate_cierres_caja.sql, public.cierres_caja]
- "sync_migrate_cierres_caja_trg_lww_guard": "trg_lww_guard" | kind=code-symbol | source=sync/migrate_cierres_caja.sql:L53 | neighbors=[migrate_cierres_caja.sql, public.cierres_caja]
- "sync_migrate_correccion_stock_public_inventario_sucursal": "public.inventario_sucursal" | kind=code-symbol | source=sync/migrate_correccion_stock.sql:L55 | neighbors=[migrate_correccion_stock.sql, public.aplicar_correccion_stock()]
- "sync_migrate_correccion_stock_public_movimientos_inventario": "public.movimientos_inventario" | kind=code-symbol | source=sync/migrate_correccion_stock.sql:L48 | neighbors=[migrate_correccion_stock.sql, public.aplicar_correccion_stock()]
- "sync_migrate_correccion_stock_v_delta_real": "v_delta_real" | kind=code-symbol | source=sync/migrate_correccion_stock.sql:L48 | neighbors=[migrate_correccion_stock.sql, public.aplicar_correccion_stock()]
- "sync_migrate_correccion_stock_v_stock_actual": "v_stock_actual" | kind=code-symbol | source=sync/migrate_correccion_stock.sql:L55 | neighbors=[migrate_correccion_stock.sql, public.aplicar_correccion_stock()]
- "sync_migrate_incremental_pull_on": "ON" | kind=code-symbol | source=sync/migrate_incremental_pull.sql:L77 | neighbors=[migrate_incremental_pull.sql, public.assign_sync_seq()]
- "sync_migrate_incremental_pull_trg": "trg_" | kind=code-symbol | source=sync/migrate_incremental_pull.sql:L77 | neighbors=[migrate_incremental_pull.sql, public]
- "sync_migrate_incremental_pull_ya": "ya" | kind=code-symbol | source=sync/migrate_incremental_pull.sql:L85 | neighbors=[migrate_incremental_pull.sql, public.assign_sync_seq()]
- "sync_migrate_kardex_retention_public": "public" | kind=code-symbol | source=sync/migrate_kardex_retention.sql:L81 | neighbors=[migrate_kardex_retention.sql, public.podar_kardex()]
- "sync_migrate_kardex_retention_public_kardex_checkpoints": "public.kardex_checkpoints" | kind=code-symbol | source=sync/migrate_kardex_retention.sql:L44 | neighbors=[migrate_kardex_retention.sql, public.podar_kardex()]
- "sync_migrate_solicitudes_gasto_trg_lww_guard": "trg_lww_guard" | kind=code-symbol | source=sync/migrate_solicitudes_gasto.sql:L56 | neighbors=[migrate_solicitudes_gasto.sql, public.solicitudes_gasto]
- "sync_migrate_solicitudes_gasto_trg_solicitudes_gasto_sync_seq": "trg_solicitudes_gasto_sync_seq" | kind=code-symbol | source=sync/migrate_solicitudes_gasto.sql:L59 | neighbors=[migrate_solicitudes_gasto.sql, public.solicitudes_gasto]
- "sync_migrate_stock_delta_sync_public_movimientos_inventario": "public.movimientos_inventario" | kind=code-symbol | source=sync/migrate_stock_delta_sync.sql:L62 | neighbors=[migrate_stock_delta_sync.sql, public.aplicar_movimiento_inventario()]
- "sync_migrate_stock_delta_sync_trg_lww_guard": "trg_lww_guard" | kind=code-symbol | source=sync/migrate_stock_delta_sync.sql:L106 | neighbors=[migrate_stock_delta_sync.sql, public.movimientos_reserva_inventario]
- "sync_migrate_sugeridos_pasteleria_trg_lww_guard": "trg_lww_guard" | kind=code-symbol | source=sync/migrate_sugeridos_pasteleria.sql:L52 | neighbors=[migrate_sugeridos_pasteleria.sql, public.sugeridos_pasteleria]
- "sync_migrate_sugeridos_pasteleria_trg_sugeridos_pasteleria_sync_seq": "trg_sugeridos_pasteleria_sync_seq" | kind=code-symbol | source=sync/migrate_sugeridos_pasteleria.sql:L55 | neighbors=[migrate_sugeridos_pasteleria.sql, public.sugeridos_pasteleria]
- "sync_remotedbclient_querybuilder_then": ".then()" | kind=code-symbol | source=sync/remoteDbClient.js:L224 | neighbors=[QueryBuilder, getPool()]
- "sync_remotedbclient_remotedbclient": "remoteDbClient" | kind=code-symbol | source=sync/remoteDbClient.js:L378 | neighbors=[remoteDbClient.js, supabaseClients.js]
- "sync_remotedbclient_resetpool": "resetPool()" | kind=code-symbol | source=sync/remoteDbClient.js:L54 | neighbors=[registerSistemaIpc.js, remoteDbClient.js]
- "sync_reset_and_seed_test_nombreappdesdepackagejson": "nombreAppDesdePackageJson()" | kind=code-symbol | source=sync/reset_and_seed_test.js:L67 | neighbors=[reset_and_seed_test.js, borrarSqliteLocalDeTest()]
- "sync_reset_and_seed_test_rutauserdataelectron": "rutaUserDataElectron()" | kind=code-symbol | source=sync/reset_and_seed_test.js:L72 | neighbors=[reset_and_seed_test.js, borrarSqliteLocalDeTest()]
- "sync_reset_and_seed_test_vaciartabla": "vaciarTabla()" | kind=code-symbol | source=sync/reset_and_seed_test.js:L59 | neighbors=[reset_and_seed_test.js, main()]
- "sync_schema_camisetas_supabase_lww_guard_movimientos_inventario": "lww_guard_movimientos_inventario" | kind=code-symbol | source=sync/schema_camisetas_supabase.sql:L289 | neighbors=[schema_camisetas_supabase.sql, public.movimientos_inventario]
- "sync_schema_camisetas_supabase_public_abonos_credito": "public.abonos_credito" | kind=code-symbol | source=sync/schema_camisetas_supabase.sql:L14 | neighbors=[schema_camisetas_supabase.sql, trg_lww_guard]
- "sync_schema_camisetas_supabase_public_abonos_pedido": "public.abonos_pedido" | kind=code-symbol | source=sync/schema_camisetas_supabase.sql:L25 | neighbors=[schema_camisetas_supabase.sql, trg_abonos_pedido_lww]
- "sync_schema_camisetas_supabase_public_categorias": "public.categorias" | kind=code-symbol | source=sync/schema_camisetas_supabase.sql:L35 | neighbors=[schema_camisetas_supabase.sql, trg_lww_guard]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-011.json

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
