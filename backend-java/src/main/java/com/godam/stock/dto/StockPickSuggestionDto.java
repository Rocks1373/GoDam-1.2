package com.godam.stock.dto;

public class StockPickSuggestionDto {
  private String partNumber;
  private String rack;
  private int availableQty;
  private String fifoDate;

  public String getPartNumber() {
    return partNumber;
  }

  public void setPartNumber(String partNumber) {
    this.partNumber = partNumber;
  }

  public String getRack() {
    return rack;
  }

  public void setRack(String rack) {
    this.rack = rack;
  }

  public int getAvailableQty() {
    return availableQty;
  }

  public void setAvailableQty(int availableQty) {
    this.availableQty = availableQty;
  }

  public String getFifoDate() {
    return fifoDate;
  }

  public void setFifoDate(String fifoDate) {
    this.fifoDate = fifoDate;
  }
}
