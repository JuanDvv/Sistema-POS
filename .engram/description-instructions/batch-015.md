# Node Description Batch 16 of 25

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

- "admin_cargarsolicitudes": "cargarSolicitudes()" | kind=code-symbol | source=admin.js:L882 | neighbors=[admin.js]
- "admin_cargarsolicitudesgasto": "cargarSolicitudesGasto()" | kind=code-symbol | source=admin.js:L1070 | neighbors=[admin.js]
- "admin_cargarsucursales": "cargarSucursales()" | kind=code-symbol | source=admin.js:L437 | neighbors=[admin.js]
- "admin_cargartablapedidoextra": "cargarTablaPedidoExtra()" | kind=code-symbol | source=admin.js:L1505 | neighbors=[admin.js]
- "admin_cargarusuarios": "cargarUsuarios()" | kind=code-symbol | source=admin.js:L484 | neighbors=[admin.js]
- "admin_categoriascargadaspasteleria": "categoriasCargadasPasteleria" | kind=code-symbol | source=admin.js:L1323 | neighbors=[admin.js]
- "admin_descargarexcelpedidoextra": "descargarExcelPedidoExtra()" | kind=code-symbol | source=admin.js:L1536 | neighbors=[admin.js]
- "admin_descargarexcelsugeridospasteleria": "descargarExcelSugeridosPasteleria()" | kind=code-symbol | source=admin.js:L1449 | neighbors=[admin.js]
- "admin_escategoriapasteleriaadmin": "esCategoriaPasteleriaAdmin()" | kind=code-symbol | source=admin.js:L1333 | neighbors=[admin.js]
- "admin_limpiartablapedidoextra": "limpiarTablaPedidoExtra()" | kind=code-symbol | source=admin.js:L1500 | neighbors=[admin.js]
- "admin_mostrarmodalsucursalbloqueada": "mostrarModalSucursalBloqueada()" | kind=code-symbol | source=admin.js:L564 | neighbors=[admin.js]
- "admin_rellenarcategoriaspadreselect": "rellenarCategoriasPadreSelect()" | kind=code-symbol | source=admin.js:L703 | neighbors=[admin.js]
- "admin_resumensolicitud": "resumenSolicitud()" | kind=code-symbol | source=admin.js:L856 | neighbors=[admin.js]
- "admin_resumensolicitudgasto": "resumenSolicitudGasto()" | kind=code-symbol | source=admin.js:L1050 | neighbors=[admin.js]
- "admin_sugeridospasteleriacache": "sugeridosPasteleriaCache" | kind=code-symbol | source=admin.js:L1375 | neighbors=[admin.js]
- "admin_todoslosclientes": "todosLosClientes" | kind=code-symbol | source=admin.js:L745 | neighbors=[admin.js]
- "admin_ultimassolicitudescargadas": "ultimasSolicitudesCargadas" | kind=code-symbol | source=admin.js:L880 | neighbors=[admin.js]
- "admin_ultimassolicitudesgastocargadas": "ultimasSolicitudesGastoCargadas" | kind=code-symbol | source=admin.js:L1068 | neighbors=[admin.js]
- "arqueo_guardarvalorescuadre": "guardarValoresCuadre()" | kind=code-symbol | source=arqueo.js:L42 | neighbors=[arqueo.js]
- "arqueo_inicializarsplitter": "inicializarSplitter()" | kind=code-symbol | source=arqueo.js:L69 | neighbors=[arqueo.js]
- "arqueo_restaurarvalorescuadre": "restaurarValoresCuadre()" | kind=code-symbol | source=arqueo.js:L50 | neighbors=[arqueo.js]
- "branch:repo:github.com/JuanDvv/Sistema-POS#main": "main" | kind=Branch | source=git | neighbors=[db673ca Initial commit]
- "categoriafiltro_crearfiltrocategorias": "crearFiltroCategorias()" | kind=code-symbol | source=categoriaFiltro.js:L11 | neighbors=[categoriaFiltro.js]
- "dashboard_actualizaraccesoabastecimientomasivo": "actualizarAccesoAbastecimientoMasivo()" | kind=code-symbol | source=dashboard.js:L361 | neighbors=[dashboard.js]
- "dashboard_categoriascargadas": "categoriasCargadas" | kind=code-symbol | source=dashboard.js:L29 | neighbors=[dashboard.js]
- "dashboard_formatcop": "formatCOP()" | kind=code-symbol | source=dashboard.js:L38 | neighbors=[dashboard.js]
- "dashboard_formatnumberui": "formatNumberUI()" | kind=code-symbol | source=dashboard.js:L39 | neighbors=[dashboard.js]
- "dashboard_idsrecienactualizados": "idsRecienActualizados" | kind=code-symbol | source=dashboard.js:L34 | neighbors=[dashboard.js]
- "dashboard_parsenumberui": "parseNumberUI()" | kind=code-symbol | source=dashboard.js:L44 | neighbors=[dashboard.js]
- "dashboard_productoscargados": "productosCargados" | kind=code-symbol | source=dashboard.js:L28 | neighbors=[dashboard.js]
- "dashboard_rellenarselectoragrupado": "rellenarSelectorAgrupado()" | kind=code-symbol | source=dashboard.js:L54 | neighbors=[dashboard.js]
- "dashboard_renderizarpreviewabastecimientomasivo": "renderizarPreviewAbastecimientoMasivo()" | kind=code-symbol | source=dashboard.js:L674 | neighbors=[dashboard.js]
- "db_connection_app": "{ app }" | kind=code-symbol | source=db/connection.js:L1 | neighbors=[connection.js]
- "db_connection_dbpath": "dbPath" | kind=code-symbol | source=db/connection.js:L13 | neighbors=[connection.js]
- "db_connection_isprod": "{ isProd }" | kind=code-symbol | source=db/connection.js:L4 | neighbors=[connection.js]
- "db_connection_path": "path" | kind=code-symbol | source=db/connection.js:L2 | neighbors=[connection.js]
- "db_connection_pkg": "pkg" | kind=code-symbol | source=db/connection.js:L5 | neighbors=[connection.js]
- "db_connection_sqlite3": "sqlite3" | kind=code-symbol | source=db/connection.js:L3 | neighbors=[connection.js]
- "diagnostico_sync_cierre_db_allquery": "{ db, allQuery }" | kind=code-symbol | source=diagnostico_sync_cierre.js:L1 | neighbors=[diagnostico_sync_cierre.js]
- "diagnostico_sync_cierre_diagnosticar": "diagnosticar()" | kind=code-symbol | source=diagnostico_sync_cierre.js:L5 | neighbors=[diagnostico_sync_cierre.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-015.json

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
