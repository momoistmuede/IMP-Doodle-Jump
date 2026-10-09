package de.imp.doodlejump.repo;

import de.imp.doodlejump.domain.Highscore;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class HighscoreRepository {

  static final RowMapper<Highscore> MAPPER = (rs, i) -> new Highscore(
      rs.getString("name"), rs.getInt("score"), rs.getObject("achieved_at", OffsetDateTime.class).toInstant());

  private final JdbcClient jdbc;

  /**
   * Inserts the entry or raises the stored score; a lower or equal score leaves the row untouched.
   *
   * @return whether the row was written
   */
  public boolean saveIfBetter(Highscore entry) {
    return jdbc.sql("""
            INSERT INTO highscore (name, score, achieved_at)
            VALUES (:name, :score, :achievedAt)
            ON CONFLICT (name) DO UPDATE
               SET score = EXCLUDED.score,
                   achieved_at = EXCLUDED.achieved_at
             WHERE highscore.score < EXCLUDED.score
            """)
        .param("name", entry.name())
        .param("score", entry.score())
        .param("achievedAt", entry.achievedAt().atOffset(ZoneOffset.UTC))
        .update() == 1;
  }

  public Optional<Highscore> findByName(String name) {
    return jdbc.sql("SELECT * FROM highscore WHERE name = :name")
        .param("name", name)
        .query(MAPPER)
        .optional();
  }

  /** Ties are ordered by who got there first. */
  public List<Highscore> findTop(int limit) {
    return jdbc.sql("SELECT * FROM highscore ORDER BY score DESC, achieved_at, name LIMIT :limit")
        .param("limit", limit)
        .query(MAPPER)
        .list();
  }

  /** 1-based rank of a score: one more than the number of strictly better scores. */
  public int rankOf(int score) {
    return jdbc.sql("SELECT count(*) + 1 FROM highscore WHERE score > :score")
        .param("score", score)
        .query(Integer.class)
        .single();
  }
}
