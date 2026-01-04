package com.godam.dn.dto;

public class DnTotals {
  private Integer totalParts;
  private Double totalQty;
  private Integer totalCases;
  private Double grossWeight;
  private Double volume;

  public Integer getTotalParts() {
    return totalParts;
  }

  public void setTotalParts(Integer totalParts) {
    this.totalParts = totalParts;
  }

  public Double getTotalQty() {
    return totalQty;
  }

  public void setTotalQty(Double totalQty) {
    this.totalQty = totalQty;
  }

  public Integer getTotalCases() {
    return totalCases;
  }

  public void setTotalCases(Integer totalCases) {
    this.totalCases = totalCases;
  }

  public Double getGrossWeight() {
    return grossWeight;
  }

  public void setGrossWeight(Double grossWeight) {
    this.grossWeight = grossWeight;
  }

  public Double getVolume() {
    return volume;
  }

  public void setVolume(Double volume) {
    this.volume = volume;
  }
}
