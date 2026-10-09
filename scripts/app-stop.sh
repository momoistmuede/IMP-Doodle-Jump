#!/usr/bin/env bash
# Stops the app started by ./gradlew app-start.

APP_JAR="$(pwd)/build/app/imp-doodle-jump.jar"

PIDS=$(pgrep -f "$APP_JAR")
if [ -z "$PIDS" ]; then
  echo "App is not running"
  exit 0
fi

kill $PIDS
for i in $(seq 1 30); do
  if ! pgrep -f "$APP_JAR" >/dev/null; then
    echo "App stopped"
    exit 0
  fi
  sleep 1
done
echo "App did not stop within 30s, killing it"
kill -9 $PIDS
