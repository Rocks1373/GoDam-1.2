package com.godam.mobile.dto;

public class MobileMovementDto {
  private String movementCode;
  private String readableStatus;
  private String createdAt;

  public String getMovementCode() {
    return movementCode;
  }

  public void setMovementCode(String movementCode) {
    this.movementCode = movementCode;
  }

  public String getReadableStatus() {
    return readableStatus;
  }

  public void setReadableStatus(String readableStatus) {
    this.readableStatus = readableStatus;
  }

  public String getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(String createdAt) {
    this.createdAt = createdAt;
  }
}
