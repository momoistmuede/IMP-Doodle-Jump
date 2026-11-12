# Credits

Herkunft und Lizenzen aller Grafiken, Klänge und Schriften von imp@jump.

## Schrift

| Was | Quelle | Lizenz |
|---|---|---|
| „Press Start 2P“ (Arcade-Schrift) | CodeMan38, über das npm-Paket `@fontsource/press-start-2p` | SIL Open Font License 1.1 |

## Grafik

| Was | Quelle | Lizenz |
|---|---|---|
| Sprites in `frontend/public/sprites/` (Spielfigur, Plattformen, Imps, Herzen, Fallschirm) | Eigene SVG-Zeichnungen für dieses Projekt | wie das Projekt |
| IMP-Logo (`imp-logo.png`, vereinfacht in `imp-logo-shirt.svg`) | IMP | Markenzeichen von IMP, nur für dieses interne Spiel |
| Pixel-Hintergründe | Eigene Pixel-Art, im Code gezeichnet (`render.ts`) | wie das Projekt |

## Ton

Alle Effekte und alle Musikstücke sind eigene Werke. Sie liegen nicht als Dateien vor, sondern als
8-Bit-Rezepte im Code und werden beim Start im Browser erzeugt:

| Was | Wo |
|---|---|
| Soundeffekte (sfxr-artig: Rechteck, Dreieck, Sägezahn, Rauschen) | `frontend/src/audio/effects.ts` |
| Chiptune-Loops (2 × Rechteck, Dreieck, Rauschen wie beim NES) | `frontend/src/audio/music.ts` |
| Synthesizer | `frontend/src/audio/synth.ts` |

Werden später fremde Klänge oder Musik eingebunden (z. B. CC0 von OpenGameArt), kommen Quelle und Lizenz
hier in die Tabelle.
