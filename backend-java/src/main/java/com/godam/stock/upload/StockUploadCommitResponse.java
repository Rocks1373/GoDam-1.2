package com.godam.stock.upload;

public class StockUploadCommitResponse {
  private final String message;
  private final String errorFileUrl;

  public StockUploadCommitResponse(String message, String errorFileUrl) {
    this.message = message;
    this.errorFileUrl = errorFileUrl;
  }

  public String getMessage() {
    return message;
  }

  public String getErrorFileUrl() {
    return errorFileUrl;
  }
}
