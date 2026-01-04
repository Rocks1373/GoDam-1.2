package com.godam.masters.dto;

import jakarta.validation.constraints.NotBlank;

public class DriverCreateRequest {
  @NotBlank
  private String driverName;
  @NotBlank
  private String driverNumber;
  @NotBlank
  private String idNumber;
  private String truckNo;
  private boolean saveForFuture = true;

  public String getDriverName() {
    return driverName;
  }

  public void setDriverName(String driverName) {
    this.driverName = driverName;
  }

  public String getDriverNumber() {
    return driverNumber;
  }

  public void setDriverNumber(String driverNumber) {
    this.driverNumber = driverNumber;
  }

  public String getIdNumber() {
    return idNumber;
  }

  public void setIdNumber(String idNumber) {
    this.idNumber = idNumber;
  }

  public String getTruckNo() {
    return truckNo;
  }

  public void setTruckNo(String truckNo) {
    this.truckNo = truckNo;
  }

  public boolean isSaveForFuture() {
    return saveForFuture;
  }

  public void setSaveForFuture(boolean saveForFuture) {
    this.saveForFuture = saveForFuture;
  }
}
