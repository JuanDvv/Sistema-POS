# Node Description Batch 25 of 25

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

- "transferencias_formatcop": "formatCOP()" | kind=code-symbol | source=transferencias.js:L32 | neighbors=[transferencias.js]
- "transferencias_productoslocales": "productosLocales" | kind=code-symbol | source=transferencias.js:L27 | neighbors=[transferencias.js]
- "transferencias_sucursalesdisponibles": "sucursalesDisponibles" | kind=code-symbol | source=transferencias.js:L29 | neighbors=[transferencias.js]
- "transferencias_transfercart": "transferCart" | kind=code-symbol | source=transferencias.js:L28 | neighbors=[transferencias.js]
- "turnos_guardaroperadoresstorage": "guardarOperadoresStorage()" | kind=code-symbol | source=turnos.js:L60 | neighbors=[turnos.js]
- "utils_excelabastecimiento_columnas": "COLUMNAS" | kind=code-symbol | source=utils/excelAbastecimiento.js:L10 | neighbors=[excelAbastecimiento.js]
- "utils_excelabastecimiento_exceljs": "ExcelJS" | kind=code-symbol | source=utils/excelAbastecimiento.js:L1 | neighbors=[excelAbastecimiento.js]
- "utils_excelpedidoextra_columnas": "COLUMNAS" | kind=code-symbol | source=utils/excelPedidoExtra.js:L8 | neighbors=[excelPedidoExtra.js]
- "utils_excelpedidoextra_exceljs": "ExcelJS" | kind=code-symbol | source=utils/excelPedidoExtra.js:L1 | neighbors=[excelPedidoExtra.js]
- "utils_excelsugeridospasteleria_columnas": "COLUMNAS" | kind=code-symbol | source=utils/excelSugeridosPasteleria.js:L8 | neighbors=[excelSugeridosPasteleria.js]
- "utils_excelsugeridospasteleria_exceljs": "ExcelJS" | kind=code-symbol | source=utils/excelSugeridosPasteleria.js:L1 | neighbors=[excelSugeridosPasteleria.js]
- "utils_gastos_construirdescripcionvencidos": "construirDescripcionVencidos()" | kind=code-symbol | source=utils/gastos.js:L32 | neighbors=[gastos.js]
- "utils_gastos_esgastonofinanciero": "esGastoNoFinanciero()" | kind=code-symbol | source=utils/gastos.js:L18 | neighbors=[gastos.js]
- "utils_gastos_esgastorestringidoadministradores": "esGastoRestringidoAdministradores()" | kind=code-symbol | source=utils/gastos.js:L23 | neighbors=[gastos.js]
- "ventas_anteriores_btnlogout": "btnLogout" | kind=code-symbol | source=ventas-anteriores.js:L1107 | neighbors=[ventas-anteriores.js]
- "ventas_anteriores_carrito": "carrito" | kind=code-symbol | source=ventas-anteriores.js:L26 | neighbors=[ventas-anteriores.js]
- "ventas_anteriores_categoriascargadas": "categoriasCargadas" | kind=code-symbol | source=ventas-anteriores.js:L29 | neighbors=[ventas-anteriores.js]
- "ventas_anteriores_escategoriapasteleria": "esCategoriaPasteleria()" | kind=code-symbol | source=ventas-anteriores.js:L119 | neighbors=[ventas-anteriores.js]
- "ventas_anteriores_generarcuentacobroventa": "generarCuentaCobroVenta()" | kind=code-symbol | source=ventas-anteriores.js:L574 | neighbors=[ventas-anteriores.js]
- "ventas_anteriores_productoslocales": "productosLocales" | kind=code-symbol | source=ventas-anteriores.js:L25 | neighbors=[ventas-anteriores.js]
- "ventas_anteriores_reservaoriginalporproducto": "reservaOriginalPorProducto" | kind=code-symbol | source=ventas-anteriores.js:L35 | neighbors=[ventas-anteriores.js]
- "ventas_bolsas_acceso_rapido": "BOLSAS_ACCESO_RAPIDO" | kind=code-symbol | source=ventas.js:L65 | neighbors=[ventas.js]
- "ventas_btnlogout": "btnLogout" | kind=code-symbol | source=ventas.js:L1603 | neighbors=[ventas.js]
- "ventas_cargarclientesfiscales": "cargarClientesFiscales()" | kind=code-symbol | source=ventas.js:L37 | neighbors=[ventas.js]
- "ventas_carrito": "carrito" | kind=code-symbol | source=ventas.js:L26 | neighbors=[ventas.js]
- "ventas_categoriascargadas": "categoriasCargadas" | kind=code-symbol | source=ventas.js:L60 | neighbors=[ventas.js]
- "ventas_obtenertotalcarrito": "obtenerTotalCarrito()" | kind=code-symbol | source=ventas.js:L77 | neighbors=[ventas.js]
- "ventas_productosfiltradosactuales": "productosFiltradosActuales" | kind=code-symbol | source=ventas.js:L29 | neighbors=[ventas.js]
- "ventas_productoslocales": "productosLocales" | kind=code-symbol | source=ventas.js:L25 | neighbors=[ventas.js]
- "ventas_separarnombrevariante": "separarNombreVariante()" | kind=code-symbol | source=ventas.js:L144 | neighbors=[ventas.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-024.json

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
