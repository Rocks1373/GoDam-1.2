package com.godam.movements.dto;

public class MovementDeleteRequest {
  private String performedBy;
  private String password;
  private String reason;
  private Boolean confirmSensitive;

  public String getPerformedBy() {
    return performedBy;
  }

  public void setPerformedBy(String performedBy) {
    this.performedBy = performedBy;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }

  public Boolean getConfirmSensitive() {
    return confirmSensitive;
  }

  public void setConfirmSensitive(Boolean confirmSensitive) {
    this.confirmSensitive = confirmSensitive;
  }
}
