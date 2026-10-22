# Node Description Batch 3 of 25

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

- "pedidos_abrirdetallepedido": "abrirDetallePedido()" | kind=code-symbol | source=pedidos.js:L633 | neighbors=[pedidos.js, aplicarPermisosDetalle(), badgeEstado(), formatCOP(), formatFechaLegible(), formatNumberUI()] | lang=en
- "sync_diagnostico_sync_seq": "diagnostico_sync_seq.js" | kind=code-symbol | source=sync/diagnostico_sync_seq.js:L1 | neighbors=[308b9c1 feat: implement incremental syn…, args, cliente, { createClient }, leerTodo(), main()] | lang=en
- "sync_reset_and_seed_test": "reset_and_seed_test.js" | kind=code-symbol | source=sync/reset_and_seed_test.js:L1 | neighbors=[cbc0980 feat: implement fiscal sales wo…, borrarSqliteLocalDeTest(), { createClient }, { execFileSync }, fs, main()] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@1dd520d6c78c3462a9cfd6ad19a7e915373ff57e": "1dd520d Add configurable PostgreSQL sync backend" | kind=Commit | source=git | neighbors=[155d086 Use sessionStorage and add mult…, Tienda-Kary, 58e2652 Add volume discounts and secure…, e089d11 Add volume discounts and secure…, registerSistemaIpc.js, preload.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@58e26523dd06ac6093864aba3231fab5a5c59b60": "58e2652 Add volume discounts and secure DB config" | kind=Commit | source=git | neighbors=[1dd520d Add configurable PostgreSQL syn…, admin.js, Tienda-Kary, f57487f Merge branch 'Tienda-Kary' of h…, schema.js, registerProductosIpc.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@e089d1109570baf5373f24418ef712b2a689cded": "e089d11 Add volume discounts and secure DB config" | kind=Commit | source=git | neighbors=[1dd520d Add configurable PostgreSQL syn…, admin.js, Tienda-Kary, f57487f Merge branch 'Tienda-Kary' of h…, schema.js, registerProductosIpc.js] | lang=en
- "ipc_registerauditoriaipc": "registerAuditoriaIpc.js" | kind=code-symbol | source=ipc/registerAuditoriaIpc.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, 6a58133 Make Supabase optional; use pac…, b08f3b6 Aislar configuración de Supabas…, bfa73bf Add pastelería sugeridos, gasto…, ee31f83 feat: improve order list format…, { ipcMain }] | lang=en
- "sync_diagnostico_stock_vs_kardex": "diagnostico_stock_vs_kardex.js" | kind=code-symbol | source=sync/diagnostico_stock_vs_kardex.js:L1 | neighbors=[308b9c1 feat: implement incremental syn…, 5bfc128 feat: implement synchronization…, args, cliente, { createClient }, leerTodo()] | lang=en
- "sync_syncservice_normalizarfechastring": "normalizarFechaString()" | kind=code-symbol | source=sync/syncService.js:L50 | neighbors=[syncService.js, syncAbonosPedido(), syncCierresCaja(), syncGastosDescargar(), syncMovimientosInventarioDescargar(), syncPedidosDescargar()] | lang=en
- "ventas_renderizarcarrito": "renderizarCarrito()" | kind=code-symbol | source=ventas.js:L1234 | neighbors=[ventas.js, agregarAlCarrito(), cambiarCantidad(), deshacerUltimoAgregado(), limpiarEstadoVenta(), actualizarEstadoBotonCobrar()] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@bda8c3f83e73ba2a9bd211f249aea7d361db3d5e": "bda8c3f feat: add branch location badges to UI, sort reports by date, and enabl…" | kind=Commit | source=git | neighbors=[9b92df4 feat: add event listener to ref…, admin-audit-logs.js, Tienda-Kary, delipostres-turbaco, 85893e4 feat: implement IPC handlers fo…, main.js] | lang=en
- "services_fechaservice": "fechaService.js" | kind=code-symbol | source=services/fechaService.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, registerClientesIpc.js, registerGastosIpc.js, registerPedidosIpc.js, registerVentasIpc.js, cierreCajaService.js] | lang=en
- "turnos": "turnos.js" | kind=code-symbol | source=turnos.js:L1 | neighbors=[395c0c1 Add PostgreSQL sync and turno m…, 9140912 Add PostgreSQL sync and turno m…, calcularTurno(), cargarOperadoresStorage(), generarBadgeTurno(), guardarOperadoresStorage()] | lang=en
- "utils_gastos": "gastos.js" | kind=code-symbol | source=utils/gastos.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, registerGastosIpc.js, registerReportesIpc.js, gastoService.js, construirDescripcionVencidos(), esGastoNoFinanciero()] | lang=en
- "ventas_anteriores_guardarventa": "guardarVenta()" | kind=code-symbol | source=ventas-anteriores.js:L1009 | neighbors=[ventas-anteriores.js, calcularTotalVenta(), cancelarEdicion(), cargarCatalogo(), cargarMisSolicitudes(), formatCOP()] | lang=en
- "ventas_anteriores_renderizarcarrito": "renderizarCarrito()" | kind=code-symbol | source=ventas-anteriores.js:L901 | neighbors=[ventas-anteriores.js, agregarAlCarrito(), cambiarCantidad(), iniciarEdicionVenta(), limpiarCarrito(), actualizarEstadoDescuentoUI()] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@4cf89eb3f06fc17b017c1f0397392a61b37a01e2": "4cf89eb feat: implement centralized ventaService for atomic transactions and ad…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 308b9c1 feat: implement incremental syn…, dashboard.js, renderer.js, ventaService.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@6a581336d137dfad12d78317c56e925fbc521fff": "6a58133 Make Supabase optional; use package-based DB names" | kind=Commit | source=git | neighbors=[Tienda-Kary, fa97bc4 Mostrar descuentos y subtotales…, connection.js, registerAuditoriaIpc.js, registerSucursalesIpc.js, abonoRecoveryService.js] | lang=pt
- "commit:repo:github.com/JuanDvv/Sistema-POS@a4cb7fc50d8051cad945a51fa212fe8f3e5aa009": "a4cb7fc Add ability to revert delivered orders (admin)" | kind=Commit | source=git | neighbors=[Tienda-Kary, aeae7ec Smart product search and seed s…, registerPedidosIpc.js, registerVentasIpc.js, pedidos.js, preload.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@b08f3b66edfe92842cac6536568eab021edc6645": "b08f3b6 Aislar configuración de Supabase y BD" | kind=Commit | source=git | neighbors=[98e6778 Update package.json, delipostres-turbaco, c4fc4fe Use sessionStorage; add multi-w…, connection.js, registerAuditoriaIpc.js, registerSucursalesIpc.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@ee31f83c19b04c6ad22d31f7f3e5e9d095da13ee": "ee31f83 feat: improve order list formatting, add pedidoService for transaction …" | kind=Commit | source=git | neighbors=[4c924e9 feat: implement robust sync eng…, admin-audit-logs.js, Tienda-Kary, delipostres-turbaco, 10222a9 refactor: enforce full payment …, schema.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@fa97bc4640826c4915b2d41fe2a1ff82a4c70c1c": "fa97bc4 Mostrar descuentos y subtotales en ventas" | kind=Commit | source=git | neighbors=[6a58133 Make Supabase optional; use pac…, Tienda-Kary, 155d086 Use sessionStorage and add mult…, registerVentasIpc.js, reportes.js, pdfHelpers.js] | lang=es
- "pedidos_registrarpedido": "registrarPedido()" | kind=code-symbol | source=pedidos.js:L401 | neighbors=[pedidos.js, cambiarTab(), cargarCatalogo(), cargarClientes(), cargarPedidos(), combinarFechaHoraEntrega()] | lang=en
- "sync_seed_test_from_prod": "seed_test_from_prod.js" | kind=code-symbol | source=sync/seed_test_from_prod.js:L1 | neighbors=[5bfc128 feat: implement synchronization…, cbc0980 feat: implement fiscal sales wo…, copiarTabla(), { createClient }, leerTodo(), main()] | lang=en
- "ventas_anteriores_iniciaredicionventa": "iniciarEdicionVenta()" | kind=code-symbol | source=ventas-anteriores.js:L584 | neighbors=[ventas-anteriores.js, actualizarEstadoDescuentoUI(), filtrarYRenderizarCatalogo(), formatCOP(), formatNumberUI(), isoToFechaDia()] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@aa8174959b218e1bd098df567b38fa1c746295f5": "aa81749 feat: implement real-time inventory change highlighting and add robust …" | kind=Commit | source=git | neighbors=[308b9c1 feat: implement incremental syn…, Tienda-Kary, delipostres-turbaco, ed98665 feat: add payment method select…, dashboard.js, registerGastosIpc.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@aeae7ec9a98f5359a4e6f62edaf723ec66bc6e55": "aeae7ec Smart product search and seed scripts" | kind=Commit | source=git | neighbors=[a4cb7fc Add ability to revert delivered…, Tienda-Kary, 6a58133 Make Supabase optional; use pac…, dashboard.js, pedidos.js, productoBuscador.js] | lang=en
- "ipc_registerabonosipc": "registerAbonosIpc.js" | kind=code-symbol | source=ipc/registerAbonosIpc.js:L1 | neighbors=[bfa73bf Add pastelería sugeridos, gasto…, { ipcMain }, { listarAbonosEliminados, recuperarAbon…, registerAbonosIpc(), abonoRecoveryService.js, listarAbonosEliminados()] | lang=en
- "pedidos_cargarpedidos": "cargarPedidos()" | kind=code-symbol | source=pedidos.js:L488 | neighbors=[pedidos.js, agregarAbono(), cancelarPedidoActual(), renderizarTablaPedidos(), entregarPedidoActual(), guardarCambiosPedido()] | lang=en
- "pedidos_renderizarcarritodetalle": "renderizarCarritoDetalle()" | kind=code-symbol | source=pedidos.js:L243 | neighbors=[pedidos.js, abrirDetallePedido(), agregarProductoAlDetalle(), cambiarCantidadDetalle(), actualizarSaldoPendienteDetalle(), formatCOP()] | lang=en
- "services_imagenservice": "imagenService.js" | kind=code-symbol | source=services/imagenService.js:L1 | neighbors=[29d31c1 feat: implement complete POS sy…, registerProductosIpc.js, main.js, { app }, fs, imagenesAppDir] | lang=en
- "sync_migrate_stock_delta_sync": "migrate_stock_delta_sync.sql" | kind=code-symbol | source=sync/migrate_stock_delta_sync.sql:L1 | neighbors=[5bfc128 feat: implement synchronization…, public.aplicar_movimiento_inventario(), public.aplicar_reserva_inventario(), public.inventario_sucursal, public.lww_guard(), public.movimientos_inventario] | lang=en
- "sync_repararfechassqlite": "repararFechasSQLite.js" | kind=code-symbol | source=sync/repararFechasSQLite.js:L1 | neighbors=[395c0c1 Add PostgreSQL sync and turno m…, 9140912 Add PostgreSQL sync and turno m…, db, dbPath, fs, path] | lang=en
- "sync_schema_postgres17_completo_public_productos": "public.productos" | kind=code-symbol | source=sync/schema_postgres17_completo.sql:L77 | neighbors=[schema_postgres17_completo.sql, public.detalle_pedidos, public.detalle_transferencias, public.inventario_sucursal, public.movimientos_inventario, public.movimientos_reserva_inventario] | lang=en
- "sync_syncservice_eserrortablainexistente": "esErrorTablaInexistente()" | kind=code-symbol | source=sync/syncService.js:L904 | neighbors=[syncService.js, syncAbonosPedido(), syncMovimientosInventarioDescargar(), syncMovimientosInventarioSubir(), syncPedidosDescargar(), syncPedidosSubir()] | lang=en
- "sync_syncservice_syncabonospedido": "syncAbonosPedido()" | kind=code-symbol | source=sync/syncService.js:L2001 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor(), esErrorTablaInexistente(), normalizarFechaString()] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@84696d51c982c096183d051502e6e573f946fe1d": "84696d5 feat: enable client management access for operators and add search func…" | kind=Commit | source=git | neighbors=[10222a9 refactor: enforce full payment …, admin.js, Tienda-Kary, delipostres-turbaco, 2812d87 feat: implementa módulo de cier…, 68efa36 refactor: replace localStorage …] | lang=en
- "pedidos_cargarcatalogo": "cargarCatalogo()" | kind=code-symbol | source=pedidos.js:L284 | neighbors=[pedidos.js, cancelarPedidoActual(), filtrarYRenderizarCatalogoPedido(), entregarPedidoActual(), guardarCambiosPedido(), registrarPedido()] | lang=en
- "pedidos_formatcop": "formatCOP()" | kind=code-symbol | source=pedidos.js:L46 | neighbors=[pedidos.js, abrirDetallePedido(), actualizarSaldoPendienteDetalle(), entregarPedidoActual(), renderizarCarritoDetalle(), renderizarCarritoEn()] | lang=en
- "pedidos_renderizarcarritopedido": "renderizarCarritoPedido()" | kind=code-symbol | source=pedidos.js:L210 | neighbors=[pedidos.js, agregarAlCarritoPedido(), cambiarCantidadPedido(), limpiarFormularioNuevoPedido(), formatCOP(), leerValorDomicilio()] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-002.json

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
