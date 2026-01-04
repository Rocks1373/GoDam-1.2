package com.godam.masters.controller;

import com.godam.masters.dto.DriverCreateRequest;
import com.godam.masters.dto.DriverDto;
import com.godam.masters.dto.TransporterCreateRequest;
import com.godam.masters.dto.TransporterDto;
import com.godam.masters.service.MastersService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/masters")
@Validated
public class MastersController {
  private final MastersService mastersService;

  public MastersController(MastersService mastersService) {
    this.mastersService = mastersService;
  }

  @GetMapping("/drivers/search")
  public List<DriverDto> searchDrivers(@RequestParam(name = "q", required = false) String query) {
    return mastersService.searchDrivers(query);
  }

  @PostMapping("/drivers")
  public DriverDto createDriver(
      @Valid @RequestBody DriverCreateRequest request,
      @RequestParam(name = "userId", required = false) Long userId) {
    return mastersService.createDriver(request, userId);
  }

  @GetMapping("/transporters/search")
  public List<TransporterDto> searchTransporters(@RequestParam(name = "q", required = false) String query) {
    return mastersService.searchTransporters(query);
  }

  @PostMapping("/transporters")
  public TransporterDto createTransporter(
      @Valid @RequestBody TransporterCreateRequest request,
      @RequestParam(name = "userId", required = false) Long userId) {
    return mastersService.createTransporter(request, userId);
  }
}
