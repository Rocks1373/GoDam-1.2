package com.godam.dn.repository;

import com.godam.orders.OrderTransport;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderTransportRepository extends JpaRepository<OrderTransport, Long> {
  Optional<OrderTransport> findByOrder_Id(Long orderId);
}
