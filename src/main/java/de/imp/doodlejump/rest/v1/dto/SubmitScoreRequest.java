package de.imp.doodlejump.rest.v1.dto;

import de.imp.doodlejump.domain.PlayerName;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubmitScoreRequest(
    @NotBlank @Size(max = SubmitScoreRequest.MAX_NAME_LENGTH) String name,
    @NotNull @Min(0) @Max(SubmitScoreRequest.MAX_SCORE) Integer score) {

  /** Matches the column length in db/changelog/changes/001-highscore.xml. */
  public static final int MAX_NAME_LENGTH = PlayerName.MAX_LENGTH;
  public static final int MAX_SCORE = 10_000_000;
}
