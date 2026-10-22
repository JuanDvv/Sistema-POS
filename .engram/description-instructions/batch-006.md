# Node Description Batch 7 of 25

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
Write every description in English (en). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "sync_syncservice_synccategoriasdescargar": "syncCategoriasDescargar()" | kind=code-symbol | source=sync/syncService.js:L1120 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor()]
- "sync_syncservice_syncinventariodescargar": "syncInventarioDescargar()" | kind=code-symbol | source=sync/syncService.js:L1187 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor()]
- "sync_syncservice_syncproductosdescargar": "syncProductosDescargar()" | kind=code-symbol | source=sync/syncService.js:L1151 | neighbors=[syncService.js, procesarSincronizacion(), actualizarCursor(), descargarDesdeCursor()]
- "sync_syncservice_synctransferenciassubir": "syncTransferenciasSubir()" | kind=code-symbol | source=sync/syncService.js:L1498 | neighbors=[syncService.js, procesarSincronizacion(), nowISO(), upsertConLWW()]
- "sync_syncservice_syncventassubir": "syncVentasSubir()" | kind=code-symbol | source=sync/syncService.js:L278 | neighbors=[syncService.js, procesarSincronizacion(), nowISO(), upsertConLWW()]
- "transferencias_cargarcatalogo": "cargarCatalogo()" | kind=code-symbol | source=transferencias.js:L205 | neighbors=[transferencias.js, filtrarYRenderizarCatalogo(), cargarSucursales(), enviarTransferencia()]
- "transferencias_cargarsucursales": "cargarSucursales()" | kind=code-symbol | source=transferencias.js:L115 | neighbors=[transferencias.js, actualizarDestinosDisponibles(), cargarCatalogo(), renderizarCatalogo()]
- "transferencias_filtraryrenderizarcatalogo": "filtrarYRenderizarCatalogo()" | kind=code-symbol | source=transferencias.js:L216 | neighbors=[transferencias.js, cargarCatalogo(), normalizeStr(), renderizarCatalogo()]
- "transferencias_renderizarcarrito": "renderizarCarrito()" | kind=code-symbol | source=transferencias.js:L332 | neighbors=[transferencias.js, agregarACanasta(), cambiarCantidad(), enviarTransferencia()]
- "turnos_inicializarmoduloturnos": "inicializarModuloTurnos()" | kind=code-symbol | source=turnos.js:L199 | neighbors=[turnos.js, cargarOperadoresStorage(), poblarSelectoresOperadores(), renderizarTabla()]
- "utils_gastos_estados_devolucion": "ESTADOS_DEVOLUCION" | kind=code-symbol | source=utils/gastos.js:L11 | neighbors=[registerGastosIpc.js, registerReportesIpc.js, gastoService.js, gastos.js]
- "utils_gastos_tipos_gasto": "TIPOS_GASTO" | kind=code-symbol | source=utils/gastos.js:L1 | neighbors=[registerGastosIpc.js, registerReportesIpc.js, gastoService.js, gastos.js]
- "ventas_anteriores_cargarcatalogo": "cargarCatalogo()" | kind=code-symbol | source=ventas-anteriores.js:L777 | neighbors=[ventas-anteriores.js, filtrarYRenderizarCatalogo(), eliminarVentaExistente(), guardarVenta()]
- "ventas_anteriores_cargarlistaventasdia": "cargarListaVentasDia()" | kind=code-symbol | source=ventas-anteriores.js:L522 | neighbors=[ventas-anteriores.js, cambiarModo(), cancelarEdicion(), eliminarVentaExistente()]
- "ventas_anteriores_eliminarventaexistente": "eliminarVentaExistente()" | kind=code-symbol | source=ventas-anteriores.js:L699 | neighbors=[ventas-anteriores.js, cargarCatalogo(), cargarListaVentasDia(), cargarMisSolicitudes()]
- "ventas_anteriores_formatcop": "formatCOP()" | kind=code-symbol | source=ventas-anteriores.js:L40 | neighbors=[ventas-anteriores.js, guardarVenta(), iniciarEdicionVenta(), renderizarCarrito()]
- "ventas_anteriores_mostrarpanelcatalogo": "mostrarPanelCatalogo()" | kind=code-symbol | source=ventas-anteriores.js:L493 | neighbors=[ventas-anteriores.js, cambiarModo(), cancelarEdicion(), iniciarEdicionVenta()]
- "ventas_anteriores_parsenumberui": "parseNumberUI()" | kind=code-symbol | source=ventas-anteriores.js:L46 | neighbors=[ventas-anteriores.js, calcularTotalVenta(), guardarVenta(), iniciarEdicionVenta()]
- "ventas_calculartotalventa": "calcularTotalVenta()" | kind=code-symbol | source=ventas.js:L120 | neighbors=[ventas.js, obtenerPorcentajeDescuento(), parseNumberUI(), renderizarCarrito()]
- "ventas_construirtickethtml": "construirTicketHTML()" | kind=code-symbol | source=ventas.js:L252 | neighbors=[ventas.js, formatCOP(), parseNumberUI(), imprimirTicket()]
- "ventas_filtraryrenderizarcatalogo": "filtrarYRenderizarCatalogo()" | kind=code-symbol | source=ventas.js:L1000 | neighbors=[ventas.js, cargarCatalogo(), normalizeStr(), renderizarCatalogo()]
- "ventas_guardarcarritotemporal": "guardarCarritoTemporal()" | kind=code-symbol | source=ventas.js:L132 | neighbors=[ventas.js, agregarAlCarrito(), cambiarCantidad(), deshacerUltimoAgregado()]
- "ventas_limpiarestadoventa": "limpiarEstadoVenta()" | kind=code-symbol | source=ventas.js:L1319 | neighbors=[ventas.js, actualizarEstadoBotonDeshacer(), actualizarEstadoDescuentoUI(), renderizarCarrito()]
- "admin_audit_logs_productoidspornombre": "productoIdsPorNombre()" | kind=code-symbol | source=admin-audit-logs.js:L226 | neighbors=[admin-audit-logs.js, cargarAuditoria(), normalizeStr()]
- "admin_cargarsugeridospasteleria": "cargarSugeridosPasteleria()" | kind=code-symbol | source=admin.js:L1396 | neighbors=[admin.js, renderTablaSugeridosPasteleria(), inicializarSugeridosPasteleria()]
- "admin_poblarselectorsucursal": "poblarSelectorSucursal()" | kind=code-symbol | source=admin.js:L1360 | neighbors=[admin.js, inicializarCalculadoraPedidoExtra(), inicializarSugeridosPasteleria()]
- "admin_rendertablasugeridospasteleria": "renderTablaSugeridosPasteleria()" | kind=code-symbol | source=admin.js:L1418 | neighbors=[admin.js, cargarSugeridosPasteleria(), normalizeStrPasteleria()]
- "arqueo_limpiarvalorescuadre": "limpiarValoresCuadre()" | kind=code-symbol | source=arqueo.js:L125 | neighbors=[arqueo.js, confirmarCierreCaja(), calcularTotales()]
- "arqueo_recalcularcierrecaja": "recalcularCierreCaja()" | kind=code-symbol | source=arqueo.js:L294 | neighbors=[arqueo.js, formatCOP(), refrescarHistorialTrasEdicion()]
- "categoriafiltro": "categoriaFiltro.js" | kind=code-symbol | source=categoriaFiltro.js:L1 | neighbors=[crearFiltroCategorias(), 29d31c1 feat: implement complete POS sy…, 821d5ac feat: implement system-wide ord…]
- "commit:repo:github.com/JuanDvv/Sistema-POS@61749d10a9a7ce7aa3970e6a4db5c891ecde1b21": "61749d1 Merge branch 'delipostres-turbaco' of https://github.com/JuanDvv/Sistem…" | kind=Commit | source=git | neighbors=[395c0c1 Add PostgreSQL sync and turno m…, delipostres-turbaco, 9140912 Add PostgreSQL sync and turno m…]
- "commit:repo:github.com/JuanDvv/Sistema-POS@98e677833a15dc6e902b7af3ff1c9a1bdb1ec05c": "98e6778 Update package.json" | kind=Commit | source=git | neighbors=[753cf10 Add revert-delivery feature and…, delipostres-turbaco, b08f3b6 Aislar configuración de Supabas…]
- "commit:repo:github.com/JuanDvv/Sistema-POS@f57487fb5e134dec5a63652a47bdb251f1d22a16": "f57487f Merge branch 'Tienda-Kary' of https://github.com/JuanDvv/Sistema-POS in…" | kind=Commit | source=git | neighbors=[58e2652 Add volume discounts and secure…, e089d11 Add volume discounts and secure…, Tienda-Kary]
- "gastos_actualizarmontogeneral": "actualizarMontoGeneral()" | kind=code-symbol | source=gastos.js:L199 | neighbors=[gastos.js, formatNumberUI(), obtenerProductosVencidos()]
- "gastos_cargardatosdesucursal": "cargarDatosDeSucursal()" | kind=code-symbol | source=gastos.js:L264 | neighbors=[gastos.js, cargarDescripcionesFrecuentesOperativo(), poblarMapaProductos()]
- "gastos_formatnumberui": "formatNumberUI()" | kind=code-symbol | source=gastos.js:L29 | neighbors=[gastos.js, actualizarMontoGeneral(), actualizarValorFila()]
- "gestion_calcularestadocreditos": "calcularEstadoCreditos()" | kind=code-symbol | source=gestion.js:L958 | neighbors=[gestion.js, exportarCreditosExcel(), renderizarTabCreditos()]
- "gestion_calcularrangofechasfiltro": "calcularRangoFechasFiltro()" | kind=code-symbol | source=gestion.js:L514 | neighbors=[gestion.js, cargarReporteCreditos(), cargarReportesGestion()]
- "gestion_formatcop": "formatCOP()" | kind=code-symbol | source=gestion.js:L1 | neighbors=[gestion.js, cargarReportesGestion(), renderizarTabCreditos()]
- "pedidos_actualizarsaldopendientedetalle": "actualizarSaldoPendienteDetalle()" | kind=code-symbol | source=pedidos.js:L267 | neighbors=[pedidos.js, formatCOP(), renderizarCarritoDetalle()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-006.json

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
