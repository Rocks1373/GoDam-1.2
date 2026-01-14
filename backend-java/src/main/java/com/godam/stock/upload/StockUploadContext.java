package com.godam.stock.upload;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class StockUploadContext {
  private final String token = UUID.randomUUID().toString();
  private final List<StockUploadItem> validItems;
  private final List<StockUploadErrorRow> invalidRows;
  private final List<DuplicateRowInfo> duplicates;
  private final List<String> headers;
  private Path errorFile;
  private boolean committed;

  public StockUploadContext(
      List<String> headers,
      List<StockUploadItem> validItems,
      List<StockUploadErrorRow> invalidRows,
      List<DuplicateRowInfo> duplicates) {
    this.headers = new ArrayList<>(headers);
    this.validItems = new ArrayList<>(validItems);
    this.invalidRows = new ArrayList<>(invalidRows);
    this.duplicates = new ArrayList<>(duplicates);
  }

  public String getToken() {
    return token;
  }

  public List<StockUploadItem> getValidItems() {
    return validItems;
  }

  public List<StockUploadErrorRow> getInvalidRows() {
    return invalidRows;
  }

  public List<DuplicateRowInfo> getDuplicates() {
    return duplicates;
  }

  public List<String> getHeaders() {
    return headers;
  }

  public Path getErrorFile() {
    return errorFile;
  }

  public void setErrorFile(Path errorFile) {
    this.errorFile = errorFile;
  }

  public boolean isCommitted() {
    return committed;
  }

  public void markCommitted() {
    this.committed = true;
  }
}
