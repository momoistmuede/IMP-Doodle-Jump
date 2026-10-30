package de.imp.doodlejump.domain;

/**
 * An entry of the top list with the player's skin, or {@code null} if the player never saved one.
 */
public record TopEntry(Highscore highscore, Skin skin) {

}
