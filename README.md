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

## Highscores

Tabelle `highscore` (`name` als Primärschlüssel, `score`, `achieved_at`). Pro Name wird nur der beste
Wert gespeichert; ein schlechteres Ergebnis ändert nichts (`INSERT … ON CONFLICT … WHERE score <`).
Namen werden getrimmt, sind max. 20 Zeichen lang und unterscheiden Groß-/Kleinschreibung.

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/api/v1/highscores` | Top 10, beste zuerst |
| `POST` | `/api/v1/highscores` | `{"name": "...", "score": 123}` → bester Wert, `newBest`, `rank` |

Swagger UI: http://localhost:9000/openapi/swagger-ui.html

## Lokal starten

```sh
./gradlew pods-create   # einmalig: Postgres-Pod auf localhost:5434 (DB imp_doodle_jump)
./gradlew app-start     # baut und startet die App im Hintergrund → http://localhost:9000
```

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
