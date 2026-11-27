# Kurzbefehle für App und Datenbank als Container (compose.yaml), siehe README, "Als Container".
# Mit Docker statt Podman:  make start COMPOSE="docker compose"
#
# Die Befehle laufen in sh (macOS/Linux) und in cmd.exe (Windows, GNU make z. B. per
# winget install ezwinports.make), daher nur einfache Aufrufe und Ausgaben ohne Umlaute,
# Klammern, Anführungszeichen und Zeichen wie > | & ;

COMPOSE ?= podman compose
# Ohne den Hinweis ">>>> Executing external compose provider ..." von podman compose.
export PODMAN_COMPOSE_WARNING_LOGS = false

# Nur für die Meldungen: der Port selbst kommt aus compose.yaml (DOODLE_PORT, Standard 9443).
URL = https://localhost:$(or $(DOODLE_PORT),9443)

.PHONY: help start stop status logs db-create db-drop db-recreate

help:
	@echo make start        App und Datenbank bauen und starten, auch nach Code-Aenderungen
	@echo make stop         stoppen, die Highscores bleiben erhalten
	@echo make status       Container und ihr Zustand
	@echo make logs         Log der App verfolgen, Strg+C beendet
	@echo make db-create    nur die Datenbank starten, beim ersten Mal leer
	@echo make db-drop      alles stoppen und die Datenbank samt Highscores loeschen
	@echo make db-recreate  db-drop und start: frische, leere Datenbank

# Jeder Befehl endet mit einer Info-Zeile. Sie erscheint nur, wenn alles davor geklappt hat:
# make bricht beim ersten Fehler ab.

# --wait: kehrt erst zurück, wenn die App healthy ist (oder meldet den Fehler).
start:
	$(COMPOSE) up -d --build --wait
	@echo Info: App und Datenbank laufen, Spiel unter $(URL)

stop:
	$(COMPOSE) down
	@echo Info: App und Datenbank gestoppt, die Highscores bleiben erhalten. Wieder starten mit make start

status:
	$(COMPOSE) ps
	@echo Info: Oben die Container von imp-doodle-jump. Keine Zeile unter der Kopfzeile = nichts gestartet

# Hier steht die Info vorne: logs -f läuft bis Strg+C, danach bricht make ab.
logs:
	@echo Info: Log der App folgt. Strg+C beendet nur die Anzeige, die App laeuft weiter
	$(COMPOSE) logs -f app

# Die Tabellen legt Liquibase beim Start der App an.
db-create:
	$(COMPOSE) up -d --wait db
	@echo Info: Datenbank laeuft, die App ist nicht gestartet. Die Tabellen legt die App bei make start an

# Entfernt die Container und das Volume db-data, also alle Highscores.
db-drop:
	$(COMPOSE) down -v
	@echo Info: App und Datenbank gestoppt, die Datenbank samt Highscores ist geloescht

db-recreate: db-drop start
	@echo Info: Datenbank neu angelegt und leer, Spiel unter $(URL)
