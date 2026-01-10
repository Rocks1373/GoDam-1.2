# PostgreSQL Adoption Guide for GoDam Inventory Platform

This guide captures how the GoDam stack maps its existing SQL Server schema onto PostgreSQL, the conventions we follow, and the data structures you interact with when working against the backend.

## 1. Postgres standard process

1. **Design migrations first.** Define tables using `CREATE TABLE IF NOT EXISTS` (see `backend-java/postgresql_schema.sql`) so rebuilding or applying new environments is idempotent.
2. **Always favor PostgreSQL-native data types.** Use `BIGSERIAL`/`SERIAL` for primary keys, `BOOLEAN` instead of `BIT`, `TEXT` for unbounded strings, `TIMESTAMPTZ` for timestamps, and `BYTEA` for binary blobs.
3. **Name constraints and indexes explicitly.** Consistent naming (`FK_*`, `IX_*`, `UX_*`) means clearer diagnostics when a violation occurs.
4. **Quote identifiers only when necessary.** The schema keeps the existing mixed-case names (`"Users"`, `"OrderWorkflows"`, etc.) for compatibility with the current JPA annotations, while lowercase-only tables use the standard unquoted form.
5. **Wrap long values in `TEXT`.** Password hashes, refresh tokens, permission blobs, and oversized remarks now live in `TEXT` columns to avoid `value too long for type character varying(255)` errors.
6. **Populate defaults and enforce relationships at the database level.** Every foreign key references the right parent, cascading where appropriate (`ON DELETE CASCADE` for order children, `ON DELETE SET NULL` for optional links).
7. **Document and index frequently filtered fields.** The new script recreates all existing indexes (e.g., `IX_Stock_PartNumber`, `IX_Serial_Outbound`, etc.) so that lookups stay fast.

## 2. How we implemented the schema

- `backend-java/postgresql_schema.sql` mirrors `schema_sqlserver_final.sql` while translating SQL Server constructs (e.g., `IDENTITY`, `NVARCHAR`, `DATETIME2`, `BIT`, `VARBINARY(MAX)`) into PostgreSQL equivalents (`SERIAL`, `VARCHAR`, `TIMESTAMPTZ`, `BOOLEAN`, `TEXT`/`BYTEA`).
- Each table definition includes its foreign keys, defaults, and any unique constraints the application depends on.
- The script keeps comments and naming conventions from the original schema so you can trace an issue back to the SQL Server plan easily.
- To apply the schema in a fresh PostgreSQL instance, run:
  ```bash
  psql -U godam -d godam -f backend-java/postgresql_schema.sql
  ```

## 3. Data structure map

| Module | Tables | Description |
| --- | --- | --- |
| **Authentication & Users** | `"Users"`, `ai_activity_log` | Stores login credentials, roles, permissions, refresh-token hashes, and audit trails for AI assistants. Password/hash lengths expanded to avoid truncation errors. |
| **Inventory** | `"Stock"`, `"StockMovements"`, `stock_action_logs` | Tracks stock quantities, movements, status overrides, and action logs per warehouse. `Stock` is linked to `Warehouses` and optional `Users`. |
| **Warehouse Management** | `"Warehouses"`, `warehouse_addresses` | Captures physical locations, metadata, and coordinates to support multi-site setups. |
| **Orders & Delivery Notes** | `"OrderWorkflows"`, `"OrderItems"`, `"OrderSerials"`, `"OrderTransport"`, `"OrderFiles"`, `"OrderFiles"` | Each outbound number corresponds to one workflow. Serial tracking, picking/checking statuses, logistics data, and attached documents all reference this master table. |
| **Notifications & Chat** | `notifications`, `chat_messages`, `"Notifications"` | Holds user notifications, recipient statuses, and chat history for operations reminders. |
| **Masters & Matching** | `matching_masters_*`, `matching_dn_*`, matching datasets | Holds lookup tables for contracts, SO/PO metadata, DN uploads, and reference data buckets. |
| **Logistics Staff** | `"Transporters"`, `"Drivers"`, `"Customers"` | External partners and personnel definitions, each with audit timestamps and optional user references. |

## 4. Best practices for GoDam Postgres workloads

- Keep DDL migrations versioned alongside the application code (e.g., a flyway/liquibase folder) to ensure reproducibility.
- Seed the `admin` user via the Java initializer but rely on the schema defaults for timestamps.
- When inserting text that can vary in length (remarks, file paths, AI responses), prefer `TEXT` so that evolving requirements don’t force fast schema changes.
- Run `ANALYZE` after bulk imports (`matching_dn_files`, CSV uploads) to keep the planner accurate.
- Monitor indexes with `pg_stat_user_indexes`; the indexes created in the schema file support the most common filtering patterns mentioned in the code (outbound lookups, stock, serials).

## 5. Next steps

1. Update the Java entities to reference lowercase table names (e.g., `@Table(name = "users")`) if you decide to drop quoted identifiers in future migrations—this script makes it explicit where quoting currently matches the legacy schema.
2. Consider a migration framework so you can evolve columns (e.g., enlarge `customer_po` or add JSON columns) without rerunning the full schema file.
3. Keep this guide nearby when onboarding new team members; it explains both the PostgreSQL translation and the rationale for the current table layout.
