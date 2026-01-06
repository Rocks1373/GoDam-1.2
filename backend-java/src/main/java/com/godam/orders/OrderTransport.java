package com.godam.orders;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "OrderTransport")
public class OrderTransport {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "transporter_name")
  private String transporterName;

  @Column(name = "driver_name")
  private String driverName;

  @Column(name = "driver_number")
  private String driverNumber;

  @Column(name = "invoice_number")
  private String invoiceNumber;

  @Column(name = "outbound_number")
  private String outboundNumber;

  @Column(name = "from_location")
  private String fromLocation;

  @Column(name = "to_location")
  private String toLocation;

  @Column(name = "vehicle_type")
  private String vehicleType;

  @Column(name = "quantity")
  private Integer quantity;

  @Column(name = "remarks")
  private String remarks;

  @Column(name = "transporter_id")
  private Long transporterId;

  @Column(name = "driver_id")
  private Long driverId;

  @OneToOne
  @JoinColumn(name = "order_id")
  private OrderWorkflow order;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getTransporterName() {
    return transporterName;
  }

  public void setTransporterName(String transporterName) {
    this.transporterName = transporterName;
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

  public String getInvoiceNumber() {
    return invoiceNumber;
  }

  public void setInvoiceNumber(String invoiceNumber) {
    this.invoiceNumber = invoiceNumber;
  }

  public String getOutboundNumber() {
    return outboundNumber;
  }

  public void setOutboundNumber(String outboundNumber) {
    this.outboundNumber = outboundNumber;
  }

  public String getFromLocation() {
    return fromLocation;
  }

  public void setFromLocation(String fromLocation) {
    this.fromLocation = fromLocation;
  }

  public String getToLocation() {
    return toLocation;
  }

  public void setToLocation(String toLocation) {
    this.toLocation = toLocation;
  }

  public String getVehicleType() {
    return vehicleType;
  }

  public void setVehicleType(String vehicleType) {
    this.vehicleType = vehicleType;
  }

  public Integer getQuantity() {
    return quantity;
  }

  public void setQuantity(Integer quantity) {
    this.quantity = quantity;
  }

  public String getRemarks() {
    return remarks;
  }

  public void setRemarks(String remarks) {
    this.remarks = remarks;
  }

  public Long getTransporterId() {
    return transporterId;
  }

  public void setTransporterId(Long transporterId) {
    this.transporterId = transporterId;
  }

  public Long getDriverId() {
    return driverId;
  }

  public void setDriverId(Long driverId) {
    this.driverId = driverId;
  }

  public OrderWorkflow getOrder() {
    return order;
  }

  public void setOrder(OrderWorkflow order) {
    this.order = order;
  }
}
