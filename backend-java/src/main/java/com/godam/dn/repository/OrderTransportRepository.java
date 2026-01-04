package com.godam.dn.repository;

import com.godam.orders.OrderTransport;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderTransportRepository extends JpaRepository<OrderTransport, Long> {
  @Query("select t from order_transport t where t.order.id = :orderId")
  Optional<OrderTransport> findByOrderId(@Param("orderId") Long orderId);
}
