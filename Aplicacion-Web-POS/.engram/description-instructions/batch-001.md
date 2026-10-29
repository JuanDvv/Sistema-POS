# Node Description Batch 2 of 6

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

- "commit:repo:github.com/JuanDvv/Sistema-POS@61749d10a9a7ce7aa3970e6a4db5c891ecde1b21": "61749d1 Merge branch 'delipostres-turbaco' of https://github.com/JuanDvv/Sistem…" | kind=Commit | source=git | neighbors=[395c0c1 Add PostgreSQL sync and turno m…, delipostres-turbaco, ea3b42a Add generated Engram knowledge …, 9140912 Add PostgreSQL sync and turno m…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@68defea7c15a19e358f55bae929791e7bf6e6a73": "68defea style: optimize layout and responsive spacing for denomination grid in …" | kind=Commit | source=git | neighbors=[2812d87 feat: implementa módulo de cier…, Tienda-Kary, delipostres-turbaco, 4986e5d refactor: migrate temporary car…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@68efa368f46b75b066c8fd2ecafdbfb41cb294c7": "68efa36 refactor: replace localStorage with sessionStorage for cart persistence…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 6f9f2fb Merge branch 'delipostres-turba…, 84696d5 feat: enable client management …] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@821d5ac6e7d839f908e040250fde212b81a38e0d": "821d5ac feat: implement system-wide order management module including IPC integ…" | kind=Commit | source=git | neighbors=[29d31c1 feat: implement complete POS sy…, Tienda-Kary, delipostres-turbaco, 5bfc128 feat: implement synchronization…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@85893e46c054e4231091f6e2a96bfb5e8d69b316": "85893e4 feat: implement IPC handlers for financial reporting and add services f…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, 4c924e9 feat: implement robust sync eng…, bda8c3f feat: add branch location badge…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@9b92df4e55b373cf3834c983fdb609101fa40758": "9b92df4 feat: add event listener to refresh master data tables upon POS synchro…" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, bda8c3f feat: add branch location badge…, ed98665 feat: add payment method select…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@aa8174959b218e1bd098df567b38fa1c746295f5": "aa81749 feat: implement real-time inventory change highlighting and add robust …" | kind=Commit | source=git | neighbors=[308b9c1 feat: implement incremental syn…, Tienda-Kary, delipostres-turbaco, ed98665 feat: add payment method select…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@bda8c3f83e73ba2a9bd211f249aea7d361db3d5e": "bda8c3f feat: add branch location badges to UI, sort reports by date, and enabl…" | kind=Commit | source=git | neighbors=[9b92df4 feat: add event listener to ref…, Tienda-Kary, delipostres-turbaco, 85893e4 feat: implement IPC handlers fo…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@cbc0980b6d69bedab0f70d3a45df48eb7cf41bc3": "cbc0980 feat: implement fiscal sales workflow with customer management and PDF …" | kind=Commit | source=git | neighbors=[6f9f2fb Merge branch 'delipostres-turba…, Tienda-Kary, delipostres-turbaco, bfa73bf Add pastelería sugeridos, gasto…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@db673ca6ef8417b457c353a03fa434814f886987": "db673ca Initial commit" | kind=Commit | source=git | neighbors=[Tienda-Kary, delipostres-turbaco, main, 29d31c1 feat: implement complete POS sy…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@ed98665e347d3b71901fab6d96ec5a6fab620c95": "ed98665 feat: add payment method selection modal for orders with pending balanc…" | kind=Commit | source=git | neighbors=[aa81749 feat: implement real-time inven…, Tienda-Kary, delipostres-turbaco, 9b92df4 feat: add event listener to ref…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@ee31f83c19b04c6ad22d31f7f3e5e9d095da13ee": "ee31f83 feat: improve order list formatting, add pedidoService for transaction …" | kind=Commit | source=git | neighbors=[4c924e9 feat: implement robust sync eng…, Tienda-Kary, delipostres-turbaco, 10222a9 refactor: enforce full payment …] | lang=en
- "config_envconfig_obtenerconfiguracionentorno": "obtenerConfiguracionEntorno()" | kind=code-symbol | source=src/infrastructure/config/envConfig.js:L19 | neighbors=[envConfig.js, leerConfigLocalPos(), postgresClient.js, server.js] | lang=en
- "db_postgresclient_obtenerpool": "obtenerPool()" | kind=code-symbol | source=src/infrastructure/db/postgresClient.js:L15 | neighbors=[postgresClient.js, ejecutarQuery(), catalogoRepository.js, reporteDiarioRepository.js] | lang=en
- "repositories_authrepository_registrarauditoriaremota": "registrarAuditoriaRemota()" | kind=code-symbol | source=src/infrastructure/repositories/authRepository.js:L18 | neighbors=[server.js, authRepository.js, catalogoRepository.js, reporteDiarioRepository.js] | lang=en
- "repositories_reportediariorepository_editarventaenreporte": "editarVentaEnReporte()" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L216 | neighbors=[server.js, reporteDiarioRepository.js, buscarGastoDomicilioTx(), describirCambiosProductos()] | lang=en
- "repositories_reportediariorepository_sqlfechacolumna": "sqlFechaColumna()" | kind=code-symbol | source=src/infrastructure/repositories/reporteDiarioRepository.js:L15 | neighbors=[reporteDiarioRepository.js, editarGastoEnReporte(), eliminarGastoEnReporte(), obtenerReporteDiario()] | lang=en
- "shared_clock_obtenerparteswallclock": "obtenerPartesWallClock()" | kind=code-symbol | source=src/domain/shared/clock.js:L9 | neighbors=[clock.js, obtenerFechaWallClock(), obtenerSoloFechaWallClock(), obtenerTimestampLWW()] | lang=en
- "shared_clock_obtenersolofechawallclock": "obtenerSoloFechaWallClock()" | kind=code-symbol | source=src/domain/shared/clock.js:L42 | neighbors=[server.js, reporteDiarioRepository.js, clock.js, obtenerPartesWallClock()] | lang=en
- "web_app_cargarreportediario": "cargarReporteDiario()" | kind=code-symbol | source=src/presentation/web/app.js:L728 | neighbors=[app.js, apiFetch(), renderReporteDiario(), restaurarSesion()] | lang=en
- "web_app_cargarsolicitudesgastosadmin": "cargarSolicitudesGastosAdmin()" | kind=code-symbol | source=src/presentation/web/app.js:L1712 | neighbors=[app.js, apiFetch(), formatearFechaAuditoria(), resumenSolicitudGastoWeb()] | lang=en
- "web_app_cargarsolicitudesventasadmin": "cargarSolicitudesVentasAdmin()" | kind=code-symbol | source=src/presentation/web/app.js:L1568 | neighbors=[app.js, apiFetch(), formatearFechaAuditoria(), resumenSolicitudVentaWeb()] | lang=en
- "web_app_formatearhoraventa": "formatearHoraVenta()" | kind=code-symbol | source=src/presentation/web/app.js:L711 | neighbors=[app.js, abrirModalEditarVenta(), renderGastos(), renderVentas()] | lang=en
- "web_app_normalizartextobusqueda": "normalizarTextoBusqueda()" | kind=code-symbol | source=src/presentation/web/app.js:L913 | neighbors=[app.js, renderDropdownProductosVenta(), renderVentas(), resolverProductoSeleccionadoOEscrito()] | lang=en
- "web_app_poblarselectproductosenventa": "poblarSelectProductosEnVenta()" | kind=code-symbol | source=src/presentation/web/app.js:L966 | neighbors=[app.js, abrirModalEditarVenta(), limpiarBuscadorProductoVenta(), renderDropdownProductosVenta()] | lang=en
- "web_app_renderreportediario": "renderReporteDiario()" | kind=code-symbol | source=src/presentation/web/app.js:L746 | neighbors=[app.js, cargarReporteDiario(), renderGastos(), renderVentas()] | lang=en
- "web_app_renderventas": "renderVentas()" | kind=code-symbol | source=src/presentation/web/app.js:L790 | neighbors=[app.js, renderReporteDiario(), formatearHoraVenta(), normalizarTextoBusqueda()] | lang=en
- "admin_turnosdomain_calculardeltadias": "calcularDeltaDias()" | kind=code-symbol | source=src/domain/admin/turnosDomain.js:L22 | neighbors=[turnosDomain.js, parsearFechaAUtc(), calcularTurnosRango()] | lang=en
- "admin_turnosdomain_parsearfechaautc": "parsearFechaAUtc()" | kind=code-symbol | source=src/domain/admin/turnosDomain.js:L6 | neighbors=[turnosDomain.js, calcularDeltaDias(), calcularTurnosRango()] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@155d086196e16015392a5d33988295d23af0dc71": "155d086 Use sessionStorage and add multi-window support" | kind=Commit | source=git | neighbors=[Tienda-Kary, 1dd520d Add configurable PostgreSQL syn…, fa97bc4 Mostrar descuentos y subtotales…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@395c0c1781b2195d868b53ef2cba108581fd5e1d": "395c0c1 Add PostgreSQL sync and turno management" | kind=Commit | source=git | neighbors=[22e246f Add fiscal client and credit tr…, delipostres-turbaco, 61749d1 Merge branch 'delipostres-turba…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@58e26523dd06ac6093864aba3231fab5a5c59b60": "58e2652 Add volume discounts and secure DB config" | kind=Commit | source=git | neighbors=[1dd520d Add configurable PostgreSQL syn…, Tienda-Kary, f57487f Merge branch 'Tienda-Kary' of h…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@6a581336d137dfad12d78317c56e925fbc521fff": "6a58133 Make Supabase optional; use package-based DB names" | kind=Commit | source=git | neighbors=[Tienda-Kary, fa97bc4 Mostrar descuentos y subtotales…, aeae7ec Smart product search and seed s…] | lang=pt
- "commit:repo:github.com/JuanDvv/Sistema-POS@753cf10ded27a6f456ef7d55419776f96e17f709": "753cf10 Add revert-delivery feature and focus fixes" | kind=Commit | source=git | neighbors=[delipostres-turbaco, 98e6778 Update package.json, bfa73bf Add pastelería sugeridos, gasto…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@914091235d51ab648f8043293e6fcef71e7f4547": "9140912 Add PostgreSQL sync and turno management" | kind=Commit | source=git | neighbors=[22e246f Add fiscal client and credit tr…, delipostres-turbaco, 61749d1 Merge branch 'delipostres-turba…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@97bcf9dc19a0dd96eac6dfd83761eabea1db1b39": "97bcf9d Add mobile POS catalog and daily reporting" | kind=Commit | source=git | neighbors=[delipostres-turbaco, b4f4e10 Add admin schedules and request…, c2fe837 Add mobile POS web portal] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@98e677833a15dc6e902b7af3ff1c9a1bdb1ec05c": "98e6778 Update package.json" | kind=Commit | source=git | neighbors=[753cf10 Add revert-delivery feature and…, delipostres-turbaco, b08f3b6 Aislar configuración de Supabas…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@a4cb7fc50d8051cad945a51fa212fe8f3e5aa009": "a4cb7fc Add ability to revert delivered orders (admin)" | kind=Commit | source=git | neighbors=[Tienda-Kary, aeae7ec Smart product search and seed s…, bd7e03e Rebrand to Tienda de Kary and a…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@aeae7ec9a98f5359a4e6f62edaf723ec66bc6e55": "aeae7ec Smart product search and seed scripts" | kind=Commit | source=git | neighbors=[a4cb7fc Add ability to revert delivered…, Tienda-Kary, 6a58133 Make Supabase optional; use pac…] | lang=en
- "commit:repo:github.com/JuanDvv/Sistema-POS@b08f3b66edfe92842cac6536568eab021edc6645": "b08f3b6 Aislar configuración de Supabase y BD" | kind=Commit | source=git | neighbors=[98e6778 Update package.json, delipostres-turbaco, c4fc4fe Use sessionStorage; add multi-w…] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\Aplicacion-Web-POS\.engram\description-instructions\batch-001.json

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
