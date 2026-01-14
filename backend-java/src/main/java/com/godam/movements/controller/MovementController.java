package com.godam.movements.controller;

import com.godam.movements.MovementType;
import com.godam.movements.StockMovement;
import com.godam.movements.dto.MovementDeleteRequest;
import com.godam.movements.dto.MovementViewDto;
import com.godam.movements.service.MovementAdminService;
import com.godam.movements.service.StockMovementService;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/movements", "/api/movements"})
public class MovementController {
  private final StockMovementService stockMovementService;
  private final MovementAdminService movementAdminService;

  public MovementController(
      StockMovementService stockMovementService,
      MovementAdminService movementAdminService) {
    this.stockMovementService = stockMovementService;
    this.movementAdminService = movementAdminService;
  }

  @GetMapping
  public List<MovementViewDto> listMovements(
      @RequestParam(value = "partNumber", required = false) String partNumber,
      @RequestParam(value = "description", required = false) String description,
      @RequestParam(value = "movementType", required = false) String movementType) {
    return movementAdminService.listMovements(partNumber, description, movementType);
  }

  @GetMapping("/{outboundNumber}")
  public List<StockMovement> listMovements(@PathVariable("outboundNumber") String outboundNumber) {
    return stockMovementService.getMovementsByOutbound(outboundNumber);
  }

  @GetMapping("/status/{outboundNumber}")
  public MovementStatusResponse getStatus(@PathVariable("outboundNumber") String outboundNumber) {
    List<StockMovement> movements = stockMovementService.getMovementsByOutbound(outboundNumber);
    MovementType status = movements.isEmpty() ? null : movements.get(movements.size() - 1).getMovementType();
    return MovementStatusResponse.from(status);
  }

  @DeleteMapping("/{id}")
  public void deleteMovement(
      @PathVariable("id") Long id,
      @RequestBody MovementDeleteRequest request) {
    movementAdminService.deleteMovement(id, request);
  }

  public static class MovementStatusResponse {
    private String currentStatus;
    private String readableStatus;

    public static MovementStatusResponse from(MovementType type) {
      MovementStatusResponse response = new MovementStatusResponse();
      if (type == null) {
        response.currentStatus = null;
        response.readableStatus = null;
      } else {
        response.currentStatus = type.getCode();
        response.readableStatus = type.name().replace("_", " ");
      }
      return response;
    }

    public String getCurrentStatus() {
      return currentStatus;
    }

    public String getReadableStatus() {
      return readableStatus;
    }
  }
}
