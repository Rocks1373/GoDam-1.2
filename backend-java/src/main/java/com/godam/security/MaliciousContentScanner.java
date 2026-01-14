package com.godam.security;

import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class MaliciousContentScanner {
  private static final Pattern GOOGLE_MAPS_PATTERN = Pattern.compile(
      "(?i)(https://maps\\.google\\.com/\\S*|https://www\\.google\\.com/maps/\\S*|https://goo\\.gl/maps/\\S*|https://maps\\.app\\.goo\\.gl/\\S*)");
  private static final Pattern SQL_INJECTION_PATTERN =
      Pattern.compile(
          "(?i)(\\b(select|insert|update|delete|drop|union|truncate|alter)\\b.*\\b(from|into|set|table)\\b|--|/\\*|\\*/)");
  private static final Map<String, Pattern> COLUMN_ALLOWLISTS =
      Map.ofEntries(
          Map.entry("part_number", Pattern.compile("^[A-Za-z0-9._/\\-]+$")),
          Map.entry("sap_pn", Pattern.compile("^[A-Za-z0-9._\\-]+$")),
          Map.entry("rack", Pattern.compile("^[A-Za-z0-9_\\-]+$")),
          Map.entry("vendor_name", Pattern.compile("^[A-Za-z0-9 &._\\-]+$")));

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

    String normalizedColumn = ColumnPolicyRegistry.normalize(columnName);
    Pattern allowlist = COLUMN_ALLOWLISTS.get(normalizedColumn);
    if (allowlist != null && !allowlist.matcher(trimmed).matches()) {
      return ScanResult.blocked(
          ErrorType.SECURITY,
          ErrorSeverity.DANGER,
          "Value contains disallowed characters for " + columnName);
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

    if (normalized.contains("' or 1=1")) {
      return ScanResult.blocked(
          ErrorType.SECURITY,
          ErrorSeverity.DANGER,
          "SQL injection pattern detected");
    }

    if (SQL_INJECTION_PATTERN.matcher(trimmed).find()) {
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
