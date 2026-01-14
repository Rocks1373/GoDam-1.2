package com.godam.masters.service;

import com.godam.common.User;
import com.godam.common.UserRepository;
import com.godam.common.exception.BusinessRuleException;
import com.godam.masters.Driver;
import com.godam.masters.Transporter;
import com.godam.masters.dto.AdminDeleteRequest;
import com.godam.masters.dto.DriverCreateRequest;
import com.godam.masters.dto.DriverDto;
import com.godam.masters.dto.DriverExportRequest;
import com.godam.masters.dto.TransporterCreateRequest;
import com.godam.masters.dto.TransporterDto;
import com.godam.masters.repository.DriverRepository;
import com.godam.masters.repository.TransporterRepository;
import com.godam.orders.OrderAdminAction;
import com.godam.orders.OrderAdminAudit;
import com.godam.orders.repository.OrderAdminAuditRepository;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MastersService {
  private final DriverRepository driverRepository;
  private final TransporterRepository transporterRepository;
  private final OrderAdminAuditRepository orderAdminAuditRepository;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final Path driverUploadDirectory;
  private final DateTimeFormatter dateFormatter = DateTimeFormatter.ISO_DATE;

  public MastersService(
      DriverRepository driverRepository,
      TransporterRepository transporterRepository,
      OrderAdminAuditRepository orderAdminAuditRepository,
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      @Value("${godam.drivers.upload-dir:uploads/drivers}") String uploadDir) throws IOException {
    this.driverRepository = driverRepository;
    this.transporterRepository = transporterRepository;
    this.orderAdminAuditRepository = orderAdminAuditRepository;
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.driverUploadDirectory = Path.of(uploadDir).toAbsolutePath().normalize();
    Files.createDirectories(this.driverUploadDirectory);
  }

  @Transactional(readOnly = true)
  public List<DriverDto> searchDrivers(String query) {
    List<Driver> drivers = isBlank(query)
        ? driverRepository.findAll()
        : driverRepository.searchAll(query.trim());
    List<DriverDto> results = new ArrayList<>();
    for (Driver driver : drivers) {
      results.add(toDto(driver));
    }
    return results;
  }

  @Transactional
  public DriverDto createDriver(DriverCreateRequest request, Long userId) {
    String name = normalize(request.getDriverName());
    String number = normalize(request.getDriverNumber());
    String idNumber = normalize(request.getIdNumber());
    String truckNo = normalize(request.getTruckNo());
    String nationality = normalize(request.getNationality());

    Optional<Driver> existing = driverRepository
        .findFirstByDriverNameIgnoreCaseAndDriverNumberIgnoreCaseAndIsActiveTrue(name, number);
    if (existing.isPresent()) {
      return toDto(existing.get());
    }

    if (!request.isSaveForFuture()) {
      DriverDto dto = new DriverDto();
      dto.setDriverName(name);
      dto.setDriverNumber(number);
      dto.setIdNumber(idNumber);
      dto.setTruckNo(truckNo);
      dto.setNationality(nationality);
      dto.setIqamaExpiryDate(formatDate(request.getIqamaExpiryDate()));
      dto.setLicenseExpiryDate(formatDate(request.getLicenseExpiryDate()));
      dto.setActive(false);
      return dto;
    }

    Driver driver = new Driver();
    driver.setDriverName(name);
    driver.setDriverNumber(number);
    driver.setIdNumber(idNumber);
    driver.setTruckNo(truckNo);
    driver.setNationality(nationality);
    driver.setIqamaExpiryDate(request.getIqamaExpiryDate());
    driver.setLicenseExpiryDate(request.getLicenseExpiryDate());
    driver.setActive(request.isActive());
    driver.setCreatedAt(Instant.now());
    if (userId != null && userId > 0) {
      driver.setUserId(userId);
    }
    return toDto(driverRepository.save(driver));
  }

  @Transactional
  public DriverDto updateDriver(Long id, DriverCreateRequest request) {
    Driver driver = driverRepository.findById(id)
        .orElseThrow(() -> new BusinessRuleException("Driver not found."));
    driver.setDriverName(normalize(request.getDriverName()));
    driver.setDriverNumber(normalize(request.getDriverNumber()));
    driver.setIdNumber(normalize(request.getIdNumber()));
    driver.setTruckNo(normalize(request.getTruckNo()));
    driver.setNationality(normalize(request.getNationality()));
    driver.setIqamaExpiryDate(request.getIqamaExpiryDate());
    driver.setLicenseExpiryDate(request.getLicenseExpiryDate());
    driver.setActive(request.isActive());
    return toDto(driverRepository.save(driver));
  }

  @Transactional(readOnly = true)
  public List<TransporterDto> searchTransporters(String query) {
    List<Transporter> transporters = isBlank(query)
        ? transporterRepository.findAll()
        : transporterRepository.searchAll(query.trim());
    List<TransporterDto> results = new ArrayList<>();
    for (Transporter transporter : transporters) {
      results.add(toDto(transporter));
    }
    return results;
  }

  @Transactional
  public TransporterDto createTransporter(TransporterCreateRequest request, Long userId) {
    String company = normalize(request.getCompanyName());
    String contact = normalize(request.getContactName());
    String phone = normalize(request.getPhone());
    String email = normalize(request.getEmail());
    String vat = normalize(request.getVatNumber());
    String cr = normalize(request.getCrNumber());

    Optional<Transporter> existing = transporterRepository.findFirstByCompanyNameIgnoreCaseAndIsActiveTrue(company);
    if (existing.isPresent()) {
      return toDto(existing.get());
    }

    if (!request.isSaveForFuture()) {
      TransporterDto dto = new TransporterDto();
      dto.setCompanyName(company);
      dto.setContactName(contact);
      dto.setPhone(phone);
      dto.setEmail(email);
      dto.setVatNumber(vat);
      dto.setCrNumber(cr);
      dto.setActive(false);
      return dto;
    }

    Transporter transporter = new Transporter();
    transporter.setCompanyName(company);
    transporter.setContactName(contact);
    transporter.setPhone(phone);
    transporter.setEmail(email);
    transporter.setVatNumber(vat);
    transporter.setCrNumber(cr);
    transporter.setActive(request.isActive());
    transporter.setCreatedAt(Instant.now());
    return toDto(transporterRepository.save(transporter));
  }

  @Transactional
  public TransporterDto updateTransporter(Long id, TransporterCreateRequest request) {
    Transporter transporter = transporterRepository.findById(id)
        .orElseThrow(() -> new BusinessRuleException("Transporter not found."));
    transporter.setCompanyName(normalize(request.getCompanyName()));
    transporter.setContactName(normalize(request.getContactName()));
    transporter.setPhone(normalize(request.getPhone()));
    transporter.setEmail(normalize(request.getEmail()));
    transporter.setVatNumber(normalize(request.getVatNumber()));
    transporter.setCrNumber(normalize(request.getCrNumber()));
    transporter.setActive(request.isActive());
    return toDto(transporterRepository.save(transporter));
  }

  @Transactional
  public void deleteTransporter(Long id, AdminDeleteRequest request) {
    String performedBy = requireAdminPassword(request);
    Transporter transporter = transporterRepository.findById(id)
        .orElseThrow(() -> new BusinessRuleException("Transporter not found."));
    transporterRepository.delete(transporter);
    saveDeleteAudit(OrderAdminAction.DELETE_TRANSPORTER, request.getReason(), performedBy,
        "Deleted transporter id=" + transporter.getId()
            + ", company=" + safe(transporter.getCompanyName())
            + ", contact=" + safe(transporter.getContactName()));
  }

  @Transactional
  public void deleteDriver(Long id, AdminDeleteRequest request) {
    String performedBy = requireAdminPassword(request);
    Driver driver = driverRepository.findById(id)
        .orElseThrow(() -> new BusinessRuleException("Driver not found."));
    driverRepository.delete(driver);
    saveDeleteAudit(OrderAdminAction.DELETE_DRIVER, request.getReason(), performedBy,
        "Deleted driver id=" + driver.getId()
            + ", name=" + safe(driver.getDriverName())
            + ", iqama=" + safe(driver.getIdNumber()));
  }

  @Transactional
  public DriverDto uploadDriverDocuments(Long id, MultipartFile iqama, MultipartFile license,
      MultipartFile istimara, MultipartFile insurance, MultipartFile truckFront, MultipartFile truckBack)
      throws IOException {
    Driver driver = driverRepository.findById(id)
        .orElseThrow(() -> new BusinessRuleException("Driver not found."));
    if (iqama != null && !iqama.isEmpty()) {
      driver.setIqamaImage(storeDriverFile(id, "iqama", iqama));
    }
    if (license != null && !license.isEmpty()) {
      driver.setLicenseImage(storeDriverFile(id, "license", license));
    }
    if (istimara != null && !istimara.isEmpty()) {
      driver.setIstimaraImage(storeDriverFile(id, "istimara", istimara));
    }
    if (insurance != null && !insurance.isEmpty()) {
      driver.setInsuranceImage(storeDriverFile(id, "insurance", insurance));
    }
    if (truckFront != null && !truckFront.isEmpty()) {
      driver.setTruckFrontImage(storeDriverFile(id, "truck-front", truckFront));
    }
    if (truckBack != null && !truckBack.isEmpty()) {
      driver.setTruckBackImage(storeDriverFile(id, "truck-back", truckBack));
    }
    return toDto(driverRepository.save(driver));
  }

  @Transactional(readOnly = true)
  public byte[] exportDrivers(DriverExportRequest request) throws IOException {
    if (request == null || request.getDriverIds() == null || request.getDriverIds().isEmpty()) {
      throw new BusinessRuleException("Select at least one driver to export.");
    }
    List<Driver> drivers = driverRepository.findAllById(request.getDriverIds());
    if (drivers.isEmpty()) {
      throw new BusinessRuleException("No drivers found for export.");
    }
    byte[] excel = buildDriverExcel(drivers);
    try (ByteArrayOutputStream output = new ByteArrayOutputStream();
        ZipOutputStream zip = new ZipOutputStream(output)) {
      ZipEntry excelEntry = new ZipEntry("drivers.xlsx");
      zip.putNextEntry(excelEntry);
      zip.write(excel);
      zip.closeEntry();

      for (Driver driver : drivers) {
        byte[] pdf = buildDriverPdf(driver);
        if (pdf.length == 0) {
          continue;
        }
        String filename = buildDriverPdfName(driver);
        zip.putNextEntry(new ZipEntry(filename));
        zip.write(pdf);
        zip.closeEntry();
      }
      zip.finish();
      return output.toByteArray();
    }
  }

  private DriverDto toDto(Driver driver) {
    DriverDto dto = new DriverDto();
    dto.setId(driver.getId());
    dto.setDriverName(driver.getDriverName());
    dto.setDriverNumber(driver.getDriverNumber());
    dto.setIdNumber(driver.getIdNumber());
    dto.setTruckNo(driver.getTruckNo());
    dto.setNationality(driver.getNationality());
    dto.setIqamaExpiryDate(formatDate(driver.getIqamaExpiryDate()));
    dto.setLicenseExpiryDate(formatDate(driver.getLicenseExpiryDate()));
    dto.setIqamaImage(driver.getIqamaImage());
    dto.setLicenseImage(driver.getLicenseImage());
    dto.setIstimaraImage(driver.getIstimaraImage());
    dto.setInsuranceImage(driver.getInsuranceImage());
    dto.setTruckFrontImage(driver.getTruckFrontImage());
    dto.setTruckBackImage(driver.getTruckBackImage());
    dto.setActive(driver.isActive());
    return dto;
  }

  private TransporterDto toDto(Transporter transporter) {
    TransporterDto dto = new TransporterDto();
    dto.setId(transporter.getId());
    dto.setCompanyName(transporter.getCompanyName());
    dto.setContactName(transporter.getContactName());
    dto.setPhone(transporter.getPhone());
    dto.setEmail(transporter.getEmail());
    dto.setVatNumber(transporter.getVatNumber());
    dto.setCrNumber(transporter.getCrNumber());
    dto.setActive(transporter.isActive());
    return dto;
  }

  private boolean isBlank(String value) {
    return value == null || value.trim().isEmpty();
  }

  private String normalize(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private String requireAdminPassword(AdminDeleteRequest request) {
    if (request == null) {
      throw new BusinessRuleException("Admin password is required.");
    }
    if (request.getReason() == null || request.getReason().isBlank()) {
      throw new BusinessRuleException("Reason is required for this action.");
    }
    String performedBy = request.getPerformedBy();
    if (performedBy == null || performedBy.isBlank()) {
      throw new BusinessRuleException("Performed by is required.");
    }
    User user = userRepository.findByUsername(performedBy)
        .orElseThrow(() -> new BusinessRuleException("Admin user not found."));
    if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
      throw new BusinessRuleException("Only ADMIN can perform this action.");
    }
    String password = request.getAdminPassword();
    if (password == null || password.isBlank()) {
      throw new BusinessRuleException("Admin password is required.");
    }
    if (!passwordEncoder.matches(password, user.getPassword())) {
      throw new BusinessRuleException("Invalid admin password.");
    }
    return user.getUsername();
  }

  private void saveDeleteAudit(OrderAdminAction action, String reason, String performedBy, String details) {
    OrderAdminAudit audit = new OrderAdminAudit();
    audit.setOrderId(null);
    audit.setOutboundNumber(null);
    audit.setAction(action);
    audit.setReason(reason);
    audit.setPerformedBy(performedBy);
    audit.setDetails(details);
    audit.setCreatedAt(Instant.now());
    orderAdminAuditRepository.save(audit);
  }

  private String formatDate(LocalDate value) {
    if (value == null) {
      return "";
    }
    return dateFormatter.format(value);
  }

  private String storeDriverFile(Long driverId, String label, MultipartFile file) throws IOException {
    String original = file.getOriginalFilename();
    String suffix = original == null ? "upload" : original.replaceAll("\\s+", "_");
    String filename = label + "_" + UUID.randomUUID() + "_" + suffix;
    Path driverDir = driverUploadDirectory.resolve(String.valueOf(driverId));
    Files.createDirectories(driverDir);
    Path target = driverDir.resolve(filename).normalize();
    try (InputStream inputStream = file.getInputStream()) {
      Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
    }
    return target.toString();
  }

  private String safe(String value) {
    return value == null ? "-" : value;
  }

  private byte[] buildDriverExcel(List<Driver> drivers) throws IOException {
    try (Workbook workbook = new XSSFWorkbook();
        ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet("Drivers");
      String[] headers =
          new String[] {
            "Driver Name",
            "Driver Number",
            "Iqama No",
            "Truck Number",
            "Nationality",
            "Iqama Expiry",
            "License Expiry",
            "Is Active"
          };
      Row headerRow = sheet.createRow(0);
      for (int i = 0; i < headers.length; i++) {
        headerRow.createCell(i).setCellValue(headers[i]);
        sheet.setColumnWidth(i, 6000);
      }
      int rowIndex = 1;
      for (Driver driver : drivers) {
        Row row = sheet.createRow(rowIndex++);
        row.createCell(0).setCellValue(safe(driver.getDriverName()));
        row.createCell(1).setCellValue(safe(driver.getDriverNumber()));
        row.createCell(2).setCellValue(safe(driver.getIdNumber()));
        row.createCell(3).setCellValue(safe(driver.getTruckNo()));
        row.createCell(4).setCellValue(safe(driver.getNationality()));
        row.createCell(5).setCellValue(formatDate(driver.getIqamaExpiryDate()));
        row.createCell(6).setCellValue(formatDate(driver.getLicenseExpiryDate()));
        row.createCell(7).setCellValue(driver.isActive() ? "TRUE" : "FALSE");
      }
      workbook.write(output);
      return output.toByteArray();
    }
  }

  private byte[] buildDriverPdf(Driver driver) {
    String html = buildDriverHtml(driver);
    if (html.isBlank()) {
      return new byte[0];
    }
    try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      PdfRendererBuilder builder = new PdfRendererBuilder();
      builder.withHtmlContent(html, driverUploadDirectory.toUri().toString());
      builder.toStream(output);
      builder.run();
      return output.toByteArray();
    } catch (Exception ex) {
      return new byte[0];
    }
  }

  private String buildDriverPdfName(Driver driver) {
    String truck = safe(driver.getTruckNo()).replaceAll("[^A-Za-z0-9-_]+", "_");
    if (truck.equals("-") || truck.isBlank()) {
      truck = "driver_" + driver.getId();
    }
    return truck + ".pdf";
  }

  private String buildDriverHtml(Driver driver) {
    StringBuilder html = new StringBuilder();
    html.append("<html><head><style>");
    html.append("body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;}");
    html.append(".section{margin-bottom:16px;}");
    html.append("img{max-width:520px;max-height:320px;border:1px solid #ccc;padding:4px;margin-top:6px;}");
    html.append("</style></head><body>");
    html.append("<h2>Driver Documents</h2>");
    html.append("<div class=\"section\"><strong>Name:</strong> ").append(safe(driver.getDriverName())).append("<br/>");
    html.append("<strong>Truck:</strong> ").append(safe(driver.getTruckNo())).append("<br/>");
    html.append("<strong>Iqama:</strong> ").append(safe(driver.getIdNumber())).append("</div>");

    appendImageSection(html, "Iqama", driver.getIqamaImage());
    appendImageSection(html, "License", driver.getLicenseImage());
    appendImageSection(html, "Istimara", driver.getIstimaraImage());
    appendImageSection(html, "Insurance", driver.getInsuranceImage());
    appendImageSection(html, "Truck Front", driver.getTruckFrontImage());
    appendImageSection(html, "Truck Back", driver.getTruckBackImage());

    html.append("</body></html>");
    return html.toString();
  }

  private void appendImageSection(StringBuilder html, String label, String path) {
    if (path == null || path.isBlank()) {
      return;
    }
    html.append("<div class=\"section\"><strong>").append(label).append("</strong><br/>");
    html.append("<img src=\"").append(Path.of(path).toUri()).append("\"/>");
    html.append("</div>");
  }
}
