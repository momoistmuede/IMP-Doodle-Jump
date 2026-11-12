package de.imp.doodlejump.exception;

import de.imp.doodlejump.domain.PlayerName;

/** The player name in the path is empty or longer than {@link PlayerName#MAX_LENGTH} characters. */
public class InvalidPlayerNameException extends RuntimeException {

  public InvalidPlayerNameException() {
    super("must be 1 to " + PlayerName.MAX_LENGTH + " characters");
  }
}
