package com.godam.security;

import com.godam.common.exception.BusinessSecurityException;
import org.springframework.stereotype.Component;

@Component
public class UploadValidationPipeline {
  private final MaliciousContentScanner scanner;

  public UploadValidationPipeline(MaliciousContentScanner scanner) {
    this.scanner = scanner;
  }

  public void validate(String columnName, String value, Integer rowNumber) {
    if (value == null) {
      return;
    }
    ColumnPolicy policy = ColumnPolicyRegistry.getPolicy(columnName);
    ScanResult result = scanner.scan(columnName, value, policy);
    if (result.isMalicious()) {
      throw new BusinessSecurityException(columnName, result, rowNumber);
    }
  }
}
