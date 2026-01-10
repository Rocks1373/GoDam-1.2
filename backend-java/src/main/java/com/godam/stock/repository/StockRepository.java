package com.godam.stock.repository;

import com.godam.stock.Stock;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockRepository extends JpaRepository<Stock, Long> {
  Optional<Stock> findFirstByWarehouseNoAndPartNumberOrderByCreatedAtAsc(String warehouseNo, String partNumber);

  List<Stock> findByWarehouseNoAndPartNumberOrderByCreatedAtAsc(String warehouseNo, String partNumber);

  List<Stock> findByWarehouseNoOrderByCreatedAtDesc(String warehouseNo);

  Optional<Stock> findFirstByWarehouseNoAndStorageLocationAndPartNumberAndRackAndDrumNo(
      String warehouseNo,
      String storageLocation,
      String partNumber,
      String rack,
      Integer drumNo);

  List<Stock> findByWarehouseNoAndPartNumberIn(String warehouseNo, Collection<String> partNumbers);

  List<Stock> findByPartNumberIn(Collection<String> partNumbers);

  List<Stock> findByPartNumberOrderByCreatedAtAsc(String partNumber);

  List<Stock> findByParentPnOrderByCreatedAtAsc(String parentPn);

  List<Stock> findByPartNumberAndPnIndicatorOrderByCreatedAtAsc(String partNumber, String pnIndicator);

  Optional<Stock> findFirstByPartNumberAndRackOrderByCreatedAtAsc(String partNumber, String rack);
}
