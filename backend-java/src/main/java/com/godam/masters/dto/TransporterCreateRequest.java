package com.godam.masters.dto;

import jakarta.validation.constraints.NotBlank;

public class TransporterCreateRequest {
  @NotBlank
  private String companyName;
  @NotBlank
  private String contactName;
  private String email;
  private boolean saveForFuture = true;

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

  public boolean isSaveForFuture() {
    return saveForFuture;
  }

  public void setSaveForFuture(boolean saveForFuture) {
    this.saveForFuture = saveForFuture;
  }
}
