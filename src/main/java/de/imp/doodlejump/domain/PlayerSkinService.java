package de.imp.doodlejump.domain;

import de.imp.doodlejump.repo.PlayerSkinRepository;
import java.time.Clock;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlayerSkinService {

  private final PlayerSkinRepository repository;
  private final Clock clock;

  public Optional<Skin> find(String name) {
    return repository.findByName(PlayerName.normalize(name));
  }

  /** Creates or replaces the skin of the player. */
  public Skin save(String name, Skin skin) {
    repository.save(PlayerName.normalize(name), skin, clock.instant());
    return skin;
  }
}
