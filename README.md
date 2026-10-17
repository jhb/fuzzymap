# fuzzymap – Fuzzy Cognitive Maps als PWA

**Deutsch** · [English](README.en.md)

fuzzymap ist eine installierbare Web-App (PWA), mit der man **Wirkungsgraphen** (Fuzzy Cognitive Maps)
zeichnen, speichern und **rundenweise simulieren** kann. Knoten tragen einen Text und einen Wert, gerichtete
Kanten einen Faktor, der angibt, wie stark eine Änderung des Startknotens auf den Zielknoten durchschlägt.

- Logik vollständig in **Python** (PyScript mit MicroPython), Oberfläche in schlichtem **HTML5 + CSS**
- **Vanilla JS** nur dort, wo es nicht anders geht: im Service Worker (`sw.js`) und in einem kurzen Inline-Skript
  (Ladehinweis in der richtigen Sprache, Neuladen nach einem Update)
- Läuft offline, speichert lokal im Browser, keine Server-Komponente
- **Keine fremden Server:** PyScript, MicroPython und die Schrift werden mitgeliefert (`vendor/`); zur Laufzeit wird
  nichts von Dritten nachgeladen
- **Freie Software** unter der [GNU Affero General Public License v3.0 oder später](LICENSE) (AGPL-3.0-or-later)
- **Demo:** <https://baach.de/fuzzymap> – direkt im Browser ausprobieren
- **Quellcode:** <https://github.com/jhb/fuzzymap>

> **Per Vibe Coding entstanden.** fuzzymap ist vollständig durch *Vibe Coding* entstanden: Code, Oberflächentexte und
> Dokumentation wurden im Dialog mit einer KI (Perplexity Computer) erzeugt. Der Mensch hat die Anforderungen
> formuliert, das Ergebnis ausprobiert und Rückmeldungen gegeben, den Code aber nicht selbst geschrieben. Das Projekt
> wurde getestet, aber nicht systematisch geprüft – bitte entsprechend kritisch verwenden.

---

## Inhalt

1. [Worum es geht](#worum-es-geht)
2. [Schnellstart](#schnellstart)
3. [Bedienung](#bedienung)
4. [Simulationsmodell](#simulationsmodell)
5. [Visualisierung](#visualisierung)
6. [Speichern, Export und Import](#speichern-export-und-import)
7. [Tastenkürzel](#tastenkürzel)
8. [Projektstruktur](#projektstruktur)
9. [Entwicklung](#entwicklung)
10. [Grenzen und bekannte Eigenheiten](#grenzen-und-bekannte-eigenheiten)
11. [Entstehung und Lizenz](#entstehung-und-lizenz)

Weitere Dokumente:

- [`docs/datenformat.md`](docs/datenformat.md) – JSON-Format für Export/Import und localStorage, CSV-Format
  (englisch: [`docs/data-format.md`](docs/data-format.md))
- [`docs/architektur.md`](docs/architektur.md) – Aufbau von `main.mpy`, Rendering, Ereignisse, PyScript-Hinweise
  (englisch: [`docs/architecture.md`](docs/architecture.md))
- [`CHANGELOG.md`](CHANGELOG.md) – Änderungsverlauf

---

## Worum es geht

### Wozu Fuzzy Cognitive Maps?

Eine **Fuzzy Cognitive Map** (FCM) ist ein gerichteter, gewichteter Graph, der beschreibt, wie Größen eines Systems
einander beeinflussen: Knoten sind Konzepte oder Faktoren (z. B. „Radverkehr“, „Luftqualität“), Kanten sind
Ursache-Wirkungs-Beziehungen mit einer Stärke und einem Vorzeichen – verstärkend oder abschwächend. Eingeführt hat sie
Bart Kosko 1986 als Erweiterung der kognitiven Karten von Robert Axelrod (1976): Statt nur „wirkt positiv/negativ“
gibt es **abgestufte Wirkungsgrade** ([Kosko 1986, *Fuzzy cognitive maps*, Int. J. Man-Machine Studies 24(1), 65–75](https://doi.org/10.1016/S0020-7373(86)80040-2)).

FCMs eignen sich besonders für „weiche“ Wissensgebiete, in denen es kaum exakte Formeln, aber Expertenwissen und
Erfahrung gibt – etwa Stadt- und Verkehrsplanung, Umwelt- und Ressourcenmanagement, Organisationsentwicklung,
Politik oder Risikoanalyse. Typische Zwecke:

- **Denkmodelle sichtbar machen:** Annahmen einer Person oder Gruppe über Zusammenhänge explizit aufschreiben,
  diskutieren und vergleichen.
- **Rückkopplungen erkennen:** Verstärkende und dämpfende Schleifen werden im Graphen sichtbar.
- **„Was wäre, wenn …?“ durchspielen:** Einen Faktor anstoßen und verfolgen, wie sich die Wirkung über mehrere
  Schritte durch das Netz fortpflanzt – inklusive Neben- und Fernwirkungen.

Eine FCM ist damit kein exaktes Prognosemodell, sondern ein Werkzeug zum strukturierten Nachdenken über Wirkungsgefüge.

### Was diese Implementierung leistet

fuzzymap ist ein schlankes Werkzeug, um solche Karten **ohne Installation und ohne Server** zu erstellen und zu
erkunden – im Browser, auf Desktop, Tablet und Handy, auch offline:

- **Modellieren:** Knoten mit Text, Wert und optionaler Beschreibung; gerichtete Kanten (auch Schleifen) mit einem
  Faktor von −10 bis +10 und optionaler Beschreibung; beliebig viele Karten.
- **Simulieren:** Einen oder mehrere Knoten anstoßen (in Prozent oder absolut) und die Ausbreitung **Runde für Runde**
  berechnen; Dämpfung pro Runde regelt, wie stark Wirkungen über Zwischenschritte nachlassen.
- **Verstehen:** Abspielen der Runden auf der Karte, Liniendiagramm (absolut oder prozentual), Hover-Anzeigen mit
  Werten und Beschreibungen, verknüpfte Hervorhebung zwischen Karte, Listen und Diagramm.
- **Vergleichen und weitergeben:** Jeder Lauf wird mit der Karte gespeichert und lässt sich erneut abspielen,
  als Vorlage nutzen oder als CSV exportieren; Karten lassen sich als JSON sichern und austauschen.

**Abweichung vom klassischen FCM-Modell:** Klassische FCMs rechnen meist mit Aktivierungen zwischen 0 und 1 bzw.
−1 und 1, Gewichten zwischen −1 und +1 und einer Schwellenfunktion (z. B. Sigmoid). fuzzymap verwendet bewusst ein
anschaulicheres **absolutes Modell**: Knoten haben echte Werte in ihrer eigenen Einheit, und weitergegeben wird jede
Runde die **Änderung** – ein Faktor 0,5 heißt „die Hälfte der Änderung des Startknotens kommt beim Ziel an“.
Details im Abschnitt [Simulationsmodell](#simulationsmodell).

---

## Schnellstart

Zum Ausprobieren ohne Installation: Demo unter <https://baach.de/fuzzymap>. Für eine eigene Kopie:

PyScript lädt `main.mpy` per HTTP – die App muss deshalb über einen Webserver laufen, nicht per `file://`.

```bash
cd fuzzymap
python3 -m http.server 8000
# Browser: http://localhost:8000
```

Beim ersten Start wird eine Beispielkarte **„Beispiel: Stadtverkehr“** angelegt. Jeder Knoten und jede Kante hat dort
eine Beschreibung (Bedeutung des Knotens, Begründung der Wirkung), die beim Zeigen mit der Maus erscheint. Über
*Karte … → Beispielkarte hinzufügen* lässt sie sich jederzeit erneut als neue Karte anlegen. Alle benötigten Dateien liegen im
Projekt – auch ein lokaler Server ohne Internetverbindung genügt. Nach dem ersten Laden funktioniert die App
zusätzlich ganz ohne Server (Offline-Cache).

**Installieren:** In Chrome/Edge über das Installieren-Symbol in der Adressleiste, auf iPad/iPhone in Safari über
*Teilen → Zum Home-Bildschirm*.

---

## Bedienung

Die Oberfläche besteht aus drei Bereichen:

| Bereich | Inhalt |
|---|---|
| **Kopfleiste** | Kartenauswahl, *Neue Karte*, Menü *Karte …* (Umbenennen, Duplizieren, Beispielkarte hinzufügen, Löschen – sofort, mit *Rückgängig* in der Meldung), Menü *Export / Import*, Sprachumschalter *DE / EN*, *Hilfe* |
| **Kartenfläche** | Der Graph mit Werkzeugleiste (Modi, Zoom, Schalter *Größe nach Wert*, *Vollbild*) und Abspielleiste während einer Simulation |
| **Seitenleiste** | Tabs *Bearbeiten*, *Simulation*, *Läufe* |

**Breite der Seitenleiste:** Den senkrechten Trenner zwischen Karte und Seitenleiste ziehen (300 px bis 900 px, die Karte
behält mindestens 320 px). Die Karte behält dabei ihren Maßstab und zeigt mehr oder weniger Fläche; das Diagramm wird
in der neuen Breite gezeichnet. Doppelklick auf den Trenner stellt die Standardbreite (400 px) wieder her. Per Tastatur:
Trenner mit `Tab` fokussieren, dann `←`/`→` (mit `Shift` in größeren Schritten), `Pos1` = maximal, `Ende` = minimal,
`Enter` = Standard. Die Breite wird gespeichert. Auf schmalen Bildschirmen (unter 820 px) liegen Karte und Seitenleiste
untereinander, der Trenner entfällt.

**Vollbild:** Der Knopf *Vollbild* rechts in der Werkzeugleiste (Taste `M`) blendet Kopf- und Seitenleiste aus und
schaltet den Browser – wo möglich – in den Vollbildmodus; die Karte füllt dann den ganzen Bildschirm. Bearbeiten
direkt auf der Karte, Zoom und das Abspielen eines geöffneten Laufs funktionieren weiter. Beenden mit demselben Knopf,
`M` oder `Esc`. Wo der Browser keinen Vollbildmodus erlaubt (z. B. eingebettete Ansichten), füllt die Karte das
Browserfenster, und ein Hinweis erscheint. Auf iPad und iPhone wird der Browser-Vollbildmodus bewusst nicht genutzt,
weil Safari ihn schon beim Streichen nach unten beendet – dort füllt die Karte das Fenster; ganz ohne Browserleisten
läuft fuzzymap als App vom Home-Bildschirm.

**Sprache:** Der Umschalter *DE / EN* in der Kopfleiste stellt die gesamte Oberfläche auf Deutsch oder Englisch um –
Menüs, Inspektor, Hinweise, Meldungen, Diagramm, Tooltips und Hilfe. Zahlen folgen der Sprache (Deutsch `1,5` und
`+50 %`, Englisch `1.5` und `+50%`), ebenso der CSV-Export. Beim ersten Start richtet sich die Sprache nach dem Browser
(`de*` = Deutsch, sonst Englisch), danach gilt die gespeicherte Wahl. Texte in den Karten (Knoten, Kartennamen, Läufe)
sind Inhalte und werden nicht übersetzt; nur die Beispielkarte wird beim ersten Start in der Startsprache angelegt.

### Knoten und Kanten bearbeiten

| Aktion | So geht’s |
|---|---|
| Knoten anlegen | Modus **+ Knoten** und auf die Fläche tippen – oder im Modus *Auswählen* doppelklicken |
| Knoten verschieben | Knoten ziehen |
| Text direkt auf der Karte ändern | Doppelklick bzw. Doppeltippen auf den Knoten – oder Knoten auswählen und `Enter` / `F2`. `Enter` oder Klick daneben übernimmt, `Esc` verwirft; ein leeres Feld behält den alten Text. Neue Knoten öffnen das Feld automatisch |
| Text / Wert ändern | Knoten anklicken → Tab *Bearbeiten* |
| Beschreibung | Feld *Beschreibung* im Tab *Bearbeiten* – bei Knoten und Kanten, mehrzeilig. Sie erscheint in der Hover-Anzeige (Maus darüber, Touch: antippen), die immer Knotentext und Wert bzw. Start → Ziel und Faktor zeigt; ein kleiner Punkt am Knoten bzw. am Faktor-Etikett zeigt, dass es eine gibt |
| Kante anlegen | Modus **+ Kante**, vom Start- zum Zielknoten ziehen – oder Start und Ziel nacheinander antippen. Alternativ im Knoten-Inspektor *Kante von hier ziehen* |
| Schleife anlegen (Knoten wirkt auf sich selbst) | Modus **+ Kante** und den Knoten zweimal antippen – oder vom Knoten hinaus und wieder zurück ziehen. Alternativ im Knoten-Inspektor *Schleife auf sich selbst*. Der Bogen sitzt automatisch an der freiesten Seite |
| Faktor ändern | Kante oder ihr Etikett anklicken → Schieberegler (Schritte 0,1), Zahlenfeld (bis zu drei Nachkommastellen, z. B. 0,125) oder Schnellwahl (oben +0,125 … +1, unten −0,125 … −1, je Spalte gleicher Betrag) |
| Richtung umkehren | Kante auswählen → *Richtung umkehren* (nicht möglich, wenn die Gegenkante existiert) |
| Löschen | Auswahl → *Löschen* oder Taste `Entf` (beim Knoten werden seine Kanten mitgelöscht) |
| Ansicht | Fläche ziehen = verschieben, Mausrad oder zwei Finger = zoomen, *Einpassen* zeigt alles |

Pro Richtung gibt es höchstens eine Kante zwischen zwei Knoten; Hin- und Rückkante werden gebogen gezeichnet.
Je Knoten ist höchstens eine Schleife (Kante auf sich selbst) möglich.

### Simulation starten

1. Tab **Simulation** öffnen.
2. **Runden** (1–200) und **Dämpfung pro Runde** (0–1) festlegen, optional einen Namen vergeben.
3. Beim **Anstoß** wählen, ob die Änderung in **Prozent** oder als **absoluter Wert** angegeben wird, und für einen
   oder mehrere Knoten eintragen:
   - Prozent: +100 = verdoppeln, −50 = halbieren (Wert 50 → +50 bzw. −25)
   - absoluter Wert: Betrag, der addiert wird (Wert 50, Eingabe +25 → 75)
   - leer = keine Änderung

   Die Spalte **Ergebnis** zeigt sofort den Wert nach dem Anstoß und die Änderung in der jeweils anderen Einheit.
   Beim Umschalten werden vorhandene Eingaben so umgerechnet, dass die Wirkung gleich bleibt. Bei Knoten mit Wert 0
   ist keine Prozentangabe möglich – deren Eingaben entfallen beim Wechsel zu Prozent (mit Hinweis).
4. **Simulation starten** – der Lauf wird automatisch gespeichert und abgespielt.

Die Eingaben im Tab *Simulation* werden pro Karte gemerkt. Die Spalten der Anstoß-Tabelle haben feste Breiten.

### Läufe ansehen und verwalten

Im Tab **Läufe** stehen alle gespeicherten Durchläufe der Karte, neuester zuerst. Ein Klick öffnet den Lauf:

- **Abspielleiste** auf der Karte: Abspielen/Pause, zum Start, Rundenregler, *Schließen*
- **Diagramm** der Werte je Knoten über die Runden. Der Schalter **Absolut / Änderung %** über dem Diagramm wählt die
  y-Achse: absoluter Wert oder prozentuale Änderung gegenüber Runde 0 (Knoten mit Startwert 0 haben dann keine Linie,
  sie werden unter dem Diagramm genannt). Die Wahl wird gespeichert und gilt für alle Läufe. Zeigt die Maus auf eine Linie,
  erscheinen Knotenname, Runde, Wert und Änderung gegenüber Runde 0 an dieser Stelle. Auf Touch-Geräten: ins
  Diagramm tippen wählt die nächstgelegene Linie, waagerecht mit dem Finger ziehen fährt die Runden ab; die Anzeige
  steht oberhalb des Fingers und bleibt nach dem Loslassen stehen, bis außerhalb getippt wird
- **Tabelle** mit Startwert, Wert der aktuellen Runde und Änderung (absolut und in Prozent)

Je Lauf: *Umbenennen*, *Als Vorlage* (übernimmt Anstoß, Runden und Dämpfung in den Tab *Simulation*), *Löschen* (sofort mit einem Klick, ohne Rückfrage),
sowie *Als CSV exportieren*. *Alle löschen* neben der Überschrift *Gespeicherte Läufe* entfernt alle Läufe der Karte
auf einmal, ebenfalls ohne Rückfrage; die Meldung bietet einige Sekunden lang *Rückgängig* an. Jeder Lauf merkt sich, ob der Anstoß in Prozent oder absolut angegeben war.

---

## Simulationsmodell

### Bedeutung des Faktors

Der Faktor `w` einer Kante gibt an, **welcher Anteil der absoluten Änderung des Startknotens** beim Zielknoten
ankommt. Er liegt zwischen **−10 und +10**, neue Kanten erhalten **0,5**.

> Hat der Startknoten den Wert 50 und verdoppelt sich (Änderung +50), so steigt der Zielknoten
> bei `w = 1,0` um 50, bei `w = 0,5` um 25, bei `w = −2` sinkt er um 100.

### Ablauf in Runden

| Runde | Was passiert |
|---|---|
| 0 | Ausgangszustand – die Werte der Karte |
| 1 | **Anstoß**: Jeder Knoten mit Eingabe ändert sich um `Δ = Wert · p / 100` (Prozent `p`) bzw. um `Δ = a` (absoluter Wert `a`) |
| 2, 3, … | **Ausbreitung**: Jeder Knoten gibt *nur die Änderung der Vorrunde* über seine ausgehenden Kanten weiter |

Formal, mit `Δᵢ(t)` als Änderung von Knoten *i* in Runde *t* und Dämpfung `d`:

```
Δⱼ(t+1) = d · Σᵢ wᵢⱼ · Δᵢ(t)
Wertⱼ(t+1) = Wertⱼ(t) + Δⱼ(t+1)
```

Eigenschaften:

- Mehrere eingehende Kanten **addieren** sich.
- Eine **Schleife** (`i = j`) gibt die Änderung eines Knotens in der nächsten Runde an ihn selbst zurück:
  Faktor > 0 verstärkt, Faktor < 0 dämpft bzw. kehrt um. Beispiel: Anstoß +100, Schleife +0,5, keine weiteren
  Kanten → 100 → 200 → 250 → 275 → … → 300. Bei Faktor ≥ 1 (und Dämpfung 1) wächst der Wert ohne Grenze.
- Eine Änderung wandert pro Runde eine Kante weiter. Eine Kette A → B → C erreicht C also in Runde 3.
- Die Werte sind **kumulativ**: Ein Knoten behält seine Änderung, auch wenn er in späteren Runden nichts mehr weitergibt.
- Ohne Rückkopplung kommt die Simulation nach spätestens *Kettenlänge + 1* Runden zur Ruhe. Die App meldet dann
  „Ab Runde *n* keine weitere Änderung“.
- In **Rückkopplungsschleifen** kann sich die Wirkung aufschaukeln, wenn das Produkt der Faktoren im Kreis betragsmäßig
  ≥ 1 ist. Dagegen hilft eine **Dämpfung** < 1 (z. B. 0,8 – jede Weitergabe wird um 20 % abgeschwächt).

### Dämpfung

Die Dämpfung `d` (0–1) multipliziert jede Weitergabe über eine Kante, in jeder Runde erneut; der Anstoß in Runde 1
bleibt ungedämpft. `d = 1` schwächt nichts ab, `d = 0` gibt nichts weiter.

- Kette A → B → C mit Faktoren 1,0 und Anstoß A +100: ohne Dämpfung B +100, C +100; mit `d = 0,8` B +80, C +64.
- Schleife an A (Startwert 100) mit Faktor 1,0 und Anstoß +100: ohne Dämpfung wächst A unbegrenzt; mit `d = 0,8` kommen
  +80, +64, +51,2 … hinzu, A nähert sich 100 + 500 = 600.
- Faustregel: Ein Kreis kommt zur Ruhe, wenn `|d · Produkt der Faktoren im Kreis| < 1`.
- Werte können negativ werden; es gibt keine Begrenzung (außer einer technischen bei ±10²⁵⁰).

### Rechenbeispiel

Karte: A (50) → B (10) mit `w = 1`, B → C (0) mit `w = −2`. Anstoß: A +100 %.

| Runde | ΔA | ΔB | ΔC | A | B | C |
|---|---|---|---|---|---|---|
| 0 | – | – | – | 50 | 10 | 0 |
| 1 | +50 | 0 | 0 | 100 | 10 | 0 |
| 2 | 0 | +50 | 0 | 100 | 60 | 0 |
| 3 | 0 | 0 | −100 | 100 | 60 | −100 |
| 4 | 0 | 0 | 0 | 100 | 60 | −100 |

---

## Visualisierung

| Element | Bedeutung |
|---|---|
| **Knotenfarbe** | Feste Farbe je Knoten (12er-Palette); identisch mit seiner Linie im Diagramm und den Farbfeldern in allen Listen |
| **Kantenfarbe** | Grün = positiver Faktor, rot gestrichelt = negativ, grau gepunktet = 0 |
| **Kantendicke** | Wächst mit dem Betrag des Faktors (ab 2 maximal) |
| **Etikett am Knoten** (Simulation) | Prozentuale Änderung gegenüber Runde 0 (z. B. „+60 %“), grün oder rot; bei Startwert 0 die absolute Änderung |
| **Hover-Anzeige** | Zeigt die Maus auf einen Knoten: Farbe, Text und Wert; auf eine Kante bzw. ihr Etikett: Start → Ziel und Faktor; darunter jeweils die Beschreibung, falls vorhanden. Auf Touch-Geräten per Antippen |
| **Hover-Anzeige am Knoten** (Simulation) | Zeigt die Maus auf einen Knoten (oder auf seine Zeile bzw. Linie): Text, Wert der gezeigten Runde, Startwert und Änderung absolut und in Prozent, z. B. „+50 / +75 %“. Bei Startwert 0 nur absolut |
| **Füllstärke** (Simulation) | Je größer die relative Änderung, desto kräftiger die Füllung |
| **Animierte Kante** (Simulation) | Über diese Kante fließt in der gezeigten Runde gerade eine Wirkung |
| **Gestrichelter Rand** | Knoten mit negativem Wert |
| **Größe nach Wert** (Schalter) | Knotengröße (Faktor 0,7 … 1,3) nach Wert. **Auf der Karte:** linear über den Wertebereich – der kleinste Wert, auch ein negativer, ergibt den kleinsten Knoten, der größte den größten; sind alle Werte gleich, bleibt die Normalgröße. **In der Simulation:** nach der Änderung gegenüber Runde 0, gemessen am eigenen Startwert – unverändert = Normalgröße, Anstieg größer, Rückgang kleiner; logarithmisch gedämpft, +100 % ergibt die Maximal-, −100 % die Minimalgröße. Knoten mit Startwert 0 werden an der größten Änderung solcher Knoten im Lauf gemessen. Die Skala gilt für den ganzen Lauf, die Größen springen beim Abspielen nicht |

**Verknüpftes Hovern:** Zeigt die Maus auf einen Knoten – im Graph, als Linie im Diagramm oder als Zeile in einer
Liste/Tabelle –, wird er überall gleichzeitig hervorgehoben; im Graph zusätzlich seine Kanten, alles andere wird
abgeblendet. Auf Touch-Geräten geschieht das beim Antippen.

---

## Speichern, Export und Import

**Automatisches Speichern:** Jede Änderung wird sofort im `localStorage` des Browsers gesichert
(Schlüssel `fcm.maps.v1`). Die Daten sind an Browser und Gerät gebunden – für Sicherungen oder den Umzug auf ein
anderes Gerät den Export nutzen.

Menü **Export / Import**:

| Funktion | Ergebnis |
|---|---|
| *Aktuelle Karte (JSON)* | `Kartenname.fuzzymap.json` – Knoten, Kanten, Simulationseinstellungen, alle Läufe |
| *Aktuelle Karte (SVG)* | `Kartenname.svg` – Grafik der Karte, wie angezeigt (bei geöffnetem Lauf die gezeigte Runde: `Kartenname-runde-N.svg`). Im Browser geöffnet funktioniert die Hover-Anzeige weiter: Zeiger auf Knoten oder Kante zeigt Text, Wert bzw. Faktor und Beschreibung und blendet den Rest ab – ohne Skript, nur per CSS. In Grafikprogrammen und als `<img>` eingebunden ist die Grafik statisch |
| *Alle Karten – Sicherung (JSON)* | `fuzzymap-backup-JJJJ-MM-TT.json` – alle Karten |
| *Aktuellen Lauf (CSV)* | Wertetabelle je Runde und Knoten plus Kantenliste; Deutsch: Semikolon und Dezimalkomma, Englisch: Komma und Dezimalpunkt (jeweils Excel-tauglich) |
| *JSON-Datei(en) auswählen …* | Import einer oder mehrerer Dateien – oder Dateien einfach ins Fenster ziehen |

Beim Import werden Karten immer **ergänzt**, nie überschrieben. Gleichnamige Karten erhalten den Zusatz
„(importiert)“. Fehlerhafte Einträge (Kanten zu fehlenden Knoten, doppelte Kanten, Faktoren außerhalb ±10)
werden bereinigt; eine Meldung fasst das Ergebnis zusammen. Exporte aus den Vorgängerversionen „Wirkgraph“ und
„Wirkgefüge“ werden ebenfalls gelesen. Details: [`docs/datenformat.md`](docs/datenformat.md).

---

## Tastenkürzel

| Taste | Funktion |
|---|---|
| `V` | Modus Auswählen |
| `N` | Modus Knoten hinzufügen |
| `K` / `E` | Modus Kante hinzufügen |
| `Enter` / `F2` | Text des ausgewählten Knotens auf der Karte bearbeiten (`Enter` übernimmt, `Esc` verwirft) |
| `Entf` / `Backspace` | Auswahl löschen |
| `F` | Ansicht einpassen |
| `G` | Schalter *Größe nach Wert* |
| `M` | Vollbild an / aus (`Esc` beendet es ebenfalls) |
| `Leertaste` | Simulation abspielen / pausieren (wenn ein Lauf offen ist) |
| `Esc` | Auswahl aufheben, zurück in den Auswahlmodus |
| `Enter` (im Textfeld) | Eingabe abschließen |

Kürzel wirken nicht, solange ein Eingabefeld den Fokus hat.

---

## Projektstruktur

```
fuzzymap/
├── index.html            HTML5-Gerüst, Hilfe-Dialog, lädt PyScript und main.mpy
├── main.mpy              gesamte Anwendungslogik (PyScript / MicroPython)
├── style.css             Gestaltung, heller und dunkler Modus, responsive Layout
├── sw.js                 Service Worker für Offline-Betrieb (Vanilla JS)
├── manifest.webmanifest  PWA-Manifest
├── icons/                App-Icons (SVG, 192 px, 512 px)
├── vendor/               mitgelieferte Laufzeit (unverändert übernommen)
│   ├── pyscript/         PyScript 2026.7.3 (Apache 2.0)
│   ├── micropython/      MicroPython 1.28.0-6, WebAssembly (MIT)
│   ├── fonts/            Schrift Plus Jakarta Sans (SIL Open Font License 1.1)
│   └── LIZENZEN.md       Herkunft, Lizenzen, Anleitung zum Aktualisieren
├── docs/
│   ├── datenformat.md    JSON- und CSV-Format (data-format.md: englisch)
│   └── architektur.md    Aufbau des Codes (architecture.md: englisch)
├── CHANGELOG.md
├── LICENSE               Lizenztext GNU AGPL v3
├── README.md
└── README.en.md          englische Fassung dieser Datei
```

Mitgelieferte Komponenten (Details in [`vendor/LIZENZEN.md`](vendor/LIZENZEN.md)):

- [PyScript](https://pyscript.net) 2026.7.3; `index.html` lädt `vendor/pyscript/core.js`
- MicroPython 1.28.0-6 (WebAssembly); per `config='{"interpreter": "./vendor/micropython/micropython.mjs"}'` am
  `<script type="mpy">` eingebunden, statt es vom CDN zu laden
- Schrift [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans) 5.3.0 unter der SIL Open Font License 1.1 –
  darf frei verwendet, verändert und zusammen mit dem Quellcode weitergegeben werden

---

## Entwicklung

- **Bearbeiten:** Die gesamte Logik steckt in `main.mpy`. Es gibt keinen Build-Schritt – Datei speichern, Seite neu laden.
  `main.mpy` ist trotz der Endung gewöhnlicher Python-Quelltext (kein vorkompilierter MicroPython-Bytecode); im Editor
  die Endung `.mpy` als Python einstellen. Syntax prüfen: `python3 -c "compile(open('main.mpy').read(), 'main.mpy', 'exec')"`.
- **Cache:** Der Service Worker liefert Dateien zuerst aus dem Cache (*stale-while-revalidate*). Nach Änderungen
  entweder die Konstante `CACHE` in `sw.js` erhöhen (z. B. von `fuzzymap-v46` auf `fuzzymap-v47`) oder während der Entwicklung in den
  Browser-DevTools *Application → Service Workers → Bypass for network* aktivieren.
- **Fehlersuche:** Python-Fehler beim Start werden in die Browser-Konsole geschrieben und zusätzlich als Attribut
  `data-err` am `<body>` abgelegt.
- **Daten zurücksetzen:** In der Konsole `localStorage.removeItem("fcm.maps.v1")` und neu laden – es erscheint wieder
  die Beispielkarte.
- **Übersetzungen:** Deutsch ist die Quellsprache. Sichtbare Texte in `main.mpy` stehen in `_("deutscher Text")`, die
  englischen Texte im Wörterbuch `EN` (und `EN_STATIC` für `index.html`). Details in
  [`docs/architektur.md`](docs/architektur.md#sprache-deutsch--englisch).

Hinweise zu Eigenheiten von PyScript/MicroPython (z. B. keine geordneten Dicts, JS-Callbacks über `create_proxy`)
stehen in [`docs/architektur.md`](docs/architektur.md).

---

## Grenzen und bekannte Eigenheiten

- **Größe.** Die mitgelieferte Laufzeit umfasst etwa 1,6 MB (davon MicroPython-WASM rund 450 KB); der erste Start lädt
  davon gut 1 MB, danach kommt alles aus dem Cache.
- **Updates.** Nach einer neuen Version lädt sich die App beim Öffnen einmal kurz selbst neu. Lokale Kopien unter
  derselben Adresse (z. B. `localhost:8000`) teilen sich Cache und gespeicherte Karten.
- **Speicher pro Browser.** `localStorage` fasst je nach Browser etwa 5–10 MB. Sehr viele lange Läufe können das füllen;
  dann erscheint eine Fehlermeldung beim Speichern – ältere Läufe löschen oder exportieren.
- **Farben wiederholen sich** ab dem 13. Knoten einer Karte.
- **Gelöschte Knoten in alten Läufen:** Läufe speichern Namen und Farben der Knoten zum Zeitpunkt der Simulation; sie bleiben
  lesbar, auch wenn Knoten später gelöscht oder umbenannt werden. Auf der Karte erscheinen nicht mehr vorhandene Knoten nicht.
- **Ältere Läufe** aus der Version mit multiplikativem bzw. linearem Modell sind in der Liste mit „(alt)“ markiert und
  weiterhin ansehbar.

---

## Entstehung und Lizenz

**Vibe Coding.** fuzzymap ist vollständig durch *Vibe Coding* entstanden, also durch Programmieren im Gespräch mit
einer KI: Anforderungen, Rückmeldungen und Tests kamen vom Menschen, Code, Texte und Dokumentation von der KI
(Perplexity Computer). Der Änderungsverlauf in [`CHANGELOG.md`](CHANGELOG.md) zeichnet die einzelnen Schritte nach.
Der Code ist lesbar und kommentiert, wurde aber nicht unabhängig begutachtet.

**Lizenz.** Copyright © 2026 die Autorinnen und Autoren von fuzzymap.

fuzzymap ist freie Software: Sie können es unter den Bedingungen der **GNU Affero General Public License**, wie von
der Free Software Foundation veröffentlicht, weitergeben und/oder verändern – entweder gemäß Version 3 der Lizenz oder
(nach Ihrer Wahl) jeder späteren Version. Es wird in der Hoffnung verbreitet, dass es nützlich ist, aber **ohne jede
Gewährleistung** – sogar ohne die implizite Gewährleistung der Marktreife oder der Eignung für einen bestimmten Zweck.
Den vollständigen Lizenztext (englisch, maßgeblich) enthält die Datei [`LICENSE`](LICENSE); siehe auch
<https://www.gnu.org/licenses/agpl-3.0.html>.

**Quellcode:** Der Quellcode liegt auf GitHub unter <https://github.com/jhb/fuzzymap>; dort erscheinen auch neue Versionen.

- Die AGPL gilt für den eigenen Code: `index.html`, `main.mpy`, `style.css`, `sw.js`, `manifest.webmanifest`, `icons/`
  und die Dokumentation. Die Dateien tragen die Kennung `SPDX-License-Identifier: AGPL-3.0-or-later`.
- **Netzwerknutzung (§ 13 AGPL):** Wer eine veränderte Fassung öffentlich als Web-App anbietet, muss den Nutzenden den
  Quelltext dieser Fassung zugänglich machen. Da fuzzymap ohne Build-Schritt auskommt, sind die ausgelieferten Dateien
  selbst der vollständige Quelltext; ein Hinweis darauf, wo man ihn herunterladen kann, genügt. fuzzymap selbst verweist
  dazu in der Hilfe auf das GitHub-Repository.
- Die mitgelieferten Fremdkomponenten in `vendor/` behalten ihre eigenen Lizenzen (PyScript: Apache 2.0, MicroPython:
  MIT, Schrift: SIL Open Font License 1.1, siehe [`vendor/LIZENZEN.md`](vendor/LIZENZEN.md)); alle sind mit der AGPL
  vereinbar.
