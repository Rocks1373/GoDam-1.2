package com.godam.orders;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrimaryGeneratedColumn;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "order_workflows")
@Index(name = "UX_OrderWorkflow_Outbound", columnList = "outbound_number", unique = true)
public class OrderWorkflow {
  @PrimaryGeneratedColumn(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "invoice_number")
  private String invoiceNumber;

  @Column(name = "outbound_number")
  private String outboundNumber;

  @Column(name = "gapp_po")
  private String gappPo;

  @Column(name = "customer_po")
  private String customerPo;

  @Column(name = "customer_name")
  private String customerName;

  @Column(name = "dn_created")
  private boolean dnCreated;

  @OneToOne(mappedBy = "order")
  private OrderTransport transport;

  @OneToMany(mappedBy = "order")
  private List<OrderItem> items = new ArrayList<>();

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
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

  public String getGappPo() {
    return gappPo;
  }

  public void setGappPo(String gappPo) {
    this.gappPo = gappPo;
  }

  public String getCustomerPo() {
    return customerPo;
  }

  public void setCustomerPo(String customerPo) {
    this.customerPo = customerPo;
  }

  public String getCustomerName() {
    return customerName;
  }

  public void setCustomerName(String customerName) {
    this.customerName = customerName;
  }

  public boolean isDnCreated() {
    return dnCreated;
  }

  public void setDnCreated(boolean dnCreated) {
    this.dnCreated = dnCreated;
  }

  public OrderTransport getTransport() {
    return transport;
  }

  public void setTransport(OrderTransport transport) {
    this.transport = transport;
  }

  public List<OrderItem> getItems() {
    return items;
  }

  public void setItems(List<OrderItem> items) {
    this.items = items == null ? new ArrayList<>() : items;
  }
}
