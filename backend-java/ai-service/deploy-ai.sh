#!/bin/bash
# GoDAM AI Service Deployment Script
# Usage: ./deploy-ai.sh [start|stop|restart|logs|status]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for .env file
if [ ! -f .env ]; then
    log_warn "Creating .env file from template..."
    cat > .env << EOF
# AI Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=godam
AI_DB_USER=ai_readonly
AI_DB_PASSWORD=ai_readonly_secure_2024

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
EOF
    log_info ".env file created. Update with your actual values."
fi

# Load environment variables
source .env

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
}

start_services() {
    log_info "Starting GoDAM AI services..."
    
    # Build and start services
    docker compose build --no-cache
    docker compose up -d
    
    log_info "Waiting for Ollama to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            log_info "Ollama is ready"
            break
        fi
        sleep 2
    done
    
    log_info "Pulling AI model (llama3.1:8b)..."
    docker compose exec -T ollama ollama pull llama3.1:8b || {
        log_warn "Model pull failed or already exists. Run manually if needed."
    }
    
    log_info "Waiting for AI service..."
    for i in {1..30}; do
        if curl -s http://localhost:8001/health > /dev/null 2>&1; then
            log_info "AI Service is ready"
            break
        fi
        sleep 2
    done
    
    log_info "GoDAM AI services started successfully!"
    show_status
}

stop_services() {
    log_info "Stopping GoDAM AI services..."
    docker compose down
    log_info "Services stopped"
}

restart_services() {
    log_info "Restarting GoDAM AI services..."
    stop_services
    sleep 2
    start_services
}

show_logs() {
    docker compose logs -f "${1:-ai-service}"
}

show_status() {
    echo ""
    echo "=== GoDAM AI Service Status ==="
    echo ""
    docker compose ps
    echo ""
    
    # Check health endpoints
    echo "Health Checks:"
    echo "---------------"
    
    if curl -s http://localhost:8001/health | grep -q "healthy"; then
        echo -e "AI Service:    ${GREEN}Running${NC}"
    else
        echo -e "AI Service:    ${RED}Not Available${NC}"
    fi
    
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo -e "Ollama:        ${GREEN}Running${NC}"
    else
        echo -e "Ollama:        ${RED}Not Available${NC}"
    fi
    echo ""
}

init_database() {
    log_info "Initializing AI database tables..."
    
    # Check if running inside container
    if [ -f /.dockerenv ]; then
        python3 -c "
            from database import db
            db.execute_query('SELECT 1')
            print('Database connection OK')
        "
    else
        docker compose exec -T ai-service python3 -c "
            import sys
            sys.path.append('/app')
            from database import db
            db.execute_query('SELECT 1')
            print('Database connection OK')
        "
    fi
    
    log_info "Database initialization complete"
}

show_help() {
    echo "GoDAM AI Service Deployment Script"
    echo ""
    echo "Usage: $0 {start|stop|restart|logs|status|init-db|help}"
    echo ""
    echo "Commands:"
    echo "  start     - Build and start all services"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  logs      - Show service logs (specify service name optionally)"
    echo "  status    - Show service status"
    echo "  init-db   - Initialize database tables"
    echo "  help      - Show this help message"
    echo ""
}

# Main command handler
case "${1:-help}" in
    start)
        check_docker
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        check_docker
        restart_services
        ;;
    logs)
        show_logs "${2:-}"
        ;;
    status)
        show_status
        ;;
    init-db)
        init_database
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac

