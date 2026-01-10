package com.godam.stock.dto;

public class StockPickContext {
  private String resolvedPartNumber;
  private String warehouseNo;
  private String storageLocation;
  private String rack;
  private String bin;
  private String suggestedRack;
  private String actualRack;
  private String reference;
  private String remark;

  public String getResolvedPartNumber() {
    return resolvedPartNumber;
  }

  public void setResolvedPartNumber(String resolvedPartNumber) {
    this.resolvedPartNumber = resolvedPartNumber;
  }

  public String getWarehouseNo() {
    return warehouseNo;
  }

  public void setWarehouseNo(String warehouseNo) {
    this.warehouseNo = warehouseNo;
  }

  public String getStorageLocation() {
    return storageLocation;
  }

  public void setStorageLocation(String storageLocation) {
    this.storageLocation = storageLocation;
  }

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

  public String getSuggestedRack() {
    return suggestedRack;
  }

  public void setSuggestedRack(String suggestedRack) {
    this.suggestedRack = suggestedRack;
  }

  public String getActualRack() {
    return actualRack;
  }

  public void setActualRack(String actualRack) {
    this.actualRack = actualRack;
  }

  public String getReference() {
    return reference;
  }

  public void setReference(String reference) {
    this.reference = reference;
  }

  public String getRemark() {
    return remark;
  }

  public void setRemark(String remark) {
    this.remark = remark;
  }
}
