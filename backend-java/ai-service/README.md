op# GoDAM AI Service

Enterprise AI Assistant for Warehouse & Logistics Operations

## Overview

The GoDAM AI module is a containerized AI solution that provides intelligent assistance for warehouse operations using an offline LLM (Ollama). It analyzes database data, generates reports, and guides users through warehouse operations.

## Features

- **Intelligent Chat**: Ask questions about orders, stock, and operations
- **Automated Reports**: Daily summaries, pending orders, exception reports
- **Issue Detection**: Identifies operational problems and risks
- **Step-by-Step Guidance**: Provides actionable recommendations
- **Read-Only Access**: Secure, non-destructive AI operations
- **Audit Logging**: Tracks all AI interactions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GoDAM AI Service                         │
├─────────────────────────────────────────────────────────────┤
│  FastAPI Layer          │  Ollama Client    │  Database     │
│  - Chat endpoint        │  - llama3.1:8b    │  - Read-only  │
│  - Analysis endpoint    │  - Offline LLM    │  - AI tables  │
│  - Report generation    │  - Dockerized     │  - Auditing   │
└─────────────────────────┴───────────────────┴───────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
    ┌─────────────────────────────────────────────────────┐
    │              Docker Compose Network                  │
    │  ┌───────────┐  ┌───────────┐  ┌───────────────┐  │
    │  │ AI Service│  │  Ollama   │  │ PostgreSQL    │  │
    │  │  :8001    │  │  :11434   │  │  :5432        │  │
    │  └───────────┘  └───────────┘  └───────────────┘  │
    └─────────────────────────────────────────────────────┘
```

## Requirements

- Docker & Docker Compose
- PostgreSQL database (existing GoDAM database)
- 8GB RAM minimum (16GB recommended)
- 10GB disk space for AI models

## Quick Start

### 1. Initialize Database

Run the AI schema against your PostgreSQL database:

```bash
psql -h localhost -U godam -d godam -f ai_schema.sql
```

### 2. Configure Environment

Create `.env` file with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=godam
AI_DB_USER=ai_readonly
AI_DB_PASSWORD=your_secure_password

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

### 3. Start Services

```bash
# Make deployment script executable
chmod +x deploy-ai.sh

# Start all services
./deploy-ai.sh start

# Check status
./deploy-ai.sh status
```

### 4. Test the Service

```bash
# Health check
curl http://localhost:8001/health

# Chat with AI
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How many orders are pending today?"}'

# Get system summary
curl http://localhost:8001/summary
```

## API Endpoints

### Chat
```
POST /chat
{
  "message": "Your question here",
  "include_orders": true,
  "include_stock": false,
  "include_movements": false
}
```

### Analysis
```
POST /analyze
{
  "query_type": "orders|stock|movements|summary",
  "filters": {"status": "PENDING"},
  "limit": 100
}
```

### Reports
```
POST /reports/generate
{
  "report_type": "daily_summary|pending_report|exception_report|stock_audit",
  "days": 7,
  "format": "summary"
}
```

### System Summary
```
GET /summary
```

### Instructions
```
GET /instructions?category=stock
```

## Database Tables

### Core Tables
- `ai_instructions` - Business rules and guidance
- `ai_feedback` - User feedback on AI responses
- `ai_context_cache` - Cached context for fast responses
- `daily_reports` - Generated reports storage
- `ai_report_templates` - Report generation templates
- `ai_activity_log` - Audit log of all AI actions

### Read-Only Access
The AI service uses a dedicated `ai_readonly` role with:
- SELECT access to all business tables
- INSERT/UPDATE only on activity tables
- 30-second query timeout
- No write access to business data

## Security Features

1. **Read-Only Database**: AI cannot modify business data
2. **Query Blocking**: Dangerous SQL operations are blocked
3. **Timeout Protection**: Queries limited to 30 seconds
4. **Audit Logging**: All AI actions are logged
5. **No Admin Access**: AI warns if admin rights needed

## Configuration

### Ollama Settings
```python
OLLAMA_CONFIG = {
    "base_url": "http://ollama:11434",
    "model": "llama3.1:8b",
    "temperature": 0.3,
    "max_tokens": 2048,
    "request_timeout": 120,
}
```

### AI Service Settings
```python
AI_CONFIG = {
    "service_name": "GoDAM AI Assistant",
    "version": "1.0.0",
    "default_context_size": 10,
    "max_context_size": 50,
    "cache_ttl_minutes": 5,
}
```

## Adding Custom Instructions

Insert business rules into `ai_instructions` table:

```sql
INSERT INTO ai_instructions (
    instruction_key, 
    category, 
    priority, 
    title, 
    content, 
    conditions
) VALUES (
    'custom_rule',
    'operations',
    10,
    'Custom Alert',
    'Your guidance text here...',
    '{"field": "status", "operator": "eq", "value": "CUSTOM"}'
);
```

## Troubleshooting

### Ollama not starting
```bash
# Check logs
docker compose logs ollama

# Verify port
curl http://localhost:11434/api/tags
```

### AI service unhealthy
```bash
# Check health
curl http://localhost:8001/health

# Check logs
docker compose logs ai-service
```

### Database connection failed
```bash
# Verify database is running
psql -h localhost -U godam -d godam -c "SELECT 1"

# Check credentials in .env
cat .env
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `./deploy-ai.sh start` | Start all services |
| `./deploy-ai.sh stop` | Stop all services |
| `./deploy-ai.sh restart` | Restart services |
| `./deploy-ai.sh logs` | View logs |
| `./deploy-ai.sh status` | Show status |
| `./deploy-ai.sh init-db` | Initialize database |

## License

Part of GoDAM Inventory Platform

