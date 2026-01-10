package com.godam.masters.controller;

import com.godam.masters.dto.CustomerImportResultDto;
import com.godam.masters.service.CustomerImportService;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/customers")
public class CustomerImportController {
  private final CustomerImportService customerImportService;

  public CustomerImportController(CustomerImportService customerImportService) {
    this.customerImportService = customerImportService;
  }

  @GetMapping("/template")
  public ResponseEntity<byte[]> downloadTemplate() throws IOException {
    byte[] template = customerImportService.createTemplate();
    return ResponseEntity.ok()
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"customer-upload-template.xlsx\"")
        .contentType(
            MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .body(template);
  }

  @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public CustomerImportResultDto importCustomers(@RequestParam("file") MultipartFile file)
      throws IOException {
    return customerImportService.importCustomers(file);
  }
}
