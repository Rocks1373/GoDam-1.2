package com.godam.masters;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "Drivers")
public class Driver {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "driver_name")
  private String driverName;

  @Column(name = "driver_number")
  private String driverNumber;

  @Column(name = "id_number")
  private String idNumber;

  @Column(name = "truck_no")
  private String truckNo;

  @Column(name = "iqama_image")
  private String iqamaImage;

  @Column(name = "istimara_image")
  private String istimaraImage;

  @Column(name = "insurance_image")
  private String insuranceImage;

  @Column(name = "user_id")
  private Long userId;

  @Column(name = "is_active")
  private boolean isActive;

  @Column(name = "created_at")
  private Instant createdAt;

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

  public Long getUserId() {
    return userId;
  }

  public void setUserId(Long userId) {
    this.userId = userId;
  }

  public boolean isActive() {
    return isActive;
  }

  public void setActive(boolean active) {
    isActive = active;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
