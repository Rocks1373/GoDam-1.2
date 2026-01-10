# GoDAM AI Module - COMPLETE

## Overview
A containerized AI module for GoDAM warehouse & logistics application using Ollama (offline LLM) with read-only PostgreSQL access.

## Files Created

### Core AI Service
- `ai-service/main.py` - FastAPI application with chat, analysis, and report endpoints
- `ai-service/ollama_client.py` - Ollama LLM integration
- `ai-service/database.py` - Read-only database access layer
- `ai-service/config.py` - Configuration management

### Docker & Deployment
- `ai-service/Dockerfile` - AI service container
- `ai-service/docker-compose.yml` - Full stack with Ollama
- `ai-service/deploy-ai.sh` - Deployment script
- `ai-service/.env.example` - Environment template

### Database
- `ai_schema.sql` - AI tables, instructions, and read-only user

### Integration
- `web-admin/src/services/ai.ts` - API client for web admin

## Quick Start

```bash
# 1. Initialize database
psql -h localhost -U godam -d godam -f backend-java/ai_schema.sql

# 2. Start services
cd backend-java/ai-service
./deploy-ai.sh start

# 3. Test
curl http://localhost:8001/health
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How many orders are pending?"}'
```

## Features
- Intelligent chat with warehouse context
- Daily/pending/exception/stock audit reports
- Issue detection and root cause analysis
- Step-by-step user guidance
- Complete audit logging
- Read-only security model

## Endpoints
- `POST /chat` - Chat with AI
- `POST /analyze` - Analyze data
- `POST /reports/generate` - Generate reports
- `GET /summary` - System overview
- `GET /health` - Service health

