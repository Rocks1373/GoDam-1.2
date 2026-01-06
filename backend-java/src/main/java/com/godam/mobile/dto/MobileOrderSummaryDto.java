package com.godam.mobile.dto;

public class MobileOrderSummaryDto {
  private Long orderId;
  private String outboundNumber;
  private String invoiceNumber;
  private String customerPo;
  private String customerName;
  private boolean dnCreated;
  private String currentStatus;
  private String readableStatus;

  public Long getOrderId() {
    return orderId;
  }

  public void setOrderId(Long orderId) {
    this.orderId = orderId;
  }

  public String getOutboundNumber() {
    return outboundNumber;
  }

  public void setOutboundNumber(String outboundNumber) {
    this.outboundNumber = outboundNumber;
  }

  public String getInvoiceNumber() {
    return invoiceNumber;
  }

  public void setInvoiceNumber(String invoiceNumber) {
    this.invoiceNumber = invoiceNumber;
  }

  public String getCustomerPo() {
    return customerPo;
  }

  public void setCustomerPo(String customerPo) {
    this.customerPo = customerPo;
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

  public String getCurrentStatus() {
    return currentStatus;
  }

  public void setCurrentStatus(String currentStatus) {
    this.currentStatus = currentStatus;
  }

  public String getReadableStatus() {
    return readableStatus;
  }

  public void setReadableStatus(String readableStatus) {
    this.readableStatus = readableStatus;
  }
}
