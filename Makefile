# Kurzbefehle für App und Datenbank als Container (compose.yaml), siehe README, "Als Container".
# Mit Docker statt Podman:  make start CONTAINER=docker
#
# Die Befehle laufen in sh (macOS/Linux) und in cmd.exe (Windows, GNU make z. B. per
# winget install ezwinports.make), daher nur einfache Aufrufe und Ausgaben ohne Umlaute,
# Klammern, Anführungszeichen und Zeichen wie > | & ;

CONTAINER ?= podman
COMPOSE ?= $(CONTAINER) compose
# Muss zu name: in compose.yaml passen.
PROJECT = imp-doodle-jump
# Ohne den Hinweis ">>>> Executing external compose provider ..." von podman compose.
export PODMAN_COMPOSE_WARNING_LOGS = false

# Nur für die Meldungen: der Port selbst kommt aus compose.yaml (DOODLE_PORT, Standard 9443).
# compose liest DOODLE_PORT auch aus .env, daher hier ebenso (KEY=wert ist auch make-Syntax).
-include .env
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
#
# stop und db-drop räumen nach "compose down" zusätzlich direkt mit podman auf. podman compose
# übergibt an docker-compose oder podman-compose; hat das eine die Container gestartet, findet
# "down" des anderen sie nicht und meldet trotzdem Erfolg. Beide setzen aber das Label
# com.docker.compose.project, und Volume und Netzwerk heißen bei beiden gleich. Das Netzwerk muss
# mit weg: das von podman-compose fehlt ein Label, mit dem docker-compose danach nicht mehr startet.
# Docker hat nur ein Compose, dort reicht down.

# --wait: kehrt erst zurück, wenn die App healthy ist (oder meldet den Fehler).
start:
	$(COMPOSE) up -d --build --wait
	@echo Info: App und Datenbank laufen, Spiel unter $(URL)

stop:
	$(COMPOSE) down
ifeq ($(CONTAINER),podman)
	podman rm -f --depend --filter label=com.docker.compose.project=$(PROJECT)
	podman network rm -f $(PROJECT)_default
endif
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
ifeq ($(CONTAINER),podman)
	podman rm -f --depend --filter label=com.docker.compose.project=$(PROJECT)
	podman network rm -f $(PROJECT)_default
endif
	$(CONTAINER) volume rm -f $(PROJECT)_db-data
	@echo Info: App und Datenbank gestoppt, die Datenbank samt Highscores ist geloescht

db-recreate: db-drop start
	@echo Info: Datenbank neu angelegt und leer, Spiel unter $(URL)
