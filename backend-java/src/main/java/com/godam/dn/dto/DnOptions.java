package com.godam.dn.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DnOptions {
  // Display options
  private boolean showQr = true;
  private boolean showSalesman = true;
  private boolean showProject = true;
  private boolean showPayment = false;
  private boolean showArabic = false;
  private boolean showQrCode = true;
  private boolean showCrNumber = false;
  private boolean showVatInfo = false;
  private boolean showBarcode = false;
  private boolean showCompanyLogo = true;
  
  // Print drivers
  private List<DriverPrintDto> printDrivers = new ArrayList<>();
  
  // Arabic translations cache
  private transient Map<String, String> arabicTranslations = new HashMap<>();
  
  public DnOptions() {
    initializeArabicTranslations();
  }
  
  private void initializeArabicTranslations() {
    arabicTranslations.put("Delivery Note", "شهادة تسليم");
    arabicTranslations.put("Date", "التاريخ");
    arabicTranslations.put("Outbound", "رقم الصادر");
    arabicTranslations.put("GAPP PO", "طلب شراء GAPP");
    arabicTranslations.put("Customer PO", "طلب العميل");
    arabicTranslations.put("Invoice", "الفاتورة");
    arabicTranslations.put("Product", "المنتج");
    arabicTranslations.put("Sales Details", "تفاصيل المبيعات");
    arabicTranslations.put("Salesman", "مندوب المبيعات");
    arabicTranslations.put("Phone", "الهاتف");
    arabicTranslations.put("Email", "البريد الإلكتروني");
    arabicTranslations.put("Delivery to", "التسليم إلى");
    arabicTranslations.put("Item #", "بند #");
    arabicTranslations.put("Part Number", "رقم القطعة");
    arabicTranslations.put("Description", "الوصف");
    arabicTranslations.put("Qty", "الكمية");
    arabicTranslations.put("UOM", "وحدة القياس");
    arabicTranslations.put("Condition", "الحالة");
    arabicTranslations.put("Total", "المجموع");
    arabicTranslations.put("CASES", "صناديق");
    arabicTranslations.put("Gross weight (KG)", "الوزن الإجمالي (كجم)");
    arabicTranslations.put("Volume (CBM)", "الحجم (م³)");
    arabicTranslations.put("Delivered by", "سلم بواسطة");
    arabicTranslations.put("Checked by", "فحص بواسطة");
    arabicTranslations.put("Driver(s)", "السائقين");
    arabicTranslations.put("Carrier", "الناقل");
    arabicTranslations.put("Type of Truck and Qty", "نوع الشاحنة والكمية");
    arabicTranslations.put("Below fields are mandatory to be filled by the Receiver", 
        "الحقول أدناه إلزامية ليتم تعبئتها من قبل المستلم");
    arabicTranslations.put("NAME", "الاسم");
    arabicTranslations.put("Mobile no.", "رقم الجوال");
    arabicTranslations.put("SIGN", "التوقيع");
    arabicTranslations.put("DATE", "التاريخ");
    arabicTranslations.put("STAMP", "الختم");
    arabicTranslations.put("Receiver Stamp/Sign", "ختم/توقيع المستلم");
    arabicTranslations.put("Project", "المشروع");
    arabicTranslations.put("Payment Terms", "شروط الدفع");
    arabicTranslations.put("Total Parts", "إجمالي القطع");
    arabicTranslations.put("Total Qty", "إجمالي الكمية");
    arabicTranslations.put("Commercial Registration", "السجل التجاري");
    arabicTranslations.put("VAT Number", "الرقم الضريبي");
    arabicTranslations.put("Tel", "هاتف");
    arabicTranslations.put("Fax", "فاكس");
  }
  
  public String getArabic(String english) {
    return arabicTranslations.getOrDefault(english, english);
  }
  
  // Getters and Setters
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

  public boolean isShowArabic() {
    return showArabic;
  }

  public void setShowArabic(boolean showArabic) {
    this.showArabic = showArabic;
  }

  public boolean isShowQrCode() {
    return showQrCode;
  }

  public void setShowQrCode(boolean showQrCode) {
    this.showQrCode = showQrCode;
  }

  public boolean isShowCrNumber() {
    return showCrNumber;
  }

  public void setShowCrNumber(boolean showCrNumber) {
    this.showCrNumber = showCrNumber;
  }

  public boolean isShowVatInfo() {
    return showVatInfo;
  }

  public void setShowVatInfo(boolean showVatInfo) {
    this.showVatInfo = showVatInfo;
  }

  public boolean isShowBarcode() {
    return showBarcode;
  }

  public void setShowBarcode(boolean showBarcode) {
    this.showBarcode = showBarcode;
  }

  public boolean isShowCompanyLogo() {
    return showCompanyLogo;
  }

  public void setShowCompanyLogo(boolean showCompanyLogo) {
    this.showCompanyLogo = showCompanyLogo;
  }

  public List<DriverPrintDto> getPrintDrivers() {
    return printDrivers;
  }

  public void setPrintDrivers(List<DriverPrintDto> printDrivers) {
    this.printDrivers = printDrivers == null ? new ArrayList<>() : printDrivers;
  }
}

