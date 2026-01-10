package com.godam.orders.repository;

import com.godam.orders.OrderAdminAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderAdminAuditRepository extends JpaRepository<OrderAdminAudit, Long> {
}
