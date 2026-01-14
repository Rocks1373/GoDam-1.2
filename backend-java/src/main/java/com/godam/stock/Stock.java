package com.godam.stock;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "stock")
public class Stock {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "warehouse_no")
  private String warehouseNo;

  @Column(name = "storage_location")
  private String storageLocation;

  @Column(name = "part_number")
  private String partNumber;

  @Column(name = "sap_pn")
  private String sapPn;

  @Column(name = "description", columnDefinition = "TEXT")
  private String description;

  @Column(name = "vendor_name")
  private String vendorName;

  @Column(name = "category")
  private String category;

  @Column(name = "sub_category")
  private String subCategory;

  @Column(name = "uom")
  private String uom;

  @Column(name = "qty")
  private int qty;

  @Column(name = "rack")
  private String rack;

  @Column(name = "bin")
  private String bin;

  @Column(name = "combine_rack")
  private String combineRack;

  @Column(name = "qty_status")
  private String qtyStatus;

  @Column(name = "serial_required")
  private boolean serialRequired;

  @Column(name = "is_schneider")
  private boolean isSchneider;

  @Column(name = "drum_no")
  private Integer drumNo;

  @Column(name = "drum_qty")
  private Double drumQty;

  @Column(name = "parent_pn")
  private String parentPn;

  @Column(name = "base_qty")
  private Double baseQty;

  @Column(name = "pn_indicator")
  private String pnIndicator;

  @Column(name = "received_at")
  private Instant receivedAt;

  @Column(name = "created_at")
  private Instant createdAt;

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

  public Instant getReceivedAt() {
    return receivedAt;
  }

  public void setReceivedAt(Instant receivedAt) {
    this.receivedAt = receivedAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
