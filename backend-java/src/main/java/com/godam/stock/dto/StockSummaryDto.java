package com.godam.stock.dto;

public class StockSummaryDto {
  private int totalParts;
  private int totalQty;

  public int getTotalParts() {
    return totalParts;
  }

  public void setTotalParts(int totalParts) {
    this.totalParts = totalParts;
  }

  public int getTotalQty() {
    return totalQty;
  }

  public void setTotalQty(int totalQty) {
    this.totalQty = totalQty;
  }
}
