package com.godam.masters.service;

import com.godam.masters.Driver;
import com.godam.masters.Transporter;
import com.godam.masters.dto.DriverCreateRequest;
import com.godam.masters.dto.DriverDto;
import com.godam.masters.dto.TransporterCreateRequest;
import com.godam.masters.dto.TransporterDto;
import com.godam.masters.repository.DriverRepository;
import com.godam.masters.repository.TransporterRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MastersService {
  private final DriverRepository driverRepository;
  private final TransporterRepository transporterRepository;

  public MastersService(DriverRepository driverRepository, TransporterRepository transporterRepository) {
    this.driverRepository = driverRepository;
    this.transporterRepository = transporterRepository;
  }

  @Transactional(readOnly = true)
  public List<DriverDto> searchDrivers(String query) {
    List<Driver> drivers = isBlank(query)
        ? driverRepository.findByIsActiveTrue()
        : driverRepository.searchActive(query.trim());
    List<DriverDto> results = new ArrayList<>();
    for (Driver driver : drivers) {
      results.add(toDto(driver));
    }
    return results;
  }

  @Transactional
  public DriverDto createDriver(DriverCreateRequest request, Long userId) {
    String name = normalize(request.getDriverName());
    String number = normalize(request.getDriverNumber());
    String idNumber = normalize(request.getIdNumber());
    String truckNo = normalize(request.getTruckNo());

    Optional<Driver> existing = driverRepository
        .findFirstByDriverNameIgnoreCaseAndDriverNumberIgnoreCaseAndIsActiveTrue(name, number);
    if (existing.isPresent()) {
      return toDto(existing.get());
    }

    if (!request.isSaveForFuture()) {
      DriverDto dto = new DriverDto();
      dto.setDriverName(name);
      dto.setDriverNumber(number);
      dto.setIdNumber(idNumber);
      dto.setTruckNo(truckNo);
      dto.setActive(false);
      return dto;
    }

    Driver driver = new Driver();
    driver.setDriverName(name);
    driver.setDriverNumber(number);
    driver.setIdNumber(idNumber);
    driver.setTruckNo(truckNo);
    driver.setActive(true);
    driver.setCreatedAt(Instant.now());
    if (userId != null && userId > 0) {
      driver.setUserId(userId);
    }
    return toDto(driverRepository.save(driver));
  }

  @Transactional(readOnly = true)
  public List<TransporterDto> searchTransporters(String query) {
    List<Transporter> transporters = isBlank(query)
        ? transporterRepository.findByIsActiveTrue()
        : transporterRepository.searchActive(query.trim());
    List<TransporterDto> results = new ArrayList<>();
    for (Transporter transporter : transporters) {
      results.add(toDto(transporter));
    }
    return results;
  }

  @Transactional
  public TransporterDto createTransporter(TransporterCreateRequest request, Long userId) {
    String company = normalize(request.getCompanyName());
    String contact = normalize(request.getContactName());
    String email = normalize(request.getEmail());

    Optional<Transporter> existing = transporterRepository.findFirstByCompanyNameIgnoreCaseAndIsActiveTrue(company);
    if (existing.isPresent()) {
      return toDto(existing.get());
    }

    if (!request.isSaveForFuture()) {
      TransporterDto dto = new TransporterDto();
      dto.setCompanyName(company);
      dto.setContactName(contact);
      dto.setEmail(email);
      dto.setActive(false);
      return dto;
    }

    Transporter transporter = new Transporter();
    transporter.setCompanyName(company);
    transporter.setContactName(contact);
    transporter.setEmail(email);
    transporter.setActive(true);
    transporter.setCreatedAt(Instant.now());
    return toDto(transporterRepository.save(transporter));
  }

  private DriverDto toDto(Driver driver) {
    DriverDto dto = new DriverDto();
    dto.setId(driver.getId());
    dto.setDriverName(driver.getDriverName());
    dto.setDriverNumber(driver.getDriverNumber());
    dto.setIdNumber(driver.getIdNumber());
    dto.setTruckNo(driver.getTruckNo());
    dto.setActive(driver.isActive());
    return dto;
  }

  private TransporterDto toDto(Transporter transporter) {
    TransporterDto dto = new TransporterDto();
    dto.setId(transporter.getId());
    dto.setCompanyName(transporter.getCompanyName());
    dto.setContactName(transporter.getContactName());
    dto.setEmail(transporter.getEmail());
    dto.setActive(transporter.isActive());
    return dto;
  }

  private boolean isBlank(String value) {
    return value == null || value.trim().isEmpty();
  }

  private String normalize(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }
}
