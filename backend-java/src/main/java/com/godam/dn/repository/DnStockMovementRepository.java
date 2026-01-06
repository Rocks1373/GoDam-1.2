package com.godam.dn.repository;

import com.godam.movements.MovementType;
import com.godam.movements.StockMovement;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("dnStockMovementRepository")
public interface DnStockMovementRepository extends JpaRepository<StockMovement, Long> {
  Optional<StockMovement> findTopBySalesOrderAndMovementTypeOrderByCreatedAtDesc(
      String salesOrder, MovementType movementType);

  List<StockMovement> findBySalesOrder(String salesOrder);
}
