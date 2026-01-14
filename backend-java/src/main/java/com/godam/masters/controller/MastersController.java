package com.godam.masters.controller;

import com.godam.masters.dto.AdminDeleteRequest;
import com.godam.masters.dto.DriverCreateRequest;
import com.godam.masters.dto.DriverDto;
import com.godam.masters.dto.DriverExportRequest;
import com.godam.masters.dto.TransporterCreateRequest;
import com.godam.masters.dto.TransporterDto;
import com.godam.masters.service.MastersService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping({"/masters", "/api/masters"})
@Validated
public class MastersController {
  private final MastersService mastersService;

  public MastersController(MastersService mastersService) {
    this.mastersService = mastersService;
  }

  @GetMapping("/drivers")
  public List<DriverDto> listDrivers(@RequestParam(name = "q", required = false) String query) {
    return mastersService.searchDrivers(query);
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

  @PutMapping("/drivers/{id}")
  public DriverDto updateDriver(@PathVariable("id") Long id, @Valid @RequestBody DriverCreateRequest request) {
    return mastersService.updateDriver(id, request);
  }

  @DeleteMapping("/drivers/{id}")
  public void deleteDriver(@PathVariable("id") Long id, @RequestBody AdminDeleteRequest request) {
    mastersService.deleteDriver(id, request);
  }

  @PostMapping(value = "/drivers/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public DriverDto uploadDriverDocuments(
      @PathVariable("id") Long id,
      @RequestParam(name = "iqama", required = false) MultipartFile iqama,
      @RequestParam(name = "license", required = false) MultipartFile license,
      @RequestParam(name = "istimara", required = false) MultipartFile istimara,
      @RequestParam(name = "insurance", required = false) MultipartFile insurance,
      @RequestParam(name = "truckFront", required = false) MultipartFile truckFront,
      @RequestParam(name = "truckBack", required = false) MultipartFile truckBack) throws IOException {
    return mastersService.uploadDriverDocuments(id, iqama, license, istimara, insurance, truckFront, truckBack);
  }

  @PostMapping("/drivers/export")
  public ResponseEntity<byte[]> exportDrivers(@RequestBody DriverExportRequest request) throws IOException {
    byte[] zip = mastersService.exportDrivers(request);
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
    headers.setContentDispositionFormData("attachment", "drivers-export.zip");
    return ResponseEntity.ok().headers(headers).body(zip);
  }

  @GetMapping("/transporters")
  public List<TransporterDto> listTransporters(@RequestParam(name = "q", required = false) String query) {
    return mastersService.searchTransporters(query);
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

  @PutMapping("/transporters/{id}")
  public TransporterDto updateTransporter(
      @PathVariable("id") Long id, @Valid @RequestBody TransporterCreateRequest request) {
    return mastersService.updateTransporter(id, request);
  }

  @DeleteMapping("/transporters/{id}")
  public void deleteTransporter(@PathVariable("id") Long id, @RequestBody AdminDeleteRequest request) {
    mastersService.deleteTransporter(id, request);
  }
}
