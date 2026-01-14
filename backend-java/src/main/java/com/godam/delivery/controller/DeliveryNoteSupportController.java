package com.godam.delivery.controller;

import com.godam.common.exception.BusinessRuleException;
import com.godam.delivery.dto.CustomerCreateRequest;
import com.godam.delivery.dto.CustomerLookupDto;
import com.godam.delivery.dto.DriverCreateRequest;
import com.godam.delivery.dto.DriverDto;
import com.godam.delivery.dto.OutboundInfoDto;
import com.godam.delivery.dto.TransporterCreateRequest;
import com.godam.delivery.dto.TransporterDto;
import com.godam.masters.Customer;
import com.godam.masters.Driver;
import com.godam.masters.Transporter;
import com.godam.masters.repository.CustomerRepository;
import com.godam.masters.repository.DriverRepository;
import com.godam.masters.repository.TransporterRepository;
import com.godam.orders.OrderWorkflow;
import com.godam.orders.repository.OrderWorkflowRepository;
import jakarta.validation.Valid;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DeliveryNoteSupportController {
  private final CustomerRepository customerRepository;
  private final DriverRepository driverRepository;
  private final TransporterRepository transporterRepository;
  private final OrderWorkflowRepository orderWorkflowRepository;

  public DeliveryNoteSupportController(
      CustomerRepository customerRepository,
      DriverRepository driverRepository,
      TransporterRepository transporterRepository,
      OrderWorkflowRepository orderWorkflowRepository) {
    this.customerRepository = customerRepository;
    this.driverRepository = driverRepository;
    this.transporterRepository = transporterRepository;
    this.orderWorkflowRepository = orderWorkflowRepository;
  }

  @GetMapping("/outbound/{orderId}")
  public OutboundInfoDto outbound(@PathVariable("orderId") Long orderId) {
    // Get order with transport data
    OrderWorkflow order = orderWorkflowRepository.findDetailedById(orderId)
        .orElseThrow(() -> new com.godam.common.exception.ResourceNotFoundException("Order not found: " + orderId));
    
    OutboundInfoDto info = new OutboundInfoDto();
    info.setOrderId(order.getId());
    info.setOutboundNumber(order.getOutboundNumber());
    info.setCustomerName(order.getCustomerName());
    info.setCustomerId(order.getCustomerId());
    info.setGappPo(order.getGappPo());
    info.setCustomerPo(order.getCustomerPo());
    
    // Get item part numbers
    List<String> itemNumbers = order.getItems() != null
        ? order.getItems().stream()
            .map(item -> item.getPartNumber() != null ? item.getPartNumber() : "")
            .filter(part -> !part.isEmpty())
            .collect(Collectors.toList())
        : new ArrayList<>();
    info.setItemNumbers(itemNumbers);
    
    // Get transporter_id and driver_id from order transport
    if (order.getTransport() != null) {
      info.setTransporterId(order.getTransport().getTransporterId());
      info.setDriverId(order.getTransport().getDriverId());
    }
    
    return info;
  }

  @GetMapping("/customer/{id}")
  public CustomerLookupDto getCustomerById(@PathVariable("id") Long id) {
    Customer customer = customerRepository
        .findById(id)
        .orElseThrow(
            () ->
                new com.godam.common.exception.ResourceNotFoundException(
                    "Customer not found: " + id));
    return toCustomerLookup(customer);
  }

  @GetMapping("/customer/by-sap-id/{sapCustomerId}")
  public CustomerLookupDto getCustomerBySapId(@PathVariable("sapCustomerId") String sapCustomerId) {
    Customer customer = customerRepository
        .findBySapCustomerIdIgnoreCase(sapCustomerId)
        .orElseThrow(
            () ->
                new com.godam.common.exception.ResourceNotFoundException(
                    "Customer not found with SAP ID: " + sapCustomerId));
    return toCustomerLookup(customer);
  }

  @GetMapping("/customer/lookup-sap-id/{sapCustomerId}")
  public CustomerLookupResult lookupCustomersBySapId(@PathVariable("sapCustomerId") String sapCustomerId) {
    List<Customer> customers = customerRepository.findAllBySapCustomerIdIgnoreCase(sapCustomerId);
    CustomerLookupResult result = new CustomerLookupResult();
    result.setExists(!customers.isEmpty());
    result.setSapCustomerId(sapCustomerId);
    result.setCustomers(customers.stream().map(this::toCustomerLookup).collect(Collectors.toList()));
    if (!customers.isEmpty()) {
      // Return the first customer's name for pre-fill
      result.setCustomerName(customers.get(0).getName());
    }
    return result;
  }

  @PostMapping("/customer/add-location")
  @Transactional
  public CustomerLookupDto createCustomerWithDuplicateSapId(@Valid @RequestBody CustomerCreateRequest request) {
    // This endpoint allows creating customers with duplicate SAP Customer IDs
    // for cases where same customer has multiple delivery locations
    Customer customer = new Customer();
    customer.setName(request.getName());
    customer.setSapCustomerId(request.getSapCustomerId());
    customer.setCity(request.getCity());
    customer.setLocationText(request.getLocationText());
    customer.setGoogleLocation(request.getGoogleLocation());
    customer.setReceiver1Name(request.getReceiver1Name());
    customer.setReceiver1Contact(request.getReceiver1Contact());
    customer.setReceiver1Email(request.getReceiver1Email());
    customer.setRequirements(request.getRequirements());
    customer.setNotes(request.getNotes());
    customer.setActive(true);
    customer.setCreatedAt(Instant.now());
    Customer saved = customerRepository.save(customer);
    return toCustomerLookup(saved);
  }

  public static class CustomerLookupResult {
    private boolean exists;
    private String sapCustomerId;
    private String customerName;
    private List<CustomerLookupDto> customers;

    public boolean isExists() {
      return exists;
    }

    public void setExists(boolean exists) {
      this.exists = exists;
    }

    public String getSapCustomerId() {
      return sapCustomerId;
    }

    public void setSapCustomerId(String sapCustomerId) {
      this.sapCustomerId = sapCustomerId;
    }

    public String getCustomerName() {
      return customerName;
    }

    public void setCustomerName(String customerName) {
      this.customerName = customerName;
    }

    public List<CustomerLookupDto> getCustomers() {
      return customers;
    }

    public void setCustomers(List<CustomerLookupDto> customers) {
      this.customers = customers;
    }
  }

  @GetMapping("/customer/search")
  public List<CustomerLookupDto> searchCustomers(@RequestParam(name = "q", required = false) String query) {
    List<Customer> customers = (query == null || query.isBlank())
        ? customerRepository.findAllByActiveTrueOrderByNameAsc()
        : customerRepository.searchActive(query);
    return customers.stream()
        .map(this::toCustomerLookup)
        .collect(Collectors.toList());
  }

  @PostMapping("/customer")
  @Transactional
  public CustomerLookupDto createCustomer(@Valid @RequestBody CustomerCreateRequest request) {
    assertUniqueSapCustomerId(request.getSapCustomerId(), null);
    Customer customer = new Customer();
    customer.setName(request.getName());
    customer.setSapCustomerId(request.getSapCustomerId());
    customer.setCity(request.getCity());
    customer.setLocationText(request.getLocationText());
    customer.setGoogleLocation(request.getGoogleLocation());
    customer.setReceiver1Name(request.getReceiver1Name());
    customer.setReceiver1Contact(request.getReceiver1Contact());
    customer.setReceiver1Email(request.getReceiver1Email());
    customer.setRequirements(request.getRequirements());
    customer.setNotes(request.getNotes());
    customer.setActive(true);
    customer.setCreatedAt(Instant.now());
    Customer saved = customerRepository.save(customer);
    return toCustomerLookup(saved);
  }

  @PutMapping("/customer/{id}")
  @Transactional
  public CustomerLookupDto updateCustomer(
      @PathVariable("id") Long id, @Valid @RequestBody CustomerCreateRequest request) {
    Customer customer =
        customerRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new com.godam.common.exception.ResourceNotFoundException(
                        "Customer not found: " + id));
    assertUniqueSapCustomerId(request.getSapCustomerId(), customer.getId());
    customer.setName(request.getName());
    customer.setSapCustomerId(request.getSapCustomerId());
    customer.setCity(request.getCity());
    customer.setLocationText(request.getLocationText());
    customer.setGoogleLocation(request.getGoogleLocation());
    customer.setReceiver1Name(request.getReceiver1Name());
    customer.setReceiver1Contact(request.getReceiver1Contact());
    customer.setReceiver1Email(request.getReceiver1Email());
    customer.setRequirements(request.getRequirements());
    customer.setNotes(request.getNotes());
    customer.setActive(true);
    customer.setUpdatedAt(Instant.now());
    Customer saved = customerRepository.save(customer);
    return toCustomerLookup(saved);
  }

  @DeleteMapping("/customer/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Transactional
  public void deleteCustomer(@PathVariable("id") Long id) {
    Customer customer =
        customerRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new com.godam.common.exception.ResourceNotFoundException(
                        "Customer not found: " + id));
    customer.setActive(false);
    customer.setUpdatedAt(Instant.now());
    customerRepository.save(customer);
  }

  @GetMapping("/driver")
  public List<DriverDto> searchDrivers(@RequestParam(name = "q", required = false) String query) {
    List<Driver> drivers = (query == null || query.isBlank())
        ? driverRepository.findByIsActiveTrue()
        : driverRepository.searchActive(query);
    return drivers.stream().map(this::toDriverDto).collect(Collectors.toList());
  }

  @PostMapping("/driver")
  @Transactional
  public DriverDto createDriver(@Valid @RequestBody DriverCreateRequest request) {
    Driver driver = new Driver();
    driver.setDriverName(request.getDriverName());
    driver.setDriverNumber(request.getDriverNumber());
    driver.setIdNumber(request.getIdNumber());
    driver.setTruckNo(request.getTruckNo());
    driver.setActive(true);
    driver.setCreatedAt(Instant.now());
    Driver saved = driverRepository.save(driver);
    return toDriverDto(saved);
  }

  @GetMapping("/transporter")
  public List<TransporterDto> searchTransporters(@RequestParam(name = "q", required = false) String query) {
    List<Transporter> transporters = (query == null || query.isBlank())
        ? transporterRepository.findByIsActiveTrue()
        : transporterRepository.searchActive(query);
    return transporters.stream().map(this::toTransporterDto).collect(Collectors.toList());
  }

  @PostMapping("/transporter")
  @Transactional
  public TransporterDto createTransporter(@Valid @RequestBody TransporterCreateRequest request) {
    Transporter transporter = new Transporter();
    transporter.setCompanyName(request.getCompanyName());
    transporter.setContactName(request.getContactName());
    transporter.setEmail(request.getEmail());
    transporter.setActive(true);
    transporter.setCreatedAt(Instant.now());
    Transporter saved = transporterRepository.save(transporter);
    return toTransporterDto(saved);
  }

  private CustomerLookupDto toCustomerLookup(Customer customer) {
    CustomerLookupDto dto = new CustomerLookupDto();
    dto.setId(customer.getId());
    dto.setName(customer.getName());
    dto.setSapCustomerId(customer.getSapCustomerId());
    dto.setCity(customer.getCity());
    dto.setLocationText(customer.getLocationText());
    dto.setGoogleLocation(customer.getGoogleLocation());
    dto.setReceiver1Contact(customer.getReceiver1Contact());
    dto.setReceiver2Contact(customer.getReceiver2Contact());
    dto.setRequirements(customer.getRequirements());
    dto.setReceiver1Name(customer.getReceiver1Name());
    dto.setReceiver1Email(customer.getReceiver1Email());
    dto.setReceiver1Designation(customer.getReceiver1Designation());
    dto.setReceiver2Name(customer.getReceiver2Name());
    dto.setReceiver2Email(customer.getReceiver2Email());
    dto.setReceiver2Designation(customer.getReceiver2Designation());
    dto.setNotes(customer.getNotes());
    dto.setActive(customer.isActive());
    return dto;
  }

  private DriverDto toDriverDto(Driver driver) {
    DriverDto dto = new DriverDto();
    dto.setId(driver.getId());
    dto.setDriverName(driver.getDriverName());
    dto.setDriverNumber(driver.getDriverNumber());
    dto.setIdNumber(driver.getIdNumber());
    dto.setTruckNo(driver.getTruckNo());
    dto.setIqamaImage(driver.getIqamaImage());
    dto.setIstimaraImage(driver.getIstimaraImage());
    dto.setInsuranceImage(driver.getInsuranceImage());
    return dto;
  }

  private TransporterDto toTransporterDto(Transporter transporter) {
    TransporterDto dto = new TransporterDto();
    dto.setId(transporter.getId());
    dto.setCompanyName(transporter.getCompanyName());
    dto.setContactName(transporter.getContactName());
    dto.setEmail(transporter.getEmail());
    return dto;
  }

  private void assertUniqueSapCustomerId(String sapCustomerId, Long currentCustomerId) {
    if (sapCustomerId == null || sapCustomerId.isBlank()) {
      return;
    }
    customerRepository
        .findBySapCustomerIdIgnoreCase(sapCustomerId.trim())
        .filter(existing -> currentCustomerId == null || !existing.getId().equals(currentCustomerId))
        .ifPresent(
            existing -> {
              throw new BusinessRuleException("SAP Customer ID already exists.");
            });
  }
}
