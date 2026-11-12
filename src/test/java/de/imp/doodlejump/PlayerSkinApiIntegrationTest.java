package de.imp.doodlejump;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class PlayerSkinApiIntegrationTest {

  private static final String SKIN = """
      {"body":"#cfe25b","shirt":"#9fb53a","tentacles":"#5f5f5f","hat":"headset","glasses":"none"}""";

  private final HttpClient http = HttpClient.newHttpClient();

  @LocalServerPort
  private int port;

  @Autowired
  private JdbcClient jdbc;

  @BeforeEach
  void clearTables() {
    jdbc.sql("DELETE FROM player_skin").update();
    jdbc.sql("DELETE FROM highscore").update();
  }

  @Test
  @DisplayName("a skin is created, read and overwritten")
  void createReadOverwrite() throws Exception {
    assertThat(put("Max", SKIN).statusCode()).isEqualTo(200);
    assertThat(get("Max").body()).contains("\"hat\":\"headset\"", "\"body\":\"#cfe25b\"");

    assertThat(put("Max", SKIN.replace("headset", "krone")).statusCode()).isEqualTo(200);
    assertThat(get("Max").body()).contains("\"hat\":\"krone\"");
    assertThat(jdbc.sql("SELECT count(*) FROM player_skin").query(Integer.class).single()).isEqualTo(1);
  }

  @Test
  @DisplayName("an unknown name has no skin")
  void unknownName() throws Exception {
    assertThat(get("Niemand").statusCode()).isEqualTo(404);
  }

  @Test
  @DisplayName("names are normalized like for highscores")
  void normalization() throws Exception {
    put("Max  Mustermann ", SKIN);
    assertThat(get("Max Mustermann").statusCode()).isEqualTo(200);
    assertThat(get(" Max   Mustermann").statusCode()).isEqualTo(200);
  }

  @Test
  @DisplayName("invalid colours, accessories and names are rejected")
  void validation() throws Exception {
    assertThat(put("Max", SKIN.replace("#cfe25b", "#CFE25B")).statusCode()).isEqualTo(422);
    assertThat(put("Max", SKIN.replace("#cfe25b", "red")).statusCode()).isEqualTo(422);
    assertThat(put("Max", SKIN.replace("headset", "Head Set")).statusCode()).isEqualTo(422);
    assertThat(put("Max", SKIN.replace(",\"glasses\":\"none\"", "")).statusCode()).isEqualTo(422);
    assertThat(put("x".repeat(21), SKIN).statusCode()).isEqualTo(422);
    assertThat(put("   ", SKIN).statusCode()).isEqualTo(422);
    assertThat(put("Max", "kaputt").statusCode()).isEqualTo(400);
  }

  @Test
  @DisplayName("the highscore list brings the skin of each player, or null")
  void highscoresWithSkin() throws Exception {
    post("{\"name\":\"Anna\",\"score\":500}");
    post("{\"name\":\"Ben\",\"score\":300}");
    put("Anna", SKIN);

    var body = send(HttpRequest.newBuilder(uri("/api/v1/highscores")).GET()).body();
    assertThat(body).contains("\"name\":\"Anna\"", "\"hat\":\"headset\"");
    assertThat(body.substring(body.indexOf("\"name\":\"Ben\""))).contains("\"skin\":null");
  }

  private HttpResponse<String> get(String name) throws IOException, InterruptedException {
    return send(HttpRequest.newBuilder(skinUri(name)).GET());
  }

  private HttpResponse<String> put(String name, String json) throws IOException, InterruptedException {
    return send(HttpRequest.newBuilder(skinUri(name))
        .header("Content-Type", "application/json")
        .PUT(HttpRequest.BodyPublishers.ofString(json)));
  }

  private void post(String json) throws IOException, InterruptedException {
    var response = send(HttpRequest.newBuilder(uri("/api/v1/highscores"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(json)));
    assertThat(response.statusCode()).isEqualTo(200);
  }

  private URI skinUri(String name) {
    return uri("/api/v1/players/" + URLEncoder.encode(name, StandardCharsets.UTF_8).replace("+", "%20") + "/skin");
  }

  private URI uri(String path) {
    return URI.create("http://localhost:" + port + path);
  }

  private HttpResponse<String> send(HttpRequest.Builder request) throws IOException, InterruptedException {
    return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
  }
}
