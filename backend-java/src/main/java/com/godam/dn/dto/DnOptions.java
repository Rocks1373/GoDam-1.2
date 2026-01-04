package com.godam.dn.dto;

import java.util.ArrayList;
import java.util.List;

public class DnOptions {
  private boolean showQr = true;
  private boolean showSalesman = true;
  private boolean showProject = true;
  private boolean showPayment = false;
  private List<DriverPrintDto> printDrivers = new ArrayList<>();

  public boolean isShowQr() {
    return showQr;
  }

  public void setShowQr(boolean showQr) {
    this.showQr = showQr;
  }

  public boolean isShowSalesman() {
    return showSalesman;
  }

  public void setShowSalesman(boolean showSalesman) {
    this.showSalesman = showSalesman;
  }

  public boolean isShowProject() {
    return showProject;
  }

  public void setShowProject(boolean showProject) {
    this.showProject = showProject;
  }

  public boolean isShowPayment() {
    return showPayment;
  }

  public void setShowPayment(boolean showPayment) {
    this.showPayment = showPayment;
  }

  public List<DriverPrintDto> getPrintDrivers() {
    return printDrivers;
  }

  public void setPrintDrivers(List<DriverPrintDto> printDrivers) {
    this.printDrivers = printDrivers == null ? new ArrayList<>() : printDrivers;
  }
}
