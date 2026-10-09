package de.imp.doodlejump.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class HighscoreServiceTest {

  @Test
  void normalizeNameTrimsAndCollapsesWhitespace() {
    assertThat(HighscoreService.normalizeName("  Max   Mustermann \t")).isEqualTo("Max Mustermann");
    assertThat(HighscoreService.normalizeName("Max")).isEqualTo("Max");
  }
}
