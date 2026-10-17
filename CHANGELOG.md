# Änderungsverlauf

## 45 – SVG-Export
- Neu: *Export / Import → Aktuelle Karte (SVG)* – Grafik der Karte, wie angezeigt (im Lauf: gezeigte Runde)
- Die Hover-Anzeige funktioniert in der SVG-Datei weiter (Text, Wert/Faktor, Beschreibung, Abblenden der übrigen
  Elemente) – ohne Skript, nur per CSS; feste Farben, damit auch Grafikprogramme die Datei korrekt zeigen
- Inhalt der Hover-Anzeige in `tip_content()` ausgelagert (gemeinsam für App und Export)

## 44 – Verweis auf die Demo
- README (DE/EN): Hinweis auf die Demo unter https://baach.de/fuzzymap (Übersicht und Schnellstart)

## 43 – Verweis auf GitHub
- Verweis auf das Repository https://github.com/jhb/fuzzymap (README DE/EN, Hilfe *Über fuzzymap*, Kopfkommentare)

## 42 – Lizenz und Hinweis auf Vibe Coding
- fuzzymap steht unter der GNU Affero General Public License v3.0 oder später: Lizenztext in `LICENSE`,
  SPDX-Kennung in `index.html`, `main.mpy`, `style.css`, `sw.js`
- Hinweis, dass das Projekt vollständig per Vibe Coding entstanden ist: README (DE/EN, oben und im neuen Abschnitt
  *Entstehung und Lizenz*) und neuer Abschnitt *Über fuzzymap* in der Hilfe
- `vendor/LIZENZEN.md`: Verhältnis zur AGPL ergänzt, alter Name „Wirkgraph“ ersetzt

## 41 – Vollbild auf iPad und in eingebetteten Ansichten
- iPad/iPhone: kein Browser-Vollbild mehr, weil Safari es beim Streichen nach unten beendete und das beim Verschieben
  der Karte störte; Kopf- und Seitenleiste werden weiterhin ausgeblendet
- Lehnt der Browser das Vollbild ab (z. B. eingebettete Vorschau in Firefox), erscheint ein Hinweis; die Karte füllt
  dann das Fenster

## 40 – Vollbild für die Karte
- Neuer Knopf *Vollbild* rechts in der Werkzeugleiste (Taste `M`): blendet Kopf- und Seitenleiste aus und nutzt,
  wo möglich, den Vollbildmodus des Browsers; beenden per Knopf, `M` oder `Esc`
- Ohne Browser-Vollbild (iPhone, eingebettete Ansichten) füllt die Karte das Fenster

## 39 – Hover-Anzeige an Knoten auf dem iPad
- Antippen eines Knotens zeigt jetzt die Hover-Anzeige (Text, Wert, Beschreibung bzw. Werte der Runde); bisher
  blieb sie auf Touch-Geräten aus, weil das Antippen intern als Ziehen begann und die Anzeige danach nicht wieder
  eingeblendet wurde. Antippen der leeren Fläche blendet sie aus
- Nach dem Verschieben eines Knotens erscheint die Anzeige wieder

## 38 – Karte löschen ohne Rückfrage
- *Karte … → Löschen* löscht sofort; die Meldung bietet *Rückgängig* und stellt die Karte an alter Stelle wieder her
- Grund: Browser-Rückfragen (`confirm`) sind in eingebetteten Ansichten wie der Vorschau gesperrt, dann geschah beim
  Löschen nichts

## 37 – Beispielkarte hinzufügen
- Neuer Eintrag *Beispielkarte hinzufügen* im Menü *Karte …*: legt die aktuelle Beispielkarte in der gewählten Sprache
  als neue Karte an (bei gleichem Namen mit Nummer, z. B. „Beispiel: Stadtverkehr 2“); vorhandene Karten bleiben unverändert

## 36 – Beschreibungen in der Beispielkarte
- Die Beispielkarte „Beispiel: Stadtverkehr“ / „Example: City traffic“ hat jetzt Beschreibungen für alle Knoten
  (Bedeutung, Index 100 = heutiger Stand) und Kanten (Begründung von Richtung und Stärke der Wirkung)
- Gilt für neu angelegte Beispielkarten; vorhandene Karten bleiben unverändert

## 35 – Größenbereich der Knoten
- *Größe nach Wert*: Knotengröße 0,7 … 1,3 statt 0,45 … 1,45 – symmetrisch um die Normalgröße 1, damit die Beschriftung
  kleiner Knoten lesbar bleibt und Anstieg und Rückgang in der Simulation gleich stark wirken

## 34 – Schnellwahl Faktor neu angeordnet
- Obere Reihe positiv (+0,125 … +1), untere negativ (−0,125 … −1); untereinander stehen jeweils Werte mit gleichem Betrag

## 33 – main.mpy
- `main.py` heißt jetzt `main.mpy` (Inhalt unverändert); `index.html`, `sw.js` und Dokumentation angepasst

## 32 – Größe nach Wert mit Vorzeichen
- Auf der Karte: Knotengröße linear über den Wertebereich, der kleinste (auch negative) Wert ergibt den kleinsten Knoten
- In der Simulation: Größe nach Änderung gegenüber dem eigenen Startwert (unverändert = Normalgröße, logarithmisch
  gedämpft, ±100 % = Maximal-/Minimalgröße); Startwert 0 relativ zur größten Änderung solcher Knoten im Lauf
- Bisher wuchs die Größe mit dem Betrag, sodass −80 größer wirkte als +10

## 31 – Englische Dokumentation
- Neu: `README.en.md`, `docs/data-format.md`, `docs/architecture.md` – englische Fassungen von README, Datenformat
  und Architektur; alle Dateien verlinken oben auf die jeweils andere Sprache
- Korrekturen in den deutschen Dokumenten: Schleifen sind erlaubt (auch beim Import), Hover-Anzeige an Knoten und
  Kanten inkl. Beschreibungen, Hinweis zu Übersetzungen, Import älterer „Wirkgraph“-Exporte

## 30 – Einleitung in der Hilfe
- Hilfe beginnt mit einer kurzen Einleitung: was eine Fuzzy Cognitive Map ist und wofür fuzzymap gedacht ist (Deutsch und Englisch)

## 29 – README: Zweck und Aufgabe
- Neuer Abschnitt *Worum es geht*: Zweck von Fuzzy Cognitive Maps (Herkunft, Einsatzgebiete, typische Fragen) und
  Aufgabe dieser Implementierung, inklusive Abgrenzung zum klassischen FCM-Modell

## 28 – Hover-Anzeige immer
- Die Hover-Anzeige erscheint jetzt bei allen Knoten (Text, Wert) und Kanten (Start → Ziel, Faktor), auch ohne Beschreibung;
  sie ersetzt den einfachen Browser-Tooltip

## 27 – Beschreibungen, feinere Schnellwahl, feste Tabellenspalten
- Knoten und Kanten haben ein Feld *Beschreibung* (mehrzeilig, Feld `note`); sie erscheint beim Darüberfahren
  (Touch: antippen), in der Simulation zusätzlich unter Wert und Änderung. Ein kleiner Punkt markiert Knoten
  und Faktor-Etiketten mit Beschreibung. Export, Import und Duplizieren übernehmen sie
- Schnellwahl für den Faktor: −1, −0,75, −0,5, −0,25, −0,125 und +0,125 … +1 in zwei Reihen
- Tabelle *Anstoß* in der Simulation mit festen Spaltenbreiten; lange Knotennamen brechen um

## 26 – Zuverlässige Updates
- Nach einem Update lädt sich die App einmal selbst neu, sobald der neue Service Worker übernimmt – die neue Version
  ist damit sofort sichtbar statt erst beim übernächsten Öffnen (wichtig auch für lokale Kopien unter derselben Adresse)
- Der Service Worker lädt die Dateien beim Installieren am HTTP-Cache des Browsers vorbei (`cache: "reload"`)

## 25 – Alle Läufe löschen
- Knopf *Alle löschen* in der Laufliste löscht alle Läufe der aktuellen Karte mit einem Klick, ohne Rückfrage
- Die Meldung „N Läufe gelöscht.“ hat 8 Sekunden lang einen Knopf *Rückgängig*
- Laufliste: Name, Datum und Anstoß stehen wieder sauber untereinander (CSS-Regel wurde überschrieben)

## 24 – Prozent in den Etiketten
- Etiketten an den Knoten zeigen während der Simulation wieder die Änderung gegenüber Runde 0 in Prozent;
  bei Startwert 0 (kein Prozent möglich) die absolute Änderung. Absolute Werte stehen weiter in der Hover-Anzeige

## 23 – Neuer Name „fuzzymap“
- App heißt jetzt „fuzzymap“ (vorher „fuzzmap“); Exportdateien `Kartenname.fuzzymap.json`, `fuzzymap-backup-JJJJ-MM-TT.json`,
  Formatkennung `fuzzymap-fcm`; ältere Exporte lassen sich weiter importieren, gespeicherte Karten bleiben erhalten

## 22 – Läufe mit einem Klick löschen
- *Löschen* in der Laufliste entfernt den Lauf sofort ohne Rückfrage; eine kurze Meldung bestätigt das Löschen

## 21 – Neuer Name „fuzzmap“
- App heißt jetzt „fuzzmap“ (kleingeschrieben): Titel, Kopfleiste, Hilfe, Manifest, Dokumentation
- Exportdateien heißen `Kartenname.fuzzmap.json` und `fuzzmap-backup-JJJJ-MM-TT.json`, Formatkennung `fuzzmap-fcm`;
  ältere Exporte (`wirkgraph-fcm`, `wirkgefuege-fcm`) lassen sich weiter importieren
- Gespeicherte Karten im Browser bleiben erhalten (Speicherschlüssel unverändert)

## 20 – Englisch und Sprachumschalter
- Umschalter *DE / EN* in der Kopfleiste; die gesamte Oberfläche ist auf Englisch verfügbar (Menüs, Inspektor, Hinweise,
  Meldungen, Rückfragen, Diagramm, Tooltips, Hilfe)
- Zahlen, Prozentangaben, Datum und CSV-Export folgen der Sprache; erster Start in der Browsersprache, Wahl wird gespeichert
- Beispielkarte entsteht beim ersten Start in der Startsprache („Example: City traffic“)
- Kürzel `E` zusätzlich zu `K` für den Kantenmodus; Pluralform „1 Kante“ in der Knotenliste
- Kopfleiste auf schmalen Bildschirmen zweizeilig (Kartenauswahl, Sprache und Hilfe in einer Zeile)

## 19 – Schnelleres Bearbeiten
- Werte, Texte und Faktoren lassen sich auch bei vielen gespeicherten Läufen flüssig bearbeiten
  (≈ 7 statt ≈ 70 ms je Tastendruck bei 15 Läufen à 100 Runden)
- Gespeicherte Läufe werden nur noch einmal serialisiert; beim Tippen wird nach 400 ms Pause gespeichert,
  beim Ausblenden oder Schließen der Seite sofort

## 18 – Dämpfung erklärt
- Neuer Hilfe-Abschnitt „Dämpfung“ mit Beispielen (Kette und Schleife) und Faustregel; Tooltip am Eingabefeld

## 17 – Diagramm in Prozent
- Schalter „Absolut / Änderung %“ am Liniendiagramm; Prozent = Änderung gegenüber Runde 0
- Hover-Anzeige im Prozentmodus mit Prozent, Wert und absoluter Änderung; Knoten mit Startwert 0 werden genannt
- Einstellung wird gespeichert; y-Achse wird bei langen Beschriftungen breiter

## 16 – Genauere Faktoren
- Faktoren mit bis zu drei Nachkommastellen (bisher zwei), Zahlenfeld breiter
- Etiketten an den Kanten passen ihre Breite an (z. B. „+1,125“); Feld zeigt nach Verlassen den gespeicherten Wert

## 15 – Schleifen
- Kanten von einem Knoten auf sich selbst (Selbstverstärkung bzw. -dämpfung), auch in Simulation und Import
- Anlegen: Knoten im Kantenmodus zweimal antippen, hinaus- und zurückziehen oder Knopf im Inspektor
- Bogen an der freiesten Seite des Knotens; Erklärung im Inspektor; „Einpassen“ berücksichtigt die Bögen

## 14 – Text direkt auf der Karte bearbeiten
- Doppelklick bzw. Doppeltippen auf einen Knoten oder `Enter`/`F2` öffnet ein Textfeld direkt über dem Knoten
- `Enter` oder Klick daneben übernimmt, `Esc` verwirft, leeres Feld behält den alten Text
- Neue Knoten öffnen das Feld automatisch; Knotenliste und Inspektor werden live mitgeführt

## 13 – Freie Schrift, Prozent in den Etiketten
- Schrift Satoshi durch Plus Jakarta Sans ersetzt (SIL Open Font License 1.1, frei weitergebbar)
- Hover-Anzeige am Knoten in der Simulation: Wert, Startwert, Änderung absolut und in Prozent (z. B. „+50 / +75 %“);
  die Etiketten selbst bleiben kompakt (nur absolut)

## 12 – Laufzeit mitgeliefert
- PyScript 2026.7.3, MicroPython 1.28.0-6 und die Schrift Satoshi liegen in `vendor/`; keine Anfragen an fremde Server mehr
- Service Worker lädt alle Startdateien vor – vollständig offline nutzbar nach dem ersten Laden
- `vendor/LIZENZEN.md` mit Herkunft, Lizenzen und Anleitung zum Aktualisieren

## 11 – Sicherer Import
- Importierte Karten werden vollständig neu aufgebaut; IDs mit unzulässigen Zeichen werden ersetzt (inkl. aller Verweise),
  damit präparierte Dateien keinen Code in die Seite einschleusen können
- Zahlen, Einheiten, Rundenzahlen und Texte in Läufen und Simulationseinstellungen werden geprüft bzw. begrenzt

## 10 – Verstellbare Seitenleiste
- Ziehbarer Trenner zwischen Karte und Seitenleiste (300–900 px), Doppelklick = Standardbreite, per Tastatur bedienbar
- Breite wird gespeichert; die Karte behält beim Verstellen ihren Maßstab
- Diagramm wird in der jeweiligen Breite gezeichnet, Schrift und Linien bleiben gleich groß
- Hinweistext auf der Karte wird bei schmaler Fläche ausgeblendet

## 9 – Diagramm-Anzeige für Touch
- Antippen wählt die nächstgelegene Linie, waagerechtes Ziehen fährt die Runden ab
- Anzeige oberhalb bzw. seitlich des Fingers, größer, bleibt nach dem Loslassen stehen
- Verknüpfte Hervorhebung bleibt auf Touch-Geräten bis zum nächsten Antippen erhalten

## 8 – Diagramm mit absoluten Werten
- y-Achse des Liniendiagramms zeigt den Wert der Knoten statt der Änderung
- Hover über eine Linie zeigt Knotenname, Runde, Wert und Änderung an der Mausposition

## 7 – Anstoß in absoluten Werten
- Umschalter „Prozent / absoluter Wert“ für die Anfangsänderung im Tab *Simulation*
- Spalte „Ergebnis“ mit Vorschau des neuen Werts und der Änderung in der anderen Einheit
- Beim Umschalten werden Eingaben umgerechnet; Läufe speichern Einheit (`unit`) und absolute Anfangsänderungen (`deltas`)

## 6 – Dokumentation
- Hilfe-Dialog in der App (Knopf *Hilfe* bzw. Taste `?`)
- Ausführliche README, `docs/datenformat.md`, `docs/architektur.md`
- Kommentierte Abschnitte und Docstrings in `main.py`

## 5 – Verknüpftes Hovern und Knotenfarben
- Hovern über Knoten, Diagrammlinie oder Listenzeile hebt den Knoten überall hervor (inkl. seiner Kanten)
- Feste Farbe je Knoten, identisch in Graph, Diagramm und Listen; wird gespeichert und exportiert
- In der Simulation zeigt die Füllstärke die Größe der Änderung, das Etikett deren Richtung

## 4 – Größe nach Wert
- Schalter in der Werkzeugleiste (Taste `G`): Knotenfläche wächst mit dem Betrag des Werts
- Negative Werte mit gestricheltem Rand

## 3 – Umbenennung und Export/Import
- Name „Wirkgefüge“ → „Wirkgraph“
- Menü *Export / Import*: Karte, Sicherung aller Karten, Lauf als CSV; Import mehrerer Dateien und per Drag & Drop
- Bereinigung importierter Daten, Meldungen statt Dialogfenster

## 2 – Absolutes Simulationsmodell
- Faktor = Anteil der absoluten Änderung des Startknotens, Bereich −10 … +10, Standard 0,5
- Diagramm und Etiketten zeigen absolute Änderungen; Knoten mit Wert 0 verändern sich ebenfalls

## 1 – Erste Version („Wirkgefüge“)
- Karten mit Knoten (Text, Wert) und gewichteten Kanten (−1 … +1)
- Rundenweise Simulation (multiplikatives bzw. lineares Modell), Abspielen, Diagramm
- Beliebig viele gespeicherte Läufe je Karte, Offline-Betrieb als PWA
