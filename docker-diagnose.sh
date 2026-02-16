#!/bin/bash

# Docker Diagnostic Script - See You Toon
# Use this to diagnose connection issues

echo "════════════════════════════════════════════════════════════"
echo "Docker Diagnostic Report - See You Toon"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "1. SERVICE STATUS"
echo "───────────────────────────────────────────────────────────"
docker-compose ps
echo ""

echo "2. CONTAINER HEALTH"
echo "───────────────────────────────────────────────────────────"
echo "Checking individual service health..."
echo ""
echo "MySQL Health:"
docker-compose exec -T mysql mysqladmin ping -u appuser -pappuser_password 2>/dev/null && echo "✓ MySQL is responsive" || echo "✗ MySQL not responding"
echo ""

echo "Redis Health:"
docker-compose exec -T redis redis-cli -a redis_password ping 2>/dev/null && echo "✓ Redis is responsive" || echo "✗ Redis not responding"
echo ""

echo "3. APPLICATION LOGS"
echo "───────────────────────────────────────────────────────────"
echo "Last 30 lines of app logs:"
docker-compose logs --tail=30 app
echo ""

echo "4. NETWORK CONNECTIVITY"
echo "───────────────────────────────────────────────────────────"
echo "Testing app → mysql connectivity:"
docker-compose exec -T app ping -c 2 mysql 2>&1 | head -5
echo ""

echo "Testing app → redis connectivity:"
docker-compose exec -T app ping -c 2 redis 2>&1 | head -5
echo ""

echo "5. ENVIRONMENT VARIABLES IN APP"
echo "───────────────────────────────────────────────────────────"
docker-compose exec -T app env | grep -E "DB_|REDIS_|NODE_ENV|PORT"
echo ""

echo "6. APPLICATION PORT BINDING"
echo "───────────────────────────────────────────────────────────"
docker-compose exec -T app netstat -tlnp 2>/dev/null | grep 3000 || echo "Port 3000 status: Check logs above"
echo ""

echo "7. DOCKER RESOURCE USAGE"
echo "───────────────────────────────────────────────────────────"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

echo "8. VOLUMES & DATA"
echo "───────────────────────────────────────────────────────────"
docker volume ls | grep see-you-toon
echo ""

echo "════════════════════════════════════════════════════════════"
echo "TROUBLESHOOTING STEPS"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "If app is not responding:"
echo "1. Check if MySQL is healthy: docker-compose logs mysql"
echo "2. Check if Redis is healthy: docker-compose logs redis"
echo "3. Check app logs: docker-compose logs -f app"
echo "4. Verify port mapping: docker-compose port app 3000"
echo "5. Test with curl: curl http://localhost:3000"
echo ""
echo "If database connection fails:"
echo "1. Verify MySQL is running: docker-compose ps mysql"
echo "2. Test MySQL: docker-compose exec mysql mysql -u appuser -pappuser_password -h localhost"
echo "3. Check DB_HOST env var: docker-compose exec app env | grep DB_"
echo ""
echo "If Redis connection fails:"
echo "1. Verify Redis is running: docker-compose ps redis"
echo "2. Test Redis: docker-compose exec redis redis-cli -a redis_password ping"
echo "3. Check REDIS_HOST env var: docker-compose exec app env | grep REDIS_"
echo ""
