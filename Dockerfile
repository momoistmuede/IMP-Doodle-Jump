FROM eclipse-temurin:21-jre
WORKDIR /app

COPY build/libs/imp-doodle-jump.jar app.jar
COPY src/main/resources/application-prod.yaml /app/
COPY src/main/resources/server.crt src/main/resources/server.key /app/

EXPOSE 9000

ENV SPRING_PROFILES_ACTIVE=prod
CMD ["java", "-jar", "app.jar"]
