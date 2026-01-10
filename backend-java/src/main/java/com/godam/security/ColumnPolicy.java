package com.godam.security;

public class ColumnPolicy {
  private final boolean allowUrls;
  private final boolean allowGoogleMaps;
  private final boolean allowLeadingDash;

  public ColumnPolicy(boolean allowUrls, boolean allowGoogleMaps, boolean allowLeadingDash) {
    this.allowUrls = allowUrls;
    this.allowGoogleMaps = allowGoogleMaps;
    this.allowLeadingDash = allowLeadingDash;
  }

  public ColumnPolicy(boolean allowUrls, boolean allowGoogleMaps) {
    this(allowUrls, allowGoogleMaps, false);
  }

  public boolean isAllowUrls() {
    return allowUrls;
  }

  public boolean isAllowGoogleMaps() {
    return allowGoogleMaps;
  }

  public boolean isAllowLeadingDash() {
    return allowLeadingDash;
  }
}
