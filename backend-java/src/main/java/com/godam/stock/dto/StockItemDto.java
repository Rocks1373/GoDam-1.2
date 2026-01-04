package com.godam.stock.dto;

public class StockItemDto {
  private Long id;
  private String warehouseNo;
  private String storageLocation;
  private String partNumber;
  private String sapPn;
  private String description;
  private String uom;
  private int qty;
  private String rack;
  private String combineRack;
  private String qtyStatus;
  private boolean serialRequired;
  private boolean isSchneider;
  private Integer drumNo;
  private Double drumQty;
  private String parentPn;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
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

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getUom() {
    return uom;
  }

  public void setUom(String uom) {
    this.uom = uom;
  }

  public int getQty() {
    return qty;
  }

  public void setQty(int qty) {
    this.qty = qty;
  }

  public String getRack() {
    return rack;
  }

  public void setRack(String rack) {
    this.rack = rack;
  }

  public String getCombineRack() {
    return combineRack;
  }

  public void setCombineRack(String combineRack) {
    this.combineRack = combineRack;
  }

  public String getQtyStatus() {
    return qtyStatus;
  }

  public void setQtyStatus(String qtyStatus) {
    this.qtyStatus = qtyStatus;
  }

  public boolean isSerialRequired() {
    return serialRequired;
  }

  public void setSerialRequired(boolean serialRequired) {
    this.serialRequired = serialRequired;
  }

  public boolean isSchneider() {
    return isSchneider;
  }

  public void setSchneider(boolean schneider) {
    isSchneider = schneider;
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

  public String getParentPn() {
    return parentPn;
  }

  public void setParentPn(String parentPn) {
    this.parentPn = parentPn;
  }
}
