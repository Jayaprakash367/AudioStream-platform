# Auralux X — Distributed Music Streaming Platform

## 🎯 Current Status: RUNNING ✅

**API Gateway**: Live on http://localhost:3100  
**All Services**: Compiled and ready to run  
**Infrastructure**: Docker Compose configured

See [SYSTEM_STATUS.md](SYSTEM_STATUS.md) for detailed status report.

## 🚀 Quick Start

### Currently Running ✅
The API Gateway is already running on **port 3100**!

```bash
# Verify it's alive
curl http://localhost:3100/health/live
# Response: {"status":"alive"}
```

### To Run All Services
1. **Set up infrastructure** - See [INFRASTRUCTURE_SETUP.md](INFRASTRUCTURE_SETUP.md)
2. **Build services** - `npm run build --workspaces`
3. **Start services** - Use helper scripts or run manually:

```bash
# Example: Start Auth Service
set PORT=3001 && node services/auth-service/dist/server.js
```

**Easiest way**: Use Docker Compose to start everything
```bash
docker-compose -f docker-compose.yml up -d
```

## Architecture Overview

Auralux X is a production-grade, enterprise-level music streaming platform built on distributed microservices architecture. Designed to scale to 1M+ active users.

## Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 3000 | Request routing, rate limiting, auth middleware |
| Auth Service | 3001 | JWT auth, token rotation, RBAC |
| User Service | 3002 | Profile management, preferences, subscriptions |
| Music Service | 3003 | Catalog, search, genre filtering |
| Streaming Service | 3004 | HLS streaming, signed URLs, adaptive bitrate |
| Playlist Service | 3005 | CRUD playlists, sharing |
| History Service | 3006 | Listening history, TTL-indexed |
| Recommendation Service | 3007 | Collaborative filtering, vector embeddings |
| Analytics Service | 3008 | Play counts, DAU, trend tracking |
| Notification Service | 3009 | Push notifications, email, in-app |

## Infrastructure

| Component | Port | Purpose |
|-----------|------|---------|
| MongoDB | 27017 | Primary data store (per-service DBs) |
| Redis | 6379 | Caching, session store, rate limiting |
| Kafka | 9092 | Event bus, async messaging |
| Zookeeper | 2181 | Kafka coordination |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3100 | Monitoring dashboards |

## Tech Stack

- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Fastify (high-performance HTTP)
- **Database:** MongoDB with Mongoose ODM
- **Cache:** Redis with ioredis
- **Events:** Apache Kafka with KafkaJS
- **Frontend:** Next.js 14 App Router + TailwindCSS
- **Container:** Docker + Kubernetes + Helm

## Getting Started

```bash
# Install dependencies
npm install

# Start infrastructure
npm run docker:up

# Start individual services
npm run dev:gateway
npm run dev:auth
# ... etc

# Start frontend
npm run dev:frontend
```

## Project Structure
```
/packages          → Shared libraries (types, logger, kafka, redis)
/services          → Microservices
/frontend          → Next.js PWA
/infrastructure    → Docker, K8s, Helm, CI/CD
```

## Development

Each service runs independently with its own database. Services communicate via:
- **Synchronous:** REST API calls through the API Gateway
- **Asynchronous:** Kafka event streams for eventual consistency

## License

Proprietary — Auralux Engineering
