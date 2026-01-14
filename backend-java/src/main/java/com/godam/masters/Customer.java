package com.godam.masters;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "customers")
public class Customer {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "name")
  private String name;

  @Column(name = "city")
  private String city;

  @Column(name = "location_text")
  private String locationText;

  @Column(name = "google_location")
  private String googleLocation;

  @Column(name = "sap_customer_id")
  private String sapCustomerId;

  @Column(name = "receiver1_name")
  private String receiver1Name;

  @Column(name = "receiver1_contact")
  private String receiver1Contact;

  @Column(name = "receiver1_email")
  private String receiver1Email;

  @Column(name = "receiver1_designation")
  private String receiver1Designation;

  @Column(name = "receiver2_name")
  private String receiver2Name;

  @Column(name = "receiver2_contact")
  private String receiver2Contact;

  @Column(name = "receiver2_email")
  private String receiver2Email;

  @Column(name = "receiver2_designation")
  private String receiver2Designation;

  @Column(name = "requirements")
  private String requirements;

  @Column(name = "notes")
  private String notes;

  @Column(name = "is_active")
  private boolean active = true;

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;

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

  public String getReceiver1Name() {
    return receiver1Name;
  }

  public void setReceiver1Name(String receiver1Name) {
    this.receiver1Name = receiver1Name;
  }

  public String getReceiver1Contact() {
    return receiver1Contact;
  }

  public void setReceiver1Contact(String receiver1Contact) {
    this.receiver1Contact = receiver1Contact;
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

  public String getReceiver2Contact() {
    return receiver2Contact;
  }

  public void setReceiver2Contact(String receiver2Contact) {
    this.receiver2Contact = receiver2Contact;
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

  public String getRequirements() {
    return requirements;
  }

  public void setRequirements(String requirements) {
    this.requirements = requirements;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
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
}
