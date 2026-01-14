package com.godam.movements.service;

import com.godam.common.User;
import com.godam.common.UserRepository;
import com.godam.common.exception.BusinessRuleException;
import com.godam.movements.MovementType;
import com.godam.movements.StockMovement;
import com.godam.movements.dto.MovementDeleteRequest;
import com.godam.movements.dto.MovementViewDto;
import com.godam.movements.repository.StockMovementRepository;
import com.godam.orders.OrderAdminAction;
import com.godam.orders.OrderAdminAudit;
import com.godam.orders.repository.OrderAdminAuditRepository;
import com.godam.stock.Stock;
import com.godam.stock.repository.StockRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MovementAdminService {
  private static final EnumSet<MovementType> SENSITIVE_TYPES = EnumSet.of(
      MovementType.I201_INBOUND_RECEIVED,
      MovementType.I202_PUTAWAY,
      MovementType.O105_CONFIRMED,
      MovementType.O108_DELIVERED,
      MovementType.O109_CLOSED);

  private final StockMovementRepository stockMovementRepository;
  private final StockRepository stockRepository;
  private final UserRepository userRepository;
  private final OrderAdminAuditRepository orderAdminAuditRepository;
  private final PasswordEncoder passwordEncoder;

  public MovementAdminService(
      StockMovementRepository stockMovementRepository,
      StockRepository stockRepository,
      UserRepository userRepository,
      OrderAdminAuditRepository orderAdminAuditRepository,
      PasswordEncoder passwordEncoder) {
    this.stockMovementRepository = stockMovementRepository;
    this.stockRepository = stockRepository;
    this.userRepository = userRepository;
    this.orderAdminAuditRepository = orderAdminAuditRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional(readOnly = true)
  public List<MovementViewDto> listMovements(String partNumber, String description, String movementType) {
    List<StockMovement> movements = stockMovementRepository.findAllByOrderByCreatedAtDesc();
    List<StockMovement> filtered = new ArrayList<>();
    String partFilter = normalizeFilter(partNumber);
    String typeFilter = normalizeFilter(movementType);
    for (StockMovement movement : movements) {
      if (!matchesFilter(movement.getPartNumber(), partFilter)) {
        continue;
      }
      if (!matchesMovementType(movement.getMovementType(), typeFilter)) {
        continue;
      }
      filtered.add(movement);
    }

    Map<String, String> descriptionByPart = loadDescriptions(filtered);
    String descFilter = normalizeFilter(description);
    Map<Long, String> userNames = loadUserNames(filtered);

    List<MovementViewDto> result = new ArrayList<>();
    for (StockMovement movement : filtered) {
      String movementDescription = descriptionByPart.getOrDefault(movement.getPartNumber(), null);
      if (!matchesFilter(movementDescription, descFilter)) {
        continue;
      }
      MovementViewDto dto = new MovementViewDto();
      dto.setId(movement.getId());
      dto.setCreatedAt(movement.getCreatedAt());
      dto.setPartNumber(movement.getPartNumber());
      dto.setDescription(movementDescription);
      MovementType type = movement.getMovementType();
      dto.setMovementType(type == null ? null : type.getCode());
      dto.setMovementTypeDescription(type == null ? null : type.name().replace("_", " "));
      dto.setQty(movement.getQtyChange());
      dto.setReference(movement.getReference());
      dto.setUser(userNames.getOrDefault(movement.getCreatedBy(), "Unknown"));
      result.add(dto);
    }

    return result;
  }

  @Transactional
  public void deleteMovement(Long id, MovementDeleteRequest request) {
    if (id == null) {
      throw new BusinessRuleException("Movement id is required.");
    }
    MovementDeleteRequest safeRequest = request == null ? new MovementDeleteRequest() : request;
    String performedBy = safeRequest.getPerformedBy();
    if (performedBy == null || performedBy.isBlank()) {
      performedBy = "SYSTEM";
    } else {
      User user = userRepository.findByUsername(performedBy)
          .orElseThrow(() -> new BusinessRuleException("Admin user not found."));
      if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
        throw new BusinessRuleException("Only ADMIN can delete movements.");
      }
    }

    StockMovement movement = stockMovementRepository.findById(id)
        .orElseThrow(() -> new BusinessRuleException("Movement not found."));

    stockMovementRepository.delete(movement);
    String reason = safeRequest.getReason();
    if (reason == null || reason.isBlank()) {
      reason = "testing delete";
    }
    saveDeleteAudit(movement, reason, performedBy);
  }

  private void saveDeleteAudit(StockMovement movement, String reason, String performedBy) {
    OrderAdminAudit audit = new OrderAdminAudit();
    audit.setOrderId(null);
    audit.setOutboundNumber(movement.getSalesOrder());
    audit.setAction(OrderAdminAction.DELETE_MOVEMENT);
    audit.setReason(reason);
    audit.setPerformedBy(performedBy);
    audit.setDetails(buildDeleteDetails(movement));
    audit.setCreatedAt(Instant.now());
    orderAdminAuditRepository.save(audit);
  }

  private String buildDeleteDetails(StockMovement movement) {
    String code = movement.getMovementType() == null ? "-" : movement.getMovementType().getCode();
    return "Deleted movement id=" + movement.getId()
        + ", type=" + code
        + ", part=" + movement.getPartNumber()
        + ", qty=" + movement.getQtyChange()
        + ", reference=" + (movement.getReference() == null ? "-" : movement.getReference());
  }

  private Map<String, String> loadDescriptions(List<StockMovement> movements) {
    Set<String> partNumbers = new HashSet<>();
    for (StockMovement movement : movements) {
      if (movement.getPartNumber() != null && !movement.getPartNumber().isBlank()) {
        partNumbers.add(movement.getPartNumber());
      }
    }
    Map<String, String> result = new HashMap<>();
    if (partNumbers.isEmpty()) {
      return result;
    }
    List<Stock> rows = stockRepository.findByPartNumberIn(partNumbers);
    for (Stock row : rows) {
      if (row.getPartNumber() == null) {
        continue;
      }
      if (result.containsKey(row.getPartNumber())) {
        continue;
      }
      if (row.getDescription() != null && !row.getDescription().isBlank()) {
        result.put(row.getPartNumber(), row.getDescription());
      }
    }
    return result;
  }

  private Map<Long, String> loadUserNames(List<StockMovement> movements) {
    Set<Long> userIds = new HashSet<>();
    for (StockMovement movement : movements) {
      if (movement.getCreatedBy() != null) {
        userIds.add(movement.getCreatedBy());
      }
    }
    Map<Long, String> result = new HashMap<>();
    if (userIds.isEmpty()) {
      return result;
    }
    userRepository.findAllById(userIds).forEach(user -> result.put(user.getUserId(), user.getUsername()));
    return result;
  }

  private boolean matchesFilter(String value, String filter) {
    if (filter == null || filter.isBlank()) {
      return true;
    }
    if (value == null) {
      return false;
    }
    return value.toUpperCase().contains(filter);
  }

  private boolean matchesMovementType(MovementType type, String filter) {
    if (filter == null || filter.isBlank()) {
      return true;
    }
    if (type == null) {
      return false;
    }
    String code = type.getCode().toUpperCase();
    String name = type.name().toUpperCase();
    return code.contains(filter) || name.contains(filter);
  }

  private String normalizeFilter(String raw) {
    return raw == null ? null : raw.trim().toUpperCase();
  }
}
