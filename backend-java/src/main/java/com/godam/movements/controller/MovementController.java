package com.godam.movements.controller;

import com.godam.movements.MovementType;
import com.godam.movements.StockMovement;
import com.godam.movements.service.StockMovementService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/movements")
public class MovementController {
  private final StockMovementService stockMovementService;

  public MovementController(StockMovementService stockMovementService) {
    this.stockMovementService = stockMovementService;
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
