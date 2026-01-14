package com.godam.masters.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class DriverCreateRequest {
  @NotBlank
  private String driverName;
  private String driverNumber;
  private String idNumber;
  private String nationality;
  private String truckNo;
  private LocalDate iqamaExpiryDate;
  private LocalDate licenseExpiryDate;
  private boolean active = true;
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

  public String getNationality() {
    return nationality;
  }

  public void setNationality(String nationality) {
    this.nationality = nationality;
  }

  public String getTruckNo() {
    return truckNo;
  }

  public void setTruckNo(String truckNo) {
    this.truckNo = truckNo;
  }

  public LocalDate getIqamaExpiryDate() {
    return iqamaExpiryDate;
  }

  public void setIqamaExpiryDate(LocalDate iqamaExpiryDate) {
    this.iqamaExpiryDate = iqamaExpiryDate;
  }

  public LocalDate getLicenseExpiryDate() {
    return licenseExpiryDate;
  }

  public void setLicenseExpiryDate(LocalDate licenseExpiryDate) {
    this.licenseExpiryDate = licenseExpiryDate;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }

  public boolean isSaveForFuture() {
    return saveForFuture;
  }

  public void setSaveForFuture(boolean saveForFuture) {
    this.saveForFuture = saveForFuture;
  }
}
