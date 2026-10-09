package de.imp.doodlejump.domain;

import java.time.Instant;

/**
 * Best score of one player; the name is the key.
 */
public record Highscore(String name, int score, Instant achievedAt) {

}
