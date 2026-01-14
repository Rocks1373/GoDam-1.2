package com.godam.delivery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class DeliveryNoteRequest {
  @NotBlank
  private String dnNumber;

  private String customerPo;

  private String gappPo;

  @jakarta.validation.constraints.NotBlank
  private String invoiceNumber;

  private String preparedBy;

  private String truckType;

  private Instant dnDate;

  @NotBlank
  private String outboundNumber;

  @NotNull
  private Long customerId;

  private String address;

  private String googleMapLink;

  private String requirements;

  @NotNull
  private Long transporterId;

  @NotNull
  private Long driverId;

  private Long orderId;

  @NotEmpty
  private List<DeliveryNoteQtyRequest> quantities = new ArrayList<>();

  private String status;

  public String getDnNumber() {
    return dnNumber;
  }

  public void setDnNumber(String dnNumber) {
    this.dnNumber = dnNumber;
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

  public String getInvoiceNumber() {
    return invoiceNumber;
  }

  public void setInvoiceNumber(String invoiceNumber) {
    this.invoiceNumber = invoiceNumber;
  }

  public String getPreparedBy() {
    return preparedBy;
  }

  public void setPreparedBy(String preparedBy) {
    this.preparedBy = preparedBy;
  }

  public String getTruckType() {
    return truckType;
  }

  public void setTruckType(String truckType) {
    this.truckType = truckType;
  }

  public Instant getDnDate() {
    return dnDate;
  }

  public void setDnDate(Instant dnDate) {
    this.dnDate = dnDate;
  }

  public String getOutboundNumber() {
    return outboundNumber;
  }

  public void setOutboundNumber(String outboundNumber) {
    this.outboundNumber = outboundNumber;
  }

  public Long getCustomerId() {
    return customerId;
  }

  public void setCustomerId(Long customerId) {
    this.customerId = customerId;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public String getGoogleMapLink() {
    return googleMapLink;
  }

  public void setGoogleMapLink(String googleMapLink) {
    this.googleMapLink = googleMapLink;
  }

  public String getRequirements() {
    return requirements;
  }

  public void setRequirements(String requirements) {
    this.requirements = requirements;
  }

  public Long getTransporterId() {
    return transporterId;
  }

  public void setTransporterId(Long transporterId) {
    this.transporterId = transporterId;
  }

  public Long getDriverId() {
    return driverId;
  }

  public void setDriverId(Long driverId) {
    this.driverId = driverId;
  }

  public Long getOrderId() {
    return orderId;
  }

  public void setOrderId(Long orderId) {
    this.orderId = orderId;
  }

  public List<DeliveryNoteQtyRequest> getQuantities() {
    return quantities;
  }

  public void setQuantities(List<DeliveryNoteQtyRequest> quantities) {
    this.quantities = quantities;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }
}
