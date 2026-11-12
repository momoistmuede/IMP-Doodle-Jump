package de.imp.doodlejump.domain;

/**
 * Player names as used for highscores and skins: trimmed, inner whitespace collapsed, so "Max  "
 * and "Max" are the same player in both tables.
 */
public final class PlayerName {

  /** Matches the name columns in db/changelog. */
  public static final int MAX_LENGTH = 20;

  private PlayerName() {
  }

  public static String normalize(String name) {
    return name.strip().replaceAll("\\s+", " ");
  }

  /** Whether the normalized name is a valid player name (1 to {@link #MAX_LENGTH} characters). */
  public static boolean isValid(String normalized) {
    return !normalized.isEmpty() && normalized.length() <= MAX_LENGTH;
  }
}
