package com.godam.security;

public class ColumnPolicy {
  private final boolean allowUrls;
  private final boolean allowGoogleMaps;

  public ColumnPolicy(boolean allowUrls, boolean allowGoogleMaps) {
    this.allowUrls = allowUrls;
    this.allowGoogleMaps = allowGoogleMaps;
  }

  public boolean isAllowUrls() {
    return allowUrls;
  }

  public boolean isAllowGoogleMaps() {
    return allowGoogleMaps;
  }
}
