package com.godam.delivery.dto;

public class DeliveryNoteQtyResponse {
  private String description;
  private Integer quantity;

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public Integer getQuantity() {
    return quantity;
  }

  public void setQuantity(Integer quantity) {
    this.quantity = quantity;
  }
}
