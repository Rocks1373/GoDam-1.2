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
  private String notes;

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

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }
}
