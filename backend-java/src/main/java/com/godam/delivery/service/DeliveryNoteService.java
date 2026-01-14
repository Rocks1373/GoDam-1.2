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
import com.godam.movements.MovementType;
import com.godam.movements.StockMovement;
import com.godam.movements.repository.StockMovementRepository;
import com.godam.movements.service.StockMovementService;
import com.godam.orders.OrderItem;
import com.godam.orders.OrderWorkflow;
import com.godam.orders.repository.OrderWorkflowRepository;
import com.godam.stock.dto.StockPickContext;
import com.godam.stock.service.StockService;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class DeliveryNoteService {
  private final DeliveryNoteRepository deliveryNoteRepository;
  private final CustomerRepository customerRepository;
  private final DriverRepository driverRepository;
  private final TransporterRepository transporterRepository;
  private final DeliveryNoteDocumentService documentService;
  private final OrderWorkflowRepository orderWorkflowRepository;
  private final StockService stockService;
  private final StockMovementService stockMovementService;
  private final StockMovementRepository stockMovementRepository;

  public DeliveryNoteService(
      DeliveryNoteRepository deliveryNoteRepository,
      CustomerRepository customerRepository,
      DriverRepository driverRepository,
      TransporterRepository transporterRepository,
      DeliveryNoteDocumentService documentService,
      OrderWorkflowRepository orderWorkflowRepository,
      StockService stockService,
      StockMovementService stockMovementService,
      StockMovementRepository stockMovementRepository) {
    this.deliveryNoteRepository = deliveryNoteRepository;
    this.customerRepository = customerRepository;
    this.driverRepository = driverRepository;
    this.transporterRepository = transporterRepository;
    this.documentService = documentService;
    this.orderWorkflowRepository = orderWorkflowRepository;
    this.stockService = stockService;
    this.stockMovementService = stockMovementService;
    this.stockMovementRepository = stockMovementRepository;
  }

  @Transactional
  public DeliveryNoteResponse createDeliveryNote(DeliveryNoteRequest request) {
    DeliveryNote note = new DeliveryNote();
    applyRequestToNote(note, request);
    DeliveryNote savedNote = deliveryNoteRepository.save(note);

    // Set dnCreated flag on the order
    if (request.getOrderId() != null) {
      OrderWorkflow order = orderWorkflowRepository.findById(request.getOrderId())
          .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + request.getOrderId()));
      order.setDnCreated(true);
      orderWorkflowRepository.save(order);
      applyDnMovements(order, request, savedNote.getDnNumber());
    }

    DeliveryNoteResponse response = toResponse(savedNote);
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
    note.setCustomerPo(request.getCustomerPo());
    note.setGappPo(request.getGappPo());
    note.setInvoiceNumber(request.getInvoiceNumber());
    note.setPreparedBy(request.getPreparedBy());
    note.setTruckType(request.getTruckType());
    note.setDnDate(request.getDnDate());
    note.setOutboundNumber(request.getOutboundNumber());
    note.setAddress(request.getAddress());
    note.setGoogleMapLink(request.getGoogleMapLink());
    note.setRequirements(request.getRequirements());
    if (request.getStatus() != null && !request.getStatus().isBlank()) {
      note.setStatus(request.getStatus());
    }

    // Load master entities and snapshot their data
    Customer customer = loadCustomer(request.getCustomerId());
    note.setCustomer(customer);
    snapshotCustomerData(note, customer);

    Driver driver = loadDriver(request.getDriverId());
    note.setDriver(driver);
    snapshotDriverData(note, driver);

    Transporter transporter = loadTransporter(request.getTransporterId());
    note.setTransporter(transporter);
    snapshotTransporterData(note, transporter);

    replaceQuantities(note, request);
  }

  private void snapshotCustomerData(DeliveryNote note, Customer customer) {
    if (customer != null) {
      note.setCustomerName(customer.getName());
      // Use receiver1 contact as primary phone
      note.setCustomerPhone(customer.getReceiver1Contact());
      // Address and google map link are already set from request, but can be overridden
      if (note.getAddress() == null || note.getAddress().isBlank()) {
        String address = customer.getLocationText();
        if (address == null || address.isBlank()) {
          address = customer.getCity();
        }
        note.setAddress(address);
      }
      if (note.getGoogleMapLink() == null || note.getGoogleMapLink().isBlank()) {
        note.setGoogleMapLink(customer.getGoogleLocation());
      }
    }
  }

  private void snapshotDriverData(DeliveryNote note, Driver driver) {
    if (driver != null) {
      note.setDriverName(driver.getDriverName());
      note.setDriverPhone(driver.getDriverNumber());
      // TruckType is already set from request, but can fallback to driver's truck
      if (note.getTruckType() == null || note.getTruckType().isBlank()) {
        note.setTruckType(driver.getTruckNo());
      }
    }
  }

  private void snapshotTransporterData(DeliveryNote note, Transporter transporter) {
    if (transporter != null) {
      note.setTransporterName(transporter.getCompanyName());
      note.setTransporterPhone(transporter.getPhone());
    }
  }

  private void applyDnMovements(OrderWorkflow order, DeliveryNoteRequest request, String dnNumber) {
    if (order == null || order.getItems() == null) {
      return;
    }
    List<OrderItem> items = order.getItems();
    String outbound = order.getOutboundNumber();
    for (OrderItem item : items) {
      int qty = item.getQty() == null ? 0 : item.getQty();
      if (qty <= 0) {
        continue;
      }
      int alreadyLogged = 0;
      if (outbound != null && item.getPartNumber() != null) {
        alreadyLogged = stockMovementRepository.sumQtyBySalesOrderAndPartNumberAndType(
            outbound,
            item.getPartNumber(),
            MovementType.O105_CONFIRMED);
      }
      int remaining = qty - Math.max(0, alreadyLogged);
      if (remaining <= 0) {
        continue;
      }
      StockPickContext context = stockService.preparePickContext(
          item.getPartNumber(),
          remaining,
          item.getPickedRack());
      stockService.applyConfirmedDeduction(item.getPartNumber(), remaining, item.getPickedRack());
      StockMovement movement = stockMovementService.logMovement(
          MovementType.O105_CONFIRMED,
          context.getWarehouseNo(),
          context.getStorageLocation(),
          context.getResolvedPartNumber(),
          -remaining,
          order.getOutboundNumber(),
          request.getInvoiceNumber(),
          null,
          context.getRack(),
          context.getBin(),
          context.getSuggestedRack(),
          context.getActualRack(),
          remaining,
          remaining,
          context.getReference(),
          context.getRemark());
      movement.setDnNumber(dnNumber);
      stockMovementRepository.save(movement);
    }
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
    response.setCustomerPo(note.getCustomerPo());
    response.setGappPo(note.getGappPo());
    response.setInvoiceNumber(note.getInvoiceNumber());
    response.setPreparedBy(note.getPreparedBy());
    response.setTruckType(note.getTruckType());
    response.setDnDate(note.getDnDate());
    response.setOutboundNumber(note.getOutboundNumber());
    response.setAddress(note.getAddress());
    response.setGoogleMapLink(note.getGoogleMapLink());
    response.setRequirements(note.getRequirements());
    response.setStatus(note.getStatus());
    response.setCreatedAt(note.getCreatedAt());
    response.setUpdatedAt(note.getUpdatedAt());

    // Set snapshot fields - these are the persisted values from DN creation time
    response.setCustomerName(note.getCustomerName());
    response.setCustomerPhone(note.getCustomerPhone());
    response.setTransporterName(note.getTransporterName());
    response.setTransporterPhone(note.getTransporterPhone());
    response.setDriverName(note.getDriverName());
    response.setDriverPhone(note.getDriverPhone());

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
