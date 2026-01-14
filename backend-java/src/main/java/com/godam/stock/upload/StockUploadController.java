package com.godam.stock.upload;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/stock/upload")
public class StockUploadController {
  private final StockUploadValidatorService validatorService;

  public StockUploadController(StockUploadValidatorService validatorService) {
    this.validatorService = validatorService;
  }

  @PostMapping("/validate")
  public StockUploadValidateResponse validate(@RequestParam("file") MultipartFile file)
      throws IOException {
    StockUploadContext context = validatorService.validate(file);
    String errorUrl = "/api/stock/upload/errors/" + context.getToken();
    List<StockUploadValidateResponse.DuplicatePayload> duplicates =
        context.getDuplicates().stream()
            .map(
                dup ->
                    new StockUploadValidateResponse.DuplicatePayload(
                        dup.getPartNumber(),
                        dup.getWarehouseNo(),
                        dup.getExistingQty(),
                        dup.getUploadedQty()))
            .collect(Collectors.toList());
    return new StockUploadValidateResponse(
        context.getValidItems().size(),
        context.getInvalidRows().size(),
        duplicates,
        errorUrl,
        context.getToken());
  }

  @GetMapping("/errors/{token}")
  public ResponseEntity<Resource> downloadErrors(@PathVariable("token") String token) {
    StockUploadContext context = validatorService.getContext(token);
    if (context == null || context.getErrorFile() == null) {
      return ResponseEntity.notFound().build();
    }
    PathResource resource = new PathResource(context.getErrorFile());
    if (!resource.exists()) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok()
        .contentType(
            MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=GoDAM_ErrorRows.xlsx")
        .body(resource);
  }

  @PostMapping("/commit")
  public StockUploadCommitResponse commit(@RequestBody StockUploadCommitRequest request)
      throws IOException {
    validatorService.commit(request.getToken(), request.getAction());
    String errorUrl = "/api/stock/upload/errors/" + request.getToken();
    return new StockUploadCommitResponse(
        "Stock upload committed with action " + request.getAction(), errorUrl);
  }
}
