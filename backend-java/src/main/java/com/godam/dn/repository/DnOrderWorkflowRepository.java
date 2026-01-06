package com.godam.dn.repository;

import com.godam.orders.OrderWorkflow;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("dnOrderWorkflowRepository")
public interface DnOrderWorkflowRepository extends JpaRepository<OrderWorkflow, Long> {
  @EntityGraph(attributePaths = {"items", "transport"})
  Optional<OrderWorkflow> findDetailedById(Long id);
}
