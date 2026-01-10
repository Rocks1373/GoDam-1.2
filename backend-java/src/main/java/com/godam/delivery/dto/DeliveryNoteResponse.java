package com.godam.delivery.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class DeliveryNoteResponse {
  private Long id;
  private String dnNumber;
  private String outboundNumber;
  private String address;
  private String googleMapLink;
  private String requirements;
  private String status;
  private Instant createdAt;
  private Instant updatedAt;
  private CustomerSummary customer;
  private TransporterSummary transporter;
  private DriverSummary driver;
  private List<DeliveryNoteQtyResponse> quantities = new ArrayList<>();

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getDnNumber() {
    return dnNumber;
  }

  public void setDnNumber(String dnNumber) {
    this.dnNumber = dnNumber;
  }

  public String getOutboundNumber() {
    return outboundNumber;
  }

  public void setOutboundNumber(String outboundNumber) {
    this.outboundNumber = outboundNumber;
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

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public CustomerSummary getCustomer() {
    return customer;
  }

  public void setCustomer(CustomerSummary customer) {
    this.customer = customer;
  }

  public TransporterSummary getTransporter() {
    return transporter;
  }

  public void setTransporter(TransporterSummary transporter) {
    this.transporter = transporter;
  }

  public DriverSummary getDriver() {
    return driver;
  }

  public void setDriver(DriverSummary driver) {
    this.driver = driver;
  }

  public List<DeliveryNoteQtyResponse> getQuantities() {
    return quantities;
  }

  public void setQuantities(List<DeliveryNoteQtyResponse> quantities) {
    this.quantities = quantities;
  }

  public static class CustomerSummary {
    private Long id;
    private String name;
    private String city;
    private String locationText;
    private String googleLocation;

    public Long getId() {
      return id;
    }

    public void setId(Long id) {
      this.id = id;
    }

    public String getName() {
      return name;
    }

    public void setName(String name) {
      this.name = name;
    }

    public String getCity() {
      return city;
    }

    public void setCity(String city) {
      this.city = city;
    }

    public String getLocationText() {
      return locationText;
    }

    public void setLocationText(String locationText) {
      this.locationText = locationText;
    }

    public String getGoogleLocation() {
      return googleLocation;
    }

    public void setGoogleLocation(String googleLocation) {
      this.googleLocation = googleLocation;
    }
  }

  public static class TransporterSummary {
    private Long id;
    private String companyName;
    private String contactName;
    private String email;

    public Long getId() {
      return id;
    }

    public void setId(Long id) {
      this.id = id;
    }

    public String getCompanyName() {
      return companyName;
    }

    public void setCompanyName(String companyName) {
      this.companyName = companyName;
    }

    public String getContactName() {
      return contactName;
    }

    public void setContactName(String contactName) {
      this.contactName = contactName;
    }

    public String getEmail() {
      return email;
    }

    public void setEmail(String email) {
      this.email = email;
    }
  }

  public static class DriverSummary {
    private Long id;
    private String driverName;
    private String driverNumber;
    private String truckNo;
    private String idNumber;

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

    public String getTruckNo() {
      return truckNo;
    }

    public void setTruckNo(String truckNo) {
      this.truckNo = truckNo;
    }

    public String getIdNumber() {
      return idNumber;
    }

    public void setIdNumber(String idNumber) {
      this.idNumber = idNumber;
    }
  }
}
