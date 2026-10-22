# Node Description Batch 2 of 24

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

- "commit:repo:github.com/JuanDvv/Sistema-POS@5bfc1288aaebd72bf725d1b457743f52d6eb2f4b": "5bfc128 feat: implement synchronization engine and database infrastructure to s…" | kind=Commit | source=git | neighbors=[admin.js, Tienda-Kary, delipostres-turbaco, 4cf89eb feat: implement centralized ven…, connection.js, schema.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@914091235d51ab648f8043293e6fcef71e7f4547": "9140912 Add PostgreSQL sync and turno management" | kind=Commit | source=git | neighbors=[22e246f Add fiscal client and credit tr…, admin.js, delipostres-turbaco, schema.js, registerClientesIpc.js, registerGastosIpc.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@cbc0980b6d69bedab0f70d3a45df48eb7cf41bc3": "cbc0980 feat: implement fiscal sales workflow with customer management and PDF …" | kind=Commit | source=git | neighbors=[6f9f2fb Merge branch 'delipostres-turba…, admin.js, arqueo.js, Tienda-Kary, delipostres-turbaco, bfa73bf Add pastelería sugeridos, gasto…] | lang=en
- "sync_syncservice_descargardesdecursor": "descargarDesdeCursor()" | kind=code-symbol | source=sync/syncService.js:L122 | neighbors=[syncService.js, descargarTodo(), esErrorColumnaInexistente(), obtenerCursor(), syncAbonos(), syncAbonosPedido()] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@753cf10ded27a6f456ef7d55419776f96e17f709": "753cf10 Add revert-delivery feature and focus fixes" | kind=Commit | source=git | neighbors=[admin.js, admin-audit-logs.js, arqueo.js, delipostres-turbaco, 98e6778 Update package.json, dashboard.js] | lang=en
- "ipc_registerreportesipc": "registerReportesIpc.js" | kind=code-symbol | source=ipc/registerReportesIpc.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, 821d5ac feat: implement system-wide ord…, 85893e4 feat: implement IPC handlers fo…, 9140912 Add PostgreSQL sync and turno m…, bfa73bf Add pastelería sugeridos, gasto…, cbc0980 feat: implement fiscal sales wo…] | lang=en
- "services_pdfhelpers": "pdfHelpers.js" | kind=code-symbol | source=services/pdfHelpers.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, b9061d3 Mejoras de sesión, reportes y d…, bd7e03e Rebrand to Tienda de Kary and a…, cbc0980 feat: implement fiscal sales wo…, fa97bc4 Mostrar descuentos y subtotales…, registerClientesIpc.js] | lang=en
- "sidebar": "sidebar.js" | kind=code-symbol | source=sidebar.js:L1 | neighbors=[155d086 Use sessionStorage and add mult…, 29d31c1 feat: implement complete POS sy…, 4cf89eb feat: implement centralized ven…, 821d5ac feat: implement system-wide ord…, 85893e4 feat: implement IPC handlers fo…, aa81749 feat: implement real-time inven…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@155d086196e16015392a5d33988295d23af0dc71": "155d086 Use sessionStorage and add multi-window support" | kind=Commit | source=git | neighbors=[admin.js, admin-audit-logs.js, arqueo.js, Tienda-Kary, 1dd520d Add configurable PostgreSQL syn…, dashboard.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@85893e46c054e4231091f6e2a96bfb5e8d69b316": "85893e4 feat: implement IPC handlers for financial reporting and add services f…" | kind=Commit | source=git | neighbors=[admin.js, Tienda-Kary, delipostres-turbaco, 4c924e9 feat: implement robust sync eng…, gastos.js, registerImpresionIpc.js] | lang=en
- "sync_syncservice_actualizarcursor": "actualizarCursor()" | kind=code-symbol | source=sync/syncService.js:L92 | neighbors=[syncService.js, syncAbonos(), syncAbonosPedido(), syncCategoriasDescargar(), syncCierresCaja(), syncClientes()] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@6f9f2fbc2b3184eecd4164bdd57bcd32f1e7d7a1": "6f9f2fb Merge branch 'delipostres-turbaco-cierres-parciales' into delipostres-t…" | kind=Commit | source=git | neighbors=[283a3fc feat: agrega splitter arrastrab…, 68efa36 refactor: replace localStorage …, arqueo.js, Tienda-Kary, delipostres-turbaco, cbc0980 feat: implement fiscal sales wo…] | lang=en
- "db_connection_runquery": "runQuery()" | kind=code-symbol | source=db/connection.js:L16 | neighbors=[connection.js, registerClientesIpc.js, registerGastosIpc.js, registerProductosIpc.js, registerSistemaIpc.js, registerSucursalesIpc.js] | lang=en
- "ipc_registerusuariosipc": "registerUsuariosIpc.js" | kind=code-symbol | source=ipc/registerUsuariosIpc.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, 5bfc128 feat: implement synchronization…, 85893e4 feat: implement IPC handlers fo…, c4fc4fe Use sessionStorage; add multi-w…, connection.js, allQuery()] | lang=en
- "preload": "preload.js" | kind=code-symbol | source=preload.js:L1 | neighbors=[155d086 Use sessionStorage and add mult…, 1dd520d Add configurable PostgreSQL syn…, 2812d87 feat: implementa módulo de cier…, 29d31c1 feat: implement complete POS sy…, 6f9f2fb Merge branch 'delipostres-turba…, 753cf10 Add revert-delivery feature and…] | lang=en
- "services_abonorecoveryservice": "abonoRecoveryService.js" | kind=code-symbol | source=services/abonoRecoveryService.js:L1 | neighbors=[6a58133 Make Supabase optional; use pac…, b08f3b6 Aislar configuración de Supabas…, bfa73bf Add pastelería sugeridos, gasto…, c4fc4fe Use sessionStorage; add multi-w…, registerAbonosIpc.js, connection.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@2812d87b9e98912ac7d54d789274ab993ad89540": "2812d87 feat: implementa módulo de cierres de caja con registro, auditoría y cá…" | kind=Commit | source=git | neighbors=[arqueo.js, Tienda-Kary, delipostres-turbaco, 68defea style: optimize layout and resp…, schema.js, registerCierresCajaIpc.js] | lang=nl
- "commit:repo:github.com/JuanDvv/Sistema-POS@b9061d3c06119dda317da6ba8b52ff17f67fe56d": "b9061d3 Mejoras de sesión, reportes y descuentos" | kind=Commit | source=git | neighbors=[arqueo.js, delipostres-turbaco, 22e246f Add fiscal client and credit tr…, registerClientesIpc.js, registerSistemaIpc.js, registerVentasIpc.js] | lang=en
- "db_schema": "schema.js" | kind=code-symbol | source=db/schema.js:L1 | neighbors=[2812d87 feat: implementa módulo de cier…, 29d31c1 feat: implement complete POS sy…, 308b9c1 feat: implement incremental syn…, 5bfc128 feat: implement synchronization…, 6f9f2fb Merge branch 'delipostres-turba…, 821d5ac feat: implement system-wide ord…] | lang=en
- "sync_schema_camisetas_supabase_trg_lww_guard": "trg_lww_guard" | kind=code-symbol | source=sync/schema_camisetas_supabase.sql:L280 | neighbors=[schema_camisetas_supabase.sql, public.abonos_credito, public.categorias, public.clientes, public.config_sucursal, public.detalle_transferencias] | lang=en
- "sync_syncservice_upsertconlww": "upsertConLWW()" | kind=code-symbol | source=sync/syncService.js:L53 | neighbors=[syncService.js, repararDetalleVentasHuerfanas(), syncAbonos(), syncAbonosPedido(), syncCategoriasSubir(), syncCierresCaja()] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@308b9c123357e59bec970ee6ca72d033a6299836": "308b9c1 feat: implement incremental synchronization, atomic inventory correctio…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, aa81749 feat: implement real-time inven…, schema.js, registerProductosIpc.js, inventarioMovimientoService.js] | lang=en
- "db_connection_allquery": "allQuery()" | kind=code-symbol | source=db/connection.js:L23 | neighbors=[connection.js, registerClientesIpc.js, registerGastosIpc.js, registerPedidosIpc.js, registerProductosIpc.js, registerReportesIpc.js] | lang=en
- "ipc_registercierrescajaipc": "registerCierresCajaIpc.js" | kind=code-symbol | source=ipc/registerCierresCajaIpc.js:L1 | neighbors=[2812d87 feat: implementa módulo de cier…, 6f9f2fb Merge branch 'delipostres-turba…, bfa73bf Add pastelería sugeridos, gasto…, cbc0980 feat: implement fiscal sales wo…, { calcularVentanaYEsperado, registrarCi…, { ipcMain }] | lang=en
- "services_inventariomovimientoservice": "inventarioMovimientoService.js" | kind=code-symbol | source=services/inventarioMovimientoService.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, 308b9c1 feat: implement incremental syn…, 5bfc128 feat: implement synchronization…, registerGastosIpc.js, registerProductosIpc.js, gastoService.js] | lang=en
- "sync_schema_test_data_trg_lww_guard": "trg_lww_guard" | kind=code-symbol | source=sync/schema_test_data.sql:L315 | neighbors=[schema_test_data.sql, public.abonos_credito, public.categorias, public.clientes, public.config_sucursal, public.detalle_transferencias] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@10222a924fb96d31d11db98b96c729b7ad1c8ac5": "10222a9 refactor: enforce full payment for order delivery and implement dedicat…" | kind=Commit | source=git | neighbors=[admin.js, admin-audit-logs.js, Tienda-Kary, delipostres-turbaco, 84696d5 feat: enable client management …, connection.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@aeae7ec9a98f5359a4e6f62edaf723ec66bc6e55": "aeae7ec Smart product search and seed scripts" | kind=Commit | source=git | neighbors=[a4cb7fc Add ability to revert delivered…, Tienda-Kary, 6a58133 Make Supabase optional; use pac…, dashboard.js, pedidos.js, productoBuscador.js] | lang=en
- "ipc_registerimpresionipc": "registerImpresionIpc.js" | kind=code-symbol | source=ipc/registerImpresionIpc.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, 821d5ac feat: implement system-wide ord…, 85893e4 feat: implement IPC handlers fo…, { imprimirTicket, imprimirTicketPedido,…, { ipcMain, BrowserWindow }, registerImpresionIpc()] | lang=en
- "scripts_seed_camisetas": "seed_camisetas.sql" | kind=code-symbol | source=scripts/seed_camisetas.sql:L1 | neighbors=[6a58133 Make Supabase optional; use pac…, aeae7ec Smart product search and seed s…, CATEGORIAS, COLORES, fs, generarCatalogo()] | lang=en
- "sync_conciliar_saldo_apertura": "conciliar_saldo_apertura.js" | kind=code-symbol | source=sync/conciliar_saldo_apertura.js:L1 | neighbors=[308b9c1 feat: implement incremental syn…, aplicar, args, calcularDiferencias(), cliente, { createClient }] | lang=en
- "sync_syncservice_softdeleteconlww": "softDeleteConLWW()" | kind=code-symbol | source=sync/syncService.js:L161 | neighbors=[syncService.js, nowISO(), syncAbonos(), syncAbonosPedido(), syncCategoriasEliminaciones(), syncCierresCaja()] | lang=en
- "services_auditservice_registrarauditoria": "registrarAuditoria()" | kind=code-symbol | source=services/auditService.js:L19 | neighbors=[registerClientesIpc.js, registerGastosIpc.js, registerProductosIpc.js, registerSucursalesIpc.js, registerUsuariosIpc.js, registerVentasIpc.js] | lang=en
- "services_serverconfigservice": "serverConfigService.js" | kind=code-symbol | source=services/serverConfigService.js:L1 | neighbors=[1dd520d Add configurable PostgreSQL syn…, 9140912 Add PostgreSQL sync and turno m…, registerSistemaIpc.js, { app }, DEFAULT_CONFIG, fs] | lang=en
- "sync_diagnostico_sync_seq": "diagnostico_sync_seq.js" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L1 | neighbors=[308b9c1 feat: implement incremental syn…, args, cliente, { createClient }, leerTodo(), main()] | lang=en
- "sync_remotedbclient": "remoteDbClient.js" | kind=code-symbol | source=sync/remoteDbClient.js:L1 | neighbors=[1dd520d Add configurable PostgreSQL syn…, 9140912 Add PostgreSQL sync and turno m…, registerSistemaIpc.js, serverConfigService.js, obtenerConfigServidor(), getPool()] | lang=en
- "sync_reset_and_seed_test": "reset_and_seed_test.js" | kind=code-symbol | source=sync/reset_and_seed_test.js:L1 | neighbors=[cbc0980 feat: implement fiscal sales wo…, borrarSqliteLocalDeTest(), { createClient }, { execFileSync }, fs, main()] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@6a581336d137dfad12d78317c56e925fbc521fff": "6a58133 Make Supabase optional; use package-based DB names" | kind=Commit | source=git | neighbors=[Tienda-Kary, fa97bc4 Mostrar descuentos y subtotales…, connection.js, registerAuditoriaIpc.js, registerSucursalesIpc.js, seed_apliques.sql] | lang=pt
- "db_connection_db": "db" | kind=code-symbol | source=db/connection.js:L14 | neighbors=[connection.js, registerClientesIpc.js, registerGastosIpc.js, registerPedidosIpc.js, registerSucursalesIpc.js, registerUsuariosIpc.js] | lang=en
- "ipc_registerauditoriaipc": "registerAuditoriaIpc.js" | kind=code-symbol | source=ipc/registerAuditoriaIpc.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, 6a58133 Make Supabase optional; use pac…, b08f3b6 Aislar configuración de Supabas…, bfa73bf Add pastelería sugeridos, gasto…, ee31f83 feat: improve order list format…, { ipcMain }] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-001.json

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
