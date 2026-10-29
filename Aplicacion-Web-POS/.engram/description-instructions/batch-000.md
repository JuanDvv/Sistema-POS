# Node Description Batch 1 of 6

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

- "http_server": "server.js" | kind=code-symbol | source=src/presentation/http/server.js:L1 | neighbors=[turnosDomain.js, calcularTurnosRango(), authDomain.js, firmarTokenSesion(), normalizarCredenciales(), validarUsuarioAutenticado()] | lang=en
- "web_app": "app.js" | kind=code-symbol | source=src/presentation/web/app.js:L1 | neighbors=[abrirModalAbastecer(), abrirModalCategoria(), abrirModalDetalleSolGasto(), abrirModalDetalleSolVenta(), abrirModalEditarVenta(), abrirModalGasto()] | lang=en
- "branch:repo:github.com/JuanDvv/Sistema-POS#delipostres-turbaco": "delipostres-turbaco" | kind=Branch | source=git | neighbors=[10222a9 refactor: enforce full payment …, 22e246f Add fiscal client and credit tr…, 2812d87 feat: implementa módulo de cier…, 283a3fc feat: agrega splitter arrastrab…, 29d31c1 feat: implement complete POS sy…, 308b9c1 feat: implement incremental syn…] | lang=en
- "branch:repo:github.com/JuanDvv/Sistema-POS#Tienda-Kary": "Tienda-Kary" | kind=Branch | source=git | neighbors=[10222a9 refactor: enforce full payment …, 155d086 Use sessionStorage and add mult…, 1dd520d Add configurable PostgreSQL syn…, 2812d87 feat: implementa módulo de cier…, 283a3fc feat: agrega splitter arrastrab…, 29d31c1 feat: implement complete POS sy…] | lang=en
- "repositories_reportediariorepository": "reporteDiarioRepository.js" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L1 | neighbors=[server.js, postgresClient.js, ejecutarQuery(), obtenerPool(), reporteDiarioDomain.js, calcularResumenFinancieroDia()] | lang=en
- "repositories_catalogorepository": "catalogoRepository.js" | kind=code-symbol | source=src/infrastructure/repositories/catalogoRepository.js:L1 | neighbors=[server.js, postgresClient.js, ejecutarQuery(), obtenerPool(), authRepository.js, registrarAuditoriaRemota()] | lang=en
- "db_postgresclient": "postgresClient.js" | kind=code-symbol | source=src/infrastructure/db/postgresClient.js:L1 | neighbors=[envConfig.js, obtenerConfiguracionEntorno(), ejecutarQuery(), { obtenerConfiguracionEntorno }, obtenerPool(), pg] | lang=en
- "repositories_authrepository": "authRepository.js" | kind=code-symbol | source=src/infrastructure/repositories/authRepository.js:L1 | neighbors=[server.js, postgresClient.js, ejecutarQuery(), buscarUsuarioPorUsername(), { ejecutarQuery }, { obtenerFechaWallClock }] | lang=en
- "admin_turnosdomain": "turnosDomain.js" | kind=code-symbol | source=src/domain/admin/turnosDomain.js:L1 | neighbors=[BASE_UTC, calcularDeltaDias(), calcularTurno(), calcularTurnosRango(), CICLO_TURNOS, DIAS_SEMANA] | lang=en
- "web_app_apifetch": "apiFetch()" | kind=code-symbol | source=src/presentation/web/app.js:L187 | neighbors=[app.js, abrirModalEditarVenta(), restaurarSesion(), cargarAuditoriaWeb(), cargarCatalogo(), cargarReporteDiario()] | lang=en
- "db_postgresclient_ejecutarquery": "ejecutarQuery()" | kind=code-symbol | source=src/infrastructure/db/postgresClient.js:L36 | neighbors=[postgresClient.js, obtenerPool(), verificarConexionDb(), auditoriaRepository.js, authRepository.js, catalogoRepository.js] | lang=en
- "reportes_reportediariodomain": "reporteDiarioDomain.js" | kind=code-symbol | source=src/domain/reportes/reporteDiarioDomain.js:L1 | neighbors=[server.js, calcularResumenFinancieroDia(), extraerMontosMetodoPago(), normalizarMetodoPagoVenta(), TIPOS_GASTO_VALIDOS, validarDatosGasto()] | lang=en
- "shared_clock": "clock.js" | kind=code-symbol | source=src/domain/shared/clock.js:L1 | neighbors=[server.js, authRepository.js, reporteDiarioRepository.js, obtenerFechaWallClock(), obtenerPartesWallClock(), obtenerSoloFechaWallClock()] | lang=en
- "repositories_solicitudesrepository": "solicitudesRepository.js" | kind=code-symbol | source=src/infrastructure/repositories/solicitudesRepository.js:L1 | neighbors=[server.js, postgresClient.js, ejecutarQuery(), { ejecutarQuery }, listarOperadores(), listarSolicitudesGasto()] | lang=en
- "web_app_abrirmodaleditarventa": "abrirModalEditarVenta()" | kind=code-symbol | source=src/presentation/web/app.js:L1032 | neighbors=[app.js, apiFetch(), formatearHoraVenta(), mostrarToast(), poblarSelectProductosEnVenta(), recalcularTotalVentaModal()] | lang=en
- "admin_turnosdomain_calcularturnosrango": "calcularTurnosRango()" | kind=code-symbol | source=src/domain/admin/turnosDomain.js:L33 | neighbors=[turnosDomain.js, calcularDeltaDias(), calcularTurno(), formatearUtcAYYYYMMDD(), parsearFechaAUtc(), server.js] | lang=en
- "auth_authdomain": "authDomain.js" | kind=code-symbol | source=src/domain/auth/authDomain.js:L1 | neighbors=[crypto, firmarTokenSesion(), normalizarCredenciales(), validarUsuarioAutenticado(), verificarTokenSesion(), server.js] | lang=en
- "config_envconfig": "envConfig.js" | kind=code-symbol | source=src/infrastructure/config/envConfig.js:L1 | neighbors=[fs, leerConfigLocalPos(), obtenerConfiguracionEntorno(), path, postgresClient.js, server.js] | lang=en
- "web_app_cargarcatalogo": "cargarCatalogo()" | kind=code-symbol | source=src/presentation/web/app.js:L371 | neighbors=[app.js, apiFetch(), poblarSelectoresCategorias(), renderCategorias(), renderProductos(), restaurarSesion()] | lang=en
- "web_app_formatearfechaauditoria": "formatearFechaAuditoria()" | kind=code-symbol | source=src/presentation/web/app.js:L1369 | neighbors=[app.js, abrirModalDetalleSolGasto(), abrirModalDetalleSolVenta(), cargarSolicitudesGastosAdmin(), cargarSolicitudesVentasAdmin(), renderAuditoriaWeb()] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@6f9f2fbc2b3184eecd4164bdd57bcd32f1e7d7a1": "6f9f2fb Merge branch 'delipostres-turbaco-cierres-parciales' into delipostres-t…" | kind=Commit | source=git | neighbors=[283a3fc feat: agrega splitter arrastrab…, 68efa36 refactor: replace localStorage …, Tienda-Kary, delipostres-turbaco, cbc0980 feat: implement fiscal sales wo…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@84696d51c982c096183d051502e6e573f946fe1d": "84696d5 feat: enable client management access for operators and add search func…" | kind=Commit | source=git | neighbors=[10222a9 refactor: enforce full payment …, Tienda-Kary, delipostres-turbaco, 2812d87 feat: implementa módulo de cier…, 68efa36 refactor: replace localStorage …] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@bfa73bf661f3d29628bc4832de4e0648b9a57645": "bfa73bf Add pastelería sugeridos, gasto retroactivo & sync" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 753cf10 Add revert-delivery feature and…, bd7e03e Rebrand to Tienda de Kary and a…, cbc0980 feat: implement fiscal sales wo…] | lang=pt
- "repositories_auditoriarepository": "auditoriaRepository.js" | kind=code-symbol | source=src/infrastructure/repositories/auditoriaRepository.js:L1 | neighbors=[server.js, postgresClient.js, ejecutarQuery(), { ejecutarQuery }, listarLogsAuditoria()] | lang=en
- "repositories_sucursalrepository": "sucursalRepository.js" | kind=code-symbol | source=src/infrastructure/repositories/sucursalRepository.js:L1 | neighbors=[server.js, postgresClient.js, ejecutarQuery(), { ejecutarQuery }, listarSucursalesVigentes()] | lang=en
- "shared_clock_obtenerfechawallclock": "obtenerFechaWallClock()" | kind=code-symbol | source=src/domain/shared/clock.js:L37 | neighbors=[server.js, authRepository.js, reporteDiarioRepository.js, clock.js, obtenerPartesWallClock()] | lang=en
- "web_app_cargarturnosadmin": "cargarTurnosAdmin()" | kind=code-symbol | source=src/presentation/web/app.js:L1504 | neighbors=[app.js, cambiarFechaInicioTurnos(), apiFetch(), badgeTurnoHtml(), cargarOperadoresTurnosStorage()] | lang=en
- "web_app_restaurarsesion": "restaurarSesion()" | kind=code-symbol | source=src/presentation/web/app.js:L437 | neighbors=[app.js, apiFetch(), cargarCatalogo(), cargarReporteDiario(), renderSucursales()] | lang=en
- "catalogo_catalogodomain": "catalogoDomain.js" | kind=code-symbol | source=src/domain/catalogo/catalogoDomain.js:L1 | neighbors=[validarAbastecimiento(), validarDatosCategoria(), validarDatosProducto(), server.js] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@10222a924fb96d31d11db98b96c729b7ad1c8ac5": "10222a9 refactor: enforce full payment for order delivery and implement dedicat…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 84696d5 feat: enable client management …, ee31f83 feat: improve order list format…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@1dd520d6c78c3462a9cfd6ad19a7e915373ff57e": "1dd520d Add configurable PostgreSQL sync backend" | kind=Commit | source=git | neighbors=[155d086 Use sessionStorage and add mult…, Tienda-Kary, 58e2652 Add volume discounts and secure…, e089d11 Add volume discounts and secure…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@22e246ff66339650aa6eccadc452002b38987110": "22e246f Add fiscal client and credit tracking improvements" | kind=Commit | source=git | neighbors=[delipostres-turbaco, 395c0c1 Add PostgreSQL sync and turno m…, 9140912 Add PostgreSQL sync and turno m…, b9061d3 Mejoras de sesión, reportes y d…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@2812d87b9e98912ac7d54d789274ab993ad89540": "2812d87 feat: implementa módulo de cierres de caja con registro, auditoría y cá…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 68defea style: optimize layout and resp…, 84696d5 feat: enable client management …] | lang=nl
- "commit:repo:github.com/JuanDvv/Sistema-POS@283a3fc80eb6448d910205eaba750aaccbefd209": "283a3fc feat: agrega splitter arrastrable para ajustar ancho de paneles en arqu…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 6f9f2fb Merge branch 'delipostres-turba…, 4986e5d refactor: migrate temporary car…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@29d31c1d47e1efecccd66b224109297266df14c2": "29d31c1 feat: implement complete POS system architecture with IPC handlers, aud…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 821d5ac feat: implement system-wide ord…, db673ca Initial commit] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@308b9c123357e59bec970ee6ca72d033a6299836": "308b9c1 feat: implement incremental synchronization, atomic inventory correctio…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, aa81749 feat: implement real-time inven…, 4cf89eb feat: implement centralized ven…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@4986e5daa31f8d198cacd03169450cea2a90a7eb": "4986e5d refactor: migrate temporary cart storage from localStorage to sessionSt…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 283a3fc feat: agrega splitter arrastrab…, 68defea style: optimize layout and resp…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@4c924e99f29bfcddc8203f3558313ffc6e863b50": "4c924e9 feat: implement robust sync engine with LWW conflict resolution, increm…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, ee31f83 feat: improve order list format…, 85893e4 feat: implement IPC handlers fo…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@4cf89eb3f06fc17b017c1f0397392a61b37a01e2": "4cf89eb feat: implement centralized ventaService for atomic transactions and ad…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 308b9c1 feat: implement incremental syn…, 5bfc128 feat: implement synchronization…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@5bfc1288aaebd72bf725d1b457743f52d6eb2f4b": "5bfc128 feat: implement synchronization engine and database infrastructure to s…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 4cf89eb feat: implement centralized ven…, 821d5ac feat: implement system-wide ord…] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\Aplicacion-Web-POS\.engram\description-instructions\batch-000.json

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
