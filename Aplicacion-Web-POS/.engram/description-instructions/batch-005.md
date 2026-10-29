# Node Description Batch 6 of 6

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

- "shared_clock_pad2": "pad2()" | kind=code-symbol | source=src/domain/shared/clock.js:L1 | neighbors=[clock.js]
- "shared_clock_pad3": "pad3()" | kind=code-symbol | source=src/domain/shared/clock.js:L5 | neighbors=[clock.js]
- "web_app_abrirmodalabastecer": "abrirModalAbastecer()" | kind=code-symbol | source=src/presentation/web/app.js:L410 | neighbors=[app.js]
- "web_app_abrirmodalcategoria": "abrirModalCategoria()" | kind=code-symbol | source=src/presentation/web/app.js:L419 | neighbors=[app.js]
- "web_app_abrirmodalgasto": "abrirModalGasto()" | kind=code-symbol | source=src/presentation/web/app.js:L1223 | neighbors=[app.js]
- "web_app_abrirmodalproducto": "abrirModalProducto()" | kind=code-symbol | source=src/presentation/web/app.js:L384 | neighbors=[app.js]
- "web_app_btnreloadapp": "btnReloadApp" | kind=code-symbol | source=src/presentation/web/app.js:L1878 | neighbors=[app.js]
- "web_app_els": "els" | kind=code-symbol | source=src/presentation/web/app.js:L29 | neighbors=[app.js]
- "web_app_formatomoneda": "formatoMoneda" | kind=code-symbol | source=src/presentation/web/app.js:L173 | neighbors=[app.js]
- "web_app_obtenerfechaayerstring": "obtenerFechaAyerString()" | kind=code-symbol | source=src/presentation/web/app.js:L722 | neighbors=[app.js]
- "web_app_seleccionarproductoparaventa": "seleccionarProductoParaVenta()" | kind=code-symbol | source=src/presentation/web/app.js:L928 | neighbors=[app.js]
- "web_app_state": "state" | kind=code-symbol | source=src/presentation/web/app.js:L1 | neighbors=[app.js]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\juan.vergara\Music\Sistema-POS - Copy\Aplicacion-Web-POS\.engram\description-instructions\batch-005.json

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
