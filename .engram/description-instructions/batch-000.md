# Node Description Batch 1 of 24

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
For an entity node (any other kind — e.g. a person, place, event, object),
describe what the entity is and its role, grounded in its type, its
relations (neighbors) and the provided citations/evidence — e.g.
"Lady Carfax, a wealthy heiress who disappears en route to Lausanne.".
Ground entity descriptions in the citations/evidence when present; do not
speculate beyond the context, so a node with no supporting context may be
left out of the reply.
LANGUAGE: each entry has a `lang=` marker giving the language of its source.
Write that entry's description in EXACTLY that language. Do not translate to
a single common language — match each node's source language individually.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "sync_syncservice": "syncService.js" | kind=code-symbol | source=sync/syncService.js:L1 | neighbors=[10222a9 refactor: enforce full payment …, 1dd520d Add configurable PostgreSQL syn…, 22e246f Add fiscal client and credit tr…, 2812d87 feat: implementa módulo de cier…, 29d31c1 feat: implement complete POS sy…, 308b9c1 feat: implement incremental syn…] | lang=en
- "pedidos": "pedidos.js" | kind=code-symbol | source=pedidos.js:L1 | neighbors=[10222a9 refactor: enforce full payment …, 155d086 Use sessionStorage and add mult…, 753cf10 Add revert-delivery feature and…, 821d5ac feat: implement system-wide ord…, 85893e4 feat: implement IPC handlers fo…, a4cb7fc Add ability to revert delivered…] | lang=en
- "main": "main.js" | kind=code-symbol | source=main.js:L1 | neighbors=[2812d87 feat: implementa módulo de cier…, 29d31c1 feat: implement complete POS sy…, 6f9f2fb Merge branch 'delipostres-turba…, 821d5ac feat: implement system-wide ord…, bd7e03e Rebrand to Tienda de Kary and a…, bda8c3f feat: add branch location badge…] | lang=en
- "ventas": "ventas.js" | kind=code-symbol | source=ventas.js:L1 | neighbors=[155d086 Use sessionStorage and add mult…, 29d31c1 feat: implement complete POS sy…, 4986e5d refactor: migrate temporary car…, 68efa36 refactor: replace localStorage …, 753cf10 Add revert-delivery feature and…, 821d5ac feat: implement system-wide ord…] | lang=en
- "ventas_anteriores": "ventas-anteriores.js" | kind=code-symbol | source=ventas-anteriores.js:L1 | neighbors=[155d086 Use sessionStorage and add mult…, 22e246f Add fiscal client and credit tr…, 29d31c1 feat: implement complete POS sy…, 753cf10 Add revert-delivery feature and…, 821d5ac feat: implement system-wide ord…, aeae7ec Smart product search and seed s…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@29d31c1d47e1efecccd66b224109297266df14c2": "29d31c1 feat: implement complete POS system architecture with IPC handlers, aud…" | kind=Commit | source=git | neighbors=[admin.js, admin-audit-logs.js, arqueo.js, Tienda-Kary, delipostres-turbaco, categoriaFiltro.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@bfa73bf661f3d29628bc4832de4e0648b9a57645": "bfa73bf Add pastelería sugeridos, gasto retroactivo & sync" | kind=Commit | source=git | neighbors=[admin.js, admin-audit-logs.js, arqueo.js, Tienda-Kary, delipostres-turbaco, 753cf10 Add revert-delivery feature and…] | lang=pt
- "services_pedidoservice": "pedidoService.js" | kind=code-symbol | source=services/pedidoService.js:L1 | neighbors=[10222a9 refactor: enforce full payment …, 5bfc128 feat: implement synchronization…, 753cf10 Add revert-delivery feature and…, 821d5ac feat: implement system-wide ord…, 9140912 Add PostgreSQL sync and turno m…, a4cb7fc Add ability to revert delivered…] | lang=en
- "sync_syncservice_procesarsincronizacion": "procesarSincronizacion()" | kind=code-symbol | source=sync/syncService.js:L2095 | neighbors=[registerSistemaIpc.js, main.js, syncService.js, hayConexionConSupabase(), liberarInventarioPendienteHuerfano(), notificarEstadoConexion()] | lang=en
- "reportes": "reportes.js" | kind=code-symbol | source=reportes.js:L1 | neighbors=[10222a9 refactor: enforce full payment …, 155d086 Use sessionStorage and add mult…, 22e246f Add fiscal client and credit tr…, 2812d87 feat: implementa módulo de cier…, 29d31c1 feat: implement complete POS sy…, 6f9f2fb Merge branch 'delipostres-turba…] | lang=en
- "admin": "admin.js" | kind=code-symbol | source=admin.js:L1 | neighbors=[abrirModalConFoco(), btnCloseDetalleSolicitud, btnCloseDetalleSolicitudGasto, btnCloseSucursalBloqueada, cargarAbonosEliminados(), cargarCategorias()] | lang=en
- "ipc_registergastosipc": "registerGastosIpc.js" | kind=code-symbol | source=ipc/registerGastosIpc.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, 821d5ac feat: implement system-wide ord…, 9140912 Add PostgreSQL sync and turno m…, aa81749 feat: implement real-time inven…, bfa73bf Add pastelería sugeridos, gasto…, connection.js] | lang=en
- "ipc_registerventasipc": "registerVentasIpc.js" | kind=code-symbol | source=ipc/registerVentasIpc.js:L1 | neighbors=[22e246f Add fiscal client and credit tr…, 29d31c1 feat: implement complete POS sy…, 753cf10 Add revert-delivery feature and…, 821d5ac feat: implement system-wide ord…, 9140912 Add PostgreSQL sync and turno m…, a4cb7fc Add ability to revert delivered…] | lang=en
- "db_connection": "connection.js" | kind=code-symbol | source=db/connection.js:L1 | neighbors=[10222a9 refactor: enforce full payment …, 29d31c1 feat: implement complete POS sy…, 5bfc128 feat: implement synchronization…, 6a58133 Make Supabase optional; use pac…, b08f3b6 Aislar configuración de Supabas…, bd7e03e Rebrand to Tienda de Kary and a…] | lang=en
- "ipc_registerclientesipc": "registerClientesIpc.js" | kind=code-symbol | source=ipc/registerClientesIpc.js:L1 | neighbors=[22e246f Add fiscal client and credit tr…, 29d31c1 feat: implement complete POS sy…, 5bfc128 feat: implement synchronization…, 821d5ac feat: implement system-wide ord…, 9140912 Add PostgreSQL sync and turno m…, b9061d3 Mejoras de sesión, reportes y d…] | lang=en
- "ipc_registerproductosipc": "registerProductosIpc.js" | kind=code-symbol | source=ipc/registerProductosIpc.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, 308b9c1 feat: implement incremental syn…, 5bfc128 feat: implement synchronization…, 821d5ac feat: implement system-wide ord…, 84696d5 feat: enable client management …, bd7e03e Rebrand to Tienda de Kary and a…] | lang=en
- "sync_schema_postgres17_completo": "schema_postgres17_completo.sql" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L1 | neighbors=[1dd520d Add configurable PostgreSQL syn…, 9140912 Add PostgreSQL sync and turno m…, public, public.abonos_credito, public.abonos_pedido, public.aplicar_correccion_stock()] | lang=en
- "services_cierrecajaservice": "cierreCajaService.js" | kind=code-symbol | source=services/cierreCajaService.js:L1 | neighbors=[22e246f Add fiscal client and credit tr…, 2812d87 feat: implementa módulo de cier…, 6f9f2fb Merge branch 'delipostres-turba…, 9140912 Add PostgreSQL sync and turno m…, bd7e03e Rebrand to Tienda de Kary and a…, bfa73bf Add pastelería sugeridos, gasto…] | lang=en
- "sync_schema_test_data": "schema_test_data.sql" | kind=code-symbol | source=sync/schema_test_data.sql:L1 | neighbors=[5bfc128 feat: implement synchronization…, categorias, clientes, config_sucursal, lww_guard_movimientos_inventario, pedidos] | lang=en
- "branch:repo:github.com/JuanDvv/Sistema-POS#delipostres-turbaco": "delipostres-turbaco" | kind=Branch | source=git | neighbors=[10222a9 refactor: enforce full payment …, 22e246f Add fiscal client and credit tr…, 2812d87 feat: implementa módulo de cier…, 283a3fc feat: agrega splitter arrastrab…, 29d31c1 feat: implement complete POS sy…, 308b9c1 feat: implement incremental syn…] | lang=en
- "branch:repo:github.com/JuanDvv/Sistema-POS#Tienda-Kary": "Tienda-Kary" | kind=Branch | source=git | neighbors=[10222a9 refactor: enforce full payment …, 155d086 Use sessionStorage and add mult…, 1dd520d Add configurable PostgreSQL syn…, 2812d87 feat: implementa módulo de cier…, 283a3fc feat: agrega splitter arrastrab…, 29d31c1 feat: implement complete POS sy…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@821d5ac6e7d839f908e040250fde212b81a38e0d": "821d5ac feat: implement system-wide order management module including IPC integ…" | kind=Commit | source=git | neighbors=[29d31c1 feat: implement complete POS sy…, admin.js, arqueo.js, Tienda-Kary, delipostres-turbaco, categoriaFiltro.js] | lang=en
- "admin_audit_logs": "admin-audit-logs.js" | kind=code-symbol | source=admin-audit-logs.js:L1 | neighbors=[actualizarBotonesPaginacion(), cargarAccionesFiltro(), cargarAuditoria(), cargarProductosParaAuditoria(), cargarSucursalesFiltro(), cargarUsuariosFiltro()] | lang=en
- "ipc_registersistemaipc": "registerSistemaIpc.js" | kind=code-symbol | source=ipc/registerSistemaIpc.js:L1 | neighbors=[155d086 Use sessionStorage and add mult…, 1dd520d Add configurable PostgreSQL syn…, 29d31c1 feat: implement complete POS sy…, 753cf10 Add revert-delivery feature and…, 9140912 Add PostgreSQL sync and turno m…, b9061d3 Mejoras de sesión, reportes y d…] | lang=en
- "services_ventaservice": "ventaService.js" | kind=code-symbol | source=services/ventaService.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, 4cf89eb feat: implement centralized ven…, aa81749 feat: implement real-time inven…, bfa73bf Add pastelería sugeridos, gasto…, registerVentasIpc.js, connection.js] | lang=en
- "arqueo": "arqueo.js" | kind=code-symbol | source=arqueo.js:L1 | neighbors=[aplicarBloqueoCierreDia(), calcularTotales(), cargarHistorialCierres(), cargarVentanaCajaActual(), confirmarCierreCaja(), eliminarCierreCaja()] | lang=en
- "gastos": "gastos.js" | kind=code-symbol | source=gastos.js:L1 | neighbors=[155d086 Use sessionStorage and add mult…, 29d31c1 feat: implement complete POS sy…, 753cf10 Add revert-delivery feature and…, 85893e4 feat: implement IPC handlers fo…, bfa73bf Add pastelería sugeridos, gasto…, c4fc4fe Use sessionStorage; add multi-w…] | lang=en
- "gestion": "gestion.js" | kind=code-symbol | source=gestion.js:L1 | neighbors=[155d086 Use sessionStorage and add mult…, 22e246f Add fiscal client and credit tr…, 29d31c1 feat: implement complete POS sy…, 753cf10 Add revert-delivery feature and…, 821d5ac feat: implement system-wide ord…, bd7e03e Rebrand to Tienda de Kary and a…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@bd7e03e6e81f22fc181eee93172faf19d1a822a0": "bd7e03e Rebrand to Tienda de Kary and add mayorista support" | kind=Commit | source=git | neighbors=[admin.js, arqueo.js, Tienda-Kary, a4cb7fc Add ability to revert delivered…, connection.js, schema.js] | lang=en
- "ipc_registerpedidosipc": "registerPedidosIpc.js" | kind=code-symbol | source=ipc/registerPedidosIpc.js:L1 | neighbors=[10222a9 refactor: enforce full payment …, 2812d87 feat: implementa módulo de cier…, 6f9f2fb Merge branch 'delipostres-turba…, 753cf10 Add revert-delivery feature and…, 821d5ac feat: implement system-wide ord…, 9140912 Add PostgreSQL sync and turno m…] | lang=en
- "ipc_registersucursalesipc": "registerSucursalesIpc.js" | kind=code-symbol | source=ipc/registerSucursalesIpc.js:L1 | neighbors=[10222a9 refactor: enforce full payment …, 29d31c1 feat: implement complete POS sy…, 5bfc128 feat: implement synchronization…, 6a58133 Make Supabase optional; use pac…, 821d5ac feat: implement system-wide ord…, 85893e4 feat: implement IPC handlers fo…] | lang=en
- "sync_schema_camisetas_supabase": "schema_camisetas_supabase.sql" | kind=code-symbol | source=sync/schema_camisetas_supabase.sql:L1 | neighbors=[bd7e03e Rebrand to Tienda de Kary and a…, lww_guard_movimientos_inventario, public.abonos_credito, public.abonos_pedido, public.assign_sync_seq(), public.categorias] | lang=en
- "services_gastoservice": "gastoService.js" | kind=code-symbol | source=services/gastoService.js:L1 | neighbors=[bfa73bf Add pastelería sugeridos, gasto…, registerGastosIpc.js, connection.js, db, runQuery(), auditService.js] | lang=en
- "sync_supabaseclients": "supabaseClients.js" | kind=code-symbol | source=sync/supabaseClients.js:L1 | neighbors=[1dd520d Add configurable PostgreSQL syn…, 29d31c1 feat: implement complete POS sy…, 5bfc128 feat: implement synchronization…, 6a58133 Make Supabase optional; use pac…, 9140912 Add PostgreSQL sync and turno m…, b08f3b6 Aislar configuración de Supabas…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@c4fc4fe91f9dc5be1b9208086f877bb064b7f3f5": "c4fc4fe Use sessionStorage; add multi-window & sync" | kind=Commit | source=git | neighbors=[b08f3b6 Aislar configuración de Supabas…, admin.js, admin-audit-logs.js, arqueo.js, delipostres-turbaco, b9061d3 Mejoras de sesión, reportes y d…] | lang=en
- "dashboard": "dashboard.js" | kind=code-symbol | source=dashboard.js:L1 | neighbors=[155d086 Use sessionStorage and add mult…, 29d31c1 feat: implement complete POS sy…, 4cf89eb feat: implement centralized ven…, 753cf10 Add revert-delivery feature and…, 821d5ac feat: implement system-wide ord…, aa81749 feat: implement real-time inven…] | lang=en
- "services_printservice": "printService.js" | kind=code-symbol | source=services/printService.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, 821d5ac feat: implement system-wide ord…, 85893e4 feat: implement IPC handlers fo…, registerImpresionIpc.js, { construirTicketBuffer, construirTicke…, enviarBytesCrudosAImpresora()] | lang=en
- "sync_remotedbclient_querybuilder": "QueryBuilder" | kind=code-symbol | source=sync/remoteDbClient.js:L77 | neighbors=[remoteDbClient.js, .constructor(), .delete(), .eq(), .gt(), .gte()] | lang=en
- "services_auditservice": "auditService.js" | kind=code-symbol | source=services/auditService.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, b9061d3 Mejoras de sesión, reportes y d…, registerClientesIpc.js, registerGastosIpc.js, registerProductosIpc.js, registerSucursalesIpc.js] | lang=en
- "services_ticketescpos": "ticketEscPos.js" | kind=code-symbol | source=services/ticketEscPos.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, 821d5ac feat: implement system-wide ord…, b9061d3 Mejoras de sesión, reportes y d…, bd7e03e Rebrand to Tienda de Kary and a…, bfa73bf Add pastelería sugeridos, gasto…, fa97bc4 Mostrar descuentos y subtotales…] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-000.json

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
