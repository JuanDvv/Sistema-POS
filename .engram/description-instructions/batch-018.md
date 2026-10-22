# Node Description Batch 19 of 25

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

- "ipc_registersistemaipc_obtenerconfigservidor_guardarconfigservidor": "{ obtenerConfigServidor, guardarConfigServidor }" | kind=code-symbol | source=ipc/registerSistemaIpc.js:L5 | neighbors=[registerSistemaIpc.js]
- "ipc_registersistemaipc_path": "path" | kind=code-symbol | source=ipc/registerSistemaIpc.js:L2 | neighbors=[registerSistemaIpc.js]
- "ipc_registersistemaipc_procesarsincronizacion_issincronizando_hayconexionconocida": "{ procesarSincronizacion, isSincronizando, hayConexionConocida }" | kind=code-symbol | source=ipc/registerSistemaIpc.js:L4 | neighbors=[registerSistemaIpc.js]
- "ipc_registersistemaipc_runquery": "{ runQuery }" | kind=code-symbol | source=ipc/registerSistemaIpc.js:L3 | neighbors=[registerSistemaIpc.js]
- "ipc_registersistemaipc_testconnection_resetpool": "{ testConnection, resetPool }" | kind=code-symbol | source=ipc/registerSistemaIpc.js:L6 | neighbors=[registerSistemaIpc.js]
- "ipc_registersucursalesipc_db_runquery_allquery": "{ db, runQuery, allQuery }" | kind=code-symbol | source=ipc/registerSucursalesIpc.js:L2 | neighbors=[registerSucursalesIpc.js]
- "ipc_registersucursalesipc_ipcmain": "{ ipcMain }" | kind=code-symbol | source=ipc/registerSucursalesIpc.js:L1 | neighbors=[registerSucursalesIpc.js]
- "ipc_registersucursalesipc_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=ipc/registerSucursalesIpc.js:L5 | neighbors=[registerSucursalesIpc.js]
- "ipc_registersucursalesipc_solicitarsincronizacion": "{ solicitarSincronizacion }" | kind=code-symbol | source=ipc/registerSucursalesIpc.js:L4 | neighbors=[registerSucursalesIpc.js]
- "ipc_registersucursalesipc_supabase": "{ supabase }" | kind=code-symbol | source=ipc/registerSucursalesIpc.js:L3 | neighbors=[registerSucursalesIpc.js]
- "ipc_registertransferenciasipc_db_runquery_allquery": "{ db, runQuery, allQuery }" | kind=code-symbol | source=ipc/registerTransferenciasIpc.js:L3 | neighbors=[registerTransferenciasIpc.js]
- "ipc_registertransferenciasipc_ipcmain": "{ ipcMain }" | kind=code-symbol | source=ipc/registerTransferenciasIpc.js:L1 | neighbors=[registerTransferenciasIpc.js]
- "ipc_registertransferenciasipc_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=ipc/registerTransferenciasIpc.js:L4 | neighbors=[registerTransferenciasIpc.js]
- "ipc_registertransferenciasipc_registrarmovimientoinventario": "{ registrarMovimientoInventario }" | kind=code-symbol | source=ipc/registerTransferenciasIpc.js:L5 | neighbors=[registerTransferenciasIpc.js]
- "ipc_registertransferenciasipc_solicitarsincronizacion": "{ solicitarSincronizacion }" | kind=code-symbol | source=ipc/registerTransferenciasIpc.js:L6 | neighbors=[registerTransferenciasIpc.js]
- "ipc_registertransferenciasipc_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=ipc/registerTransferenciasIpc.js:L2 | neighbors=[registerTransferenciasIpc.js]
- "ipc_registerusuariosipc_db_runquery_allquery": "{ db, runQuery, allQuery }" | kind=code-symbol | source=ipc/registerUsuariosIpc.js:L3 | neighbors=[registerUsuariosIpc.js]
- "ipc_registerusuariosipc_ipcmain": "{ ipcMain }" | kind=code-symbol | source=ipc/registerUsuariosIpc.js:L1 | neighbors=[registerUsuariosIpc.js]
- "ipc_registerusuariosipc_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=ipc/registerUsuariosIpc.js:L4 | neighbors=[registerUsuariosIpc.js]
- "ipc_registerusuariosipc_solicitarsincronizacion_synccolaauditoria_notificarventanasreportes": "{ solicitarSincronizacion, syncColaAuditoria, notificarVentanasReportes }" | kind=code-symbol | source=ipc/registerUsuariosIpc.js:L5 | neighbors=[registerUsuariosIpc.js]
- "ipc_registerusuariosipc_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=ipc/registerUsuariosIpc.js:L2 | neighbors=[registerUsuariosIpc.js]
- "ipc_registerventasipc_calcularfechaventaanterior": "calcularFechaVentaAnterior()" | kind=code-symbol | source=ipc/registerVentasIpc.js:L24 | neighbors=[registerVentasIpc.js]
- "ipc_registerventasipc_db_runquery_allquery": "{ db, runQuery, allQuery }" | kind=code-symbol | source=ipc/registerVentasIpc.js:L3 | neighbors=[registerVentasIpc.js]
- "ipc_registerventasipc_esfechaanteriorvalida_construirfechaisodedia": "{ esFechaAnteriorValida, construirFechaISODeDia }" | kind=code-symbol | source=ipc/registerVentasIpc.js:L6 | neighbors=[registerVentasIpc.js]
- "ipc_registerventasipc_insertarventatx_eliminarventatx_editarventacompletatx": "{ insertarVentaTx, eliminarVentaTx, editarVentaCompletaTx }" | kind=code-symbol | source=ipc/registerVentasIpc.js:L5 | neighbors=[registerVentasIpc.js]
- "ipc_registerventasipc_ipcmain": "{ ipcMain }" | kind=code-symbol | source=ipc/registerVentasIpc.js:L1 | neighbors=[registerVentasIpc.js]
- "ipc_registerventasipc_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=ipc/registerVentasIpc.js:L4 | neighbors=[registerVentasIpc.js]
- "ipc_registerventasipc_solicitarsincronizacion": "{ solicitarSincronizacion }" | kind=code-symbol | source=ipc/registerVentasIpc.js:L7 | neighbors=[registerVentasIpc.js]
- "ipc_registerventasipc_sqlfechadia": "sqlFechaDia()" | kind=code-symbol | source=ipc/registerVentasIpc.js:L12 | neighbors=[registerVentasIpc.js]
- "ipc_registerventasipc_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=ipc/registerVentasIpc.js:L2 | neighbors=[registerVentasIpc.js]
- "main_app_browserwindow_protocol_screen": "{ app, BrowserWindow, protocol, screen }" | kind=code-symbol | source=main.js:L1 | neighbors=[main.js]
- "main_createwindow": "createWindow()" | kind=code-symbol | source=main.js:L29 | neighbors=[main.js]
- "main_db": "{ db }" | kind=code-symbol | source=main.js:L4 | neighbors=[main.js]
- "main_imagenesappdir": "{ imagenesAppDir }" | kind=code-symbol | source=main.js:L6 | neighbors=[main.js]
- "main_initdb": "{ initDB }" | kind=code-symbol | source=main.js:L5 | neighbors=[main.js]
- "main_path": "path" | kind=code-symbol | source=main.js:L2 | neighbors=[main.js]
- "main_procesarsincronizacion": "{ procesarSincronizacion }" | kind=code-symbol | source=main.js:L7 | neighbors=[main.js]
- "main_registerabonosipc": "{ registerAbonosIpc }" | kind=code-symbol | source=main.js:L22 | neighbors=[main.js]
- "main_registerallipchandlers": "registerAllIpcHandlers()" | kind=code-symbol | source=main.js:L52 | neighbors=[main.js]
- "main_registerauditoriaipc": "{ registerAuditoriaIpc }" | kind=code-symbol | source=main.js:L18 | neighbors=[main.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-018.json

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
