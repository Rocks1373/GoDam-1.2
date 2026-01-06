package com.godam.stock.service;

import com.godam.movements.MovementType;
import com.godam.movements.repository.StockMovementRepository;
import com.godam.stock.Stock;
import com.godam.stock.dto.StockItemDto;
import com.godam.stock.dto.StockPickSuggestionDto;
import com.godam.stock.repository.StockRepository;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockService {
  private static final DateTimeFormatter FIFO_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneId.systemDefault());

  private final StockRepository stockRepository;
  private final StockMovementRepository stockMovementRepository;

  public StockService(StockRepository stockRepository, StockMovementRepository stockMovementRepository) {
    this.stockRepository = stockRepository;
    this.stockMovementRepository = stockMovementRepository;
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
  public List<StockItemDto> listStock(Optional<String> warehouseNo) {
    List<Stock> rows;
    if (warehouseNo.isPresent()) {
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

  private void assertNonNegative(Stock stock) {
    if (stock.getQty() < 0) {
      throw new com.godam.common.exception.StockValidationException(
          "Negative stock qty for part " + stock.getPartNumber());
    }
  }

  private StockItemDto toDto(Stock stock) {
    StockItemDto dto = new StockItemDto();
    dto.setId(stock.getId());
    dto.setWarehouseNo(stock.getWarehouseNo());
    dto.setStorageLocation(stock.getStorageLocation());
    dto.setPartNumber(stock.getPartNumber());
    dto.setSapPn(stock.getSapPn());
    dto.setDescription(stock.getDescription());
    dto.setUom(stock.getUom());
    dto.setQty(stock.getQty());
    dto.setRack(stock.getRack());
    dto.setCombineRack(stock.getCombineRack());
    dto.setQtyStatus(stock.getQtyStatus());
    dto.setSerialRequired(stock.isSerialRequired());
    dto.setSchneider(stock.isSchneider());
    dto.setDrumNo(stock.getDrumNo());
    dto.setDrumQty(stock.getDrumQty());
    dto.setParentPn(stock.getParentPn());
    return dto;
  }
}
