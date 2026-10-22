# Node Description Batch 14 of 25

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

- "sync_schema_postgres17_completo_public_transferencias": "public.transferencias" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L163 | neighbors=[schema_postgres17_completo.sql, public.detalle_transferencias]
- "sync_schema_postgres17_completo_trg_assign_sync_seq": "trg_assign_sync_seq" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L389 | neighbors=[schema_postgres17_completo.sql, public]
- "sync_schema_postgres17_completo_trg_lww_guard": "trg_lww_guard" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L392 | neighbors=[schema_postgres17_completo.sql, public]
- "sync_schema_postgres17_completo_v_stock_actual": "v_stock_actual" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L488 | neighbors=[schema_postgres17_completo.sql, public.aplicar_correccion_stock()]
- "sync_schema_test_data_config_sucursal": "config_sucursal" | kind=code-symbol | source=sync/schema_test_data.sql:L272 | neighbors=[schema_test_data.sql, public.inventario_sucursal]
- "sync_schema_test_data_lww_guard_movimientos_inventario": "lww_guard_movimientos_inventario" | kind=code-symbol | source=sync/schema_test_data.sql:L333 | neighbors=[schema_test_data.sql, public.movimientos_inventario]
- "sync_schema_test_data_public_clientes": "public.clientes" | kind=code-symbol | source=sync/schema_test_data.sql:L48 | neighbors=[schema_test_data.sql, trg_lww_guard]
- "sync_schema_test_data_public_config_sucursal": "public.config_sucursal" | kind=code-symbol | source=sync/schema_test_data.sql:L61 | neighbors=[schema_test_data.sql, trg_lww_guard]
- "sync_schema_test_data_public_lww_guard": "public.lww_guard()" | kind=code-symbol | source=sync/schema_test_data.sql:L302 | neighbors=[schema_test_data.sql, si]
- "sync_schema_test_data_public_movimientos_inventario": "public.movimientos_inventario" | kind=code-symbol | source=sync/schema_test_data.sql:L124 | neighbors=[schema_test_data.sql, lww_guard_movimientos_inventario]
- "sync_schema_test_data_public_solicitudes_venta": "public.solicitudes_venta" | kind=code-symbol | source=sync/schema_test_data.sql:L168 | neighbors=[schema_test_data.sql, trg_lww_guard]
- "sync_schema_test_data_public_transferencias": "public.transferencias" | kind=code-symbol | source=sync/schema_test_data.sql:L186 | neighbors=[schema_test_data.sql, trg_lww_guard]
- "sync_schema_test_data_public_usuarios": "public.usuarios" | kind=code-symbol | source=sync/schema_test_data.sql:L197 | neighbors=[schema_test_data.sql, trg_lww_guard]
- "sync_schema_test_data_public_ventas": "public.ventas" | kind=code-symbol | source=sync/schema_test_data.sql:L206 | neighbors=[schema_test_data.sql, trg_lww_guard]
- "sync_schema_test_data_si": "si" | kind=code-symbol | source=sync/schema_test_data.sql:L308 | neighbors=[schema_test_data.sql, public.lww_guard()]
- "sync_schema_test_data_transferencias": "transferencias" | kind=code-symbol | source=sync/schema_test_data.sql:L264 | neighbors=[schema_test_data.sql, public.detalle_transferencias]
- "sync_schema_test_data_trg_abonos_pedido_lww": "trg_abonos_pedido_lww" | kind=code-symbol | source=sync/schema_test_data.sql:L317 | neighbors=[schema_test_data.sql, public.abonos_pedido]
- "sync_schema_test_data_trg_pedidos_lww": "trg_pedidos_lww" | kind=code-symbol | source=sync/schema_test_data.sql:L335 | neighbors=[schema_test_data.sql, public.pedidos]
- "sync_schema_test_logs_public_auditoria": "public.auditoria" | kind=code-symbol | source=sync/schema_test_logs.sql:L17 | neighbors=[schema_test_logs.sql, public.limpiar_auditoria_antigua()]
- "sync_schema_test_logs_public_limpiar_auditoria_antigua": "public.limpiar_auditoria_antigua()" | kind=code-symbol | source=sync/schema_test_logs.sql:L31 | neighbors=[schema_test_logs.sql, public.auditoria]
- "sync_supabaseclients_issyncconfigured": "isSyncConfigured" | kind=code-symbol | source=sync/supabaseClients.js:L38 | neighbors=[supabaseClients.js, syncService.js]
- "sync_syncservice_descargartodo": "descargarTodo()" | kind=code-symbol | source=sync/syncService.js:L88 | neighbors=[syncService.js, descargarDesdeCursor()]
- "sync_syncservice_eserrorcolumnainexistente": "esErrorColumnaInexistente()" | kind=code-symbol | source=sync/syncService.js:L127 | neighbors=[syncService.js, descargarDesdeCursor()]
- "sync_syncservice_hayconexionconocida": "hayConexionConocida()" | kind=code-symbol | source=sync/syncService.js:L2350 | neighbors=[registerSistemaIpc.js, syncService.js]
- "sync_syncservice_hayconexionconsupabase": "hayConexionConSupabase()" | kind=code-symbol | source=sync/syncService.js:L2325 | neighbors=[syncService.js, procesarSincronizacion()]
- "sync_syncservice_issincronizando": "isSincronizando()" | kind=code-symbol | source=sync/syncService.js:L44 | neighbors=[registerSistemaIpc.js, syncService.js]
- "sync_syncservice_liberarinventariopendientehuerfano": "liberarInventarioPendienteHuerfano()" | kind=code-symbol | source=sync/syncService.js:L950 | neighbors=[syncService.js, procesarSincronizacion()]
- "sync_syncservice_notificarestadoconexion": "notificarEstadoConexion()" | kind=code-symbol | source=sync/syncService.js:L2353 | neighbors=[syncService.js, procesarSincronizacion()]
- "sync_syncservice_notificarestadosincronizacion": "notificarEstadoSincronizacion()" | kind=code-symbol | source=sync/syncService.js:L2286 | neighbors=[syncService.js, procesarSincronizacion()]
- "sync_syncservice_notificartransferenciaentrante": "notificarTransferenciaEntrante()" | kind=code-symbol | source=sync/syncService.js:L2294 | neighbors=[syncService.js, syncTransferenciasDescargar()]
- "sync_syncservice_obtenercursor": "obtenerCursor()" | kind=code-symbol | source=sync/syncService.js:L109 | neighbors=[syncService.js, descargarDesdeCursor()]
- "sync_syncservice_purgarabonoseliminadosnube": "purgarAbonosEliminadosNube()" | kind=code-symbol | source=sync/syncService.js:L2063 | neighbors=[syncService.js, procesarSincronizacion()]
- "sync_syncservice_reparardetalleventasduplicado": "repararDetalleVentasDuplicado()" | kind=code-symbol | source=sync/syncService.js:L501 | neighbors=[syncService.js, procesarSincronizacion()]
- "transferencias_actualizardestinosdisponibles": "actualizarDestinosDisponibles()" | kind=code-symbol | source=transferencias.js:L176 | neighbors=[transferencias.js, cargarSucursales()]
- "transferencias_agregaracanasta": "agregarACanasta()" | kind=code-symbol | source=transferencias.js:L299 | neighbors=[transferencias.js, renderizarCarrito()]
- "transferencias_cambiarcantidad": "cambiarCantidad()" | kind=code-symbol | source=transferencias.js:L318 | neighbors=[transferencias.js, renderizarCarrito()]
- "transferencias_normalizestr": "normalizeStr()" | kind=code-symbol | source=transferencias.js:L111 | neighbors=[transferencias.js, filtrarYRenderizarCatalogo()]
- "turnos_calcularturno": "calcularTurno()" | kind=code-symbol | source=turnos.js:L39 | neighbors=[turnos.js, renderizarTabla()]
- "turnos_cargaroperadoresstorage": "cargarOperadoresStorage()" | kind=code-symbol | source=turnos.js:L44 | neighbors=[turnos.js, inicializarModuloTurnos()]
- "turnos_generarbadgeturno": "generarBadgeTurno()" | kind=code-symbol | source=turnos.js:L189 | neighbors=[turnos.js, renderizarTabla()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-013.json

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
