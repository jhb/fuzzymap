# Architektur

**Deutsch** · [English](architecture.md)

fuzzymap ist eine reine Client-Anwendung ohne Build-Schritt. `index.html` liefert das statische Gerüst,
PyScript startet MicroPython im Browser und führt `main.mpy` aus. `main.mpy` erzeugt alle dynamischen Inhalte
(SVG-Graph, Listen, Diagramm) als HTML-/SVG-Strings und reagiert auf Ereignisse über wenige zentrale Listener.

```
index.html ──lädt──▶ vendor/pyscript/core.js ──startet──▶ vendor/micropython (WASM) ──führt aus──▶ main.mpy
     │                                                                        │
     └── statisches Gerüst, Hilfe-Dialog                                       ├── localStorage (Speicher)
                                                                               ├── DOM / SVG (Rendering)
sw.js (Vanilla JS) ── Offline-Cache für alle Dateien ◀─ registriert von ───────┘
```

## Aufbau von `main.mpy`

Die Datei ist in Abschnitte gegliedert (Kommentare `# ------ Abschnitt`):

| Abschnitt | Aufgabe | Wichtige Funktionen |
|---|---|---|
| Sprache | Übersetzung, Dezimaltrenner | `_`, `is_en`, `dec_sep`, `LANG` |
| Hilfen | DOM-Zugriff, Formatierung (Zahlen je Sprache), Parsing | `el`, `attr`, `closest`, `esc`, `fnum`, `fpct`, `fweight`, `pfloat` |
| Daten | Kartenmodell, Farben, Laden/Speichern, Beispielkarte | `cur`, `ensure_map`, `free_color`, `node_color`, `load`, `save` |
| Simulation | Rechenmodell, Lauf anlegen | `simulate`, `run_sim` |
| Ansicht | Ansichtsfenster, Zoom, Geometrie, SVG-Rendering der Karte | `fit`, `zoom`, `node_scales`, `border_pt`, `run_state`, `render_canvas` |
| Panel | Seitenleiste: Inspektor, Listen, Formular, Läufe, Diagramm | `render_inspector`, `render_node_list`, `render_sim_form`, `render_runs`, `render_run_detail`, `chart_svg` |
| Simulation abspielen | Abspielleiste und Timer | `open_run`, `set_round`, `play`, `stop` |
| Bearbeiten | Knoten/Kanten anlegen und löschen, Modi | `add_node`, `add_edge`, `delete_sel`, `set_mode` |
| Zeiger-Ereignisse | Ziehen, Verbinden, Verschieben, Pinch-Zoom | `on_down`, `on_move`, `on_up`, `on_wheel` |
| Aktionen | Handler für Buttons (`data-action`) | `ACTIONS`-Tabelle, `on_click`, `on_input`, `on_key` |
| Export / Import | JSON/CSV/SVG erzeugen (`export_svg_text`), Dateien einlesen, Drag & Drop, Meldungen | `export_json`, `a_export_run_csv`, `clean_map`, `import_files`, `toast` |
| Verknüpftes Hovern | Gemeinsame Markierung über Graph, Diagramm, Listen; Werteanzeige im Diagramm | `apply_hover`, `set_hover`, `on_over`, `chart_tip`, `on_chart_move` |
| Start | Listener registrieren, erstes Rendering, Service Worker | `main` |

## Zustand

Der gesamte Laufzeitzustand liegt im Dict `S`:

| Schlüssel | Bedeutung |
|---|---|
| `maps`, `current` | Alle Karten und die ID der aktiven Karte (persistiert) |
| `settings` | Globale Einstellungen, z. B. `sizeByValue` (persistiert) |
| `sel` | Auswahl `{"type": "node" \| "edge", "id": …}` |
| `mode` | `select`, `node` oder `edge` |
| `view` | Ansichtsfenster in Weltkoordinaten (`x`, `y`, `w`, `h`) |
| `drag`, `temp`, `pending` | Laufende Zeigeraktion, Hilfslinie beim Verbinden, gewählter Startknoten beim Antippen |
| `tab` | Aktiver Tab der Seitenleiste |
| `run`, `round`, `timer` | Geöffneter Lauf, angezeigte Runde, Abspiel-Timer |
| `hover` | Knoten-ID, die gerade hervorgehoben ist |
| `ehover` | Kanten-ID unter dem Zeiger (für die Hover-Anzeige an Kanten) |

Persistiert werden nur `maps`, `current` und `settings` (siehe [`datenformat.md`](datenformat.md)). `save()` wird nach
jeder Änderung aufgerufen und schreibt den kompletten Stand.

Damit das schnell bleibt, auch bei vielen gespeicherten Läufen:

- `dump_state()` baut den JSON-Text selbst zusammen. Jeder Lauf wird nur einmal serialisiert und in `RUN_JSON`
  (Lauf-ID → (Name, JSON)) zwischengespeichert; Läufe sind Momentaufnahmen, nur ein neuer Name erzwingt ein
  erneutes Serialisieren. Bei 15 Läufen à 100 Runden (≈ 200 KB) sinkt die Zeit je Tastendruck von ≈ 70 ms auf ≈ 7 ms.
- Eingaben in Textfeldern (`on_input`) rufen `save_soon()` auf: gespeichert wird 400 ms nach der letzten Eingabe.
  `flush_save()` an `visibilitychange` speichert Ausstehendes sofort, wenn die Seite ausgeblendet oder geschlossen
  wird. Jeder direkte `save()`-Aufruf erledigt ein ausstehendes Speichern mit.
- `pagehide` lässt sich über die PyScript-Brücke nicht an `window` anmelden („Illegal invocation“); `visibilitychange`
  deckt Schließen und Tabwechsel ab.

## Rendering

- **Strings statt DOM-Operationen:** Jede `render_*`-Funktion baut HTML/SVG als String und setzt `innerHTML`.
  Das ist in MicroPython schnell genug für Karten mit vielen Dutzend Knoten und hält den Code einfach.
- **Ereignis-Delegation:** Weil Elemente ständig neu erzeugt werden, hängen alle Listener an `document` bzw. am
  `<svg>`. Buttons tragen `data-action="…"`, die in der Tabelle `ACTIONS` aufgelöst werden.
- **Fokus bewahren:** Eingaben im Inspektor aktualisieren nur Karte und Listen, nicht den Inspektor selbst – sonst
  würde das gerade bearbeitete Feld ersetzt und der Fokus ginge verloren.
- **Weltkoordinaten:** Das SVG nutzt `viewBox` = `S["view"]` mit `preserveAspectRatio="none"`; `fix_aspect()` hält das
  Seitenverhältnis passend zur Fläche, damit `to_world()` Bildschirm- in Weltkoordinaten umrechnen kann.
- **Kanten:** Quadratische Bézierkurven; existiert die Gegenkante, wird der Kontrollpunkt seitlich versetzt.
  `border_pt()` berechnet den Schnittpunkt mit dem (ggf. skalierten) Knotenrechteck, damit Pfeile am Rand ansetzen.
- **Knotengröße:** `node_scales()` liefert je Knoten einen Faktor (0,7 … 1,3 bei *Größe nach Wert*, sonst 1) –
  ohne Lauf linear über den Wertebereich (Min … Max, Wurzel für die Fläche), im Lauf nach `±log2(1 + |Δ/Start|)`,
  begrenzt auf ±1, bei Startwert 0 nach `Δ / größte Änderung solcher Knoten im Lauf`;
  der Knoteninhalt wird per `transform="scale(…)"` skaliert, Strichstärken bleiben dank `vector-effect` konstant.
- **Hervorhebung:** Elemente, die zu einem Knoten gehören, tragen `data-hl="Knoten-ID"`, Kanten `data-ends="Start Ziel"`.
  `apply_hover()` setzt die Klasse `hl` auf alle passenden Elemente und `hovering` am `<body>`; das Abblenden der
  übrigen Elemente erledigt CSS. Jede `render_*`-Funktion ruft am Ende `apply_hover()` auf, damit die Markierung
  ein Neuzeichnen übersteht.

## Trenner und Größenänderung

Das Layout ist ein Grid mit drei Spalten: Karte, Trenner (8 px), Seitenleiste mit der Breite `--panel-w`.
`on_split_down/move/up` setzen die Breite per Pointer-Capture über `set_panel_w()`, die auf 300 px bis
`min(900, Layoutbreite − 328)` begrenzt und in `settings.panelW` speichert. Ändert sich die Kartenfläche
(Trenner oder Fenster), behält `on_resize()` Maßstab und Mittelpunkt bei und passt nur die Breite des sichtbaren
Ausschnitts an. Ein zweiter `ResizeObserver` auf der Seitenleiste zeichnet das Diagramm in der neuen Breite neu
(`chart_width()`), damit Schrift und Linien gleich groß bleiben.

## Schleifen

Kanten mit `src == dst` zeichnet `loop_svg()` als kubischen Bogen. `loop_side()` wählt unter oben, rechts, links und
unten die Seite mit dem größten Winkelabstand zu den übrigen Kanten des Knotens (bei Gleichstand gewinnt oben).
`fit()` bezieht die Bögen in die Ansicht ein. In `simulate()` werden Schleifen wie jede andere Kante behandelt.
Anlegen: zweiter Tipp auf den vorgemerkten Knoten im Kantenmodus, Ziehen mit Verlassen und Zurückkehren
(`drag["left"]`, damit ein leicht verwackelter Tipp keine Schleife erzeugt) oder Knopf im Inspektor.

## Hover-Anzeige an Knoten und Kanten

`render_canvas()` legt beim Zeichnen Position und halbe Höhe jedes Knotens (`NODE_GEO`), die Position jedes
Faktor-Etiketts (`EDGE_GEO`) und im Simulationsmodus die Werte der Knoten (`NODE_INFO`) ab. `on_over` merkt sich den
Knoten (`S["hover"]`, über `data-hl`) und die Kante (`S["ehover"]`, über `data-edge`) unter dem Zeiger.

`node_tip()` wird aus `apply_hover()` bzw. `on_over` aufgerufen und füllt ein einziges HTML-Feld (`#node-tip`); den
Inhalt liefert `tip_content()`, die auch der SVG-Export nutzt (mit `xml=True` für wohlgeformtes XHTML):

- **Kante:** Start → Ziel und Faktor, positioniert am Faktor-Etikett.
- **Knoten ohne Lauf:** Farbe, Text und Wert.
- **Knoten im Lauf:** Runde, Wert, Startwert und Änderung absolut und in Prozent.
- Darunter jeweils die **Beschreibung** (`note`, HTML-maskiert, Zeilenumbrüche als `<br>`), falls vorhanden.

Das Feld wird in Prozent der Kartenfläche über (bzw. am oberen Rand unter) dem Element positioniert und beim
Ziehen sowie während der Textbearbeitung auf der Karte ausgeblendet. Da `apply_hover()` am Ende jedes Zeichnens
läuft, folgt die Anzeige Runde, Verschieben und Zoom. Der Browser-Tooltip (`<title>`) entfällt.

**Beschreibungen** bearbeitet der Inspektor in einem `<textarea>` (`note_field()`); `on_input` schreibt sie in
`note` (leer = Feld entfernt) und zeichnet die Karte nur neu, wenn sich die Markierung (`.note-dot`) ändert.

## Text auf der Karte bearbeiten

Ein einzelnes `<input id="node-edit">` liegt über der Karte. `start_inline_edit(nid)` verlässt ggf. die
Simulationsansicht, merkt sich Knoten und Originaltext in `EDIT` und fokussiert das Feld sofort (iOS öffnet die
Tastatur nur innerhalb der Geste) sowie nach 30 ms erneut; ein Fokusverlust in den ersten 400 ms wird ignoriert.
`position_inline_edit()` läuft am Ende jedes `render_canvas()` und legt das Feld in Pixeln über die Textzeile,
dadurch folgt es Zoom und Verschieben. Eingaben ändern den Text live (Karte, Knotenliste, Feld im Inspektor);
`end_inline_edit(commit)` speichert oder stellt den Originaltext wieder her.

Doppelklicks auf Knoten erkennt `on_up` selbst (gleicher Knoten, nicht bewegt, < 400 ms), weil die Karte beim
ersten Klick neu gezeichnet wird und der Browser dann kein verlässliches `dblclick` auf dem Knoten meldet.
`on_dbl` bestimmt das Ziel per `document.elementFromPoint`.

## Diagramm

`settings.chartY` (`"abs"` oder `"pct"`) bestimmt die y-Achse; der Schalter ruft `a_chart_y()` auf und zeichnet nur
die Laufansicht neu. Im Prozentmodus plottet `chart_svg()` `Δ / |Startwert| · 100` und lässt Reihen mit Startwert 0
weg. `CHART["series"][id]` = (Text, geplottete Werte, Startwert, Farbe, absolute Werte) – die Hover-Anzeige
positioniert auf den geplotteten und beschriftet mit beiden Werten.

`chart_svg()` zeichnet die absoluten Werte der veränderten Knoten und legt Geometrie und Datenreihen in `CHART` ab.
`on_chart_move()` rechnet die Mausposition in die nächstgelegene Runde um; `chart_tip()` setzt Markierungspunkt und
Hinweisfeld (HTML, in Prozent der Diagrammfläche positioniert). Angezeigt wird die Reihe des gerade hervorgehobenen
Knotens (`S["hover"]`). Bei Touch (`pointerType == "touch"`) wählt `chart_touch()` die Linie, die dem Finger in der
getroffenen Runde am nächsten liegt; `touch-action: pan-y` erlaubt waagerechtes Ziehen bei weiterhin möglichem
senkrechtem Scrollen. Die Anzeige bleibt nach dem Loslassen stehen und verschwindet beim Antippen außerhalb. Beim Neuzeichnen während des Abspielens wird die Anzeige wiederhergestellt.

## Simulation

`simulate(m, deltas, rounds, model, damping)` ist eine reine Funktion ohne DOM-Zugriff und liefert
`(ids, history, stable)`. Sie erwartet absolute Anfangsänderungen; `to_deltas(m, changes, unit)` rechnet
Prozentangaben vorher um. `set_unit()` rechnet beim Umschalten der Einheit die Eingaben im Formular um. Sie lässt sich daher auch unabhängig testen. Siehe README, Abschnitt *Simulationsmodell*.

## PyScript- und MicroPython-Hinweise

- **Mitgelieferte Laufzeit:** PyScript lädt MicroPython standardmäßig von jsDelivr. Das Attribut
  `config='{"interpreter": "./vendor/micropython/micropython.mjs"}'` am `<script type="mpy">` verweist stattdessen auf
  die lokale Kopie; `micropython.mjs` findet `micropython.wasm` im selben Verzeichnis. Der Server muss `.wasm` mit
  `application/wasm` ausliefern (Pythons `http.server` tut das), sonst fällt der Browser auf eine langsamere Methode zurück.

Beim Bau aufgefallene Eigenheiten, die man beim Weiterentwickeln kennen sollte:

- **Dicts sind nicht geordnet.** In MicroPython (WebAssembly-Build) bleibt die Einfügereihenfolge von `dict` nicht
  erhalten. Alles, was eine Reihenfolge braucht (Knoten, Kanten, Läufe, `history`-Spalten), ist deshalb als Liste gespeichert.
- **Callbacks an JS** immer mit `create_proxy()` übergeben und die Referenz behalten (`PROXIES`, `TICK`, `RESIZE`,
  `HIDE_TOAST`), sonst kann der Garbage Collector sie einsammeln.
- **JS-Fehler sind nicht immer abfangbar.** Manche Fehler aus aufgerufenen JS-Funktionen (z. B. `Illegal invocation`)
  brechen das Skript ab, statt als Python-Exception zu erscheinen. Bei Problemen beim Start hilft das Attribut
  `data-err` am `<body>` bzw. die Konsole.
- **`null` / `undefined`** werden mit `is_none()` aus `pyscript.ffi` geprüft; die Helfer `attr()` und `closest()` kapseln das.
- **Asynchrone Handler:** `on_import` ist `async` (wegen `await file.text()`). Beim Drag & Drop muss `preventDefault()`
  synchron passieren – deshalb startet `on_drop` den Import mit `asyncio.create_task()`.
- **Fenstergröße:** Statt `window.addEventListener("resize", …)` wird ein `ResizeObserver` auf dem SVG verwendet; das
  reagiert auch auf Layoutänderungen (z. B. mobile Ansicht).
- **Keine Standardbibliothek in voller Breite:** u. a. kein `datetime`, kein `uuid`, kein `json.dumps(indent=…)`.
  Datum über `window.Date`, IDs über `Date.now()` + Zufall, eingerücktes JSON über `window.JSON.stringify`.

## Sprache (Deutsch / Englisch)

- **Quellsprache Deutsch.** Jeder sichtbare Text im Code steht als deutscher Literal in `_()`, z. B.
  `_("Runde {} / {}").format(t, n)`. `_()` liefert bei `LANG["v"] == "en"` den Eintrag aus `EN` (deutscher Text →
  englischer Text), sonst den Text selbst. Fehlt eine Übersetzung, erscheint der deutsche Text – nichts bricht.
- **Platzhalter und HTML** müssen in `EN` identisch bleiben (gleiche `{}`/`{name}` und Tags); größere HTML-Vorlagen
  (Inspektor, Laufdetails, Listen) sind als Ganzes übersetzt. Wer einen deutschen Text ändert, muss den Schlüssel in
  `EN` mitändern.
- **Texte auf Modulebene** (`MODEL_NOTE`, `UNIT_NOTES`) werden erst beim Anzeigen mit `_()` übersetzt, weil das Modul
  vor der Sprachwahl geladen wird.
- **Statische Texte in `index.html`** tragen Schlüssel: `data-i18n` (Inhalt), `data-i18n-title`, `data-i18n-aria`
  (`aria-label`), `data-i18n-ph` (`placeholder`). `apply_static()` merkt sich beim ersten Aufruf den deutschen Inhalt in
  `data-de-*` und setzt danach `EN_STATIC[schlüssel]` oder das Original. Die englische Hilfe steht als
  `<template id="help-en">` in `index.html` und wird gegen den deutschen Hilfetext getauscht.
- **Ablauf:** `init_lang()` setzt die Sprache aus `navigator.language`, `load()` überschreibt sie mit `settings.lang`;
  die Beispielkarte entsteht danach und übersetzt ihre Knotennamen mit `_()`. `a_lang` speichert die Wahl,
  ruft `apply_static()` und `render_all()` auf. Ein kleines Inline-Skript setzt vorab `<html lang>` und den Ladehinweis,
  da Python zu diesem Zeitpunkt noch nicht läuft.
- **Zahlen:** `fnum`, `fweight`, `fpct`, Achsenbeschriftung und CSV nutzen `dec_sep()` und `pct_sign()`
  (`+50 %` / `+50%`); `pfloat` akzeptiert Komma und Punkt in beiden Sprachen.

## Service Worker (`sw.js`)

- Beim Installieren werden alle Dateien vorgeladen, die für den Start nötig sind (`CORE`): App, PyScript-Teildateien,
  MicroPython (`.mjs` und `.wasm`) und Schrift. Damit ist die App nach dem ersten Laden vollständig offline nutzbar.
- GET-Anfragen an die eigene Adresse laufen über *stale-while-revalidate*: sofort aus dem Cache, im Hintergrund
  aktualisieren. Anfragen an fremde Adressen werden nicht abgefangen (es gibt keine mehr).
- Neue PyScript-Version: Dateinamen der Teildateien in `CORE` anpassen (siehe `vendor/LIZENZEN.md`).
- Beim Aktivieren werden Caches mit anderem Namen gelöscht – deshalb nach Änderungen `CACHE` hochzählen.
- Beim Installieren lädt er mit `cache: "reload"`, also am HTTP-Cache des Browsers vorbei.
- Registriert wird der Service Worker aus Python am Ende von `main()`.
- **Update ohne zweites Laden:** Das Inline-Skript in `index.html` lädt die Seite einmal neu, wenn bereits ein
  Service Worker die Seite steuerte und ein neuer übernimmt (`controllerchange`). Beim allerersten Besuch gibt es
  noch keinen steuernden Service Worker, dann wird nicht neu geladen.
