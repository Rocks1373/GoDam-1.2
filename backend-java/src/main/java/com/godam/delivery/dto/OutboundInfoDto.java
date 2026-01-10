package com.godam.delivery.dto;

import java.util.ArrayList;
import java.util.List;

public class OutboundInfoDto {
  private Long orderId;
  private String outboundNumber;
  private String customerName;
  private String gappPo;
  private String customerPo;
  private List<String> itemNumbers = new ArrayList<>();

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

  public String getCustomerName() {
    return customerName;
  }

  public void setCustomerName(String customerName) {
    this.customerName = customerName;
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

  public List<String> getItemNumbers() {
    return itemNumbers;
  }

  public void setItemNumbers(List<String> itemNumbers) {
    this.itemNumbers = itemNumbers;
  }
}
