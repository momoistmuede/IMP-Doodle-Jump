package de.imp.doodlejump.domain;

/**
 * Look of the player figure: three colours ({@code #rrggbb}) and two accessories ("none" or an id
 * like "headset"). Which colours and accessories exist only the frontend knows, so a new hat needs
 * no backend change.
 */
public record Skin(String body, String shirt, String tentacles, String hat, String glasses) {

}
