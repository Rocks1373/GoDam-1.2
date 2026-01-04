package com.godam.orders.dto;

import java.util.ArrayList;
import java.util.List;

public class OrderViewDto {
  private OrderSummaryDto summary;
  private List<OrderItemDto> items = new ArrayList<>();

  public OrderSummaryDto getSummary() {
    return summary;
  }

  public void setSummary(OrderSummaryDto summary) {
    this.summary = summary;
  }

  public List<OrderItemDto> getItems() {
    return items;
  }

  public void setItems(List<OrderItemDto> items) {
    this.items = items == null ? new ArrayList<>() : items;
  }
}
