package com.godam.mobile.service;

import com.godam.mobile.dto.MobileMovementDto;
import com.godam.mobile.dto.MobileOrderStatusDto;
import com.godam.mobile.dto.MobileOrderSummaryDto;
import com.godam.movements.MovementType;
import com.godam.movements.StockMovement;
import com.godam.movements.repository.StockMovementRepository;
import com.godam.orders.OrderWorkflow;
import com.godam.orders.repository.OrderWorkflowRepository;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MobileService {
  private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
      .withZone(ZoneId.systemDefault());

  private final OrderWorkflowRepository orderWorkflowRepository;
  private final StockMovementRepository stockMovementRepository;

  public MobileService(
      OrderWorkflowRepository orderWorkflowRepository,
      StockMovementRepository stockMovementRepository) {
    this.orderWorkflowRepository = orderWorkflowRepository;
    this.stockMovementRepository = stockMovementRepository;
  }

  @Transactional(readOnly = true)
  public List<MobileOrderSummaryDto> listOrders() {
    List<OrderWorkflow> orders = orderWorkflowRepository.findAll();
    List<MobileOrderSummaryDto> results = new ArrayList<>();
    for (OrderWorkflow order : orders) {
      results.add(toSummary(order));
    }
    return results;
  }

  @Transactional(readOnly = true)
  public MobileOrderStatusDto getOrderStatus(String outboundNumber) {
    MobileOrderStatusDto dto = new MobileOrderStatusDto();
    dto.setOutboundNumber(outboundNumber);
    MovementType status = resolveCurrentStatus(outboundNumber);
    if (status != null) {
      dto.setCurrentStatus(status.getCode());
      dto.setReadableStatus(status.name().replace("_", " "));
    }
    return dto;
  }

  @Transactional(readOnly = true)
  public List<MobileMovementDto> getTimeline(String outboundNumber) {
    List<StockMovement> movements = stockMovementRepository.findBySalesOrderOrderByCreatedAtAsc(outboundNumber);
    List<MobileMovementDto> results = new ArrayList<>();
    for (StockMovement movement : movements) {
      MobileMovementDto dto = new MobileMovementDto();
      MovementType type = movement.getMovementType();
      if (type != null) {
        dto.setMovementCode(type.getCode());
        dto.setReadableStatus(type.name().replace("_", " "));
      }
      if (movement.getCreatedAt() != null) {
        dto.setCreatedAt(TIME_FORMAT.format(movement.getCreatedAt()));
      }
      results.add(dto);
    }
    return results;
  }

  private MobileOrderSummaryDto toSummary(OrderWorkflow order) {
    MobileOrderSummaryDto dto = new MobileOrderSummaryDto();
    dto.setOrderId(order.getId());
    dto.setOutboundNumber(order.getOutboundNumber());
    dto.setInvoiceNumber(order.getInvoiceNumber());
    dto.setCustomerPo(order.getCustomerPo());
    dto.setCustomerName(order.getCustomerName());
    dto.setDnCreated(order.isDnCreated());
    MovementType status = resolveCurrentStatus(order.getOutboundNumber());
    if (status != null) {
      dto.setCurrentStatus(status.getCode());
      dto.setReadableStatus(status.name().replace("_", " "));
    }
    return dto;
  }

  private MovementType resolveCurrentStatus(String outboundNumber) {
    List<StockMovement> movements = stockMovementRepository.findBySalesOrderOrderByCreatedAtAsc(outboundNumber);
    if (movements.isEmpty()) {
      return MovementType.O101_UPLOADED;
    }
    StockMovement latest = movements.stream()
        .max(Comparator.comparing(StockMovement::getCreatedAt))
        .orElse(movements.get(movements.size() - 1));
    return latest.getMovementType();
  }
}
