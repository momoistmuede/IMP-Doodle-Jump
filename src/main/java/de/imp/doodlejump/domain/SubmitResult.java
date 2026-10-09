package de.imp.doodlejump.domain;

/**
 * Outcome of submitting a score.
 *
 * @param best the player's best score after the submission
 * @param newBest whether the submitted score replaced the previous best (or is the first entry)
 * @param rank 1-based position of the player's best score in the list
 */
public record SubmitResult(Highscore best, boolean newBest, int rank) {

}
