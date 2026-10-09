#!/usr/bin/env bash
# Starts the app in the background with profile local (database: ./gradlew pods-create).
# Runs a copy of the jar, so a later build can't replace the jar under the running app.

PORT=9000
JAR=build/libs/imp-doodle-jump.jar
APP_JAR="$(pwd)/build/app/imp-doodle-jump.jar"
LOG_FILE=build/app/app.log
JAVA_BIN=${JAVA_BIN:-java}

if pgrep -f "$APP_JAR" >/dev/null; then
  echo "App is already running (log: $LOG_FILE). Restart with ./gradlew app-restart"
  exit 0
fi
if lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is already in use by another process:"
  lsof -iTCP:$PORT -sTCP:LISTEN
  exit 1
fi

mkdir -p build/app
cp "$JAR" "$APP_JAR"
nohup "$JAVA_BIN" -jar "$APP_JAR" --spring.profiles.active=local > "$LOG_FILE" 2>&1 < /dev/null &
PID=$!
echo "Starting app (PID $PID), log: $LOG_FILE"

for i in $(seq 1 60); do
  if curl -fs "http://localhost:$PORT/actuator/health" >/dev/null; then
    echo "App is up: http://localhost:$PORT"
    exit 0
  fi
  if ! kill -0 $PID 2>/dev/null; then
    echo "App exited during startup (database running? ./gradlew pods-start). Root cause, full log in $LOG_FILE:"
    CAUSE=$(grep -E '^Caused by:' "$LOG_FILE" | tail -1)
    if [ -n "$CAUSE" ]; then echo "$CAUSE"; else tail -10 "$LOG_FILE"; fi
    exit 1
  fi
  sleep 1
done
echo "App did not become healthy within 60s, see $LOG_FILE"
exit 1
