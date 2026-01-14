package com.godam.stock.upload;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

public class StockUploadRow {
  private final int rowNumber;
  private final Map<String, String> values;

  public StockUploadRow(int rowNumber, Map<String, String> values) {
    this.rowNumber = rowNumber;
    this.values = Collections.unmodifiableMap(new LinkedHashMap<>(values));
  }

  public int getRowNumber() {
    return rowNumber;
  }

  public Map<String, String> getValues() {
    return values;
  }

  public String get(String column) {
    return values.get(column);
  }
}
