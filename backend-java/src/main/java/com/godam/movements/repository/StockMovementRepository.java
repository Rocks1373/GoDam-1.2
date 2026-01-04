package com.godam.movements.repository;

import com.godam.movements.MovementType;
import com.godam.movements.StockMovement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
  @Query("select coalesce(sum(m.qtyChange), 0) from stock_movements m where m.warehouseNo = :warehouseNo and m.partNumber = :partNumber and m.movementType in :types")
  int sumQtyByWarehousePartAndTypes(
      @Param("warehouseNo") String warehouseNo,
      @Param("partNumber") String partNumber,
      @Param("types") List<MovementType> types);

  List<StockMovement> findBySalesOrderOrderByCreatedAtAsc(String salesOrder);
}
