package de.imp.doodlejump.domain;

import de.imp.doodlejump.repo.HighscoreRepository;
import java.time.Clock;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HighscoreService {

  /** Entries shown on the start screen. */
  public static final int TOP_LIMIT = 10;

  private final HighscoreRepository repository;
  private final Clock clock;

  /** The best players, each with their skin (if saved). */
  public List<TopEntry> top() {
    return repository.findTop(TOP_LIMIT);
  }

  /**
   * Stores the score unless the player already has a higher (or equal) one.
   */
  @Transactional
  public SubmitResult submit(String name, int score) {
    var normalized = PlayerName.normalize(name);
    var newBest = repository.saveIfBetter(new Highscore(normalized, score, clock.instant()));
    var best = repository.findByName(normalized).orElseThrow();
    return new SubmitResult(best, newBest, repository.rankOf(best.score()));
  }
}
