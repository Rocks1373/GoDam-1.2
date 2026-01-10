package com.godam.movements;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "StockMovements")
public class StockMovement {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Convert(converter = MovementTypeConverter.class)
  @Column(name = "movement_type", length = 20)
  private MovementType movementType;

  @Column(name = "warehouse_no")
  private String warehouseNo;

  @Column(name = "storage_location")
  private String storageLocation;

  @Column(name = "part_number")
  private String partNumber;

  @Column(name = "qty_change")
  private int qtyChange;

  @Column(name = "dn_number")
  private String dnNumber;

  @Column(name = "invoice_number")
  private String invoiceNumber;

  @Column(name = "sales_order")
  private String salesOrder;

  @Column(name = "rack")
  private String rack;

  @Column(name = "bin")
  private String bin;

  @Column(name = "suggested_rack")
  private String suggestedRack;

  @Column(name = "actual_rack")
  private String actualRack;

  @Column(name = "picked_qty")
  private Integer pickedQty;

  @Column(name = "requested_qty")
  private Integer requestedQty;

  @Column(name = "reference")
  private String reference;

  @Column(name = "remark")
  private String remark;

  @Column(name = "created_by")
  private Long createdBy;

  @Column(name = "created_at")
  private Instant createdAt;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public MovementType getMovementType() {
    return movementType;
  }

  public void setMovementType(MovementType movementType) {
    this.movementType = movementType;
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

  public int getQtyChange() {
    return qtyChange;
  }

  public void setQtyChange(int qtyChange) {
    this.qtyChange = qtyChange;
  }

  public String getDnNumber() {
    return dnNumber;
  }

  public void setDnNumber(String dnNumber) {
    this.dnNumber = dnNumber;
  }

  public String getInvoiceNumber() {
    return invoiceNumber;
  }

  public void setInvoiceNumber(String invoiceNumber) {
    this.invoiceNumber = invoiceNumber;
  }

  public String getSalesOrder() {
    return salesOrder;
  }

  public void setSalesOrder(String salesOrder) {
    this.salesOrder = salesOrder;
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

  public Integer getPickedQty() {
    return pickedQty;
  }

  public void setPickedQty(Integer pickedQty) {
    this.pickedQty = pickedQty;
  }

  public Integer getRequestedQty() {
    return requestedQty;
  }

  public void setRequestedQty(Integer requestedQty) {
    this.requestedQty = requestedQty;
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

  public Long getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(Long createdBy) {
    this.createdBy = createdBy;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
