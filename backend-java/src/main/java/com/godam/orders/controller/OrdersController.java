package com.godam.orders.controller;

import com.godam.orders.dto.OrderSummaryDto;
import com.godam.orders.dto.OrderUploadItemDto;
import com.godam.orders.dto.OrderUploadResultDto;
import com.godam.orders.dto.OrderPickRequest;
import com.godam.orders.dto.OrderStatusUpdateRequest;
import com.godam.orders.dto.OrderOverrideRequest;
import com.godam.orders.dto.OrderItemDto;
import com.godam.orders.dto.OrderItemUpdateRequest;
import com.godam.orders.dto.OrderViewDto;
import com.godam.orders.dto.OrderEditRequest;
import com.godam.orders.dto.OrderDeleteRequest;
import com.godam.orders.dto.OrderSendForPickupRequest;
import com.godam.orders.service.OrdersService;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/orders", "/api/orders"})
public class OrdersController {
  private final OrdersService ordersService;

  public OrdersController(OrdersService ordersService) {
    this.ordersService = ordersService;
  }

  @GetMapping("/{orderId}")
  public OrderViewDto getOrder(@PathVariable("orderId") Long orderId) {
    return ordersService.getOrder(orderId);
  }

  @GetMapping
  public List<OrderSummaryDto> listOrders(
      @RequestParam(name = "dnCreated", required = false) Boolean dnCreated) {
    return ordersService.listOrders(dnCreated);
  }

  @PostMapping("/bulk")
  public OrderUploadResultDto uploadOrders(@RequestBody List<OrderUploadItemDto> rows) {
    return ordersService.uploadOrders(rows);
  }

  @PostMapping("/{orderId}/items/pick")
  public OrderItemDto pickItem(
      @PathVariable("orderId") Long orderId,
      @RequestBody OrderPickRequest request) {
    return ordersService.pickItem(
        orderId,
        request.getPartNumber(),
        request.getPickedRack(),
        request.getPickedBy(),
        request.getPickedQty());
  }

  @PatchMapping("/{orderId}")
  public void editOrder(
      @PathVariable("orderId") Long orderId,
      @RequestBody OrderEditRequest request) {
    ordersService.editOrder(orderId, request);
  }

  @PatchMapping("/{orderId}/items")
  public OrderItemDto updateOrderItem(
      @PathVariable("orderId") Long orderId,
      @RequestBody OrderItemUpdateRequest request) {
    return ordersService.updateOrderItemQty(orderId, request);
  }

  @DeleteMapping("/{orderId}")
  public void deleteOrder(
      @PathVariable("orderId") Long orderId,
      @RequestBody OrderDeleteRequest request) {
    ordersService.deleteOrder(orderId, request);
  }

  @PostMapping("/{orderId}/send-pickup")
  public void sendForPickup(
      @PathVariable("orderId") Long orderId,
      @RequestBody OrderSendForPickupRequest request) {
    ordersService.sendForPickup(orderId, request);
  }

  @PatchMapping("/{orderId}/status")
  public void updateStatus(
      @PathVariable("orderId") Long orderId,
      @RequestBody OrderStatusUpdateRequest request) {
    ordersService.updateStatus(orderId, request.getPickingStatus(), request.getCheckingStatus());
  }

  @PostMapping("/{orderId}/override-status")
  public void overrideStatus(
      @PathVariable("orderId") Long orderId,
      @RequestBody OrderOverrideRequest request) {
    ordersService.overrideStatus(orderId, request.getOwnerPassword());
  }
}
