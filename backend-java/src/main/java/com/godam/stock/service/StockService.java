package com.godam.stock.service;

import com.godam.common.User;
import com.godam.common.UserRepository;
import com.godam.movements.MovementType;
import com.godam.movements.repository.StockMovementRepository;
import com.godam.movements.service.StockMovementService;
import com.godam.security.UploadValidationPipeline;
import com.godam.stock.Stock;
import com.godam.stock.dto.StockAdjustmentRequest;
import com.godam.stock.dto.StockExpandedDto;
import com.godam.stock.dto.StockItemDto;
import com.godam.stock.dto.StockPickContext;
import com.godam.stock.dto.StockPickSuggestionDto;
import com.godam.stock.dto.StockSplitRequestDto;
import com.godam.stock.dto.StockUploadItemDto;
import com.godam.stock.dto.StockUploadResultDto;
import com.godam.stock.repository.StockRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockService {
  private static final DateTimeFormatter FIFO_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneId.systemDefault());
  private static final String INDICATOR_PARENT = "P";
  private static final String INDICATOR_CHILD = "C";
  private static final String INDICATOR_DRUM = "D";
  private static final String INDICATOR_DRUM_SPLIT = "DQ";
  private static final String INDICATOR_DRUM_CUT = "DQC";
  private static final String INDICATOR_ROLL = "R";

  private final StockRepository stockRepository;
  private final StockMovementRepository stockMovementRepository;
  private final StockMovementService stockMovementService;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final UploadValidationPipeline uploadValidationPipeline;

  public StockService(
      StockRepository stockRepository,
      StockMovementRepository stockMovementRepository,
      StockMovementService stockMovementService,
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      UploadValidationPipeline uploadValidationPipeline) {
    this.stockRepository = stockRepository;
    this.stockMovementRepository = stockMovementRepository;
    this.stockMovementService = stockMovementService;
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.uploadValidationPipeline = uploadValidationPipeline;
  }

  @Transactional(readOnly = true)
  public Optional<StockItemDto> getStockByPart(String warehouseNo, String partNumber) {
    return stockRepository.findFirstByWarehouseNoAndPartNumberOrderByCreatedAtAsc(warehouseNo, partNumber)
        .map(stock -> {
          assertNonNegative(stock);
          return toDto(stock);
        });
  }

  @Transactional(readOnly = true)
  public List<StockItemDto> listStock(Optional<String> warehouseNo, Optional<String> partNumber) {
    List<Stock> rows;
    if (partNumber.isPresent()) {
      rows = stockRepository.findByPartNumberOrderByCreatedAtAsc(partNumber.get());
    } else if (warehouseNo.isPresent()) {
      rows = stockRepository.findByWarehouseNoOrderByCreatedAtDesc(warehouseNo.get());
    } else {
      rows = stockRepository.findAll();
    }
    List<StockItemDto> result = new ArrayList<>();
    for (Stock row : rows) {
      assertNonNegative(row);
      result.add(toDto(row));
    }
    return result;
  }

  @Transactional
  public void adjustStock(StockAdjustmentRequest request) {
    if (request.getPartNumber() == null || request.getPartNumber().isBlank()) {
      throw new com.godam.common.exception.StockValidationException("Part number is required");
    }
    if (request.getPassword() == null || request.getPassword().isBlank()) {
      throw new com.godam.common.exception.StockValidationException("Admin password is required");
    }
    if (request.getPerformedBy() == null || request.getPerformedBy().isBlank()) {
      throw new com.godam.common.exception.StockValidationException("Admin username is required");
    }
    Integer addQty = request.getAddQty();
    Integer reduceQty = request.getReduceQty();
    boolean hasAdd = addQty != null && addQty > 0;
    boolean hasReduce = reduceQty != null && reduceQty > 0;
    if (hasAdd == hasReduce) {
      throw new com.godam.common.exception.StockValidationException(
          "Provide either add qty or reduce qty");
    }

    User user = userRepository.findByUsername(request.getPerformedBy())
        .orElseThrow(() -> new com.godam.common.exception.StockValidationException("Admin user not found"));
    if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
      throw new com.godam.common.exception.StockValidationException("Only ADMIN can adjust stock");
    }
    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
      throw new com.godam.common.exception.StockValidationException("Invalid admin password");
    }

    String partNumber = request.getPartNumber().trim();
    List<Stock> rows = stockRepository.findByPartNumberOrderByCreatedAtAsc(partNumber);
    if (rows.isEmpty()) {
      throw new com.godam.common.exception.StockValidationException("No stock row found for part " + partNumber);
    }

    if (hasReduce) {
      int reduce = reduceQty == null ? 0 : reduceQty;
      int totalQty = rows.stream().mapToInt(Stock::getQty).sum();
      if (reduce > totalQty) {
        throw new com.godam.common.exception.StockValidationException(
            "Reduce qty exceeds available stock for part " + partNumber);
      }
      int remaining = reduce;
      for (Stock row : rows) {
        if (remaining <= 0) {
          break;
        }
        int rowQty = row.getQty();
        int deduct = Math.min(rowQty, remaining);
        row.setQty(rowQty - deduct);
        stockRepository.save(row);
        remaining -= deduct;
      }
      Stock referenceRow = rows.get(0);
      stockMovementService.logMovement(
          MovementType.A102_ADJUSTMENT_DECREASE,
          referenceRow.getWarehouseNo(),
          referenceRow.getStorageLocation(),
          partNumber,
          -reduce,
          null,
          null,
          user.getUserId(),
          referenceRow.getRack(),
          referenceRow.getBin(),
          referenceRow.getCombineRack(),
          referenceRow.getRack(),
          reduce,
          reduce,
          "ADMIN_ADJUSTMENT",
          "decrease");
    } else if (hasAdd) {
      int add = addQty == null ? 0 : addQty;
      Stock target = rows.get(0);
      target.setQty(target.getQty() + add);
      stockRepository.save(target);
      stockMovementService.logMovement(
          MovementType.A101_ADJUSTMENT_INCREASE,
          target.getWarehouseNo(),
          target.getStorageLocation(),
          partNumber,
          add,
          null,
          null,
          user.getUserId(),
          target.getRack(),
          target.getBin(),
          target.getCombineRack(),
          target.getRack(),
          add,
          add,
          "ADMIN_ADJUSTMENT",
          "increase");
    }
  }

  @Transactional
  public StockUploadResultDto upsertStock(List<StockUploadItemDto> items) {
    int inserted = 0;
    int updated = 0;
    Instant now = Instant.now();

    for (int index = 0; index < items.size(); index++) {
      StockUploadItemDto item = items.get(index);
      validateStockUploadItem(item, index + 1);
      if (item.getWarehouseNo() == null || item.getWarehouseNo().isBlank()) {
        continue;
      }
      if (item.getStorageLocation() == null || item.getStorageLocation().isBlank()) {
        continue;
      }
      if (item.getPartNumber() == null || item.getPartNumber().isBlank()) {
        continue;
      }
      int qty = item.getQty() == null ? 0 : item.getQty();
      if (qty < 0) {
        throw new com.godam.common.exception.StockValidationException(
            "Negative stock qty for part " + item.getPartNumber());
      }

      Stock stock = stockRepository
          .findFirstByWarehouseNoAndStorageLocationAndPartNumberAndRackAndDrumNo(
              item.getWarehouseNo(),
              item.getStorageLocation(),
              item.getPartNumber(),
              item.getRack(),
              item.getDrumNo())
          .orElseGet(Stock::new);

      boolean isNew = stock.getId() == null;
      stock.setWarehouseNo(item.getWarehouseNo());
      stock.setStorageLocation(item.getStorageLocation());
      stock.setPartNumber(item.getPartNumber());
      stock.setSapPn(item.getSapPn());
      stock.setParentPn(item.getParentPn());
      stock.setBaseQty(item.getBaseQty() == null || item.getBaseQty() <= 0 ? 1.0 : item.getBaseQty());
      stock.setPnIndicator(item.getPnIndicator());
      stock.setDescription(item.getDescription());
      stock.setUom(item.getUom() == null || item.getUom().isBlank() ? "EA" : item.getUom());
      stock.setQty(qty);
      stock.setVendorName(item.getVendorName());
      stock.setCategory(item.getCategory());
      stock.setSubCategory(item.getSubCategory());
      stock.setRack(item.getRack());
      stock.setBin(item.getBin());
      stock.setCombineRack(item.getCombineRack());
      stock.setDrumNo(item.getDrumNo());
      stock.setDrumQty(item.getDrumQty());
      stock.setReceivedAt(parseReceivedAt(item.getReceivedAt()).orElse(null));
      if (stock.getCreatedAt() == null) {
        stock.setCreatedAt(now);
      }
      stockRepository.save(stock);

      if (isNew) {
        inserted++;
      } else {
        updated++;
      }
    }

    return new StockUploadResultDto(inserted, updated, items.size());
  }

  private void validateStockUploadItem(StockUploadItemDto item, int rowNumber) {
    validateColumn("warehouse_no", item.getWarehouseNo(), rowNumber);
    validateColumn("storage_location", item.getStorageLocation(), rowNumber);
    validateColumn("part_number", item.getPartNumber(), rowNumber);
    validateColumn("sap_pn", item.getSapPn(), rowNumber);
    validateColumn("parent_pn", item.getParentPn(), rowNumber);
    validateColumn("pn_indicator", item.getPnIndicator(), rowNumber);
    validateColumn("description", item.getDescription(), rowNumber);
    validateColumn("uom", item.getUom(), rowNumber);
    validateColumn("vendor_name", item.getVendorName(), rowNumber);
    validateColumn("category", item.getCategory(), rowNumber);
    validateColumn("sub_category", item.getSubCategory(), rowNumber);
    validateColumn("rack", item.getRack(), rowNumber);
    validateColumn("bin", item.getBin(), rowNumber);
    validateColumn("combine_rack", item.getCombineRack(), rowNumber);
    validateColumn("received_at", item.getReceivedAt(), rowNumber);
  }

  private void validateColumn(String columnName, String value, int rowNumber) {
    uploadValidationPipeline.validate(columnName, value, rowNumber);
  }

  @Transactional(readOnly = true)
  public Map<String, StockItemDto> getStockByParts(String warehouseNo, Set<String> partNumbers) {
    List<Stock> rows = stockRepository.findByWarehouseNoAndPartNumberIn(warehouseNo, partNumbers);
    Map<String, StockItemDto> result = new HashMap<>();
    for (Stock row : rows) {
      assertNonNegative(row);
      result.put(row.getPartNumber(), toDto(row));
    }
    return result;
  }

  @Transactional(readOnly = true)
  public List<StockPickSuggestionDto> suggestPick(String warehouseNo, String partNumber, int requiredQty) {
    List<Stock> rows = stockRepository.findByWarehouseNoAndPartNumberOrderByCreatedAtAsc(warehouseNo, partNumber);
    List<StockPickSuggestionDto> suggestions = new ArrayList<>();

    int parkedQty = stockMovementRepository.sumQtyByWarehousePartAndTypes(
        warehouseNo,
        partNumber,
        List.of(MovementType.O103_PICKED, MovementType.O104_CHECKED));

    int totalQty = 0;
    for (Stock row : rows) {
      assertNonNegative(row);
      totalQty += row.getQty();
    }
    if (parkedQty > totalQty) {
      throw new com.godam.common.exception.StockValidationException(
          "Parked qty exceeds available stock for part " + partNumber);
    }

    int remainingParked = parkedQty;
    int remainingRequired = requiredQty;
    for (Stock row : rows) {
      int available = row.getQty();
      if (remainingParked > 0) {
        if (available <= remainingParked) {
          remainingParked -= available;
          available = 0;
        } else {
          available -= remainingParked;
          remainingParked = 0;
        }
      }

      if (available <= 0) {
        continue;
      }
      StockPickSuggestionDto dto = new StockPickSuggestionDto();
      dto.setPartNumber(row.getPartNumber());
      dto.setRack(row.getRack());
      dto.setAvailableQty(available);
      if (row.getCreatedAt() != null) {
        dto.setFifoDate(FIFO_FORMAT.format(row.getCreatedAt()));
      }
      suggestions.add(dto);

      if (remainingRequired <= available) {
        break;
      }
      remainingRequired -= available;
    }

    return suggestions;
  }

  @Transactional(readOnly = true)
  public List<Stock> resolveChildParts(String parentPn) {
    return stockRepository.findByParentPnOrderByCreatedAtAsc(parentPn);
  }

  @Transactional(readOnly = true)
  public int calculateParentQty(String parentPn) {
    List<Stock> childRows = resolveChildParts(parentPn);
    if (childRows.isEmpty()) {
      return 0;
    }
    BigDecimal total = BigDecimal.ZERO;
    for (Stock child : childRows) {
      BigDecimal qty = BigDecimal.valueOf(child.getQty());
      BigDecimal base = BigDecimal.valueOf(child.getBaseQty() == null || child.getBaseQty() <= 0 ? 1.0 : child.getBaseQty());
      total = total.add(qty.multiply(base));
    }
    return total.intValue();
  }

  @Transactional(readOnly = true)
  public StockExpandedDto expandParentStock(String parentPn) {
    List<Stock> parents = stockRepository.findByPartNumberAndPnIndicatorOrderByCreatedAtAsc(parentPn, INDICATOR_PARENT);
    Stock parent = parents.isEmpty()
        ? stockRepository.findByPartNumberOrderByCreatedAtAsc(parentPn).stream().findFirst().orElse(null)
        : parents.get(0);
    if (parent == null) {
      throw new com.godam.common.exception.ResourceNotFoundException("Parent stock not found");
    }

    int calculated = calculateParentQty(parentPn);
    if (calculated > 0 && calculated != parent.getQty()) {
      throw new com.godam.common.exception.StockValidationException(
          "Parent qty mismatch for " + parentPn + ". Expected " + calculated + " but found " + parent.getQty());
    }

    StockExpandedDto dto = new StockExpandedDto();
    dto.setParent(toDto(parent));
    List<StockItemDto> children = new ArrayList<>();
    for (Stock child : resolveChildParts(parentPn)) {
      children.add(toDto(child));
    }
    dto.setChildren(children);
    return dto;
  }

  @Transactional
  public List<Stock> splitDrum(String partNumber, List<StockSplitRequestDto> splits) {
    List<Stock> mains = stockRepository.findByPartNumberAndPnIndicatorOrderByCreatedAtAsc(partNumber, INDICATOR_DRUM);
    if (mains.isEmpty()) {
      throw new com.godam.common.exception.StockValidationException("Main drum not found for part " + partNumber);
    }
    Stock main = mains.get(0);
    int mainQty = main.getQty();
    int sum = splits.stream().mapToInt(StockSplitRequestDto::getQty).sum();
    if (sum != mainQty) {
      throw new com.godam.common.exception.StockValidationException(
          "Drum split total must equal main qty for " + partNumber);
    }

    List<Stock> created = new ArrayList<>();
    for (StockSplitRequestDto split : splits) {
      if (split.getQty() < 0) {
        throw new com.godam.common.exception.StockValidationException("Drum split qty cannot be negative");
      }
      Stock child = new Stock();
      child.setWarehouseNo(main.getWarehouseNo());
      child.setStorageLocation(main.getStorageLocation());
      child.setPartNumber(main.getPartNumber());
      child.setSapPn(main.getSapPn());
      child.setDescription(main.getDescription());
      child.setUom(main.getUom());
      child.setQty(split.getQty());
      child.setRack(split.getRack());
      child.setBin(split.getBin());
      child.setCombineRack(main.getCombineRack());
      child.setDrumNo(main.getDrumNo());
      child.setDrumQty(main.getDrumQty());
      child.setParentPn(main.getParentPn());
      child.setBaseQty(main.getBaseQty());
      child.setPnIndicator(INDICATOR_DRUM_SPLIT);
      child.setCreatedAt(Instant.now());
      created.add(stockRepository.save(child));
    }
    return created;
  }

  @Transactional
  public Stock cutDrum(Long splitStockId, int cutQty, String rack, String bin) {
    Stock split = stockRepository.findById(splitStockId)
        .orElseThrow(() -> new com.godam.common.exception.ResourceNotFoundException("Split drum not found"));
    if (!INDICATOR_DRUM_SPLIT.equalsIgnoreCase(split.getPnIndicator())
        && !INDICATOR_DRUM_CUT.equalsIgnoreCase(split.getPnIndicator())) {
      throw new com.godam.common.exception.StockValidationException("Stock row is not a split drum");
    }
    if (cutQty <= 0 || cutQty > split.getQty()) {
      throw new com.godam.common.exception.StockValidationException("Cut qty exceeds split drum qty");
    }

    split.setQty(split.getQty() - cutQty);
    if (split.getQty() < 0) {
      throw new com.godam.common.exception.StockValidationException("Drum qty must never go negative");
    }
    stockRepository.save(split);

    Stock cut = new Stock();
    cut.setWarehouseNo(split.getWarehouseNo());
    cut.setStorageLocation(split.getStorageLocation());
    cut.setPartNumber(split.getPartNumber());
    cut.setSapPn(split.getSapPn());
    cut.setDescription(split.getDescription());
    cut.setUom(split.getUom());
    cut.setQty(cutQty);
    cut.setRack(rack == null ? split.getRack() : rack);
    cut.setBin(bin == null ? split.getBin() : bin);
    cut.setCombineRack(split.getCombineRack());
    cut.setDrumNo(split.getDrumNo());
    cut.setDrumQty(split.getDrumQty());
    cut.setParentPn(split.getParentPn());
    cut.setBaseQty(split.getBaseQty());
    cut.setPnIndicator(INDICATOR_DRUM_CUT);
    cut.setCreatedAt(Instant.now());
    return stockRepository.save(cut);
  }

  @Transactional(readOnly = true)
  public int calculateRollQty(Stock stock) {
    if (!INDICATOR_ROLL.equalsIgnoreCase(stock.getPnIndicator())) {
      return 0;
    }
    BigDecimal total = BigDecimal.valueOf(stock.getQty());
    BigDecimal base = BigDecimal.valueOf(stock.getBaseQty() == null || stock.getBaseQty() <= 0 ? 1.0 : stock.getBaseQty());
    BigDecimal[] div = total.divideAndRemainder(base);
    if (div[1].compareTo(BigDecimal.ZERO) != 0) {
      throw new com.godam.common.exception.StockValidationException(
          "Roll conversion not exact for part " + stock.getPartNumber());
    }
    return div[0].setScale(0, RoundingMode.DOWN).intValueExact();
  }

  @Transactional(readOnly = true)
  public StockPickContext preparePickContext(String partNumber, int requiredQty, String pickedRack) {
    return preparePickContextInternal(partNumber, requiredQty, pickedRack, false);
  }

  @Transactional(readOnly = true)
  public StockPickContext preparePickContextAllowNegative(String partNumber, int requiredQty, String pickedRack) {
    return preparePickContextInternal(partNumber, requiredQty, pickedRack, true);
  }

  private StockPickContext preparePickContextInternal(
      String partNumber,
      int requiredQty,
      String pickedRack,
      boolean allowNegative) {
    String resolvedPartNumber = resolveMainPartNumber(partNumber);
    validateParentTotals(resolvedPartNumber);
    validateDrumSplitTotals(resolvedPartNumber);
    List<Stock> rows = stockRepository.findByPartNumberOrderByCreatedAtAsc(resolvedPartNumber);
    if (rows.isEmpty()) {
      throw new com.godam.common.exception.StockValidationException("No stock found for part " + resolvedPartNumber);
    }
    Stock oldest = rows.get(0);
    int parkedQty = stockMovementRepository.sumQtyByWarehousePartAndTypes(
        oldest.getWarehouseNo(),
        resolvedPartNumber,
        List.of(MovementType.O103_PICKED, MovementType.O104_CHECKED));
    int totalQty = rows.stream().mapToInt(Stock::getQty).sum();
    int available = totalQty - parkedQty;
    if (!allowNegative && available < requiredQty) {
      throw new com.godam.common.exception.StockValidationException(
          "Requested qty exceeds available stock for part " + resolvedPartNumber);
    }

    Stock fifoRow = resolveFifoRow(rows, parkedQty);
    if (pickedRack != null && !pickedRack.isBlank() && fifoRow != null) {
      if (fifoRow.getRack() != null && !fifoRow.getRack().equalsIgnoreCase(pickedRack)) {
        throw new com.godam.common.exception.StockValidationException(
            "FIFO violation for part " + resolvedPartNumber + ": expected rack " + fifoRow.getRack());
      }
    }
    Stock pickedRow = resolvePickedRow(rows, pickedRack, fifoRow);
    String indicator = pickedRow == null ? null : pickedRow.getPnIndicator();
    String reference = buildReference(partNumber, resolvedPartNumber, pickedRow);
    String remark = indicator == null ? null : "pn_indicator=" + indicator;

    StockPickContext context = new StockPickContext();
    context.setResolvedPartNumber(resolvedPartNumber);
    context.setWarehouseNo(pickedRow == null ? oldest.getWarehouseNo() : pickedRow.getWarehouseNo());
    context.setStorageLocation(pickedRow == null ? oldest.getStorageLocation() : pickedRow.getStorageLocation());
    context.setRack(pickedRow == null ? oldest.getRack() : pickedRow.getRack());
    context.setBin(pickedRow == null ? oldest.getBin() : pickedRow.getBin());
    context.setSuggestedRack(fifoRow == null ? null : fifoRow.getRack());
    context.setActualRack(pickedRow == null ? null : pickedRow.getRack());
    context.setReference(reference);
    context.setRemark(remark);
    return context;
  }

  @Transactional
  public void applyConfirmedDeduction(String partNumber, int requiredQty, String pickedRack) {
    String resolvedPartNumber = resolveMainPartNumber(partNumber);
    List<Stock> rows = stockRepository.findByPartNumberOrderByCreatedAtAsc(resolvedPartNumber);
    if (rows.isEmpty()) {
      throw new com.godam.common.exception.StockValidationException("No stock found for part " + resolvedPartNumber);
    }
    Stock target = resolvePickedRow(rows, pickedRack, rows.get(0));
    int remaining = requiredQty;
    for (Stock row : rows) {
      if (remaining <= 0) {
        break;
      }
      if (target != null && pickedRack != null && !pickedRack.isBlank()) {
        if (row.getRack() == null || !row.getRack().equalsIgnoreCase(pickedRack)) {
          continue;
        }
      }
      int available = row.getQty();
      if (available <= 0) {
        continue;
      }
      int deduct = Math.min(available, remaining);
      row.setQty(available - deduct);
      assertNonNegative(row);
      stockRepository.save(row);
      remaining -= deduct;
      if (pickedRack != null && !pickedRack.isBlank()) {
        break;
      }
    }
    if (remaining > 0) {
      throw new com.godam.common.exception.StockValidationException(
          "Insufficient stock to confirm pick for part " + resolvedPartNumber);
    }
  }

  @Transactional(readOnly = true)
  public List<StockSplitRequestDto> splitCableQtyAcrossDrums(List<StockPickSuggestionDto> suggestions, int requiredQty) {
    List<StockSplitRequestDto> splits = new ArrayList<>();
    int remaining = requiredQty;
    for (StockPickSuggestionDto suggestion : suggestions) {
      if (remaining <= 0) {
        break;
      }
      int take = Math.min(remaining, suggestion.getAvailableQty());
      StockSplitRequestDto split = new StockSplitRequestDto();
      split.setRack(suggestion.getRack());
      split.setQty(take);
      splits.add(split);
      remaining -= take;
    }
    if (remaining > 0) {
      throw new com.godam.common.exception.StockValidationException(
          "Requested qty exceeds available drum splits");
    }
    return splits;
  }

  private void assertNonNegative(Stock stock) {
    if (stock.getQty() < 0) {
      throw new com.godam.common.exception.StockValidationException(
          "Negative stock qty for part " + stock.getPartNumber());
    }
  }

  private String resolveMainPartNumber(String partNumber) {
    List<Stock> children = stockRepository.findByPartNumberAndPnIndicatorOrderByCreatedAtAsc(partNumber, INDICATOR_CHILD);
    if (!children.isEmpty()) {
      String parent = children.get(0).getParentPn();
      if (parent != null && !parent.isBlank()) {
        return parent;
      }
    }
    return partNumber;
  }

  private void validateParentTotals(String parentPn) {
    List<Stock> children = stockRepository.findByParentPnOrderByCreatedAtAsc(parentPn);
    if (children.isEmpty()) {
      return;
    }
    int calculated = calculateParentQty(parentPn);
    List<Stock> parents = stockRepository.findByPartNumberAndPnIndicatorOrderByCreatedAtAsc(parentPn, INDICATOR_PARENT);
    if (parents.isEmpty()) {
      throw new com.godam.common.exception.StockValidationException(
          "Parent mapping missing for " + parentPn);
    }
    Stock parent = parents.get(0);
    if (calculated != parent.getQty()) {
      throw new com.godam.common.exception.StockValidationException(
          "Parent qty mismatch for " + parentPn);
    }
  }

  private void validateDrumSplitTotals(String partNumber) {
    List<Stock> mains = stockRepository.findByPartNumberAndPnIndicatorOrderByCreatedAtAsc(partNumber, INDICATOR_DRUM);
    if (mains.isEmpty()) {
      return;
    }
    Stock main = mains.get(0);
    int mainQty = main.getQty();
    int splitSum = 0;
    for (Stock split : stockRepository.findByPartNumberAndPnIndicatorOrderByCreatedAtAsc(partNumber, INDICATOR_DRUM_SPLIT)) {
      splitSum += split.getQty();
    }
    for (Stock cut : stockRepository.findByPartNumberAndPnIndicatorOrderByCreatedAtAsc(partNumber, INDICATOR_DRUM_CUT)) {
      splitSum += cut.getQty();
    }
    if (splitSum > 0 && splitSum != mainQty) {
      throw new com.godam.common.exception.StockValidationException(
          "Drum split total must equal main qty for " + partNumber);
    }
  }

  private Stock resolveFifoRow(List<Stock> rows, int parkedQty) {
    int remainingParked = parkedQty;
    for (Stock row : rows) {
      int available = row.getQty();
      if (remainingParked > 0) {
        if (available <= remainingParked) {
          remainingParked -= available;
          continue;
        }
        return row;
      }
      if (available > 0) {
        return row;
      }
    }
    return rows.isEmpty() ? null : rows.get(0);
  }

  private Stock resolvePickedRow(List<Stock> rows, String pickedRack, Stock fallback) {
    if (pickedRack == null || pickedRack.isBlank()) {
      return fallback;
    }
    return rows.stream()
        .filter(row -> row.getRack() != null && row.getRack().equalsIgnoreCase(pickedRack))
        .findFirst()
        .orElse(fallback);
  }

  private String buildReference(String originalPart, String resolvedPart, Stock pickedRow) {
    if (!originalPart.equalsIgnoreCase(resolvedPart)) {
      return originalPart;
    }
    if (pickedRow == null) {
      return null;
    }
    String indicator = pickedRow.getPnIndicator();
    if (INDICATOR_DRUM_SPLIT.equalsIgnoreCase(indicator) || INDICATOR_DRUM_CUT.equalsIgnoreCase(indicator)) {
      return indicator + ":" + (pickedRow.getRack() == null ? "" : pickedRow.getRack());
    }
    return null;
  }

  private StockItemDto toDto(Stock stock) {
    StockItemDto dto = new StockItemDto();
    dto.setId(stock.getId());
    dto.setWarehouseNo(stock.getWarehouseNo());
    dto.setStorageLocation(stock.getStorageLocation());
    dto.setPartNumber(stock.getPartNumber());
    dto.setSapPn(stock.getSapPn());
    dto.setDescription(stock.getDescription());
    dto.setVendorName(stock.getVendorName());
    dto.setCategory(stock.getCategory());
    dto.setSubCategory(stock.getSubCategory());
    dto.setUom(stock.getUom());
    dto.setQty(stock.getQty());
    dto.setRack(stock.getRack());
    dto.setBin(stock.getBin());
    dto.setCombineRack(stock.getCombineRack());
    dto.setQtyStatus(stock.getQtyStatus());
    dto.setSerialRequired(stock.isSerialRequired());
    dto.setSchneider(stock.isSchneider());
    dto.setDrumNo(stock.getDrumNo());
    dto.setDrumQty(stock.getDrumQty());
    dto.setParentPn(stock.getParentPn());
    dto.setBaseQty(stock.getBaseQty());
    dto.setPnIndicator(stock.getPnIndicator());
    if (stock.getReceivedAt() != null) {
      dto.setReceivedAt(stock.getReceivedAt().toString());
    }
    return dto;
  }

  private Optional<Instant> parseReceivedAt(String value) {
    if (value == null || value.isBlank()) {
      return Optional.empty();
    }
    try {
      return Optional.of(Instant.parse(value));
    } catch (DateTimeParseException ex) {
      try {
        LocalDate date = LocalDate.parse(value);
        return Optional.of(date.atStartOfDay(ZoneId.systemDefault()).toInstant());
      } catch (DateTimeParseException inner) {
        return Optional.empty();
      }
    }
  }
}
