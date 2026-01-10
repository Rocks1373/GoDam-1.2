package com.godam.orders.dto;

public class OrderItemDto {
  private String partNumber;
  private String description;
  private double qty;
  private String pickedBy;
  private String pickedRack;
  private boolean isPicked;

  public String getPartNumber() {
    return partNumber;
  }

  public void setPartNumber(String partNumber) {
    this.partNumber = partNumber;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public double getQty() {
    return qty;
  }

  public void setQty(double qty) {
    this.qty = qty;
  }

  public String getPickedBy() {
    return pickedBy;
  }

  public void setPickedBy(String pickedBy) {
    this.pickedBy = pickedBy;
  }

  public String getPickedRack() {
    return pickedRack;
  }

  public void setPickedRack(String pickedRack) {
    this.pickedRack = pickedRack;
  }

  public boolean isPicked() {
    return isPicked;
  }

  public void setPicked(boolean picked) {
    isPicked = picked;
  }
}
