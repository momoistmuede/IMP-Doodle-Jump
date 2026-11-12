package de.imp.doodlejump.rest.v1.dto;

import de.imp.doodlejump.domain.Skin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Look of the player figure. Colours are {@code #rrggbb} (lower case), accessories an id or "none".
 */
public record SkinDto(
    @NotNull @Pattern(regexp = COLOR) String body,
    @NotNull @Pattern(regexp = COLOR) String shirt,
    @NotNull @Pattern(regexp = COLOR) String tentacles,
    @NotNull @Pattern(regexp = ACCESSORY) String hat,
    @NotNull @Pattern(regexp = ACCESSORY) String glasses) {

  static final String COLOR = "^#[0-9a-f]{6}$";
  static final String ACCESSORY = "^[a-z0-9-]{1,20}$";

  public static SkinDto of(Skin skin) {
    return skin == null ? null : new SkinDto(skin.body(), skin.shirt(), skin.tentacles(), skin.hat(), skin.glasses());
  }

  public Skin toSkin() {
    return new Skin(body, shirt, tentacles, hat, glasses);
  }
}
