package com.godam.movements.dto;

import java.time.Instant;

public class MovementViewDto {
  private Long id;
  private Instant createdAt;
  private String partNumber;
  private String description;
  private String movementType;
  private String movementTypeDescription;
  private Integer qty;
  private String reference;
  private String user;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
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

  public String getMovementType() {
    return movementType;
  }

  public void setMovementType(String movementType) {
    this.movementType = movementType;
  }

  public String getMovementTypeDescription() {
    return movementTypeDescription;
  }

  public void setMovementTypeDescription(String movementTypeDescription) {
    this.movementTypeDescription = movementTypeDescription;
  }

  public Integer getQty() {
    return qty;
  }

  public void setQty(Integer qty) {
    this.qty = qty;
  }

  public String getReference() {
    return reference;
  }

  public void setReference(String reference) {
    this.reference = reference;
  }

  public String getUser() {
    return user;
  }

  public void setUser(String user) {
    this.user = user;
  }
}
