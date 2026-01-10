package com.godam.movements.repository;

import com.godam.movements.MovementType;
import com.godam.movements.StockMovement;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
  @Query("select coalesce(sum(m.qtyChange), 0) from StockMovement m where m.warehouseNo = :warehouseNo and m.partNumber = :partNumber and m.movementType in :types")
  int sumQtyByWarehousePartAndTypes(
      @Param("warehouseNo") String warehouseNo,
      @Param("partNumber") String partNumber,
      @Param("types") List<MovementType> types);

  Optional<StockMovement> findTopBySalesOrderAndMovementTypeOrderByCreatedAtDesc(
      String salesOrder, MovementType movementType);

  List<StockMovement> findBySalesOrder(String salesOrder);

  List<StockMovement> findBySalesOrderOrderByCreatedAtAsc(String salesOrder);

  @Query("select coalesce(sum(m.qtyChange), 0) from StockMovement m where m.salesOrder = :salesOrder and m.partNumber = :partNumber and m.movementType = :type")
  int sumQtyBySalesOrderAndPartNumberAndType(
      @Param("salesOrder") String salesOrder,
      @Param("partNumber") String partNumber,
      @Param("type") MovementType type);
}
