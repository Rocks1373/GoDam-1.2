package com.godam.security;

import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class MaliciousContentScanner {
  private static final Pattern GOOGLE_MAPS_PATTERN = Pattern.compile(
      "(?i)(https://maps\\.google\\.com/\\S*|https://www\\.google\\.com/maps/\\S*|https://goo\\.gl/maps/\\S*|https://maps\\.app\\.goo\\.gl/\\S*)");

  public ScanResult scan(String columnName, String value, ColumnPolicy policy) {
    if (value == null) {
      return ScanResult.safe();
    }
    String trimmed = value.trim();
    if (trimmed.isEmpty()) {
      return ScanResult.safe();
    }

    if (containsGoogleMapsLink(trimmed)) {
      if (!policy.isAllowGoogleMaps()) {
        return ScanResult.blocked(
            ErrorType.SECURITY,
            ErrorSeverity.DANGER,
            "Google Maps URL in restricted column");
      }
      trimmed = removeGoogleMaps(trimmed);
      if (trimmed.isEmpty()) {
        return ScanResult.safe();
      }
    }

    String normalized = trimmed.toLowerCase(Locale.ROOT);

    char first = trimmed.charAt(0);
    if (first == '=' || first == '+' || first == '@') {
      return ScanResult.blocked(
          ErrorType.SECURITY,
          ErrorSeverity.DANGER,
          "Formula-style value is not allowed");
    }
    if (first == '-' && !policy.isAllowLeadingDash()) {
      return ScanResult.blocked(
          ErrorType.SECURITY,
          ErrorSeverity.DANGER,
          "Formula-style value is not allowed");
    }

    if (normalized.contains("<script")
        || normalized.contains("javascript:")
        || normalized.contains("onerror=")
        || normalized.contains("onload=")) {
      return ScanResult.blocked(
          ErrorType.SECURITY,
          ErrorSeverity.DANGER,
          "Script injection pattern detected");
    }

    if (normalized.contains("' or 1=1")
        || normalized.contains("union select")
        || normalized.contains("drop table")
        || normalized.contains(";--")
        || normalized.contains("--")) {
      return ScanResult.blocked(
          ErrorType.SECURITY,
          ErrorSeverity.DANGER,
          "SQL injection pattern detected");
    }

    if (normalized.contains("rm -rf")
        || normalized.contains("curl ")
        || normalized.contains("wget ")
        || normalized.contains("powershell")
        || normalized.contains("cmd.exe")) {
      return ScanResult.blocked(
          ErrorType.SECURITY,
          ErrorSeverity.DANGER,
          "Command injection pattern detected");
    }

    return ScanResult.safe();
  }

  private boolean containsGoogleMapsLink(String value) {
    return GOOGLE_MAPS_PATTERN.matcher(value).find();
  }

  private String removeGoogleMaps(String value) {
    return GOOGLE_MAPS_PATTERN.matcher(value).replaceAll("").trim();
  }
}
