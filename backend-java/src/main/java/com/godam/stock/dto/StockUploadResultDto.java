package com.godam.stock.dto;

public class StockUploadResultDto {
  private int inserted;
  private int updated;
  private int total;

  public StockUploadResultDto(int inserted, int updated, int total) {
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
