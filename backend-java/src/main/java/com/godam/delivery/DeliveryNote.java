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

  @Column(name = "customer_po")
  private String customerPo;

  @Column(name = "gapp_po")
  private String gappPo;

  @Column(name = "invoice_number")
  private String invoiceNumber;

  @Column(name = "prepared_by")
  private String preparedBy;

  @Column(name = "truck_type")
  private String truckType;

  @Column(name = "dn_date")
  private Instant dnDate;

  @Column(name = "outbound_number", nullable = false)
  private String outboundNumber;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "customer_id", nullable = false)
  private Customer customer;

  // Customer snapshot fields - persist at DN creation time
  @Column(name = "customer_name")
  private String customerName;

  @Column(name = "customer_phone")
  private String customerPhone;

  @Column(name = "address")
  private String address;

  @Column(name = "google_map_link")
  private String googleMapLink;

  @Column(name = "requirements", columnDefinition = "TEXT")
  private String requirements;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "transporter_id", nullable = false)
  private Transporter transporter;

  // Transporter snapshot fields - persist at DN creation time
  @Column(name = "transporter_name")
  private String transporterName;

  @Column(name = "transporter_phone")
  private String transporterPhone;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "driver_id", nullable = false)
  private Driver driver;

  // Driver snapshot fields - persist at DN creation time
  @Column(name = "driver_name")
  private String driverName;

  @Column(name = "driver_phone")
  private String driverPhone;

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

  public String getCustomerPo() {
    return customerPo;
  }

  public void setCustomerPo(String customerPo) {
    this.customerPo = customerPo;
  }

  public String getGappPo() {
    return gappPo;
  }

  public void setGappPo(String gappPo) {
    this.gappPo = gappPo;
  }

  public String getInvoiceNumber() {
    return invoiceNumber;
  }

  public void setInvoiceNumber(String invoiceNumber) {
    this.invoiceNumber = invoiceNumber;
  }

  public String getPreparedBy() {
    return preparedBy;
  }

  public void setPreparedBy(String preparedBy) {
    this.preparedBy = preparedBy;
  }

  public String getTruckType() {
    return truckType;
  }

  public void setTruckType(String truckType) {
    this.truckType = truckType;
  }

  public Instant getDnDate() {
    return dnDate;
  }

  public void setDnDate(Instant dnDate) {
    this.dnDate = dnDate;
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

  public String getCustomerName() {
    return customerName;
  }

  public void setCustomerName(String customerName) {
    this.customerName = customerName;
  }

  public String getCustomerPhone() {
    return customerPhone;
  }

  public void setCustomerPhone(String customerPhone) {
    this.customerPhone = customerPhone;
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

  public String getTransporterName() {
    return transporterName;
  }

  public void setTransporterName(String transporterName) {
    this.transporterName = transporterName;
  }

  public String getTransporterPhone() {
    return transporterPhone;
  }

  public void setTransporterPhone(String transporterPhone) {
    this.transporterPhone = transporterPhone;
  }

  public Driver getDriver() {
    return driver;
  }

  public void setDriver(Driver driver) {
    this.driver = driver;
  }

  public String getDriverName() {
    return driverName;
  }

  public void setDriverName(String driverName) {
    this.driverName = driverName;
  }

  public String getDriverPhone() {
    return driverPhone;
  }

  public void setDriverPhone(String driverPhone) {
    this.driverPhone = driverPhone;
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
