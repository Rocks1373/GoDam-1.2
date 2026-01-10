package com.godam.orders.dto;

public class OrderUploadResultDto {
  private int inserted;
  private int updated;
  private int total;

  public OrderUploadResultDto(int inserted, int updated, int total) {
    this.inserted = inserted;
    this.updated = updated;
    this.total = total;
  }

  public int getInserted() {
    return inserted;
  }

  public int getUpdated() {
    return updated;
  }

  public int getTotal() {
    return total;
  }
}
