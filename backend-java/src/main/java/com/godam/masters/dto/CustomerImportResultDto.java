package com.godam.masters.dto;

import java.util.List;

public class CustomerImportResultDto {
  private int totalRows;
  private int importedRows;
  private List<CustomerImportErrorDto> errors;
  private String uploadedFilePath;

  public CustomerImportResultDto(
      int totalRows, int importedRows, List<CustomerImportErrorDto> errors, String uploadedFilePath) {
    this.totalRows = totalRows;
    this.importedRows = importedRows;
    this.errors = errors;
    this.uploadedFilePath = uploadedFilePath;
  }

  public int getTotalRows() {
    return totalRows;
  }

  public void setTotalRows(int totalRows) {
    this.totalRows = totalRows;
  }

  public int getImportedRows() {
    return importedRows;
  }

  public void setImportedRows(int importedRows) {
    this.importedRows = importedRows;
  }

  public List<CustomerImportErrorDto> getErrors() {
    return errors;
  }

  public void setErrors(List<CustomerImportErrorDto> errors) {
    this.errors = errors;
  }

  public String getUploadedFilePath() {
    return uploadedFilePath;
  }

  public void setUploadedFilePath(String uploadedFilePath) {
    this.uploadedFilePath = uploadedFilePath;
  }
}
