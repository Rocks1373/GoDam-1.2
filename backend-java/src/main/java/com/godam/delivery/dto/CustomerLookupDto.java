package com.godam.delivery.dto;

public class CustomerLookupDto {
  private Long id;
  private String name;
  private String city;
  private String locationText;
  private String googleLocation;
  private String sapCustomerId;
  private String receiver1Contact;
  private String receiver2Contact;
  private String requirements;
  private String receiver1Name;
  private String receiver1Email;
  private String receiver1Designation;
  private String receiver2Name;
  private String receiver2Email;
  private String receiver2Designation;
  private String notes;
  private Boolean active;

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

  public String getSapCustomerId() {
    return sapCustomerId;
  }

  public void setSapCustomerId(String sapCustomerId) {
    this.sapCustomerId = sapCustomerId;
  }

  public String getReceiver1Contact() {
    return receiver1Contact;
  }

  public void setReceiver1Contact(String receiver1Contact) {
    this.receiver1Contact = receiver1Contact;
  }

  public String getReceiver2Contact() {
    return receiver2Contact;
  }

  public void setReceiver2Contact(String receiver2Contact) {
    this.receiver2Contact = receiver2Contact;
  }

  public String getRequirements() {
    return requirements;
  }

  public void setRequirements(String requirements) {
    this.requirements = requirements;
  }

  public String getReceiver1Name() {
    return receiver1Name;
  }

  public void setReceiver1Name(String receiver1Name) {
    this.receiver1Name = receiver1Name;
  }

  public String getReceiver1Email() {
    return receiver1Email;
  }

  public void setReceiver1Email(String receiver1Email) {
    this.receiver1Email = receiver1Email;
  }

  public String getReceiver1Designation() {
    return receiver1Designation;
  }

  public void setReceiver1Designation(String receiver1Designation) {
    this.receiver1Designation = receiver1Designation;
  }

  public String getReceiver2Name() {
    return receiver2Name;
  }

  public void setReceiver2Name(String receiver2Name) {
    this.receiver2Name = receiver2Name;
  }

  public String getReceiver2Email() {
    return receiver2Email;
  }

  public void setReceiver2Email(String receiver2Email) {
    this.receiver2Email = receiver2Email;
  }

  public String getReceiver2Designation() {
    return receiver2Designation;
  }

  public void setReceiver2Designation(String receiver2Designation) {
    this.receiver2Designation = receiver2Designation;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public Boolean getActive() {
    return active;
  }

  public void setActive(Boolean active) {
    this.active = active;
  }
}
