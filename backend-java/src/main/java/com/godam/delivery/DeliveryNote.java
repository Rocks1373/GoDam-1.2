package com.godam.delivery;

import com.godam.masters.Customer;
import com.godam.masters.Driver;
import com.godam.masters.Transporter;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "delivery_note")
public class DeliveryNote {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "dn_number", nullable = false, unique = true)
  private String dnNumber;

  @Column(name = "outbound_number", nullable = false)
  private String outboundNumber;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "customer_id", nullable = false)
  private Customer customer;

  @Column(name = "address")
  private String address;

  @Column(name = "google_map_link")
  private String googleMapLink;

  @Column(name = "requirements", columnDefinition = "TEXT")
  private String requirements;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "transporter_id", nullable = false)
  private Transporter transporter;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "driver_id", nullable = false)
  private Driver driver;

  @Column(name = "status", nullable = false)
  private String status = "draft";

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;

  @OneToMany(
    mappedBy = "deliveryNote",
    cascade = CascadeType.ALL,
    orphanRemoval = true,
    fetch = FetchType.LAZY
  )
  private List<DeliveryNoteQty> quantities = new ArrayList<>();

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

  public Customer getCustomer() {
    return customer;
  }

  public void setCustomer(Customer customer) {
    this.customer = customer;
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

  public Transporter getTransporter() {
    return transporter;
  }

  public void setTransporter(Transporter transporter) {
    this.transporter = transporter;
  }

  public Driver getDriver() {
    return driver;
  }

  public void setDriver(Driver driver) {
    this.driver = driver;
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

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public List<DeliveryNoteQty> getQuantities() {
    return quantities;
  }

  public void setQuantities(List<DeliveryNoteQty> quantities) {
    this.quantities = quantities;
  }

  public void addQuantity(DeliveryNoteQty qty) {
    qty.setDeliveryNote(this);
    this.quantities.add(qty);
  }

  public void removeQuantity(DeliveryNoteQty qty) {
    qty.setDeliveryNote(null);
    this.quantities.remove(qty);
  }

  @PrePersist
  protected void onCreate() {
    Instant now = Instant.now();
    createdAt = now;
    updatedAt = now;
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = Instant.now();
  }
}
