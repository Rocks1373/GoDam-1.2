package com.godam.orders.dto;

public class OrderSummaryDto {
  private Long orderId;
  private String invoiceNumber;
  private String outboundNumber;
  private String gappPo;
  private String customerPo;
  private String customerId;
  private String customerName;
  private boolean dnCreated;
  private String pickingStatus;
  private String checkingStatus;
  private int itemCount;
  private double totalQty;
  private boolean insufficientStock;

  public Long getOrderId() {
    return orderId;
  }

  public void setOrderId(Long orderId) {
    this.orderId = orderId;
  }

  public String getInvoiceNumber() {
    return invoiceNumber;
  }

  public void setInvoiceNumber(String invoiceNumber) {
    this.invoiceNumber = invoiceNumber;
  }

  public String getOutboundNumber() {
    return outboundNumber;
  }

  public void setOutboundNumber(String outboundNumber) {
    this.outboundNumber = outboundNumber;
  }

  public String getGappPo() {
    return gappPo;
  }

  public void setGappPo(String gappPo) {
    this.gappPo = gappPo;
  }

  public String getCustomerPo() {
    return customerPo;
  }

  public void setCustomerPo(String customerPo) {
    this.customerPo = customerPo;
  }

  public String getCustomerId() {
    return customerId;
  }

  public void setCustomerId(String customerId) {
    this.customerId = customerId;
  }

  public String getCustomerName() {
    return customerName;
  }

  public void setCustomerName(String customerName) {
    this.customerName = customerName;
  }

  public boolean isDnCreated() {
    return dnCreated;
  }

  public void setDnCreated(boolean dnCreated) {
    this.dnCreated = dnCreated;
  }

  public String getPickingStatus() {
    return pickingStatus;
  }

  public void setPickingStatus(String pickingStatus) {
    this.pickingStatus = pickingStatus;
  }

  public String getCheckingStatus() {
    return checkingStatus;
  }

  public void setCheckingStatus(String checkingStatus) {
    this.checkingStatus = checkingStatus;
  }

  public int getItemCount() {
    return itemCount;
  }

  public void setItemCount(int itemCount) {
    this.itemCount = itemCount;
  }

  public double getTotalQty() {
    return totalQty;
  }

  public void setTotalQty(double totalQty) {
    this.totalQty = totalQty;
  }

  public boolean isInsufficientStock() {
    return insufficientStock;
  }

  public void setInsufficientStock(boolean insufficientStock) {
    this.insufficientStock = insufficientStock;
  }
}
