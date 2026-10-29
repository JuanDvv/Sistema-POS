# Community Labeling

Engram is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the community listing below
and write 2-5 word plain-language names for each.

## Language

Write every name in English (en). Do not switch languages.

## Communities

Community 0: Tienda-Kary, delipostres-turbaco, main, 10222a9 refactor: enforce full payment for order delivery an, 155d086 Use sessionStorage and add multi-window support, 1dd520d Add configurable PostgreSQL sync backend, 22e246f Add fiscal client and credit tracking improvements, 2812d87 feat: implementa módulo de cierres de caja con regis, 283a3fc feat: agrega splitter arrastrable para ajustar ancho, 29d31c1 feat: implement complete POS system architecture wit, 308b9c1 feat: implement incremental synchronization, atomic , 395c0c1 Add PostgreSQL sync and turno management
Community 1: abrirModalEditarVenta(, apiFetch(, cargarCatalogo(, cargarTurnosAdmin(, formatearFechaAuditoria(, restaurarSesion(, app.js, abrirModalAbastecer(, abrirModalCategoria(, abrirModalDetalleSolGasto(, abrirModalDetalleSolVenta(, abrirModalGasto(
Community 2: catalogoDomain.js, validarAbastecimiento(, validarDatosCategoria(, validarDatosProducto(, server.js, { buscarUsuarioPorUsername, registrarAuditoriaRemota }, { calcularTurnosRango }, config, enviarJson(, extraerTokenRequest(, fs, http
Community 3: obtenerFechaWallClock(, obtenerPartesWallClock(, reporteDiarioRepository.js, buscarGastoDomicilioTx(, { calcularResumenFinancieroDia }, construirTimestampParaDia(, crearGastoEnReporte(, describirCambiosProductos(, editarGastoEnReporte(, editarVentaEnReporte(, eliminarGastoEnReporte(, eliminarVentaEnReporte(
Community 4: ejecutarQuery(, postgresClient.js, { obtenerConfiguracionEntorno }, obtenerPool(, pg, verificarConexionDb(, auditoriaRepository.js, { ejecutarQuery }, listarLogsAuditoria(, sucursalRepository.js, listarSucursalesVigentes(
Community 5: catalogoRepository.js, abastecerStockProducto(, crearProductoConInventario(, editarProductoConInventario(, eliminarCategoriaSoftDelete(, eliminarProductoSoftDelete(, guardarCategoria(, listarCatalogoPorSucursal(, { obtenerPool, ejecutarQuery }, { registrarAuditoriaRemota }, { v4: uuidv4 }
Community 6: calcularTurnosRango(, turnosDomain.js, BASE_UTC, calcularDeltaDias(, calcularTurno(, CICLO_TURNOS, DIAS_SEMANA, formatearUtcAYYYYMMDD(, OPERADORES_DEFAULT, parsearFechaAUtc(
Community 7: reporteDiarioDomain.js, calcularResumenFinancieroDia(, extraerMontosMetodoPago(, normalizarMetodoPagoVenta(, TIPOS_GASTO_VALIDOS, validarDatosGasto(, validarEdicionVenta(, validarFechaReporte(
Community 8: authDomain.js, crypto, firmarTokenSesion(, normalizarCredenciales(, validarUsuarioAutenticado(, verificarTokenSesion(
Community 9: authRepository.js, buscarUsuarioPorUsername(, { ejecutarQuery }, { obtenerFechaWallClock }, registrarAuditoriaRemota(, { v4: uuidv4 }
Community 10: envConfig.js, fs, leerConfigLocalPos(, obtenerConfiguracionEntorno(, path
Community 11: solicitudesRepository.js, { ejecutarQuery }, listarOperadores(, listarSolicitudesGasto(, listarSolicitudesVenta(

## Instructions

Write a single JSON object mapping each community id (as a string) to its
2-5 word name to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\Aplicacion-Web-POS\.engram\label-instructions\communities.json

Example:
```json
{
  "0": "Authentication Flow",
  "1": "Authentication Flow",
  "2": "Authentication Flow"
}
```

Then re-run `engram update` (or `engram label`) to ingest the names.
