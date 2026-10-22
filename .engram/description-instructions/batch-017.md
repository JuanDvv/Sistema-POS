# Node Description Batch 18 of 25

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

- "ipc_registergastosipc_esfechaanteriorvalida_construirfechaisodedia_obtenerfechahoyyyyymmdd": "{ esFechaAnteriorValida, construirFechaISODeDia, obtenerFechaHoyYYYYMMDD }" | kind=code-symbol | source=ipc/registerGastosIpc.js:L7 | neighbors=[registerGastosIpc.js]
- "ipc_registergastosipc_insertargastotx": "{ insertarGastoTx }" | kind=code-symbol | source=ipc/registerGastosIpc.js:L6 | neighbors=[registerGastosIpc.js]
- "ipc_registergastosipc_ipcmain": "{ ipcMain }" | kind=code-symbol | source=ipc/registerGastosIpc.js:L1 | neighbors=[registerGastosIpc.js]
- "ipc_registergastosipc_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=ipc/registerGastosIpc.js:L4 | neighbors=[registerGastosIpc.js]
- "ipc_registergastosipc_registrarmovimientoinventario": "{ registrarMovimientoInventario }" | kind=code-symbol | source=ipc/registerGastosIpc.js:L5 | neighbors=[registerGastosIpc.js]
- "ipc_registergastosipc_solicitarsincronizacion": "{ solicitarSincronizacion }" | kind=code-symbol | source=ipc/registerGastosIpc.js:L8 | neighbors=[registerGastosIpc.js]
- "ipc_registergastosipc_sqlfechadia": "sqlFechaDia()" | kind=code-symbol | source=ipc/registerGastosIpc.js:L15 | neighbors=[registerGastosIpc.js]
- "ipc_registergastosipc_tipos_gasto_estados_devolucion_requiereajusteinventario": "{ TIPOS_GASTO, ESTADOS_DEVOLUCION, requiereAjusteInventario }" | kind=code-symbol | source=ipc/registerGastosIpc.js:L9 | neighbors=[registerGastosIpc.js]
- "ipc_registergastosipc_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=ipc/registerGastosIpc.js:L2 | neighbors=[registerGastosIpc.js]
- "ipc_registerimpresionipc_imprimirticket_imprimirticketpedido_listarimpresorasdisponibles_guardarimpresoralocal_leerimpresoraguardada": "{ imprimirTicket, imprimirTicketPedido, listarImpresorasDisponibles, guardarImp…" | kind=code-symbol | source=ipc/registerImpresionIpc.js:L2 | neighbors=[registerImpresionIpc.js]
- "ipc_registerimpresionipc_ipcmain_browserwindow": "{ ipcMain, BrowserWindow }" | kind=code-symbol | source=ipc/registerImpresionIpc.js:L1 | neighbors=[registerImpresionIpc.js]
- "ipc_registerpedidosipc_crearpedidotx_registrarabonopedidotx_eliminarabonopedidotx_editarpedidotx_cancelarpedidotx_entregarpedidotx_revertirentregapedidotx": "{\r\n    crearPedidoTx, registrarAbonoPedidoTx, eliminarAbonoPedidoTx,\r\n    edita…" | kind=code-symbol | source=ipc/registerPedidosIpc.js:L3 | neighbors=[registerPedidosIpc.js]
- "ipc_registerpedidosipc_db_allquery": "{ db, allQuery }" | kind=code-symbol | source=ipc/registerPedidosIpc.js:L2 | neighbors=[registerPedidosIpc.js]
- "ipc_registerpedidosipc_ipcmain": "{ ipcMain }" | kind=code-symbol | source=ipc/registerPedidosIpc.js:L1 | neighbors=[registerPedidosIpc.js]
- "ipc_registerpedidosipc_obtenerfechahoyyyyymmdd": "{ obtenerFechaHoyYYYYMMDD }" | kind=code-symbol | source=ipc/registerPedidosIpc.js:L7 | neighbors=[registerPedidosIpc.js]
- "ipc_registerpedidosipc_sqlfechadia": "sqlFechaDia()" | kind=code-symbol | source=ipc/registerPedidosIpc.js:L12 | neighbors=[registerPedidosIpc.js]
- "ipc_registerpedidosugeridoipc_allquery": "{ allQuery }" | kind=code-symbol | source=ipc/registerPedidoSugeridoIpc.js:L3 | neighbors=[registerPedidoSugeridoIpc.js]
- "ipc_registerpedidosugeridoipc_calcularrecomendacionespasteleriasucursal_obtenerproductospasteleriaconsugeridos_upsertsugeridopasteleriatx": "{\r\n    calcularRecomendacionesPasteleriaSucursal,\r\n    obtenerProductosPasteler…" | kind=code-symbol | source=ipc/registerPedidoSugeridoIpc.js:L4 | neighbors=[registerPedidoSugeridoIpc.js]
- "ipc_registerpedidosugeridoipc_fs": "fs" | kind=code-symbol | source=ipc/registerPedidoSugeridoIpc.js:L2 | neighbors=[registerPedidoSugeridoIpc.js]
- "ipc_registerpedidosugeridoipc_generarexcelpedidoextra": "{ generarExcelPedidoExtra }" | kind=code-symbol | source=ipc/registerPedidoSugeridoIpc.js:L9 | neighbors=[registerPedidoSugeridoIpc.js]
- "ipc_registerpedidosugeridoipc_generarexcelsugeridospasteleria": "{ generarExcelSugeridosPasteleria }" | kind=code-symbol | source=ipc/registerPedidoSugeridoIpc.js:L10 | neighbors=[registerPedidoSugeridoIpc.js]
- "ipc_registerpedidosugeridoipc_ipcmain_browserwindow_dialog": "{ ipcMain, BrowserWindow, dialog }" | kind=code-symbol | source=ipc/registerPedidoSugeridoIpc.js:L1 | neighbors=[registerPedidoSugeridoIpc.js]
- "ipc_registerproductosipc_fs": "fs" | kind=code-symbol | source=ipc/registerProductosIpc.js:L2 | neighbors=[registerProductosIpc.js]
- "ipc_registerproductosipc_generarplantillaabastecimiento_leerplantillaabastecimiento": "{ generarPlantillaAbastecimiento, leerPlantillaAbastecimiento }" | kind=code-symbol | source=ipc/registerProductosIpc.js:L9 | neighbors=[registerProductosIpc.js]
- "ipc_registerproductosipc_ipcmain_browserwindow_dialog": "{ ipcMain, BrowserWindow, dialog }" | kind=code-symbol | source=ipc/registerProductosIpc.js:L1 | neighbors=[registerProductosIpc.js]
- "ipc_registerproductosipc_notificarinventarioactualizado": "notificarInventarioActualizado()" | kind=code-symbol | source=ipc/registerProductosIpc.js:L14 | neighbors=[registerProductosIpc.js]
- "ipc_registerproductosipc_path": "path" | kind=code-symbol | source=ipc/registerProductosIpc.js:L3 | neighbors=[registerProductosIpc.js]
- "ipc_registerproductosipc_processlocalproductimage": "{ processLocalProductImage }" | kind=code-symbol | source=ipc/registerProductosIpc.js:L7 | neighbors=[registerProductosIpc.js]
- "ipc_registerproductosipc_registrarauditoria": "{ registrarAuditoria }" | kind=code-symbol | source=ipc/registerProductosIpc.js:L6 | neighbors=[registerProductosIpc.js]
- "ipc_registerproductosipc_registrarmovimientoinventario": "{ registrarMovimientoInventario }" | kind=code-symbol | source=ipc/registerProductosIpc.js:L8 | neighbors=[registerProductosIpc.js]
- "ipc_registerproductosipc_runquery_allquery": "{ runQuery, allQuery }" | kind=code-symbol | source=ipc/registerProductosIpc.js:L5 | neighbors=[registerProductosIpc.js]
- "ipc_registerproductosipc_solicitarsincronizacion": "{ solicitarSincronizacion }" | kind=code-symbol | source=ipc/registerProductosIpc.js:L10 | neighbors=[registerProductosIpc.js]
- "ipc_registerproductosipc_v4_uuidv4": "{ v4: uuidv4 }" | kind=code-symbol | source=ipc/registerProductosIpc.js:L4 | neighbors=[registerProductosIpc.js]
- "ipc_registerreportesipc_allquery": "{ allQuery }" | kind=code-symbol | source=ipc/registerReportesIpc.js:L4 | neighbors=[registerReportesIpc.js]
- "ipc_registerreportesipc_fs": "fs" | kind=code-symbol | source=ipc/registerReportesIpc.js:L3 | neighbors=[registerReportesIpc.js]
- "ipc_registerreportesipc_ipcmain_browserwindow_dialog_app": "{ ipcMain, BrowserWindow, dialog, app }" | kind=code-symbol | source=ipc/registerReportesIpc.js:L1 | neighbors=[registerReportesIpc.js]
- "ipc_registerreportesipc_path": "path" | kind=code-symbol | source=ipc/registerReportesIpc.js:L2 | neighbors=[registerReportesIpc.js]
- "ipc_registerreportesipc_sqlfechadia": "sqlFechaDia()" | kind=code-symbol | source=ipc/registerReportesIpc.js:L9 | neighbors=[registerReportesIpc.js]
- "ipc_registerreportesipc_tipos_gasto_estados_devolucion": "{ TIPOS_GASTO, ESTADOS_DEVOLUCION }" | kind=code-symbol | source=ipc/registerReportesIpc.js:L5 | neighbors=[registerReportesIpc.js]
- "ipc_registersistemaipc_ipcmain_browserwindow_screen": "{ ipcMain, BrowserWindow, screen }" | kind=code-symbol | source=ipc/registerSistemaIpc.js:L1 | neighbors=[registerSistemaIpc.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-017.json

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
