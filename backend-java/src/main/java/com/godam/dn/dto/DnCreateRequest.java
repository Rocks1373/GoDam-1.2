package com.godam.dn.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

public class DnCreateRequest {
  private String invoice;
  private String customerPo;
  private String gappPo;
  private String outboundNumber;
  private String date;

  private String customerName;
  private String address;
  private String googleLocation;
  private String receiver1Name;
  private String receiver1Phone;
  private String receiver2Name;
  private String receiver2Phone;

  private String huaweiContract;
  private String huaweiReference;

  private String projectName;
  private String paymentTerms;
  private String productName;

  private String carrier;
  private String driverName;
  private String driverMobile;
  private String vehicleNumber;
  private String vehicleType;

  private String salesName;
  private String salesPhone;
  private String salesEmail;

  private String dispatchFromName;
  private String dispatchFromAddress;
  private String dispatchContactName;
  private String dispatchContactPhone;
  private String dispatchContactEmail;

  private Integer totalParts;
  private Double totalQty;
  private Integer totalCases;
  private Double grossWeight;
  private Double volume;

  private String dnNumber;

  @Valid
  private List<DnItemRequest> items = new ArrayList<>();

  @NotNull
  private DnOptions options = new DnOptions();

  public String getInvoice() {
    return invoice;
  }

  public void setInvoice(String invoice) {
    this.invoice = invoice;
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

  public String getOutboundNumber() {
    return outboundNumber;
  }

  public void setOutboundNumber(String outboundNumber) {
    this.outboundNumber = outboundNumber;
  }

  public String getDate() {
    return date;
  }

  public void setDate(String date) {
    this.date = date;
  }

  public String getCustomerName() {
    return customerName;
  }

  public void setCustomerName(String customerName) {
    this.customerName = customerName;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public String getGoogleLocation() {
    return googleLocation;
  }

  public void setGoogleLocation(String googleLocation) {
    this.googleLocation = googleLocation;
  }

  public String getReceiver1Name() {
    return receiver1Name;
  }

  public void setReceiver1Name(String receiver1Name) {
    this.receiver1Name = receiver1Name;
  }

  public String getReceiver1Phone() {
    return receiver1Phone;
  }

  public void setReceiver1Phone(String receiver1Phone) {
    this.receiver1Phone = receiver1Phone;
  }

  public String getReceiver2Name() {
    return receiver2Name;
  }

  public void setReceiver2Name(String receiver2Name) {
    this.receiver2Name = receiver2Name;
  }

  public String getReceiver2Phone() {
    return receiver2Phone;
  }

  public void setReceiver2Phone(String receiver2Phone) {
    this.receiver2Phone = receiver2Phone;
  }

  public String getHuaweiContract() {
    return huaweiContract;
  }

  public void setHuaweiContract(String huaweiContract) {
    this.huaweiContract = huaweiContract;
  }

  public String getHuaweiReference() {
    return huaweiReference;
  }

  public void setHuaweiReference(String huaweiReference) {
    this.huaweiReference = huaweiReference;
  }

  public String getProjectName() {
    return projectName;
  }

  public void setProjectName(String projectName) {
    this.projectName = projectName;
  }

  public String getPaymentTerms() {
    return paymentTerms;
  }

  public void setPaymentTerms(String paymentTerms) {
    this.paymentTerms = paymentTerms;
  }

  public String getProductName() {
    return productName;
  }

  public void setProductName(String productName) {
    this.productName = productName;
  }

  public String getCarrier() {
    return carrier;
  }

  public void setCarrier(String carrier) {
    this.carrier = carrier;
  }

  public String getDriverName() {
    return driverName;
  }

  public void setDriverName(String driverName) {
    this.driverName = driverName;
  }

  public String getDriverMobile() {
    return driverMobile;
  }

  public void setDriverMobile(String driverMobile) {
    this.driverMobile = driverMobile;
  }

  public String getVehicleNumber() {
    return vehicleNumber;
  }

  public void setVehicleNumber(String vehicleNumber) {
    this.vehicleNumber = vehicleNumber;
  }

  public String getVehicleType() {
    return vehicleType;
  }

  public void setVehicleType(String vehicleType) {
    this.vehicleType = vehicleType;
  }

  public String getSalesName() {
    return salesName;
  }

  public void setSalesName(String salesName) {
    this.salesName = salesName;
  }

  public String getSalesPhone() {
    return salesPhone;
  }

  public void setSalesPhone(String salesPhone) {
    this.salesPhone = salesPhone;
  }

  public String getSalesEmail() {
    return salesEmail;
  }

  public void setSalesEmail(String salesEmail) {
    this.salesEmail = salesEmail;
  }

  public String getDispatchFromName() {
    return dispatchFromName;
  }

  public void setDispatchFromName(String dispatchFromName) {
    this.dispatchFromName = dispatchFromName;
  }

  public String getDispatchFromAddress() {
    return dispatchFromAddress;
  }

  public void setDispatchFromAddress(String dispatchFromAddress) {
    this.dispatchFromAddress = dispatchFromAddress;
  }

  public String getDispatchContactName() {
    return dispatchContactName;
  }

  public void setDispatchContactName(String dispatchContactName) {
    this.dispatchContactName = dispatchContactName;
  }

  public String getDispatchContactPhone() {
    return dispatchContactPhone;
  }

  public void setDispatchContactPhone(String dispatchContactPhone) {
    this.dispatchContactPhone = dispatchContactPhone;
  }

  public String getDispatchContactEmail() {
    return dispatchContactEmail;
  }

  public void setDispatchContactEmail(String dispatchContactEmail) {
    this.dispatchContactEmail = dispatchContactEmail;
  }

  public Integer getTotalParts() {
    return totalParts;
  }

  public void setTotalParts(Integer totalParts) {
    this.totalParts = totalParts;
  }

  public Double getTotalQty() {
    return totalQty;
  }

  public void setTotalQty(Double totalQty) {
    this.totalQty = totalQty;
  }

  public Integer getTotalCases() {
    return totalCases;
  }

  public void setTotalCases(Integer totalCases) {
    this.totalCases = totalCases;
  }

  public Double getGrossWeight() {
    return grossWeight;
  }

  public void setGrossWeight(Double grossWeight) {
    this.grossWeight = grossWeight;
  }

  public Double getVolume() {
    return volume;
  }

  public void setVolume(Double volume) {
    this.volume = volume;
  }

  public String getDnNumber() {
    return dnNumber;
  }

  public void setDnNumber(String dnNumber) {
    this.dnNumber = dnNumber;
  }

  public List<DnItemRequest> getItems() {
    return items;
  }

  public void setItems(List<DnItemRequest> items) {
    this.items = items == null ? new ArrayList<>() : items;
  }

  public DnOptions getOptions() {
    return options;
  }

  public void setOptions(DnOptions options) {
    this.options = options == null ? new DnOptions() : options;
  }
}
