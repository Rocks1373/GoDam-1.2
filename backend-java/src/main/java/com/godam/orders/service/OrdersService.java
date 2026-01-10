package com.godam.orders.service;

import com.godam.common.User;
import com.godam.common.UserRepository;
import com.godam.common.exception.BusinessRuleException;
import com.godam.common.exception.ResourceNotFoundException;
import com.godam.movements.MovementType;
import com.godam.movements.repository.StockMovementRepository;
import com.godam.movements.service.StockMovementService;
import com.godam.orders.OrderAdminAction;
import com.godam.orders.OrderAdminAudit;
import com.godam.orders.OrderItem;
import com.godam.orders.OrderWorkflow;
import com.godam.orders.dto.OrderDeleteRequest;
import com.godam.orders.dto.OrderEditRequest;
import com.godam.orders.dto.OrderItemDto;
import com.godam.orders.dto.OrderSendForPickupRequest;
import com.godam.orders.dto.OrderSummaryDto;
import com.godam.orders.dto.OrderUploadItemDto;
import com.godam.orders.dto.OrderUploadResultDto;
import com.godam.orders.dto.OrderViewDto;
import com.godam.orders.repository.OrderAdminAuditRepository;
import com.godam.orders.repository.OrderItemRepository;
import com.godam.orders.repository.OrderWorkflowRepository;
import com.godam.security.UploadValidationPipeline;
import com.godam.stock.dto.StockPickContext;
import com.godam.stock.service.StockService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrdersService {
  private static final String OWNER_USERNAME = "godam_admin";
  private static final String OVERRIDE_STATUS = "COMPLETED";

  private final OrderWorkflowRepository orderWorkflowRepository;
  private final OrderItemRepository orderItemRepository;
  private final OrderAdminAuditRepository orderAuditRepository;
  private final StockService stockService;
  private final StockMovementService stockMovementService;
  private final StockMovementRepository stockMovementRepository;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final UploadValidationPipeline uploadValidationPipeline;

  public OrdersService(
      OrderWorkflowRepository orderWorkflowRepository,
      OrderItemRepository orderItemRepository,
      OrderAdminAuditRepository orderAuditRepository,
      StockService stockService,
      StockMovementService stockMovementService,
      StockMovementRepository stockMovementRepository,
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      UploadValidationPipeline uploadValidationPipeline) {
    this.orderWorkflowRepository = orderWorkflowRepository;
    this.orderItemRepository = orderItemRepository;
    this.orderAuditRepository = orderAuditRepository;
    this.stockService = stockService;
    this.stockMovementService = stockMovementService;
    this.stockMovementRepository = stockMovementRepository;
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.uploadValidationPipeline = uploadValidationPipeline;
  }

  @Transactional(readOnly = true)
  public OrderViewDto getOrder(Long orderId) {
    OrderWorkflow order = orderWorkflowRepository.findDetailedById(orderId)
        .orElseThrow(() -> new com.godam.common.exception.ResourceNotFoundException("Order not found"));

    OrderViewDto view = new OrderViewDto();
    view.setSummary(toSummary(order));
    view.setItems(toItemDtos(order.getItems()));
    return view;
  }

  @Transactional
  public OrderItemDto pickItem(Long orderId, String partNumber, String pickedRack, String pickedBy, Integer pickedQty) {
    OrderItem item = orderItemRepository.findByOrder_IdAndPartNumber(orderId, partNumber)
        .orElseThrow(() -> new com.godam.common.exception.ResourceNotFoundException("Order item not found"));
    int requestedQty = item.getQty() == null ? 0 : item.getQty();
    if (requestedQty <= 0) {
      throw new com.godam.common.exception.StockValidationException("Requested qty must be greater than zero");
    }
    int pickQty = pickedQty == null ? requestedQty : pickedQty;
    if (pickQty <= 0) {
      throw new com.godam.common.exception.StockValidationException("Pick qty must be greater than zero");
    }

    OrderWorkflow order = item.getOrder();
    String outbound = order == null ? null : order.getOutboundNumber();
    int alreadyPicked = 0;
    if (outbound != null) {
      alreadyPicked = stockMovementRepository.sumQtyBySalesOrderAndPartNumberAndType(
          outbound,
          partNumber,
          MovementType.O103_PICKED);
    }
    if (alreadyPicked + pickQty > requestedQty) {
      throw new com.godam.common.exception.StockValidationException("Picked qty exceeds requested qty");
    }

    StockPickContext context = stockService.preparePickContext(partNumber, pickQty, pickedRack);
    item.setPickedRack(pickedRack);
    item.setPickedBy(pickedBy == null || pickedBy.isBlank() ? "Picker" : pickedBy);
    item.setIsPicked(alreadyPicked + pickQty >= requestedQty);
    item.setPickedAt(java.time.LocalDateTime.now());
    OrderItem saved = orderItemRepository.save(item);

    stockMovementService.logMovement(
        MovementType.O103_PICKED,
        context.getWarehouseNo(),
        context.getStorageLocation(),
        context.getResolvedPartNumber(),
        pickQty,
        outbound,
        order == null ? null : order.getInvoiceNumber(),
        null,
        context.getRack(),
        context.getBin(),
        context.getSuggestedRack(),
        context.getActualRack(),
        pickQty,
        requestedQty,
        context.getReference(),
        context.getRemark());
    return toItemDto(saved);
  }

  @Transactional
  public void updateStatus(Long orderId, String pickingStatus, String checkingStatus) {
    OrderWorkflow order = orderWorkflowRepository.findById(orderId)
        .orElseThrow(() -> new com.godam.common.exception.ResourceNotFoundException("Order not found"));
    if (pickingStatus != null && !pickingStatus.isBlank()) {
      order.setPickingStatus(pickingStatus);
    }
    if (checkingStatus != null && !checkingStatus.isBlank()) {
      order.setCheckingStatus(checkingStatus);
    }
    orderWorkflowRepository.save(order);

    if (checkingStatus != null && "CONFIRMED".equalsIgnoreCase(checkingStatus)) {
      List<OrderItem> items = order.getItems();
      if (items != null) {
        for (OrderItem item : items) {
          int qty = item.getQty() == null ? 0 : item.getQty();
          if (qty <= 0) {
            continue;
          }
          StockPickContext context = stockService.preparePickContext(
              item.getPartNumber(),
              qty,
              item.getPickedRack());
          stockService.applyConfirmedDeduction(item.getPartNumber(), qty, item.getPickedRack());
          stockMovementService.logMovement(
              MovementType.O105_CONFIRMED,
              context.getWarehouseNo(),
              context.getStorageLocation(),
              context.getResolvedPartNumber(),
              -qty,
              order.getOutboundNumber(),
              order.getInvoiceNumber(),
              null,
              context.getRack(),
              context.getBin(),
              context.getSuggestedRack(),
              context.getActualRack(),
              qty,
              qty,
              context.getReference(),
              context.getRemark());
        }
      }
    }
  }

  @Transactional
  public void overrideStatus(Long orderId, String ownerPassword) {
    if (ownerPassword == null || ownerPassword.isBlank()) {
      throw new BusinessRuleException("Owner password is required for override");
    }
    User owner = userRepository.findByUsername(OWNER_USERNAME)
        .orElseThrow(() -> new BusinessRuleException("Owner account not found"));
    if (!passwordEncoder.matches(ownerPassword, owner.getPassword())) {
      throw new BusinessRuleException("Owner password is invalid");
    }

    OrderWorkflow order = orderWorkflowRepository.findById(orderId)
        .orElseThrow(() -> new com.godam.common.exception.ResourceNotFoundException("Order not found"));
    order.setPickingStatus(OVERRIDE_STATUS);
    order.setCheckingStatus(OVERRIDE_STATUS);
    order.setDnCreated(true);

    List<OrderItem> items = order.getItems();
    for (OrderItem item : items) {
      int qty = item.getQty() == null ? 0 : item.getQty();
      if (qty <= 0) {
        continue;
      }
      StockPickContext context = stockService.preparePickContext(item.getPartNumber(), qty, item.getPickedRack());
      String actualRack = context.getActualRack() != null ? context.getActualRack() : context.getRack();
      item.setPickedRack(actualRack);
      item.setPickedBy(owner.getUsername());
      item.setPickedAt(java.time.LocalDateTime.now());
      item.setIsPicked(true);
      orderItemRepository.save(item);

          stockMovementService.logMovement(
              MovementType.O103_PICKED,
              context.getWarehouseNo(),
              context.getStorageLocation(),
              context.getResolvedPartNumber(),
              qty,
              order.getOutboundNumber(),
              order.getInvoiceNumber(),
              owner.getUserId(),
              context.getRack(),
              context.getBin(),
              context.getSuggestedRack(),
              context.getActualRack(),
          qty,
          qty,
          "owner-override",
          "Owner override bypass - auto pick");

      stockService.applyConfirmedDeduction(item.getPartNumber(), qty, actualRack);

          stockMovementService.logMovement(
              MovementType.O105_CONFIRMED,
              context.getWarehouseNo(),
              context.getStorageLocation(),
              context.getResolvedPartNumber(),
              -qty,
              order.getOutboundNumber(),
              order.getInvoiceNumber(),
              owner.getUserId(),
          context.getRack(),
          context.getBin(),
          context.getSuggestedRack(),
          context.getActualRack(),
          qty,
          qty,
          "owner-override",
          "Owner override bypass - final deduction");
    }

    orderWorkflowRepository.save(order);
  }

  @Transactional(readOnly = true)
  public List<OrderSummaryDto> listOrders(Boolean dnCreated) {
    List<OrderWorkflow> orders;
    if (dnCreated == null) {
      orders = orderWorkflowRepository.findAll();
    } else {
      orders = orderWorkflowRepository.findByDnCreated(dnCreated);
    }
    List<OrderSummaryDto> summaries = new ArrayList<>();
    for (OrderWorkflow order : orders) {
      summaries.add(toSummary(order));
    }
    return summaries;
  }

  @Transactional
  public OrderUploadResultDto uploadOrders(List<OrderUploadItemDto> rows) {
    Map<String, List<OrderUploadItemDto>> grouped = new LinkedHashMap<>();
    for (int i = 0; i < rows.size(); i++) {
      OrderUploadItemDto row = rows.get(i);
      validateOrderUploadRow(row, i + 1);
      if (row.getOutboundNumber() == null || row.getOutboundNumber().isBlank()) {
        continue;
      }
      if (row.getPartNumber() == null || row.getPartNumber().isBlank()) {
        continue;
      }
      grouped.computeIfAbsent(row.getOutboundNumber(), key -> new ArrayList<>()).add(row);
    }

    int inserted = 0;
    int updated = 0;

    for (Map.Entry<String, List<OrderUploadItemDto>> entry : grouped.entrySet()) {
      String outbound = entry.getKey();
      List<OrderUploadItemDto> items = entry.getValue();

      OrderWorkflow order = orderWorkflowRepository.findByOutboundNumber(outbound).orElse(null);
      boolean isNew = order == null;
      if (order == null) {
        order = new OrderWorkflow();
        order.setOutboundNumber(outbound);
        order.setDnCreated(false);
      }

      OrderUploadItemDto first = items.get(0);
      order.setInvoiceNumber(first.getInvoiceNumber());
      order.setCustomerPo(first.getCustomerPo());
      order.setCustomerName(first.getCustomerName());
      order.setGappPo(first.getSalesOrder());

      OrderWorkflow saved = orderWorkflowRepository.save(order);
      if (!isNew) {
        orderItemRepository.deleteByOrder_Id(saved.getId());
      }
      List<OrderItem> orderItems = new ArrayList<>();
      for (OrderUploadItemDto row : items) {
        OrderItem item = new OrderItem();
        item.setOrder(saved);
        item.setPartNumber(row.getPartNumber());
        item.setDescription(null);
        item.setQty(row.getQty() == null ? 0 : row.getQty());
        orderItems.add(item);
      }
      orderItemRepository.saveAll(orderItems);

      if (isNew) {
        inserted++;
      } else {
        updated++;
      }
    }

    return new OrderUploadResultDto(inserted, updated, grouped.size());
  }

  @Transactional
  public void editOrder(Long orderId, OrderEditRequest request) {
    OrderWorkflow order = orderWorkflowRepository.findById(orderId)
        .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    requireReason(request.getReason());
    validateAdminColumn("invoice_number", request.getInvoiceNumber());
    validateAdminColumn("customer_name", request.getCustomerName());
    validateAdminColumn("customer_po", request.getCustomerPo());
    validateAdminColumn("gapp_po", request.getGappPo());
    validateAdminColumn("admin_reason", request.getReason());
    validateAdminColumn("performed_by", request.getPerformedBy());

    List<String> changes = new ArrayList<>();
    if (request.getInvoiceNumber() != null && !request.getInvoiceNumber().equals(order.getInvoiceNumber())) {
      changes.add(formatChange("Invoice", order.getInvoiceNumber(), request.getInvoiceNumber()));
      order.setInvoiceNumber(request.getInvoiceNumber());
    }
    if (request.getCustomerName() != null && !request.getCustomerName().equals(order.getCustomerName())) {
      changes.add(formatChange("Customer", order.getCustomerName(), request.getCustomerName()));
      order.setCustomerName(request.getCustomerName());
    }
    if (request.getCustomerPo() != null && !request.getCustomerPo().equals(order.getCustomerPo())) {
      changes.add(formatChange("Customer PO", order.getCustomerPo(), request.getCustomerPo()));
      order.setCustomerPo(request.getCustomerPo());
    }
    if (request.getGappPo() != null && !request.getGappPo().equals(order.getGappPo())) {
      changes.add(formatChange("GAPP PO", order.getGappPo(), request.getGappPo()));
      order.setGappPo(request.getGappPo());
    }

    orderWorkflowRepository.save(order);
    String details = changes.isEmpty() ? "No changes were applied" : String.join("; ", changes);
    saveAudit(order, OrderAdminAction.EDIT, request.getReason(), request.getPerformedBy(), details);
  }

  @Transactional
  public void deleteOrder(Long orderId, OrderDeleteRequest request) {
    OrderWorkflow order = orderWorkflowRepository.findDetailedById(orderId)
        .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    requireReason(request.getReason());
    validateAdminColumn("admin_reason", request.getReason());
    validateAdminColumn("performed_by", request.getPerformedBy());

    String details = String.format(
        "Order %s (invoice=%s) deleted by admin",
        order.getOutboundNumber(),
        order.getInvoiceNumber());
    saveAudit(order, OrderAdminAction.DELETE, request.getReason(), request.getPerformedBy(), details);

    orderItemRepository.deleteByOrder_Id(orderId);
    orderWorkflowRepository.delete(order);
  }

  @Transactional
  public void sendForPickup(Long orderId, OrderSendForPickupRequest request) {
    OrderWorkflow order = orderWorkflowRepository.findDetailedById(orderId)
        .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    List<OrderItem> items = order.getItems();
    if (items == null || items.isEmpty()) {
      throw new BusinessRuleException("Order has no items to send for pickup.");
    }
    validateAdminColumn("admin_reason", request.getReason());
    validateAdminColumn("admin_note", request.getNote());
    validateAdminColumn("performed_by", request.getPerformedBy());

    order.setPickingStatus("PICK_REQUESTED");
    orderWorkflowRepository.save(order);

    for (OrderItem item : items) {
      int qty = item.getQty() == null ? 0 : item.getQty();
      if (qty <= 0) {
        continue;
      }
      stockMovementService.logMovement(
          MovementType.O102_PICK_REQUESTED,
          null,
          null,
          item.getPartNumber(),
          qty,
          order.getOutboundNumber(),
          order.getInvoiceNumber(),
          null,
          null,
          null,
          null,
          null,
          0,
          qty,
          request.getReason(),
          request.getNote());
    }

    String details = String.format("Sent %d items for pickup", items.size());
    saveAudit(order, OrderAdminAction.SEND_PICKUP, request.getReason(), request.getPerformedBy(), details);
  }

  private void validateOrderUploadRow(OrderUploadItemDto row, int rowNumber) {
    validateColumn("sales_order", row.getSalesOrder(), rowNumber);
    validateColumn("outbound_number", row.getOutboundNumber(), rowNumber);
    validateColumn("customer_po", row.getCustomerPo(), rowNumber);
    validateColumn("part_number", row.getPartNumber(), rowNumber);
    validateColumn("customer_name", row.getCustomerName(), rowNumber);
    validateColumn("invoice_number", row.getInvoiceNumber(), rowNumber);
  }

  private void validateColumn(String columnName, String value, int rowNumber) {
    uploadValidationPipeline.validate(columnName, value, rowNumber);
  }

  private void validateAdminColumn(String columnName, String value) {
    if (value == null) {
      return;
    }
    uploadValidationPipeline.validate(columnName, value, 0);
  }

  private void requireReason(String reason) {
    if (reason == null || reason.isBlank()) {
      throw new BusinessRuleException("Reason is required for this action.");
    }
  }

  private String formatChange(String label, String before, String after) {
    String baseBefore = before == null ? "" : before;
    String baseAfter = after == null ? "" : after;
    return label + ": \"" + baseBefore + "\" → \"" + baseAfter + "\"";
  }

  private void saveAudit(
      OrderWorkflow order,
      OrderAdminAction action,
      String reason,
      String performedBy,
      String details) {
    OrderAdminAudit audit = new OrderAdminAudit();
    audit.setOrderId(order.getId());
    audit.setOutboundNumber(order.getOutboundNumber());
    audit.setAction(action);
    audit.setReason(reason);
    audit.setPerformedBy(performedBy);
    audit.setDetails(details);
    audit.setCreatedAt(Instant.now());
    orderAuditRepository.save(audit);
  }

  private OrderSummaryDto toSummary(OrderWorkflow order) {
    OrderSummaryDto summary = new OrderSummaryDto();
    summary.setOrderId(order.getId());
    summary.setInvoiceNumber(order.getInvoiceNumber());
    summary.setOutboundNumber(order.getOutboundNumber());
    summary.setGappPo(order.getGappPo());
    summary.setCustomerPo(order.getCustomerPo());
    summary.setCustomerName(order.getCustomerName());
    summary.setDnCreated(order.isDnCreated());
    summary.setPickingStatus(order.getPickingStatus());
    summary.setCheckingStatus(order.getCheckingStatus());

    List<OrderItem> items = order.getItems();
    int itemCount = items == null ? 0 : items.size();
    double totalQty = 0.0;
    if (items != null) {
      for (OrderItem item : items) {
        if (item.getQty() != null) {
          totalQty += item.getQty();
        }
      }
    }
    summary.setItemCount(itemCount);
    summary.setTotalQty(totalQty);
    return summary;
  }

  private List<OrderItemDto> toItemDtos(List<OrderItem> items) {
    List<OrderItemDto> dtos = new ArrayList<>();
    if (items == null) {
      return dtos;
    }
    for (OrderItem item : items) {
      dtos.add(toItemDto(item));
    }
    return dtos;
  }

  private OrderItemDto toItemDto(OrderItem item) {
    OrderItemDto dto = new OrderItemDto();
    dto.setPartNumber(item.getPartNumber());
    dto.setDescription(item.getDescription());
    dto.setQty(item.getQty() == null ? 0.0 : item.getQty());
    dto.setPickedBy(item.getPickedBy());
    dto.setPickedRack(item.getPickedRack());
    dto.setPicked(item.getIsPicked() != null && item.getIsPicked());
    return dto;
  }
}
