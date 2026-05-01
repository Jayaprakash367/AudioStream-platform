#!/bin/bash
# Complete Application Startup Script
# Starts frontend, backend services, and displays status

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Auralux X - Complete Application Startup                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION found"
echo ""

# Start services in background
echo "Starting services..."
echo ""

# Create logs directory
mkdir -p logs

# Function to start service
start_service() {
    local service_name=$1
    local port=$2
    local service_path=$3
    
    echo -e "${BLUE}→${NC} Starting $service_name (port $port)..."
    cd "$service_path"
    npm run dev > "../../logs/${service_name}.log" 2>&1 &
    echo $! > "../../logs/${service_name}.pid"
    cd - > /dev/null
}

# Start Frontend
echo -e "${BLUE}→${NC} Starting Frontend (port 3000)..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
echo $! > ../logs/frontend.pid
cd - > /dev/null

# Wait a bit for frontend to start
sleep 3

# Start API Gateway
start_service "API Gateway" "3100" "services/api-gateway"

# Wait for API Gateway to start
sleep 2

# Start other services
start_service "Auth Service" "3001" "services/auth-service"
start_service "User Service" "3002" "services/user-service"
start_service "Music Service" "3003" "services/music-service"
start_service "Streaming Service" "3004" "services/streaming-service"

sleep 2

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     Services Started                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓${NC} Frontend:           ${BLUE}http://localhost:3000${NC}"
echo -e "${GREEN}✓${NC} API Gateway:        ${BLUE}http://localhost:3100${NC}"
echo -e "${GREEN}✓${NC} Auth Service:       ${BLUE}http://localhost:3001${NC}"
echo -e "${GREEN}✓${NC} User Service:       ${BLUE}http://localhost:3002${NC}"
echo -e "${GREEN}✓${NC} Music Service:      ${BLUE}http://localhost:3003${NC}"
echo -e "${GREEN}✓${NC} Streaming Service:  ${BLUE}http://localhost:3004${NC}"
echo ""
echo "📋 Logs:"
echo "   Frontend:           logs/frontend.log"
echo "   API Gateway:        logs/api-gateway.log"
echo "   Auth Service:       logs/auth-service.log"
echo "   User Service:       logs/user-service.log"
echo "   Music Service:      logs/music-service.log"
echo "   Streaming Service:  logs/streaming-service.log"
echo ""
echo "🛑 To stop all services, press Ctrl+C"
echo ""

# Keep script running
wait
