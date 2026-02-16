# Docker Setup Guide - See You Toon

Complete guide for building and running the See You Toon application using Docker and Docker Compose.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Detailed Setup Instructions](#detailed-setup-instructions)
- [Service Details](#service-details)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

## Prerequisites

### System Requirements

- **Docker**: Version 20.10 or higher
  - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: Version 1.29 or higher
  - [Install Docker Compose](https://docs.docker.com/compose/install/)
- **Disk Space**: At least 5GB free
- **RAM**: Minimum 4GB, recommended 8GB

### Verification

```bash
# Check Docker version
docker --version
# Expected output: Docker version 20.10.x or higher

# Check Docker Compose version
docker-compose --version
# Expected output: Docker Compose version 1.29.x or higher

# Verify Docker daemon is running
docker ps
```

## Quick Start

### 1. Clone or Navigate to Project

```bash
cd see-you-toon1
```

### 2. Build and Start Services

```bash
# Build and start all services in the background
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Access the Application

- **Application**: http://localhost:3000
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

### 4. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (full cleanup)
docker-compose down -v
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           Docker Network (see-you-toon-network)     │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐  ┌────────────┐  ┌────────────┐  │
│  │   NestJS     │  │   MySQL    │  │    Redis   │  │
│  │   App        │  │  Database  │  │    Cache   │  │
│  │              │  │            │  │            │  │
│  │ :3000        │  │ :3306      │  │ :6379      │  │
│  └──────────────┘  └────────────┘  └────────────┘  │
│        ▲                 ▲                 ▲         │
│        └─────────────────┼─────────────────┘         │
│                          │                           │
│              Internal Service Discovery              │
│                                                       │
└─────────────────────────────────────────────────────┘
         │
         │ Published Ports
         ▼
    localhost:3000
    localhost:3306
    localhost:6379
```

## Detailed Setup Instructions

### Step 1: Verify Project Files

Ensure these files exist in your project root:

```
see-you-toon1/
├── Dockerfile                 # Multi-stage build configuration
├── docker-compose.yml         # Service orchestration
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
├── src/                      # Application source code
├── db/
│   └── schema.sql           # Database schema (auto-loaded)
└── ...
```

### Step 2: Configure Environment Variables

The `docker-compose.yml` includes default environment variables. To customize:

1. **Create a `.env` file** (optional):

```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=root_password
MYSQL_USER=appuser
MYSQL_PASSWORD=appuser_password
MYSQL_DATABASE=see_you_toon

# Redis Configuration
REDIS_PASSWORD=redis_password

# Application Configuration
NODE_ENV=production
PORT=3000
```

2. **Update `docker-compose.yml`** to use `.env`:

Replace the `environment:` section under `app:` service with:

```yaml
env_file:
  - .env
```

### Step 3: Build the Docker Image

```bash
# Build the image
docker-compose build

# Build with no cache (fresh build)
docker-compose build --no-cache

# View build progress
docker-compose build --progress=plain
```

### Step 4: Start the Services

```bash
# Start all services in detached mode
docker-compose up -d

# Start with live logs
docker-compose up

# Start specific service
docker-compose up -d mysql
docker-compose up -d redis
docker-compose up -d app
```

### Step 5: Verify Services are Running

```bash
# Check status
docker-compose ps

# Expected output:
# NAME                    COMMAND                  SERVICE     STATUS
# see-you-toon-redis      "redis-server ..."       redis       Up (healthy)
# see-you-toon-mysql      "docker-entrypoint..."   mysql       Up (healthy)
# see-you-toon-app        "node dist/main"         app         Up (healthy)

# Check logs
docker-compose logs app
docker-compose logs mysql
docker-compose logs redis
```

### Step 6: Test the Application

```bash
# Test API endpoint
curl http://localhost:3000

# Test with verbose output
curl -v http://localhost:3000

# Using bash inside the container
docker-compose exec app sh
npm run test
```

## Service Details

### Redis Service

**Container**: `see-you-toon-redis`
**Image**: `redis:7-alpine`
**Port**: 6379
**Features**:
- Persistent storage (AOF enabled)
- Authentication required
- Health checks enabled
- Data volume: `redis-data`

**Access Redis CLI**:

```bash
docker-compose exec redis redis-cli
# Inside Redis CLI
auth redis_password
ping
keys *
```

### MySQL Service

**Container**: `see-you-toon-mysql`
**Image**: `mysql:8.0`
**Port**: 3306
**Features**:
- Automatic schema initialization
- User authentication
- Health checks enabled
- Data volume: `mysql-data`

**Access MySQL CLI**:

```bash
# Using mysql command
docker-compose exec mysql mysql -u appuser -pappuser_password see_you_toon

# Using root user
docker-compose exec mysql mysql -u root -proot_password
```

### NestJS Application Service

**Container**: `see-you-toon-app`
**Image**: Built from Dockerfile
**Port**: 3000
**Environment Variables**:
- `NODE_ENV=production`
- `DATABASE_HOST=mysql`
- `REDIS_HOST=redis`

**Access Application**:

```bash
# View logs
docker-compose logs -f app

# Execute commands in container
docker-compose exec app npm run test
docker-compose exec app npm run build

# Open shell in container
docker-compose exec app sh
```

## Common Commands

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mysql
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100

# With timestamps
docker-compose logs -f --timestamps
```

### Managing Services

```bash
# Start services
docker-compose up -d

# Stop services (keeps data)
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart app

# Remove stopped containers
docker-compose rm

# View resource usage
docker-compose stats
```

### Database Operations

```bash
# Create database backup
docker-compose exec mysql mysqldump -u appuser -pappuser_password see_you_toon > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u appuser -pappuser_password see_you_toon < backup.sql

# Run migrations
docker-compose exec app npm run migrate
```

### Debugging

```bash
# Inspect running container
docker inspect see-you-toon-app

# Check network connectivity
docker-compose exec app ping redis
docker-compose exec app ping mysql

# Check environment variables
docker-compose exec app env

# View container file system
docker-compose exec app ls -la /app
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Error: "bind: address already in use"

# Find process using port
lsof -i :3000
lsof -i :3306
lsof -i :6379

# Kill process
kill -9 <PID>

# Or change ports in docker-compose.yml
# Modify ports: "8000:3000"
```

#### 2. Services Not Connecting

```bash
# Check container networking
docker network ls
docker network inspect see-you-toon-network

# Verify service names are correct in environment variables
# They should match service names in docker-compose.yml:
# - redis (not 127.0.0.1 or localhost)
# - mysql (not 127.0.0.1 or localhost)

# Test connectivity between containers
docker-compose exec app ping mysql
docker-compose exec app ping redis
```

#### 3. Database Connection Failed

```bash
# Check MySQL is running
docker-compose logs mysql

# Verify credentials
docker-compose exec mysql mysql -u appuser -pappuser_password -h localhost

# Check port binding
docker-compose port mysql 3306

# Restart MySQL
docker-compose restart mysql
```

#### 4. Application Not Starting

```bash
# Check logs for errors
docker-compose logs app

# Verify environment variables
docker-compose exec app env | grep DATABASE
docker-compose exec app env | grep REDIS

# Check if dist directory exists
docker-compose exec app ls -la /app/dist

# Rebuild application
docker-compose rebuild app
docker-compose up -d app
```

#### 5. Out of Disk Space

```bash
# Clean up Docker resources
docker system prune

# Remove volumes too
docker system prune -a --volumes

# Check disk usage
docker system df
```

### Debugging Techniques

```bash
# Interactive shell
docker-compose exec app sh

# Execute command in running container
docker-compose exec app npm run test:watch

# View detailed container info
docker-compose exec app cat /etc/os-release

# Check network interfaces
docker-compose exec app ip addr

# Monitor real-time resource usage
docker stats see-you-toon-app
```

## Production Deployment

### Security Recommendations

1. **Change Default Passwords**:

```yaml
# In docker-compose.yml
environment:
  MYSQL_ROOT_PASSWORD: $(openssl rand -base64 32)
  MYSQL_PASSWORD: $(openssl rand -base64 32)
  REDIS_PASSWORD: $(openssl rand -base64 32)
```

2. **Use .env Files** (not in git):

```bash
# .gitignore
.env
.env.local
.env.*.local
```

3. **Remove Debug Ports** from Production:

```yaml
# Comment out ports for internal-only services
# redis:
#   ports:
#     - "6379:6379"
```

4. **Set Resource Limits**:

```yaml
app:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Health Monitoring

```bash
# Health status
docker-compose ps

# Detailed health info
docker inspect see-you-toon-app | grep -A 5 '"Health"'

# Setup monitoring (example with Prometheus)
# Add monitoring service to docker-compose.yml
```

### Backup Strategy

```bash
# Daily database backup
docker-compose exec mysql mysqldump -u appuser -pappuser_password see_you_toon > backup-$(date +%Y%m%d).sql

# Backup all volumes
docker run --rm -v mysql-data:/data -v $(pwd):/backup ubuntu tar czf /backup/mysql-backup-$(date +%Y%m%d).tar.gz /data
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [NestJS Docker Guide](https://docs.nestjs.com/deployment/docker)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)
- [Redis Docker Image](https://hub.docker.com/_/redis)

## Support

For issues or questions:

1. Check logs: `docker-compose logs -f`
2. Review [Troubleshooting](#troubleshooting) section
3. Verify Docker and Docker Compose versions
4. Check Docker daemon is running
5. Ensure all required files exist in project root

---

**Last Updated**: February 2026
**Docker Version**: 20.10+
**Docker Compose Version**: 1.29+
