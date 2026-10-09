package de.imp.doodlejump.exception;

import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Maps exceptions to JSON responses the frontend can parse with {@code response.json()}.
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

  private static final String GENERIC_ERROR_MESSAGE = "An unexpected error occurred.";

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<List<FieldErrorDto>> handleValidation(MethodArgumentNotValidException ex) {
    List<FieldErrorDto> errors = ex.getBindingResult()
        .getAllErrors()
        .stream()
        .map(err -> {
          if (err instanceof FieldError fe) {
            return new FieldErrorDto(fe.getField(), fe.getDefaultMessage());
          }
          return new FieldErrorDto(err.getObjectName(), err.getDefaultMessage());
        })
        .toList();
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT).body(errors);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponseDto> handleUnreadable(HttpMessageNotReadableException ex) {
    log.debug("Unreadable request body: {}", ex.getMessage());
    return createErrorResponse(HttpStatus.BAD_REQUEST, "Malformed request body.");
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ErrorResponseDto> handleNoResource(NoResourceFoundException ex) {
    return createErrorResponse(HttpStatus.NOT_FOUND, "Not found.");
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponseDto> handleGlobalException(Exception ex) {
    log.error("Unhandled exception: ", ex);
    return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, GENERIC_ERROR_MESSAGE);
  }

  private ResponseEntity<ErrorResponseDto> createErrorResponse(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(new ErrorResponseDto(message));
  }
}
