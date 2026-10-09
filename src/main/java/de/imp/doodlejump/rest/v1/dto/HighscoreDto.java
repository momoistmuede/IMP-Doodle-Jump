package de.imp.doodlejump.rest.v1.dto;

import de.imp.doodlejump.domain.Highscore;
import java.time.Instant;

public record HighscoreDto(String name, int score, Instant achievedAt) {

  public static HighscoreDto of(Highscore highscore) {
    return new HighscoreDto(highscore.name(), highscore.score(), highscore.achievedAt());
  }
}
