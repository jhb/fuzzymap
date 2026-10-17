# Architecture

[Deutsch](architektur.md) · **English**

fuzzymap is a pure client application without a build step. `index.html` provides the static skeleton, PyScript starts
MicroPython in the browser and runs `main.mpy`. `main.mpy` generates all dynamic content (SVG graph, lists, chart) as
HTML/SVG strings and reacts to events via a few central listeners.

```
index.html ──loads──▶ vendor/pyscript/core.js ──starts──▶ vendor/micropython (WASM) ──runs──▶ main.mpy
     │                                                                     │
     └── static skeleton, help dialog                                      ├── localStorage (storage)
                                                                           ├── DOM / SVG (rendering)
sw.js (vanilla JS) ── offline cache for all files ◀─ registered by ────────┘
```

## Structure of `main.mpy`

The file is divided into sections (comments `# ------ Section`; the section names in the code are German):

| Section | Purpose | Key functions |
|---|---|---|
| Language (Sprache) | Translation, decimal separator | `_`, `is_en`, `dec_sep`, `LANG` |
| Helpers (Hilfen) | DOM access, formatting (numbers per language), parsing | `el`, `attr`, `closest`, `esc`, `fnum`, `fpct`, `fweight`, `pfloat` |
| Data (Daten) | Map model, colours, load/save, sample map | `cur`, `ensure_map`, `free_color`, `node_color`, `load`, `save` |
| Simulation | Computation model, creating a run | `simulate`, `run_sim` |
| View (Ansicht) | Viewport, zoom, geometry, SVG rendering of the map | `fit`, `zoom`, `node_scales`, `border_pt`, `run_state`, `render_canvas` |
| Panel | Sidebar: inspector, lists, form, runs, chart | `render_inspector`, `render_node_list`, `render_sim_form`, `render_runs`, `render_run_detail`, `chart_svg` |
| Playback (Simulation abspielen) | Playback bar and timer | `open_run`, `set_round`, `play`, `stop` |
| Editing (Bearbeiten) | Adding and deleting nodes/edges, modes | `add_node`, `add_edge`, `delete_sel`, `set_mode` |
| Pointer events (Zeiger-Ereignisse) | Dragging, connecting, panning, pinch zoom | `on_down`, `on_move`, `on_up`, `on_wheel` |
| Actions (Aktionen) | Handlers for buttons (`data-action`) | `ACTIONS` table, `on_click`, `on_input`, `on_key` |
| Export / Import | Creating JSON/CSV/SVG (`export_svg_text`), reading files, drag & drop, messages | `export_json`, `a_export_run_csv`, `clean_map`, `import_files`, `toast` |
| Linked hovering (Verknüpftes Hovern) | Shared highlighting across graph, chart and lists; value display in the chart | `apply_hover`, `set_hover`, `on_over`, `chart_tip`, `on_chart_move` |
| Start | Registering listeners, first render, service worker | `main` |

## State

The entire runtime state lives in the dict `S`:

| Key | Meaning |
|---|---|
| `maps`, `current` | All maps and the ID of the active map (persisted) |
| `settings` | Global settings, e.g. `sizeByValue` (persisted) |
| `sel` | Selection `{"type": "node" \| "edge", "id": …}` |
| `mode` | `select`, `node` or `edge` |
| `view` | Viewport in world coordinates (`x`, `y`, `w`, `h`) |
| `drag`, `temp`, `pending` | Current pointer action, helper line while connecting, chosen source node when tapping |
| `tab` | Active sidebar tab |
| `run`, `round`, `timer` | Open run, round shown, playback timer |
| `hover` | Node ID currently highlighted |
| `ehover` | Edge ID under the pointer (for the hover display on edges) |

Only `maps`, `current` and `settings` are persisted (see [`data-format.md`](data-format.md)). `save()` is called after
every change and writes the complete state.

To keep this fast even with many saved runs:

- `dump_state()` assembles the JSON text itself. Each run is serialised only once and cached in `RUN_JSON`
  (run ID → (name, JSON)); runs are snapshots, only a new name forces re-serialisation. With 15 runs of 100 rounds
  (≈ 200 KB) the time per keystroke drops from ≈ 70 ms to ≈ 7 ms.
- Input in text fields (`on_input`) calls `save_soon()`: saving happens 400 ms after the last input.
  `flush_save()` on `visibilitychange` saves anything pending immediately when the page is hidden or closed. Every
  direct `save()` call also takes care of a pending save.
- `pagehide` cannot be registered on `window` through the PyScript bridge (“Illegal invocation”); `visibilitychange`
  covers closing and switching tabs.

## Rendering

- **Strings instead of DOM operations:** every `render_*` function builds HTML/SVG as a string and sets `innerHTML`.
  In MicroPython this is fast enough for maps with many dozens of nodes and keeps the code simple.
- **Event delegation:** because elements are constantly recreated, all listeners are attached to `document` or the
  `<svg>`. Buttons carry `data-action="…"`, which is resolved in the `ACTIONS` table.
- **Preserving focus:** input in the inspector only updates the map and lists, not the inspector itself – otherwise
  the field being edited would be replaced and focus would be lost.
- **World coordinates:** the SVG uses `viewBox` = `S["view"]` with `preserveAspectRatio="none"`; `fix_aspect()` keeps
  the aspect ratio matching the canvas so that `to_world()` can convert screen to world coordinates.
- **Edges:** quadratic Bézier curves; if the opposite edge exists, the control point is offset sideways.
  `border_pt()` computes the intersection with the (possibly scaled) node rectangle so that arrows start at the border.
- **Node size:** `node_scales()` returns a factor per node (0.7 … 1.3 with *Size by value*, otherwise 1) – without
  a run linear over the range of values (min … max, square root for the area), in a run by `±log2(1 + |Δ/start|)`
  clamped to ±1, for start value 0 by `Δ / largest change of such nodes in the run`; the node
  content is scaled via `transform="scale(…)"`, stroke widths stay constant thanks to `vector-effect`.
- **Highlighting:** elements belonging to a node carry `data-hl="node ID"`, edges `data-ends="source target"`.
  `apply_hover()` sets the class `hl` on all matching elements and `hovering` on `<body>`; CSS dims the remaining
  elements. Every `render_*` function calls `apply_hover()` at the end so that the highlight survives a redraw.

## Divider and resizing

The layout is a grid with three columns: map, divider (8 px), sidebar with the width `--panel-w`.
`on_split_down/move/up` set the width via pointer capture through `set_panel_w()`, which clamps it to 300 px up to
`min(900, layout width − 328)` and stores it in `settings.panelW`. When the map area changes (divider or window),
`on_resize()` keeps scale and centre and only adjusts the width of the visible section. A second `ResizeObserver` on
the sidebar redraws the chart at the new width (`chart_width()`) so that text and lines keep their size.

## Loops

Edges with `src == dst` are drawn by `loop_svg()` as a cubic arc. `loop_side()` picks, among top, right, left and
bottom, the side with the largest angular distance to the node's other edges (on a tie, top wins). `fit()` includes the
arcs in the view. In `simulate()` loops are treated like any other edge. Creating one: second tap on the marked node
in edge mode, dragging out and back (`drag["left"]`, so that a slightly shaky tap does not create a loop), or the
button in the inspector.

## Hover display on nodes and edges

While drawing, `render_canvas()` stores the position and half height of every node (`NODE_GEO`), the position of
every factor label (`EDGE_GEO`) and, in simulation mode, the node values (`NODE_INFO`). `on_over` remembers the node
(`S["hover"]`, via `data-hl`) and the edge (`S["ehover"]`, via `data-edge`) under the pointer.

`node_tip()` is called from `apply_hover()` or `on_over` and fills a single HTML element (`#node-tip`); the content
comes from `tip_content()`, which the SVG export uses as well (with `xml=True` for well-formed XHTML):

- **Edge:** source → target and factor, positioned at the factor label.
- **Node without a run:** colour, text and value.
- **Node in a run:** round, value, start value and change, absolute and in percent.
- Below that the **description** (`note`, HTML-escaped, line breaks as `<br>`), if there is one.

The element is positioned in percent of the map area above (or, near the top edge, below) the element and is hidden
while dragging and while editing text on the map. Since `apply_hover()` runs at the end of every draw, the display
follows round, panning and zoom. The browser tooltip (`<title>`) is not used.

**Descriptions** are edited in the inspector in a `<textarea>` (`note_field()`); `on_input` writes them to `note`
(empty = field removed) and only redraws the map when the marker (`.note-dot`) changes.

## Editing text on the map

A single `<input id="node-edit">` lies above the map. `start_inline_edit(nid)` leaves the simulation view if needed,
remembers node and original text in `EDIT` and focuses the field immediately (iOS only opens the keyboard within the
gesture) and again after 30 ms; a loss of focus within the first 400 ms is ignored. `position_inline_edit()` runs at
the end of every `render_canvas()` and places the field in pixels over the text line, so it follows zoom and panning.
Input changes the text live (map, node list, inspector field); `end_inline_edit(commit)` saves or restores the
original text.

Double-clicks on nodes are detected by `on_up` itself (same node, not moved, < 400 ms), because the map is redrawn on
the first click and the browser then does not report a reliable `dblclick` on the node. `on_dbl` determines the
target via `document.elementFromPoint`.

## Chart

`settings.chartY` (`"abs"` or `"pct"`) determines the y-axis; the switch calls `a_chart_y()` and only redraws the run
view. In percent mode `chart_svg()` plots `Δ / |start value| · 100` and omits series with start value 0.
`CHART["series"][id]` = (text, plotted values, start value, colour, absolute values) – the hover display positions on
the plotted values and labels with both.

`chart_svg()` draws the absolute values of the changed nodes and stores geometry and data series in `CHART`.
`on_chart_move()` converts the mouse position into the nearest round; `chart_tip()` sets the marker dot and the info
box (HTML, positioned in percent of the chart area). The series of the currently highlighted node (`S["hover"]`) is
shown. On touch (`pointerType == "touch"`) `chart_touch()` selects the line closest to the finger in the round hit;
`touch-action: pan-y` allows horizontal dragging while vertical scrolling remains possible. The display stays after
lifting the finger and disappears when tapping outside. When redrawing during playback the display is restored.

## Simulation

`simulate(m, deltas, rounds, model, damping)` is a pure function without DOM access and returns
`(ids, history, stable)`. It expects absolute initial changes; `to_deltas(m, changes, unit)` converts percentages
beforehand. `set_unit()` converts the form inputs when the unit is switched. It can therefore also be tested
independently. See README, section *Simulation model*.

## PyScript and MicroPython notes

- **Bundled runtime:** by default PyScript loads MicroPython from jsDelivr. The attribute
  `config='{"interpreter": "./vendor/micropython/micropython.mjs"}'` on the `<script type="mpy">` points to the local
  copy instead; `micropython.mjs` finds `micropython.wasm` in the same directory. The server must deliver `.wasm` with
  `application/wasm` (Python's `http.server` does), otherwise the browser falls back to a slower method.

Quirks noticed during development that are worth knowing when extending the code:

- **Dicts are not ordered.** In MicroPython (WebAssembly build) `dict` does not preserve insertion order. Everything
  that needs an order (nodes, edges, runs, `history` columns) is therefore stored as a list.
- **Callbacks to JS** must always be passed with `create_proxy()` and the reference kept (`PROXIES`, `TICK`, `RESIZE`,
  `HIDE_TOAST`), otherwise the garbage collector may collect them.
- **JS errors cannot always be caught.** Some errors from called JS functions (e.g. `Illegal invocation`) abort the
  script instead of appearing as a Python exception. For problems at start-up, the attribute `data-err` on `<body>`
  or the console helps.
- **`null` / `undefined`** are checked with `is_none()` from `pyscript.ffi`; the helpers `attr()` and `closest()`
  encapsulate this.
- **Asynchronous handlers:** `on_import` is `async` (because of `await file.text()`). With drag & drop,
  `preventDefault()` must happen synchronously – that is why `on_drop` starts the import with `asyncio.create_task()`.
- **Window size:** instead of `window.addEventListener("resize", …)` a `ResizeObserver` on the SVG is used; it also
  reacts to layout changes (e.g. mobile view).
- **No full standard library:** among other things no `datetime`, no `uuid`, no `json.dumps(indent=…)`. Dates via
  `window.Date`, IDs via `Date.now()` + randomness, indented JSON via `window.JSON.stringify`.

## Language (German / English)

- **Source language German.** Every visible text in the code is a German literal inside `_()`, e.g.
  `_("Runde {} / {}").format(t, n)`. With `LANG["v"] == "en"`, `_()` returns the entry from `EN` (German text →
  English text), otherwise the text itself. If a translation is missing, the German text appears – nothing breaks.
- **Placeholders and HTML** must stay identical in `EN` (same `{}`/`{name}` and tags); larger HTML templates
  (inspector, run details, lists) are translated as a whole. Anyone changing a German text must change the key in
  `EN` as well.
- **Module-level texts** (`MODEL_NOTE`, `UNIT_NOTES`) are only translated with `_()` when displayed, because the module
  is loaded before the language is chosen.
- **Static texts in `index.html`** carry keys: `data-i18n` (content), `data-i18n-title`, `data-i18n-aria`
  (`aria-label`), `data-i18n-ph` (`placeholder`). On its first call `apply_static()` remembers the German content in
  `data-de-*` and afterwards sets `EN_STATIC[key]` or the original. The English help is a `<template id="help-en">` in
  `index.html` and is swapped with the German help text.
- **Sequence:** `init_lang()` sets the language from `navigator.language`, `load()` overrides it with
  `settings.lang`; the sample map is created afterwards and translates its node names with `_()`. `a_lang` saves the
  choice and calls `apply_static()` and `render_all()`. A small inline script sets `<html lang>` and the loading notice
  in advance, because Python is not running yet at that point.
- **Numbers:** `fnum`, `fweight`, `fpct`, axis labels and CSV use `dec_sep()` and `pct_sign()` (`+50 %` / `+50%`);
  `pfloat` accepts comma and point in both languages.

## Service worker (`sw.js`)

- On install, all files needed for start-up are pre-cached (`CORE`): app, PyScript chunks, MicroPython (`.mjs` and
  `.wasm`) and font. This makes the app fully usable offline after the first load.
- GET requests to the own origin use *stale-while-revalidate*: served from the cache immediately, updated in the
  background. Requests to other origins are not intercepted (there are none any more).
- New PyScript version: adjust the file names of the chunks in `CORE` (see `vendor/LIZENZEN.md`).
- On activation, caches with a different name are deleted – so increase `CACHE` after changes.
- On install it fetches with `cache: "reload"`, i.e. bypassing the browser's HTTP cache.
- The service worker is registered from Python at the end of `main()`.
- **Update without a second load:** the inline script in `index.html` reloads the page once if a service worker was
  already controlling the page and a new one takes over (`controllerchange`). On the very first visit there is no
  controlling service worker yet, so no reload happens.
