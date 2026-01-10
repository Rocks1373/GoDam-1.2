package com.godam.masters.dto;

public class CustomerImportErrorDto {
  private int row;
  private String reason;

  public CustomerImportErrorDto(int row, String reason) {
    this.row = row;
    this.reason = reason;
  }

  public int getRow() {
    return row;
  }

  public void setRow(int row) {
    this.row = row;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }
}
