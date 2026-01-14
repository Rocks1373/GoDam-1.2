package com.godam.stock.upload;

public class DuplicateRowInfo {
  private final String partNumber;
  private final String warehouseNo;
  private final int existingQty;
  private final int uploadedQty;
  private final StockUploadRow row;

  public DuplicateRowInfo(
      String partNumber,
      String warehouseNo,
      int existingQty,
      int uploadedQty,
      StockUploadRow row) {
    this.partNumber = partNumber;
    this.warehouseNo = warehouseNo;
    this.existingQty = existingQty;
    this.uploadedQty = uploadedQty;
    this.row = row;
  }

  public String getPartNumber() {
    return partNumber;
  }

  public String getWarehouseNo() {
    return warehouseNo;
  }

  public int getExistingQty() {
    return existingQty;
  }

  public int getUploadedQty() {
    return uploadedQty;
  }

  public StockUploadRow getRow() {
    return row;
  }
}
