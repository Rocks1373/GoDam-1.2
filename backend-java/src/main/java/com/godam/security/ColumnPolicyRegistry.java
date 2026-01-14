package com.godam.security;

import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class ColumnPolicyRegistry {
  private static final ColumnPolicy DEFAULT_POLICY = new ColumnPolicy(false, false);
  private static final Map<String, ColumnPolicy> POLICY_MAP;

  static {
    Map<String, ColumnPolicy> map = new HashMap<>();
    map.put("google_location", new ColumnPolicy(true, true));
    map.put("location_text", new ColumnPolicy(true, true));
    map.put("remarks", new ColumnPolicy(true, true));
    map.put("notes", new ColumnPolicy(true, true));
    map.put("reference", new ColumnPolicy(true, true));
    map.put("description", new ColumnPolicy(true, true));
    map.put("message", new ColumnPolicy(true, true));
    map.put("requirements", new ColumnPolicy(true, true));
    map.put("ai_response", new ColumnPolicy(true, true));
    map.put("executed_actions", new ColumnPolicy(true, true));
    map.put("delivery_note_image", new ColumnPolicy(true, false));
    map.put("delivery_item_image1", new ColumnPolicy(true, false));
    map.put("delivery_item_image2", new ColumnPolicy(true, false));
    map.put("iqama_copy_path", new ColumnPolicy(true, false));
    map.put("estimara_path", new ColumnPolicy(true, false));
    map.put("driving_license_path", new ColumnPolicy(true, false));
    map.put("insurance_path", new ColumnPolicy(true, false));
    map.put("rack", new ColumnPolicy(false, false));
    map.put("bin", new ColumnPolicy(false, false));
    map.put("file_path", new ColumnPolicy(true, false));
    map.put("part_number", new ColumnPolicy(false, false));
    map.put("warehouse_no", new ColumnPolicy(false, false));
    map.put("outbound_number", new ColumnPolicy(false, false));
    map.put("invoice_number", new ColumnPolicy(false, false));
    map.put("customer_name", new ColumnPolicy(false, false));
    map.put("customer_id", new ColumnPolicy(false, false));
    map.put("customer_po", new ColumnPolicy(false, false));
    map.put("gapp_po", new ColumnPolicy(false, false));
    map.put("sales_order", new ColumnPolicy(false, false));
    map.put("admin_reason", new ColumnPolicy(false, false));
    map.put("admin_note", new ColumnPolicy(false, false));
    map.put("performed_by", new ColumnPolicy(false, false));
    POLICY_MAP = Collections.unmodifiableMap(map);
  }

  public static ColumnPolicy getPolicy(String columnName) {
    if (columnName == null) {
      return DEFAULT_POLICY;
    }
    return POLICY_MAP.getOrDefault(normalize(columnName), DEFAULT_POLICY);
  }

  public static String normalize(String columnName) {
    if (columnName == null) {
      return null;
    }
    return columnName.replace("\"", "").trim().toLowerCase(Locale.ROOT);
  }
}
