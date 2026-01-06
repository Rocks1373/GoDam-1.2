package com.godam.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
    String message = ex.getBindingResult().getFieldErrors().stream()
        .map(this::formatFieldError)
        .collect(Collectors.joining("; "));
    return build(HttpStatus.BAD_REQUEST, message, request.getRequestURI());
  }

  @ExceptionHandler(StockValidationException.class)
  public ResponseEntity<ErrorResponse> handleStock(StockValidationException ex, HttpServletRequest request) {
    return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
    return build(HttpStatus.NOT_FOUND, ex.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(BusinessRuleException.class)
  public ResponseEntity<ErrorResponse> handleBusinessRule(BusinessRuleException ex, HttpServletRequest request) {
    return build(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
    return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
    return build(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error", request.getRequestURI());
  }

  private ResponseEntity<ErrorResponse> build(HttpStatus status, String message, String path) {
    ErrorResponse response = new ErrorResponse();
    response.setTimestamp(Instant.now().toString());
    response.setStatus(status.value());
    response.setError(status.name());
    response.setMessage(message);
    response.setPath(path);
    return ResponseEntity.status(status).body(response);
  }

  private String formatFieldError(FieldError error) {
    return error.getField() + ": " + error.getDefaultMessage();
  }

  public static class ErrorResponse {
    private String timestamp;
    private int status;
    private String error;
    private String message;
    private String path;

    public String getTimestamp() {
      return timestamp;
    }

    public void setTimestamp(String timestamp) {
      this.timestamp = timestamp;
    }

    public int getStatus() {
      return status;
    }

    public void setStatus(int status) {
      this.status = status;
    }

    public String getError() {
      return error;
    }

    public void setError(String error) {
      this.error = error;
    }

    public String getMessage() {
      return message;
    }

    public void setMessage(String message) {
      this.message = message;
    }

    public String getPath() {
      return path;
    }

    public void setPath(String path) {
      this.path = path;
    }
  }
}
