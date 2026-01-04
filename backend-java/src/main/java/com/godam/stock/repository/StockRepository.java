package com.godam.stock.repository;

import com.godam.stock.Stock;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockRepository extends JpaRepository<Stock, Long> {
  Optional<Stock> findFirstByWarehouseNoAndPartNumberOrderByCreatedAtAsc(String warehouseNo, String partNumber);

  List<Stock> findByWarehouseNoAndPartNumberOrderByCreatedAtAsc(String warehouseNo, String partNumber);

  List<Stock> findByWarehouseNoAndPartNumberIn(String warehouseNo, Collection<String> partNumbers);
}
