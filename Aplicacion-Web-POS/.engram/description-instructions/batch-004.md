# Node Description Batch 5 of 6

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

- "config_envconfig_fs": "fs" | kind=code-symbol | source=src/infrastructure/config/envConfig.js:L1 | neighbors=[envConfig.js]
- "config_envconfig_path": "path" | kind=code-symbol | source=src/infrastructure/config/envConfig.js:L2 | neighbors=[envConfig.js]
- "db_postgresclient_obtenerconfiguracionentorno": "{ obtenerConfiguracionEntorno }" | kind=code-symbol | source=src/infrastructure/db/postgresClient.js:L2 | neighbors=[postgresClient.js]
- "db_postgresclient_pg": "pg" | kind=code-symbol | source=src/infrastructure/db/postgresClient.js:L1 | neighbors=[postgresClient.js]
- "http_server_buscarusuarioporusername_registrarauditoriaremota": "{ buscarUsuarioPorUsername, registrarAuditoriaRemota }" | kind=code-symbol | source=src/presentation/http/server.js:L6 | neighbors=[server.js]
- "http_server_calcularturnosrango": "{ calcularTurnosRango }" | kind=code-symbol | source=src/presentation/http/server.js:L14 | neighbors=[server.js]
- "http_server_config": "config" | kind=code-symbol | source=src/presentation/http/server.js:L51 | neighbors=[server.js]
- "http_server_fs": "fs" | kind=code-symbol | source=src/presentation/http/server.js:L2 | neighbors=[server.js]
- "http_server_http": "http" | kind=code-symbol | source=src/presentation/http/server.js:L1 | neighbors=[server.js]
- "http_server_leerbodyjson": "leerBodyJson()" | kind=code-symbol | source=src/presentation/http/server.js:L76 | neighbors=[server.js]
- "http_server_listarcatalogoporsucursal_crearproductoconinventario_editarproductoconinventario_abastecerstockproducto_eliminarproductosoftdelete_guardarcategoria_eliminarcategoriasoftdelete": "{\n    listarCatalogoPorSucursal,\n    crearProductoConInventario,\n    editarProd…" | kind=code-symbol | source=src/presentation/http/server.js:L15 | neighbors=[server.js]
- "http_server_listarlogsauditoria": "{ listarLogsAuditoria }" | kind=code-symbol | source=src/presentation/http/server.js:L7 | neighbors=[server.js]
- "http_server_listarsolicitudesventa_listarsolicitudesgasto_listaroperadores": "{\n    listarSolicitudesVenta,\n    listarSolicitudesGasto,\n    listarOperadores\n}" | kind=code-symbol | source=src/presentation/http/server.js:L9 | neighbors=[server.js]
- "http_server_listarsucursalesvigentes": "{ listarSucursalesVigentes }" | kind=code-symbol | source=src/presentation/http/server.js:L8 | neighbors=[server.js]
- "http_server_mime_types": "MIME_TYPES" | kind=code-symbol | source=src/presentation/http/server.js:L54 | neighbors=[server.js]
- "http_server_normalizarcredenciales_validarusuarioautenticado_firmartokensesion_verificartokensesion": "{\n    normalizarCredenciales,\n    validarUsuarioAutenticado,\n    firmarTokenSes…" | kind=code-symbol | source=src/presentation/http/server.js:L43 | neighbors=[server.js]
- "http_server_obtenerconfiguracionentorno": "{ obtenerConfiguracionEntorno }" | kind=code-symbol | source=src/presentation/http/server.js:L4 | neighbors=[server.js]
- "http_server_obtenerfechawallclock_obtenersolofechawallclock": "{ obtenerFechaWallClock, obtenerSoloFechaWallClock }" | kind=code-symbol | source=src/presentation/http/server.js:L49 | neighbors=[server.js]
- "http_server_obtenerreportediario_obtenerdetalleventaporid_editarventaenreporte_eliminarventaenreporte_creargastoenreporte_editargastoenreporte_eliminargastoenreporte": "{\n    obtenerReporteDiario,\n    obtenerDetalleVentaPorId,\n    editarVentaEnRepo…" | kind=code-symbol | source=src/presentation/http/server.js:L29 | neighbors=[server.js]
- "http_server_path": "path" | kind=code-symbol | source=src/presentation/http/server.js:L3 | neighbors=[server.js]
- "http_server_server": "server" | kind=code-symbol | source=src/presentation/http/server.js:L140 | neighbors=[server.js]
- "http_server_validardatosproducto_validarabastecimiento_validardatoscategoria": "{\n    validarDatosProducto,\n    validarAbastecimiento,\n    validarDatosCategori…" | kind=code-symbol | source=src/presentation/http/server.js:L24 | neighbors=[server.js]
- "http_server_validarfechareporte_validaredicionventa_validardatosgasto": "{\n    validarFechaReporte,\n    validarEdicionVenta,\n    validarDatosGasto\n}" | kind=code-symbol | source=src/presentation/http/server.js:L38 | neighbors=[server.js]
- "http_server_verificarconexiondb": "{ verificarConexionDb }" | kind=code-symbol | source=src/presentation/http/server.js:L5 | neighbors=[server.js]
- "http_server_web_dir": "WEB_DIR" | kind=code-symbol | source=src/presentation/http/server.js:L52 | neighbors=[server.js]
- "reportes_reportediariodomain_tipos_gasto_validos": "TIPOS_GASTO_VALIDOS" | kind=code-symbol | source=src/domain/reportes/reporteDiarioDomain.js:L1 | neighbors=[reporteDiarioDomain.js]
- "repositories_auditoriarepository_ejecutarquery": "{ ejecutarQuery }" | kind=code-symbol | source=src/infrastructure/repositories/auditoriaRepository.js:L1 | neighbors=[auditoriaRepository.js]
- "repositories_authrepository_ejecutarquery": "{ ejecutarQuery }" | kind=code-symbol | source=src/infrastructure/repositories/authRepository.js:L2 | neighbors=[authRepository.js]
- "repositories_authrepository_obtenerfechawallclock": "{ obtenerFechaWallClock }" | kind=code-symbol | source=src/infrastructure/repositories/authRepository.js:L3 | neighbors=[authRepository.js]
- "repositories_authrepository_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=src/infrastructure/repositories/authRepository.js:L1 | neighbors=[authRepository.js]
- "repositories_catalogorepository_obtenerpool_ejecutarquery": "{ obtenerPool, ejecutarQuery }" | kind=code-symbol | source=src/infrastructure/repositories/catalogoRepository.js:L2 | neighbors=[catalogoRepository.js]
- "repositories_catalogorepository_registrarauditoriaremota": "{ registrarAuditoriaRemota }" | kind=code-symbol | source=src/infrastructure/repositories/catalogoRepository.js:L3 | neighbors=[catalogoRepository.js]
- "repositories_catalogorepository_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=src/infrastructure/repositories/catalogoRepository.js:L1 | neighbors=[catalogoRepository.js]
- "repositories_reportediariorepository_calcularresumenfinancierodia": "{ calcularResumenFinancieroDia }" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L5 | neighbors=[reporteDiarioRepository.js]
- "repositories_reportediariorepository_obtenerpool_ejecutarquery": "{ obtenerPool, ejecutarQuery }" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L2 | neighbors=[reporteDiarioRepository.js]
- "repositories_reportediariorepository_obtenersolofechawallclock_obtenerfechawallclock": "{ obtenerSoloFechaWallClock, obtenerFechaWallClock }" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L4 | neighbors=[reporteDiarioRepository.js]
- "repositories_reportediariorepository_registrarauditoriaremota": "{ registrarAuditoriaRemota }" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L3 | neighbors=[reporteDiarioRepository.js]
- "repositories_reportediariorepository_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L1 | neighbors=[reporteDiarioRepository.js]
- "repositories_solicitudesrepository_ejecutarquery": "{ ejecutarQuery }" | kind=code-symbol | source=src/infrastructure/repositories/solicitudesRepository.js:L1 | neighbors=[solicitudesRepository.js]
- "repositories_sucursalrepository_ejecutarquery": "{ ejecutarQuery }" | kind=code-symbol | source=src/infrastructure/repositories/sucursalRepository.js:L1 | neighbors=[sucursalRepository.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\Aplicacion-Web-POS\.engram\description-instructions\batch-004.json

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
