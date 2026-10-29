# Node Description Batch 3 of 6

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

- "commit:repo:github.com/JuanDvv/Sistema-POS@b9061d3c06119dda317da6ba8b52ff17f67fe56d": "b9061d3 Mejoras de sesión, reportes y descuentos" | kind=Commit | source=git | neighbors=[delipostres-turbaco, 22e246f Add fiscal client and credit tr…, c4fc4fe Use sessionStorage; add multi-w…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@bd7e03e6e81f22fc181eee93172faf19d1a822a0": "bd7e03e Rebrand to Tienda de Kary and add mayorista support" | kind=Commit | source=git | neighbors=[Tienda-Kary, a4cb7fc Add ability to revert delivered…, bfa73bf Add pastelería sugeridos, gasto…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@c2fe83721f3861c11465fb8ade15e6252700ffb2": "c2fe837 Add mobile POS web portal" | kind=Commit | source=git | neighbors=[delipostres-turbaco, 97bcf9d Add mobile POS catalog and dail…, ea3b42a Add generated Engram knowledge …] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@c4fc4fe91f9dc5be1b9208086f877bb064b7f3f5": "c4fc4fe Use sessionStorage; add multi-window & sync" | kind=Commit | source=git | neighbors=[b08f3b6 Aislar configuración de Supabas…, delipostres-turbaco, b9061d3 Mejoras de sesión, reportes y d…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@e089d1109570baf5373f24418ef712b2a689cded": "e089d11 Add volume discounts and secure DB config" | kind=Commit | source=git | neighbors=[1dd520d Add configurable PostgreSQL syn…, Tienda-Kary, f57487f Merge branch 'Tienda-Kary' of h…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@ea3b42a0080a21a269271bfa1331293e0467db20": "ea3b42a Add generated Engram knowledge graph" | kind=Commit | source=git | neighbors=[61749d1 Merge branch 'delipostres-turba…, delipostres-turbaco, c2fe837 Add mobile POS web portal] | lang=pt
- "commit:repo:github.com/JuanDvv/Sistema-POS@f57487fb5e134dec5a63652a47bdb251f1d22a16": "f57487f Merge branch 'Tienda-Kary' of https://github.com/JuanDvv/Sistema-POS in…" | kind=Commit | source=git | neighbors=[58e2652 Add volume discounts and secure…, e089d11 Add volume discounts and secure…, Tienda-Kary] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@fa97bc4640826c4915b2d41fe2a1ff82a4c70c1c": "fa97bc4 Mostrar descuentos y subtotales en ventas" | kind=Commit | source=git | neighbors=[6a58133 Make Supabase optional; use pac…, Tienda-Kary, 155d086 Use sessionStorage and add mult…] | lang=es
- "db_postgresclient_verificarconexiondb": "verificarConexionDb()" | kind=code-symbol | source=src/infrastructure/db/postgresClient.js:L41 | neighbors=[postgresClient.js, ejecutarQuery(), server.js] | lang=en
- "reportes_reportediariodomain_calcularresumenfinancierodia": "calcularResumenFinancieroDia()" | kind=code-symbol | source=src/domain/reportes/reporteDiarioDomain.js:L142 | neighbors=[reporteDiarioDomain.js, extraerMontosMetodoPago(), reporteDiarioRepository.js] | lang=en
- "reportes_reportediariodomain_validaredicionventa": "validarEdicionVenta()" | kind=code-symbol | source=src/domain/reportes/reporteDiarioDomain.js:L37 | neighbors=[server.js, reporteDiarioDomain.js, normalizarMetodoPagoVenta()] | lang=en
- "repositories_reportediariorepository_buscargastodomiciliotx": "buscarGastoDomicilioTx()" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L35 | neighbors=[reporteDiarioRepository.js, editarVentaEnReporte(), eliminarVentaEnReporte()] | lang=en
- "repositories_reportediariorepository_creargastoenreporte": "crearGastoEnReporte()" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L438 | neighbors=[server.js, reporteDiarioRepository.js, construirTimestampParaDia()] | lang=en
- "repositories_reportediariorepository_editargastoenreporte": "editarGastoEnReporte()" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L462 | neighbors=[server.js, reporteDiarioRepository.js, sqlFechaColumna()] | lang=en
- "repositories_reportediariorepository_eliminargastoenreporte": "eliminarGastoEnReporte()" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L512 | neighbors=[server.js, reporteDiarioRepository.js, sqlFechaColumna()] | lang=en
- "repositories_reportediariorepository_eliminarventaenreporte": "eliminarVentaEnReporte()" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L354 | neighbors=[server.js, reporteDiarioRepository.js, buscarGastoDomicilioTx()] | lang=en
- "repositories_reportediariorepository_obtenerreportediario": "obtenerReporteDiario()" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L72 | neighbors=[server.js, reporteDiarioRepository.js, sqlFechaColumna()] | lang=en
- "web_app_cargarauditoriaweb": "cargarAuditoriaWeb()" | kind=code-symbol | source=src/presentation/web/app.js:L1384 | neighbors=[app.js, apiFetch(), renderAuditoriaWeb()] | lang=en
- "web_app_renderauditoriaweb": "renderAuditoriaWeb()" | kind=code-symbol | source=src/presentation/web/app.js:L1399 | neighbors=[app.js, cargarAuditoriaWeb(), formatearFechaAuditoria()] | lang=en
- "web_app_renderdropdownproductosventa": "renderDropdownProductosVenta()" | kind=code-symbol | source=src/presentation/web/app.js:L937 | neighbors=[app.js, poblarSelectProductosEnVenta(), normalizarTextoBusqueda()] | lang=en
- "web_app_rendergastos": "renderGastos()" | kind=code-symbol | source=src/presentation/web/app.js:L866 | neighbors=[app.js, formatearHoraVenta(), renderReporteDiario()] | lang=en
- "admin_turnosdomain_calcularturno": "calcularTurno()" | kind=code-symbol | source=src/domain/admin/turnosDomain.js:L28 | neighbors=[turnosDomain.js, calcularTurnosRango()] | lang=en
- "admin_turnosdomain_formatearutcayyyymmdd": "formatearUtcAYYYYMMDD()" | kind=code-symbol | source=src/domain/admin/turnosDomain.js:L14 | neighbors=[turnosDomain.js, calcularTurnosRango()] | lang=en
- "auth_authdomain_firmartokensesion": "firmarTokenSesion()" | kind=code-symbol | source=src/domain/auth/authDomain.js:L26 | neighbors=[authDomain.js, server.js] | lang=en
- "auth_authdomain_normalizarcredenciales": "normalizarCredenciales()" | kind=code-symbol | source=src/domain/auth/authDomain.js:L3 | neighbors=[authDomain.js, server.js] | lang=en
- "auth_authdomain_validarusuarioautenticado": "validarUsuarioAutenticado()" | kind=code-symbol | source=src/domain/auth/authDomain.js:L12 | neighbors=[authDomain.js, server.js] | lang=en
- "auth_authdomain_verificartokensesion": "verificarTokenSesion()" | kind=code-symbol | source=src/domain/auth/authDomain.js:L39 | neighbors=[authDomain.js, server.js] | lang=en
- "catalogo_catalogodomain_validarabastecimiento": "validarAbastecimiento()" | kind=code-symbol | source=src/domain/catalogo/catalogoDomain.js:L48 | neighbors=[catalogoDomain.js, server.js] | lang=en
- "catalogo_catalogodomain_validardatoscategoria": "validarDatosCategoria()" | kind=code-symbol | source=src/domain/catalogo/catalogoDomain.js:L65 | neighbors=[catalogoDomain.js, server.js] | lang=en
- "catalogo_catalogodomain_validardatosproducto": "validarDatosProducto()" | kind=code-symbol | source=src/domain/catalogo/catalogoDomain.js:L1 | neighbors=[catalogoDomain.js, server.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@b4f4e10afec3542d7a9a4dce22390ee6e628a7b6": "b4f4e10 Add admin schedules and request viewer" | kind=Commit | source=git | neighbors=[97bcf9d Add mobile POS catalog and dail…, delipostres-turbaco] | lang=en
- "config_envconfig_leerconfiglocalpos": "leerConfigLocalPos()" | kind=code-symbol | source=src/infrastructure/config/envConfig.js:L4 | neighbors=[envConfig.js, obtenerConfiguracionEntorno()] | lang=en
- "http_server_enviarjson": "enviarJson()" | kind=code-symbol | source=src/presentation/http/server.js:L64 | neighbors=[server.js, servirArchivoEstatico()] | lang=en
- "http_server_extraertokenrequest": "extraerTokenRequest()" | kind=code-symbol | source=src/presentation/http/server.js:L98 | neighbors=[server.js, obtenerSesionRequest()] | lang=en
- "http_server_obtenersesionrequest": "obtenerSesionRequest()" | kind=code-symbol | source=src/presentation/http/server.js:L113 | neighbors=[server.js, extraerTokenRequest()] | lang=en
- "http_server_servirarchivoestatico": "servirArchivoEstatico()" | kind=code-symbol | source=src/presentation/http/server.js:L118 | neighbors=[server.js, enviarJson()] | lang=en
- "reportes_reportediariodomain_extraermontosmetodopago": "extraerMontosMetodoPago()" | kind=code-symbol | source=src/domain/reportes/reporteDiarioDomain.js:L121 | neighbors=[reporteDiarioDomain.js, calcularResumenFinancieroDia()] | lang=en
- "reportes_reportediariodomain_normalizarmetodopagoventa": "normalizarMetodoPagoVenta()" | kind=code-symbol | source=src/domain/reportes/reporteDiarioDomain.js:L16 | neighbors=[reporteDiarioDomain.js, validarEdicionVenta()] | lang=en
- "reportes_reportediariodomain_validardatosgasto": "validarDatosGasto()" | kind=code-symbol | source=src/domain/reportes/reporteDiarioDomain.js:L92 | neighbors=[server.js, reporteDiarioDomain.js] | lang=en
- "reportes_reportediariodomain_validarfechareporte": "validarFechaReporte()" | kind=code-symbol | source=src/domain/reportes/reporteDiarioDomain.js:L8 | neighbors=[server.js, reporteDiarioDomain.js] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\Aplicacion-Web-POS\.engram\description-instructions\batch-002.json

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
