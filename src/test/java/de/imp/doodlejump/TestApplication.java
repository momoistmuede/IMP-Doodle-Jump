package de.imp.doodlejump;

import org.springframework.boot.SpringApplication;

/**
 * Local development without the podman pod: {@code ./gradlew bootTestRun} starts the service
 * against a Testcontainers PostgreSQL (highscores are gone after a restart).
 */
public class TestApplication {

  public static void main(String[] args) {
    SpringApplication.from(Application::main).with(TestcontainersConfiguration.class).run(args);
  }
}
