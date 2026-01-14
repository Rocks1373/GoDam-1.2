# Table Normalization Policy

Historically the GoDam schema relied on quoted, mixed-case table names (e.g. `"OrderItems"`, `"StockMovements"`). PostgreSQL treats these as case-sensitive, so every quoted name is a *different* table than the lowercase equivalent (`order_items`, `stock_movements`). That duplication makes the schema easier to misread, confuses tooling, and forces every query or JPA entity to explicitly quote mixed-case names.

We now standardize on **lowercase, unquoted table names**, and keep this document up to date whenever new tables are added or renamed.

## Affected tables

| Canonical name | Legacy quoted name(s) |
|---------------:|----------------------|
| `users` | `"Users"` |
| `warehouses` | `"Warehouses"` |
| `stock` | `"Stock"` |
| `stock_movements` | `"StockMovements"` |
| `order_workflows` | `"OrderWorkflows"` |
| `order_admin_audits` | `"OrderAdminAudits"` |
| `order_items` | `"OrderItems"` |
| `order_transport` | `"OrderTransport"` |
| `order_serials` | `"OrderSerials"` |
| `order_files` | `"OrderFiles"` |
| `order_workflows` dependencies (`transporters`, `drivers`, `customers`) | `"Transporters"`, `"Drivers"`, `"Customers"` |

> The `notifications` table is already defined as lowercase; the uppercase version has been removed.

## Normalization workflow

1. **Identify duplicates** (run `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ~ '^[A-Z]';`).
2. **Move existing data** from the quoted table to the lowercase table before dropping it:
   ```sql
   INSERT INTO order_items SELECT * FROM "OrderItems";
   DROP TABLE "OrderItems";
   ```
   Repeat for each pair—if both tables already exist, verify the target table has the correct schema before inserting.
3. **Update any schema or entity definitions** (see `backend-java/postgresql_schema.sql` and `@Table` annotations) to reference the lowercase name.
4. **Document the change** inside this file so the next developer knows which migration was applied.

> Always run these commands under a transaction in production systems and back up the data before dropping tables.

## Keeping this document current

Whenever a new table is added, update this document with:

* the canonical lowercase name,
* any legacy quoted names it replaces,
* the migration SQL you executed (if the table already existed).

This ensures everyone knows the definitive table name to use in future development and in the validator service.
