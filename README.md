# IMP-Doodle-Jump

Doodle Jump im Browser: Spring-Boot-Backend (Gradle 9, Spring Boot 4, Liquibase, Vite, Highscores in PostgreSQL) und React-Frontend mit MUI.

## Spielablauf

1. Startbildschirm mit den 10 besten Highscores → **Play**
2. Spielen: **← →** bewegen, **Leertaste** springen (gedrückt halten = nach jeder Landung sofort
   weiterspringen), **F** schießen
3. Wer unten aus dem Bild fällt, ist **Game Over** und kann seinen Namen für die Highscores eintragen.

Plattformen: grün = normal, blau = bewegt sich, braun = bricht weg (trägt nicht), Feder = Super-Sprung.
Ab etwa 1500 px Höhe tauchen Monster auf: abschießen oder von oben draufspringen; seitlich oder von
unten berührt fällt man herunter. Punkte = Höhe / 10 + 50 pro Monster.

## Schnellstart: klonen und ausführen

Getestet unter macOS (Apple Silicon). Die Gradle-Tasks für Datenbank und App sind Shell-Skripte und
laufen daher unter macOS/Linux, nicht unter Windows.

### Voraussetzungen

| Was | Wofür | Prüfen mit |
|---|---|---|
| Git | Klonen | `git --version` |
| JDK 17 oder neuer | Startet Gradle. Java 21 für Build und App lädt Gradle bei Bedarf selbst herunter | `java -version` |
| Podman | Lokale PostgreSQL-Datenbank im Container | `podman --version` |
| Freie Ports 9000 und 5434 | App bzw. PostgreSQL | `lsof -i :9000 -i :5434` (keine Ausgabe = frei) |

Node.js/npm und Gradle selbst müssen **nicht** installiert sein: Der Gradle-Wrapper (`./gradlew`) lädt
Gradle, und Gradle lädt Node.js für den Frontend-Build. `curl` und `lsof` (für `app-start`) sind unter
macOS vorinstalliert.

Podman unter macOS einmalig einrichten (falls `podman machine ls` keine Maschine zeigt):

```sh
podman machine init     # legt die Linux-VM für Container an (einmalig, dauert etwas)
podman machine start
```

### 1. Klonen

```sh
git clone https://github.com/momoistmuede/IMP-Doodle-Jump.git
cd IMP-Doodle-Jump
```

Alle weiteren Befehle laufen im Projektverzeichnis.

### 2. Datenbank starten (einmalig)

```sh
./gradlew pods-create
```

Startet die Podman-Maschine (falls nötig) und einen PostgreSQL-Container `imp-doodle-postgres` auf
`localhost:5434` mit der leeren Datenbank `imp_doodle_jump` (Benutzer/Passwort `postgres`/`postgres`).
Die Daten liegen in `podman/volumes/postgres` und bleiben über Neustarts erhalten. Die Tabelle legt die
App beim ersten Start selbst an (Liquibase).

Nach einem Rechner-Neustart reicht `./gradlew pods-start`.

### 3. App bauen und starten

```sh
./gradlew app-start
```

Baut Backend und Frontend, startet die App im Hintergrund und wartet, bis sie erreichbar ist. Ausgabe am
Ende:

```
App is up: http://localhost:9000
```

Der erste Lauf dauert einige Minuten (Download von Gradle, Java 21, Node.js und aller Abhängigkeiten),
danach etwa 30 Sekunden.

### 4. Spielen

http://localhost:9000 im Browser öffnen → **Play**. Das Log der App steht in `build/app/app.log`.

### 5. Beenden

```sh
./gradlew app-stop      # App stoppen
./gradlew pods-stop     # Datenbank stoppen (optional, Daten bleiben erhalten)
```

### Nach Code-Änderungen

```sh
git pull
./gradlew app-restart   # stoppt, baut neu und startet
```

### Wenn etwas nicht klappt

| Meldung | Ursache und Lösung |
|---|---|
| `Postgres is not running. Run ./gradlew pods-create …` | Datenbank-Container läuft nicht: `./gradlew pods-start` (oder beim ersten Mal `pods-create`) |
| `App exited during startup … Connection refused` | Wie oben: Datenbank läuft nicht |
| `Port 9000 is already in use` | Ein anderer Prozess belegt Port 9000; die Ausgabe zeigt welcher. Beenden oder in `application.yaml` `server.port` ändern |
| `App is already running` | Die App läuft schon; neu starten mit `./gradlew app-restart` |
| `podman machine` startet nicht / `no machine` | Podman-Maschine fehlt: `podman machine init`, dann `podman machine start` |
| Port 5434 belegt | Ein anderer Container nutzt ihn; `hostPort` in `podman/local-dev/pod-postgres.yaml` und die URL in `application.yaml` (`DOODLE_DB_URL`) anpassen |
| Sonstiger Fehler beim Start | `build/app/app.log` ansehen |

Für die Backend-Tests (`./gradlew build`) muss Testcontainers Podman finden. Unter macOS dafür einmalig
`sudo podman-mac-helper install` ausführen und die Podman-Maschine neu starten (`podman machine stop`,
`podman machine start`). Zum reinen Spielen ist das nicht nötig.

## Highscores

Tabelle `highscore` (`name` als Primärschlüssel, `score`, `achieved_at`). Pro Name wird nur der beste
Wert gespeichert; ein schlechteres Ergebnis ändert nichts (`INSERT … ON CONFLICT … WHERE score <`).
Namen werden getrimmt, sind max. 20 Zeichen lang und unterscheiden Groß-/Kleinschreibung.

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/api/v1/highscores` | Top 10, beste zuerst |
| `POST` | `/api/v1/highscores` | `{"name": "...", "score": 123}` → bester Wert, `newBest`, `rank` |

Swagger UI: http://localhost:9000/openapi/swagger-ui.html

## Gradle-Tasks für die lokale Entwicklung

| Task | Zweck |
|---|---|
| `app-start` | Baut das Jar und startet die App im Hintergrund (Profil `local`), wartet bis sie erreichbar ist. Log: `build/app/app.log` |
| `app-stop` | Stoppt die App |
| `app-restart` | Stoppen, neu bauen, starten |
| `db-create` | Legt die leere Datenbank an; die Tabelle erzeugt Liquibase beim nächsten App-Start |
| `db-drop` | Löscht die Datenbank samt aller Highscores (trennt offene Verbindungen) |
| `db-recreate` | `db-drop` + `db-create`, danach `app-restart` |
| `pods-start` / `pods-stop` / `pods-clear` | Postgres-Pod starten / stoppen / samt Daten entfernen |

Highscores zurücksetzen: `./gradlew db-recreate app-restart`. Mit `-PskipFrontend` geht der Start schneller,
dann fehlt aber das Spiel im Jar (nur API).

Alternativ im Vordergrund: `./gradlew bootRun --args='--spring.profiles.active=local'`.

Ohne Pod: `./gradlew bootTestRun` startet gegen eine Testcontainers-Postgres (Daten weg nach Neustart).

Frontend mit Hot Reload (Backend muss laufen, `/api` wird auf Port 9000 weitergeleitet):

```sh
cd frontend && npm install && npm run dev
```

## Bauen und testen

```sh
./gradlew build                 # Backend + Frontend (Node wird von Gradle geladen) + alle Tests
./gradlew build -PskipFrontend  # nur Backend
cd frontend && npm test         # nur Spiellogik-Tests (vitest)
```

Die Backend-Tests brauchen eine laufende Podman-Machine (Testcontainers).

## Struktur

| Pfad | Inhalt |
|---|---|
| `src/main/java/de/imp/doodlejump/rest/v1` | REST-Controller und DTOs |
| `src/main/java/de/imp/doodlejump/domain`, `repo` | Highscore-Logik, JDBC-Zugriff |
| `src/main/java/de/imp/doodlejump/frontend` | Auslieferung des Frontends inkl. Content-Security-Policy |
| `src/main/resources/db/changelog` | Liquibase-Changelog |
| `frontend/src/game/engine.ts` | Spiellogik (Physik, Plattformen, Monster), ohne DOM |
| `frontend/src/game/render.ts` | Zeichnen auf dem Canvas |
| `frontend/src/ui` | Screens: Highscores, Spiel, Game Over |
