# AI Service Configuration
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# Database Configuration (Read-only access)
DATABASE_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "godam"),
    "user": os.getenv("AI_DB_USER", "ai_readonly"),
    "password": os.getenv("AI_DB_PASSWORD", "ai_readonly_secure_2024"),
    "statement_timeout": 30000,  # 30 seconds
}

# Ollama Configuration
OLLAMA_CONFIG = {
    "base_url": os.getenv("OLLAMA_BASE_URL", "http://ollama:11434"),
    "model": os.getenv("OLLAMA_MODEL", "llama3.1:8b"),
    "temperature": float(os.getenv("OLLAMA_TEMPERATURE", "0.3")),
    "max_tokens": int(os.getenv("OLLAMA_MAX_TOKENS", "2048")),
    "request_timeout": 120,  # 2 minutes
}

# AI Service Configuration
AI_CONFIG = {
    "service_name": "GoDAM AI Assistant",
    "version": "1.0.0",
    "default_context_size": 10,
    "max_context_size": 50,
    "cache_ttl_minutes": 5,
    "report_cache_hours": 24,
}

# Logging Configuration
LOGGING_CONFIG = {
    "level": os.getenv("LOG_LEVEL", "INFO"),
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": str(BASE_DIR / "logs" / "ai_service.log"),
}

# Report Configuration
REPORT_CONFIG = {
    "output_dir": DATA_DIR / "reports",
    "formats": ["json", "excel", "pdf"],
    "max_rows_export": 10000,
}

# Security Configuration
SECURITY_CONFIG = {
    "allowed_operations": ["chat", "report", "analyze", "summarize"],
    "blocked_keywords": ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "EXECUTE"],
    "max_query_length": 1000,
}

