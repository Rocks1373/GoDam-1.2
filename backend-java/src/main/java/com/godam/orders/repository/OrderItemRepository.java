package com.godam.orders.repository;

import com.godam.orders.OrderItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
  void deleteByOrder_Id(Long orderId);

  Optional<OrderItem> findByOrder_IdAndPartNumber(Long orderId, String partNumber);

  List<OrderItem> findByOrder_Id(Long orderId);
}
