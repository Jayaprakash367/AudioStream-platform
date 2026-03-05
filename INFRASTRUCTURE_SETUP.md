# Setting Up Development Infrastructure

To run all Auralux X microservices locally without Docker, you need MongoDB, Redis, and Kafka.

## Quick Setup Guide

### Option 1: Install via Windows Package Managers (Easiest)

#### MongoDB
```powershell
# Using Chocolatey
choco install mongodb-community

# Using Windows Subsystem for Linux (WSL)
# In WSL terminal:
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
```

#### Redis
```powershell
# Using Chocolatey
choco install redis-64

# Start Redis in a new terminal:
redis-server

# Or using WSL:
# sudo apt-get install -y redis-server
# sudo systemctl start redis-server
```

#### Kafka (Optional - for advanced messaging)
Kafka is optional for basic functionality. Services gracefully degrade without it.

```powershell
# Download from https://kafka.apache.org/quickstart
# Or use WSL:
# sudo apt-get install -y kafka zookeeper
```

### Option 2: Use Docker (Recommended - Automatic Setup)

```powershell
# Install Docker Desktop from https://www.docker.com/products/docker-desktop

# Run entire infrastructure:
docker-compose -f docker-compose.yml up -d

# This starts:
# - MongoDB on port 27017
# - Redis on port 6379
# - Kafka on port 9092
# - Zookeeper on port 2181
# - Prometheus on port 9090
# - Grafana on port 3000
# - MailHog (test email server) on port 1025/8025
```

### Option 3: Use WSL2 with Docker (Windows 10/11)

```powershell
# Install Docker Desktop with WSL2 backend

# In PowerShell:
wsl --install

# Then use docker-compose as in Option 2
```

## Verify Installation

### Check MongoDB
```powershell
# Connect to MongoDB
mongo

# In MongoDB shell:
> show dbs
# Should list databases
```

### Check Redis
```powershell
# Connect to Redis
redis-cli

# In Redis CLI:
> ping
# Should return: PONG
```

### Check Kafka (if installed)
```bash
# List topics
kafka-topics.sh --list --bootstrap-server localhost:9092
```

## Running Services After Setup

Once infrastructure is running, start services in separate terminals:

```powershell
# Terminal 1 - API Gateway
set PORT=3100 && node services/api-gateway/dist/server.js

# Terminal 2 - Auth Service
set PORT=3001 && node services/auth-service/dist/server.js

# Terminal 3 - User Service  
set PORT=3002 && node services/user-service/dist/server.js

# Terminal 4 - Music Service
set PORT=3003 && node services/music-service/dist/server.js

# ... etc for other services
```

## Docker Compose Services

The `docker-compose.yml` file includes:

```yaml
Services:
  - mongodb (27017) - Document database
  - redis (6379) - Cache & session store
  - kafka (9092) - Event message bus
  - zookeeper (2181) - Kafka coordinator
  - prometheus (9090) - Metrics collection
  - grafana (3000) - Dashboard visualization
  - mailhog (1025/8025) - Email testing
```

## Useful Commands

### Docker Compose
```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Reset everything (warning: deletes data)
docker-compose down -v
```

### MongoDB
```bash
# Connect to local MongoDB
mongo mongodb://localhost:27017

# List all databases
show dbs

# Create test database
use test_db

# Insert test data
db.users.insertOne({name: "Test User", email: "test@example.com"})
```

### Redis
```bash
# Connect to local Redis
redis-cli

# Set a test key
SET test_key "test_value"

# Get the key
GET test_key

# List all keys
KEYS *

# Monitor commands in real-time
MONITOR
```

## Troubleshooting

### Port Already in Use
```powershell
# Find process using port 27017 (MongoDB)
netstat -ano | findstr :27017

# Kill process by PID
taskkill /PID <pid> /F
```

### MongoDB Won't Connect
```bash
# Check if MongoDB is running
# On Windows: Check Services (services.msc) for MongoDB
# On WSL: sudo systemctl status mongod
# On Docker: docker-compose ps

# Clear MongoDB data and restart
docker-compose down -v
docker-compose up -d
```

### Redis Connection Refused
```powershell
# Verify Redis is running
redis-cli ping
# Should return: PONG

# If not running and using Chocolatey:
redis-server

# If using Docker:
docker-compose up -d redis
```

## Next Steps

1. **Choose infrastructure option** (Docker Compose is easiest)
2. **Start infrastructure** - Services will appear in logs when ready
3. **Build services** - `npm run build --workspaces`
4. **Start services** - Run each service in its own terminal
5. **Test API** - Query http://localhost:3100/health/live

## Performance Tips

- **Docker**: Best performance, all services properly isolated
- **WSL2**: Good balance of convenience and performance
- **Windows native**: Simpler setup but may have slower file I/O

## Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Docker Getting Started](https://docs.docker.com/get-started/)
