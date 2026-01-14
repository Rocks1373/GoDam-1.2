package com.godam.stock.upload;

import com.godam.common.exception.StockValidationException;
import com.godam.stock.Stock;
import com.godam.stock.repository.StockRepository;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class StockUploadValidatorService {
  private final StockRepository stockRepository;
  private final StockExcelParser parser;
  private final StockErrorExcelWriter errorWriter;
  private final Map<String, StockUploadContext> contexts = new ConcurrentHashMap<>();
  private static final Set<String> REQUIRED_COLUMNS =
      Set.of(
          "warehouse_no",
          "storage_location",
          "part_number",
          "sap_pn",
          "qty",
          "uom",
          "combine_rack");

  public StockUploadValidatorService(
      StockRepository stockRepository,
      StockExcelParser parser,
      StockErrorExcelWriter errorWriter) {
    this.stockRepository = stockRepository;
    this.parser = parser;
    this.errorWriter = errorWriter;
  }

  public StockUploadContext validate(MultipartFile file) throws IOException {
    StockUploadDocument document = parser.parse(file);
    List<String> headers = document.getHeaders();
    Set<String> headerSet = Set.copyOf(headers);
    if (!headerSet.containsAll(REQUIRED_COLUMNS)) {
      Set<String> missing =
          REQUIRED_COLUMNS.stream().filter(col -> !headerSet.contains(col)).collect(Collectors.toSet());
      throw new StockValidationException("Missing required columns: " + String.join(", ", missing));
    }
    List<StockUploadErrorRow> invalidRows = new ArrayList<>();
    List<StockUploadItem> validItems = new ArrayList<>();
    List<DuplicateRowInfo> duplicates = new ArrayList<>();
    Set<String> seenKeys = ConcurrentHashMap.newKeySet();

    for (StockUploadRow row : document.getRows()) {
      Map<String, String> values = row.getValues();
      List<String> rowErrors = new ArrayList<>();
      validateRequired(values, rowErrors);
      BigDecimal qty = parseQty(values.getOrDefault("qty", ""), rowErrors);
      StockUploadItem item = buildItem(values, qty, rowErrors);
      if (!rowErrors.isEmpty()) {
        invalidRows.add(new StockUploadErrorRow(row, String.join("; ", rowErrors)));
        continue;
      }

      String compositeKey = item.getPartNumber() + "|" + item.getWarehouseNo();
      if (!seenKeys.add(compositeKey)) {
        invalidRows.add(
            new StockUploadErrorRow(row, "duplicate (part_number, warehouse_no) in upload"));
        continue;
      }

      Optional<Stock> existing =
          stockRepository.findFirstByWarehouseNoAndPartNumberOrderByCreatedAtAsc(
              item.getWarehouseNo(), item.getPartNumber());
      if (existing.isPresent()) {
        duplicates.add(
            new DuplicateRowInfo(
                item.getPartNumber(),
                item.getWarehouseNo(),
                existing.get().getQty(),
                qty.intValue(),
                row));
        continue;
      }

      validItems.add(item);
    }

    StockUploadContext context = new StockUploadContext(headers, validItems, invalidRows, duplicates);
    context.setErrorFile(errorWriter.createTempPath(context.getToken()));
    writeErrors(context, context.getInvalidRows());
    contexts.put(context.getToken(), context);
    return context;
  }

  private void writeErrors(
      StockUploadContext context, List<StockUploadErrorRow> invalidRows) throws IOException {
    if (invalidRows.isEmpty()) {
      return;
    }
    errorWriter.writeErrors(context.getErrorFile(), context.getHeaders(), invalidRows);
  }

  private void validateRequired(Map<String, String> values, List<String> errors) {
    validateRequiredField(values, errors, "warehouse_no");
    validateRequiredField(values, errors, "storage_location");
    validateRequiredField(values, errors, "part_number");
    validateRequiredField(values, errors, "sap_pn");
    validateRequiredField(values, errors, "qty");
    validateRequiredField(values, errors, "uom");
    validateRequiredField(values, errors, "combine_rack");
  }

  private void validateRequiredField(Map<String, String> values, List<String> errors, String key) {
    String value = normalize(values.get(key));
    if (value == null || value.isEmpty()) {
      errors.add("Missing " + key);
    }
  }

  private BigDecimal parseQty(String qtyValue, List<String> rowErrors) {
    if (qtyValue == null || qtyValue.isEmpty()) {
      return BigDecimal.ZERO;
    }
    try {
      BigDecimal qty = new BigDecimal(qtyValue);
      if (qty.signum() < 0) {
        rowErrors.add("Qty must not be negative");
      }
      return qty;
    } catch (NumberFormatException ex) {
      rowErrors.add("Qty must be numeric");
    }
    return BigDecimal.ZERO;
  }

  private String normalize(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  public StockUploadContext getContext(String token) {
    return contexts.get(token);
  }

  public void commit(String token, StockUploadAction action) throws IOException {
    StockUploadContext context = contexts.get(token);
    if (context == null) {
      throw new StockValidationException("Stock upload context is missing or expired");
    }
    if (context.isCommitted()) {
      throw new StockValidationException("Stock upload already committed");
    }
    if (action == null) {
      throw new StockValidationException("Action is required");
    }
    if (action == StockUploadAction.CANCEL) {
      context.markCommitted();
      return;
    }
    if (action == StockUploadAction.REPLACE) {
      stockRepository.deleteAll();
      List<StockUploadItem> items = new ArrayList<>(context.getValidItems());
      for (DuplicateRowInfo duplicate : context.getDuplicates()) {
        List<String> rowErrors = new ArrayList<>();
        BigDecimal qty = parseQty(
            duplicate.getRow().getValues().getOrDefault("qty", ""),
            rowErrors);
        StockUploadItem item = buildItem(duplicate.getRow().getValues(), qty, rowErrors);
        if (!rowErrors.isEmpty()) {
          throw new StockValidationException("Duplicate row has invalid data for part " + duplicate.getPartNumber());
        }
        items.add(item);
      }
      insertValidRows(items);
    } else {
      insertValidRows(context.getValidItems());
      if (action == StockUploadAction.ADD) {
        addDuplicates(context.getDuplicates());
      } else if (action == StockUploadAction.REJECT) {
        rejectDuplicates(context);
      }
    }
    context.markCommitted();
  }

  private void insertValidRows(List<StockUploadItem> items) {
    for (StockUploadItem item : items) {
      Optional<Stock> existing =
          stockRepository.findFirstByWarehouseNoAndPartNumberOrderByCreatedAtAsc(
              item.getWarehouseNo(), item.getPartNumber());
      Stock stock = existing.orElseGet(Stock::new);
      stock.setPartNumber(item.getPartNumber());
      stock.setWarehouseNo(item.getWarehouseNo());
      stock.setStorageLocation(item.getStorageLocation());
      stock.setSapPn(item.getSapPn());
      stock.setDescription(item.getDescription());
      stock.setVendorName(item.getVendorName());
      stock.setCategory(item.getCategory());
      stock.setSubCategory(item.getSubCategory());
      stock.setUom(item.getUom());
      stock.setQty(item.getQty().intValue());
      stock.setRack(item.getRack());
      stock.setBin(item.getBin());
      stock.setCombineRack(item.getCombineRack());
      stock.setPnIndicator(item.getPnIndicator());
      stock.setParentPn(item.getParentPn());
      if (item.getBaseQty() != null) {
        stock.setBaseQty(item.getBaseQty());
      }
      stock.setQtyStatus(item.getQtyStatus());
      if (item.getSerialRequired() != null) {
        stock.setSerialRequired(item.getSerialRequired());
      }
      if (item.getSchneider() != null) {
        stock.setSchneider(item.getSchneider());
      }
      if (item.getDrumNo() != null) {
        stock.setDrumNo(item.getDrumNo());
      }
      if (item.getDrumQty() != null) {
        stock.setDrumQty(item.getDrumQty());
      }
      if (item.getReceivedAt() != null) {
        stock.setReceivedAt(item.getReceivedAt());
      }
      stockRepository.save(stock);
    }
  }

  private void addDuplicates(List<DuplicateRowInfo> duplicates) {
    for (DuplicateRowInfo duplicate : duplicates) {
      stockRepository
          .findFirstByWarehouseNoAndPartNumberOrderByCreatedAtAsc(
              duplicate.getWarehouseNo(), duplicate.getPartNumber())
          .ifPresent(
              stock -> {
                stock.setQty(stock.getQty() + duplicate.getUploadedQty());
                stockRepository.save(stock);
              });
    }
  }

  private void rejectDuplicates(StockUploadContext context) throws IOException {
    List<StockUploadErrorRow> errorRows = new ArrayList<>(context.getInvalidRows());
    for (DuplicateRowInfo duplicate : context.getDuplicates()) {
      errorRows.add(
          new StockUploadErrorRow(
              duplicate.getRow(),
              "Already exists (qty = " + duplicate.getExistingQty() + ", uploaded = " + duplicate.getUploadedQty() + ")"));
    }
    context.getInvalidRows().clear();
    context.getInvalidRows().addAll(errorRows);
    errorWriter.writeErrors(context.getErrorFile(), context.getHeaders(), errorRows);
  }

  private StockUploadItem buildItem(
      Map<String, String> values,
      BigDecimal qty,
      List<String> errors) {
    String partNumber = normalize(values.get("part_number"));
    String warehouseNo = normalize(values.get("warehouse_no"));
    String storageLocation = normalize(values.get("storage_location"));
    String sapPn = normalize(values.get("sap_pn"));
    String description = normalize(values.get("description"));
    String vendorName = normalize(values.get("vendor_name"));
    String category = normalize(values.get("category"));
    String subCategory = normalize(values.get("sub_category"));
    String uom = normalize(values.get("uom"));
    String rack = normalize(values.get("rack"));
    String bin = normalize(values.get("bin"));
    String combineRack = normalize(values.get("combine_rack"));
    String pnIndicator = normalize(values.get("pn_indicator"));
    String parentPn = normalize(values.get("parent_pn"));
    Double baseQty = parseOptionalDouble(values.get("base_qty"), "base_qty", errors);
    String qtyStatus = normalize(values.get("qty_status"));
    Boolean serialRequired = parseOptionalBoolean(values.get("serial_required"), "serial_required", errors);
    Boolean schneider = parseOptionalBoolean(values.get("is_schneider"), "is_schneider", errors);
    Integer drumNo = parseOptionalInt(values.get("drum_no"), "drum_no", errors);
    Double drumQty = parseOptionalDouble(values.get("drum_qty"), "drum_qty", errors);
    java.time.Instant receivedAt = java.time.Instant.now();

    return new StockUploadItem(
        partNumber,
        warehouseNo,
        storageLocation,
        sapPn,
        description,
        vendorName,
        category,
        subCategory,
        uom,
        rack,
        bin,
        combineRack,
        pnIndicator,
        parentPn,
        baseQty,
        qtyStatus,
        serialRequired,
        schneider,
        drumNo,
        drumQty,
        receivedAt,
        qty);
  }

  private Double parseOptionalDouble(String value, String label, List<String> errors) {
    if (value == null || value.isBlank()) {
      return null;
    }
    try {
      return Double.valueOf(value.trim());
    } catch (NumberFormatException ex) {
      errors.add(label + " must be numeric");
      return null;
    }
  }

  private Integer parseOptionalInt(String value, String label, List<String> errors) {
    if (value == null || value.isBlank()) {
      return null;
    }
    try {
      return Integer.valueOf(value.trim());
    } catch (NumberFormatException ex) {
      errors.add(label + " must be numeric");
      return null;
    }
  }

  private Boolean parseOptionalBoolean(String value, String label, List<String> errors) {
    if (value == null || value.isBlank()) {
      return null;
    }
    String normalized = value.trim().toLowerCase();
    if ("true".equals(normalized) || "1".equals(normalized) || "yes".equals(normalized)) {
      return true;
    }
    if ("false".equals(normalized) || "0".equals(normalized) || "no".equals(normalized)) {
      return false;
    }
    errors.add(label + " must be boolean (true/false)");
    return null;
  }

  private java.time.Instant parseReceivedAt(String value, List<String> errors) {
    return java.time.Instant.now();
  }
}
