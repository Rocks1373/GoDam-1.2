package com.godam.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class MaliciousContentScannerTest {
  private final MaliciousContentScanner scanner = new MaliciousContentScanner();

  @Test
  void allowsPartNumberWithHyphen() {
    ColumnPolicy policy = ColumnPolicyRegistry.getPolicy("part_number");
    assertFalse(scanner.scan("part_number", "PN-100A", policy).isMalicious());
  }

  @Test
  void allowsRackWithHyphen() {
    ColumnPolicy policy = ColumnPolicyRegistry.getPolicy("rack");
    assertFalse(scanner.scan("rack", "RACK-A1", policy).isMalicious());
  }

  @Test
  void blocksOrInjection() {
    ColumnPolicy policy = ColumnPolicyRegistry.getPolicy("part_number");
    assertTrue(scanner.scan("part_number", "' OR 1=1", policy).isMalicious());
  }

  @Test
  void blocksDropStatement() {
    ColumnPolicy policy = ColumnPolicyRegistry.getPolicy("part_number");
    assertTrue(scanner.scan("part_number", "DROP TABLE stock", policy).isMalicious());
  }
}
