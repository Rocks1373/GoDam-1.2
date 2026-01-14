package com.godam.stock.upload;

import java.util.List;

public class StockUploadDocument {
  private final List<String> headers;
  private final List<StockUploadRow> rows;

  public StockUploadDocument(List<String> headers, List<StockUploadRow> rows) {
    this.headers = headers;
    this.rows = rows;
  }

  public List<String> getHeaders() {
    return headers;
  }

  public List<StockUploadRow> getRows() {
    return rows;
  }
}
