package com.godam.delivery;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "delivery_note_qty")
public class DeliveryNoteQty {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "dn_id", nullable = false)
  private DeliveryNote deliveryNote;

  @Column(name = "description", columnDefinition = "TEXT", nullable = false)
  private String description;

  @Column(name = "quantity", nullable = false)
  private Integer quantity;

  @Column(name = "created_at")
  private Instant createdAt;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public DeliveryNote getDeliveryNote() {
    return deliveryNote;
  }

  public void setDeliveryNote(DeliveryNote deliveryNote) {
    this.deliveryNote = deliveryNote;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public Integer getQuantity() {
    return quantity;
  }

  public void setQuantity(Integer quantity) {
    this.quantity = quantity;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  @PrePersist
  protected void onCreate() {
    createdAt = Instant.now();
  }
}
