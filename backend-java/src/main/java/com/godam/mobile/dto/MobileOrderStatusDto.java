package com.godam.mobile.dto;

public class MobileOrderStatusDto {
  private String outboundNumber;
  private String currentStatus;
  private String readableStatus;

  public String getOutboundNumber() {
    return outboundNumber;
  }

  public void setOutboundNumber(String outboundNumber) {
    this.outboundNumber = outboundNumber;
  }

  public String getCurrentStatus() {
    return currentStatus;
  }

  public void setCurrentStatus(String currentStatus) {
    this.currentStatus = currentStatus;
  }

  public String getReadableStatus() {
    return readableStatus;
  }

  public void setReadableStatus(String readableStatus) {
    this.readableStatus = readableStatus;
  }
}
