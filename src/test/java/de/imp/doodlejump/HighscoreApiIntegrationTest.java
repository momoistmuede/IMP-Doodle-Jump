package de.imp.doodlejump;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.simple.JdbcClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class HighscoreApiIntegrationTest {

  private final HttpClient http = HttpClient.newHttpClient();

  @LocalServerPort
  private int port;

  @Autowired
  private JdbcClient jdbc;

  @BeforeEach
  void clearTable() {
    jdbc.sql("DELETE FROM highscore").update();
  }

  @Test
  @DisplayName("only the best score per name is kept")
  void keepsBestScorePerName() throws Exception {
    assertThat(submit("Max", 500).body()).contains("\"score\":500", "\"newBest\":true", "\"rank\":1");
    assertThat(submit("Max", 300).body()).contains("\"score\":500", "\"newBest\":false");
    assertThat(submit("Max", 500).body()).contains("\"score\":500", "\"newBest\":false");
    assertThat(submit("  Max ", 900).body()).contains("\"name\":\"Max\"", "\"score\":900", "\"newBest\":true");

    var count = jdbc.sql("SELECT count(*) FROM highscore").query(Integer.class).single();
    assertThat(count).isEqualTo(1);
  }

  @Test
  @DisplayName("the list contains at most ten entries, best first")
  void topTen() throws Exception {
    for (int i = 1; i <= 12; i++) {
      submit("Player " + i, i * 100);
    }
    assertThat(submit("Player 3", 50).body()).contains("\"rank\":10");

    var body = get("/api/v1/highscores").body();
    var names = Pattern.compile("\"name\":\"([^\"]+)\"").matcher(body).results().map(m -> m.group(1)).toList();
    assertThat(names).hasSize(10).startsWith("Player 12", "Player 11").endsWith("Player 3");
  }

  @Test
  @DisplayName("invalid submissions are rejected")
  void validation() throws Exception {
    assertThat(post("{\"name\":\"   \",\"score\":10}").statusCode()).isEqualTo(422);
    assertThat(post("{\"name\":\"" + "x".repeat(21) + "\",\"score\":10}").statusCode()).isEqualTo(422);
    assertThat(post("{\"name\":\"Max\",\"score\":-1}").statusCode()).isEqualTo(422);
    assertThat(post("{\"name\":\"Max\"}").statusCode()).isEqualTo(422);
    assertThat(post("kaputt").statusCode()).isEqualTo(400);
  }

  @Test
  @DisplayName("index.html is served with a fresh CSP nonce per request")
  void indexHtml() throws Exception {
    assumeTrue(new ClassPathResource("static/index.html").exists(), "built without frontend (-PskipFrontend)");
    var first = get("/");
    var second = get("/");
    assertThat(first.statusCode()).isEqualTo(200);
    assertThat(first.body()).contains("<div id=\"root\"></div>").doesNotContain("__CSP_NONCE__");
    var csp = first.headers().firstValue("Content-Security-Policy").orElseThrow();
    assertThat(csp).contains("script-src 'self'");
    assertThat(csp).isNotEqualTo(second.headers().firstValue("Content-Security-Policy").orElseThrow());
  }

  private HttpResponse<String> submit(String name, int score) throws IOException, InterruptedException {
    var response = post("{\"name\":\"" + name + "\",\"score\":" + score + "}");
    assertThat(response.statusCode()).isEqualTo(200);
    return response;
  }

  private HttpResponse<String> post(String json) throws IOException, InterruptedException {
    var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/highscores"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(json))
        .build();
    return http.send(request, HttpResponse.BodyHandlers.ofString());
  }

  private HttpResponse<String> get(String path) throws IOException, InterruptedException {
    var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build();
    return http.send(request, HttpResponse.BodyHandlers.ofString());
  }
}
