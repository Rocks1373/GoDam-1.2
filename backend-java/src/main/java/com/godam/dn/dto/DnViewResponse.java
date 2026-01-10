package com.godam.dn.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DnViewResponse {
  // Invoice fields
  private String invoice;
  private String customerPo;
  private String gappPo;
  private String outboundNumber;
  private String date;
  private String time;

  // Customer info
  private String customerName;
  private String address;
  private String googleLocation;
  private String receiver1Name;
  private String receiver1Phone;
  private String receiver2Name;
  private String receiver2Phone;

  // Huawei fields
  private String huaweiContract;
  private String huaweiReference;

  // Project info
  private String projectName;
  private String paymentTerms;
  private String productName;

  // Transport info
  private String carrier;
  private String driverName;
  private String driverMobile;
  private String vehicleNumber;
  private String vehicleType;

  // Sales info
  private String salesName;
  private String salesPhone;
  private String salesEmail;

  // Dispatch info
  private String dispatchFromName;
  private String dispatchFromAddress;
  private String dispatchContactName;
  private String dispatchContactPhone;
  private String dispatchContactEmail;

  // DN specific
  private DnTotals totals = new DnTotals();
  private String dnNumber;
  private String checkedBy;
  private DnOptions options = new DnOptions();
  private List<DnItemView> items = new ArrayList<>();

  // Company info (from configuration)
  private String companyName;
  private String companyNameArabic;
  private String companyAddress;
  private String companyPhone;
  private String companyFax;
  private String companyWebsite;
  private String companyEmail;
  private String crNumber;
  private String vatNumber;
  private String logoUrl;

  // Arabic translations cache (non-persistent)
  private transient Map<String, String> arabicTranslations = new HashMap<>();

  public DnViewResponse() {
    initializeArabicTranslations();
  }

  private void initializeArabicTranslations() {
    arabicTranslations.put("Delivery Note", "شهادة تسليم");
    arabicTranslations.put("Date", "التاريخ");
    arabicTranslations.put("Time", "الوقت");
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
    arabicTranslations.put("Website", "الموقع الإلكتروني");
    arabicTranslations.put("QR Code", "رمز الاستجابة السريعة");
    arabicTranslations.put("Barcode", "الرمز الشريطي");
  }

  public String getArabic(String english) {
    if (options != null && options.isShowArabic()) {
      return arabicTranslations.getOrDefault(english, english);
    }
    return english;
  }

  public String getTranslatedLabel(String english) {
    return getArabic(english);
  }

  // Getters and Setters for existing fields
  public String getInvoice() {
    return invoice;
  }

  public void setInvoice(String invoice) {
    this.invoice = invoice;
  }

  public String getCustomerPo() {
    return customerPo;
  }

  public void setCustomerPo(String customerPo) {
    this.customerPo = customerPo;
  }

  public String getGappPo() {
    return gappPo;
  }

  public void setGappPo(String gappPo) {
    this.gappPo = gappPo;
  }

  public String getOutboundNumber() {
    return outboundNumber;
  }

  public void setOutboundNumber(String outboundNumber) {
    this.outboundNumber = outboundNumber;
  }

  public String getDate() {
    return date;
  }

  public void setDate(String date) {
    this.date = date;
  }

  public String getTime() {
    return time;
  }

  public void setTime(String time) {
    this.time = time;
  }

  public String getCustomerName() {
    return customerName;
  }

  public void setCustomerName(String customerName) {
    this.customerName = customerName;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public String getGoogleLocation() {
    return googleLocation;
  }

  public void setGoogleLocation(String googleLocation) {
    this.googleLocation = googleLocation;
  }

  public String getReceiver1Name() {
    return receiver1Name;
  }

  public void setReceiver1Name(String receiver1Name) {
    this.receiver1Name = receiver1Name;
  }

  public String getReceiver1Phone() {
    return receiver1Phone;
  }

  public void setReceiver1Phone(String receiver1Phone) {
    this.receiver1Phone = receiver1Phone;
  }

  public String getReceiver2Name() {
    return receiver2Name;
  }

  public void setReceiver2Name(String receiver2Name) {
    this.receiver2Name = receiver2Name;
  }

  public String getReceiver2Phone() {
    return receiver2Phone;
  }

  public void setReceiver2Phone(String receiver2Phone) {
    this.receiver2Phone = receiver2Phone;
  }

  public String getHuaweiContract() {
    return huaweiContract;
  }

  public void setHuaweiContract(String huaweiContract) {
    this.huaweiContract = huaweiContract;
  }

  public String getHuaweiReference() {
    return huaweiReference;
  }

  public void setHuaweiReference(String huaweiReference) {
    this.huaweiReference = huaweiReference;
  }

  public String getProjectName() {
    return projectName;
  }

  public void setProjectName(String projectName) {
    this.projectName = projectName;
  }

  public String getPaymentTerms() {
    return paymentTerms;
  }

  public void setPaymentTerms(String paymentTerms) {
    this.paymentTerms = paymentTerms;
  }

  public String getProductName() {
    return productName;
  }

  public void setProductName(String productName) {
    this.productName = productName;
  }

  public String getCarrier() {
    return carrier;
  }

  public void setCarrier(String carrier) {
    this.carrier = carrier;
  }

  public String getDriverName() {
    return driverName;
  }

  public void setDriverName(String driverName) {
    this.driverName = driverName;
  }

  public String getDriverMobile() {
    return driverMobile;
  }

  public void setDriverMobile(String driverMobile) {
    this.driverMobile = driverMobile;
  }

  public String getVehicleNumber() {
    return vehicleNumber;
  }

  public void setVehicleNumber(String vehicleNumber) {
    this.vehicleNumber = vehicleNumber;
  }

  public String getVehicleType() {
    return vehicleType;
  }

  public void setVehicleType(String vehicleType) {
    this.vehicleType = vehicleType;
  }

  public String getSalesName() {
    return salesName;
  }

  public void setSalesName(String salesName) {
    this.salesName = salesName;
  }

  public String getSalesPhone() {
    return salesPhone;
  }

  public void setSalesPhone(String salesPhone) {
    this.salesPhone = salesPhone;
  }

  public String getSalesEmail() {
    return salesEmail;
  }

  public void setSalesEmail(String salesEmail) {
    this.salesEmail = salesEmail;
  }

  public String getDispatchFromName() {
    return dispatchFromName;
  }

  public void setDispatchFromName(String dispatchFromName) {
    this.dispatchFromName = dispatchFromName;
  }

  public String getDispatchFromAddress() {
    return dispatchFromAddress;
  }

  public void setDispatchFromAddress(String dispatchFromAddress) {
    this.dispatchFromAddress = dispatchFromAddress;
  }

  public String getDispatchContactName() {
    return dispatchContactName;
  }

  public void setDispatchContactName(String dispatchContactName) {
    this.dispatchContactName = dispatchContactName;
  }

  public String getDispatchContactPhone() {
    return dispatchContactPhone;
  }

  public void setDispatchContactPhone(String dispatchContactPhone) {
    this.dispatchContactPhone = dispatchContactPhone;
  }

  public String getDispatchContactEmail() {
    return dispatchContactEmail;
  }

  public void setDispatchContactEmail(String dispatchContactEmail) {
    this.dispatchContactEmail = dispatchContactEmail;
  }

  public DnTotals getTotals() {
    return totals;
  }

  public void setTotals(DnTotals totals) {
    this.totals = totals == null ? new DnTotals() : totals;
  }

  public String getDnNumber() {
    return dnNumber;
  }

  public void setDnNumber(String dnNumber) {
    this.dnNumber = dnNumber;
  }

  public String getCheckedBy() {
    return checkedBy;
  }

  public void setCheckedBy(String checkedBy) {
    this.checkedBy = checkedBy;
  }

  public DnOptions getOptions() {
    return options;
  }

  public void setOptions(DnOptions options) {
    this.options = options == null ? new DnOptions() : options;
  }

  public List<DnItemView> getItems() {
    return items;
  }

  public void setItems(List<DnItemView> items) {
    this.items = items == null ? new ArrayList<>() : items;
  }

  // Company info getters and setters
  public String getCompanyName() {
    return companyName;
  }

  public void setCompanyName(String companyName) {
    this.companyName = companyName;
  }

  public String getCompanyNameArabic() {
    return companyNameArabic;
  }

  public void setCompanyNameArabic(String companyNameArabic) {
    this.companyNameArabic = companyNameArabic;
  }

  public String getCompanyAddress() {
    return companyAddress;
  }

  public void setCompanyAddress(String companyAddress) {
    this.companyAddress = companyAddress;
  }

  public String getCompanyPhone() {
    return companyPhone;
  }

  public void setCompanyPhone(String companyPhone) {
    this.companyPhone = companyPhone;
  }

  public String getCompanyFax() {
    return companyFax;
  }

  public void setCompanyFax(String companyFax) {
    this.companyFax = companyFax;
  }

  public String getCompanyWebsite() {
    return companyWebsite;
  }

  public void setCompanyWebsite(String companyWebsite) {
    this.companyWebsite = companyWebsite;
  }

  public String getCompanyEmail() {
    return companyEmail;
  }

  public void setCompanyEmail(String companyEmail) {
    this.companyEmail = companyEmail;
  }

  public String getCrNumber() {
    return crNumber;
  }

  public void setCrNumber(String crNumber) {
    this.crNumber = crNumber;
  }

  public String getVatNumber() {
    return vatNumber;
  }

  public void setVatNumber(String vatNumber) {
    this.vatNumber = vatNumber;
  }

  public String getLogoUrl() {
    return logoUrl;
  }

  public void setLogoUrl(String logoUrl) {
    this.logoUrl = logoUrl;
  }

  // Helper method to get display name based on language
  public String getDisplayCompanyName() {
    if (options != null && options.isShowArabic() && companyNameArabic != null && !companyNameArabic.isEmpty()) {
      return companyNameArabic;
    }
    return companyName;
  }
}

