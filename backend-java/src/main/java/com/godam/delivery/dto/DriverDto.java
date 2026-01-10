package com.godam.delivery.dto;

public class DriverDto {
  private Long id;
  private String driverName;
  private String driverNumber;
  private String idNumber;
  private String truckNo;
  private String iqamaImage;
  private String istimaraImage;
  private String insuranceImage;

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

  public String getIqamaImage() {
    return iqamaImage;
  }

  public void setIqamaImage(String iqamaImage) {
    this.iqamaImage = iqamaImage;
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
}
