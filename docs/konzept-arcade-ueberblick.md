# Doodle Jump wird zu imp@jump

Stand: 29.10.2026 · Entwurf

Dieses Dokument beschreibt, wie sich das Spiel künftig anfühlen soll. Es richtet sich an alle, die
mitreden wollen, ohne zu programmieren. Die technischen Details für die Entwicklung stehen in
[konzept-arcade.md](konzept-arcade.md).

## Worum es geht

Heute ist Doodle Jump ein einfaches Spiel: Man springt von Plattform zu Plattform nach oben, und ein
einziger Fehler beendet die Runde. Es gibt keinen Ton und die Welt sieht von unten bis oben gleich aus.

Künftig soll es sich anfühlen wie ein Spielautomat aus der Spielhalle:

- Die **Punkte** stehen groß und gut sichtbar im Mittelpunkt.
- Man hat **3 Leben** statt nur einem.
- Je höher man kommt, desto **weiter steigt man durch die Abteilungen auf**, von der Hotline bis zum
  Chefsessel. Mit jeder Abteilung wird es schwerer.
- **Jede Aktion macht ein Geräusch**, dazu läuft Musik.
- Die **Bestenliste** lädt mit freien Plätzen zum Mitmachen ein.

## Name und Aussehen

Das Spiel bekommt einen neuen Namen: **imp@jump**. Darunter steht klein der Untertitel
**„der einzig wahre jumphost“**. Beides ist bewusst kleingeschrieben und erscheint auf dem Startbildschirm,
auf dem „GAME OVER“-Bildschirm und im Browser-Tab.

**Hintergründe im Pixel-Look, alles andere scharf:** Nur die Hintergründe bestehen aus deutlich
sichtbaren, eckigen Pixeln wie auf einem alten Spielautomaten. Spielfigur, Plattformen, Monster, Anzeigen,
Schrift, Menüs und Bestenliste werden dagegen gestochen scharf dargestellt, auch auf großen und
hochauflösenden Bildschirmen. Alles nutzt dieselben wenigen, kräftigen Farben, damit es zusammenpasst.

**Ton im 8-Bit-Stil:** Geräusche und Musik klingen wie auf einer Spielkonsole aus den 80er-Jahren, etwa
wie beim NES oder Game Boy: piepsig, knackig und mit eingängigen Melodien.


```
┌──────────────────────────────────────────┐
│  ▲ 2000 m       001234         ♥ ♥ ♡     │
│  ┃               HI 012345               │
│  ┃             NEXT #3 004210            │
│  ┃                                       │
│  ┣━ 1483 m                               │
│  ┃                                       │
│  ▼ 1000 m                                │
│                                          │
│                  ZONE 2                  │
│           PROFESSIONAL SERVICE           │
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
               imp@jump
       der einzig wahre jumphost

          ★  HIGH SCORES  ★

   1ST   ☻ ANNA          012345
   2ND   ☻ JONAS         008210
   3RD   ☻ LEA           004210
   4TH   ☻ TOM           001980
   5TH   ? DEIN NAME?    000000
   6TH   ? ---------     000000
   7TH   ? ---------     000000
   8TH   ? ---------     000000
   9TH   ? ---------     000000
  10TH   ? ---------     000000

        ▶ PRESS SPACE TO START ◀
```

- Die Plätze 1 bis 3 leuchten in Gold, Silber und Bronze.
- Vor jedem Namen steht eine **kleine Figur** (☻) in den Farben und mit Hut und Brille, die sich der
  Spieler ausgesucht hat. So erkennt man sofort, wer wo steht. Freie Plätze zeigen eine graue Figur mit
  Fragezeichen.
- Wer gerade einen neuen Eintrag gemacht hat, sieht ihn blinken.
- Nach dem Spiel erscheint groß „GAME OVER“. Reicht es für die Top 10, steht dort z. B.
  „NEUER HIGHSCORE – PLATZ 3!“.
- Wie heute zählt pro Name nur das beste Ergebnis. Eine Runde, die schlechter läuft, schadet also nicht.

## Vor dem Spiel: Name und Spielfigur

Nach dem Druck auf „Play“ meldet man sich zuerst an:

1. **Name eingeben.** Das Feld ist schon mit dem Namen ausgefüllt, der zuletzt an diesem Rechner gespielt
   hat.
2. **Spielfigur gestalten.** Man wählt die Farbe für den **Körper**, das **T-Shirt** und die **Tentakel**,
   jeweils aus 12 Farben, die zum Spiel passen. Dazu kommen ein **Hut** (Headset, Basecap, Zylinder,
   Partyhut, Bauhelm oder Krone) und eine **Brille** (Nerdbrille, Sonnenbrille, Monokel oder VR-Brille),
   beides auch gern ohne. Eine große Vorschau zeigt die Figur hüpfend. Mit „Zufall“ lässt man sich
   überraschen, mit „Standard“ bekommt man die bekannte grüne Figur zurück.

   Hut und Brille sind nur Schmuck: Sie machen die Figur nicht größer und damit auch nicht leichter zu
   treffen.
3. **Los!** Die Runde beginnt.

Die gestaltete Figur wird **unter dem Namen gespeichert**. Wer beim nächsten Mal denselben Namen eingibt,
bekommt seine Figur automatisch wieder vorausgewählt und kann sie dort weiter ändern oder einfach übernehmen.

Weil der Name schon am Anfang feststeht, muss man ihn nach dem Spiel nicht mehr eintippen: Das Ergebnis
wird automatisch gespeichert. Danach kann man mit **Nochmal** sofort wieder starten (gleicher Name, gleiche
Figur), den **Spieler wechseln** oder zurück zur Bestenliste.

## So beginnt jede Runde

Nach „Los!“ geht es nicht sofort los. Zuerst kommt eine kurze Animation von etwa 10 Sekunden:

- Die Spielfigur hängt an einem **Fallschirm ganz oben in der obersten Zone**, dem Chefsessel.
- Sie schwebt **durch alle Zonen hinunter**: Produktmanagement, Vertrieb, Operations, Development,
  Projektmanagement, Professional Service und Hotline. Bei jeder Zone erscheint kurz ihr Name. So sieht man schon zu Beginn, was einen weiter oben erwartet.
- Unten bei **0 Metern** landet sie auf der Startplattform, der Fallschirm verschwindet und es erscheint
  „GO!“. **Erst jetzt beginnt das eigentliche Spiel** und man kann die Figur steuern.

Während der Animation kann man nichts falsch machen: Man steuert nicht, verliert kein Leben und bekommt
auch keine Punkte für den Abstieg.

Wer nicht warten will, drückt die **Leertaste** (oder Enter): Die Animation springt sofort zur Landung, und
das Spiel beginnt. Ein kleiner Hinweis unten im Bild zeigt das an. So muss man nach einem schnellen
Neustart nicht jedes Mal zuschauen.

## Leben, Schaden und Fallschirm

Man startet mit **3 Herzen**.

| Was passiert | Folge |
|---|---|
| Man stößt seitlich oder von unten gegen ein Monster | 1 Herz weg. Die Spielfigur blinkt kurz und ist für 2 Sekunden unverwundbar |
| Man springt von oben auf ein Monster | Das Monster ist besiegt, es gibt Bonuspunkte |
| Man landet auf einer Plattform mit Stacheln (ab Zone 5) | 1 Herz weg. Man springt trotzdem normal ab und ist kurz unverwundbar |
| Man fällt unten aus dem Bild | 1 Herz weg. Ein **Fallschirm** öffnet sich, man schwebt ein Stück nach unten und landet sicher auf einer Plattform. Dann klettert man weiter |
| Man verliert das letzte Herz | Die Runde ist vorbei |
| Man findet unterwegs ein Herz | 1 Herz zurück (mehr als 3 gehen nicht) |

Beim Fallschirm verliert man etwa 90 Meter, die man neu klettern muss. Die bereits erreichten Punkte bleiben
aber erhalten. Ein Absturz kostet also Zeit und ein Leben, aber keine Punkte.

Bei nur noch einem Herz pulsiert es und ein kurzes Warnsignal ertönt.

Ein „Weiterspielen?“ nach dem Tod gibt es bewusst nicht. Die Bestenliste soll zeigen, wer am besten spielt,
nicht wer am längsten durchhält.

## Die Welt wird höher und schwerer

Der Weg nach oben ist in 8 Abschnitte („Zonen“) von je 1000 Metern eingeteilt. Jede Zone ist nach einer
Abteilung benannt: Man fängt an der Hotline an und arbeitet sich bis in den Chefsessel hoch. Jede Zone hat
ein eigenes Aussehen, eigene Musik und eigene Gegner. Mit jeder Zone wird es spürbar schwerer: Die
Plattformen liegen weiter auseinander, bewegen sich häufiger und schneller, und es gibt mehr Monster. Ab
Operations kommen Plattformen mit Stacheln dazu, die ein Herz kosten.

| Zone | Ab Höhe | So sieht es aus | Neu hinzu kommt | Musik |
|---|---|---|---|---|
| 1 · Hotline | 0 m | Großraumbüro mit Headsets und Post-its | Die bekannten Plattformen und als erstes, seltenes Monster ein Imp, der einen klingelnden Telefonhörer schwingt | Fröhliche Warteschleifen-Melodie |
| 2 · Professional Service | 1000 m | Unterwegs zum Kunden: Autobahn, Bahnhof, Kundenbüro | Plattformen, die nach einem Sprung verschwinden, und Imps, die auf Papierfliegern mit Änderungswünschen quer durchs Bild fliegen | Flottes Reisetempo |
| 3 · Projektmanagement | 2000 m | Whiteboards, Zeitpläne, Kanban-Wand | Plattformen, die kurz nach der Landung zerbröseln, Plattformen, die auf und ab fahren, und Imps mit tickenden Deadline-Uhren, die einem folgen | Treibend, etwas düster |
| 4 · Development | 3000 m | Dunkler Bildschirm voller Programmcode | Kürzere, schnellere Plattformen und Bug-Imps mit Käferflügeln, die von oben mit Fehlermeldungen werfen | Elektronisch |
| 5 · Operations | 4000 m | Rechenzentrum mit Serverschränken und blinkenden Lämpchen | **Plattformen mit Stacheln**: Wer darauf landet, verliert ein Herz. Dazu alle bisherigen Imps in neuem Look, z. B. mit Alarm-Pager statt Telefon | Pulsierend |
| 6 · Vertrieb | 5000 m | Messestand, Umsatzkurven, Pokale | Mehr Stacheln, Imps im Vertriebs-Look, z. B. mit Quartalsziel statt Deadline-Uhr | Schwungvoll |
| 7 · Produktmanagement | 6000 m | Roadmap-Wand voller Post-its | Mehr Stacheln, Imps im Produkt-Look, z. B. mit Feature-Requests statt Papierfliegern | Hektisch |
| 8 · Chefsessel | 7000 m | Vorstandsetage über der Skyline. Im Hintergrund schwebt der Chefsessel, immer knapp außer Reichweite | Alles gemischt und dichter | Triumphal |

**Die Gegner sind Imps:** kleine Fabelwesen, eine Art Kobold mit Hörnchen, spitzen Ohren und Schwanz. In
jeder Zone sehen sie anders aus und haben andere Dinge dabei, passend zur Abteilung. Alle tragen aber
dasselbe weiße T-Shirt mit dem IMP-Logo auf der Brust. Die eigene Spielfigur trägt ein T-Shirt ohne Logo
und hat Tentakel statt Hörnern, so kann man sie nicht verwechseln.

Die Zonen gehen weich ineinander über: Der Hintergrund wechselt allmählich und die Musik blendet über.

Die Bilder in der Spalte „So sieht es aus“ sind das Ziel. Am Anfang hat jede Zone nur eine eigene,
flächige Hintergrundfarbe (z. B. Hellblau für Professional Service, fast Schwarz für Development). Die
richtigen Bilder im Pixel-Look kommen später dazu, ohne dass sich am Spiel etwas ändert.

Der Chefsessel hat kein Ende. Bis 8000 Meter wird es noch schwerer, danach bleibt der Schwierigkeitsgrad
gleich. Ab dort entscheidet, wer am längsten fehlerfrei durchhält.

Wichtig: Das Spiel bleibt immer schaffbar. Es gibt in jeder Höhe einen Weg nach oben, der mit normalen
Sprüngen erreichbar ist.

## Fundstücke unterwegs (Power-ups)

Auf dem Weg nach oben liegen ab und zu Gegenstände, die man im Vorbeispringen einsammelt. Sie liegen immer
so, dass man sie erreichen kann.

**Herz**

- Es gibt ein verlorenes Leben zurück.
- Hat man noch alle 3 Herzen, gibt es stattdessen 100 Bonuspunkte. Ein Herz lohnt sich also immer.
- Wer schon Herzen verloren hat, findet etwas häufiger eines. So bekommt man eine zweite Chance, ohne dass
  es geschenkt wirkt.

**Punkte**

- Bringt sofort 200 Bonuspunkte. Es ist das häufigste Fundstück.
- In jeder Zone sieht es anders aus, passend zur Abteilung: ein gelöstes Ticket an der Hotline, ein
  unterschriebenes Abnahmeprotokoll bei Professional Service, ein Meilenstein-Fähnchen im
  Projektmanagement, ein grüner Build im Development, eine „99,9 % Uptime“-Lampe bei Operations, ein
  Vertrag im Vertrieb, eine Glühbirne im Produktmanagement und ein Bonus-Scheck im Chefsessel.
- Bis diese Bilder gezeichnet sind, ist es ein einfacher bunter Kreis mit der Zonennummer, in jeder Zone in
  einer anderen Farbe.

**Raketenrucksack**

- Selten, dafür spektakulär: Man fliegt 3 Sekunden lang steil nach oben, etwa 270 Meter.
- Im Flug kann man nach links und rechts lenken und ist unverwundbar. Monster, Geschosse und Stacheln
  können einem nichts anhaben. Herzen und Punkte unterwegs werden mitgenommen.
- Kurz bevor der Treibstoff ausgeht, stottert die Flamme. Danach fällt der Rucksack ab und man springt
  normal weiter.

Später können weitere Fundstücke dazukommen, die eine Zeit lang wirken, z. B. ein Propellerhut, ein
Schutzschild oder ein Doppelschuss.

## Geräusche und Musik

Ton macht einen großen Teil des Spielspaßes aus. Alle Geräusche und die Musik klingen nach 8-Bit-Retro,
wie bei alten Spielautomaten und Konsolen.

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
| Punkte eingesammelt | heller Doppel-„Kling“ |
| Raketenrucksack | „Wusch“ beim Zünden, Düsenrauschen im Flug, „Puff-puff“ kurz vor Schluss |
| Auf Stacheln gelandet | „Pieks“ und „Autsch“ |
| Platz in der Bestenliste überholt | „Ding-Ding“ |
| Monster in der Nähe | kurzes Knurren, bevor es zu sehen ist |
| Neue Zone erreicht | Fanfare |
| Game Over | absteigende Melodie |
| Neuer Highscore | Jubel-Melodie |
| Spielstart | „Insert Coin“ |
| Abstieg am Fallschirm zu Beginn | leises Windrauschen, bei der Landung „Tapp“ und ein kurzes Startsignal |

Dazu läuft in jeder Zone ein eigenes Musikstück, je höher, desto schneller. Mit der Taste **M** lässt sich
der Ton jederzeit aus- und einschalten.

## In welcher Reihenfolge es kommt

Das Ganze wird in sechs Schritten gebaut. Nach jedem Schritt ist das Spiel voll spielbar.

1. **Neuer Look:** neuer Name imp@jump, scharfe neue Grafik, großer Punktestand, Rekord- und Zielanzeige,
   Höhenmesser, Bestenliste mit 10 festen Plätzen, „GAME OVER“-Bildschirm.
2. **Leben:** 3 Herzen, Fallschirm, Herzen zum Einsammeln.
3. **Ton:** alle Geräusche, Stummschalten mit M.
4. **Zonen:** wechselnde Hintergründe, Musik pro Zone, steigende Schwierigkeit, Abstieg am Fallschirm
   zu Beginn jeder Runde, Punkte-Fundstücke (zunächst als Platzhalter).
5. **Neue Gegner und Plattformen** je Zone, Stacheln, Raketenrucksack.
6. **Name und Spielfigur:** Anmeldung vor dem Spiel, eigene Farben, Hut und Brille für die Figur,
   gespeichert pro Name, Figuren in der Bestenliste.
   Dieser Schritt kann auch gleich nach Schritt 1 kommen.

Die Leben kommen bewusst vor den schwereren Zonen, damit das Spiel nicht unfair wird.

## Bewusst noch nicht dabei

- **Spielen auf Handy oder Tablet:** Die Anzeige lässt unten Platz für spätere Bildschirm-Tasten.
- **Weitere Fundstücke** wie Propellerhut oder Schutzschild.
- **Zonen im Kreis:** Statt einer endlosen letzten Zone könnten die Zonen später schneller von vorn
  beginnen.

Alle Zahlen in diesem Dokument (Höhen, Häufigkeiten, Abstände) sind Startwerte. Sie werden beim
Ausprobieren angepasst, bis sich das Spiel gut anfühlt.
