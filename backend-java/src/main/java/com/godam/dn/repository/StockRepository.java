package com.godam.dn.repository;

import com.godam.stock.Stock;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockRepository extends JpaRepository<Stock, Long> {
  List<Stock> findByPartNumberIn(Collection<String> partNumbers);
}
