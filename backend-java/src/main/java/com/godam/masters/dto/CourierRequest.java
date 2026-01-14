package com.godam.masters.dto;

import jakarta.validation.constraints.NotBlank;

public class CourierRequest {
  @NotBlank
  private String name;
  private String phone;
  private String email;
  private String vatNo;
  private String crNo;
  private boolean active = true;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
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

  public String getVatNo() {
    return vatNo;
  }

  public void setVatNo(String vatNo) {
    this.vatNo = vatNo;
  }

  public String getCrNo() {
    return crNo;
  }

  public void setCrNo(String crNo) {
    this.crNo = crNo;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }
}
