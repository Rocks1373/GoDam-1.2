package com.godam.orders;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrimaryGeneratedColumn;

@Entity(name = "order_items")
public class OrderItem {
  @PrimaryGeneratedColumn(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "part_number")
  private String partNumber;

  @Column(name = "description")
  private String description;

  @Column(name = "qty")
  private Integer qty;

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

  public OrderWorkflow getOrder() {
    return order;
  }

  public void setOrder(OrderWorkflow order) {
    this.order = order;
  }
}
