package de.imp.doodlejump.repo;

import de.imp.doodlejump.domain.Skin;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class PlayerSkinRepository {

  /** Maps the skin columns; {@code null} when a LEFT JOIN found no skin. */
  static final RowMapper<Skin> MAPPER = (rs, i) -> rs.getString("body_color") == null ? null : new Skin(
      rs.getString("body_color"), rs.getString("shirt_color"), rs.getString("tentacle_color"),
      rs.getString("hat"), rs.getString("glasses"));

  private final JdbcClient jdbc;

  /** Inserts the skin or overwrites the stored one. */
  public void save(String name, Skin skin, Instant updatedAt) {
    jdbc.sql("""
            INSERT INTO player_skin (name, body_color, shirt_color, tentacle_color, hat, glasses, updated_at)
            VALUES (:name, :body, :shirt, :tentacles, :hat, :glasses, :updatedAt)
            ON CONFLICT (name) DO UPDATE
               SET body_color = EXCLUDED.body_color,
                   shirt_color = EXCLUDED.shirt_color,
                   tentacle_color = EXCLUDED.tentacle_color,
                   hat = EXCLUDED.hat,
                   glasses = EXCLUDED.glasses,
                   updated_at = EXCLUDED.updated_at
            """)
        .param("name", name)
        .param("body", skin.body())
        .param("shirt", skin.shirt())
        .param("tentacles", skin.tentacles())
        .param("hat", skin.hat())
        .param("glasses", skin.glasses())
        .param("updatedAt", updatedAt.atOffset(ZoneOffset.UTC))
        .update();
  }

  public Optional<Skin> findByName(String name) {
    return jdbc.sql("SELECT * FROM player_skin WHERE name = :name")
        .param("name", name)
        .query(MAPPER)
        .optional();
  }
}
