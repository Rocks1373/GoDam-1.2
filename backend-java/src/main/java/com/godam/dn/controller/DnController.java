package com.godam.dn.controller;

import com.godam.dn.dto.DnCreateRequest;
import com.godam.dn.dto.DnOptions;
import com.godam.dn.dto.DnViewResponse;
import com.godam.dn.service.DnService;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/dn")
@Validated
public class DnController {
  private final DnService dnService;

  public DnController(DnService dnService) {
    this.dnService = dnService;
  }

  @GetMapping("/{orderId}")
  @ResponseBody
  public DnViewResponse getDn(
      @PathVariable("orderId") Long orderId,
      DnOptions options) {
    return dnService.getDnView(orderId, options);
  }

  @PostMapping("/{orderId}")
  @ResponseBody
  public DnViewResponse saveDn(
      @PathVariable("orderId") Long orderId,
      @Valid @RequestBody DnCreateRequest request,
      @RequestParam(name = "userId", required = false) Long userId) {
    Long resolvedUserId = userId == null ? 0L : userId;
    dnService.saveDn(orderId, request, resolvedUserId);
    DnViewResponse view = dnService.getDnView(orderId, request.getOptions());
    applyRequestFields(view, request);
    return view;
  }

  @GetMapping("/{orderId}/print")
  public String printDn(
      @PathVariable("orderId") Long orderId,
      DnOptions options,
      Model model) {
    DnViewResponse view = dnService.getDnView(orderId, options);
    model.addAttribute("dn", view);
    model.addAttribute("options", view.getOptions());
    return "dn/dn-print";
  }

  private void applyRequestFields(DnViewResponse view, DnCreateRequest request) {
    if (request == null || view == null) {
      return;
    }
    view.setInvoice(request.getInvoice());
    view.setCustomerPo(request.getCustomerPo());
    view.setGappPo(request.getGappPo());
    view.setOutboundNumber(request.getOutboundNumber());
    view.setDate(request.getDate());
    view.setCustomerName(request.getCustomerName());
    view.setAddress(request.getAddress());
    view.setGoogleLocation(request.getGoogleLocation());
    view.setReceiver1Name(request.getReceiver1Name());
    view.setReceiver1Phone(request.getReceiver1Phone());
    view.setReceiver2Name(request.getReceiver2Name());
    view.setReceiver2Phone(request.getReceiver2Phone());
    view.setHuaweiContract(request.getHuaweiContract());
    view.setHuaweiReference(request.getHuaweiReference());
    view.setProjectName(request.getProjectName());
    view.setPaymentTerms(request.getPaymentTerms());
    view.setProductName(request.getProductName());
    view.setCarrier(request.getCarrier());
    view.setDriverName(request.getDriverName());
    view.setDriverMobile(request.getDriverMobile());
    view.setVehicleNumber(request.getVehicleNumber());
    view.setVehicleType(request.getVehicleType());
    view.setSalesName(request.getSalesName());
    view.setSalesPhone(request.getSalesPhone());
    view.setSalesEmail(request.getSalesEmail());
    view.setDispatchFromName(request.getDispatchFromName());
    view.setDispatchFromAddress(request.getDispatchFromAddress());
    view.setDispatchContactName(request.getDispatchContactName());
    view.setDispatchContactPhone(request.getDispatchContactPhone());
    view.setDispatchContactEmail(request.getDispatchContactEmail());
    view.setDnNumber(request.getDnNumber());
    if (request.getOptions() != null) {
      view.setOptions(request.getOptions());
    }
  }
}
