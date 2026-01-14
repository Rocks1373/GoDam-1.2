package com.godam.masters.dto;

public class DriverDto {
  private Long id;
  private String driverName;
  private String driverNumber;
  private String idNumber;
  private String truckNo;
  private String nationality;
  private String iqamaExpiryDate;
  private String licenseExpiryDate;
  private String iqamaImage;
  private String licenseImage;
  private String istimaraImage;
  private String insuranceImage;
  private String truckFrontImage;
  private String truckBackImage;
  private boolean isActive;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

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

  public String getNationality() {
    return nationality;
  }

  public void setNationality(String nationality) {
    this.nationality = nationality;
  }

  public String getIqamaExpiryDate() {
    return iqamaExpiryDate;
  }

  public void setIqamaExpiryDate(String iqamaExpiryDate) {
    this.iqamaExpiryDate = iqamaExpiryDate;
  }

  public String getLicenseExpiryDate() {
    return licenseExpiryDate;
  }

  public void setLicenseExpiryDate(String licenseExpiryDate) {
    this.licenseExpiryDate = licenseExpiryDate;
  }

  public String getIqamaImage() {
    return iqamaImage;
  }

  public void setIqamaImage(String iqamaImage) {
    this.iqamaImage = iqamaImage;
  }

  public String getLicenseImage() {
    return licenseImage;
  }

  public void setLicenseImage(String licenseImage) {
    this.licenseImage = licenseImage;
  }

  public String getIstimaraImage() {
    return istimaraImage;
  }

  public void setIstimaraImage(String istimaraImage) {
    this.istimaraImage = istimaraImage;
  }

  public String getInsuranceImage() {
    return insuranceImage;
  }

  public void setInsuranceImage(String insuranceImage) {
    this.insuranceImage = insuranceImage;
  }

  public String getTruckFrontImage() {
    return truckFrontImage;
  }

  public void setTruckFrontImage(String truckFrontImage) {
    this.truckFrontImage = truckFrontImage;
  }

  public String getTruckBackImage() {
    return truckBackImage;
  }

  public void setTruckBackImage(String truckBackImage) {
    this.truckBackImage = truckBackImage;
  }

  public boolean isActive() {
    return isActive;
  }

  public void setActive(boolean active) {
    isActive = active;
  }
}
