# Node Description Batch 9 of 25

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

- "sync_diagnostico_sync_seq_validartabla": "validarTabla()" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L68 | neighbors=[diagnostico_sync_seq.js, main(), leerTodo()]
- "sync_migrate_cierres_caja_public_cierres_caja": "public.cierres_caja" | kind=code-symbol | source=sync/migrate_cierres_caja.sql:L24 | neighbors=[migrate_cierres_caja.sql, trg_cierres_caja_sync_seq, trg_lww_guard]
- "sync_migrate_incremental_pull_public": "public" | kind=code-symbol | source=sync/migrate_incremental_pull.sql:L77 | neighbors=[migrate_incremental_pull.sql, public.assign_sync_seq(), trg_]
- "sync_migrate_kardex_retention_public_podar_kardex": "public.podar_kardex()" | kind=code-symbol | source=sync/migrate_kardex_retention.sql:L65 | neighbors=[migrate_kardex_retention.sql, public, public.kardex_checkpoints]
- "sync_migrate_purgar_abonos_eliminados_public_purgar_abonos_eliminados_antiguos": "public.purgar_abonos_eliminados_antiguos()" | kind=code-symbol | source=sync/migrate_purgar_abonos_eliminados.sql:L18 | neighbors=[migrate_purgar_abonos_eliminados.sql, public.abonos_credito, public.abonos_pedido]
- "sync_migrate_solicitudes_gasto_public_solicitudes_gasto": "public.solicitudes_gasto" | kind=code-symbol | source=sync/migrate_solicitudes_gasto.sql:L30 | neighbors=[migrate_solicitudes_gasto.sql, trg_lww_guard, trg_solicitudes_gasto_sync_seq]
- "sync_migrate_stock_delta_sync_public_aplicar_movimiento_inventario": "public.aplicar_movimiento_inventario()" | kind=code-symbol | source=sync/migrate_stock_delta_sync.sql:L46 | neighbors=[migrate_stock_delta_sync.sql, public.inventario_sucursal, public.movimientos_inventario]
- "sync_migrate_stock_delta_sync_public_aplicar_reserva_inventario": "public.aplicar_reserva_inventario()" | kind=code-symbol | source=sync/migrate_stock_delta_sync.sql:L110 | neighbors=[migrate_stock_delta_sync.sql, public.inventario_sucursal, public.movimientos_reserva_inventario]
- "sync_migrate_stock_delta_sync_public_inventario_sucursal": "public.inventario_sucursal" | kind=code-symbol | source=sync/migrate_stock_delta_sync.sql:L69 | neighbors=[migrate_stock_delta_sync.sql, public.aplicar_movimiento_inventario(), public.aplicar_reserva_inventario()]
- "sync_migrate_stock_delta_sync_public_movimientos_reserva_inventario": "public.movimientos_reserva_inventario" | kind=code-symbol | source=sync/migrate_stock_delta_sync.sql:L87 | neighbors=[migrate_stock_delta_sync.sql, public.aplicar_reserva_inventario(), trg_lww_guard]
- "sync_migrate_sugeridos_pasteleria_public_sugeridos_pasteleria": "public.sugeridos_pasteleria" | kind=code-symbol | source=sync/migrate_sugeridos_pasteleria.sql:L29 | neighbors=[migrate_sugeridos_pasteleria.sql, trg_lww_guard, trg_sugeridos_pasteleria_sync_seq]
- "sync_remotedbclient_remotedbclient": "remoteDbClient" | kind=code-symbol | source=sync/remoteDbClient.js:L354 | neighbors=[diagnostico_sync_cierre.js, remoteDbClient.js, supabaseClients.js]
- "sync_remotedbclient_testconnection": "testConnection()" | kind=code-symbol | source=sync/remoteDbClient.js:L64 | neighbors=[registerSistemaIpc.js, remoteDbClient.js, getPool()]
- "sync_reset_and_seed_test_main": "main()" | kind=code-symbol | source=sync/reset_and_seed_test.js:L97 | neighbors=[reset_and_seed_test.js, borrarSqliteLocalDeTest(), vaciarTabla()]
- "sync_schema_postgres17_completo_public": "public" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L389 | neighbors=[schema_postgres17_completo.sql, trg_assign_sync_seq, trg_lww_guard]
- "sync_schema_postgres17_completo_public_aplicar_movimiento_inventario": "public.aplicar_movimiento_inventario()" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L404 | neighbors=[schema_postgres17_completo.sql, public.inventario_sucursal, public.movimientos_inventario]
- "sync_schema_postgres17_completo_public_aplicar_reserva_inventario": "public.aplicar_reserva_inventario()" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L438 | neighbors=[schema_postgres17_completo.sql, public.inventario_sucursal, public.movimientos_reserva_inventario]
- "sync_schema_postgres17_completo_public_clientes": "public.clientes" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L103 | neighbors=[schema_postgres17_completo.sql, public.abonos_credito, public.pedidos]
- "sync_schema_postgres17_completo_public_detalle_pedidos": "public.detalle_pedidos" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L287 | neighbors=[schema_postgres17_completo.sql, public.pedidos, public.productos]
- "sync_schema_postgres17_completo_public_detalle_transferencias": "public.detalle_transferencias" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L175 | neighbors=[schema_postgres17_completo.sql, public.productos, public.transferencias]
- "sync_schema_postgres17_completo_public_sugeridos_pasteleria": "public.sugeridos_pasteleria" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L331 | neighbors=[schema_postgres17_completo.sql, public.config_sucursal, public.productos]
- "sync_schema_test_data_categorias": "categorias" | kind=code-symbol | source=sync/schema_test_data.sql:L258 | neighbors=[schema_test_data.sql, public.categorias, public.productos]
- "sync_schema_test_data_clientes": "clientes" | kind=code-symbol | source=sync/schema_test_data.sql:L218 | neighbors=[schema_test_data.sql, public.abonos_credito, public.pedidos]
- "sync_schema_test_data_pedidos": "pedidos" | kind=code-symbol | source=sync/schema_test_data.sql:L256 | neighbors=[schema_test_data.sql, public.abonos_pedido, public.detalle_pedidos]
- "sync_schema_test_data_productos": "productos" | kind=code-symbol | source=sync/schema_test_data.sql:L262 | neighbors=[schema_test_data.sql, public.detalle_pedidos, public.inventario_sucursal]
- "sync_schema_test_data_public_abonos_credito": "public.abonos_credito" | kind=code-symbol | source=sync/schema_test_data.sql:L19 | neighbors=[schema_test_data.sql, clientes, trg_lww_guard]
- "sync_schema_test_data_public_abonos_pedido": "public.abonos_pedido" | kind=code-symbol | source=sync/schema_test_data.sql:L30 | neighbors=[schema_test_data.sql, pedidos, trg_abonos_pedido_lww]
- "sync_schema_test_data_public_categorias": "public.categorias" | kind=code-symbol | source=sync/schema_test_data.sql:L40 | neighbors=[schema_test_data.sql, categorias, trg_lww_guard]
- "sync_schema_test_data_public_detalle_pedidos": "public.detalle_pedidos" | kind=code-symbol | source=sync/schema_test_data.sql:L70 | neighbors=[schema_test_data.sql, pedidos, productos]
- "sync_schema_test_data_public_detalle_transferencias": "public.detalle_transferencias" | kind=code-symbol | source=sync/schema_test_data.sql:L80 | neighbors=[schema_test_data.sql, transferencias, trg_lww_guard]
- "sync_schema_test_data_public_detalle_ventas": "public.detalle_ventas" | kind=code-symbol | source=sync/schema_test_data.sql:L90 | neighbors=[schema_test_data.sql, ventas, trg_lww_guard]
- "sync_schema_test_data_public_gastos": "public.gastos" | kind=code-symbol | source=sync/schema_test_data.sql:L100 | neighbors=[schema_test_data.sql, ventas, trg_lww_guard]
- "sync_schema_test_data_public_pedidos": "public.pedidos" | kind=code-symbol | source=sync/schema_test_data.sql:L137 | neighbors=[schema_test_data.sql, clientes, trg_pedidos_lww]
- "sync_schema_test_data_public_productos": "public.productos" | kind=code-symbol | source=sync/schema_test_data.sql:L156 | neighbors=[schema_test_data.sql, categorias, trg_lww_guard]
- "sync_schema_test_data_ventas": "ventas" | kind=code-symbol | source=sync/schema_test_data.sql:L266 | neighbors=[schema_test_data.sql, public.detalle_ventas, public.gastos]
- "sync_schema_test_logs": "schema_test_logs.sql" | kind=code-symbol | source=sync/schema_test_logs.sql:L1 | neighbors=[5bfc128 feat: implement synchronization…, public.auditoria, public.limpiar_auditoria_antigua()]
- "sync_seed_test_from_prod_leertodo": "leerTodo()" | kind=code-symbol | source=sync/seed_test_from_prod.js:L24 | neighbors=[seed_test_from_prod.js, copiarTabla(), main()]
- "sync_seed_test_from_prod_subirlotes": "subirLotes()" | kind=code-symbol | source=sync/seed_test_from_prod.js:L37 | neighbors=[seed_test_from_prod.js, copiarTabla(), main()]
- "sync_syncservice_liberarinventariosisinpendientes": "liberarInventarioSiSinPendientes()" | kind=code-symbol | source=sync/syncService.js:L923 | neighbors=[syncService.js, syncMovimientosInventarioSubir(), syncReservaInventarioSubir()]
- "sync_syncservice_notificarventanasreportes": "notificarVentanasReportes()" | kind=code-symbol | source=sync/syncService.js:L2303 | neighbors=[registerUsuariosIpc.js, syncService.js, procesarSincronizacion()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-008.json

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
