package com.godam.security;

public class ScanResult {
  private static final ScanResult SAFE = new ScanResult(false, null, null, null);

  private final boolean malicious;
  private final ErrorType errorType;
  private final ErrorSeverity errorSeverity;
  private final String reason;

  private ScanResult(boolean malicious, ErrorType errorType, ErrorSeverity errorSeverity, String reason) {
    this.malicious = malicious;
    this.errorType = errorType;
    this.errorSeverity = errorSeverity;
    this.reason = reason;
  }

  public static ScanResult safe() {
    return SAFE;
  }

  public static ScanResult blocked(ErrorType errorType, ErrorSeverity errorSeverity, String reason) {
    return new ScanResult(true, errorType, errorSeverity, reason);
  }

  public boolean isMalicious() {
    return malicious;
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
}
