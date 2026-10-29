# Node Description Batch 4 of 6

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

- "repositories_auditoriarepository_listarlogsauditoria": "listarLogsAuditoria()" | kind=code-symbol | source=src/infrastructure/repositories/auditoriaRepository.js:L3 | neighbors=[server.js, auditoriaRepository.js]
- "repositories_authrepository_buscarusuarioporusername": "buscarUsuarioPorUsername()" | kind=code-symbol | source=src/infrastructure/repositories/authRepository.js:L5 | neighbors=[server.js, authRepository.js]
- "repositories_catalogorepository_abastecerstockproducto": "abastecerStockProducto()" | kind=code-symbol | source=src/infrastructure/repositories/catalogoRepository.js:L165 | neighbors=[server.js, catalogoRepository.js]
- "repositories_catalogorepository_crearproductoconinventario": "crearProductoConInventario()" | kind=code-symbol | source=src/infrastructure/repositories/catalogoRepository.js:L48 | neighbors=[server.js, catalogoRepository.js]
- "repositories_catalogorepository_editarproductoconinventario": "editarProductoConInventario()" | kind=code-symbol | source=src/infrastructure/repositories/catalogoRepository.js:L96 | neighbors=[server.js, catalogoRepository.js]
- "repositories_catalogorepository_eliminarcategoriasoftdelete": "eliminarCategoriaSoftDelete()" | kind=code-symbol | source=src/infrastructure/repositories/catalogoRepository.js:L262 | neighbors=[server.js, catalogoRepository.js]
- "repositories_catalogorepository_eliminarproductosoftdelete": "eliminarProductoSoftDelete()" | kind=code-symbol | source=src/infrastructure/repositories/catalogoRepository.js:L198 | neighbors=[server.js, catalogoRepository.js]
- "repositories_catalogorepository_guardarcategoria": "guardarCategoria()" | kind=code-symbol | source=src/infrastructure/repositories/catalogoRepository.js:L222 | neighbors=[server.js, catalogoRepository.js]
- "repositories_catalogorepository_listarcatalogoporsucursal": "listarCatalogoPorSucursal()" | kind=code-symbol | source=src/infrastructure/repositories/catalogoRepository.js:L5 | neighbors=[server.js, catalogoRepository.js]
- "repositories_reportediariorepository_construirtimestampparadia": "construirTimestampParaDia()" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L430 | neighbors=[reporteDiarioRepository.js, crearGastoEnReporte()]
- "repositories_reportediariorepository_describircambiosproductos": "describirCambiosProductos()" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L19 | neighbors=[reporteDiarioRepository.js, editarVentaEnReporte()]
- "repositories_reportediariorepository_obtenerdetalleventaporid": "obtenerDetalleVentaPorId()" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L169 | neighbors=[server.js, reporteDiarioRepository.js]
- "repositories_solicitudesrepository_listaroperadores": "listarOperadores()" | kind=code-symbol | source=src/infrastructure/repositories/solicitudesRepository.js:L83 | neighbors=[server.js, solicitudesRepository.js]
- "repositories_solicitudesrepository_listarsolicitudesgasto": "listarSolicitudesGasto()" | kind=code-symbol | source=src/infrastructure/repositories/solicitudesRepository.js:L43 | neighbors=[server.js, solicitudesRepository.js]
- "repositories_solicitudesrepository_listarsolicitudesventa": "listarSolicitudesVenta()" | kind=code-symbol | source=src/infrastructure/repositories/solicitudesRepository.js:L3 | neighbors=[server.js, solicitudesRepository.js]
- "repositories_sucursalrepository_listarsucursalesvigentes": "listarSucursalesVigentes()" | kind=code-symbol | source=src/infrastructure/repositories/sucursalRepository.js:L3 | neighbors=[server.js, sucursalRepository.js]
- "shared_clock_obtenertimestamplww": "obtenerTimestampLWW()" | kind=code-symbol | source=src/domain/shared/clock.js:L47 | neighbors=[clock.js, obtenerPartesWallClock()]
- "web_app_abrirmodaldetallesolgasto": "abrirModalDetalleSolGasto()" | kind=code-symbol | source=src/presentation/web/app.js:L1768 | neighbors=[app.js, formatearFechaAuditoria()]
- "web_app_abrirmodaldetallesolventa": "abrirModalDetalleSolVenta()" | kind=code-symbol | source=src/presentation/web/app.js:L1627 | neighbors=[app.js, formatearFechaAuditoria()]
- "web_app_badgeturnohtml": "badgeTurnoHtml()" | kind=code-symbol | source=src/presentation/web/app.js:L1487 | neighbors=[app.js, cargarTurnosAdmin()]
- "web_app_cambiarfechainicioturnos": "cambiarFechaInicioTurnos()" | kind=code-symbol | source=src/presentation/web/app.js:L1493 | neighbors=[app.js, cargarTurnosAdmin()]
- "web_app_cargaroperadoresturnosstorage": "cargarOperadoresTurnosStorage()" | kind=code-symbol | source=src/presentation/web/app.js:L1475 | neighbors=[app.js, cargarTurnosAdmin()]
- "web_app_limpiarbuscadorproductoventa": "limpiarBuscadorProductoVenta()" | kind=code-symbol | source=src/presentation/web/app.js:L921 | neighbors=[app.js, poblarSelectProductosEnVenta()]
- "web_app_mostrartoast": "mostrarToast()" | kind=code-symbol | source=src/presentation/web/app.js:L180 | neighbors=[app.js, abrirModalEditarVenta()]
- "web_app_poblarselectorescategorias": "poblarSelectoresCategorias()" | kind=code-symbol | source=src/presentation/web/app.js:L257 | neighbors=[app.js, cargarCatalogo()]
- "web_app_recalculartotalventamodal": "recalcularTotalVentaModal()" | kind=code-symbol | source=src/presentation/web/app.js:L1018 | neighbors=[app.js, abrirModalEditarVenta()]
- "web_app_rendercategorias": "renderCategorias()" | kind=code-symbol | source=src/presentation/web/app.js:L345 | neighbors=[app.js, cargarCatalogo()]
- "web_app_rendereditingventaitems": "renderEditingVentaItems()" | kind=code-symbol | source=src/presentation/web/app.js:L971 | neighbors=[app.js, abrirModalEditarVenta()]
- "web_app_renderproductos": "renderProductos()" | kind=code-symbol | source=src/presentation/web/app.js:L285 | neighbors=[app.js, cargarCatalogo()]
- "web_app_rendersucursales": "renderSucursales()" | kind=code-symbol | source=src/presentation/web/app.js:L232 | neighbors=[app.js, restaurarSesion()]
- "web_app_resolverproductoseleccionadooescrito": "resolverProductoSeleccionadoOEscrito()" | kind=code-symbol | source=src/presentation/web/app.js:L1093 | neighbors=[app.js, normalizarTextoBusqueda()]
- "web_app_resumensolicitudgastoweb": "resumenSolicitudGastoWeb()" | kind=code-symbol | source=src/presentation/web/app.js:L1699 | neighbors=[app.js, cargarSolicitudesGastosAdmin()]
- "web_app_resumensolicitudventaweb": "resumenSolicitudVentaWeb()" | kind=code-symbol | source=src/presentation/web/app.js:L1551 | neighbors=[app.js, cargarSolicitudesVentasAdmin()]
- "web_app_verificarsaludservidor": "verificarSaludServidor()" | kind=code-symbol | source=src/presentation/web/app.js:L215 | neighbors=[app.js, apiFetch()]
- "admin_turnosdomain_base_utc": "BASE_UTC" | kind=code-symbol | source=src/domain/admin/turnosDomain.js:L3 | neighbors=[turnosDomain.js]
- "admin_turnosdomain_ciclo_turnos": "CICLO_TURNOS" | kind=code-symbol | source=src/domain/admin/turnosDomain.js:L1 | neighbors=[turnosDomain.js]
- "admin_turnosdomain_dias_semana": "DIAS_SEMANA" | kind=code-symbol | source=src/domain/admin/turnosDomain.js:L2 | neighbors=[turnosDomain.js]
- "admin_turnosdomain_operadores_default": "OPERADORES_DEFAULT" | kind=code-symbol | source=src/domain/admin/turnosDomain.js:L4 | neighbors=[turnosDomain.js]
- "auth_authdomain_crypto": "crypto" | kind=code-symbol | source=src/domain/auth/authDomain.js:L1 | neighbors=[authDomain.js]
- "branch:repo:github.com/JuanDvv/Sistema-POS#main": "main" | kind=Branch | source=git | neighbors=[db673ca Initial commit]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\Aplicacion-Web-POS\.engram\description-instructions\batch-003.json

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
