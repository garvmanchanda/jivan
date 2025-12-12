# Jivan Infrastructure

Infrastructure setup for local development and deployment.

## Local Development with Docker Compose

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Quick Start

1. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your credentials
```

2. **Start all services**:
```bash
docker-compose up -d
```

3. **View logs**:
```bash
docker-compose logs -f
```

4. **Run migrations**:
```bash
docker-compose exec backend-api npm run migrate
```

5. **Stop services**:
```bash
docker-compose down
```

### Services

- **postgres**: PostgreSQL database on port 5432
- **redis**: Redis cache/queue on port 6379
- **backend-api**: API server on port 3000
- **backend-worker**: Background job processor

### Accessing Services

- API: http://localhost:3000/api/v1
- Health check: http://localhost:3000/api/v1/health
- Database: localhost:5432
- Redis: localhost:6379

## Production Deployment

See `/infrastructure/kubernetes` for Kubernetes deployment configurations or `/infrastructure/terraform` for AWS infrastructure provisioning.

## Monitoring

Access logs from specific services:
```bash
docker-compose logs -f backend-api
docker-compose logs -f backend-worker
docker-compose logs -f postgres
docker-compose logs -f redis
```

## Troubleshooting

**Database connection issues**:
```bash
docker-compose exec postgres psql -U jivan_user -d jivan_db
```

**Redis connection issues**:
```bash
docker-compose exec redis redis-cli
```

**Rebuild containers**:
```bash
docker-compose build --no-cache
docker-compose up -d
```

**Clean restart**:
```bash
docker-compose down -v
docker-compose up -d
```

