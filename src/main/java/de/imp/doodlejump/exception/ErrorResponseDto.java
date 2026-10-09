package de.imp.doodlejump.exception;

/**
 * JSON error envelope returned for every non-validation error response.
 *
 * @param error the user-facing error message
 */
public record ErrorResponseDto(String error) {

}
