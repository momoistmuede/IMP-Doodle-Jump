package de.imp.doodlejump.rest.v1;

import de.imp.doodlejump.domain.PlayerName;
import de.imp.doodlejump.domain.PlayerSkinService;
import de.imp.doodlejump.exception.InvalidPlayerNameException;
import de.imp.doodlejump.rest.v1.dto.SkinDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Skin of a player, keyed by the player name like the highscore. There is no login: whoever types
 * a name can change its skin, just as anyone can submit scores under any name.
 */
@RestController
@RequestMapping("/api/v1/players/{name}/skin")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Players", description = "Look of the player figure per name")
public class PlayerController {

  private final PlayerSkinService service;

  @GetMapping
  @Operation(summary = "The saved skin of a player; 404 if the name has none")
  public ResponseEntity<SkinDto> skin(@PathVariable String name) {
    validate(name);
    return service.find(name)
        .map(skin -> ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(SkinDto.of(skin)))
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PutMapping
  @Operation(summary = "Create or replace the skin of a player")
  public SkinDto save(@PathVariable String name, @Valid @RequestBody SkinDto skin) {
    validate(name);
    log.info("Skin saved for '{}'", PlayerName.normalize(name));
    return SkinDto.of(service.save(name, skin.toSkin()));
  }

  private static void validate(String name) {
    if (!PlayerName.isValid(PlayerName.normalize(name))) {
      throw new InvalidPlayerNameException();
    }
  }
}
