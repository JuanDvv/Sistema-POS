# Node Description Batch 15 of 24

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

- "admin_audit_logs_escapehtml": "escapeHtml()" | kind=code-symbol | source=admin-audit-logs.js:L235 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_formateardetallesconnombreproducto": "formatearDetallesConNombreProducto()" | kind=code-symbol | source=admin-audit-logs.js:L218 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_formatearencabezadodia": "formatearEncabezadoDia()" | kind=code-symbol | source=admin-audit-logs.js:L257 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_formatearfechabogota": "formatearFechaBogota()" | kind=code-symbol | source=admin-audit-logs.js:L241 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_formatearfechasisoendetalles": "formatearFechasIsoEnDetalles()" | kind=code-symbol | source=admin-audit-logs.js:L229 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_mapaproductos": "mapaProductos" | kind=code-symbol | source=admin-audit-logs.js:L9 | neighbors=[admin-audit-logs.js]
- "admin_audit_logs_restaurarfiltrosdesdestorage": "restaurarFiltrosDesdeStorage()" | kind=code-symbol | source=admin-audit-logs.js:L31 | neighbors=[admin-audit-logs.js]
- "admin_btnclosedetallesolicitud": "btnCloseDetalleSolicitud" | kind=code-symbol | source=admin.js:L1067 | neighbors=[admin.js]
- "admin_btnclosedetallesolicitudgasto": "btnCloseDetalleSolicitudGasto" | kind=code-symbol | source=admin.js:L1215 | neighbors=[admin.js]
- "admin_btnclosesucursalbloqueada": "btnCloseSucursalBloqueada" | kind=code-symbol | source=admin.js:L611 | neighbors=[admin.js]
- "admin_cargarabonoseliminados": "cargarAbonosEliminados()" | kind=code-symbol | source=admin.js:L1233 | neighbors=[admin.js]
- "admin_cargarcategorias": "cargarCategorias()" | kind=code-symbol | source=admin.js:L663 | neighbors=[admin.js]
- "admin_cargarseccionimpresora": "cargarSeccionImpresora()" | kind=code-symbol | source=admin.js:L1277 | neighbors=[admin.js]
- "admin_cargarsolicitudes": "cargarSolicitudes()" | kind=code-symbol | source=admin.js:L913 | neighbors=[admin.js]
- "admin_cargarsolicitudesgasto": "cargarSolicitudesGasto()" | kind=code-symbol | source=admin.js:L1101 | neighbors=[admin.js]
- "admin_cargarsucursales": "cargarSucursales()" | kind=code-symbol | source=admin.js:L453 | neighbors=[admin.js]
- "admin_cargarusuarios": "cargarUsuarios()" | kind=code-symbol | source=admin.js:L503 | neighbors=[admin.js]
- "admin_mostrarmodalsucursalbloqueada": "mostrarModalSucursalBloqueada()" | kind=code-symbol | source=admin.js:L586 | neighbors=[admin.js]
- "admin_rellenarcategoriaspadreselect": "rellenarCategoriasPadreSelect()" | kind=code-symbol | source=admin.js:L728 | neighbors=[admin.js]
- "admin_resumensolicitud": "resumenSolicitud()" | kind=code-symbol | source=admin.js:L887 | neighbors=[admin.js]
- "admin_resumensolicitudgasto": "resumenSolicitudGasto()" | kind=code-symbol | source=admin.js:L1081 | neighbors=[admin.js]
- "admin_todoslosclientes": "todosLosClientes" | kind=code-symbol | source=admin.js:L772 | neighbors=[admin.js]
- "admin_ultimassolicitudescargadas": "ultimasSolicitudesCargadas" | kind=code-symbol | source=admin.js:L911 | neighbors=[admin.js]
- "admin_ultimassolicitudesgastocargadas": "ultimasSolicitudesGastoCargadas" | kind=code-symbol | source=admin.js:L1099 | neighbors=[admin.js]
- "arqueo_guardarvalorescuadre": "guardarValoresCuadre()" | kind=code-symbol | source=arqueo.js:L18 | neighbors=[arqueo.js]
- "arqueo_inicializarsplitter": "inicializarSplitter()" | kind=code-symbol | source=arqueo.js:L45 | neighbors=[arqueo.js]
- "arqueo_restaurarvalorescuadre": "restaurarValoresCuadre()" | kind=code-symbol | source=arqueo.js:L26 | neighbors=[arqueo.js]
- "branch:repo:github.com/JuanDvv/Sistema-POS#main": "main" | kind=Branch | source=git | neighbors=[db673ca Initial commit]
- "categoriafiltro_crearfiltrocategorias": "crearFiltroCategorias()" | kind=code-symbol | source=categoriaFiltro.js:L11 | neighbors=[categoriaFiltro.js]
- "dashboard_actualizaraccesoabastecimientomasivo": "actualizarAccesoAbastecimientoMasivo()" | kind=code-symbol | source=dashboard.js:L373 | neighbors=[dashboard.js]
- "dashboard_categoriascargadas": "categoriasCargadas" | kind=code-symbol | source=dashboard.js:L11 | neighbors=[dashboard.js]
- "dashboard_formatcop": "formatCOP()" | kind=code-symbol | source=dashboard.js:L20 | neighbors=[dashboard.js]
- "dashboard_formatnumberui": "formatNumberUI()" | kind=code-symbol | source=dashboard.js:L21 | neighbors=[dashboard.js]
- "dashboard_idsrecienactualizados": "idsRecienActualizados" | kind=code-symbol | source=dashboard.js:L16 | neighbors=[dashboard.js]
- "dashboard_parsenumberui": "parseNumberUI()" | kind=code-symbol | source=dashboard.js:L26 | neighbors=[dashboard.js]
- "dashboard_productoscargados": "productosCargados" | kind=code-symbol | source=dashboard.js:L10 | neighbors=[dashboard.js]
- "dashboard_rellenarselectoragrupado": "rellenarSelectorAgrupado()" | kind=code-symbol | source=dashboard.js:L69 | neighbors=[dashboard.js]
- "dashboard_renderizarpreviewabastecimientomasivo": "renderizarPreviewAbastecimientoMasivo()" | kind=code-symbol | source=dashboard.js:L686 | neighbors=[dashboard.js]
- "dashboard_tallas_ropa": "TALLAS_ROPA" | kind=code-symbol | source=dashboard.js:L33 | neighbors=[dashboard.js]
- "db_connection_app": "{ app }" | kind=code-symbol | source=db/connection.js:L1 | neighbors=[connection.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-014.json

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
