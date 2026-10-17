# Datenformat

**Deutsch** · [English](data-format.md)

fuzzymap speichert alles als JSON – im Browser (`localStorage`) und in Exportdateien. Läufe lassen sich zusätzlich
als CSV exportieren.

## Exportdatei (`*.fuzzymap.json`, `fuzzymap-backup-*.json`)

```json
{
  "format": "fuzzymap-fcm",
  "version": 2,
  "exported": "2026-10-14T10:30:00.000Z",
  "maps": [ { …Karte… } ]
}
```

| Feld | Typ | Bedeutung |
|---|---|---|
| `format` | string | Immer `"fuzzymap-fcm"` (ältere Exporte: `"fuzzmap-fcm"`, `"wirkgraph-fcm"`, `"wirkgefuege-fcm"`; beim Import wird das Feld nicht geprüft) |
| `version` | int | Version des Exportformats, aktuell `2` |
| `exported` | string | Zeitpunkt des Exports (ISO 8601, UTC) |
| `maps` | array | Eine Karte (Einzelexport) oder alle Karten (Sicherung) |

Der Import akzeptiert außerdem eine **einzelne Karte** als Wurzelobjekt oder ein **Array von Karten**.

## Karte

```json
{
  "id": "m1728901234567",
  "name": "Beispiel: Stadtverkehr",
  "created": "2026-10-14T07:10:00.000Z",
  "updated": "2026-10-14T10:29:41.000Z",
  "nodes": [
    { "id": "n17289012345671", "label": "Radverkehr", "value": 100, "x": 160, "y": 140, "c": 0 }
  ],
  "edges": [
    { "id": "e17289012345679", "src": "n17289012345671", "dst": "n17289012345672", "w": -0.4 }
  ],
  "draft": { "changes": { "n17289012345674": 100 }, "unit": "pct", "rounds": 12, "damping": 1.0, "model": "abs" },
  "sims": [ { …Lauf… } ]
}
```

### Knoten (`nodes[]`)

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `id` | string | ja | Eindeutig innerhalb der Karte |
| `label` | string | – | Angezeigter Text (Standard „Knoten *n*“) |
| `value` | number | – | Aktueller Wert (Standard 0) |
| `x`, `y` | number | – | Position auf der Fläche (Weltkoordinaten, Mittelpunkt des Knotens) |
| `c` | int | – | Index in der Farbpalette (0–11); fehlt er, wird beim Laden eine freie Farbe vergeben |
| `note` | string | – | Beschreibung, wird beim Darüberfahren angezeigt (bis 2000 Zeichen, Zeilenumbrüche erlaubt); fehlt, wenn leer |

### Kanten (`edges[]`)

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `id` | string | – | Eindeutig innerhalb der Karte |
| `src` | string | ja | ID des Startknotens |
| `dst` | string | ja | ID des Zielknotens; gleich `src` = Schleife (Knoten wirkt auf sich selbst) |
| `w` | number | – | Faktor, −10 … +10 (Standard 0,5), im Editor auf drei Nachkommastellen gerundet |
| `note` | string | – | Beschreibung der Wirkung, wird beim Darüberfahren angezeigt (bis 2000 Zeichen); fehlt, wenn leer |

Pro Paar (`src`, `dst`) ist höchstens eine Kante erlaubt.

### Simulationseinstellungen (`draft`)

Die zuletzt im Tab *Simulation* eingegebenen Werte.

| Feld | Typ | Bedeutung |
|---|---|---|
| `changes` | object | `{ Knoten-ID: Zahl }` – Anstoß in der Einheit `unit`, nur Einträge ≠ 0 |
| `unit` | string | `"pct"` = Prozent des aktuellen Werts (Standard), `"abs"` = absoluter Betrag |
| `rounds` | int | Anzahl Runden, 1–200 |
| `damping` | number | Dämpfung pro Runde, 0–1 |
| `model` | string | Immer `"abs"` (absolutes Modell) |

### Lauf (`sims[]`)

Ein gespeicherter Simulationsdurchlauf ist eine **Momentaufnahme** – er bleibt gültig, auch wenn die Karte später
geändert wird.

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | string | Eindeutige ID |
| `name` | string | Anzeigename |
| `created` | string | Zeitpunkt (ISO 8601) |
| `model` | string | `"abs"`; alte Läufe: `"log"` (multiplikativ) oder `"lin"` (linear) |
| `rounds` | int | Anzahl simulierter Runden |
| `damping` | number | Verwendete Dämpfung |
| `changes` | object | Anstoß `{ Knoten-ID: Zahl }` wie eingegeben, in der Einheit `unit` |
| `unit` | string | `"pct"` oder `"abs"`; fehlt bei älteren Läufen (dann Prozent) |
| `deltas` | object | Anstoß umgerechnet in absolute Änderungen `{ Knoten-ID: Δ }` – das, was in Runde 1 addiert wurde |
| `nodes` | array | Knoten-IDs in der Spaltenreihenfolge von `history` |
| `labels` | object | `{ Knoten-ID: Text }` zum Zeitpunkt des Laufs |
| `colors` | object | `{ Knoten-ID: Farbindex }` zum Zeitpunkt des Laufs |
| `edges` | array | Kopie der Kanten zum Zeitpunkt des Laufs |
| `history` | array | `rounds + 1` Zeilen; Zeile *t* enthält die Werte aller Knoten (Reihenfolge wie `nodes`) nach Runde *t*. Zeile 0 = Ausgangszustand |
| `stable` | int \| null | Erste Runde, ab der keine Änderung mehr weitergegeben wird, sonst `null` |

## Speicher im Browser (`localStorage["fcm.maps.v1"]`)

```json
{
  "version": 1,
  "current": "m1728901234567",
  "settings": { "sizeByValue": false, "panelW": 400, "chartY": "abs", "lang": "de" },
  "maps": [ …Karten… ]
}
```

| Feld | Bedeutung |
|---|---|
| `current` | ID der zuletzt geöffneten Karte |
| `settings.sizeByValue` | Zustand des Schalters *Größe nach Wert* (gilt für alle Karten) |
| `settings.panelW` | Breite der Seitenleiste in Pixeln (300–900, Standard 400) |
| `settings.chartY` | y-Achse des Liniendiagramms: `"abs"` = absoluter Wert (Standard), `"pct"` = Änderung gegenüber Runde 0 in % |
| `settings.lang` | Sprache der Oberfläche: `"de"` oder `"en"`; fehlt sie, gilt die Browsersprache |

## Bereinigung beim Import

- Karten bekommen immer eine **neue ID**; gleichnamige Karten erhalten den Zusatz „(importiert)“ bzw. „(importiert) 2“ usw.
- IDs dürfen nur Buchstaben, Ziffern, `_` und `-` enthalten (max. 64 Zeichen); andere werden durch neue IDs ersetzt und alle Verweise (Kanten, Anstoß, Läufe) umgeschrieben. Knoten ohne `id` erhalten eine neue, doppelte IDs werden verworfen. Fehlende Positionen werden in einem Raster verteilt.
- Kanten zu nicht vorhandenen Knoten und doppelte Kanten werden verworfen (Schleifen bleiben erhalten); `w` wird auf −10 … +10 begrenzt.
- Beschreibungen (`note`) werden übernommen, sofern sie Text sind; leere entfallen, längere als 2000 Zeichen werden gekürzt.
- Läufe ohne `history` oder `nodes` werden verworfen; fehlende Metadaten werden ergänzt.

## CSV-Export eines Laufs

Datei `Kartenname-Laufname.csv`, UTF-8 mit BOM, Zeilenende CRLF. Format nach Sprache der Oberfläche: Deutsch mit
Trennzeichen `;` und Dezimalkomma (Beispiel unten), Englisch mit Trennzeichen `,` und Dezimalpunkt sowie den
Kopfzeilen `Round` und `Factor`.

```
Runde;Radverkehr;Autoverkehr;Luftqualität;…
0;100;100;100;…
1;100;100;100;…
2;160;100;100;…
…

Faktor;;;
Radwege-Ausbau;Radverkehr;0,6
Radverkehr;Autoverkehr;-0,4
…
```

Der erste Block enthält je Runde die Werte aller Knoten. Nach einer Leerzeile folgt die Kantenliste
(Start; Ziel; Faktor) zum Zeitpunkt des Laufs.
