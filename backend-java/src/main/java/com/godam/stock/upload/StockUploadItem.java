package com.godam.stock.upload;

import java.math.BigDecimal;

public class StockUploadItem {
  private final String partNumber;
  private final String warehouseNo;
  private final String storageLocation;
  private final String sapPn;
  private final String description;
  private final String vendorName;
  private final String category;
  private final String subCategory;
  private final String uom;
  private final String rack;
  private final String bin;
  private final String combineRack;
  private final String pnIndicator;
  private final String parentPn;
  private final Double baseQty;
  private final String qtyStatus;
  private final Boolean serialRequired;
  private final Boolean schneider;
  private final Integer drumNo;
  private final Double drumQty;
  private final java.time.Instant receivedAt;
  private final BigDecimal qty;

  public StockUploadItem(
      String partNumber,
      String warehouseNo,
      String storageLocation,
      String sapPn,
      String description,
      String vendorName,
      String category,
      String subCategory,
      String uom,
      String rack,
      String bin,
      String combineRack,
      String pnIndicator,
      String parentPn,
      Double baseQty,
      String qtyStatus,
      Boolean serialRequired,
      Boolean schneider,
      Integer drumNo,
      Double drumQty,
      java.time.Instant receivedAt,
      BigDecimal qty) {
    this.partNumber = partNumber;
    this.warehouseNo = warehouseNo;
    this.storageLocation = storageLocation;
    this.sapPn = sapPn;
    this.description = description;
    this.vendorName = vendorName;
    this.category = category;
    this.subCategory = subCategory;
    this.uom = uom;
    this.rack = rack;
    this.bin = bin;
    this.combineRack = combineRack;
    this.pnIndicator = pnIndicator;
    this.parentPn = parentPn;
    this.baseQty = baseQty;
    this.qtyStatus = qtyStatus;
    this.serialRequired = serialRequired;
    this.schneider = schneider;
    this.drumNo = drumNo;
    this.drumQty = drumQty;
    this.receivedAt = receivedAt;
    this.qty = qty;
  }

  public String getPartNumber() {
    return partNumber;
  }

  public String getWarehouseNo() {
    return warehouseNo;
  }

  public String getStorageLocation() {
    return storageLocation;
  }

  public String getSapPn() {
    return sapPn;
  }

  public String getDescription() {
    return description;
  }

  public String getVendorName() {
    return vendorName;
  }

  public String getCategory() {
    return category;
  }

  public String getSubCategory() {
    return subCategory;
  }

  public String getUom() {
    return uom;
  }

  public String getRack() {
    return rack;
  }

  public String getBin() {
    return bin;
  }

  public String getCombineRack() {
    return combineRack;
  }

  public String getPnIndicator() {
    return pnIndicator;
  }

  public String getParentPn() {
    return parentPn;
  }

  public Double getBaseQty() {
    return baseQty;
  }

  public String getQtyStatus() {
    return qtyStatus;
  }

  public Boolean getSerialRequired() {
    return serialRequired;
  }

  public Boolean getSchneider() {
    return schneider;
  }

  public Integer getDrumNo() {
    return drumNo;
  }

  public Double getDrumQty() {
    return drumQty;
  }

  public java.time.Instant getReceivedAt() {
    return receivedAt;
  }

  public BigDecimal getQty() {
    return qty;
  }
}
