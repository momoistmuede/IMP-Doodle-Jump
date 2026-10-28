# Doodle Jump wird zum Arcade-Spiel

Stand: 28.10.2026 · Entwurf

Dieses Dokument beschreibt, wie sich das Spiel künftig anfühlen soll. Es richtet sich an alle, die
mitreden wollen, ohne zu programmieren. Die technischen Details für die Entwicklung stehen in
[konzept-arcade.md](konzept-arcade.md).

## Worum es geht

Heute ist Doodle Jump ein einfaches Spiel: Man springt von Plattform zu Plattform nach oben, und ein
einziger Fehler beendet die Runde. Es gibt keinen Ton und die Welt sieht von unten bis oben gleich aus.

Künftig soll es sich anfühlen wie ein Spielautomat aus der Spielhalle:

- Die **Punkte** stehen groß und gut sichtbar im Mittelpunkt.
- Man hat **3 Leben** statt nur einem.
- Je höher man kommt, desto **mehr verändert sich die Welt**, und desto schwerer wird es.
- **Jede Aktion macht ein Geräusch**, dazu läuft Musik.
- Die **Bestenliste** lädt mit freien Plätzen zum Mitmachen ein.

## Was man während des Spiels sieht

```
┌──────────────────────────────────────────┐
│  ▲ 600 m        001234         ♥ ♥ ♡     │
│  ┃               HI 012345               │
│  ┃             NEXT #3 004210            │
│  ┃                                       │
│  ┣━ 483 m                                │
│  ┃                                       │
│  ▼ 250 m                                 │
│                                          │
│              ZONE 2 · WOLKEN             │
└──────────────────────────────────────────┘
```

- **Oben in der Mitte, groß: der Punktestand**, sechsstellig wie am Automaten (`001234`). Bei Bonuspunkten
  steigt kurz eine kleine Zahl wie `+50` auf.
- **Darunter `HI`:** der aktuelle Rekord, also Platz 1 der Bestenliste. Wer ihn knackt, sieht dort seine
  eigene Zahl blinken.
- **Darunter `NEXT`:** der nächste Platz der Bestenliste, den man überholen kann, z. B. „Platz 3 mit
  4.210 Punkten“. Hat man ihn überholt, ertönt ein kurzes Signal und das nächste Ziel erscheint. So sieht
  man schon beim Spielen, ob man es in die Bestenliste schafft.
- **Oben rechts: 3 Herzen** für die Leben.
- **Am linken Rand: der Höhenmesser.** Eine schmale Leiste zeigt, wie weit man im aktuellen Abschnitt ist
  und wie viele Meter es noch bis zum nächsten sind. Daneben steht die Höhe in Metern.
- Beim Erreichen eines neuen Abschnitts erscheint kurz dessen Name in der Bildmitte.

## Die Bestenliste

Alle 10 Plätze sind **immer zu sehen**, auch wenn noch niemand sie erspielt hat. Freie Plätze stehen
als Lücke in der Liste, der erste freie Platz blinkt mit „DEIN NAME?“. Das soll Kolleginnen und Kollegen
anspornen, sich einzutragen.

```
          ★  HIGH SCORES  ★

   1ST   ANNA          012345
   2ND   JONAS         008210
   3RD   LEA           004210
   4TH   TOM           001980
   5TH   DEIN NAME?    000000
   6TH   ---------     000000
   7TH   ---------     000000
   8TH   ---------     000000
   9TH   ---------     000000
  10TH   ---------     000000

        ▶ PRESS SPACE TO START ◀
```

- Die Plätze 1 bis 3 leuchten in Gold, Silber und Bronze.
- Wer gerade einen neuen Eintrag gemacht hat, sieht ihn blinken.
- Nach dem Spiel erscheint groß „GAME OVER“. Reicht es für die Top 10, steht dort z. B.
  „NEUER HIGHSCORE – PLATZ 3!“.
- Wie heute zählt pro Name nur das beste Ergebnis. Eine Runde, die schlechter läuft, schadet also nicht.

## Leben, Schaden und Fallschirm

Man startet mit **3 Herzen**.

| Was passiert | Folge |
|---|---|
| Man stößt seitlich oder von unten gegen ein Monster | 1 Herz weg. Die Spielfigur blinkt kurz und ist für 2 Sekunden unverwundbar |
| Man springt von oben auf ein Monster | Das Monster ist besiegt, es gibt Bonuspunkte |
| Man fällt unten aus dem Bild | 1 Herz weg. Ein **Fallschirm** öffnet sich, man schwebt ein Stück nach unten und landet sicher auf einer Plattform. Dann klettert man weiter |
| Man verliert das letzte Herz | Die Runde ist vorbei |
| Man findet unterwegs ein Herz | 1 Herz zurück (mehr als 3 gehen nicht) |

Beim Fallschirm verliert man etwa 90 Meter, die man neu klettern muss. Die bereits erreichten Punkte bleiben
aber erhalten. Ein Absturz kostet also Zeit und ein Leben, aber keine Punkte.

Bei nur noch einem Herz pulsiert es und ein kurzes Warnsignal ertönt.

Ein „Weiterspielen?“ nach dem Tod gibt es bewusst nicht. Die Bestenliste soll zeigen, wer am besten spielt,
nicht wer am längsten durchhält.

## Die Welt wird höher und schwerer

Der Weg nach oben ist in Abschnitte („Zonen“) eingeteilt. Jede Zone hat ein eigenes Aussehen, eigene
Musik, neue Gegner und neue Arten von Plattformen. Mit jeder Zone wird es spürbar schwerer: Die
Plattformen liegen weiter auseinander, bewegen sich häufiger und schneller, und es gibt mehr Monster.

| Zone | Ab Höhe | So sieht es aus | Neu hinzu kommt | Musik |
|---|---|---|---|---|
| 1 · Notizblock | 0 m | Kariertes Papier, wie heute | Die bekannten Plattformen und ein erstes, seltenes Monster | Fröhlich |
| 2 · Wolken | 250 m | Blauer Himmel mit vorbeiziehenden Wolken | Plattformen, die nach einem Sprung verschwinden, und Vögel, die quer durchs Bild fliegen | Leicht und luftig |
| 3 · Gewitternacht | 600 m | Dunkler Nachthimmel mit Regen und Blitzen | Plattformen, die kurz nach der Landung zerbröseln, Plattformen, die auf und ab fahren, und Fledermäuse, die einem folgen | Treibend, etwas düster |
| 4 · Weltraum | 1000 m | Schwarz, mit Sternen und Planeten | Kürzere, schnellere Plattformen und UFOs, die von oben schießen | Elektronisch |
| 5 · Schwarzes Loch | 1500 m | Violett und wirbelnd | Alles gemischt und dichter | Hektisch |

Die Zonen gehen weich ineinander über: Der Himmel wechselt allmählich die Farbe und die Musik blendet über.

Zone 5 hat kein Ende. Bis 2500 Meter wird es noch schwerer, danach bleibt der Schwierigkeitsgrad gleich. Ab
dort entscheidet, wer am längsten fehlerfrei durchhält.

Wichtig: Das Spiel bleibt immer schaffbar. Es gibt in jeder Höhe einen Weg nach oben, der mit normalen
Sprüngen erreichbar ist.

## Fundstücke unterwegs (Power-ups)

Auf dem Weg nach oben liegen ab und zu Gegenstände, die man im Vorbeispringen einsammelt. Sie helfen dem
Spieler.

**Zum Start gibt es nur eins: das Herz.**

- Es gibt ein verlorenes Leben zurück.
- Hat man noch alle 3 Herzen, gibt es stattdessen 100 Bonuspunkte. Ein Herz lohnt sich also immer.
- Wer schon Herzen verloren hat, findet etwas häufiger eines. So bekommt man eine zweite Chance, ohne dass
  es geschenkt wirkt.

Später können weitere Fundstücke dazukommen, die eine Zeit lang wirken, z. B. ein Raketenrucksack, ein
Propellerhut, ein Schutzschild oder ein Doppelschuss.

## Geräusche und Musik

Ton macht einen großen Teil des Spielspaßes aus. Alle Geräusche klingen wie bei alten Spielautomaten
(8-Bit-Stil).

| Wann | Wie es klingt |
|---|---|
| Springen | kurzes, helles „Bloop“ (leise, weil es ständig vorkommt) |
| Sprungfeder | „Boing“ |
| Schießen | „Pew“ |
| Monster besiegt | „Puff“ beim Abschießen, „Squash“ beim Draufspringen |
| Selbst getroffen | „Autsch“, dazu blitzt der Bildschirm rot |
| Herunterfallen | fallendes Pfeifen |
| Fallschirm geht auf / Landung | „Fwump“ / weiches „Tapp“ |
| Plattform bricht oder verschwindet | „Krack“ / „Plopp“ |
| Herz eingesammelt | kleine aufsteigende Melodie (bei vollen Leben ein Münz-„Kling“) |
| Platz in der Bestenliste überholt | „Ding-Ding“ |
| Monster in der Nähe | kurzes Knurren, bevor es zu sehen ist |
| Neue Zone erreicht | Fanfare |
| Game Over | absteigende Melodie |
| Neuer Highscore | Jubel-Melodie |
| Spielstart | „Insert Coin“ |

Dazu läuft in jeder Zone ein eigenes Musikstück, je höher, desto schneller. Mit der Taste **M** lässt sich
der Ton jederzeit aus- und einschalten.

## In welcher Reihenfolge es kommt

Das Ganze wird in fünf Schritten gebaut. Nach jedem Schritt ist das Spiel voll spielbar.

1. **Neuer Look:** großer Punktestand, Rekord- und Zielanzeige, Höhenmesser, Bestenliste mit 10 festen
   Plätzen, „GAME OVER“-Bildschirm.
2. **Leben:** 3 Herzen, Fallschirm, Herzen zum Einsammeln.
3. **Ton:** alle Geräusche, Stummschalten mit M.
4. **Zonen:** wechselnde Hintergründe, Musik pro Zone, steigende Schwierigkeit.
5. **Neue Gegner und Plattformen** je Zone.

Die Leben kommen bewusst vor den schwereren Zonen, damit das Spiel nicht unfair wird.

## Bewusst noch nicht dabei

- **Spielen auf Handy oder Tablet:** Die Anzeige lässt unten Platz für spätere Bildschirm-Tasten.
- **Weitere Fundstücke** wie Raketenrucksack oder Schutzschild.
- **Zonen im Kreis:** Statt einer endlosen letzten Zone könnten die Zonen später schneller von vorn
  beginnen.

Alle Zahlen in diesem Dokument (Höhen, Häufigkeiten, Abstände) sind Startwerte. Sie werden beim
Ausprobieren angepasst, bis sich das Spiel gut anfühlt.
