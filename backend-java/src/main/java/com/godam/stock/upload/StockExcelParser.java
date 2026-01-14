package com.godam.stock.upload;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class StockExcelParser {
  private static final List<String> EXCEL_EXTENSIONS = Arrays.asList(".xls", ".xlsx");

  public StockUploadDocument parse(MultipartFile file) throws IOException {
    String filename = file.getOriginalFilename();
    if (filename == null) {
      throw new IllegalArgumentException("Filename is required for stock upload");
    }
    String normalized = filename.trim().toLowerCase();
    if (EXCEL_EXTENSIONS.stream().anyMatch(normalized::endsWith)) {
      return parseExcel(file);
    }
    if (normalized.endsWith(".csv")) {
      return parseCsv(file);
    }
    throw new IllegalArgumentException("Unsupported file format for stock upload: " + filename);
  }

  private StockUploadDocument parseExcel(MultipartFile file) throws IOException {
    try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
      Sheet sheet = workbook.getSheetAt(0);
      return parseSheet(sheet);
    }
  }

  private StockUploadDocument parseSheet(Sheet sheet) {
    List<String> headers = extractHeaders(sheet);
    List<StockUploadRow> rows = new ArrayList<>();
    for (int i = 1; i <= sheet.getLastRowNum(); i++) {
      Row row = sheet.getRow(i);
      if (row == null || isRowEmpty(row)) {
        continue;
      }
      Map<String, String> values = new LinkedHashMap<>();
      for (int col = 0; col < headers.size(); col++) {
        Cell cell = row.getCell(col);
        values.put(headers.get(col), cellValue(cell));
      }
      rows.add(new StockUploadRow(i + 1, values));
    }
    return new StockUploadDocument(headers, rows);
  }

  private List<String> extractHeaders(Sheet sheet) {
    Row headerRow = sheet.getRow(0);
    if (headerRow == null) {
      throw new IllegalStateException("Stock upload file contains no header row");
    }
    List<String> headers = new ArrayList<>();
    for (Cell cell : headerRow) {
      headers.add(normalizeHeader(cellValue(cell)));
    }
    return headers;
  }

  private boolean isRowEmpty(Row row) {
    for (Cell cell : row) {
      if (!cellValue(cell).isEmpty()) {
        return false;
      }
    }
    return true;
  }

  private StockUploadDocument parseCsv(MultipartFile file) throws IOException {
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
        CSVParser csvParser = CSVFormat.DEFAULT.withFirstRecordAsHeader().parse(reader)) {
      List<String> headers = new ArrayList<>();
      csvParser.getHeaderMap().keySet().forEach(header -> headers.add(normalizeHeader(header)));
      List<StockUploadRow> rows = new ArrayList<>();
      int rowNum = 1;
      for (CSVRecord record : csvParser) {
        Map<String, String> values = new LinkedHashMap<>();
        for (String header : headers) {
          values.put(header, record.get(header));
        }
        rows.add(new StockUploadRow(rowNum + 1, values));
        rowNum++;
      }
      return new StockUploadDocument(headers, rows);
    }
  }

  private String cellValue(Cell cell) {
    if (cell == null) {
      return "";
    }
    return switch (cell.getCellType()) {
      case STRING -> cell.getStringCellValue().trim();
      case NUMERIC -> String.valueOf(cell.getNumericCellValue()).trim();
      case BOOLEAN -> String.valueOf(cell.getBooleanCellValue()).trim();
      default -> "";
    };
  }

  private String normalizeHeader(String header) {
    if (header == null) {
      return "";
    }
    return header.trim().toLowerCase();
  }
}
