package com.godam.orders.dto;

public class OrderStatusUpdateRequest {
  private String pickingStatus;
  private String checkingStatus;

  public String getPickingStatus() {
    return pickingStatus;
  }

  public void setPickingStatus(String pickingStatus) {
    this.pickingStatus = pickingStatus;
  }

  public String getCheckingStatus() {
    return checkingStatus;
  }

  public void setCheckingStatus(String checkingStatus) {
    this.checkingStatus = checkingStatus;
  }
}
