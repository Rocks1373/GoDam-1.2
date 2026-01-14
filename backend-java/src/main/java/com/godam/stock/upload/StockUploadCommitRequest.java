package com.godam.stock.upload;

public class StockUploadCommitRequest {
  private String token;
  private StockUploadAction action;

  public String getToken() {
    return token;
  }

  public void setToken(String token) {
    this.token = token;
  }

  public StockUploadAction getAction() {
    return action;
  }

  public void setAction(StockUploadAction action) {
    this.action = action;
  }
}
