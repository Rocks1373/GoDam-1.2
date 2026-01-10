package com.godam.common.exception;

import com.godam.security.ErrorSeverity;
import com.godam.security.ErrorType;
import com.godam.security.ScanResult;

public class BusinessSecurityException extends RuntimeException {
  private final String column;
  private final ErrorType errorType;
  private final ErrorSeverity errorSeverity;
  private final String reason;
  private final Integer row;

  public BusinessSecurityException(String column, ScanResult result, Integer row) {
    super(result.getReason());
    this.column = column;
    this.errorType = result.getErrorType();
    this.errorSeverity = result.getErrorSeverity();
    this.reason = result.getReason();
    this.row = row;
  }

  public String getColumn() {
    return column;
  }

  public ErrorType getErrorType() {
    return errorType;
  }

  public ErrorSeverity getErrorSeverity() {
    return errorSeverity;
  }

  public String getReason() {
    return reason;
  }

  public Integer getRow() {
    return row;
  }
}
