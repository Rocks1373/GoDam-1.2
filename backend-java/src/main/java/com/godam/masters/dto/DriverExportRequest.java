package com.godam.masters.dto;

import java.util.List;

public class DriverExportRequest {
  private List<Long> driverIds;

  public List<Long> getDriverIds() {
    return driverIds;
  }

  public void setDriverIds(List<Long> driverIds) {
    this.driverIds = driverIds;
  }
}
