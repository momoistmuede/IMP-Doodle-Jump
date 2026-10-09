package de.imp.doodlejump.rest.v1;

import de.imp.doodlejump.domain.HighscoreService;
import de.imp.doodlejump.rest.v1.dto.HighscoreDto;
import de.imp.doodlejump.rest.v1.dto.SubmitScoreRequest;
import de.imp.doodlejump.rest.v1.dto.SubmitScoreResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/highscores")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Highscores", description = "Best score per player")
public class HighscoreController {

  private final HighscoreService service;

  @GetMapping
  @Operation(summary = "The ten best players, best first")
  public ResponseEntity<List<HighscoreDto>> top() {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .body(service.top().stream().map(HighscoreDto::of).toList());
  }

  @PostMapping
  @Operation(summary = "Submit a score; only stored if it beats the player's previous best")
  public SubmitScoreResponse submit(@Valid @RequestBody SubmitScoreRequest request) {
    var result = service.submit(request.name(), request.score());
    log.info("Score {} for '{}' (new best: {}, rank {})", request.score(), result.best().name(), result.newBest(),
        result.rank());
    return SubmitScoreResponse.of(result);
  }
}
