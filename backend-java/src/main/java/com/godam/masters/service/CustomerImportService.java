package com.godam.masters.service;

import com.godam.masters.Customer;
import com.godam.masters.dto.CustomerImportErrorDto;
import com.godam.masters.dto.CustomerImportResultDto;
import com.godam.masters.repository.CustomerRepository;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CustomerImportService {
  private static final Logger log = LoggerFactory.getLogger(CustomerImportService.class);
  private final CustomerRepository customerRepository;
  private final Path uploadDirectory;

  public CustomerImportService(
      CustomerRepository customerRepository,
      @Value("${godam.customer.upload-dir:uploads/customers}") String uploadDir)
      throws IOException {
    this.customerRepository = customerRepository;
    this.uploadDirectory = Path.of(uploadDir).toAbsolutePath().normalize();
    Files.createDirectories(this.uploadDirectory);
  }

  public CustomerImportResultDto importCustomers(MultipartFile file) throws IOException {
    String storedPath = storeFile(file);
    List<CustomerImportErrorDto> errors = new ArrayList<>();
    int imported = 0;
    int total = 0;
    Set<String> seenSapIds = new HashSet<>();
    List<Customer> pendingCustomers = new ArrayList<>();

    try (InputStream inputStream = file.getInputStream();
        Workbook workbook = WorkbookFactory.create(inputStream)) {
      Sheet sheet = workbook.getSheetAt(0);
      Iterator<Row> iterator = sheet.rowIterator();
      Map<String, Integer> headerIndex = new HashMap<>();

      if (iterator.hasNext()) {
        Row header = iterator.next();
        for (Cell cell : header) {
          headerIndex.put(normalize(cell), cell.getColumnIndex());
        }
      }

      Integer sapIdIndex =
          findHeader(
              headerIndex,
              "sap customer id",
              "sap id",
              "sap customer",
              "sap_customer_id",
              "sapcustomerid");
      if (sapIdIndex == null) {
        errors.add(new CustomerImportErrorDto(0, "Missing required column: SAP Customer ID"));
        return new CustomerImportResultDto(total, imported, errors, storedPath);
      }
      Integer nameIndex = findHeader(headerIndex, "customer name", "name", "customer_name", "customername");
      if (nameIndex == null) {
        errors.add(new CustomerImportErrorDto(0, "Missing required column: Customer Name"));
        return new CustomerImportResultDto(total, imported, errors, storedPath);
      }

      while (iterator.hasNext()) {
        Row row = iterator.next();
        total++;
        String sapCustomerId = getCellValue(row, sapIdIndex);
        if (sapCustomerId.isBlank()) {
          errors.add(
              new CustomerImportErrorDto(
                  row.getRowNum() + 1, "SAP Customer ID is required"));
          continue;
        }
        if (!seenSapIds.add(sapCustomerId.toLowerCase())) {
          errors.add(
              new CustomerImportErrorDto(
                  row.getRowNum() + 1, "Duplicate SAP Customer ID within the uploaded sheet"));
          continue;
        }

        String name = getCellValue(row, nameIndex);
        if (name.isBlank()) {
          errors.add(new CustomerImportErrorDto(row.getRowNum() + 1, "Customer Name is required"));
          continue;
        }

        try {
          Customer existing =
              customerRepository
                  .findBySapCustomerIdIgnoreCase(sapCustomerId)
                  .orElseGet(Customer::new);
          existing.setSapCustomerId(sapCustomerId);
          populateCustomer(row, headerIndex, existing);
          existing.setUpdatedAt(Instant.now());
          if (existing.getId() == null) {
            existing.setCreatedAt(Instant.now());
          }
          pendingCustomers.add(existing);
        } catch (Exception ex) {
          log.error("Failed to parse row {}: {}", row.getRowNum(), ex.getMessage());
          errors.add(
              new CustomerImportErrorDto(
                  row.getRowNum() + 1, "Unable to read row: " + ex.getMessage()));
        }
      }
    }
    if (!errors.isEmpty()) {
      return new CustomerImportResultDto(total, imported, errors, storedPath);
    }

    for (Customer customer : pendingCustomers) {
      customerRepository.save(customer);
      imported++;
    }

    return new CustomerImportResultDto(total, imported, errors, storedPath);
  }

  private String storeFile(MultipartFile file) throws IOException {
    String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
    Path target = uploadDirectory.resolve(filename);
    try (InputStream inputStream = file.getInputStream()) {
      Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
    }
    return target.toString();
  }

  public byte[] createTemplate() throws IOException {
    String[] headers =
        new String[] {
          "SAP Customer ID *",
          "Customer Name *",
          "City",
          "Location Text",
          "Google Location",
          "Receiver1 Name",
          "Receiver1 Contact",
          "Receiver1 Email",
          "Receiver1 Designation",
          "Receiver2 Name",
          "Receiver2 Contact",
          "Receiver2 Email",
          "Receiver2 Designation",
          "Requirements",
          "Notes / Remarks",
          "Is Active"
        };
    try (Workbook workbook = new XSSFWorkbook();
        ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet("Customers");
      Row headerRow = sheet.createRow(0);
      for (int i = 0; i < headers.length; i++) {
        headerRow.createCell(i).setCellValue(headers[i]);
        sheet.setColumnWidth(i, 7000);
      }
      DataValidationHelper helper = sheet.getDataValidationHelper();
      addRequiredValidation(helper, sheet, 0, "Provide a valid SAP Customer ID before uploading.");
      addRequiredValidation(helper, sheet, 1, "Provide a valid customer name before uploading.");
      addListValidation(
          helper, sheet, headers.length - 1, new String[] {"TRUE", "FALSE"}, "Select TRUE or FALSE.");

      Sheet instructions = workbook.createSheet("Instructions");
      Row instructionsRow = instructions.createRow(0);
      instructionsRow
          .createCell(0)
          .setCellValue(
              "Fill each row and keep the required fields (marked with *) populated. "
                  + "Use Notes / Remarks for any comments and delete this sheet before upload.");
      instructions.setColumnWidth(0, 20000);

      workbook.write(output);
      return output.toByteArray();
    }
  }

  private void populateCustomer(
      Row row, Map<String, Integer> headerIndex, Customer customer) {
    Integer nameIndex = findHeader(headerIndex, "customer name", "name", "customer_name", "customername");
    customer.setName(getCellValue(row, nameIndex));
    customer.setCity(getCellValue(row, findHeader(headerIndex, "city")));
    customer.setLocationText(getCellValue(row, findHeader(headerIndex, "location text", "location_text")));
    customer.setGoogleLocation(getCellValue(row, findHeader(headerIndex, "google location", "google_location")));
    customer.setReceiver1Name(getCellValue(row, findHeader(headerIndex, "receiver1 name", "receiver1_name")));
    customer.setReceiver1Contact(getCellValue(row, findHeader(headerIndex, "receiver1 contact", "receiver1_contact")));
    customer.setReceiver1Email(getCellValue(row, findHeader(headerIndex, "receiver1 email", "receiver1_email")));
    customer.setReceiver1Designation(
        getCellValue(row, findHeader(headerIndex, "receiver1 designation", "receiver1_designation")));
    customer.setReceiver2Name(getCellValue(row, findHeader(headerIndex, "receiver2 name", "receiver2_name")));
    customer.setReceiver2Contact(getCellValue(row, findHeader(headerIndex, "receiver2 contact", "receiver2_contact")));
    customer.setReceiver2Email(getCellValue(row, findHeader(headerIndex, "receiver2 email", "receiver2_email")));
    customer.setReceiver2Designation(
        getCellValue(row, findHeader(headerIndex, "receiver2 designation", "receiver2_designation")));
    customer.setRequirements(getCellValue(row, findHeader(headerIndex, "requirements")));
    Integer notesIndex = findHeader(headerIndex, "notes", "remarks", "notes/remarks", "notes_remarks");
    customer.setNotes(getCellValue(row, notesIndex));
    Integer activeIndex = findHeader(headerIndex, "is active", "active", "is_active");
    String activeValue = getCellValue(row, activeIndex);
    if (!activeValue.isBlank()) {
      customer.setActive(Boolean.parseBoolean(activeValue));
    } else if (customer.getId() == null) {
      customer.setActive(true);
    }
  }

  private String getCellValue(Row row, Integer index) {
    if (index == null) {
      return "";
    }
    Cell cell = row.getCell(index);
    if (cell == null) {
      return "";
    }
    return switch (cell.getCellType()) {
      case STRING -> cell.getStringCellValue().trim();
      case NUMERIC -> String.valueOf(cell.getNumericCellValue()).trim();
      case BOOLEAN -> String.valueOf(cell.getBooleanCellValue()).trim();
      case FORMULA -> cell.getCellFormula().trim();
      default -> "";
    };
  }

  private Integer findHeader(Map<String, Integer> headerIndex, String... candidates) {
    for (String candidate : candidates) {
      if (candidate == null) {
        continue;
      }
      Integer index = headerIndex.get(normalize(candidate));
      if (index != null) {
        return index;
      }
    }
    return null;
  }

  private String normalize(Cell cell) {
    if (cell == null) {
      return "";
    }
    return normalize(cell.getStringCellValue());
  }

  private String normalize(String value) {
    if (value == null) {
      return "";
    }
    String cleaned = value.trim().replace("*", "").replace("/", " ");
    cleaned = cleaned.replaceAll("[\\s_-]+", "");
    return cleaned.toLowerCase();
  }

  private void addRequiredValidation(
      DataValidationHelper helper, Sheet sheet, int column, String message) {
    CellRangeAddressList range = new CellRangeAddressList(1, 1000, column, column);
    String columnLetter = toColumnLetter(column);
    DataValidationConstraint constraint =
        helper.createCustomConstraint("LEN($" + columnLetter + "2)>0");
    DataValidation validation = helper.createValidation(constraint, range);
    validation.setShowErrorBox(true);
    validation.setEmptyCellAllowed(false);
    validation.setSuppressDropDownArrow(true);
    validation.createErrorBox("Required field", message);
    sheet.addValidationData(validation);
  }

  private void addListValidation(
      DataValidationHelper helper, Sheet sheet, int column, String[] items, String message) {
    CellRangeAddressList range = new CellRangeAddressList(1, 1000, column, column);
    DataValidationConstraint constraint = helper.createExplicitListConstraint(items);
    DataValidation validation = helper.createValidation(constraint, range);
    validation.setShowErrorBox(true);
    validation.createErrorBox("Invalid value", message);
    sheet.addValidationData(validation);
  }

  private String toColumnLetter(int columnIndex) {
    StringBuilder letters = new StringBuilder();
    int index = columnIndex;
    while (index >= 0) {
      letters.insert(0, (char) ('A' + (index % 26)));
      index = (index / 26) - 1;
    }
    return letters.toString();
  }
}
