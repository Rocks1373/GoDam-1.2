package com.godam.config;

import com.godam.security.UploadValidationPipeline;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/db")
public class DatabaseManagerController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UploadValidationPipeline uploadValidationPipeline;

    // Get all tables with their schema info
    @GetMapping("/tables")
    public ResponseEntity<List<Map<String, Object>>> getAllTables() {
        String sql = """
            SELECT table_name, 
                   (SELECT COUNT(*) FROM information_schema.columns c 
                    WHERE c.table_name = t.table_name AND c.table_schema = t.table_schema) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public'
            ORDER BY table_name
            """;
        
        List<Map<String, Object>> tables = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(tables);
    }

    // Get table schema (columns, types, etc.)
    @GetMapping("/tables/{tableName}/schema")
    public ResponseEntity<List<Map<String, Object>>> getTableSchema(@PathVariable String tableName) {
        String sql = """
            SELECT column_name, data_type, is_nullable, column_default, character_maximum_length,
                   is_identity, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = ?
            ORDER BY ordinal_position
            """;
        
        List<Map<String, Object>> columns = jdbcTemplate.queryForList(sql, tableName);
        return ResponseEntity.ok(columns);
    }

    // Get table data with pagination
    @GetMapping("/tables/{tableName}/data")
    public ResponseEntity<Map<String, Object>> getTableData(
            @PathVariable String tableName,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "100") int pageSize,
            @RequestParam(required = false) String orderBy,
            @RequestParam(defaultValue = "ASC") String orderDir) {
        
        // Get total count
        String countSql = "SELECT COUNT(*) FROM \"" + sanitizeIdentifier(tableName) + "\"";
        Long total = jdbcTemplate.queryForObject(countSql, Long.class);
        
        // Get data with pagination
        String orderClause = "";
        if (orderBy != null && !orderBy.isEmpty()) {
            orderClause = " ORDER BY \"" + sanitizeIdentifier(orderBy) + "\" " + orderDir;
        }
        
        int offset = (page - 1) * pageSize;
        String dataSql = "SELECT * FROM \"" + sanitizeIdentifier(tableName) + "\"" 
                        + orderClause + " LIMIT ? OFFSET ?";
        
        List<Map<String, Object>> data = jdbcTemplate.queryForList(dataSql, pageSize, offset);
        
        Map<String, Object> result = new HashMap<>();
        result.put("data", data);
        result.put("total", total);
        result.put("page", page);
        result.put("pageSize", pageSize);
        result.put("totalPages", (int) Math.ceil((double) total / pageSize));
        
        return ResponseEntity.ok(result);
    }

    // Get single record by ID
    @GetMapping("/tables/{tableName}/record/{id}")
    public ResponseEntity<Map<String, Object>> getRecord(
            @PathVariable String tableName,
            @PathVariable Long id) {
        
        // First get primary key
        String pkSql = """
            SELECT a.attname as column_name
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = ?::regclass AND i.indisprimary
            """;
        
        List<String> pkColumns = jdbcTemplate.queryForList(pkSql, String.class, tableName);
        String pkColumn = pkColumns.isEmpty() ? "id" : pkColumns.get(0);
        
        String sql = "SELECT * FROM \"" + sanitizeIdentifier(tableName) + "\" WHERE \"" + pkColumn + "\" = ?";
        Map<String, Object> record = jdbcTemplate.queryForMap(sql, id);
        
        return ResponseEntity.ok(record);
    }

    // Insert new record
    @PostMapping("/tables/{tableName}/record")
    public ResponseEntity<Map<String, Object>> insertRecord(
            @PathVariable String tableName,
            @RequestBody Map<String, Object> record) {
        
    StringBuilder columns = new StringBuilder();
    StringBuilder placeholders = new StringBuilder();
    List<Object> values = new ArrayList<>();
    validateRecord(record);
        
        for (Map.Entry<String, Object> entry : record.entrySet()) {
            if (columns.length() > 0) {
                columns.append(", ");
                placeholders.append(", ");
            }
            columns.append("\"").append(sanitizeIdentifier(entry.getKey())).append("\"");
            placeholders.append("?");
            values.add(entry.getValue());
        }
        
        String sql = "INSERT INTO \"" + sanitizeIdentifier(tableName) + "\" (" + columns + ") VALUES (" + placeholders + ") RETURNING *";
        
        Map<String, Object> result = jdbcTemplate.queryForMap(sql, values.toArray());
        
        return ResponseEntity.ok(result);
    }

    // Update record
    @PutMapping("/tables/{tableName}/record/{id}")
  public ResponseEntity<Map<String, Object>> updateRecord(
          @PathVariable String tableName,
          @PathVariable Long id,
          @RequestBody Map<String, Object> record) {
        
        // Get primary key
        String pkSql = """
            SELECT a.attname as column_name
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = ?::regclass AND i.indisprimary
            """;
        
        List<String> pkColumns = jdbcTemplate.queryForList(pkSql, String.class, tableName);
        String pkColumn = pkColumns.isEmpty() ? "id" : pkColumns.get(0);
        
        StringBuilder setClause = new StringBuilder();
        validateRecord(record);
        List<Object> values = new ArrayList<>();
        
        for (Map.Entry<String, Object> entry : record.entrySet()) {
            if (setClause.length() > 0) {
                setClause.append(", ");
            }
            setClause.append("\"").append(sanitizeIdentifier(entry.getKey())).append("\" = ?");
            values.add(entry.getValue());
        }
        
        values.add(id);
        
        String sql = "UPDATE \"" + sanitizeIdentifier(tableName) + "\" SET " + setClause + 
                    " WHERE \"" + pkColumn + "\" = ? RETURNING *";
        
        Map<String, Object> result = jdbcTemplate.queryForMap(sql, values.toArray());
        
        return ResponseEntity.ok(result);
    }

    // Delete record
    @DeleteMapping("/tables/{tableName}/record/{id}")
    public ResponseEntity<Map<String, Object>> deleteRecord(
            @PathVariable String tableName,
            @PathVariable Long id) {
        
        // Get primary key
        String pkSql = """
            SELECT a.attname as column_name
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = ?::regclass AND i.indisprimary
            """;
        
        List<String> pkColumns = jdbcTemplate.queryForList(pkSql, String.class, tableName);
        String pkColumn = pkColumns.isEmpty() ? "id" : pkColumns.get(0);
        
        String sql = "DELETE FROM \"" + sanitizeIdentifier(tableName) + "\" WHERE \"" + pkColumn + "\" = ? RETURNING *";
        
        Map<String, Object> result = jdbcTemplate.queryForMap(sql, id);
        
        return ResponseEntity.ok(result);
    }

    // Execute custom SQL query
    @PostMapping("/query")
    public ResponseEntity<Map<String, Object>> executeQuery(@RequestBody Map<String, String> request) {
        String sql = request.get("query");
        
        if (sql == null || sql.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Query cannot be empty"));
        }
        
        // Check for dangerous operations
        String upperSql = sql.toUpperCase().trim();
        if (upperSql.startsWith("DROP") || upperSql.startsWith("TRUNCATE")) {
            return ResponseEntity.badRequest().body(Map.of("error", "DROP and TRUNCATE operations are not allowed"));
        }
        
        try {
            // Check if it's a SELECT query
            if (upperSql.startsWith("SELECT") || upperSql.startsWith("SHOW") || upperSql.startsWith("DESCRIBE") || upperSql.startsWith("\\")) {
                List<Map<String, Object>> results = jdbcTemplate.queryForList(sql);
                return ResponseEntity.ok(Map.of(
                    "type", "SELECT",
                    "columns", results.isEmpty() ? List.of() : new ArrayList<>(results.get(0).keySet()),
                    "data", results,
                    "rowCount", results.size()
                ));
            } else if (upperSql.startsWith("INSERT") || upperSql.startsWith("UPDATE") || upperSql.startsWith("DELETE")) {
                int affected = jdbcTemplate.update(sql);
                return ResponseEntity.ok(Map.of(
                    "type", "MODIFY",
                    "message", "Query executed successfully",
                    "affectedRows", affected
                ));
            } else {
                jdbcTemplate.execute(sql);
                return ResponseEntity.ok(Map.of(
                    "type", "OTHER",
                    "message", "Query executed successfully"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Get foreign key relationships
    @GetMapping("/tables/{tableName}/relationships")
    public ResponseEntity<List<Map<String, Object>>> getRelationships(@PathVariable String tableName) {
        String sql = """
            SELECT
                kcu.column_name as column_name,
                ccu.table_name as referenced_table,
                ccu.column_name as referenced_column
            FROM information_schema.table_constraints as tc
            JOIN information_schema.key_column_usage as kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage as ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = ?
            """;
        
        List<Map<String, Object>> relationships = jdbcTemplate.queryForList(sql, tableName);
        return ResponseEntity.ok(relationships);
    }

    // Get indexes for a table
    @GetMapping("/tables/{tableName}/indexes")
    public ResponseEntity<List<Map<String, Object>>> getIndexes(@PathVariable String tableName) {
        String sql = """
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = ?
            """;
        
        List<Map<String, Object>> indexes = jdbcTemplate.queryForList(sql, tableName);
        return ResponseEntity.ok(indexes);
    }

    // Truncate table (with cascade option)
    @PostMapping("/tables/{tableName}/truncate")
    public ResponseEntity<Map<String, Object>> truncateTable(
            @PathVariable String tableName,
            @RequestParam(defaultValue = "false") boolean cascade) {
        
        String sql = "TRUNCATE TABLE \"" + sanitizeIdentifier(tableName) + "\"";
        if (cascade) {
            sql += " CASCADE";
        }
        
        jdbcTemplate.execute(sql);
        return ResponseEntity.ok(Map.of("message", "Table truncated successfully"));
    }

    // Drop table
    @DeleteMapping("/tables/{tableName}")
    public ResponseEntity<Map<String, Object>> dropTable(@PathVariable String tableName) {
        String sql = "DROP TABLE \"" + sanitizeIdentifier(tableName) + "\" CASCADE";
        jdbcTemplate.execute(sql);
        return ResponseEntity.ok(Map.of("message", "Table dropped successfully"));
    }

    // Create table from DDL
    @PostMapping("/tables/create")
    public ResponseEntity<Map<String, Object>> createTable(@RequestBody Map<String, String> request) {
        String ddl = request.get("ddl");
        if (ddl == null || ddl.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "DDL cannot be empty"));
        }
        
        try {
            jdbcTemplate.execute(ddl);
            return ResponseEntity.ok(Map.of("message", "Table created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Get all schemas
    @GetMapping("/schemas")
    public ResponseEntity<List<String>> getSchemas() {
        String sql = "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema') ORDER BY schema_name";
        List<String> schemas = jdbcTemplate.queryForList(sql, String.class);
        return ResponseEntity.ok(schemas);
    }

    // Get table info (row count, size)
    @GetMapping("/tables/{tableName}/info")
    public ResponseEntity<Map<String, Object>> getTableInfo(@PathVariable String tableName) {
        String sql = """
            SELECT 
                c.reltuples as estimated_rows,
                pg_total_relation_size(c.oid) as total_size,
                pg_relation_size(c.oid) as table_size,
                pg_indexes_size(c.oid) as index_size
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = ?
            """;
        
        Map<String, Object> info = jdbcTemplate.queryForMap(sql, tableName);
        return ResponseEntity.ok(info);
    }

    // Search across tables
    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> search(
            @RequestParam String term,
            @RequestParam(defaultValue = "20") int limit) {
        
        String sql = """
            SELECT table_name, column_name, data_type
            FROM information_schema.columns
            WHERE column_name ILIKE ? OR table_name ILIKE ?
            LIMIT ?
            """;
        
        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, "%" + term + "%", "%" + term + "%", limit);
        return ResponseEntity.ok(results);
    }

  private String sanitizeIdentifier(String identifier) {
    // Basic SQL injection prevention
    if (identifier == null || !identifier.matches("^[a-zA-Z_][a-zA-Z0-9_]*$")) {
      throw new IllegalArgumentException("Invalid identifier: " + identifier);
    }
    return identifier;
  }

  private void validateRecord(Map<String, Object> record) {
    if (record == null) {
      return;
    }
    record.forEach((column, value) -> {
      if (value instanceof String str) {
        uploadValidationPipeline.validate(column, str, null);
      }
    });
  }
}
