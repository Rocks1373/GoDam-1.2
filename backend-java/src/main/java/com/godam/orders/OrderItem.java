package com.godam.orders;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "OrderItems")
public class OrderItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "part_number")
  private String partNumber;

  @Column(name = "description")
  private String description;

  @Column(name = "qty")
  private Integer qty;

  @Column(name = "picked_by")
  private String pickedBy;

  @Column(name = "picked_at")
  private java.time.LocalDateTime pickedAt;

  @Column(name = "picked_rack")
  private String pickedRack;

  @Column(name = "is_picked")
  private Boolean isPicked;

  @ManyToOne
  private OrderWorkflow order;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getPartNumber() {
    return partNumber;
  }

  public void setPartNumber(String partNumber) {
    this.partNumber = partNumber;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public Integer getQty() {
    return qty;
  }

  public void setQty(Integer qty) {
    this.qty = qty;
  }

  public String getPickedBy() {
    return pickedBy;
  }

  public void setPickedBy(String pickedBy) {
    this.pickedBy = pickedBy;
  }

  public java.time.LocalDateTime getPickedAt() {
    return pickedAt;
  }

  public void setPickedAt(java.time.LocalDateTime pickedAt) {
    this.pickedAt = pickedAt;
  }

  public String getPickedRack() {
    return pickedRack;
  }

  public void setPickedRack(String pickedRack) {
    this.pickedRack = pickedRack;
  }

  public Boolean getIsPicked() {
    return isPicked;
  }

  public void setIsPicked(Boolean isPicked) {
    this.isPicked = isPicked;
  }

  public OrderWorkflow getOrder() {
    return order;
  }

  public void setOrder(OrderWorkflow order) {
    this.order = order;
  }
}
