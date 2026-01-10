package com.godam.orders.dto;

public class OrderPickRequest {
  private String partNumber;
  private String pickedRack;
  private String pickedBy;
  private Integer pickedQty;

  public String getPartNumber() {
    return partNumber;
  }

  public void setPartNumber(String partNumber) {
    this.partNumber = partNumber;
  }

  public String getPickedRack() {
    return pickedRack;
  }

  public void setPickedRack(String pickedRack) {
    this.pickedRack = pickedRack;
  }

  public String getPickedBy() {
    return pickedBy;
  }

  public void setPickedBy(String pickedBy) {
    this.pickedBy = pickedBy;
  }

  public Integer getPickedQty() {
    return pickedQty;
  }

  public void setPickedQty(Integer pickedQty) {
    this.pickedQty = pickedQty;
  }
}
