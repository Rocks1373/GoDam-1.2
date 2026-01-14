package com.godam.stock.dto;

public class StockAdjustmentRequest {
  private String partNumber;
  private Integer addQty;
  private Integer reduceQty;
  private String password;
  private String performedBy;

  public String getPartNumber() {
    return partNumber;
  }

  public void setPartNumber(String partNumber) {
    this.partNumber = partNumber;
  }

  public Integer getAddQty() {
    return addQty;
  }

  public void setAddQty(Integer addQty) {
    this.addQty = addQty;
  }

  public Integer getReduceQty() {
    return reduceQty;
  }

  public void setReduceQty(Integer reduceQty) {
    this.reduceQty = reduceQty;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public String getPerformedBy() {
    return performedBy;
  }

  public void setPerformedBy(String performedBy) {
    this.performedBy = performedBy;
  }
}
