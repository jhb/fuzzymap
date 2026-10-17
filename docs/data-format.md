# Data format

[Deutsch](datenformat.md) · **English**

fuzzymap stores everything as JSON – in the browser (`localStorage`) and in export files. Runs can additionally be
exported as CSV.

## Export file (`*.fuzzymap.json`, `fuzzymap-backup-*.json`)

```json
{
  "format": "fuzzymap-fcm",
  "version": 2,
  "exported": "2026-10-14T10:30:00.000Z",
  "maps": [ …map… ]
}
```

| Field | Type | Meaning |
|---|---|---|
| `format` | string | Always `"fuzzymap-fcm"` (older exports: `"fuzzmap-fcm"`, `"wirkgraph-fcm"`, `"wirkgefuege-fcm"`; the field is not checked on import) |
| `version` | int | Version of the export format, currently `2` |
| `exported` | string | Time of export (ISO 8601, UTC) |
| `maps` | array | One map (single export) or all maps (backup) |

The import also accepts a **single map** as the root object or an **array of maps**.

## Map

```json
{
  "id": "m1728901234567",
  "name": "Example: City traffic",
  "created": "2026-10-14T07:10:00.000Z",
  "updated": "2026-10-14T10:29:41.000Z",
  "nodes": [
    { "id": "n17289012345671", "label": "Cycling", "value": 100, "x": 160, "y": 140, "c": 0 }
  ],
  "edges": [
    { "id": "e17289012345679", "src": "n17289012345671", "dst": "n17289012345672", "w": -0.4 }
  ],
  "draft": { "changes": { "n17289012345674": 100 }, "unit": "pct", "rounds": 12, "damping": 1.0, "model": "abs" },
  "sims": [ { …run… } ]
}
```

### Nodes (`nodes[]`)

| Field | Type | Required | Meaning |
|---|---|---|---|
| `id` | string | yes | Unique within the map |
| `label` | string | – | Displayed text (default “Node *n*”) |
| `value` | number | – | Current value (default 0) |
| `x`, `y` | number | – | Position on the canvas (world coordinates, centre of the node) |
| `c` | int | – | Index into the colour palette (0–11); if missing, a free colour is assigned on load |
| `note` | string | – | Description shown on hover (up to 2000 characters, line breaks allowed); absent if empty |

### Edges (`edges[]`)

| Field | Type | Required | Meaning |
|---|---|---|---|
| `id` | string | – | Unique within the map |
| `src` | string | yes | ID of the source node |
| `dst` | string | yes | ID of the target node; equal to `src` = loop (node acts on itself) |
| `w` | number | – | Factor, −10 … +10 (default 0.5), rounded to three decimals in the editor |
| `note` | string | – | Description of the effect, shown on hover (up to 2000 characters); absent if empty |

At most one edge is allowed per pair (`src`, `dst`).

### Simulation settings (`draft`)

The values last entered in the *Simulation* tab.

| Field | Type | Meaning |
|---|---|---|
| `changes` | object | `{ node ID: number }` – impulse in the unit `unit`, only entries ≠ 0 |
| `unit` | string | `"pct"` = percent of the current value (default), `"abs"` = absolute amount |
| `rounds` | int | Number of rounds, 1–200 |
| `damping` | number | Damping per round, 0–1 |
| `model` | string | Always `"abs"` (absolute model) |

### Run (`sims[]`)

A saved simulation run is a **snapshot** – it stays valid even if the map is changed later.

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Unique ID |
| `name` | string | Display name |
| `created` | string | Timestamp (ISO 8601) |
| `model` | string | `"abs"`; old runs: `"log"` (multiplicative) or `"lin"` (linear) |
| `rounds` | int | Number of simulated rounds |
| `damping` | number | Damping used |
| `changes` | object | Impulse `{ node ID: number }` as entered, in the unit `unit` |
| `unit` | string | `"pct"` or `"abs"`; missing in older runs (then percent) |
| `deltas` | object | Impulse converted into absolute changes `{ node ID: Δ }` – what was added in round 1 |
| `nodes` | array | Node IDs in the column order of `history` |
| `labels` | object | `{ node ID: text }` at the time of the run |
| `colors` | object | `{ node ID: colour index }` at the time of the run |
| `edges` | array | Copy of the edges at the time of the run |
| `history` | array | `rounds + 1` rows; row *t* holds the values of all nodes (order as in `nodes`) after round *t*. Row 0 = initial state |
| `stable` | int \| null | First round from which no change is passed on any more, otherwise `null` |

## Browser storage (`localStorage["fcm.maps.v1"]`)

```json
{
  "version": 1,
  "current": "m1728901234567",
  "settings": { "sizeByValue": false, "panelW": 400, "chartY": "abs", "lang": "en" },
  "maps": [ …maps… ]
}
```

| Field | Meaning |
|---|---|
| `current` | ID of the map opened last |
| `settings.sizeByValue` | State of the *Size by value* switch (applies to all maps) |
| `settings.panelW` | Width of the sidebar in pixels (300–900, default 400) |
| `settings.chartY` | y-axis of the line chart: `"abs"` = absolute value (default), `"pct"` = change relative to round 0 in % |
| `settings.lang` | Interface language: `"de"` or `"en"`; if missing, the browser language applies |

## Clean-up on import

- Maps always get a **new ID**; maps with the same name get the suffix “(imported)”, “(imported) 2” and so on.
- IDs may only contain letters, digits, `_` and `-` (max. 64 characters); others are replaced by new IDs and all
  references (edges, impulse, runs) are rewritten. Nodes without `id` get a new one, duplicate IDs are dropped.
  Missing positions are distributed on a grid.
- Edges to non-existent nodes and duplicate edges are dropped (loops are kept); `w` is clamped to −10 … +10.
- Descriptions (`note`) are taken over if they are text; empty ones are dropped, longer ones are cut to 2000
  characters.
- Runs without `history` or `nodes` are dropped; missing metadata is filled in.

## SVG export of a map

*Export / Import → Current map (SVG)* creates a standalone SVG file (UTF-8) of the map as currently shown – with an
open run, with the values and labels of the round shown. Selection and highlighting are not included. Structure:

- `<title>` = map name, `<desc>` = note about fuzzymap
- `<style>` with fixed colours (light scheme, no CSS variables or `color-mix`, so graphics programs show the colours
  too)
- `<g class="map">` with arrowheads, edges, factor labels and nodes (same classes and `data-*` attributes as in the
  app), followed by a hidden `<foreignObject class="tip" data-for="ID">` per node and edge holding the hover display as
  XHTML

The hover display needs no script: `.node[data-hl="ID"]:hover ~ .tip[data-for="ID"]` shows the box, dimming the other
elements uses `:has()`. This works when the file is opened directly in a browser or embedded via `<object>`/inline; as
`<img>` or in graphics programs the image is static.

## CSV export of a run

File `mapname-runname.csv`, UTF-8 with BOM, CRLF line endings. The format follows the interface language: English
with separator `,` and decimal point (example below), German with separator `;`, decimal comma and the header cells
`Runde` and `Faktor`.

```
Round,Cycling,Car traffic,Air quality,…
0,100,100,100,…
1,100,100,100,…
2,160,100,100,…
…

Factor,,,
Cycle lane expansion,Cycling,0.6
Cycling,Car traffic,-0.4
…
```

The first block contains the values of all nodes per round. After an empty line follows the edge list
(source, target, factor) at the time of the run.
