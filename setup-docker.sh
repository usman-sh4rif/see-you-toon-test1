#!/bin/bash
# Docker Setup - Complete Recovery Commands
# Run these commands in sequence

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Docker Setup Recovery - See You Toon                    ║"
echo "║                                                            ║"
echo "║   This script will fix and restart your Docker setup      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if user wants to continue
read -p "Ready to rebuild Docker setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 1
fi

echo ""
echo -e "${BLUE}Step 1: Stop all services${NC}"
echo "─────────────────────────────────────────────────────────"
docker-compose down
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Services stopped${NC}"
else
  echo "Note: Services may have already been stopped"
fi
echo ""

echo -e "${BLUE}Step 2: Clean Docker system${NC}"
echo "─────────────────────────────────────────────────────────"
docker system prune -a --force
echo -e "${GREEN}✓ Docker system cleaned${NC}"
echo ""

echo -e "${BLUE}Step 3: Build application (this may take 2-3 minutes)${NC}"
echo "─────────────────────────────────────────────────────────"
docker-compose build --no-cache
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Build completed successfully${NC}"
else
  echo -e "${YELLOW}✗ Build failed. Check output above.${NC}"
  exit 1
fi
echo ""

echo -e "${BLUE}Step 4: Start services${NC}"
echo "─────────────────────────────────────────────────────────"
docker-compose up -d
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Services started${NC}"
else
  echo -e "${YELLOW}✗ Failed to start services${NC}"
  exit 1
fi
echo ""

echo -e "${BLUE}Step 5: Wait for services to initialize (20 seconds)${NC}"
echo "─────────────────────────────────────────────────────────"
for i in {20..1}; do
  printf "Waiting... ${YELLOW}%d${NC}\r" $i
  sleep 1
done
echo -e "\n${GREEN}✓ Initialization complete${NC}"
echo ""

echo -e "${BLUE}Step 6: Verify services${NC}"
echo "─────────────────────────────────────────────────────────"
docker-compose ps
echo ""

echo -e "${BLUE}Step 7: Run verification checks${NC}"
echo "─────────────────────────────────────────────────────────"
echo "Checking application..."
curl -s http://localhost:3000/ > /dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Application is responding on http://localhost:3000${NC}"
else
  echo -e "${YELLOW}✗ Application not yet responding (may need more time)${NC}"
fi
echo ""

echo "Checking MySQL..."
docker-compose exec -T mysql mysql -u appuser -pappuser_password see_you_toon -e "SELECT 1" >/dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ MySQL is accessible${NC}"
else
  echo -e "${YELLOW}⚠ MySQL not yet ready${NC}"
fi
echo ""

echo "Checking Redis..."
docker-compose exec -T redis redis-cli -a redis_password ping 2>/dev/null | grep -q PONG
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Redis is accessible${NC}"
else
  echo -e "${YELLOW}⚠ Redis not yet ready${NC}"
fi
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    SETUP COMPLETE!                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Your application is ready!${NC}"
echo ""
echo "Access your application:"
echo "  🌐 Browser: http://localhost:3000"
echo ""
echo "Database access (from your machine):"
echo "  📊 MySQL: localhost:3307"
echo "     User: appuser"
echo "     Password: appuser_password"
echo "     Database: see_you_toon"
echo ""
echo "  🔴 Redis: localhost:6380"
echo "     Password: redis_password"
echo ""
echo "Container access (inside Docker):"
echo "  📊 MySQL: docker-compose exec mysql mysql -u appuser -pappuser_password see_you_toon"
echo "  🔴 Redis: docker-compose exec redis redis-cli -a redis_password"
echo "  💻 App Shell: docker-compose exec app sh"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f app"
echo "  Check status: docker-compose ps"
echo "  Stop services: docker-compose down"
echo "  Verify setup: bash verify.sh"
echo ""
echo "For more information:"
echo "  📖 See: DOCKER_APP_FIXED.md"
echo "  🔧 Troubleshooting: DOCKER_TROUBLESHOOT_CONNECTION.md"
echo ""
