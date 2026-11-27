# Multi-stage build: backend and frontend are compiled inside the container, the host needs neither a JDK
# nor Node.js. Usually started together with the database via compose.yaml (see README, "Als Container").
#
#   podman build -t imp-doodle-jump .                          image for this machine
#   podman build --platform linux/amd64 -t imp-doodle-jump .   image for an x86 server, e.g. from Apple Silicon

# --- Build ---------------------------------------------------------------------------------------------------
# Runs on the build machine's own platform even when building for another one: the jar is platform-independent,
# only the runtime image below has to match the target.
FROM --platform=$BUILDPLATFORM docker.io/library/eclipse-temurin:21-jdk AS build
WORKDIR /src

COPY gradlew settings.gradle build.gradle ./
COPY gradle/wrapper gradle/wrapper
COPY frontend frontend
COPY src/main src/main

# Gradle (incl. its Node.js download) and npm keep their caches between builds, outside the image.
# "sh ./gradlew": a checkout on Windows has no executable bit, the build context then neither.
RUN --mount=type=cache,target=/root/.gradle \
    --mount=type=cache,target=/root/.npm \
    sh ./gradlew --no-daemon bootJar

# --- Runtime -------------------------------------------------------------------------------------------------
FROM docker.io/library/eclipse-temurin:21-jre
WORKDIR /app

RUN useradd --system --no-create-home --shell /usr/sbin/nologin doodle
COPY --from=build /src/build/libs/imp-doodle-jump.jar app.jar
USER doodle

EXPOSE 9000

# Profile prod: HTTPS on 9000 with the bundled self-signed certificate (application-prod.yaml).
ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java", "-jar", "app.jar"]
