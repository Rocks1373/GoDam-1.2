package com.godam.stock.dto;

import java.util.ArrayList;
import java.util.List;

public class StockExpandedDto {
  private StockItemDto parent;
  private List<StockItemDto> children = new ArrayList<>();

  public StockItemDto getParent() {
    return parent;
  }

  public void setParent(StockItemDto parent) {
    this.parent = parent;
  }

  public List<StockItemDto> getChildren() {
    return children;
  }

  public void setChildren(List<StockItemDto> children) {
    this.children = children;
  }
}
