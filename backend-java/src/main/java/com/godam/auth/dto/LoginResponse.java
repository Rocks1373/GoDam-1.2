package com.godam.auth.dto;

import java.util.HashMap;
import java.util.Map;

public class LoginResponse {
  private String accessToken;
  private Map<String, Object> user;

  public LoginResponse() {
    this.user = new HashMap<>();
  }

  public LoginResponse(String accessToken, Long userId, String username, String role) {
    this.accessToken = accessToken;
    this.user = new HashMap<>();
    this.user.put("id", userId);
    this.user.put("username", username);
    this.user.put("role", role);
  }

  public String getAccessToken() {
    return accessToken;
  }

  public void setAccessToken(String accessToken) {
    this.accessToken = accessToken;
  }

  public Map<String, Object> getUser() {
    return user;
  }

  public void setUser(Map<String, Object> user) {
    this.user = user;
  }
}
