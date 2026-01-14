package com.godam.stock.upload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

@Component
public class StockErrorExcelWriter {
  public void writeErrors(Path path, List<String> headers, List<StockUploadErrorRow> rows)
      throws IOException {
    try (Workbook workbook = new XSSFWorkbook()) {
      Sheet sheet = workbook.createSheet("Errors");
      Row headerRow = sheet.createRow(0);
      int col = 0;
      for (String header : headers) {
        headerRow.createCell(col++).setCellValue(header);
      }
      headerRow.createCell(col).setCellValue("ERROR");
      int rowIdx = 1;
      for (StockUploadErrorRow row : rows) {
        Row sheetRow = sheet.createRow(rowIdx++);
        int colIdx = 0;
        for (String header : headers) {
          Cell cell = sheetRow.createCell(colIdx++);
          cell.setCellValue(row.getRow().getValues().getOrDefault(header, ""));
        }
        sheetRow.createCell(colIdx).setCellValue(row.getReason());
      }
      Files.createDirectories(path.getParent());
      try (var out = Files.newOutputStream(path)) {
        workbook.write(out);
      }
    }
  }

  public Path createTempPath(String token) {
    return Path.of(System.getProperty("java.io.tmpdir"), "GoDAM_ErrorRows-" + token + ".xlsx");
  }
}
