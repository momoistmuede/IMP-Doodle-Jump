package de.imp.doodlejump.exception;

/**
 * A single bean-validation error.
 *
 * @param path dot-notation path to the problematic field
 * @param message validation message describing the error
 */
public record FieldErrorDto(String path, String message) {

}
