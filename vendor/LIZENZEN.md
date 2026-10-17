# Mitgelieferte Fremdkomponenten

fuzzymap liefert alle Laufzeitdateien selbst aus, damit zur Laufzeit keine fremden Server angefragt werden
und kein fremder Code nachgeladen wird. Die Dateien sind unverändert übernommen.

| Verzeichnis | Komponente | Version | Herkunft | Lizenz |
|---|---|---|---|---|
| `pyscript/` | PyScript (core) | 2026.7.3 | https://pyscript.net/releases/2026.7.3/ | Apache 2.0 – `pyscript/LICENSE` |
| `micropython/` | MicroPython WebAssembly, PyScript-Variante | 1.28.0-6 | https://cdn.jsdelivr.net/npm/@micropython/micropython-webassembly-pyscript@1.28.0-6/ | MIT – `micropython/LICENSE` |
| `fonts/` | Schrift Plus Jakarta Sans (Tokotype) | 5.3.0 | https://github.com/tokotype/PlusJakartaSans, Dateien aus https://www.npmjs.com/package/@fontsource/plus-jakarta-sans | SIL Open Font License 1.1 – `fonts/OFL.txt` |

## Weitergabe

fuzzymap selbst steht unter der GNU AGPL v3.0 oder später (`../LICENSE`); die Komponenten hier behalten ihre eigenen
Lizenzen, die mit der AGPL vereinbar sind.


Alle drei Komponenten stehen unter freien Lizenzen und dürfen zusammen mit fuzzymap weitergegeben werden,
auch öffentlich (z. B. in einem Repository). Bedingung ist jeweils, die Lizenztexte beizulegen
(`pyscript/LICENSE`, `micropython/LICENSE`, `fonts/OFL.txt`). Die Schrift darf unter der OFL nicht einzeln verkauft werden.

## Aktualisieren

1. Neue PyScript-Version laden: `core.js`, `core.css` und alle von `core-*.js` per `"./…"` referenzierten Dateien
   aus `https://pyscript.net/releases/<version>/` nach `pyscript/` kopieren.
2. Die von dieser Version erwartete MicroPython-Version steht in `core-*.js`
   (`micropython-webassembly-pyscript@…`); `micropython.mjs` und `micropython.wasm` nach `micropython/` kopieren.
3. Dateinamen in `sw.js` (Liste `CORE`) anpassen und `CACHE` hochzählen.
