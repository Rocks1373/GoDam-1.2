# AI Service - Main Application
import json
import logging
import sys
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import config
from database import db
from ollama_client import ollama_client, GoDAMPromptBuilder, GODAM_SYSTEM_PROMPT

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOGGING_CONFIG["level"]),
    format=config.LOGGING_CONFIG["format"],
    handlers=[
        logging.StreamHandler(sys.stdout),
    ]
)
logger = logging.getLogger(__name__)

# Lifespan context
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {config.AI_CONFIG['service_name']} v{config.AI_CONFIG['version']}")
    
    # Check Ollama health
    health = await ollama_client.check_health()
    if health.get("healthy"):
        logger.info(f"Ollama connected: {health.get('loaded_model', 'unknown')}")
    else:
        logger.warning("Ollama not available - AI responses will fail")
    
    yield
    logger.info("Shutting down AI service")

# Create FastAPI app
app = FastAPI(
    title="GoDAM AI Service",
    description="Enterprise AI Assistant for Warehouse & Logistics",
    version=config.AI_CONFIG["version"],
    lifespan=lifespan,
)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency for prompt builder
async def get_prompt_builder():
    return GoDAMPromptBuilder(db)

# Pydantic models
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    context_type: Optional[str] = None
    include_orders: bool = False
    include_stock: bool = False
    include_movements: bool = False

class ChatResponse(BaseModel):
    response: str
    status: str
    model: str
    tokens_used: Dict[str, int]
    timestamp: str

class ReportRequest(BaseModel):
    report_type: str = Field(..., pattern="^(daily_summary|pending_report|exception_report|stock_audit)$")
    days: int = Field(default=7, ge=1, le=90)
    format: str = Field(default="summary", pattern="^(summary|list|exception|audit)$")

class ReportResponse(BaseModel):
    report_type: str
    title: str
    summary: str
    details: Dict[str, Any]
    exceptions: List[Dict[str, Any]]
    generated_at: str

class AnalysisRequest(BaseModel):
    query_type: str = Field(..., pattern="^(orders|stock|movements|summary)$")
    filters: Optional[Dict[str, Any]] = None
    limit: int = Field(default=100, ge=1, le=1000)

class HealthResponse(BaseModel):
    service: str
    status: str
    ollama: Dict[str, Any]
    database: str
    timestamp: str

class ActivityLogEntry(BaseModel):
    user: Optional[str] = None
    command: str
    intent: str
    response_text: str
    executed_actions: List[str]
    result: str


# Helper function to extract user name from message
def extract_user_name(message: str) -> Optional[str]:
    """Extract user's name from their message."""
    patterns = [
        r"my name is\s+(\w+)",
        r"I am\s+(\w+)",
        r"I'm\s+(\w+)",
        r"call me\s+(\w+)",
        r"this is\s+(\w+)",
        r"it's\s+(\w+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            return match.group(1)
    return None


# Helper function to log AI activity
def log_ai_activity(
    user: Optional[str],
    command: str,
    intent: str,
    response_text: str,
    actions: List[str],
    result: str
):
    """Log AI activity for auditing."""
    try:
        db.execute_query(
            """INSERT INTO ai_activity_log 
               (user, command, ai_intent, ai_response, executed_actions, result, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, NOW())""",
            {
                "user": user,
                "command": command,
                "intent": intent,
                "response_text": response_text[:5000],
                "actions": json.dumps(actions),
                "result": result,
            },
            fetch=False
        )
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")


# API Endpoints
@app.get("/", tags=["Root"])
async def root():
    return {
        "service": config.AI_CONFIG["service_name"],
        "version": config.AI_CONFIG["version"],
        "status": "running"
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check service health."""
    ollama_health = await ollama_client.check_health()
    
    db_status = "connected"
    try:
        db.execute_query("SELECT 1")
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "service": config.AI_CONFIG["service_name"],
        "status": "healthy" if ollama_health.get("healthy") else "degraded",
        "ollama": {
            "healthy": ollama_health.get("healthy", False),
            "model": config.OLLAMA_CONFIG["model"],
            "loaded": ollama_health.get("loaded_model"),
        },
        "database": db_status,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(
    request: ChatRequest,
    prompt_builder: GoDAMPromptBuilder = Depends(get_prompt_builder),
    x_user: Optional[str] = Header(None)
):
    """Chat with AI assistant."""
    # Build context based on request
    context_data = {}
    if request.include_orders:
        context_data["orders"] = db.fetch_orders_data(days=7, limit=50)
    if request.include_stock:
        context_data["stock"] = db.fetch_stock_data(limit=50)
    if request.include_movements:
        context_data["movements"] = db.fetch_stock_movements(days=3, limit=50)
    
    # Build prompt
    prompt_data = await prompt_builder.build_chat_prompt(
        user_query=request.message,
        context=context_data if context_data else None
    )
    
    # Get relevant instructions for context
    instructions = db.fetch_ai_instructions(active_only=True)
    instruction_text = "\n".join([
        f"- [{i.get('category')}] {i.get('title')}: {i.get('content', '')[:150]}"
        for i in instructions[:5]
    ])
    
    # Extract user name from message or header
    user_name = x_user or extract_user_name(request.message)
    
    # Create personalized system prompt
    if user_name:
        personalization = f"\n\n## Personalization\nThe user's name is {user_name}. Address them by name throughout your response. Be friendly and professional."
    else:
        personalization = ""
    
    # Combine system prompt with instructions
    full_system = GODAM_SYSTEM_PROMPT + personalization + f"\n\n## Current Instructions\n{instruction_text}"
    
    # Generate response
    result = await ollama_client.generate(
        prompt=request.message,
        system_prompt=full_system,
        context=[{"role": "user", "content": prompt_data["user_prompt"]}]
    )
    
    if result.get("success"):
        log_ai_activity(
            user=user_name,
            command=request.message[:200],
            intent="chat",
            response_text=result.get("response", ""),
            actions=["data_query"],
            result="success"
        )
        
        return {
            "response": result.get("response", ""),
            "status": "success",
            "model": result.get("model"),
            "tokens_used": result.get("tokens", {}),
            "timestamp": datetime.now().isoformat(),
        }
    else:
        log_ai_activity(
            user=user_name,
            command=request.message[:200],
            intent="chat",
            response_text=result.get("error", "Unknown error"),
            actions=[],
            result="error"
        )
        raise HTTPException(status_code=503, detail=result.get("error", "AI service unavailable"))


@app.post("/analyze", tags=["Analysis"])
async def analyze(
    request: AnalysisRequest,
    x_user: Optional[str] = Header(None)
):
    """Analyze data and provide insights."""
    try:
        data = {}
        
        if request.query_type == "orders":
            data["orders"] = db.fetch_orders_data(
                picking_status=request.filters.get("status") if request.filters else None,
                days=request.filters.get("days", 7) if request.filters else 7,
                limit=request.limit
            )
            data["summary"] = db.get_order_summary()
            
        elif request.query_type == "stock":
            data["stock"] = db.fetch_stock_data(
                warehouse_no=request.filters.get("warehouse") if request.filters else None,
                limit=request.limit
            )
            data["summary"] = db.get_stock_summary()
            
        elif request.query_type == "movements":
            data["movements"] = db.fetch_stock_movements(
                part_number=request.filters.get("part_number") if request.filters else None,
                days=request.filters.get("days", 7) if request.filters else 7,
                limit=request.limit
            )
            
        elif request.query_type == "summary":
            data["order_summary"] = db.get_order_summary()
            data["stock_summary"] = db.get_stock_summary()
        
        log_ai_activity(
            user=x_user,
            command=f"analyze {request.query_type}",
            intent="analysis",
            response_text=f"Retrieved {len(data)} data categories",
            actions=[f"fetch_{request.query_type}"],
            result="success"
        )
        
        return {
            "status": "success",
            "query_type": request.query_type,
            "data": data,
            "timestamp": datetime.now().isoformat(),
        }
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reports/generate", response_model=ReportResponse, tags=["Reports"])
async def generate_report(
    request: ReportRequest,
    prompt_builder: GoDAMPromptBuilder = Depends(get_prompt_builder),
    x_user: Optional[str] = Header(None)
):
    """Generate operational report."""
    try:
        data = {}
        
        if request.report_type == "daily_summary":
            data["orders"] = db.fetch_orders_data(days=request.days, limit=500)
            data["summary"] = db.get_order_summary()
            
        elif request.report_type == "pending_report":
            data["orders"] = db.fetch_orders_data(
                picking_status="PENDING",
                days=request.days,
                limit=500
            )
            for order in data["orders"]:
                if order.get("created_at"):
                    created = order["created_at"]
                    if isinstance(created, str):
                        created = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    order["hours_pending"] = (datetime.now() - created).total_seconds() / 3600
            
        elif request.report_type == "exception_report":
            data["orders"] = db.fetch_orders_data(days=request.days, limit=500)
            data["exceptions"] = [
                o for o in data["orders"]
                if (o.get("picking_status") != "COMPLETED" and 
                    (datetime.now() - o.get("created_at", datetime.now())).days > 2)
            ]
            
        elif request.report_type == "stock_audit":
            data["stock"] = db.fetch_stock_data(limit=100)
            data["movements"] = db.fetch_stock_movements(days=7, limit=100)
        
        prompt_data = await prompt_builder.build_report_prompt(
            report_type=request.report_type,
            data=data
        )
        
        result = await ollama_client.generate(
            prompt=prompt_data["user_prompt"],
            system_prompt=prompt_data["system_prompt"]
        )
        
        ai_summary = result.get("response", "Report generated successfully.")
        
        log_ai_activity(
            user=x_user,
            command=f"generate {request.report_type}",
            intent="report",
            response_text=ai_summary[:1000],
            actions=["fetch_data", "generate_ai_summary"],
            result="success" if result.get("success") else "error"
        )
        
        return {
            "report_type": request.report_type,
            "title": f"{request.report_type.replace('_', ' ').title()} - {datetime.now().strftime('%Y-%m-%d')}",
            "summary": ai_summary,
            "details": data,
            "exceptions": data.get("exceptions", []),
            "generated_at": datetime.now().isoformat(),
        }
        
    except Exception as e:
        logger.error(f"Report generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reports/history", tags=["Reports"])
async def get_reports_history(
    report_type: Optional[str] = None,
    days: int = 30
):
    """Get historical reports."""
    try:
        reports = db.fetch_daily_reports(
            report_type=report_type,
            days=days,
            limit=50
        )
        return {
            "status": "success",
            "reports": reports,
            "count": len(reports),
        }
    except Exception as e:
        logger.error(f"Reports history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/instructions", tags=["Instructions"])
async def get_instructions(
    category: Optional[str] = None
):
    """Get AI instructions from database."""
    try:
        instructions = db.fetch_ai_instructions(category=category, active_only=True)
        return {
            "status": "success",
            "instructions": instructions,
            "count": len(instructions),
        }
    except Exception as e:
        logger.error(f"Instructions fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/summary", tags=["Summary"])
async def get_system_summary():
    """Get overall system summary."""
    try:
        order_summary = db.get_order_summary()
        stock_summary = db.get_stock_summary()
        
        return {
            "status": "success",
            "orders": order_summary,
            "stock": stock_summary,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
    )

