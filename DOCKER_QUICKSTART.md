# Docker Quick Start - See You Toon

## 📋 Prerequisites

- Docker 20.10+ ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose 1.29+ ([Get Docker Compose](https://docs.docker.com/compose/install/))

## ✅ Verify Installation

```bash
docker --version
docker-compose --version
```

## 🚀 Get Started in 3 Steps

### 1. Build the Application

```bash
docker-compose build
```

### 2. Start Services

```bash
docker-compose up -d
```

### 3. Access the Application

- **App**: http://localhost:3000
- **MySQL**: localhost:3306 (user: appuser, password: appuser_password)
- **Redis**: localhost:6379 (password: redis_password)

## 📝 Check Status

```bash
docker-compose ps

# Expected output:
# NAME                    COMMAND                  SERVICE     STATUS
# see-you-toon-redis      redis-server ...         redis       Up (healthy)
# see-you-toon-mysql      docker-entrypoint...     mysql       Up (healthy)
# see-you-toon-app        node dist/main           app         Up (healthy)
```

## 🔍 View Logs

```bash
# All services
docker-compose logs -f

# Just the app
docker-compose logs -f app
```

## ⛔ Stop Everything

```bash
docker-compose down
```

## 🧹 Full Cleanup

```bash
docker-compose down -v
```

## 📚 More Commands

Use the helper script for common operations:

```bash
# Make it executable (Linux/Mac)
chmod +x docker.sh

# View all available commands
./docker.sh help

# Examples:
./docker.sh status      # Check service status
./docker.sh logs        # View logs
./docker.sh shell       # Access app shell
./docker.sh test        # Run tests
./docker.sh backup      # Backup database
./docker.sh health      # Health check all services
```

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Services Won't Start

```bash
# Check logs for errors
docker-compose logs

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Failed

```bash
# Test MySQL connection
docker-compose exec mysql mysql -u appuser -pappuser_password -h localhost

# View MySQL logs
docker-compose logs mysql
```

## 📖 Full Documentation

See [DOCKER_SETUP_GUIDE.md](DOCKER_SETUP_GUIDE.md) for complete setup, troubleshooting, and production deployment guide.

## 🎯 Common Tasks

### Run Tests

```bash
docker-compose exec app npm run test
```

### Run Linter

```bash
docker-compose exec app npm run lint
```

### Access MySQL

```bash
docker-compose exec mysql mysql -u appuser -pappuser_password see_you_toon
```

### Access Redis

```bash
docker-compose exec redis redis-cli -a redis_password
```

### Backup Database

```bash
docker-compose exec -T mysql mysqldump -u appuser -pappuser_password see_you_toon > backup.sql
```

### View Container Resources

```bash
docker stats see-you-toon-app
```

---

**That's it!** Your application is now running in Docker. For advanced configuration, see [DOCKER_SETUP_GUIDE.md](DOCKER_SETUP_GUIDE.md).
