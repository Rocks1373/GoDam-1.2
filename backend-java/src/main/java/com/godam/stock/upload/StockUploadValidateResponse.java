package com.godam.stock.upload;

import java.util.List;

public class StockUploadValidateResponse {
  private final int validRows;
  private final int invalidRows;
  private final List<DuplicatePayload> duplicates;
  private final String errorFileUrl;
  private final String token;

  public StockUploadValidateResponse(
      int validRows,
      int invalidRows,
      List<DuplicatePayload> duplicates,
      String errorFileUrl,
      String token) {
    this.validRows = validRows;
    this.invalidRows = invalidRows;
    this.duplicates = duplicates;
    this.errorFileUrl = errorFileUrl;
    this.token = token;
  }

  public int getValidRows() {
    return validRows;
  }

  public int getInvalidRows() {
    return invalidRows;
  }

  public List<DuplicatePayload> getDuplicates() {
    return duplicates;
  }

  public String getErrorFileUrl() {
    return errorFileUrl;
  }

  public String getToken() {
    return token;
  }

  public record DuplicatePayload(
      String partNumber, String warehouseNo, int existingQty, int uploadedQty) {}
}
