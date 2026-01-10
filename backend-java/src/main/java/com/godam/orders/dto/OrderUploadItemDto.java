package com.godam.orders.dto;

public class OrderUploadItemDto {
  private String salesOrder;
  private String outboundNumber;
  private String customerPo;
  private String partNumber;
  private Integer qty;
  private String customerName;
  private String invoiceNumber;

  public String getSalesOrder() {
    return salesOrder;
  }

  public void setSalesOrder(String salesOrder) {
    this.salesOrder = salesOrder;
  }

  public String getOutboundNumber() {
    return outboundNumber;
  }

  public void setOutboundNumber(String outboundNumber) {
    this.outboundNumber = outboundNumber;
  }

  public String getCustomerPo() {
    return customerPo;
  }

  public void setCustomerPo(String customerPo) {
    this.customerPo = customerPo;
  }

  public String getPartNumber() {
    return partNumber;
  }

  public void setPartNumber(String partNumber) {
    this.partNumber = partNumber;
  }

  public Integer getQty() {
    return qty;
  }

  public void setQty(Integer qty) {
    this.qty = qty;
  }

  public String getCustomerName() {
    return customerName;
  }

  public void setCustomerName(String customerName) {
    this.customerName = customerName;
  }

  public String getInvoiceNumber() {
    return invoiceNumber;
  }

  public void setInvoiceNumber(String invoiceNumber) {
    this.invoiceNumber = invoiceNumber;
  }
}
