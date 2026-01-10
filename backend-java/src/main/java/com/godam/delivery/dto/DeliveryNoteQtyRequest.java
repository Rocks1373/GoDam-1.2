package com.godam.delivery.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class DeliveryNoteQtyRequest {
  @NotBlank
  private String description;

  @Min(1)
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
