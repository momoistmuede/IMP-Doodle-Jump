# Konzept: Arcade-Modus für IMP-Doodle-Jump

Stand: 28.10.2026 · Status: Entwurf

Allgemein verständliche Fassung ohne Technik: [konzept-arcade-ueberblick.md](konzept-arcade-ueberblick.md)

## Ziel

Das Spiel soll sich wie ein Arcade-Automat anfühlen: Der Score steht groß im Mittelpunkt, der Spieler hat
3 Leben, die Welt verändert sich mit der Höhe und wird schwerer, und jede Aktion hat einen Sound. Die
Highscore-Liste zeigt immer die ersten 10 Plätze, auch wenn sie noch leer sind, damit andere einen Anreiz
haben, sie zu füllen.

Was es heute gibt (Ausgangslage):
| Bereich | Heute |
|---|---|
| Score | Kleine MUI-`Paper`-Box oben links, React-State, wird bei jeder Änderung neu gerendert |
| Leben | Keine. Monster berühren oder herunterfallen = sofort Game Over |
| Schwierigkeit | `difficulty()` steigt linear bis 8000 px (800 m) und bleibt dann gleich |
| Welt | Ein Hintergrund (kariertes Papier), ein Monstertyp ab 150 m, Plattformen: normal, bewegt, brechend, Feder |
| Sound | Keiner |
| Highscores | Top 10 als MUI-Tabelle, bei leerer Liste nur der Text „Noch keine Highscores“ |

## 1. Arcade-HUD

Das HUD wird direkt auf das Canvas gezeichnet (`render.ts`, neue Funktion `drawHud`) statt als MUI-Overlay.
So bleibt alles pixelgenau im Spielfeld, skaliert mit dem Canvas, und React muss nicht bei jeder
Score-Änderung neu rendern.

Das untere Sechstel des Spielfelds bleibt frei von HUD-Elementen, damit dort später Touch-Buttons Platz
haben (siehe Abschnitt 9).

```
┌──────────────────────────────────────────┐
│  ▲ 600 m        001234         ♥ ♥ ♡     │
│  ┃               HI 012345               │
│  ┃             NEXT #3 004210            │
│  ┃                                       │
│  ┣━ 483 m  ◄ aktuelle Höhe               │
│  ┃                                       │
│  ┣╌ 512 m  ◄ Höchster Punkt dieser Runde │
│  ┃                                       │
│  ▼ 250 m                                 │
│                                          │
│              ZONE 2 · WOLKEN             │  ◄ Banner beim Zonenwechsel (2 s)
│                                          │
│                                          │  ◄ frei für spätere Touch-Buttons
└──────────────────────────────────────────┘
```

### 1.1 Score: oben mittig, groß

- Position: horizontal zentriert, oben, ca. 28 px Schrifthöhe (Weltkoordinaten).
- Schrift: Pixel-Font **„Press Start 2P“** (SIL Open Font License), selbst gehostet über das npm-Paket
  `@fontsource/press-start-2p`. Die CSP erlaubt nur `font-src 'self'`, ein Google-Fonts-Link ginge also
  nicht. Vor dem Spielstart `document.fonts.load('28px "Press Start 2P"')` abwarten, sonst zeichnet das
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
  zum Weltraum“).
- Neben dem Marker für die aktuelle Höhe steht immer die **absolute Höhe ab 0 m als Zahl** (`483 m`).
- Zweiter Marker nach einem Fallschirm-Absturz: der höchste Punkt dieser Runde (gestrichelt). Der Score sinkt
  beim Absturz nicht, man sieht aber, wie viel man wieder aufholen muss.
- In der Endlos-Zone (ab 1500 m) läuft die Leiste von Meilenstein zu Meilenstein (alle 500 m).

## 2. Scoreboard im Arcade-Stil

### 2.1 Top 10 immer sichtbar

Alle 10 Plätze werden **immer** angezeigt. Leere Plätze sind Platzhalter und wirken wie eine
Einladung:

```
          ★  HIGH SCORES  ★

   1ST   ANNA          012345
   2ND   JONAS         008210
   3RD   LEA           004210
   4TH   TOM           001980
   5TH   DEIN NAME?    000000     ◄ erster leerer Platz blinkt
   6TH   ---------     000000
   7TH   ---------     000000
   8TH   ---------     000000
   9TH   ---------     000000
  10TH   ---------     000000

        ▶ PRESS SPACE TO START ◀
```

- Leerer Platz: Name `---------`, Score `000000`, gedimmte Farbe. Beim ersten leeren Platz blinkt
  „DEIN NAME?“.
- Plätze 1–3 in Gold, Silber, Bronze (die Farben aus `TROPHY` bleiben), Rest weiß.
- Der eigene, gerade gespeicherte Eintrag blinkt (statt heute nur `selected`).
- „Noch keine Highscores“ entfällt, die leeren Plätze übernehmen diese Rolle.
- Start zusätzlich mit Leertaste/Enter, der **Play**-Button bleibt für die Maus.

### 2.2 Umsetzung

- Nur Frontend: `HighscoreScreen.tsx` füllt die Liste immer auf 10 Einträge auf
  (`Array.from({ length: 10 }, (_, i) => list[i] ?? null)`). Das Backend liefert schon heute die Top 10
  (`HighscoreService.TOP_LIMIT`), keine API-Änderung.
- 10 Zeilen plus Überschrift und Button müssen auf den Bildschirm passen: Zeilenhöhe und Schriftgröße so
  wählen, dass die Liste ab 700 px Fensterhöhe ohne Scrollen sichtbar ist.
- Arcade-Optik über das MUI-Theme (dunkler Hintergrund, Pixel-Font für Überschrift und Tabelle), kein
  eigenes CSS außerhalb von Theme/`sx`.
- Game-Over-Screen im selben Stil: großes blinkendes `GAME OVER`, darunter Score und, falls er für die
  Top 10 reicht, „NEUER HIGHSCORE – PLATZ 3!“ (berechnet aus der Liste in `App.tsx`, siehe 1.1).
- **Kein „Continue?“** nach dem Tod. Wer stirbt, beginnt neu. Sonst ließen sich Highscores mit Ausdauer
  statt Können erspielen und verlören an Wert.

## 3. Leben, Schaden und Fallschirm

### 3.1 Regeln

| Ereignis | Leben > 1 | Letztes Leben |
|---|---|---|
| Seitlich oder von unten gegen ein Monster | −1 Herz, kurzer Rückstoß, 2 s unverwundbar (Spieler blinkt), Monster bleibt | −1 Herz → 0: Todesanimation, Game Over |
| Von oben auf ein Monster springen | Monster stirbt, +Bonus (unverändert) | wie links |
| Von einem Monster-Geschoss getroffen (ab Zone 4) | −1 Herz, wie Monsterkontakt | wie Monsterkontakt |
| Unten aus dem Bild fallen | −1 Herz, **Fallschirm öffnet sich**, Landung weiter unten | −1 Herz → 0: Fallschirm öffnet nicht, Game Over |
| Herz einsammeln | +1 Herz (max. 3) | +1 Herz |

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
  (`fillRange(state, fromY, toY)`). Dieser Bereich bekommt keine Monster, damit der Spieler nicht direkt
  nach der Landung wieder getroffen wird.
- `state.over` wird erst bei 0 Herzen gesetzt.
- Die Kamera-Invariante „bewegt sich nur nach oben“ gilt künftig außer während des Fallschirm-Flugs.

## 4. Zonen: Höhe macht das Spiel schwerer

Alle paar hundert Höhenmeter beginnt eine neue Zone mit eigenem Hintergrund, eigener Musik, neuen Monstern
und neuen Plattformtypen. Innerhalb einer Zone steigt die Schwierigkeit weiter an, beim Zonenwechsel gibt
es einen deutlichen Sprung.

### 4.1 Zonenübersicht

| # | Name | Höhe | Hintergrund | Neue Plattformen | Monster | Musik |
|---|---|---|---|---|---|---|
| 1 | Notizblock | 0–250 m | Kariertes Papier (wie heute) | normal, bewegt, brechend, Feder | Blob ab 150 m, selten | Fröhlich, 120 BPM |
| 2 | Wolken | 250–600 m | Himmelblau, Wolken mit Parallaxe | **verschwindend** (trägt nur einmal) | Blob, **Vogel** (fliegt quer über das Bild) | Leicht, 130 BPM |
| 3 | Gewitternacht | 600–1000 m | Dunkelblau, Regen, gelegentlich Blitze | **zerbröselnd** (bricht 1 s nach Landung), **vertikal bewegt** | Vogel, **Fledermaus** (folgt dem Spieler langsam, 2 Treffer) | Treibend, Moll, 140 BPM |
| 4 | Weltraum | 1000–1500 m | Schwarz, Sterne, Planeten mit Parallaxe | **kurze** Plattformen (48 px), schneller bewegt | Fledermaus, **UFO** (schießt langsam nach unten) | Synth, 150 BPM |
| 5 | Schwarzes Loch | ab 1500 m (endlos) | Violett, wirbelnd | Mix aller Typen | Mix aller Monster, dichter | Hektisch, 160 BPM |

Zonenwechsel:

- Hintergrund blendet über ca. 20 m weich über (Farben interpolieren), kein harter Schnitt.
- Banner „ZONE 2 · WOLKEN“ in der Bildmitte für 2 s, dazu eine kurze Fanfare.
- Musik blendet in 2 s auf den neuen Track über.

### 4.2 Schwierigkeit pro Zone (Startwerte zum Feintuning)

Heute rechnet `difficulty()` eine Zahl von 0 bis 1 aus der Höhe. Künftig liefert eine Tabelle
`ZONES` pro Zone die Parameter, innerhalb der Zone wird zwischen Anfangs- und Endwert interpoliert.

| Parameter | Zone 1 | Zone 2 | Zone 3 | Zone 4 | Zone 5 (ab 1500 m) | Obergrenze (ab 2500 m) |
|---|---|---|---|---|---|---|
| Plattformabstand (px) | 40–90 | 60–120 | 80–140 | 90–155 | 100–165 | 110–170 |
| Anteil bewegte Plattformen | 10 % | 20 % | 30 % | 40 % | 50 % | 60 % |
| Tempo bewegte Plattformen (px/s) | 90 | 120 | 150 | 180 | 200 | 230 |
| Feder-Chance | 6 % | 5 % | 4 % | 3 % | 3 % | 3 % |
| Anteil Spezialplattformen der Zone | – | 15 % | 20 % | 25 % | 30 % | 35 % |
| Monster-Chance pro Plattform | 4 % | 8 % | 12 % | 15 % | 18 % | 22 % |
| Bonus pro Monster | 50 | 50/75 | 75/100 | 100/150 | wie Typ | wie Typ |

**Zone 5 ist endlos:** Von 1500 m bis 2500 m steigen die Werte linear auf die Obergrenze, danach bleiben sie
konstant. Das Spiel wird dort nicht mehr schwerer, sondern nur noch länger. So bleibt es schaffbar, und
die Highscores entscheiden sich über Ausdauer und Fehlerfreiheit.

Feste Regel, damit das Spiel immer schaffbar bleibt: Die „Kette“ aus erreichbaren Plattformen hält immer
`MAX_GAP` (170 px) ein, auch an der Obergrenze. Brechende Plattformen bleiben reine Köder. Verschwindende
und zerbröselnde Plattformen dürfen Teil der Kette sein, weil sie einmal tragen. Die bestehenden
Erreichbarkeits-Tests in `engine.test.ts` werden pro Zone und an der Obergrenze ausgeführt.

### 4.3 Monster-Modell

`Monster` bekommt ein Feld `kind` (`'blob' | 'bird' | 'bat' | 'ufo'`) und `hp`. Jeder Typ hat eine eigene
Bewegungsfunktion und Größe. Schüsse ziehen 1 HP ab, ein Sprung von oben tötet immer, das ist die
Arcade-Belohnung für Mut. UFO-Geschosse werden als eigene Liste `enemyBullets` geführt.

## 5. Power-ups

### 5.1 Allgemeines Konzept

Power-ups liegen schwebend über Plattformen der Kette, sind also immer erreichbar. Eingesammelt werden sie
durch Berührung. Es gibt zwei Arten:

| Art | Wirkung | Beispiele |
|---|---|---|
| Sofort | Wirkt beim Einsammeln einmalig | Herz |
| Mit Dauer | Wirkt für X Sekunden, Restzeit als Balken unter den Herzen | Jetpack, Propellerhut, Schild, Doppelschuss, Magnet (siehe Abschnitt 9) |

Datenmodell:

```ts
export type PowerUpKind = 'heart'; // später: | 'jetpack' | 'shield' | ...

export interface PowerUp {
  id: number;
  kind: PowerUpKind;
  x: number;
  y: number;
}
```

Erzeugt werden Power-ups in `generatePlatforms`, eingesammelt in einer neuen Funktion
`collectPowerUps(state)`. Jeder neue Typ braucht nur einen Eintrag in einer Tabelle (Größe, Spawn-Chance,
Wirkung, Sound), keine Änderung an der Spielschleife.

### 5.2 Erste Ausbaustufe: Herz

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
- Darstellung: rotes Herz, wippt leicht auf und ab und glitzert, damit es auch in Zone 3 und 4 gut zu
  sehen ist.

## 6. Sound

Sound ist für das Spielgefühl zentral. Jede Aktion des Spielers und jedes wichtige Ereignis bekommt einen
eigenen, kurzen Effekt im 8-Bit-Stil, dazu ein Musik-Loop pro Zone.

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
| Letztes Herz | Warnpiep, dreimal direkt nach dem Verlust | Danach nur noch das pulsierende Herz |
| Platz überholt (`NEXT` springt weiter) | kurzes „Ding-Ding“ | |
| Monster taucht auf | kurzes Knurren je Typ | Warnt, bevor das Monster im Bild ist |
| UFO-Schuss | „Zapp“ | |
| Zonenwechsel | Fanfare (1–2 s) | |
| Tod / Game Over | absteigende Melodie | Musik bricht vorher ab |
| Neuer Highscore | Jubel-Jingle | Auf dem Game-Over-Screen |
| Spielstart | „Insert Coin“ | Beim Klick auf Play |
| Menü-Navigation | kurzer Klick | |

### 6.2 Musik

- Ein Loop pro Zone (siehe Zonentabelle), Crossfade 2 s beim Zonenwechsel.
- Während des Fallschirm-Flugs wird die Musik leiser und gedämpft (Tiefpass), danach wieder normal.
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
  **BeepBox** oder CC0-Titel von OpenGameArt. Lizenzen und Quellen in `docs/CREDITS.md` festhalten.

## 7. Umsetzung in Etappen

Jede Etappe ist für sich spielbar und kann einzeln gemergt werden.

| # | Inhalt | Wichtigste Dateien |
|---|---|---|
| 1 | Arcade-HUD (Score mittig, `HI`/`NEXT`, Höhenmeter), Pixel-Font, Highscore-Liste in `App.tsx`, Scoreboard mit 10 festen Plätzen, Game-Over im Arcade-Stil | `App.tsx`, `render.ts`, `GameScreen.tsx`, `HighscoreScreen.tsx`, `GameOverScreen.tsx`, `theme.ts` |
| 2 | 3 Leben, Unverwundbarkeit, Fallschirm, Herz-Power-up, Herzen im HUD | `engine.ts`, `engine.test.ts`, `render.ts` |
| 3 | Ereignis-System und alle Soundeffekte, Stummschalten | `engine.ts`, neu `audio/sound.ts`, `GameScreen.tsx`, `public/sounds/` |
| 4 | Zonen: Tabelle `ZONES` inkl. Obergrenze, Hintergründe, Musik, Banner | `engine.ts`, `render.ts`, `audio/sound.ts`, `public/music/` |
| 5 | Neue Plattformtypen und Monster je Zone, Monster-Geschosse | `engine.ts`, `engine.test.ts`, `render.ts` |

Etappe 1 zuerst, weil sie ohne Änderung an der Spiellogik sofort den Arcade-Eindruck bringt. Etappe 2 vor
den Zonen, weil das Leben-System die höhere Schwierigkeit erst fair macht.

Zu jeder Etappe gehören: Engine-Tests (vitest) für die neue Logik, Aktualisierung von `Controls.tsx`
(Taste M) und der Abschnitt „Spielablauf“ im README.

## 8. Getroffene Entscheidungen

| Frage | Entscheidung | Abschnitt |
|---|---|---|
| Zeigt der Höhenmeter die aktuelle Zone oder die absolute Höhe ab 0 m? | Aktuelle Zone, die absolute Höhe steht als Zahl daneben | 1.3 |
| Gibt es nach dem Tod ein „Continue?“? | Nein, damit Highscores ihren Wert behalten | 2.2 |
| Erscheinen Herzen auch bei vollen Leben? | Ja, dann +100 Punkte | 5.2 |
| Zone 5: endlos schwerer oder Zonen im Kreis? | Endlos, Schwierigkeit steigt bis 2500 m und bleibt dann konstant | 4.2 |
| Touch-Geräte? | Nicht in diesem Konzept, das HUD hält aber unten Platz frei | 1, 9 |
| Wie viele Plätze zeigt das Scoreboard immer an? | Alle 10, auch leere | 2.1 |
| Bestenliste auch im Spiel sichtbar? | Ja, als Zeile `NEXT #3 004210` unter `HI` | 1.1 |
| Warnton beim letzten Herz dauerhaft? | Nein, nur dreimal direkt nach dem Verlust | 1.2 |

## 9. Spätere Erweiterungen (nicht Teil dieses Konzepts)

- **Power-ups mit Dauer:** Jetpack, Propellerhut, Schild, Doppelschuss, Magnet. Das Modell aus 5.1 ist
  dafür vorbereitet.
- **Loop-System:** Nach Zone 4 beginnen die Zonen 2–4 von vorn, schneller und mit Hinweis „LOOP 2“.
  Alternative zur endlosen Zone 5, falls die sich auf Dauer zu gleichförmig anfühlt.
- **Touch-Steuerung:** Buttons für links, rechts, springen und schießen im freigehaltenen unteren Bereich.
