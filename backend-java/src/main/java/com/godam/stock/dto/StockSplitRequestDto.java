package com.godam.stock.dto;

public class StockSplitRequestDto {
  private String rack;
  private String bin;
  private int qty;

  public String getRack() {
    return rack;
  }

  public void setRack(String rack) {
    this.rack = rack;
  }

  public String getBin() {
    return bin;
  }

  public void setBin(String bin) {
    this.bin = bin;
  }

  public int getQty() {
    return qty;
  }

  public void setQty(int qty) {
    this.qty = qty;
  }
}
