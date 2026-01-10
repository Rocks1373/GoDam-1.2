package com.godam.orders.dto;

public class OrderSendForPickupRequest {
  private String note;
  private String reason;
  private String performedBy;

  public String getNote() {
    return note;
  }

  public void setNote(String note) {
    this.note = note;
  }

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
