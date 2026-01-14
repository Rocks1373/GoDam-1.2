package com.godam.masters.dto;

import jakarta.validation.constraints.NotBlank;

public class TransporterCreateRequest {
  @NotBlank
  private String companyName;
  private String contactName;
  private String phone;
  private String email;
  private String vatNumber;
  private String crNumber;
  private boolean saveForFuture = true;
  private boolean active = true;

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

  public String getPhone() {
    return phone;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getVatNumber() {
    return vatNumber;
  }

  public void setVatNumber(String vatNumber) {
    this.vatNumber = vatNumber;
  }

  public String getCrNumber() {
    return crNumber;
  }

  public void setCrNumber(String crNumber) {
    this.crNumber = crNumber;
  }

  public boolean isSaveForFuture() {
    return saveForFuture;
  }

  public void setSaveForFuture(boolean saveForFuture) {
    this.saveForFuture = saveForFuture;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }
}
