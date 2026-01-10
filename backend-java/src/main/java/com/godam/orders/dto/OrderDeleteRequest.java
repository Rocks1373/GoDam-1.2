package com.godam.orders.dto;

public class OrderDeleteRequest {
  private String reason;
  private String performedBy;

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }

  public String getPerformedBy() {
    return performedBy;
  }

  public void setPerformedBy(String performedBy) {
    this.performedBy = performedBy;
  }
}
