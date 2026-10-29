# Konzept: Arcade-Modus für imp@jump

Stand: 29.10.2026 · Status: Entwurf

Allgemein verständliche Fassung ohne Technik: [konzept-arcade-ueberblick.md](konzept-arcade-ueberblick.md)

## Ziel

Das Spiel soll sich wie ein Arcade-Automat anfühlen: Der Score steht groß im Mittelpunkt, der Spieler hat
3 Leben, die Welt verändert sich mit der Höhe und wird schwerer, und jede Aktion hat einen Sound. Die
Highscore-Liste zeigt immer die ersten 10 Plätze, auch wenn sie noch leer sind, damit andere einen Anreiz
haben, sie zu füllen. Das Spiel heißt künftig **imp@jump**, die Hintergründe sind Pixel-Art, alles
andere wird scharf gezeichnet, und der Ton ist 8-Bit-Retro.

Was es heute gibt (Ausgangslage):
| Bereich | Heute |
|---|---|
| Name | „Doodle Jump“ (Startbildschirm), „IMP Doodle Jump“ (Browser-Titel) |
| Grafik | Glatte Vektorformen auf dem Canvas (`roundRect`, Kreise), kariertes Papier |
| Score | Kleine MUI-`Paper`-Box oben links, React-State, wird bei jeder Änderung neu gerendert |
| Leben | Keine. Monster berühren oder herunterfallen = sofort Game Over |
| Schwierigkeit | `difficulty()` steigt linear bis 8000 px (800 m) und bleibt dann gleich |
| Welt | Ein Hintergrund (kariertes Papier), ein Monstertyp ab 150 m, Plattformen: normal, bewegt, brechend, Feder |
| Sound | Keiner |
| Highscores | Top 10 als MUI-Tabelle, bei leerer Liste nur der Text „Noch keine Highscores“ |
| Spielername | Wird erst nach Game Over abgefragt, im Browser gemerkt (`localStorage`) |
| Spielfigur | Feste Farben (hellgrüner Körper, dunkelgrüne Streifen, graue Beine) |

## Name und Stil

Diese Vorgaben gelten für alle folgenden Abschnitte.

### Name

- Das Spiel heißt **`imp@jump`**, immer kleingeschrieben.
- Untertitel, klein darunter: **„der einzig wahre jumphost“**, ebenfalls kleingeschrieben.
- Sichtbar auf dem Startbildschirm über der Bestenliste (2.1), auf dem Game-Over-Screen und als
  Browser-Titel (`<title>imp@jump</title>` in `frontend/index.html`).
- Auf dem Startbildschirm steht der Name groß in der Arcade-Schrift, der Untertitel in der kleinsten
  Schriftgröße (16 Weltpixel) und gedimmter Farbe.
- Technische Namen bleiben: Repository `IMP-Doodle-Jump`, Java-Paket `de.imp.doodlejump`, API-Pfade und der
  `localStorage`-Schlüssel `doodle-jump.name`. Würde der Schlüssel umbenannt, wären die gespeicherten
  Spielernamen weg.

### Grafik: Pixel-Art nur im Hintergrund

Pixel-Art gibt es nur in den Hintergründen. Sie sorgen für den Retro-Eindruck. Alles andere (Spielfigur,
Plattformen, Monster, Geschosse, Partikel, HUD, Schrift und Menüs) wird scharf in voller
Bildschirmauflösung gezeichnet, mit Kantenglättung und ohne sichtbare Pixel.

- **Zwei Ebenen in `render.ts`:**
  1. **Hintergrund:** wird in einen Offscreen-Canvas mit 200 × 300 px gezeichnet (1 Art-Pixel =
     2 Weltpixel bei 400 × 600 Weltpixeln) und mit `imageSmoothingEnabled = false` auf das sichtbare Canvas
     hochskaliert. Positionen der Parallax-Ebenen werden auf ganze Art-Pixel gerundet, sonst flimmern
     langsame Bewegungen.
  2. **Alles andere:** direkt auf das sichtbare Canvas, das `GameScreen.tsx` schon heute in
     Geräteauflösung anlegt (`devicePixelRatio`). Dabei ist `imageSmoothingEnabled = true` und es gibt
     kein Runden auf ein Raster.
- **Kein `image-rendering: pixelated`** am Canvas-Element, sonst würden auch Figuren und Schrift pixelig.
- **Skalierung:** Das Spielfeld füllt wie heute die verfügbare Fläche, ohne ganzzahligen Faktor und ohne
  Rand. Bei krummen Faktoren sind die Hintergrund-Pixel minimal unterschiedlich breit, das fällt im
  Hintergrund nicht auf.
- **Palette:** eine feste Palette mit 16–32 Farben für das ganze Spiel (z. B. die PICO-8-Palette), für
  Hintergründe und Sprites gleichermaßen. Jede Zone nutzt einen Ausschnitt daraus, damit die Zonen
  unterschiedlich wirken, aber zusammenpassen.
- **Sprites:** SVG-Dateien in `frontend/public/sprites/`, gezeichnet z. B. mit Inkscape oder Figma. Sie
  ersetzen die heutigen `roundRect`- und `arc`-Formen in `drawPlayer`, `drawPlatform` und `drawMonster`.
  Jedes Sprite wird pro Canvas-Größe einmal in einen Offscreen-Canvas in Zielauflösung gerastert und dann
  per `drawImage` gezeichnet. SVGs direkt in jedem Frame zu zeichnen wäre zu langsam. Ändert sich die
  Fenstergröße, wird neu gerastert. Gebraucht werden:
  - Spieler: stehen, springen, schießen, fallen, am Fallschirm, Todesanimation
  - alle Plattformtypen inkl. Stachelplattform (4.4), Feder
  - jeder Monstertyp mit Animation, Geschosse
  - Power-ups: Herz (auch fürs HUD), Punkte-Power-up mit einem Motiv je Zone (5.3), Raketenrucksack mit
    Flamme (5.4)
  - Fallschirm
  - Partikel für zerplatzende Herzen und Explosionen
- **Hintergründe:** zunächst nur einfarbige Platzhalter je Zone (4.1). Später kommen echte Bilder in
  Pixel-Art als PNG im 200 × 300-Raster: Das Notizblock-Raster der Hotline wird in Pixeln gezeichnet, die
  Parallax-Ebenen (z. B. Serverracks, Code-Zeilen, Skyline) sind Kacheln, die sich wiederholen. Gezeichnet
  mit Piskel oder Aseprite, abgelegt in `frontend/public/backgrounds/`.
- **Schrift:** Arcade-Schrift „Press Start 2P“ (1.1), scharf in Canvas-Auflösung gezeichnet. Größen in
  Vielfachen von 8 Weltpixeln, damit die Buchstaben gleichmäßig wirken.
- **Menüs** (Startbildschirm, Game Over, Namenseingabe) im selben Stil über das MUI-Theme: Arcade-Schrift,
  Farben aus der Palette, eckige Rahmen ohne Schatten und ohne abgerundete Ecken.

### Ton: 8-Bit-Retro

Alle Geräusche und die Musik klingen wie eine Spielkonsole der 80er (NES, Game Boy). Details in Abschnitt 6.

- **Effekte:** nur Rechteck-, Dreieck-, Sägezahnwellen und Rauschen, erzeugt mit jsfxr.
- **Musik:** Chiptune mit höchstens 4 Stimmen wie beim NES (2 × Rechteck, Dreieck, Rauschen), gebaut mit
  BeepBox. Fremde Titel nur, wenn sie diesen Klang haben.

## 1. Arcade-HUD

Das HUD wird direkt auf das Canvas gezeichnet (`render.ts`, neue Funktion `drawHud`) statt als MUI-Overlay.
So bleibt alles scharf im Spielfeld, skaliert mit dem Canvas, und React muss nicht bei jeder
Score-Änderung neu rendern.

Das untere Sechstel des Spielfelds bleibt frei von HUD-Elementen, damit dort später Touch-Buttons Platz
haben (siehe Abschnitt 9).

```
┌──────────────────────────────────────────┐
│  ▲ 2000 m       001234         ♥ ♥ ♡     │
│  ┃               HI 012345               │
│  ┃             NEXT #3 004210            │
│  ┃                                       │
│  ┣━ 1483 m ◄ aktuelle Höhe               │
│  ┃                                       │
│  ┣╌ 1512 m ◄ Höchster Punkt dieser Runde │
│  ┃                                       │
│  ▼ 1000 m                                │
│                                          │
│                  ZONE 2                  │  ◄ Banner beim Zonenwechsel (2 s)
│           PROFESSIONAL SERVICE           │
│                                          │
│                                          │  ◄ frei für spätere Touch-Buttons
└──────────────────────────────────────────┘
```

### 1.1 Score: oben mittig, groß

- Position: horizontal zentriert, oben, 32 Weltpixel Schrifthöhe. Die Zeilen `HI` und `NEXT` haben
  16 Weltpixel.
- Schrift: Arcade-Schrift **„Press Start 2P“** (SIL Open Font License), selbst gehostet über das npm-Paket
  `@fontsource/press-start-2p`. Die CSP erlaubt nur `font-src 'self'`, ein Google-Fonts-Link ginge also
  nicht. Vor dem Spielstart `document.fonts.load('32px "Press Start 2P"')` abwarten, sonst zeichnet das
  Canvas im ersten Frame die Fallback-Schrift.
- Format: 6 Stellen mit führenden Nullen (`001234`), weiße Schrift mit dunkler Kontur, damit sie auf jedem
  Hintergrund lesbar ist.
- Darunter klein `HI 012345`: der aktuelle Platz-1-Score. Sobald der Spieler ihn überholt, blinkt `HI` und
  zeigt den eigenen Score.
- Noch eine Zeile darunter `NEXT #3 004210`: der nächste Platz der Top 10, den der Spieler noch nicht
  überholt hat. Leere Plätze zählen mit 0 Punkten, sind also sofort überholt. Mit jedem überholten Platz
  springt die Zeile zum nächsten (kurzer Blink und Sound). Ist Platz 1 überholt, steht dort `NEW #1`.
- Die Highscore-Liste für `HI` und `NEXT` lädt heute nur `HighscoreScreen` selbst. Sie wird in `App.tsx`
  hochgezogen und an `HighscoreScreen` und `GameScreen` weitergereicht.
- Feedback: Bei Punkten durch Monster oder Power-ups springt kurz `+50` aus dem Monster bzw. Item nach oben
  und der Score „pulst“ (kurz 110 % groß).

### 1.2 Leben: 3 Herzen oben rechts

- 3 Herz-Symbole oben rechts, gefüllt = vorhanden, Umriss = verloren.
- Verlust: das Herz zerplatzt (kurze Partikel-Animation) und der Bildschirm blitzt rot auf.
- Bei nur noch 1 Herz pulsiert das letzte Herz dauerhaft. Dazu kommt ein Warnpiep, aber nur dreimal direkt
  nach dem Verlust, damit er nicht nervt.

### 1.3 Höhenmeter an der Seite

- Schmale, halbtransparente Leiste am linken Rand (ca. 10 px breit, 70 % der Bildhöhe), damit sie den
  Spieler beim Umlaufen am Rand nicht verdeckt.
- **Umrechnung: 10 px = 1 m.** Damit entsprechen Höhenmeter genau den Höhenpunkten im Score (heute
  `PIXELS_PER_POINT = 10`).
- Die Leiste zeigt die **aktuelle Zone**: unten Zonenanfang, oben Zonenende mit Namen der nächsten Zone.
  Der Füllstand zeigt den Fortschritt in der Zone. Das macht das nächste Ziel greifbar („noch 117 m bis
  Development“).
- Neben dem Marker für die aktuelle Höhe steht immer die **absolute Höhe ab 0 m als Zahl** (`483 m`).
- Zweiter Marker nach einem Fallschirm-Absturz: der höchste Punkt dieser Runde (gestrichelt). Der Score sinkt
  beim Absturz nicht, man sieht aber, wie viel man wieder aufholen muss.
- Im Chefsessel (ab 7000 m, endlos) läuft die Leiste von Meilenstein zu Meilenstein (alle 1000 m).

## 2. Scoreboard und Spieler

### 2.1 Top 10 immer sichtbar

Alle 10 Plätze werden **immer** angezeigt. Leere Plätze sind Platzhalter und wirken wie eine
Einladung:

```
               imp@jump
       der einzig wahre jumphost      ◄ klein, gedimmt

          ★  HIGH SCORES  ★

   1ST   ☻ ANNA          012345     ◄ ☻ = Mini-Figur im Skin des Spielers
   2ND   ☻ JONAS         008210
   3RD   ☻ LEA           004210
   4TH   ☻ TOM           001980
   5TH   ? DEIN NAME?    000000     ◄ erster leerer Platz blinkt
   6TH   ? ---------     000000
   7TH   ? ---------     000000
   8TH   ? ---------     000000
   9TH   ? ---------     000000
  10TH   ? ---------     000000

        ▶ PRESS SPACE TO START ◀
```

- Leerer Platz: Name `---------`, Score `000000`, gedimmte Farbe. Beim ersten leeren Platz blinkt
  „DEIN NAME?“.
- Plätze 1–3 in Gold, Silber, Bronze (die Farben aus `TROPHY` bleiben), Rest weiß.
- **Mini-Figuren:** Vor jedem Namen steht die Spielfigur im gespeicherten Skin dieses Spielers (2.4),
  mit Hut und Brille, in einfacher Größe (Pose „stehen“). Leere Plätze und Spieler ohne gespeicherten Skin
  zeigen eine graue Silhouette mit `?`. Die Figuren des Top-3 hüpfen leicht.
- Der eigene, gerade gespeicherte Eintrag blinkt (statt heute nur `selected`).
- „Noch keine Highscores“ entfällt, die leeren Plätze übernehmen diese Rolle.
- Start zusätzlich mit Leertaste/Enter, der **Play**-Button bleibt für die Maus. Danach folgen
  Namenseingabe (2.3) und Skin-Editor (2.4).

### 2.2 Umsetzung

- `HighscoreScreen.tsx` füllt die Liste immer auf 10 Einträge auf
  (`Array.from({ length: 10 }, (_, i) => list[i] ?? null)`). Das Backend liefert schon heute die Top 10
  (`HighscoreService.TOP_LIMIT`).
- Für die Mini-Figuren liefert `GET /api/v1/highscores` pro Eintrag zusätzlich `skin` (Aufbau wie in 2.5,
  `null` ohne gespeicherten Skin). `HighscoreRepository.findTop` holt ihn per `LEFT JOIN player_skin` in
  derselben Abfrage. Das Feld kommt nur dazu, bestehende Felder bleiben, die Änderung ist also abwärtskompatibel.
- Das Frontend färbt jede Figur einmal mit `recolorSprites` (2.4) um und zeigt sie als `<img>` mit der
  umgefärbten SVG als `data:`-URL, zwischengespeichert pro Skin. So bleibt die Mini-Figur in jeder Größe
  scharf. Die CSP erlaubt `img-src 'self' data:` schon heute.
- 10 Zeilen plus Überschrift und Button müssen auf den Bildschirm passen: Zeilenhöhe und Schriftgröße so
  wählen, dass die Liste ab 700 px Fensterhöhe ohne Scrollen sichtbar ist.
- Arcade-Optik über das MUI-Theme (dunkler Hintergrund, Arcade-Schrift für Überschrift und Tabelle), kein
  eigenes CSS außerhalb von Theme/`sx`.
- Game-Over-Screen im selben Stil: großes blinkendes `GAME OVER`, darunter Score und, falls er für die
  Top 10 reicht, „NEUER HIGHSCORE – PLATZ 3!“ (berechnet aus der Liste in `App.tsx`, siehe 1.1).
- **Kein „Continue?“** nach dem Tod. Wer stirbt, beginnt neu. Sonst ließen sich Highscores mit Ausdauer
  statt Können erspielen und verlören an Wert.

### 2.3 Name am Anfang

Heute fragt erst der Game-Over-Screen nach dem Namen. Künftig meldet sich der Spieler vor der Runde an:

1. Startbildschirm → **Play** (oder Leertaste/Enter)
2. **Name eingeben** → Enter oder **Weiter**
3. **Skin anpassen** (2.4) → **Los**
4. Intro (3.4), dann die Runde
5. Game Over → **Nochmal** führt mit demselben Namen und Skin direkt ins Intro

Namenseingabe (neuer Bildschirm `NameScreen.tsx`):

- Eingabefeld in Arcade-Schrift mit `DEIN NAME?`, vorausgefüllt mit dem zuletzt in diesem Browser benutzten
  Namen (`loadLastName`, der Schlüssel bleibt `doodle-jump.name`).
- Regeln wie heute: 1–20 Zeichen, Leerzeichen am Rand werden entfernt, mehrere Leerzeichen innen zu einem
  zusammengefasst.
- Der Name gilt, bis der Spieler auf **Spieler wechseln** drückt.

Game Over ohne Namensabfrage:

- Der Score wird am Ende der Runde **automatisch** unter dem Namen gespeichert (`POST /api/v1/highscores`
  wie heute). Das Backend behält wie bisher nur das beste Ergebnis pro Name, eine schlechte Runde schadet
  also nicht. „Nicht speichern“ entfällt.
- Der Game-Over-Screen zeigt Score und Platz und bietet **Nochmal** (Leertaste), **Spieler wechseln**
  (zurück zur Namenseingabe) und **Bestenliste** (zurück zum Startbildschirm).
- Schlägt das Speichern fehl, etwa weil das Backend nicht erreichbar ist, zeigt der Screen einen Hinweis und
  **Erneut versuchen**.
- `App.tsx`: Der `Screen`-Typ bekommt `'name'` und `'skin'`, außerdem hält `App` den aktuellen Spieler
  `{ name, skin }`.

### 2.4 Skin-Editor

```
┌──────────────────────────────────────────┐
│         WILLKOMMEN ZURÜCK, MOMO!         │
│                                          │
│                [ FIGUR ]                 │  ◄ Vorschau 4-fach, hüpft
│                                          │
│  ▶ KÖRPER    ■ ■ ■ ▣ ■ ■ ■ ■ ■ ■ ■ ■     │
│    T-SHIRT   ■ ■ ■ ■ ■ ▣ ■ ■ ■ ■ ■ ■     │
│    TENTAKEL  ■ ▣ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■     │  ◄ ▣ = gewählt
│    HUT       ◄ HEADSET ►                 │
│    BRILLE    ◄ KEINE ►                   │
│                                          │
│     ZUFALL     STANDARD     ▶ LOS ◀      │
└──────────────────────────────────────────┘
```

- Einstellbar sind drei Farben: **Körper**, **T-Shirt** und **Tentakel**. Je Teil gibt es 12 Farben aus der
  Spielpalette („Name und Stil“), aber keine freie Farbwahl. So passt jede Figur zu den Farben des Spiels.
- Zu jeder wählbaren Farbe gehört in der Palette ein fester dunklerer Partner für Schatten. Der Spieler wählt
  nur den Grundton.
- Vorschau: Die Figur ist 4-fach vergrößert und hüpft auf der Stelle. Alle paar Sekunden wechselt sie die
  Pose (springen, schießen, Fallschirm), damit man den Skin in jeder Lage sieht.
- **Vorauswahl:** der in der Datenbank gespeicherte Skin dieses Namens (2.5). Gibt es keinen, ist der
  Standard-Skin vorausgewählt und die Überschrift lautet `HALLO, MOMO!` statt `WILLKOMMEN ZURÜCK, MOMO!`.
- **Standard-Skin** = die heutige Figur: Körper hellgrün, T-Shirt dunkelgrün (heute die Streifen am Bauch),
  Tentakel dunkelgrau (heute die Beine), kein Hut, keine Brille.
- Dazu kommen zwei **Zubehörteile**, je mit „keiner/keine“ als erster Wahl:

  | Teil | Auswahl |
  |---|---|
  | Hut | keiner, Headset, Basecap, Zylinder, Partyhut, Bauhelm, Krone |
  | Brille | keine, Nerdbrille, Sonnenbrille, Monokel, VR-Brille |

  Zubehör hat feste Farben aus der Palette und wird nicht umgefärbt.
- **Zubehör ist nur Optik:** Hut und Brille vergrößern die Trefferbox nicht. Wer mit Zylinder spielt, hat
  also keinen Nachteil gegenüber einer Figur ohne Hut.
- **Zufall** würfelt alle Teile. Hut und Brille sind dabei jeweils in der Hälfte der Fälle „keiner/keine“,
  damit die Figur nicht immer überladen aussieht. **Standard** setzt auf den Standard-Skin zurück.
- Steuerung: ↑ ↓ wählt die Zeile, ← → die Farbe bzw. das Zubehör, Enter oder Leertaste = **Los**,
  R = Zufall. Mit der Maus geht alles ebenso.
- Mit **Los** wird der Skin gespeichert (2.5) und das Intro startet. Das Spiel wartet nicht auf die Antwort.
  Schlägt das Speichern fehl, spielt man trotzdem mit dem gewählten Skin, nur ist er beim nächsten Mal nicht
  vorausgewählt.

Darstellung im Spiel:

- Die Spieler-SVGs werden mit sechs Platzhalterfarben gezeichnet: je Teil ein Grundton und ein Schatten,
  z. B. Magenta und Dunkelmagenta für den Körper.
- `recolorSprites(svgs, skin)` in der neuen Datei `frontend/src/game/skin.ts` ersetzt diese Farben einmal
  pro Runde im SVG-Text (`fill`/`stroke`) und rastert das Ergebnis wie alle Sprites in Zielauflösung
  („Name und Stil“). `render.ts` zeichnet daraus, ein Umfärben pro Frame gibt es nicht.
- Umgefärbt wird im SVG und nicht im fertigen Bild: Durch die Kantenglättung haben die Randpixel
  Mischfarben, die ein Austausch einzelner Pixelfarben nicht erwischen würde.
- Hut und Brille sind eigene kleine Sprites. Für jede Pose des Spieler-Spritesheets (stehen, springen,
  schießen, fallen, Fallschirm, Tod) legt `skin.ts` einen Ankerpunkt am Kopf fest. `drawPlayer` zeichnet
  erst die Figur, dann die Brille und zuletzt den Hut an diesem Punkt, mit Blickrichtung und Drehung der
  Figur.
- Die Engine bleibt unverändert, der Skin betrifft nur die Darstellung.
- Steht in der Datenbank eine Farbe, die es in der Palette nicht mehr gibt, oder ein unbekanntes Zubehör,
  nimmt das Frontend für diesen Teil den Standard (Standardfarbe bzw. kein Zubehör).

### 2.5 Skin speichern (Backend)

Der Skin hängt am Spielernamen, genau wie der Highscore. Er wird aber schon vor der ersten Runde
gespeichert, also auch für Spieler ohne Highscore. Deshalb bekommt er eine eigene Tabelle statt neuer
Spalten in `highscore`.

Liquibase: neue Datei `changes/002-player-skin.xml` mit der Tabelle `player_skin`. Die bestehenden
Changesets bleiben unverändert.

| Spalte | Typ | Inhalt |
|---|---|---|
| `name` | `varchar(20)` | Primärschlüssel, normalisiert wie in `highscore` |
| `body_color` | `char(7)` | `#rrggbb` |
| `shirt_color` | `char(7)` | `#rrggbb` |
| `tentacle_color` | `char(7)` | `#rrggbb` |
| `hat` | `varchar(20)` | Kennung des Huts, z. B. `headset`, oder `none` |
| `glasses` | `varchar(20)` | Kennung der Brille, z. B. `sunglasses`, oder `none` |
| `updated_at` | `timestamp with time zone` | Zeitpunkt der letzten Änderung |

API:

| Methode | Pfad | Antwort |
|---|---|---|
| `GET` | `/api/v1/players/{name}/skin` | `200` mit `{ "body": "#cfe25b", "shirt": "#9fb53a", "tentacles": "#3b3a2f", "hat": "headset", "glasses": "none" }`, `404` wenn der Name keinen Skin hat |
| `PUT` | `/api/v1/players/{name}/skin` | Legt den Skin an oder überschreibt ihn, `200` mit dem gespeicherten Skin |

- Der Name steht URL-codiert im Pfad (`encodeURIComponent`), Leerzeichen sind erlaubt.
- Validierung: Name wie in `SubmitScoreRequest` (nicht leer, höchstens 20 Zeichen), Farben per
  `@Pattern("^#[0-9a-f]{6}$")`, Hut und Brille per `@Pattern("^[a-z0-9-]{1,20}$")`. Palette und Liste der
  Zubehörteile kennt nur das Frontend. So braucht ein neuer Hut keine Backend-Änderung.
- `HighscoreService.normalizeName` wird zu einer gemeinsamen Hilfsklasse `PlayerName`. So ist „Max␣␣“ in
  beiden Tabellen derselbe Spieler.
- Schichten wie beim Highscore: `PlayerSkin` (Record), `PlayerSkinService`, `PlayerSkinRepository` mit
  `JdbcClient` und `INSERT … ON CONFLICT (name) DO UPDATE` (wie `saveIfBetter`), `PlayerController` mit DTOs.
- Kein Login: Wer einen Namen eintippt, kann dessen Skin ändern, so wie man heute schon unter jedem Namen
  Scores einreichen kann. Für ein internes Spiel ist das bewusst akzeptiert.
- Tests: anlegen und überschreiben, `404` bei unbekanntem Namen, Normalisierung (`"Max  "` findet `"Max"`)
  und `400` bei ungültigen Farben oder Zubehör-Kennungen. Für die Bestenliste: Einträge mit und ohne Skin
  (`skin: null`). Dazu ein Integrationstest analog zu `HighscoreApiIntegrationTest`.

## 3. Leben, Schaden und Fallschirm

### 3.1 Regeln

| Ereignis | Leben > 1 | Letztes Leben |
|---|---|---|
| Seitlich oder von unten gegen ein Monster | −1 Herz, kurzer Rückstoß, 2 s unverwundbar (Spieler blinkt), Monster bleibt | −1 Herz → 0: Todesanimation, Game Over |
| Von oben auf ein Monster springen | Monster stirbt, +Bonus (unverändert) | wie links |
| Von einem Monster-Geschoss getroffen (ab Zone 4, Development) | −1 Herz, wie Monsterkontakt | wie Monsterkontakt |
| Auf einer Stachelplattform landen (ab Zone 5, Operations, siehe 4.4) | −1 Herz, normaler Absprung nach oben, 2 s unverwundbar | −1 Herz → 0: Todesanimation, Game Over |
| Unten aus dem Bild fallen | −1 Herz, **Fallschirm öffnet sich**, Landung weiter unten | −1 Herz → 0: Fallschirm öffnet nicht, Game Over |
| Herz einsammeln | +1 Herz (max. 3) | +1 Herz |

Während des Raketenrucksack-Flugs (5.4) ist der Spieler unverwundbar.

Der Spieler startet mit 3 Herzen. Bei 0 Herzen stirbt er. Die Punkte bleiben in jedem Fall erhalten,
denn der Score hängt an der maximal erreichten Höhe.

### 3.2 Ablauf Fallschirm

1. Der Spieler fällt unter den unteren Bildrand → Herz weg, Sound „Fallschirm auf“.
2. Die Kamera folgt ihm erstmals **nach unten** (heute bewegt sie sich nur nach oben).
3. Der Spieler gleitet langsam (ca. 120 px/s) und ist dabei mit ← → steuerbar, aber kann nicht springen
   und nicht schießen.
4. Nach `PARACHUTE_DROP = 30 m` unter dem unteren Bildrand liegt eine **Rettungsplattform**
   (breit, garantiert erreichbar). Die Landung dauert etwa 2,5 s.
5. Landung → Fallschirm weg, Sound „Landung“, 1 s Unverwundbarkeit, weiter geht's.

Insgesamt verliert der Spieler also eine Bildschirmhöhe (60 m) plus 30 m, muss diese Strecke neu klettern
und hat ein Herz weniger. Das ist eine spürbare, aber faire Strafe.

### 3.3 Auswirkungen auf die Engine

- `GameState` bekommt `lives`, `invulnerable` (Restsekunden), `parachute: boolean` und `bonus` (Punkte aus
  Power-ups, siehe unten).
- `player.hit` (heute: Steuerung aus, Spieler fällt) bleibt nur für den Tod mit dem letzten Herz.
- Die Plattformen unterhalb des Bildes werden heute gelöscht (`removeBelowScreen`). Beim Fallschirm wird
  der Bereich zwischen Rettungsplattform und altem Bildrand neu erzeugt. Dafür wird die Generierung
  aus `generatePlatforms` so herausgelöst, dass sie einen Höhenbereich füllen kann
  (`fillRange(state, fromY, toY)`). Dieser Bereich bekommt keine Monster und keine Stachelplattformen, damit der
  Spieler nicht direkt nach der Landung wieder getroffen wird. Ein Raketenrucksack entsteht dort auch nicht.
- `state.over` wird erst bei 0 Herzen gesetzt.
- Die Kamera-Invariante „bewegt sich nur nach oben“ gilt künftig außer während des Fallschirm-Flugs und
  des Intros (3.4).

### 3.4 Intro: Fallschirm-Abstieg zum Rundenstart

Jede Runde beginnt mit einer kurzen Animation. Der Spieler startet ganz oben in der obersten Zone und
schwebt am Fallschirm durch alle Zonen hinunter bis auf 0 m. Erst nach der Landung beginnt das eigentliche
Spiel. So sieht man gleich zu Beginn, was einen weiter oben erwartet.

Ablauf:

1. Klick auf **Los** im Skin-Editor (2.4) oder **Nochmal** nach Game Over → Sound „Insert Coin“. Der
   Spieler hängt mit offenem Fallschirm bei
   `INTRO_START = 7100 m` im Chefsessel (Zone 8).
2. Die Kamera folgt ihm nach unten durch alle Zonen. Die Hintergründe blenden wie beim Aufstieg weich
   ineinander über (4.1). An jeder Zonengrenze erscheint das Banner der Zone für etwa 1 s statt 2 s und ohne
   Fanfare. So bleibt bei 8 Zonen jeder Name lesbar.
3. Der Abstieg dauert `INTRO_DURATION = 10 s`, ist also viel schneller als der Fallschirm aus 3.2 (mit
   120 px/s wären es fast 10 Minuten). Die Kamera beschleunigt am Anfang und bremst am Ende
   (Ease-in-out). So sind oben der Chefsessel und unten die Landung gut zu sehen. Die Spielfigur pendelt
   leicht am Schirm.
4. Unterwegs gibt es keine Plattformen und keine Monster, nur Hintergründe. Die Welt oberhalb des
   Startbereichs entsteht erst beim Klettern per Zufall, im Intro gezeigte Plattformen wären später also
   nicht mehr da. Sichtbar sind nur die Plattformen von Zone 1, die `createGame` schon heute erzeugt.
5. Landung auf der Startplattform bei 0 m → Fallschirm weg, Sound „Landung“, kurz `GO!` in der Bildmitte.
   Ab jetzt reagiert die Spielfigur auf Eingaben.

Regeln während des Intros:

- Keine Steuerung, kein Springen, kein Schießen. Der Spieler ist unverwundbar.
- Der Score bleibt `000000`. `maxHeight` wird erst nach der Landung fortgeschrieben, sonst brächte der
  Abstieg 7100 geschenkte Punkte.
- Score und Herzen stehen schon im HUD, der Höhenmeter zählt sichtbar von 7100 m auf 0 m herunter.
- **Überspringen:** Leertaste oder Enter überspringt das Intro und springt zur letzten Sekunde, also direkt
  zur Landung mit `GO!`. Wer oft neu startet, muss so nicht jedes Mal 10 s warten. Unten im Bild steht
  während des Intros klein und blinkend `SPACE ▶ SKIP`.
  - Es zählt nur ein **neuer** Tastendruck (`event.repeat === false`). Wer die Runde mit der Leertaste
    startet und sie gedrückt hält, überspringt das Intro sonst ungewollt durch die automatische
    Tastenwiederholung.
  - Nach dem Intro zählt die Leertaste erst als Sprung, wenn sie einmal losgelassen wurde. Sonst springt
    der Spieler direkt nach der Landung ungewollt los.

Auswirkungen auf die Engine:

- `GameState` bekommt `phase: 'intro' | 'playing'` und `introTime` (Sekunden seit Rundenstart).
- `update` arbeitet in `'intro'` nur die Zeitleiste ab: `cameraY` ergibt sich aus `introCameraY(introTime)`
  (Ease-in-out von 7100 m bis zur Startposition `cameraY = 0`), der Spieler hängt mittig im Bild. Keine
  Physik, keine Eingaben, keine Score-Berechnung.
- `generatePlatforms` und `removeBelowScreen` laufen im Intro **nicht**. Beide richten sich nach `cameraY`:
  das eine würde die Welt bis 7100 m erzeugen, das andere die Plattformen von Zone 1 löschen.
- Nach `INTRO_DURATION` wechselt `phase` auf `'playing'`. Ab dann ist der Zustand derselbe wie heute direkt
  nach `createGame`, der Spieler steht auf der Startplattform.
- `Input` bekommt `skip: boolean`, einmalig wie `fire` (der Aufrufer setzt es nach `update` zurück).
  `GameScreen` setzt es bei Leertaste/Enter ohne `event.repeat`. Im Intro setzt `skip` die Zeit auf
  `max(introTime, INTRO_DURATION - 1)`, die Kamera springt also auf die Höhe der letzten Sekunde.
- Die Sprungsperre steckt in der Engine, damit sie testbar ist: `GameState.jumpLocked` wird beim Wechsel
  auf `'playing'` gesetzt, solange `input.jump` gedrückt ist, und erst gelöscht, wenn `input.jump` einmal
  `false` war.
- Ereignisse für den Sound (6.3): `introStart`, `introZone` (Banner) und `introLand`.
- Die Zonenhintergründe (4.1) hängen nur an der Kamerahöhe und funktionieren deshalb auch beim Abstieg.
- Tests: Nach `INTRO_DURATION` gilt `phase === 'playing'`, `cameraY === 0`, `score === 0` und
  `maxHeight === 0`. Eingaben außer `skip` ändern während des Intros nichts. Es entstehen keine Plattformen
  oberhalb des Startbereichs. `skip` führt nach höchstens 1 s zu `'playing'`. Eine Leertaste, die über die
  Landung hinaus gedrückt bleibt, löst keinen Sprung aus.

## 4. Zonen: Höhe macht das Spiel schwerer

Alle 1000 Höhenmeter beginnt eine neue Zone. Die Zonen sind nach den Abteilungen benannt: Man steigt von der
Hotline ganz unten bis in den Chefsessel auf. Jede Zone hat einen eigenen Hintergrund, eigene Musik und ein
eigenes Aussehen für die Monster. Die Zonen 1–4 bringen außerdem neue Plattformtypen und neues
Monster-Verhalten, ab Zone 5 kommen Stachelplattformen dazu. Innerhalb einer Zone steigt die Schwierigkeit weiter an, beim Zonenwechsel gibt es einen
deutlichen Sprung.

### 4.1 Zonenübersicht

| # | Name | Höhe | Hintergrund (Ziel, später) | Neue Plattformen | Monster (Aussehen · Verhalten) | Musik |
|---|---|---|---|---|---|---|
| 1 | Hotline | 0–1000 m | Großraumbüro mit Headsets, Post-its und Notizblock-Raster | normal, bewegt, brechend, Feder | **Klingelndes Telefon** · wackelt auf der Stelle (der heutige Blob), ab 150 m, selten | Warteschleifen-Melodie, fröhlich, 120 BPM |
| 2 | Professional Service | 1000–2000 m | Unterwegs zum Kunden: Autobahn, Bahnhof, Kundenbüro, mit Parallaxe | **verschwindend** (trägt nur einmal) | Telefon, **Papierflieger mit Änderungswunsch** · fliegt quer durchs Bild | Reisetempo, 130 BPM |
| 3 | Projektmanagement | 2000–3000 m | Whiteboards, Gantt-Diagramme, Kanban-Wand | **zerbröselnd** (bricht 1 s nach Landung), **vertikal bewegt** | Papierflieger, **Deadline-Uhr** · folgt dem Spieler langsam, 2 Treffer | Treibend, Moll, 140 BPM |
| 4 | Development | 3000–4000 m | Dunkler Editor, scrollender Code, blinkender Terminal-Cursor | **kurze** Plattformen (48 px), schneller bewegt | Deadline-Uhr, **Bug** (Käfer) · schießt Exceptions nach unten | Synth, 145 BPM |
| 5 | Operations | 4000–5000 m | Rechenzentrum: Serverracks, blinkende LEDs, Kabelstränge | Mix aller Typen, **Stachelplattform** (−1 Herz bei Landung) | Alle vier Verhalten im Operations-Look, z. B. **Alarm-Pager** statt Telefon | Pulsierend, 150 BPM |
| 6 | Vertrieb | 5000–6000 m | Messestand, Umsatzkurven, Pokalvitrine | Mix aller Typen inkl. Stacheln | Alle vier im Vertriebs-Look, z. B. **Quartalsziel** statt Deadline-Uhr | Upbeat, 155 BPM |
| 7 | Produktmanagement | 6000–7000 m | Roadmap-Wand, Post-it-Cluster, Persona-Steckbriefe | Mix aller Typen inkl. Stacheln | Alle vier im Produkt-Look, z. B. **Feature-Request** statt Papierflieger | Hektisch, 160 BPM |
| 8 | Chefsessel | ab 7000 m (endlos) | Vorstandsetage über der Skyline, Holz und Gold. Im Hintergrund schwebt der Ledersessel, immer knapp außer Reichweite | Mix aller Typen inkl. Stacheln, dichter | Alle vier im Chef-Look, dichter | Triumphal, 165 BPM |

Die Zonen 5–8 bringen außer den Stachelplattformen (4.4) keine neue Spielmechanik, sondern ein neues
Aussehen. Schwerer werden sie über die Werte in 4.2.

**Hintergründe zunächst als Platzhalter:** Die Motive in der Tabelle sind das Ziel für später. Bis die Bilder
fertig sind, ist jeder Zonenhintergrund eine einzige, flächige Farbe:

| # | Zone | Platzhalterfarbe | Gedanke dahinter |
|---|---|---|---|
| 1 | Hotline | `#f8f4e6` Papier-Beige | Wie heute das karierte Papier, nur ohne Raster |
| 2 | Professional Service | `#a8d8ea` Hellblau | Himmel auf dem Weg zum Kunden |
| 3 | Projektmanagement | `#ffd6a5` Apricot | Post-it-Wand |
| 4 | Development | `#1e1e2e` Fast-Schwarz | Dunkler Editor |
| 5 | Operations | `#34495e` Schiefergrau | Serverraum |
| 6 | Vertrieb | `#e8b04a` Ocker-Gold | Pokale, Umsatz |
| 7 | Produktmanagement | `#8e7cc3` Lila | Roadmap-Wand |
| 8 | Chefsessel | `#4a2c1a` Dunkles Holz | Vorstandsetage |

- Die Farben stehen als Feld `background` im jeweiligen Eintrag von `ZONES`. `render.ts` füllt das Canvas
  damit (`fillRect`) statt `drawPaper` aufzurufen. Der Übergang zwischen den Zonen (siehe unten) ist dann
  einfach eine Farbinterpolation.
- Werte sind Startwerte und werden beim Festlegen der Palette („Name und Stil“) auf die nächste
  Palettenfarbe gesetzt. Beim Testen prüfen, dass Plattformen, Monster und Spieler auf jeder Farbe gut zu
  sehen sind (z. B. braune Plattformen auf dem dunklen Holz des Chefsessels).
- Später ersetzt pro Zone ein Bild die Farbe. Die Farbe bleibt als Grundton darunter und für den
  Übergang erhalten, sodass Zonen ohne fertiges Bild weiter funktionieren.

Zonenwechsel:

- Hintergrund blendet über ca. 20 m weich über (Farben interpolieren), kein harter Schnitt.
- Banner in der Bildmitte für 2 s, dazu eine kurze Fanfare. Das Banner ist zweizeilig: `ZONE 2`, darunter
  `PROFESSIONAL SERVICE`. Einzeilig wäre der längste Name in der kleinsten Schriftgröße breiter als das
  Spielfeld (29 Zeichen × 16 = 464 Weltpixel bei 400 Weltpixel Breite).
- Musik blendet in 2 s auf den neuen Track über.

### 4.2 Schwierigkeit pro Zone (Startwerte zum Feintuning)

Heute rechnet `difficulty()` eine Zahl von 0 bis 1 aus der Höhe. Künftig liefert eine Tabelle
`ZONES` pro Zone die Parameter, innerhalb der Zone wird zwischen Anfangs- und Endwert interpoliert.

| Parameter | 1 Hotline | 2 Prof. Service | 3 Projektmgmt. | 4 Development | 5 Operations | 6 Vertrieb | 7 Produktmgmt. | 8 Chefsessel (ab 7000 m) | Obergrenze (ab 8000 m) |
|---|---|---|---|---|---|---|---|---|---|
| Plattformabstand (px) | 40–90 | 55–110 | 70–125 | 80–135 | 90–145 | 95–155 | 100–160 | 105–165 | 110–170 |
| Anteil bewegte Plattformen | 10 % | 15 % | 20 % | 30 % | 35 % | 40 % | 45 % | 50 % | 60 % |
| Tempo bewegte Plattformen (px/s) | 90 | 110 | 130 | 150 | 170 | 180 | 190 | 200 | 230 |
| Feder-Chance | 6 % | 5 % | 5 % | 4 % | 4 % | 3 % | 3 % | 3 % | 3 % |
| Anteil Spezialplattformen | – | 15 % | 20 % | 25 % | 25 % | 30 % | 30 % | 30 % | 35 % |
| Monster-Chance pro Plattform | 4 % | 6 % | 8 % | 11 % | 13 % | 15 % | 17 % | 19 % | 22 % |
| Anteil Stachelplattformen an den Ködern | – | – | – | – | 30 % | 40 % | 50 % | 55 % | 60 % |

Der Bonus hängt am Verhalten, nicht an der Zone: Wackler 50, Flieger 75, Verfolger 100, Schütze 150.

**Der Chefsessel ist endlos:** Von 7000 m bis 8000 m steigen die Werte linear auf die Obergrenze, danach
bleiben sie konstant. Das Spiel wird dort nicht mehr schwerer, sondern nur noch länger. So bleibt es
schaffbar, und die Highscores entscheiden sich über Ausdauer und Fehlerfreiheit.

**Offen: Tempo.** Der bisher einzige Highscore liegt bei 327 Punkten, also bei höchstens 327 m. Mit 1000 m
pro Zone kämen viele Runden nicht über die Hotline hinaus, und Zone 8 wäre kaum erreichbar. Beim Testen
klären, ob das so gewollt ist (die Zonen als Langzeitziel, das Intro zeigt sie ja trotzdem) oder ob die
Meter schneller zählen sollen, z. B. 5 px = 1 m statt 10 px.

Feste Regel, damit das Spiel immer schaffbar bleibt: Die „Kette“ aus erreichbaren Plattformen hält immer
`MAX_GAP` (170 px) ein, auch an der Obergrenze. Brechende Plattformen und Stachelplattformen bleiben
reine Köder. Verschwindende
und zerbröselnde Plattformen dürfen Teil der Kette sein, weil sie einmal tragen. Die bestehenden
Erreichbarkeits-Tests in `engine.test.ts` werden pro Zone und an der Obergrenze ausgeführt.

### 4.3 Monster-Modell

`Monster` bekommt die Felder `kind` für das Verhalten (`'wobbler' | 'flyer' | 'chaser' | 'shooter'`),
`skin` für das Aussehen und `hp`. Das Verhalten bestimmt Bewegungsfunktion, Größe und Bonus. Das Aussehen
hängt von der Zone ab, in der das Monster erzeugt wird (Eintrag in `ZONES`). Damit brauchen die Zonen 5–8
nur neue Sprites und keinen neuen Code. Schüsse ziehen 1 HP ab, ein Sprung von oben tötet immer, das ist
die Arcade-Belohnung für Mut. Die Geschosse des Schützen (im Development der Bug mit seinen Exceptions)
werden als eigene Liste `enemyBullets` geführt.

### 4.4 Stachelplattformen

Ab Zone 5 (Operations) gibt es Plattformen mit Stacheln auf der Oberseite. Wer darauf landet, verliert ein
Herz. Sie machen die schweren Zonen gefährlicher, ohne neue Monster zu brauchen.

- **Typ:** `PlatformKind` bekommt `'spiked'`. Stachelplattformen bewegen sich nicht und haben keine Feder.
- **Landung von oben:** −1 Herz wie bei Monsterkontakt (3.1), Sound „Pieks“. Der Spieler springt normal ab
  (`JUMP_VELOCITY`), bleibt also nicht auf den Stacheln hängen, und ist 2 s unverwundbar. Landet er in
  dieser Zeit erneut auf Stacheln, ist das ein normaler Sprung ohne Schaden.
- **Von unten und von der Seite** sind sie harmlos. Man springt hindurch wie bei jeder Plattform.
- **Erzeugung:** Sie ersetzen einen Teil der heutigen Köder-Plattformen zwischen zwei Kettenplattformen
  (heute nur brechend, `generatePlatforms`). Der Anteil steht in `ZONES` (4.2), der Rest bleibt brechend.
- **Fairness:** Eine Stachelplattform überlappt horizontal nie mit ihren beiden Nachbarn aus der
  Kette, dazwischen bleiben seitlich mindestens `PLAYER_WIDTH` frei. Sonst landet ein Spieler, der auf der
  Kettenplattform darunter auf und ab hüpft, zwangsläufig auf den Stacheln. Ist einer der beiden Nachbarn
  eine bewegte Plattform, entsteht an dieser Stelle keine Stachelplattform, sondern eine brechende.
- **Ausnahmen:** keine Stachelplattformen im Fallschirm-Bereich (3.3) und während des Raketenrucksacks
  keine Kollision (5.4).
- **Platzhalter**, bis das Sprite fertig ist: dunkelgraue Plattform (`#4a4a4a`) mit einer Reihe roter
  Dreiecke (`#e63946`, 6 px hoch) auf der Oberseite. Die Stacheln zählen nicht zur Trefferbox, geprüft
  wird wie bei jeder Plattform die Oberkante.
- **Tests:** Landung auf Stacheln kostet ein Herz und löst einen Sprung aus, unverwundbar kostet sie nichts,
  von unten passiert nichts. Für jede Zone und an der Obergrenze: keine Stachelplattform in der Kette und
  keine horizontale Überlappung mit ihren Kettennachbarn.

## 5. Power-ups

### 5.1 Allgemeines Konzept

Power-ups liegen schwebend über Plattformen der Kette, sind also immer erreichbar. Eingesammelt werden sie
durch Berührung. Es gibt zwei Arten:

| Art | Wirkung | Power-ups |
|---|---|---|
| Sofort | Wirkt beim Einsammeln einmalig | Herz (5.2), Punkte (5.3) |
| Mit Dauer | Wirkt für einige Sekunden, Restzeit als Balken unter den Herzen | Raketenrucksack (5.4); später weitere (siehe Abschnitt 9) |

Datenmodell:

```ts
export type PowerUpKind = 'heart' | 'points' | 'jetpack';

export interface PowerUp {
  id: number;
  kind: PowerUpKind;
  x: number;
  y: number;
  /** Motiv aus der Zone, in der das Power-up entstanden ist (nur 'points'). */
  skin?: string;
}
```

Erzeugt werden Power-ups in `generatePlatforms`, eingesammelt in einer neuen Funktion
`collectPowerUps(state)`. Jeder neue Typ braucht nur einen Eintrag in einer Tabelle (Größe, Spawn-Chance,
Mindestabstand, Wirkung, Ereignis für den Sound), keine Änderung an der Spielschleife. Pro Kettenplattform
entsteht höchstens ein Power-up. Die Prüfung läuft in der Reihenfolge Raketenrucksack, Herz, Punkte, damit
das seltene Power-up nicht vom häufigen verdrängt wird.

Übersicht (Startwerte):

| Power-up | Wirkung | Chance pro Kettenplattform | Mindestabstand | Ab Höhe |
|---|---|---|---|---|
| Herz | +1 Herz, bei vollen Leben +100 Punkte | 0,5–3 % (siehe 5.2) | 80 m | 0 m |
| Punkte | +200 Punkte | 2 % | 30 m | 0 m |
| Raketenrucksack | 3 s Flug nach oben | 0,4 % | 500 m | 300 m |

### 5.2 Herz

- Wirkung: +1 Herz, maximal 3.
- **Herzen erscheinen auch bei vollen Leben.** Dann gibt es stattdessen **+100 Punkte** (Score-Popup), so ist
  ein Herz nie wertlos. Der Score wird dafür zu `Höhe / 10 + Kills-Bonus + bonus`.
- Spawn: auf einer Plattform der Kette, mindestens 80 m Abstand zum letzten Herz. Die Chance hängt davon ab,
  wie viele Herzen fehlen:

  | Fehlende Herzen | Chance pro Plattform |
  |---|---|
  | 0 | 0,5 % |
  | 1 | 1,5 % |
  | 2 | 3 % |

  So bekommt ein angeschlagener Spieler eher eine zweite Chance, ohne dass es geschenkt wirkt.
- Darstellung: rotes Herz, wippt leicht auf und ab und glitzert, damit es auch auf dunklen Hintergründen
  (Development, Operations) gut zu sehen ist.

### 5.3 Punkte

- Wirkung: **+200 Punkte** auf `bonus`, mit Score-Popup `+200` und Puls des Scores (1.1). Der Wert ist in
  allen Zonen gleich und steht als Startwert im Eintrag `points` der Power-up-Tabelle.
- Spawn: 2 % pro Kettenplattform, mindestens 30 m Abstand zum letzten Punkte-Power-up. Es ist damit das
  häufigste Power-up und belohnt Spieler, die nicht nur stur nach oben springen.
- **Jede Zone hat ein eigenes Motiv.** Es hängt wie beim Monster (4.3) an der Zone, in der das Power-up
  entsteht (`skin` aus `ZONES`). Die Wirkung ist überall gleich.
- **Zunächst nur Platzhalter:** ein Kreis mit 24 Weltpixeln Durchmesser in der Platzhalterfarbe der Zone,
  2 px dunkle Kontur (`#1a1a1a`) und die Zonennummer in der Mitte in Arcade-Schrift. Er wippt wie das Herz.
  So lässt sich das Spiel komplett testen, bevor die Motive gezeichnet sind. Ein fertiges Sprite ersetzt
  später den Kreis. Fehlt das Sprite für eine Zone, bleibt dort der Platzhalter.

  | # | Zone | Motiv (Ziel, später) | `skin` | Platzhalterfarbe |
  |---|---|---|---|---|
  | 1 | Hotline | Gelöstes Ticket mit grünem Haken | `ticket` | `#2a9d8f` Petrol |
  | 2 | Professional Service | Unterschriebenes Abnahmeprotokoll | `acceptance` | `#e76f51` Orange-Rot |
  | 3 | Projektmanagement | Meilenstein-Fähnchen | `milestone` | `#6a4c93` Violett |
  | 4 | Development | Grüner Build (Haken im Terminal) | `green-build` | `#50fa7b` Neongrün |
  | 5 | Operations | Status-LED „99,9 % Uptime“ | `uptime` | `#f1c40f` Gelb |
  | 6 | Vertrieb | Unterschriebener Vertrag mit Münze | `contract` | `#1d3557` Marineblau |
  | 7 | Produktmanagement | Glühbirne (gute Idee) | `idea` | `#fefae0` Cremeweiß |
  | 8 | Chefsessel | Bonus-Scheck | `bonus-check` | `#ffd700` Gold |

  Die Platzhalterfarben heben sich vom Platzhalter-Hintergrund der jeweiligen Zone (4.1) ab. Beim
  Festlegen der Palette („Name und Stil“) werden sie wie die Hintergrundfarben auf die nächste
  Palettenfarbe gesetzt.
- `ZONES` bekommt dafür die Felder `pointsSkin` und `pointsColor`.

### 5.4 Raketenrucksack

Der Raketenrucksack schießt den Spieler ein gutes Stück nach oben. Er ist selten und deshalb ein Highlight.

- **Wirkung:** `JETPACK_DURATION = 3 s` Flug mit fester Geschwindigkeit `JETPACK_SPEED = 900 px/s` nach
  oben, also rund 270 m. Die Höhe zählt wie beim Klettern in den Score, extra Punkte gibt es nicht.
- **Während des Flugs:**
  - ← → steuern wie gewohnt, Umlaufen am Rand bleibt.
  - Kein Springen, kein Schießen, keine Landung auf Plattformen.
  - Unverwundbar: Monster, Geschosse und Stacheln haben keine Wirkung, der Spieler fliegt hindurch.
  - Herzen und Punkte werden im Vorbeiflug eingesammelt.
  - Die Restzeit läuft als Balken unter den Herzen ab.
- **Ende:** In der letzten 0,75 s stottert die Flamme (Warnung). Danach fällt der Rucksack ab, der Spieler
  bekommt `vy = -JUMP_VELOCITY` und 1 s Unverwundbarkeit, damit er sicher auf der Kette landen kann.
- **Spawn:** ab 300 m, 0,4 % pro Kettenplattform, mindestens 500 m Abstand zum letzten Raketenrucksack.
  Nicht im Fallschirm-Bereich (3.3) und nicht im Intro.
- **Engine:** `GameState` bekommt `jetpack` (Restsekunden, 0 = aus). Solange `jetpack > 0`, überspringt
  `update` Schwerkraft, Plattform- und Schadenskollision und setzt `vy = -JETPACK_SPEED`. Die Welt wird über
  `generatePlatforms` wie gewohnt nachgeneriert, weil sie nur an `cameraY` hängt. Ereignisse:
  `jetpackStart`, `jetpackSputter`, `jetpackEnd`.
- **Darstellung:** Der Rucksack hängt hinter der Figur, die Flamme flackert darunter. Hut und Brille (2.4)
  bleiben sichtbar.
- **Platzhalter**, bis das Sprite fertig ist: als Power-up ein graues Rechteck (`#7f8c8d`, 18 × 26 px) mit
  orangem Dreieck darunter (`#f39c12`), im Flug dasselbe Rechteck hinter der Figur und ein flackerndes
  Dreieck als Flamme.
- **Tests:** Einsammeln startet den Flug, nach 3 s ist `jetpack === 0` und `vy === -JUMP_VELOCITY`. Während
  des Flugs kosten Monster, Geschosse und Stacheln kein Herz. Ein Spieler im Fallschirm-Flug findet keinen
  Raketenrucksack im neu erzeugten Bereich. Die Erreichbarkeit der Kette ist nach dem Flug gegeben.

## 6. Sound

Sound ist für das Spielgefühl zentral. Jede Aktion des Spielers und jedes wichtige Ereignis bekommt einen
eigenen, kurzen 8-Bit-Retro-Effekt, dazu ein Chiptune-Loop pro Zone (Klangvorgaben siehe „Name und Stil“).

### 6.1 Soundliste

| Ereignis | Sound | Hinweis |
|---|---|---|
| Sprung | kurzes „Bloop“ aufwärts | Häufigster Sound: leise, leicht variierte Tonhöhe, damit er nicht nervt |
| Feder | „Boing“ | |
| Schuss | „Pew“ | |
| Monster durch Schuss getroffen (nicht tot) | „Tock“ | |
| Monster stirbt durch Schuss | Explosion/„Puff“ | |
| Monster stirbt durch Draufspringen | „Squash“ | |
| Spieler getroffen (Herz weg) | „Autsch“ + tiefer Ton | Dazu roter Bildschirmblitz |
| Herunterfallen | fallendes Pfeifen | Beginnt, wenn der Spieler unter den Bildrand fällt |
| Fallschirm öffnet sich | „Fwump“ (Stoff) | |
| Fallschirm-Landung | weiches „Tapp“ | |
| Brechende Plattform | „Krack“ | |
| Verschwindende Plattform | „Plopp“ | |
| Herz eingesammelt | aufsteigendes Arpeggio | |
| Herz bei vollen Leben (+100) | Münz-„Kling“ | |
| Punkte-Power-up (+200) | heller Doppel-„Kling“ | Gleicher Klang in allen Zonen, damit man ihn wiedererkennt |
| Raketenrucksack zündet | „Wusch“, dann Düsenrauschen als Loop | Loop endet mit dem Flug |
| Raketenrucksack stottert | „Puff-puff“ | Letzte 0,75 s |
| Raketenrucksack fällt ab | kurzes „Klonk“ | |
| Landung auf Stacheln | „Pieks“ + „Autsch“ | Dazu roter Bildschirmblitz wie bei jedem Treffer |
| Letztes Herz | Warnpiep, dreimal direkt nach dem Verlust | Danach nur noch das pulsierende Herz |
| Platz überholt (`NEXT` springt weiter) | kurzes „Ding-Ding“ | |
| Monster taucht auf | eigenes Geräusch je Typ, z. B. Telefonklingeln, Papierrascheln, Ticken, Summen | Warnt, bevor das Monster im Bild ist |
| Bug schießt eine Exception | „Zapp“ | |
| Zonenwechsel | Fanfare (1–2 s) | |
| Tod / Game Over | absteigende Melodie | Musik bricht vorher ab |
| Neuer Highscore | Jubel-Jingle | Auf dem Game-Over-Screen |
| Spielstart | „Insert Coin“ | Beim Klick auf Los (Skin-Editor) oder Nochmal |
| Intro-Abstieg | leises Windrauschen | Keine Musik, bis `GO!` erscheint |
| Landung nach dem Intro | „Tapp“ + kurzer `GO!`-Jingle | Danach startet die Musik von Zone 1 |
| Menü-Navigation | kurzer Klick | |

### 6.2 Musik

- Ein Loop pro Zone (siehe Zonentabelle), Crossfade 2 s beim Zonenwechsel.
- Während des Fallschirm-Flugs wird die Musik leiser und gedämpft (Tiefpass), danach wieder normal.
- Im Intro (3.4) läuft keine Zonenmusik, nur Windrauschen. Die Musik von Zone 1 setzt mit `GO!` ein.
- Auf Highscore- und Game-Over-Screen läuft ein eigener ruhiger Titel-Loop.

### 6.3 Technik

- **Engine bleibt ohne Sound.** `update` legt stattdessen Ereignisse in `state.events` ab
  (`{ type: 'jump' }`, `{ type: 'zoneEnter', zone: 2 }`, …). `GameScreen` reicht sie nach jedem Frame an
  einen `SoundManager` weiter und leert die Liste. Vorteil: Die Engine bleibt ohne DOM testbar, und die
  Tests können prüfen, dass z. B. beim Landen auf einer Feder genau ein `spring`-Ereignis entsteht.
- `SoundManager` (neue Datei `frontend/src/audio/sound.ts`) nutzt die Web Audio API: alle Effekte beim
  Start einmal laden und dekodieren, dann ohne Verzögerung abspielen, auch mehrfach gleichzeitig.
- Browser erlauben Audio erst nach einer Nutzeraktion: Der `AudioContext` wird beim Klick auf **Play**
  (bzw. Leertaste) gestartet.
- Stumm schalten mit Taste **M**, Lautstärke für Musik und Effekte getrennt, gespeichert in `localStorage`.
  Ein kleines Lautsprecher-Symbol im HUD zeigt den Zustand.
- Dateien in `frontend/public/sounds/` und `frontend/public/music/`, Format `.mp3` (läuft in allen
  Browsern). Sie kommen vom eigenen Server, die CSP (`default-src 'self'`) erlaubt das ohne Änderung.
- Herkunft: Effekte selbst erzeugen mit **jsfxr** (sfxr.me, Ergebnis gehört uns), Musik selbst bauen mit
  **BeepBox** (nur Chip-Instrumente) oder CC0-Chiptunes von OpenGameArt. Lizenzen und Quellen von Sounds,
  Musik und Sprites in `docs/CREDITS.md` festhalten.

## 7. Umsetzung in Etappen

Jede Etappe ist für sich spielbar und kann einzeln gemergt werden.

| # | Inhalt | Wichtigste Dateien |
|---|---|---|
| 1 | Name imp@jump mit Untertitel, Rendering in zwei Ebenen (Pixel-Hintergrund im Offscreen-Canvas, scharfe SVG-Sprites für Spieler, Plattformen, Telefon), Palette, Arcade-HUD (Score mittig, `HI`/`NEXT`, Höhenmeter), Arcade-Schrift, Highscore-Liste in `App.tsx`, Scoreboard mit 10 festen Plätzen, Game-Over im Arcade-Stil | `index.html`, `App.tsx`, `render.ts`, `GameScreen.tsx`, `HighscoreScreen.tsx`, `GameOverScreen.tsx`, `theme.ts`, neu `public/sprites/` |
| 2 | 3 Leben, Unverwundbarkeit, Fallschirm, Herz-Power-up, Herzen im HUD | `engine.ts`, `engine.test.ts`, `render.ts` |
| 3 | Ereignis-System und alle Soundeffekte, Stummschalten | `engine.ts`, neu `audio/sound.ts`, `GameScreen.tsx`, `public/sounds/` |
| 4 | Zonen: Tabelle `ZONES` inkl. Obergrenze, Platzhalterfarben als Hintergrund, Musik, Banner; Intro-Abstieg durch alle Zonen (3.4); Punkte-Power-up mit Platzhalter je Zone (5.3) | `engine.ts`, `engine.test.ts`, `render.ts`, `audio/sound.ts`, `public/music/` |
| 5 | Neue Plattformtypen inkl. Stachelplattformen, Monster-Verhalten und Monster-Looks je Zone, Monster-Geschosse, Raketenrucksack mit Restzeit-Balken | `engine.ts`, `engine.test.ts`, `render.ts` |
| 6 | Name am Anfang, Skin-Editor mit Hut und Brille, automatisches Speichern nach Game Over, Tabelle `player_skin` und Skin-API, Mini-Figuren in der Bestenliste | neu `NameScreen.tsx`, `SkinScreen.tsx`, `game/skin.ts`, `002-player-skin.xml`, `PlayerController` u. a.; `App.tsx`, `GameOverScreen.tsx`, `api.ts`, `HighscoreService` |

Etappe 1 zuerst, weil sie ohne Änderung an der Spiellogik sofort den Arcade-Eindruck bringt. Etappe 2 vor
den Zonen, weil das Leben-System die höhere Schwierigkeit erst fair macht. Das Intro kommt mit Etappe 4,
weil es die Zonenhintergründe braucht und die Fallschirm-Grafik aus Etappe 2 wiederverwendet. Etappe 6
braucht nur die Sprites aus Etappe 1 und kann deshalb auch direkt danach kommen.

Zu jeder Etappe gehören: Engine-Tests (vitest) für die neue Logik, Aktualisierung von `Controls.tsx`
(Taste M, Intro überspringen) und der Abschnitt „Spielablauf“ im README.

## 8. Getroffene Entscheidungen

| Frage | Entscheidung | Abschnitt |
|---|---|---|
| Zeigt der Höhenmeter die aktuelle Zone oder die absolute Höhe ab 0 m? | Aktuelle Zone, die absolute Höhe steht als Zahl daneben | 1.3 |
| Gibt es nach dem Tod ein „Continue?“? | Nein, damit Highscores ihren Wert behalten | 2.2 |
| Erscheinen Herzen auch bei vollen Leben? | Ja, dann +100 Punkte | 5.2 |
| Welche Zonen? | 8 Zonen, benannt nach den Abteilungen von Hotline bis Chefsessel, je 1000 m | 4.1 |
| Letzte Zone: endlos schwerer oder Zonen im Kreis? | Endlos: Chefsessel ab 7000 m, Schwierigkeit steigt bis 8000 m und bleibt dann konstant | 4.2 |
| Touch-Geräte? | Nicht in diesem Konzept, das HUD hält aber unten Platz frei | 1, 9 |
| Wie viele Plätze zeigt das Scoreboard immer an? | Alle 10, auch leere | 2.1 |
| Bestenliste auch im Spiel sichtbar? | Ja, als Zeile `NEXT #3 004210` unter `HI` | 1.1 |
| Warnton beim letzten Herz dauerhaft? | Nein, nur dreimal direkt nach dem Verlust | 1.2 |
| Wie heißt das Spiel? | `imp@jump`, Untertitel „der einzig wahre jumphost“; technische Namen bleiben | Name und Stil |
| Grafikstil? | Pixel-Art nur für Hintergründe (1 Art-Pixel = 2 Weltpixel); Figuren, Plattformen, Monster, HUD, Schrift und Menüs scharf in voller Auflösung; feste Palette | Name und Stil |
| Klang? | 8-Bit-Retro: jsfxr-Effekte, Chiptune mit höchstens 4 Stimmen | Name und Stil, 6 |
| Wie beginnt eine Runde? | Intro: am Fallschirm von der obersten Zone hinunter auf 0 m, gespielt wird erst nach der Landung | 3.4 |
| Ist das Intro überspringbar? | Ja, mit Leertaste oder Enter, direkt zur Landung | 3.4 |
| Wann gibt man den Namen ein? | Am Anfang vor der Runde; nach Game Over wird automatisch gespeichert | 2.3 |
| Was lässt sich an der Figur anpassen? | Farbe von Körper, T-Shirt und Tentakeln (je 12 aus der Palette), dazu Hut und Brille | 2.4 |
| Figuren in der Bestenliste? | Ja, Mini-Figur im Skin des Spielers vor jedem Namen | 2.1 |
| Wo wird der Skin gespeichert? | In der Datenbank pro Spielername, beim nächsten Start vorausgewählt | 2.5 |
| Welche Power-ups gibt es? | Herz, Punkte (+200, Motiv je Zone, zunächst Platzhalter) und Raketenrucksack (3 s Flug) | 5 |
| Gibt es Hindernisse außer Monstern? | Ja, Stachelplattformen ab Zone 5: Landung kostet ein Herz | 4.4 |

## 9. Spätere Erweiterungen (nicht Teil dieses Konzepts)

- **Weitere Power-ups mit Dauer:** Propellerhut, Schild, Doppelschuss, Magnet. Das Modell aus 5.1 und der
  Restzeit-Balken des Raketenrucksacks (5.4) sind dafür vorbereitet.
- **Loop-System:** Nach dem Produktmanagement beginnen die Zonen 2–7 von vorn, schneller und mit Hinweis
  „LOOP 2“. Alternative zum endlosen Chefsessel, falls der sich auf Dauer zu gleichförmig anfühlt.
- **Touch-Steuerung:** Buttons für links, rechts, springen und schießen im freigehaltenen unteren Bereich.
