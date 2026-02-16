#!/bin/bash

# Quick verification script for Docker setup
# Run this after: docker-compose up -d

echo "════════════════════════════════════════════════════════════"
echo "Docker Application Verification Script"
echo "════════════════════════════════════════════════════════════"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for checks
CHECKS_PASSED=0
CHECKS_FAILED=0

check_status() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((CHECKS_FAILED++))
  fi
}

echo "1. SERVICE STATUS"
echo "───────────────────────────────────────────────────────────"
docker-compose ps
echo ""

echo "2. VERIFY DIST DIRECTORY"
echo "───────────────────────────────────────────────────────────"
docker-compose exec -T app test -f /app/dist/main.js
check_status "dist/main.js exists"

docker-compose exec -T app ls -la /app/dist/ 2>/dev/null | head -5
echo ""

echo "3. CHECK APPLICATION HEALTH"
echo "───────────────────────────────────────────────────────────"
curl -s http://localhost:3000/ > /dev/null
check_status "Application responds on :3000"

curl -s http://localhost:3000/ | grep -q "<!DOCTYPE\|<html\|Error\|Cannot" && echo -e "${GREEN}✓ HTML Response${NC}" || echo -e "${RED}✗ No HTML Response${NC}"
echo ""

echo "4. DATABASE CONNECTIVITY"
echo "───────────────────────────────────────────────────────────"
docker-compose exec -T mysql mysql -u appuser -pappuser_password see_you_toon -e "SELECT 1" >/dev/null 2>&1
check_status "MySQL is accessible"

docker-compose exec -T mysql mysql -u appuser -pappuser_password see_you_toon -e "SHOW TABLES" 2>/dev/null | head -5
echo ""

echo "5. REDIS CONNECTIVITY"
echo "───────────────────────────────────────────────────────────"
docker-compose exec -T redis redis-cli -a redis_password ping 2>/dev/null | grep -q "PONG"
check_status "Redis is accessible"

docker-compose exec -T redis redis-cli -a redis_password info server 2>/dev/null | head -3
echo ""

echo "6. ENVIRONMENT VARIABLES"
echo "───────────────────────────────────────────────────────────"
docker-compose exec -T app env | grep -E "^(DB_|REDIS_|NODE_|PORT)" 2>/dev/null
echo ""

echo "7. APPLICATION LOGS (Last 10 lines)"
echo "───────────────────────────────────────────────────────────"
docker-compose logs app --tail=10 2>/dev/null
echo ""

echo "════════════════════════════════════════════════════════════"
echo "VERIFICATION SUMMARY"
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed! Application is running.${NC}"
  echo ""
  echo "Access your application:"
  echo "  Browser: http://localhost:3000/"
  echo "  MySQL: localhost:3307 (appuser / appuser_password)"
  echo "  Redis: localhost:6380 (password: redis_password)"
else
  echo -e "${YELLOW}Some checks failed. Review the output above.${NC}"
  echo ""
  echo "Common fixes:"
  echo "1. Wait 20-30 seconds for services to fully initialize"
  echo "2. Check: docker-compose logs app"
  echo "3. Verify: docker-compose ps"
  echo "4. Review: DOCKER_TROUBLESHOOT_CONNECTION.md"
fi
echo ""
