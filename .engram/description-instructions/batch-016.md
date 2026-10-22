# Node Description Batch 17 of 25

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

- "diagnostico_sync_cierre_procesarsincronizacion": "{ procesarSincronizacion }" | kind=code-symbol | source=diagnostico_sync_cierre.js:L3 | neighbors=[diagnostico_sync_cierre.js]
- "diagnostico_sync_cierre_remotedbclient_getpool": "{ remoteDbClient, getPool }" | kind=code-symbol | source=diagnostico_sync_cierre.js:L2 | neighbors=[diagnostico_sync_cierre.js]
- "gastos_construirdescripcionvencidos": "construirDescripcionVencidos()" | kind=code-symbol | source=gastos.js:L48 | neighbors=[gastos.js]
- "gastos_crearfilaproductovencido": "crearFilaProductoVencido()" | kind=code-symbol | source=gastos.js:L110 | neighbors=[gastos.js]
- "gastos_descripcionesfrecuentesoperativo": "descripcionesFrecuentesOperativo" | kind=code-symbol | source=gastos.js:L27 | neighbors=[gastos.js]
- "gastos_limpiarfilasproductosvencidos": "limpiarFilasProductosVencidos()" | kind=code-symbol | source=gastos.js:L169 | neighbors=[gastos.js]
- "gastos_mapaclaveporproductoid": "mapaClavePorProductoId" | kind=code-symbol | source=gastos.js:L55 | neighbors=[gastos.js]
- "gastos_mapaproductosporclave": "mapaProductosPorClave" | kind=code-symbol | source=gastos.js:L54 | neighbors=[gastos.js]
- "gastos_obtenerclaveunicaproducto": "obtenerClaveUnicaProducto()" | kind=code-symbol | source=gastos.js:L57 | neighbors=[gastos.js]
- "gastos_obtenerfechahoyyyyymmdd": "obtenerFechaHoyYYYYMMDD()" | kind=code-symbol | source=gastos.js:L40 | neighbors=[gastos.js]
- "gastos_productosdisponibles": "productosDisponibles" | kind=code-symbol | source=gastos.js:L26 | neighbors=[gastos.js]
- "gestion_actualizarmesesdisponibles": "actualizarMesesDisponibles()" | kind=code-symbol | source=gestion.js:L64 | neighbors=[gestion.js]
- "gestion_datosreportecreditos": "datosReporteCreditos" | kind=code-symbol | source=gestion.js:L845 | neighbors=[gestion.js]
- "gestion_datosreporteglobal": "datosReporteGlobal" | kind=code-symbol | source=gestion.js:L4 | neighbors=[gestion.js]
- "gestion_esfechadehoy": "esFechaDeHoy()" | kind=code-symbol | source=gestion.js:L8 | neighbors=[gestion.js]
- "gestion_formatnumberui": "formatNumberUI()" | kind=code-symbol | source=gestion.js:L479 | neighbors=[gestion.js]
- "gestion_nombresmeses": "nombresMeses" | kind=code-symbol | source=gestion.js:L26 | neighbors=[gestion.js]
- "gestion_poblarselectorcategoriasranking": "poblarSelectorCategoriasRanking()" | kind=code-symbol | source=gestion.js:L106 | neighbors=[gestion.js]
- "gestion_recargarreportecondebounce": "recargarReporteConDebounce()" | kind=code-symbol | source=gestion.js:L19 | neighbors=[gestion.js]
- "gestion_restaurarfocoselectorescredito": "restaurarFocoSelectoresCredito()" | kind=code-symbol | source=gestion.js:L52 | neighbors=[gestion.js]
- "ipc_registerabonosipc_ipcmain": "{ ipcMain }" | kind=code-symbol | source=ipc/registerAbonosIpc.js:L1 | neighbors=[registerAbonosIpc.js]
- "ipc_registerabonosipc_listarabonoseliminados_recuperarabono": "{ listarAbonosEliminados, recuperarAbono }" | kind=code-symbol | source=ipc/registerAbonosIpc.js:L2 | neighbors=[registerAbonosIpc.js]
- "ipc_registerauditoriaipc_ipcmain": "{ ipcMain }" | kind=code-symbol | source=ipc/registerAuditoriaIpc.js:L1 | neighbors=[registerAuditoriaIpc.js]
- "ipc_registerauditoriaipc_obtenervaloresdistintos": "obtenerValoresDistintos()" | kind=code-symbol | source=ipc/registerAuditoriaIpc.js:L14 | neighbors=[registerAuditoriaIpc.js]
- "ipc_registerauditoriaipc_supabaselogs": "{ supabaseLogs }" | kind=code-symbol | source=ipc/registerAuditoriaIpc.js:L2 | neighbors=[registerAuditoriaIpc.js]
- "ipc_registercierrescajaipc_calcularventanayesperado_registrarcierrecajatx_obtenercierrescaja_eliminarcierrecajatx_recalcularcierrecajatx": "{ calcularVentanaYEsperado, registrarCierreCajaTx, obtenerCierresCaja, eliminar…" | kind=code-symbol | source=ipc/registerCierresCajaIpc.js:L2 | neighbors=[registerCierresCajaIpc.js]
- "ipc_registercierrescajaipc_ipcmain": "{ ipcMain }" | kind=code-symbol | source=ipc/registerCierresCajaIpc.js:L1 | neighbors=[registerCierresCajaIpc.js]
- "ipc_registerclientesipc_db_runquery_allquery": "{ db, runQuery, allQuery }" | kind=code-symbol | source=ipc/registerClientesIpc.js:L5 | neighbors=[registerClientesIpc.js]
- "ipc_registerclientesipc_exportarcuentacobropdf": "exportarCuentaCobroPDF()" | kind=code-symbol | source=ipc/registerClientesIpc.js:L344 | neighbors=[registerClientesIpc.js]
- "ipc_registerclientesipc_formatearcop_sanitizarnombrearchivo_construirhtmlcuentacobro_extraerdomiciliodemetodopago": "{ formatearCOP, sanitizarNombreArchivo, construirHtmlCuentaCobro, extraerDomici…" | kind=code-symbol | source=ipc/registerClientesIpc.js:L6 | neighbors=[registerClientesIpc.js]
- "ipc_registerclientesipc_fs": "fs" | kind=code-symbol | source=ipc/registerClientesIpc.js:L3 | neighbors=[registerClientesIpc.js]
- "ipc_registerclientesipc_ipcmain_browserwindow_dialog_app": "{ ipcMain, BrowserWindow, dialog, app }" | kind=code-symbol | source=ipc/registerClientesIpc.js:L1 | neighbors=[registerClientesIpc.js]
- "ipc_registerclientesipc_obtenerfechahoyyyyymmdd": "{ obtenerFechaHoyYYYYMMDD }" | kind=code-symbol | source=ipc/registerClientesIpc.js:L8 | neighbors=[registerClientesIpc.js]
- "ipc_registerclientesipc_obtenerfirmadatauri": "obtenerFirmaDataUri()" | kind=code-symbol | source=ipc/registerClientesIpc.js:L330 | neighbors=[registerClientesIpc.js]
- "ipc_registerclientesipc_obtenersucursalinfo": "obtenerSucursalInfo()" | kind=code-symbol | source=ipc/registerClientesIpc.js:L308 | neighbors=[registerClientesIpc.js]
- "ipc_registerclientesipc_path": "path" | kind=code-symbol | source=ipc/registerClientesIpc.js:L2 | neighbors=[registerClientesIpc.js]
- "ipc_registerclientesipc_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=ipc/registerClientesIpc.js:L7 | neighbors=[registerClientesIpc.js]
- "ipc_registerclientesipc_sqlfechadia": "sqlFechaDia()" | kind=code-symbol | source=ipc/registerClientesIpc.js:L12 | neighbors=[registerClientesIpc.js]
- "ipc_registerclientesipc_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=ipc/registerClientesIpc.js:L4 | neighbors=[registerClientesIpc.js]
- "ipc_registergastosipc_db_runquery_allquery": "{ db, runQuery, allQuery }" | kind=code-symbol | source=ipc/registerGastosIpc.js:L3 | neighbors=[registerGastosIpc.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-016.json

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
