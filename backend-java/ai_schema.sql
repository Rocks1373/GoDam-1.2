-- AI Module Schema for GoDAM
-- Read-only AI assistant with instruction memory and reporting

-- AI Instructions Table - Stores business rules and guidance
CREATE TABLE IF NOT EXISTS ai_instructions (
    id SERIAL PRIMARY KEY,
    instruction_key VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 100,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    conditions JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Feedback Table - User feedback on AI responses
CREATE TABLE IF NOT EXISTS ai_feedback (
    id SERIAL PRIMARY KEY,
    activity_log_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    is_helpful BOOLEAN,
    user_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "FK_Feedback_ActivityLog" FOREIGN KEY (activity_log_id) REFERENCES ai_activity_log(id) ON DELETE CASCADE,
    CONSTRAINT "FK_Feedback_User" FOREIGN KEY (user_id) REFERENCES "Users"(user_id)
);

-- AI Context Cache - Cached context for faster responses
CREATE TABLE IF NOT EXISTS ai_context_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(200) NOT NULL UNIQUE,
    context_type VARCHAR(50) NOT NULL,
    context_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily Reports Table - Stores AI-generated reports
CREATE TABLE IF NOT EXISTS daily_reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL,
    report_date DATE NOT NULL,
    title VARCHAR(200) NOT NULL,
    summary TEXT,
    details JSONB NOT NULL,
    exceptions JSONB,
    generated_by VARCHAR(100) NOT NULL,
    is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "FK_Report_User" FOREIGN KEY (reviewed_by) REFERENCES "Users"(user_id),
    UNIQUE (report_type, report_date)
);

-- AI Report Templates
CREATE TABLE IF NOT EXISTS ai_report_templates (
    id SERIAL PRIMARY KEY,
    template_key VARCHAR(100) NOT NULL UNIQUE,
    report_type VARCHAR(50) NOT NULL,
    title_template VARCHAR(200) NOT NULL,
    query_template TEXT NOT NULL,
    analysis_instructions TEXT NOT NULL,
    output_format VARCHAR(50) NOT NULL DEFAULT 'summary',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "IX_AI_Instruction_Category" ON ai_instructions(category);
CREATE INDEX IF NOT EXISTS "IX_AI_Instruction_Active" ON ai_instructions(is_active);
CREATE INDEX IF NOT EXISTS "IX_AI_Feedback_Activity" ON ai_feedback(activity_log_id);
CREATE INDEX IF NOT EXISTS "IX_AI_Feedback_User" ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS "IX_AI_ContextCache_Type" ON ai_context_cache(context_type);
CREATE INDEX IF NOT EXISTS "IX_AI_ContextCache_Expires" ON ai_context_cache(expires_at);
CREATE INDEX IF NOT EXISTS "IX_DailyReports_Date" ON daily_reports(report_date);
CREATE INDEX IF NOT EXISTS "IX_DailyReports_Type" ON daily_reports(report_type);
CREATE INDEX IF NOT EXISTS "IX_ReportTemplates_Type" ON ai_report_templates(report_type);

-- Insert default AI instructions
INSERT INTO ai_instructions (instruction_key, category, priority, title, content, conditions, is_active)
VALUES
    -- Stock Management Instructions
    ('stock_low_qty', 'stock', 10, 'Low Stock Alert',
     'When stock quantity falls below minimum threshold, alert the warehouse manager immediately. Create a restock request and notify purchasing.',
     '{"field": "qty", "operator": "lt", "value": 10}', true),
    
    ('stock_mismatch', 'stock', 5, 'Stock Count Mismatch',
     'If physical stock count differs from system record by more than 5%, flag for reconciliation. Investigate movement logs for the past 7 days.',
     '{"field": "discrepancy_pct", "operator": "gt", "value": 5}', true),
    
    -- Order Processing Instructions
    ('order_pending_long', 'orders', 15, 'Pending Order Alert',
     'Orders pending for more than 24 hours require immediate attention. Check picking status and assign resources.',
     '{"field": "pending_hours", "operator": "gt", "value": 24}', true),
    
    ('order_pick_incomplete', 'orders', 20, 'Incomplete Picking',
     'Orders with partial picking status must be completed before DN creation. Verify remaining items location.',
     '{"field": "picking_status", "operator": "eq", "value": "PARTIAL"}', true),
    
    -- DN Instructions
    ('dn_vs_order_gap', 'dn', 10, 'DN Order Gap Detection',
     'If DN items differ from order items by more than 2%, this requires manual approval. Check for unconfirmed picks.',
     '{"field": "gap_percentage", "operator": "gt", "value": 2}', true),
    
    ('dn_created_without_picking', 'dn', 1, 'DN Without Complete Picking',
     'Critical: DN was created without completing picking process. This may cause shipment errors. Verify with warehouse supervisor.',
     '{"field": "picking_status", "operator": "ne", "value": "COMPLETED"}', true),
    
    -- Pickup Instructions
    ('pickup_not_sent', 'pickup', 25, 'Pickup Request Pending',
     'Orders ready for pickup but not yet sent to pickers. Sending delays fulfillment. Dispatch immediately.',
     '{"field": "pickup_status", "operator": "eq", "value": "READY"}', true),
    
    ('pickup_overdue', 'pickup', 5, 'Overdue Pickup',
     'Pickup request is overdue (more than 2 hours). Reassign picker or escalate to supervisor.',
     '{"field": "pickup_overdue_hours", "operator": "gt", "value": 2}', true),
    
    -- Customer Instructions
    ('customer_high_value', 'customer', 30, 'High Value Customer Order',
     'Orders from premium customers require priority handling. Ensure accurate picking and complete documentation.',
     '{"field": "customer_tier", "operator": "eq", "value": "PREMIUM"}', true),
    
    -- Reporting Instructions
    ('daily_summary_required', 'report', 50, 'Generate Daily Summary',
     'End of day: Generate summary of completed orders, pending orders, and any exceptions. Report to operations manager.',
     '{"field": "report_time", "operator": "eq", "value": "EOD"}', true)
ON CONFLICT (instruction_key) DO NOTHING;

-- Insert report templates
INSERT INTO ai_report_templates (template_key, report_type, title_template, query_template, analysis_instructions, output_format)
VALUES
    ('daily_ops', 'daily_summary', 'Daily Operations Report - {date}',
     'SELECT COUNT(*) as total_orders, COUNT(*) FILTER (WHERE picking_status = ''COMPLETED'') as completed,
      COUNT(*) FILTER (WHERE picking_status = ''PENDING'') as pending,
      COUNT(*) FILTER (WHERE dn_created = true) as dn_created,
      SUM(total_qty) as total_qty
     FROM "OrderWorkflows"
     WHERE created_at >= CURRENT_DATE - INTERVAL ''1 day'' AND created_at < CURRENT_DATE',
     'Summarize daily operations. Highlight any orders pending超过12小时. Compare with previous day performance.',
     'summary'),
    
    ('pending_orders', 'pending_report', 'Pending Orders Report - {date}',
     'SELECT outbound_number, customer_name, picking_status, checking_status, created_at,
      EXTRACT(HOUR FROM (now() - created_at)) as hours_pending
     FROM "OrderWorkflows"
     WHERE picking_status != ''COMPLETED'' AND created_at >= CURRENT_DATE - INTERVAL ''3 days''
     ORDER BY created_at ASC',
     'List all pending orders with hours pending. Flag any over 24 hours. Suggest immediate actions.',
     'list'),
    
    ('exception_report', 'exceptions', 'Exception Report - {date}',
     'SELECT o.outbound_number, o.picking_status, o.checking_status, o.dn_created,
      o.delivery_status, o.upload_status, o.closed_at
     FROM "OrderWorkflows" o
     WHERE (o.picking_status != ''COMPLETED'' AND o.created_at < now() - INTERVAL ''48 hours'')
        OR (o.checking_status != ''COMPLETED'' AND o.picking_status = ''COMPLETED'')
        OR (o.dn_created = false AND o.checking_status = ''COMPLETED'')
     ORDER BY o.created_at ASC',
     'Identify exceptions and delays. Provide root cause analysis and recommended resolution steps.',
     'exception'),
    
    ('stock_audit', 'stock_audit', 'Stock Audit Report - {date}',
     'SELECT s.part_number, s.description, s.qty, s.rack, s.storage_location,
      s.updated_at, COUNT(sm.id) as movement_count
     FROM "Stock" s
     LEFT JOIN "StockMovements" sm ON s.part_number = sm.part_number
        AND sm.created_at >= CURRENT_DATE - INTERVAL ''7 days''
     WHERE s.deleted_at IS NULL
     GROUP BY s.id
     ORDER BY s.updated_at DESC NULLS LAST
     LIMIT 100',
     'Highlight inactive stock (no movements in 7 days). Flag any recent quantity changes.',
     'audit')
ON CONFLICT (template_key) DO NOTHING;

-- Create a read-only user for AI
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ai_readonly') THEN
        CREATE ROLE ai_readonly WITH LOGIN PASSWORD 'ai_readonly_secure_2024';
    END IF;
    
    GRANT CONNECT ON DATABASE postgres TO ai_readonly;
    
    -- Grant SELECT on all tables in public schema
    GRANT USAGE ON SCHEMA public TO ai_readonly;
    
    -- Grant SELECT to all relevant tables
    GRANT SELECT ON "Users" TO ai_readonly;
    GRANT SELECT ON "Warehouses" TO ai_readonly;
    GRANT SELECT ON "Stock" TO ai_readonly;
    GRANT SELECT ON "StockMovements" TO ai_readonly;
    GRANT SELECT ON "OrderWorkflows" TO ai_readonly;
    GRANT SELECT ON "OrderItems" TO ai_readonly;
    GRANT SELECT ON "OrderAdminAudits" TO ai_readonly;
    GRANT SELECT ON "OrderTransport" TO ai_readonly;
    GRANT SELECT ON "OrderSerials" TO ai_readonly;
    GRANT SELECT ON "DeliveryNotes" TO ai_readonly;
    GRANT SELECT ON "Notifications" TO ai_readonly;
    GRANT SELECT ON ai_instructions TO ai_readonly;
    GRANT SELECT ON ai_feedback TO ai_readonly;
    GRANT SELECT ON ai_context_cache TO ai_readonly;
    GRANT SELECT ON daily_reports TO ai_readonly;
    GRANT SELECT ON ai_report_templates TO ai_readonly;
    GRANT SELECT ON ai_activity_log TO ai_readonly;
    
    -- Grant SELECT on matching tables
    GRANT SELECT ON matching_masters_input_rows TO ai_readonly;
    GRANT SELECT ON matching_masters_vcust TO ai_readonly;
    GRANT SELECT ON matching_masters_so TO ai_readonly;
    GRANT SELECT ON matching_masters_po TO ai_readonly;
    GRANT SELECT ON matching_dn_items TO ai_readonly;
    
    -- Grant INSERT/UPDATE only on activity tables
    GRANT INSERT, UPDATE ON ai_activity_log TO ai_readonly;
    GRANT INSERT, UPDATE ON ai_feedback TO ai_readonly;
    GRANT INSERT ON ai_context_cache TO ai_readonly;
    GRANT INSERT ON daily_reports TO ai_readonly;
    
    ALTER ROLE ai_readonly SET statement_timeout = '30000';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Role ai_readonly already exists';
END $$;

