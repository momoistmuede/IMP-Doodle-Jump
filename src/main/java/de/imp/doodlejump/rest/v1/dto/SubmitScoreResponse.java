package de.imp.doodlejump.rest.v1.dto;

import de.imp.doodlejump.domain.SubmitResult;

public record SubmitScoreResponse(HighscoreDto best, boolean newBest, int rank) {

  public static SubmitScoreResponse of(SubmitResult result) {
    return new SubmitScoreResponse(HighscoreDto.of(result.best()), result.newBest(), result.rank());
  }
}
