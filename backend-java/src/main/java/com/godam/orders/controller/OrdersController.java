package com.godam.orders.controller;

import com.godam.orders.dto.OrderSummaryDto;
import com.godam.orders.dto.OrderViewDto;
import com.godam.orders.service.OrdersService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
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
}
