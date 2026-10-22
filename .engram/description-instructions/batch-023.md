# Node Description Batch 24 of 24

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

- "ventas_anteriores_btnlogout": "btnLogout" | kind=code-symbol | source=ventas-anteriores.js:L1014 | neighbors=[ventas-anteriores.js]
- "ventas_anteriores_carrito": "carrito" | kind=code-symbol | source=ventas-anteriores.js:L8 | neighbors=[ventas-anteriores.js]
- "ventas_anteriores_categoriascargadas": "categoriasCargadas" | kind=code-symbol | source=ventas-anteriores.js:L11 | neighbors=[ventas-anteriores.js]
- "ventas_anteriores_escategoriapasteleria": "esCategoriaPasteleria()" | kind=code-symbol | source=ventas-anteriores.js:L101 | neighbors=[ventas-anteriores.js]
- "ventas_anteriores_generarcuentacobroventa": "generarCuentaCobroVenta()" | kind=code-symbol | source=ventas-anteriores.js:L521 | neighbors=[ventas-anteriores.js]
- "ventas_anteriores_productoslocales": "productosLocales" | kind=code-symbol | source=ventas-anteriores.js:L7 | neighbors=[ventas-anteriores.js]
- "ventas_anteriores_reservaoriginalporproducto": "reservaOriginalPorProducto" | kind=code-symbol | source=ventas-anteriores.js:L17 | neighbors=[ventas-anteriores.js]
- "ventas_anteriores_tallas_ropa": "TALLAS_ROPA" | kind=code-symbol | source=ventas-anteriores.js:L38 | neighbors=[ventas-anteriores.js]
- "ventas_btnlogout": "btnLogout" | kind=code-symbol | source=ventas.js:L1498 | neighbors=[ventas.js]
- "ventas_cargarclientesfiscales": "cargarClientesFiscales()" | kind=code-symbol | source=ventas.js:L19 | neighbors=[ventas.js]
- "ventas_cargarclientesmayoristas": "cargarClientesMayoristas()" | kind=code-symbol | source=ventas.js:L37 | neighbors=[ventas.js]
- "ventas_carrito": "carrito" | kind=code-symbol | source=ventas.js:L8 | neighbors=[ventas.js]
- "ventas_categoriascargadas": "categoriasCargadas" | kind=code-symbol | source=ventas.js:L55 | neighbors=[ventas.js]
- "ventas_obtenertotalcarrito": "obtenerTotalCarrito()" | kind=code-symbol | source=ventas.js:L69 | neighbors=[ventas.js]
- "ventas_parsenumberui": "parseNumberUI()" | kind=code-symbol | source=ventas.js:L64 | neighbors=[ventas.js]
- "ventas_productosfiltradosactuales": "productosFiltradosActuales" | kind=code-symbol | source=ventas.js:L11 | neighbors=[ventas.js]
- "ventas_productoslocales": "productosLocales" | kind=code-symbol | source=ventas.js:L7 | neighbors=[ventas.js]
- "ventas_separarnombrevariante": "separarNombreVariante()" | kind=code-symbol | source=ventas.js:L214 | neighbors=[ventas.js]
- "ventas_tallas_ropa": "TALLAS_ROPA" | kind=code-symbol | source=ventas.js:L177 | neighbors=[ventas.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\.engram\description-instructions\batch-023.json

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
