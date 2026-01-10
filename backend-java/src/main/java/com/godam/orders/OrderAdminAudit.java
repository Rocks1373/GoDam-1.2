package com.godam.orders;

import java.time.Instant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "OrderAdminAudits")
public class OrderAdminAudit {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "order_id")
  private Long orderId;

  @Column(name = "outbound_number")
  private String outboundNumber;

  @Enumerated(EnumType.STRING)
  private OrderAdminAction action;

  @Column(name = "performed_by")
  private String performedBy;

  @Column(length = 1000)
  private String reason;

  @Column(length = 1000)
  private String details;

  @Column(name = "created_at")
  private Instant createdAt;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Long getOrderId() {
    return orderId;
  }

  public void setOrderId(Long orderId) {
    this.orderId = orderId;
  }

  public String getOutboundNumber() {
    return outboundNumber;
  }

  public void setOutboundNumber(String outboundNumber) {
    this.outboundNumber = outboundNumber;
  }

  public OrderAdminAction getAction() {
    return action;
  }

  public void setAction(OrderAdminAction action) {
    this.action = action;
  }

  public String getPerformedBy() {
    return performedBy;
  }

  public void setPerformedBy(String performedBy) {
    this.performedBy = performedBy;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }

  public String getDetails() {
    return details;
  }

  public void setDetails(String details) {
    this.details = details;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
