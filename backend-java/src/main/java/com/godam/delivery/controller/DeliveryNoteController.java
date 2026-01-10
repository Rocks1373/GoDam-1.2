package com.godam.delivery.controller;

import com.godam.delivery.dto.DeliveryNoteEmailRequest;
import com.godam.delivery.dto.DeliveryNoteRequest;
import com.godam.delivery.dto.DeliveryNoteResponse;
import com.godam.delivery.service.DeliveryNoteDocumentService;
import com.godam.delivery.service.DeliveryNoteEmailService;
import com.godam.delivery.service.DeliveryNoteService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/delivery-note")
public class DeliveryNoteController {
  private final DeliveryNoteService deliveryNoteService;
  private final DeliveryNoteDocumentService documentService;
  private final DeliveryNoteEmailService emailService;

  public DeliveryNoteController(
      DeliveryNoteService deliveryNoteService,
      DeliveryNoteDocumentService documentService,
      DeliveryNoteEmailService emailService) {
    this.deliveryNoteService = deliveryNoteService;
    this.documentService = documentService;
    this.emailService = emailService;
  }

  @GetMapping("/{id}")
  public DeliveryNoteResponse get(@PathVariable("id") Long id) {
    return deliveryNoteService.getDeliveryNoteById(id);
  }

  @PostMapping
  public DeliveryNoteResponse create(@Valid @RequestBody DeliveryNoteRequest request) {
    return deliveryNoteService.createDeliveryNote(request);
  }

  @PutMapping("/{id}")
  public DeliveryNoteResponse update(
      @PathVariable("id") Long id,
      @Valid @RequestBody DeliveryNoteRequest request) {
    return deliveryNoteService.updateDeliveryNote(id, request);
  }

  @GetMapping("/{id}/pdf")
  public ResponseEntity<byte[]> downloadPdf(@PathVariable("id") Long id) {
    DeliveryNoteResponse response = deliveryNoteService.getDeliveryNoteById(id);
    byte[] pdf = documentService.getCachedOrGenerate(response);
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_PDF);
    headers.setContentDisposition(
        ContentDisposition.inline()
            .filename(
                "DeliveryNote-"
                    + (response.getDnNumber() != null ? response.getDnNumber() : id)
                    + ".pdf")
            .build());
    return ResponseEntity.ok().headers(headers).body(pdf);
  }

  @PostMapping("/{id}/email")
  public void email(
      @PathVariable("id") Long id,
      @Valid @RequestBody DeliveryNoteEmailRequest request) {
    emailService.sendDeliveryNote(id, request);
  }
}
