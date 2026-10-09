#!/usr/bin/env bash
# Creates the empty database; the app creates the tables on startup (Liquibase).
source ./podman/scripts/functions.sh
requirePostgres

EXISTS=$(podman exec "$POSTGRES_CONTAINER" psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'")
if [ "$EXISTS" = "1" ]; then
  echo "Database $DB_NAME already exists"
  exit 0
fi
podman exec "$POSTGRES_CONTAINER" createdb -U postgres -e "$DB_NAME" || exit 1
echo "Database $DB_NAME created. Tables are created on the next app start (./gradlew app-restart)."
