package com.godam.stock.upload;

import java.util.Map;

public class StockUploadErrorRow {
  private final StockUploadRow row;
  private final String reason;

  public StockUploadErrorRow(StockUploadRow row, String reason) {
    this.row = row;
    this.reason = reason;
  }

  public StockUploadRow getRow() {
    return row;
  }

  public String getReason() {
    return reason;
  }
}
