package com.godam.stock.dto;

public class StockUploadItemDto {
  private String warehouseNo;
  private String storageLocation;
  private String partNumber;
  private String sapPn;
  private String parentPn;
  private Double baseQty;
  private String pnIndicator;
  private String description;
  private Integer qty;
  private String uom;
  private String vendorName;
  private String category;
  private String subCategory;
  private String rack;
  private String bin;
  private String combineRack;
  private Integer drumNo;
  private Double drumQty;
  private String receivedAt;

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

  public String getPartNumber() {
    return partNumber;
  }

  public void setPartNumber(String partNumber) {
    this.partNumber = partNumber;
  }

  public String getSapPn() {
    return sapPn;
  }

  public void setSapPn(String sapPn) {
    this.sapPn = sapPn;
  }

  public String getParentPn() {
    return parentPn;
  }

  public void setParentPn(String parentPn) {
    this.parentPn = parentPn;
  }

  public Double getBaseQty() {
    return baseQty;
  }

  public void setBaseQty(Double baseQty) {
    this.baseQty = baseQty;
  }

  public String getPnIndicator() {
    return pnIndicator;
  }

  public void setPnIndicator(String pnIndicator) {
    this.pnIndicator = pnIndicator;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public Integer getQty() {
    return qty;
  }

  public void setQty(Integer qty) {
    this.qty = qty;
  }

  public String getUom() {
    return uom;
  }

  public void setUom(String uom) {
    this.uom = uom;
  }

  public String getVendorName() {
    return vendorName;
  }

  public void setVendorName(String vendorName) {
    this.vendorName = vendorName;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getSubCategory() {
    return subCategory;
  }

  public void setSubCategory(String subCategory) {
    this.subCategory = subCategory;
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

  public String getCombineRack() {
    return combineRack;
  }

  public void setCombineRack(String combineRack) {
    this.combineRack = combineRack;
  }

  public Integer getDrumNo() {
    return drumNo;
  }

  public void setDrumNo(Integer drumNo) {
    this.drumNo = drumNo;
  }

  public Double getDrumQty() {
    return drumQty;
  }

  public void setDrumQty(Double drumQty) {
    this.drumQty = drumQty;
  }

  public String getReceivedAt() {
    return receivedAt;
  }

  public void setReceivedAt(String receivedAt) {
    this.receivedAt = receivedAt;
  }
}
