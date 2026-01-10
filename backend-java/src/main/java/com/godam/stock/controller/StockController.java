package com.godam.stock.controller;

import com.godam.stock.dto.StockItemDto;
import com.godam.stock.dto.StockPickSuggestionDto;
import com.godam.stock.dto.StockUploadItemDto;
import com.godam.stock.dto.StockUploadResultDto;
import com.godam.stock.service.StockService;
import java.util.List;
import java.util.Optional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/stock")
public class StockController {
  private final StockService stockService;

  public StockController(StockService stockService) {
    this.stockService = stockService;
  }

  @GetMapping
  public List<StockItemDto> listStock(
      @RequestParam(value = "warehouseNo", required = false) Optional<String> warehouseNo,
      @RequestParam(value = "partNumber", required = false) Optional<String> partNumber) {
    return stockService.listStock(warehouseNo, partNumber);
  }

  @PostMapping("/bulk")
  public StockUploadResultDto uploadStock(@RequestBody List<StockUploadItemDto> items) {
    return stockService.upsertStock(items);
  }

  @GetMapping("/{warehouseNo}/{partNumber}")
  public StockItemDto getStock(
      @PathVariable("warehouseNo") String warehouseNo,
      @PathVariable("partNumber") String partNumber) {
    return stockService.getStockByPart(warehouseNo, partNumber)
        .orElse(null);
  }

  @GetMapping("/suggest")
  public List<StockPickSuggestionDto> suggestPick(
      @RequestParam("warehouseNo") String warehouseNo,
      @RequestParam("partNumber") String partNumber,
      @RequestParam("requiredQty") int requiredQty) {
    return stockService.suggestPick(warehouseNo, partNumber, requiredQty);
  }
}
