package com.godam.movements.service;

import com.godam.movements.MovementType;
import com.godam.movements.StockMovement;
import com.godam.movements.repository.StockMovementRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockMovementService {
  private final StockMovementRepository stockMovementRepository;

  public StockMovementService(StockMovementRepository stockMovementRepository) {
    this.stockMovementRepository = stockMovementRepository;
  }

  @Transactional
  public StockMovement logMovement(
      MovementType type,
      String warehouseNo,
      String storageLocation,
      String partNumber,
      int qtyChange,
      String outboundNumber,
      String invoiceNumber,
      Long userId,
      String rack) {
    StockMovement movement = new StockMovement();
    movement.setMovementType(type);
    movement.setWarehouseNo(warehouseNo);
    movement.setStorageLocation(storageLocation);
    movement.setPartNumber(partNumber);
    movement.setQtyChange(qtyChange);
    movement.setSalesOrder(outboundNumber);
    movement.setInvoiceNumber(invoiceNumber);
    movement.setCreatedBy(userId);
    movement.setRack(rack);
    movement.setCreatedAt(Instant.now());
    return stockMovementRepository.save(movement);
  }

  @Transactional(readOnly = true)
  public int getParkedQty(String warehouseNo, String partNumber) {
    return stockMovementRepository.sumQtyByWarehousePartAndTypes(
        warehouseNo,
        partNumber,
        List.of(MovementType.O103_PICKED, MovementType.O104_CHECKED));
  }

  @Transactional(readOnly = true)
  public List<StockMovement> getMovementsByOutbound(String outboundNumber) {
    return stockMovementRepository.findBySalesOrderOrderByCreatedAtAsc(outboundNumber);
  }
}
