package com.godam.delivery.dto;

import jakarta.validation.constraints.NotBlank;

public class TransporterCreateRequest {
  @NotBlank
  private String companyName;

  private String contactName;
  private String email;

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
