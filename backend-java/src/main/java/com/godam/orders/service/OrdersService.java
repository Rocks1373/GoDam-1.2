package com.godam.orders.service;

import com.godam.orders.OrderItem;
import com.godam.orders.OrderWorkflow;
import com.godam.orders.dto.OrderItemDto;
import com.godam.orders.dto.OrderSummaryDto;
import com.godam.orders.dto.OrderViewDto;
import com.godam.orders.repository.OrderWorkflowRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrdersService {
  private final OrderWorkflowRepository orderWorkflowRepository;

  public OrdersService(OrderWorkflowRepository orderWorkflowRepository) {
    this.orderWorkflowRepository = orderWorkflowRepository;
  }

  @Transactional(readOnly = true)
  public OrderViewDto getOrder(Long orderId) {
    OrderWorkflow order = orderWorkflowRepository.findDetailedById(orderId)
        .orElseThrow(() -> new IllegalArgumentException("Order not found"));

    OrderViewDto view = new OrderViewDto();
    view.setSummary(toSummary(order));
    view.setItems(toItemDtos(order.getItems()));
    return view;
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

  private OrderSummaryDto toSummary(OrderWorkflow order) {
    OrderSummaryDto summary = new OrderSummaryDto();
    summary.setOrderId(order.getId());
    summary.setInvoiceNumber(order.getInvoiceNumber());
    summary.setOutboundNumber(order.getOutboundNumber());
    summary.setGappPo(order.getGappPo());
    summary.setCustomerPo(order.getCustomerPo());
    summary.setCustomerName(order.getCustomerName());
    summary.setDnCreated(order.isDnCreated());

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
      OrderItemDto dto = new OrderItemDto();
      dto.setPartNumber(item.getPartNumber());
      dto.setDescription(item.getDescription());
      dto.setQty(item.getQty() == null ? 0.0 : item.getQty());
      dtos.add(dto);
    }
    return dtos;
  }
}
