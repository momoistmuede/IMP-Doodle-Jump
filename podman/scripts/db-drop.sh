#!/usr/bin/env bash
# Drops the database including all highscores; open connections (running app) are terminated.
source ./podman/scripts/functions.sh
requirePostgres

podman exec "$POSTGRES_CONTAINER" dropdb -U postgres --if-exists --force -e "$DB_NAME" || exit 1
echo "Database $DB_NAME dropped"
