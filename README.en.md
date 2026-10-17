# fuzzymap – Fuzzy Cognitive Maps as a PWA

[Deutsch](README.md) · **English**

fuzzymap is an installable web app (PWA) for drawing, saving and **simulating round by round** causal graphs
(fuzzy cognitive maps). Nodes carry a text and a value, directed edges a factor that states how strongly a change
of the source node carries over to the target node.

- Logic entirely in **Python** (PyScript with MicroPython), interface in plain **HTML5 + CSS**
- **Vanilla JS** only where there is no other way: in the service worker (`sw.js`) and in a short inline script
  (loading notice in the right language, reload after an update)
- Works offline, stores data locally in the browser, no server component
- **No third-party servers:** PyScript, MicroPython and the font are bundled (`vendor/`); nothing is loaded from
  third parties at runtime
- **Free software** under the [GNU Affero General Public License v3.0 or later](LICENSE) (AGPL-3.0-or-later)
- **Demo:** <https://baach.de/fuzzymap> – try it right in the browser
- **Source code:** <https://github.com/jhb/fuzzymap>

> **Built by vibe coding.** fuzzymap was created entirely through *vibe coding*: code, interface texts and
> documentation were generated in a dialogue with an AI (Perplexity Computer). The human wrote the requirements,
> tried out the result and gave feedback, but did not write the code. The project has been tested but not
> systematically reviewed – please use it with appropriate care.

---

## Contents

1. [What it is about](#what-it-is-about)
2. [Quick start](#quick-start)
3. [Usage](#usage)
4. [Simulation model](#simulation-model)
5. [Visualisation](#visualisation)
6. [Saving, export and import](#saving-export-and-import)
7. [Keyboard shortcuts](#keyboard-shortcuts)
8. [Project structure](#project-structure)
9. [Development](#development)
10. [Limits and known quirks](#limits-and-known-quirks)
11. [Origin and licence](#origin-and-licence)

Further documents:

- [`docs/data-format.md`](docs/data-format.md) – JSON format for export/import and localStorage, CSV format
  (German: [`docs/datenformat.md`](docs/datenformat.md))
- [`docs/architecture.md`](docs/architecture.md) – structure of `main.mpy`, rendering, events, PyScript notes
  (German: [`docs/architektur.md`](docs/architektur.md))
- [`CHANGELOG.md`](CHANGELOG.md) – change log (German)

---

## What it is about

### Why fuzzy cognitive maps?

A **fuzzy cognitive map** (FCM) is a directed, weighted graph that describes how the quantities of a system
influence each other: nodes are concepts or factors (e.g. “Cycling”, “Air quality”), edges are cause-and-effect
relationships with a strength and a sign – reinforcing or weakening. They were introduced by Bart Kosko in 1986 as an
extension of Robert Axelrod's cognitive maps (1976): instead of just “has a positive/negative effect” there are
**graded degrees of effect** ([Kosko 1986, *Fuzzy cognitive maps*, Int. J. Man-Machine Studies 24(1), 65–75](https://doi.org/10.1016/S0020-7373(86)80040-2)).

FCMs are particularly suited to “soft” knowledge domains with few exact formulas but plenty of expert knowledge and
experience – such as urban and transport planning, environmental and resource management, organisational
development, politics or risk analysis. Typical purposes:

- **Making mental models visible:** write down, discuss and compare the assumptions a person or group holds about
  how things are connected.
- **Spotting feedback loops:** reinforcing and dampening loops become visible in the graph.
- **Playing through “what if …?”:** give one factor an impulse and follow how the effect propagates through the
  network over several steps – including side effects and indirect effects.

An FCM is therefore not an exact forecasting model but a tool for thinking about systems of effects in a structured way.

### What this implementation does

fuzzymap is a lightweight tool for creating and exploring such maps **without installation and without a server** –
in the browser, on desktop, tablet and phone, also offline:

- **Modelling:** nodes with text, value and an optional description; directed edges (including loops) with a factor
  from −10 to +10 and an optional description; any number of maps.
- **Simulating:** give one or more nodes an impulse (in percent or absolute) and compute the propagation **round by
  round**; damping per round controls how much effects fade over intermediate steps.
- **Understanding:** play the rounds back on the map, line chart (absolute or in percent), hover displays with
  values and descriptions, linked highlighting between map, lists and chart.
- **Comparing and sharing:** every run is saved with its map and can be played again, used as a template or
  exported as CSV; maps can be backed up and exchanged as JSON.

**Difference from the classic FCM model:** classic FCMs usually work with activations between 0 and 1 or −1 and 1,
weights between −1 and +1 and a threshold function (e.g. sigmoid). fuzzymap deliberately uses a more intuitive
**absolute model**: nodes have real values in their own unit, and each round the **change** is passed on – a factor of
0.5 means “half of the source node's change arrives at the target”. Details in the section
[Simulation model](#simulation-model).

---

## Quick start

To try it without installing anything: demo at <https://baach.de/fuzzymap>. For your own copy:

PyScript loads `main.mpy` via HTTP – the app therefore has to be served by a web server, not via `file://`.

```bash
cd fuzzymap
python3 -m http.server 8000
# Browser: http://localhost:8000
```

On first start a sample map is created – **“Example: City traffic”** in English, **“Beispiel: Stadtverkehr”** in
German. Every node and edge there has a description (what the node means, why the effect exists) that appears when
you point at it. Via *Map … → Add sample map* it can be added again as a new map at any time. All required files are part of the project – a local server without an internet connection is enough. After
the first load the app also works entirely without a server (offline cache).

**Installing:** in Chrome/Edge via the install icon in the address bar, on iPad/iPhone in Safari via
*Share → Add to Home Screen*.

---

## Usage

The interface consists of three areas:

| Area | Content |
|---|---|
| **Header** | Map selection, *New map*, menu *Map …* (Rename, Duplicate, Add sample map, Delete – immediately, with *Undo* in the message), menu *Export / Import*, language switch *DE / EN*, *Help* |
| **Map canvas** | The graph with toolbar (modes, zoom, switch *Size by value*, *Full screen*) and a playback bar during a simulation |
| **Sidebar** | Tabs *Edit*, *Simulation*, *Runs* |

**Sidebar width:** drag the vertical divider between map and sidebar (300 px to 900 px, the map keeps at least
320 px). The map keeps its scale and shows more or less of the canvas; the chart is redrawn at the new width.
Double-clicking the divider restores the default width (400 px). By keyboard: focus the divider with `Tab`, then
`←`/`→` (with `Shift` in larger steps), `Home` = maximum, `End` = minimum, `Enter` = default. The width is saved. On
narrow screens (below 820 px) map and sidebar are stacked and the divider is not shown.

**Full screen:** the *Full screen* button on the right of the toolbar (key `M`) hides header and sidebar and – where
possible – switches the browser to full-screen mode; the map then fills the whole screen. Editing directly on the map,
zoom and playback of an open run keep working. Exit with the same button, `M` or `Esc`. Where the browser does not
allow full screen (e.g. embedded views), the map fills the browser window and a notice appears. On iPad and iPhone the
browser's full-screen mode is deliberately not used, because Safari already ends it on a downward swipe – there the
map fills the window; to get rid of the browser bars entirely, run fuzzymap as an app from the home screen.

**Language:** the *DE / EN* switch in the header changes the entire interface to German or English – menus,
inspector, hints, messages, chart, tooltips and help. Numbers follow the language (German `1,5` and `+50 %`, English
`1.5` and `+50%`), as does the CSV export. On first start the language follows the browser (`de*` = German, otherwise
English); after that the saved choice applies. Texts in the maps (nodes, map names, runs) are content and are not
translated; only the sample map is created in the start language on first launch.

### Editing nodes and edges

| Action | How |
|---|---|
| Add a node | Mode **+ Node** and tap the canvas – or double-click in *Select* mode |
| Move a node | Drag the node |
| Edit text directly on the map | Double-click or double-tap the node – or select it and press `Enter` / `F2`. `Enter` or a click elsewhere applies, `Esc` discards; an empty field keeps the old text. New nodes open the field automatically |
| Change text / value | Click the node → tab *Edit* |
| Description | Field *Description* in the *Edit* tab – for nodes and edges, multi-line. It appears in the hover display (mouse over, touch: tap), which always shows the node text and value or source → target and factor; a small dot on the node or the factor label shows that there is one |
| Add an edge | Mode **+ Edge**, drag from the source to the target node – or tap source and target one after the other. Alternatively *Draw edge from here* in the node inspector |
| Add a loop (node acts on itself) | Mode **+ Edge** and tap the node twice – or drag out of the node and back. Alternatively *Loop to itself* in the node inspector. The arc is placed automatically on the freest side |
| Change the factor | Click the edge or its label → slider (steps of 0.1), number field (up to three decimals, e.g. 0.125) or quick buttons (top row +0.125 … +1, bottom row −0.125 … −1, each column the same magnitude) |
| Reverse direction | Select the edge → *Reverse direction* (not possible if the opposite edge exists) |
| Delete | Selection → *Delete* or the `Del` key (deleting a node also deletes its edges) |
| View | Drag the canvas = pan, mouse wheel or two fingers = zoom, *Fit* shows everything |

There is at most one edge per direction between two nodes; an edge and its opposite edge are drawn curved.
Each node can have at most one loop (edge to itself).

### Running a simulation

1. Open the **Simulation** tab.
2. Set **Rounds** (1–200) and **Damping per round** (0–1), optionally give the run a name.
3. For the **impulse** choose whether the change is given in **Percent** or as an **absolute value**, and enter it for
   one or more nodes:
   - Percent: +100 = double, −50 = halve (value 50 → +50 or −25)
   - absolute value: amount that is added (value 50, input +25 → 75)
   - empty = no change

   The **Result** column immediately shows the value after the impulse and the change in the other unit.
   When switching units, existing inputs are converted so that the effect stays the same. For nodes with value 0 no
   percentage is possible – their inputs are dropped when switching to percent (with a notice).
4. **Run simulation** – the run is saved automatically and played back.

The inputs in the *Simulation* tab are remembered per map. The columns of the impulse table have fixed widths.

### Viewing and managing runs

The **Runs** tab lists all saved runs of the map, newest first. A click opens the run:

- **Playback bar** on the map: play/pause, to start, round slider, *Close*
- **Chart** of the values per node over the rounds. The **Absolute / Change %** switch above the chart selects the
  y-axis: absolute value or percentage change relative to round 0 (nodes with start value 0 then have no line; they
  are listed below the chart). The choice is saved and applies to all runs. Pointing at a line shows node name,
  round, value and change relative to round 0 at that position. On touch devices: tapping the chart selects the
  nearest line, dragging horizontally moves through the rounds; the display sits above the finger and stays after
  lifting it until you tap outside
- **Table** with start value, value of the current round and change (absolute and in percent)

Per run: *Rename*, *Use as template* (copies impulse, rounds and damping into the *Simulation* tab), *Delete*
(immediately with one click, no confirmation) and *Export as CSV*. *Delete all* next to the heading *Saved runs*
removes all runs of the map at once, also without confirmation; the message offers *Undo* for a few seconds. Each run
remembers whether the impulse was given in percent or as an absolute value.

---

## Simulation model

### Meaning of the factor

The factor `w` of an edge states **which share of the absolute change of the source node** arrives at the target
node. It lies between **−10 and +10**; new edges get **0.5**.

> If the source node has the value 50 and doubles (change +50), the target node rises
> by 50 with `w = 1.0`, by 25 with `w = 0.5`, and falls by 100 with `w = −2`.

### Rounds

| Round | What happens |
|---|---|
| 0 | Initial state – the values of the map |
| 1 | **Impulse**: every node with an input changes by `Δ = value · p / 100` (percent `p`) or by `Δ = a` (absolute value `a`) |
| 2, 3, … | **Propagation**: every node passes on *only the change of the previous round* via its outgoing edges |

Formally, with `Δᵢ(t)` as the change of node *i* in round *t* and damping `d`:

```
Δⱼ(t+1) = d · Σᵢ wᵢⱼ · Δᵢ(t)
valueⱼ(t+1) = valueⱼ(t) + Δⱼ(t+1)
```

Properties:

- Several incoming edges **add up**.
- A **loop** (`i = j`) feeds a node's change back to itself in the next round: factor > 0 reinforces, factor < 0
  dampens or reverses. Example: impulse +100, loop +0.5, no other edges → 100 → 200 → 250 → 275 → … → 300. With a
  factor ≥ 1 (and damping 1) the value grows without limit.
- A change travels one edge further per round. A chain A → B → C therefore reaches C in round 3.
- Values are **cumulative**: a node keeps its change even if it passes nothing on in later rounds.
- Without feedback the simulation comes to rest after at most *chain length + 1* rounds. The app then reports
  “No further change from round *n* on”.
- In **feedback loops** the effect can build up if the product of the factors around the loop is ≥ 1 in absolute
  value. A **damping** < 1 helps (e.g. 0.8 – every transmission is weakened by 20%).

### Damping

The damping `d` (0–1) multiplies every transmission over an edge, again in every round; the impulse in round 1 is not
damped. `d = 1` weakens nothing, `d = 0` passes nothing on.

- Chain A → B → C with factors 1.0 and impulse A +100: without damping B +100, C +100; with `d = 0.8` B +80, C +64.
- Loop at A (start value 100) with factor 1.0 and impulse +100: without damping A grows without limit; with `d = 0.8`
  it gains +80, +64, +51.2 …, and A approaches 100 + 500 = 600.
- Rule of thumb: a loop settles when `|d · product of the factors around the loop| < 1`.
- Values can become negative; there is no limit (apart from a technical one at ±10²⁵⁰).

### Worked example

Map: A (50) → B (10) with `w = 1`, B → C (0) with `w = −2`. Impulse: A +100%.

| Round | ΔA | ΔB | ΔC | A | B | C |
|---|---|---|---|---|---|---|
| 0 | – | – | – | 50 | 10 | 0 |
| 1 | +50 | 0 | 0 | 100 | 10 | 0 |
| 2 | 0 | +50 | 0 | 100 | 60 | 0 |
| 3 | 0 | 0 | −100 | 100 | 60 | −100 |
| 4 | 0 | 0 | 0 | 100 | 60 | −100 |

---

## Visualisation

| Element | Meaning |
|---|---|
| **Node colour** | Fixed colour per node (palette of 12); identical to its line in the chart and the colour swatches in all lists |
| **Edge colour** | Green = positive factor, red dashed = negative, grey dotted = 0 |
| **Edge thickness** | Grows with the absolute value of the factor (maximum from 2) |
| **Badge on the node** (simulation) | Percentage change relative to round 0 (e.g. “+60%”), green or red; for start value 0 the absolute change |
| **Hover display** | Pointing at a node: colour, text and value; at an edge or its label: source → target and factor; below that the description, if there is one. On touch devices by tapping |
| **Hover display on the node** (simulation) | Pointing at a node (or its row or line): text, value of the round shown, start value and change, absolute and in percent, e.g. “+50 / +75%”. For start value 0 absolute only |
| **Fill strength** (simulation) | The larger the relative change, the stronger the fill |
| **Animated edge** (simulation) | An effect is currently flowing over this edge in the round shown |
| **Dashed border** | Node with a negative value |
| **Size by value** (switch) | Node size (factor 0.7 … 1.3) by value. **On the map:** linear over the range of values – the smallest value, even a negative one, gives the smallest node, the largest value the largest; if all values are equal, nodes keep their normal size. **During a simulation:** by the change relative to round 0, measured against the node's own start value – unchanged = normal size, increase = larger, decrease = smaller; logarithmically damped, +100% gives the maximum and −100% the minimum size. Nodes with start value 0 are measured against the largest change among such nodes in the run. The scale applies to the whole run, so sizes do not jump during playback |

**Linked hovering:** when the pointer is on a node – in the graph, as a line in the chart or as a row in a list or
table – it is highlighted everywhere at once; in the graph its edges are highlighted too, and everything else is
dimmed. On touch devices this happens on tap.

---

## Saving, export and import

**Automatic saving:** every change is stored in the browser's `localStorage` right away (key `fcm.maps.v1`). The data
is tied to the browser and device – use the export for backups or for moving to another device.

Menu **Export / Import**:

| Function | Result |
|---|---|
| *Current map (JSON)* | `mapname.fuzzymap.json` – nodes, edges, simulation settings, all runs |
| *Current map (SVG)* | `mapname.svg` – image of the map as shown (with an open run the round shown: `mapname-round-N.svg`). Opened in a browser, the hover display keeps working: pointing at a node or edge shows text, value or factor and description and dims the rest – without script, CSS only. In graphics programs and embedded as `<img>` the image is static |
| *All maps – backup (JSON)* | `fuzzymap-backup-YYYY-MM-DD.json` – all maps |
| *Current run (CSV)* | Table of values per round and node plus edge list; English: comma and decimal point, German: semicolon and decimal comma (each suitable for Excel) |
| *Choose JSON file(s) …* | Import one or more files – or simply drag files into the window |

Importing always **adds** maps, it never overwrites. Maps with the same name get the suffix “(imported)”. Faulty
entries (edges to missing nodes, duplicate edges, factors outside ±10) are cleaned up; a message summarises the result.
Exports from the predecessor versions “Wirkgraph” and “Wirkgefüge” are read as well. Details:
[`docs/data-format.md`](docs/data-format.md).

---

## Keyboard shortcuts

| Key | Function |
|---|---|
| `V` | Select mode |
| `N` | Add node mode |
| `K` / `E` | Add edge mode |
| `Enter` / `F2` | Edit the text of the selected node on the map (`Enter` applies, `Esc` discards) |
| `Del` / `Backspace` | Delete selection |
| `F` | Fit view |
| `G` | Switch *Size by value* |
| `M` | Full screen on / off (`Esc` also ends it) |
| `Space` | Play / pause the simulation (when a run is open) |
| `Esc` | Clear selection, back to select mode |
| `Enter` (in a text field) | Finish input |

Shortcuts do not work while an input field has focus.

---

## Project structure

```
fuzzymap/
├── index.html            HTML5 skeleton, help dialog (DE + EN), loads PyScript and main.mpy
├── main.mpy              all application logic (PyScript / MicroPython), incl. English translations
├── style.css             styling, light and dark mode, responsive layout
├── sw.js                 service worker for offline use (vanilla JS)
├── manifest.webmanifest  PWA manifest
├── icons/                app icons (SVG, 192 px, 512 px)
├── vendor/               bundled runtime (taken over unchanged)
│   ├── pyscript/         PyScript 2026.7.3 (Apache 2.0)
│   ├── micropython/      MicroPython 1.28.0-6, WebAssembly (MIT)
│   ├── fonts/            font Plus Jakarta Sans (SIL Open Font License 1.1)
│   └── LIZENZEN.md       origin, licences, how to update (German)
├── docs/
│   ├── datenformat.md    JSON and CSV format (German)
│   ├── data-format.md    JSON and CSV format (English)
│   ├── architektur.md    code structure (German)
│   └── architecture.md   code structure (English)
├── CHANGELOG.md          change log (German)
├── LICENSE               licence text GNU AGPL v3
├── README.md             German version of this file
└── README.en.md
```

Bundled components (details in [`vendor/LIZENZEN.md`](vendor/LIZENZEN.md)):

- [PyScript](https://pyscript.net) 2026.7.3; `index.html` loads `vendor/pyscript/core.js`
- MicroPython 1.28.0-6 (WebAssembly); included via `config='{"interpreter": "./vendor/micropython/micropython.mjs"}'`
  on the `<script type="mpy">` instead of loading it from the CDN
- Font [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans) 5.3.0 under the SIL Open Font License 1.1 –
  may be freely used, modified and distributed together with the source code

---

## Development

- **Editing:** all logic lives in `main.mpy`. There is no build step – save the file, reload the page.
  Despite its extension, `main.mpy` is ordinary Python source (not precompiled MicroPython bytecode); configure your
  editor to treat `.mpy` as Python. Syntax check: `python3 -c "compile(open('main.mpy').read(), 'main.mpy', 'exec')"`.
- **Cache:** the service worker serves files from the cache first (*stale-while-revalidate*). After changes either
  increase the `CACHE` constant in `sw.js` (e.g. from `fuzzymap-v46` to `fuzzymap-v47`) or, during development,
  enable *Application → Service Workers → Bypass for network* in the browser DevTools.
- **Debugging:** Python errors at start-up are written to the browser console and additionally stored as the
  attribute `data-err` on `<body>`.
- **Resetting data:** run `localStorage.removeItem("fcm.maps.v1")` in the console and reload – the sample map
  appears again.
- **Translations:** German is the source language. Visible texts in `main.mpy` are wrapped in `_("German text")`;
  the English texts are in the `EN` dictionary (and `EN_STATIC` for `index.html`). Details in
  [`docs/architecture.md`](docs/architecture.md#language-german--english).

Notes on quirks of PyScript/MicroPython (e.g. no ordered dicts, JS callbacks via `create_proxy`) are in
[`docs/architecture.md`](docs/architecture.md).

---

## Limits and known quirks

- **Size.** The bundled runtime is about 1.6 MB (of which the MicroPython WASM is around 450 KB); the first start
  downloads a little over 1 MB of it, after that everything comes from the cache.
- **Updates.** After a new version the app reloads itself once briefly when opened. Local copies at the same address
  (e.g. `localhost:8000`) share the cache and the saved maps.
- **Storage per browser.** `localStorage` holds about 5–10 MB depending on the browser. Very many long runs can fill
  it; an error message then appears when saving – delete or export older runs.
- **Colours repeat** from the 13th node of a map.
- **Deleted nodes in old runs:** runs store the names and colours of the nodes at the time of the simulation; they
  remain readable even if nodes are later deleted or renamed. Nodes that no longer exist do not appear on the map.
- **Older runs** from the version with the multiplicative or linear model are marked “(old)” in the list and can
  still be viewed.

---

## Origin and licence

**Vibe coding.** fuzzymap was created entirely through *vibe coding*, i.e. programming in conversation with an AI:
requirements, feedback and testing came from the human, code, texts and documentation from the AI (Perplexity
Computer). The change log in [`CHANGELOG.md`](CHANGELOG.md) (German) traces the individual steps. The code is readable
and commented, but has not been independently reviewed.

**Licence.** Copyright © 2026 the fuzzymap authors.

fuzzymap is free software: you can redistribute it and/or modify it under the terms of the **GNU Affero General Public
License** as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
version. It is distributed in the hope that it will be useful, but **without any warranty**; without even the implied
warranty of merchantability or fitness for a particular purpose. The full licence text is in [`LICENSE`](LICENSE);
see also <https://www.gnu.org/licenses/agpl-3.0.html>.

**Source code:** the source code is hosted on GitHub at <https://github.com/jhb/fuzzymap>; new versions are published there as well.

- The AGPL covers the project's own code: `index.html`, `main.mpy`, `style.css`, `sw.js`, `manifest.webmanifest`,
  `icons/` and the documentation. The files carry the identifier `SPDX-License-Identifier: AGPL-3.0-or-later`.
- **Network use (section 13 AGPL):** anyone offering a modified version publicly as a web app must make the source code
  of that version available to its users. Since fuzzymap has no build step, the delivered files are themselves the
  complete source code; a note on where to download it is sufficient. fuzzymap itself points to the GitHub repository
  in its help for this purpose.
- The bundled third-party components in `vendor/` keep their own licences (PyScript: Apache 2.0, MicroPython: MIT,
  font: SIL Open Font License 1.1, see [`vendor/LIZENZEN.md`](vendor/LIZENZEN.md)); all are compatible with the AGPL.
