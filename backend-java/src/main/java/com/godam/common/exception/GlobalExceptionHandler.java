package com.godam.common.exception;

import com.godam.security.ErrorSeverity;
import com.godam.security.ErrorType;
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
    // Log the actual exception for debugging
    System.err.println("Unhandled exception: " + ex.getClass().getName() + ": " + ex.getMessage());
    ex.printStackTrace();
    return build(HttpStatus.INTERNAL_SERVER_ERROR, "Error: " + ex.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(BusinessSecurityException.class)
  public ResponseEntity<MaliciousUploadError> handleSecurity(
      BusinessSecurityException ex, HttpServletRequest request) {
    MaliciousUploadError response = new MaliciousUploadError();
    response.setStatus("BLOCKED_MALICIOUS_UPLOAD");
    response.setError_type(
        ex.getErrorType() != null ? ex.getErrorType().name() : ErrorType.SECURITY.name());
    response.setError_severity(
        ex.getErrorSeverity() != null ? ex.getErrorSeverity().name() : ErrorSeverity.DANGER.name());
    response.setColumn(ex.getColumn());
    response.setReason(ex.getReason());
    response.setRow(ex.getRow());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
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

  public static class MaliciousUploadError {
    private String status;
    private String error_type;
    private String error_severity;
    private String column;
    private String reason;
    private Integer row;

    public String getStatus() {
      return status;
    }

    public void setStatus(String status) {
      this.status = status;
    }

    public String getError_type() {
      return error_type;
    }

    public void setError_type(String error_type) {
      this.error_type = error_type;
    }

    public String getError_severity() {
      return error_severity;
    }

    public void setError_severity(String error_severity) {
      this.error_severity = error_severity;
    }

    public String getColumn() {
      return column;
    }

    public void setColumn(String column) {
      this.column = column;
    }

    public String getReason() {
      return reason;
    }

    public void setReason(String reason) {
      this.reason = reason;
    }

    public Integer getRow() {
      return row;
    }

    public void setRow(Integer row) {
      this.row = row;
    }
  }
}
