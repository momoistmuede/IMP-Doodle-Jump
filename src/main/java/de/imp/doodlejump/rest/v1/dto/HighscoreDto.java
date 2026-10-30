package de.imp.doodlejump.rest.v1.dto;

import de.imp.doodlejump.domain.Highscore;
import de.imp.doodlejump.domain.TopEntry;
import java.time.Instant;

/**
 * A highscore; {@code skin} is only filled in the top list and {@code null} for players without a
 * saved skin.
 */
public record HighscoreDto(String name, int score, Instant achievedAt, SkinDto skin) {

  public static HighscoreDto of(Highscore highscore) {
    return new HighscoreDto(highscore.name(), highscore.score(), highscore.achievedAt(), null);
  }

  public static HighscoreDto of(TopEntry entry) {
    var highscore = entry.highscore();
    return new HighscoreDto(highscore.name(), highscore.score(), highscore.achievedAt(), SkinDto.of(entry.skin()));
  }
}
