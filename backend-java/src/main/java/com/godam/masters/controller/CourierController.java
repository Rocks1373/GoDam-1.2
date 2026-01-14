package com.godam.masters.controller;

import com.godam.common.exception.BusinessRuleException;
import com.godam.masters.Courier;
import com.godam.masters.dto.CourierDto;
import com.godam.masters.dto.CourierRequest;
import com.godam.masters.repository.CourierRepository;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/couriers")
public class CourierController {
  private final CourierRepository courierRepository;

  public CourierController(CourierRepository courierRepository) {
    this.courierRepository = courierRepository;
  }

  @GetMapping
  public List<CourierDto> list(@RequestParam(name = "q", required = false) String query) {
    List<Courier> rows = query == null || query.isBlank()
        ? courierRepository.findAll()
        : courierRepository.search(query.trim());
    List<CourierDto> result = new ArrayList<>();
    for (Courier courier : rows) {
      result.add(toDto(courier));
    }
    return result;
  }

  @PostMapping
  public CourierDto create(@Valid @RequestBody CourierRequest request) {
    Courier courier = new Courier();
    apply(request, courier);
    courier.setCreatedAt(Instant.now());
    return toDto(courierRepository.save(courier));
  }

  @PutMapping("/{id}")
  public CourierDto update(@PathVariable("id") Long id, @Valid @RequestBody CourierRequest request) {
    Courier courier = courierRepository.findById(id)
        .orElseThrow(() -> new BusinessRuleException("Courier not found."));
    apply(request, courier);
    return toDto(courierRepository.save(courier));
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable("id") Long id) {
    Courier courier = courierRepository.findById(id)
        .orElseThrow(() -> new BusinessRuleException("Courier not found."));
    courierRepository.delete(courier);
  }

  private void apply(CourierRequest request, Courier courier) {
    courier.setName(normalize(request.getName()));
    courier.setPhone(normalize(request.getPhone()));
    courier.setEmail(normalize(request.getEmail()));
    courier.setVatNo(normalize(request.getVatNo()));
    courier.setCrNo(normalize(request.getCrNo()));
    courier.setActive(request.isActive());
  }

  private CourierDto toDto(Courier courier) {
    CourierDto dto = new CourierDto();
    dto.setId(courier.getId());
    dto.setName(courier.getName());
    dto.setPhone(courier.getPhone());
    dto.setEmail(courier.getEmail());
    dto.setVatNo(courier.getVatNo());
    dto.setCrNo(courier.getCrNo());
    dto.setActive(courier.isActive());
    return dto;
  }

  private String normalize(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }
}
