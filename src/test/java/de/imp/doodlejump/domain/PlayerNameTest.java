package de.imp.doodlejump.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PlayerNameTest {

  @Test
  void normalizeNameTrimsAndCollapsesWhitespace() {
    assertThat(PlayerName.normalize("  Max   Mustermann \t")).isEqualTo("Max Mustermann");
    assertThat(PlayerName.normalize("Max")).isEqualTo("Max");
  }

  @Test
  void validNamesHaveOneToTwentyCharacters() {
    assertThat(PlayerName.isValid("")).isFalse();
    assertThat(PlayerName.isValid("M")).isTrue();
    assertThat(PlayerName.isValid("x".repeat(20))).isTrue();
    assertThat(PlayerName.isValid("x".repeat(21))).isFalse();
  }
}
