package com.godam.orders.dto;

public class OrderEditRequest {
  private String invoiceNumber;
  private String customerName;
  private String customerPo;
  private String gappPo;
  private String reason;
  private String performedBy;

  public String getInvoiceNumber() {
    return invoiceNumber;
  }

  public void setInvoiceNumber(String invoiceNumber) {
    this.invoiceNumber = invoiceNumber;
  }

  public String getCustomerName() {
    return customerName;
  }

  public void setCustomerName(String customerName) {
    this.customerName = customerName;
  }

  public String getCustomerPo() {
    return customerPo;
  }

  public void setCustomerPo(String customerPo) {
    this.customerPo = customerPo;
  }

  public String getGappPo() {
    return gappPo;
  }

  public void setGappPo(String gappPo) {
    this.gappPo = gappPo;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }

  public String getPerformedBy() {
    return performedBy;
  }

  public void setPerformedBy(String performedBy) {
    this.performedBy = performedBy;
  }
}
