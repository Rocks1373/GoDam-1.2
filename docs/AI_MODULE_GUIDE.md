# GoDAM Application Architecture & Process Guide

## Overview

GoDAM is a warehouse and logistics management system built with:
- **Backend**: Java Spring Boot with PostgreSQL
- **Frontend**: React/TypeScript (web-admin)
- **Mobile**: Flutter
- **AI Module**: Python FastAPI with Ollama (offline LLM)

## Core Business Processes

### 1. Order Management
```
Order Upload -> Order Validation -> Picking -> Checking -> DN Creation -> Dispatch
```

**Flow:**
1. Upload orders via Excel (web-admin)
2. System validates and creates OrderWorkflows records
3. Items assigned to pickers
4. Checker validates picks
5. Delivery Note (DN) generated
6. Order dispatched to customer

**Tables:**
- `OrderWorkflows` - Main order header
- `OrderItems` - Order line items
- `OrderSerials` - Serial numbers for tracked items
- `OrderAdminAudits` - Audit trail

### 2. Stock Management
```
Stock Receipt -> Storage -> Movement -> Picking -> Dispatch
```

**Flow:**
1. Stock received and recorded
2. Items placed in storage locations
3. Movements tracked for every change
4. Picks deducted from stock
5. Stock levels maintained

**Tables:**
- `Stock` - Current inventory
- `StockMovements` - Movement history
- `Warehouses` - Warehouse locations

### 3. Delivery Notes (DN)
```
DN Creation -> Print -> Dispatch -> Delivery Confirmation
```

**Tables:**
- `DeliveryNotes` - DN records
- `OrderTransport` - Transport details

## Database Schema

### Core Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `Users` | Authentication | username, password_hash, role |
| `Warehouses` | Locations | warehouse_no, name |
| `Stock` | Inventory | part_number, qty, rack, location |
| `StockMovements` | History | movement_type, qty_change |
| `OrderWorkflows` | Orders | outbound_number, picking_status |
| `OrderItems` | Line items | part_number, qty, is_picked |
| `OrderAdminAudits` | Auditing | action, performed_by |
| `Notifications` | Alerts | type, message, order_id |

### AI Module Tables
| Table | Purpose |
|-------|---------|
| `ai_instructions` | Business rules |
| `ai_activity_log` | Audit trail |
| `daily_reports` | Generated reports |
| `ai_feedback` | User feedback |

## AI Module SQL Query Capabilities

The AI service is configured with **READ-ONLY** access. It can query:

### Allowed Queries

```sql
-- Stock queries
SELECT * FROM "Stock" WHERE qty < 10;
SELECT * FROM "Stock" WHERE part_number LIKE '%ABC%';

-- Order queries
SELECT * FROM "OrderWorkflows" WHERE picking_status = 'PENDING';
SELECT * FROM "OrderItems" WHERE order_id = 123;

-- Movement queries
SELECT * FROM "StockMovements" WHERE part_number = 'ABC123';

-- Summary queries
SELECT COUNT(*) FROM "OrderWorkflows" WHERE created_at >= NOW() - INTERVAL '7 days';

-- AI instructions
SELECT * FROM ai_instructions WHERE is_active = true;
```

### Blocked Operations

The AI service **blocks** these SQL operations:
- `DROP`, `DELETE`, `UPDATE`, `INSERT`
- `ALTER`, `TRUNCATE`, `EXECUTE`, `CREATE`

### Security Features

1. **Query Parsing**: All queries checked against blocked keywords
2. **Read-Only User**: Uses `ai_readonly` PostgreSQL role
3. **Transaction Mode**: SET transaction_read_only = ON
4. **Timeout**: 30-second query timeout
5. **Length Limit**: Maximum 1000 characters per query

## How AI Module Works

### 1. Chat Flow
```
User Query -> API Endpoint -> Database Query -> Ollama LLM -> Response
```

**Example:**
```bash
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How many orders are pending?"}'
```

**Process:**
1. API receives query
2. Fetches relevant data from PostgreSQL (read-only)
3. Loads relevant instructions from `ai_instructions`
4. Sends context + instructions to Ollama
5. Returns structured response

### 2. Report Generation
```
Report Type -> Data Fetch -> AI Analysis -> Structured Report
```

**Report Types:**
- `daily_summary` - Operational summary
- `pending_report` - Pending orders
- `exception_report` - Issues and delays
- `stock_audit` - Stock analysis

### 3. Instruction System

Business rules stored in `ai_instructions`:
```sql
SELECT instruction_key, category, priority, title, content 
FROM ai_instructions 
WHERE is_active = true 
ORDER BY priority;
```

AI loads and follows these instructions for:
- Stock alerts (low qty)
- Order alerts (pending > 24 hours)
- DN validation rules
- Pickup tracking

## Running the AI Module

### 1. Initialize Database
```bash
# Connect to PostgreSQL and run AI schema
psql -h localhost -U postgres -d godam -f backend-java/ai_schema.sql
```

This creates:
- AI tables (ai_instructions, daily_reports, etc.)
- `ai_readonly` role with SELECT permissions
- Report templates

### 2. Start Services
```bash
cd backend-java/ai-service

# Copy environment
cp .env.example .env

# Start Docker services
./deploy-ai.sh start
```

### 3. Test Queries
```bash
# Health check
curl http://localhost:8001/health

# System summary
curl http://localhost:8001/summary

# Chat with AI
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me stock levels for part ABC"}'

# Generate report
curl -X POST http://localhost:8001/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"report_type": "daily_summary", "days": 7}'
```

## Configuration

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=godam
AI_DB_USER=ai_readonly
AI_DB_PASSWORD=ai_readonly_secure_2024

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

### Docker Services
- `ollama:11434` - LLM service
- `ai-service:8001` - API service
- `godam-db:5432` - PostgreSQL (external)

## File Structure
```
backend-java/
├── ai-service/
│   ├── main.py              # FastAPI application
│   ├── ollama_client.py     # LLM integration
│   ├── database.py          # Read-only queries
│   ├── config.py            # Configuration
│   ├── Dockerfile           # Container
│   ├── docker-compose.yml   # Stack config
│   ├── deploy-ai.sh         # Deployment script
│   ├── requirements.txt     # Python deps
│   ├── .env.example         # Env template
│   └── README.md            # Documentation
├── ai_schema.sql            # DB initialization
web-admin/src/services/ai.ts # Frontend client
```

## Eligiblity for SQL Queries

The AI module is **fully eligible** to run SQL queries because:

1. **Read-Only Role**: Uses dedicated PostgreSQL user with only SELECT permissions
2. **Query Validation**: Blocks dangerous operations at application level
3. **Timeout Protection**: Prevents long-running queries
4. **No Business Logic**: AI receives query results, never executes DML
5. **Audit Trail**: All queries logged in `ai_activity_log`

The `ai_readonly` role has been granted:
```sql
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_readonly;
-- No INSERT, UPDATE, DELETE grants
```

This ensures the AI can analyze data but cannot modify any business records.

