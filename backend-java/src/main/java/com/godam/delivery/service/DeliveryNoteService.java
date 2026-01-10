package com.godam.delivery.service;

import com.godam.common.exception.ResourceNotFoundException;
import com.godam.delivery.DeliveryNote;
import com.godam.delivery.DeliveryNoteQty;
import com.godam.delivery.dto.DeliveryNoteQtyRequest;
import com.godam.delivery.dto.DeliveryNoteQtyResponse;
import com.godam.delivery.dto.DeliveryNoteRequest;
import com.godam.delivery.dto.DeliveryNoteResponse;
import com.godam.delivery.repository.DeliveryNoteRepository;
import com.godam.masters.Customer;
import com.godam.masters.Driver;
import com.godam.masters.Transporter;
import com.godam.masters.repository.CustomerRepository;
import com.godam.masters.repository.DriverRepository;
import com.godam.masters.repository.TransporterRepository;
import com.godam.delivery.service.DeliveryNoteDocumentService;
import jakarta.transaction.Transactional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class DeliveryNoteService {
  private final DeliveryNoteRepository deliveryNoteRepository;
  private final CustomerRepository customerRepository;
  private final DriverRepository driverRepository;
  private final TransporterRepository transporterRepository;
  private final DeliveryNoteDocumentService documentService;

  public DeliveryNoteService(
      DeliveryNoteRepository deliveryNoteRepository,
      CustomerRepository customerRepository,
      DriverRepository driverRepository,
      TransporterRepository transporterRepository,
      DeliveryNoteDocumentService documentService) {
    this.deliveryNoteRepository = deliveryNoteRepository;
    this.customerRepository = customerRepository;
    this.driverRepository = driverRepository;
    this.transporterRepository = transporterRepository;
    this.documentService = documentService;
  }

  @Transactional
  public DeliveryNoteResponse createDeliveryNote(DeliveryNoteRequest request) {
    DeliveryNote note = new DeliveryNote();
    applyRequestToNote(note, request);
    DeliveryNoteResponse response = toResponse(deliveryNoteRepository.save(note));
    documentService.generatePdf(response);
    return response;
  }

  @Transactional
  public DeliveryNoteResponse updateDeliveryNote(Long id, DeliveryNoteRequest request) {
    DeliveryNote note = deliveryNoteRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Delivery note not found: " + id));
    applyRequestToNote(note, request);
    DeliveryNoteResponse response = toResponse(deliveryNoteRepository.save(note));
    documentService.generatePdf(response);
    return response;
  }

  @Transactional
  public DeliveryNoteResponse getDeliveryNoteById(Long id) {
    DeliveryNote note = deliveryNoteRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Delivery note not found: " + id));
    return toResponse(note);
  }

  private void applyRequestToNote(DeliveryNote note, DeliveryNoteRequest request) {
    note.setDnNumber(request.getDnNumber());
    note.setOutboundNumber(request.getOutboundNumber());
    note.setAddress(request.getAddress());
    note.setGoogleMapLink(request.getGoogleMapLink());
    note.setRequirements(request.getRequirements());
    if (request.getStatus() != null && !request.getStatus().isBlank()) {
      note.setStatus(request.getStatus());
    }
    note.setCustomer(loadCustomer(request.getCustomerId()));
    note.setDriver(loadDriver(request.getDriverId()));
    note.setTransporter(loadTransporter(request.getTransporterId()));
    replaceQuantities(note, request);
  }

  private void replaceQuantities(DeliveryNote note, DeliveryNoteRequest request) {
    note.getQuantities().clear();
    if (request.getQuantities() == null) {
      return;
    }
    for (DeliveryNoteQtyRequest item : request.getQuantities()) {
      DeliveryNoteQty qty = new DeliveryNoteQty();
      qty.setDescription(item.getDescription());
      qty.setQuantity(item.getQuantity());
      note.addQuantity(qty);
    }
  }

  private Customer loadCustomer(Long customerId) {
    return customerRepository.findById(customerId)
        .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
  }

  private Driver loadDriver(Long driverId) {
    return driverRepository.findById(driverId)
        .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + driverId));
  }

  private Transporter loadTransporter(Long transporterId) {
    return transporterRepository.findById(transporterId)
        .orElseThrow(() -> new ResourceNotFoundException("Transporter not found: " + transporterId));
  }

  private DeliveryNoteResponse toResponse(DeliveryNote note) {
    DeliveryNoteResponse response = new DeliveryNoteResponse();
    response.setId(note.getId());
    response.setDnNumber(note.getDnNumber());
    response.setOutboundNumber(note.getOutboundNumber());
    response.setAddress(note.getAddress());
    response.setGoogleMapLink(note.getGoogleMapLink());
    response.setRequirements(note.getRequirements());
    response.setStatus(note.getStatus());
    response.setCreatedAt(note.getCreatedAt());
    response.setUpdatedAt(note.getUpdatedAt());

    DeliveryNoteResponse.CustomerSummary customer = new DeliveryNoteResponse.CustomerSummary();
    Customer entityCustomer = note.getCustomer();
    if (entityCustomer != null) {
      customer.setId(entityCustomer.getId());
      customer.setName(entityCustomer.getName());
      customer.setCity(entityCustomer.getCity());
      customer.setLocationText(entityCustomer.getLocationText());
      customer.setGoogleLocation(entityCustomer.getGoogleLocation());
    }
    response.setCustomer(customer);

    DeliveryNoteResponse.TransporterSummary transporter = new DeliveryNoteResponse.TransporterSummary();
    Transporter entityTransporter = note.getTransporter();
    if (entityTransporter != null) {
      transporter.setId(entityTransporter.getId());
      transporter.setCompanyName(entityTransporter.getCompanyName());
      transporter.setContactName(entityTransporter.getContactName());
      transporter.setEmail(entityTransporter.getEmail());
    }
    response.setTransporter(transporter);

    DeliveryNoteResponse.DriverSummary driver = new DeliveryNoteResponse.DriverSummary();
    Driver entityDriver = note.getDriver();
    if (entityDriver != null) {
      driver.setId(entityDriver.getId());
      driver.setDriverName(entityDriver.getDriverName());
      driver.setDriverNumber(entityDriver.getDriverNumber());
      driver.setTruckNo(entityDriver.getTruckNo());
      driver.setIdNumber(entityDriver.getIdNumber());
    }
    response.setDriver(driver);

    response.setQuantities(
        note.getQuantities().stream()
            .map(this::toQtyResponse)
            .collect(Collectors.toList()));
    return response;
  }

  private DeliveryNoteQtyResponse toQtyResponse(DeliveryNoteQty qty) {
    DeliveryNoteQtyResponse response = new DeliveryNoteQtyResponse();
    response.setDescription(qty.getDescription());
    response.setQuantity(qty.getQuantity());
    return response;
  }
}
