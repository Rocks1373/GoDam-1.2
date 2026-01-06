package com.godam.dn.service;

import com.godam.common.User;
import com.godam.dn.dto.DnCreateRequest;
import com.godam.dn.dto.DnItemView;
import com.godam.dn.dto.DnOptions;
import com.godam.dn.dto.DnTotals;
import com.godam.dn.dto.DnViewResponse;
import com.godam.dn.repository.OrderTransportRepository;
import com.godam.orders.repository.OrderWorkflowRepository;
import com.godam.movements.repository.StockMovementRepository;
import com.godam.dn.repository.UserRepository;
import com.godam.movements.MovementType;
import com.godam.movements.StockMovement;
import com.godam.orders.OrderItem;
import com.godam.orders.OrderTransport;
import com.godam.orders.OrderWorkflow;
import com.godam.stock.Stock;
import com.godam.stock.repository.StockRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DnService {
  private static final String DEFAULT_UOM = "PCS";
  private static final String DEFAULT_CONDITION = "NEW";
  private static final String DEFAULT_FROM_LOCATION = "Riyadh";

  private final OrderWorkflowRepository orderWorkflowRepository;
  private final OrderTransportRepository orderTransportRepository;
  private final StockRepository stockRepository;
  private final StockMovementRepository stockMovementRepository;
  private final UserRepository userRepository;

  public DnService(
      OrderWorkflowRepository orderWorkflowRepository,
      OrderTransportRepository orderTransportRepository,
      StockRepository stockRepository,
      StockMovementRepository stockMovementRepository,
      UserRepository userRepository) {
    this.orderWorkflowRepository = orderWorkflowRepository;
    this.orderTransportRepository = orderTransportRepository;
    this.stockRepository = stockRepository;
    this.stockMovementRepository = stockMovementRepository;
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public DnViewResponse getDnView(Long orderId, DnOptions options) {
    OrderWorkflow order = orderWorkflowRepository.findDetailedById(orderId)
        .orElseThrow(() -> new com.godam.common.exception.ResourceNotFoundException("Order not found"));

    List<OrderItem> items = order.getItems();
    Map<String, Stock> stockByPart = loadStockByPart(items);

    DnViewResponse response = new DnViewResponse();
    response.setInvoice(order.getInvoiceNumber());
    response.setOutboundNumber(order.getOutboundNumber());
    response.setGappPo(order.getGappPo());
    response.setCustomerPo(order.getCustomerPo());
    response.setCustomerName(order.getCustomerName());
    response.setOptions(options == null ? new DnOptions() : options);

    OrderTransport transport = order.getTransport();
    if (transport != null) {
      response.setCarrier(transport.getTransporterName());
      response.setDriverName(transport.getDriverName());
      response.setDriverMobile(transport.getDriverNumber());
      response.setVehicleType(transport.getVehicleType());
    }

    response.setItems(buildItemViews(items, stockByPart));
    response.setTotals(computeTotals(response.getItems()));
    response.setCheckedBy(resolveCheckedBy(order.getOutboundNumber()));

    return response;
  }

  @Transactional
  public void saveDn(Long orderId, DnCreateRequest request, Long userId) {
    OrderWorkflow order = orderWorkflowRepository.findById(orderId)
        .orElseThrow(() -> new com.godam.common.exception.ResourceNotFoundException("Order not found"));

    OrderTransport transport = orderTransportRepository.findByOrder_Id(orderId).orElse(null);
    if (transport == null) {
      transport = new OrderTransport();
      transport.setOrder(order);
      transport.setFromLocation(DEFAULT_FROM_LOCATION);
    }

    transport.setTransporterName(request.getCarrier());
    transport.setDriverName(request.getDriverName());
    transport.setDriverNumber(request.getDriverMobile());
    transport.setVehicleType(request.getVehicleType());

    transport.setInvoiceNumber(valueOrDefault(request.getInvoice(), order.getInvoiceNumber()));
    transport.setOutboundNumber(valueOrDefault(request.getOutboundNumber(), order.getOutboundNumber()));

    if (transport.getFromLocation() == null || transport.getFromLocation().isBlank()) {
      transport.setFromLocation(DEFAULT_FROM_LOCATION);
    }

    orderTransportRepository.save(transport);

    order.setDnCreated(true);
    orderWorkflowRepository.save(order);

    String dnNumber = normalize(request.getDnNumber());
    if (dnNumber != null) {
      String outbound = valueOrDefault(request.getOutboundNumber(), order.getOutboundNumber());
      List<StockMovement> movements = stockMovementRepository.findBySalesOrder(outbound);
      for (StockMovement movement : movements) {
        movement.setDnNumber(dnNumber);
      }
      stockMovementRepository.saveAll(movements);
    }
  }

  @Transactional(readOnly = true)
  public String resolveCheckedBy(String outboundNumber) {
    if (outboundNumber == null || outboundNumber.isBlank()) {
      return null;
    }
    Optional<StockMovement> movement = stockMovementRepository
        .findTopBySalesOrderAndMovementTypeOrderByCreatedAtDesc(outboundNumber, MovementType.O104_CHECKED);
    if (movement.isEmpty()) {
      return null;
    }
    Long userId = movement.get().getCreatedBy();
    if (userId == null) {
      return null;
    }
    Optional<User> user = userRepository.findById(userId);
    return user.map(User::getUsername).orElse(null);
  }

  private Map<String, Stock> loadStockByPart(List<OrderItem> items) {
    Set<String> partNumbers = items.stream()
        .map(OrderItem::getPartNumber)
        .filter(Objects::nonNull)
        .collect(Collectors.toSet());
    if (partNumbers.isEmpty()) {
      return new HashMap<>();
    }
    List<Stock> stockRows = stockRepository.findByPartNumberIn(partNumbers);
    return stockRows.stream().collect(Collectors.toMap(Stock::getPartNumber, s -> s, (a, b) -> a));
  }

  private List<DnItemView> buildItemViews(List<OrderItem> items, Map<String, Stock> stockByPart) {
    List<DnItemView> views = new ArrayList<>();
    for (OrderItem item : items) {
      DnItemView view = new DnItemView();
      view.setPartNumber(item.getPartNumber());
      view.setQty(item.getQty() == null ? 0.0 : item.getQty().doubleValue());

      String description = normalize(item.getDescription());
      Stock stock = stockByPart.get(item.getPartNumber());
      if (description == null && stock != null) {
        description = normalize(stock.getDescription());
      }
      view.setDescription(description);

      String uom = stock != null ? normalize(stock.getUom()) : null;
      view.setUom(uom == null ? DEFAULT_UOM : uom);
      view.setCondition(DEFAULT_CONDITION);

      views.add(view);
    }
    return views;
  }

  private DnTotals computeTotals(List<DnItemView> items) {
    DnTotals totals = new DnTotals();
    int totalParts = items.size();
    double totalQty = items.stream().mapToDouble(i -> i.getQty() == null ? 0.0 : i.getQty()).sum();
    int totalCases = (int) Math.ceil(totalQty / 10.0);
    double grossWeight = totalQty * 1.2;
    double volume = totalQty * 0.02;

    totals.setTotalParts(totalParts);
    totals.setTotalQty(totalQty);
    totals.setTotalCases(totalCases);
    totals.setGrossWeight(grossWeight);
    totals.setVolume(volume);
    return totals;
  }

  private String valueOrDefault(String value, String fallback) {
    String normalized = normalize(value);
    return normalized == null ? fallback : normalized;
  }

  private String normalize(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }
}
