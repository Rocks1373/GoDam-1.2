package com.godam.mobile.controller;

import com.godam.mobile.dto.MobileMovementDto;
import com.godam.mobile.dto.MobileOrderStatusDto;
import com.godam.mobile.dto.MobileOrderSummaryDto;
import com.godam.mobile.service.MobileService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/mobile")
public class MobileController {
  private final MobileService mobileService;

  public MobileController(MobileService mobileService) {
    this.mobileService = mobileService;
  }

  @GetMapping("/orders")
  public List<MobileOrderSummaryDto> listOrders() {
    return mobileService.listOrders();
  }

  @GetMapping("/orders/{outboundNumber}/status")
  public MobileOrderStatusDto getStatus(@PathVariable("outboundNumber") String outboundNumber) {
    return mobileService.getOrderStatus(outboundNumber);
  }

  @GetMapping("/orders/{outboundNumber}/timeline")
  public List<MobileMovementDto> getTimeline(@PathVariable("outboundNumber") String outboundNumber) {
    return mobileService.getTimeline(outboundNumber);
  }
}
