#!/bin/bash

# See You Toon - Docker Operations Script
# Quick commands for common Docker tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Commands
case "${1:-help}" in
    build)
        print_header "Building Docker Image"
        docker-compose build
        print_success "Build completed"
        ;;

    build-nc)
        print_header "Building Docker Image (No Cache)"
        docker-compose build --no-cache
        print_success "Build completed"
        ;;

    up)
        print_header "Starting Services"
        docker-compose up -d
        sleep 5
        docker-compose ps
        print_success "Services started"
        echo -e "${BLUE}Application: http://localhost:3000${NC}"
        ;;

    down)
        print_header "Stopping Services"
        docker-compose down
        print_success "Services stopped"
        ;;

    restart)
        print_header "Restarting Services"
        docker-compose restart
        print_success "Services restarted"
        ;;

    logs)
        print_header "Viewing Logs"
        docker-compose logs -f --tail=100 "${2:-app}"
        ;;

    logs-mysql)
        print_header "MySQL Logs"
        docker-compose logs -f mysql
        ;;

    logs-redis)
        print_header "Redis Logs"
        docker-compose logs -f redis
        ;;

    status)
        print_header "Services Status"
        docker-compose ps
        ;;

    stats)
        print_header "Docker Stats"
        docker stats --no-stream
        ;;

    shell)
        print_header "Opening Application Shell"
        docker-compose exec app sh
        ;;

    mysql)
        print_header "MySQL CLI"
        docker-compose exec mysql mysql -u appuser -pappuser_password see_you_toon
        ;;

    redis)
        print_header "Redis CLI"
        docker-compose exec redis redis-cli -a redis_password
        ;;

    test)
        print_header "Running Tests"
        docker-compose exec app npm run test
        ;;

    test-watch)
        print_header "Running Tests (Watch Mode)"
        docker-compose exec app npm run test:watch
        ;;

    test-e2e)
        print_header "Running E2E Tests"
        docker-compose exec app npm run test:e2e
        ;;

    lint)
        print_header "Running Linter"
        docker-compose exec app npm run lint
        ;;

    backup)
        print_header "Backing Up Database"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="backup_${TIMESTAMP}.sql"
        docker-compose exec -T mysql mysqldump -u appuser -pappuser_password see_you_toon > "$BACKUP_FILE"
        print_success "Backup saved to $BACKUP_FILE"
        ls -lh "$BACKUP_FILE"
        ;;

    restore)
        if [ -z "$2" ]; then
            print_error "Usage: $0 restore <backup-file>"
            exit 1
        fi
        print_header "Restoring Database"
        if [ ! -f "$2" ]; then
            print_error "File not found: $2"
            exit 1
        fi
        docker-compose exec -T mysql mysql -u appuser -pappuser_password see_you_toon < "$2"
        print_success "Database restored from $2"
        ;;

    clean)
        print_header "Cleaning Up Docker Resources"
        print_warning "This will stop containers and remove volumes"
        read -p "Continue? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            docker system prune -f
            print_success "Cleanup completed"
        else
            print_warning "Cleanup cancelled"
        fi
        ;;

    reset)
        print_header "Full Reset (Remove Everything)"
        print_warning "This will delete all containers and volumes"
        read -p "Are you sure? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            rm -rf volumes/*
            print_success "Reset completed"
        else
            print_warning "Reset cancelled"
        fi
        ;;

    health)
        print_header "Health Check"
        echo -e "\n${BLUE}Container Status:${NC}"
        docker-compose ps
        
        echo -e "\n${BLUE}Application Health:${NC}"
        if curl -s http://localhost:3000 > /dev/null; then
            print_success "Application is responding"
        else
            print_error "Application is not responding"
        fi
        
        echo -e "\n${BLUE}Redis Health:${NC}"
        if docker-compose exec redis redis-cli -a redis_password ping | grep -q PONG; then
            print_success "Redis is healthy"
        else
            print_error "Redis is not responding"
        fi
        
        echo -e "\n${BLUE}MySQL Health:${NC}"
        if docker-compose exec mysql mysqladmin ping -u appuser -pappuser_password > /dev/null 2>&1; then
            print_success "MySQL is healthy"
        else
            print_error "MySQL is not responding"
        fi
        ;;

    info)
        print_header "System Information"
        echo -e "${BLUE}Docker Version:${NC}"
        docker --version
        echo -e "\n${BLUE}Docker Compose Version:${NC}"
        docker-compose --version
        echo -e "\n${BLUE}Docker Disk Usage:${NC}"
        docker system df
        echo -e "\n${BLUE}Network Information:${NC}"
        docker network inspect see-you-toon-network | grep -E '"Name"|"Containers"' -A 10
        ;;

    help|*)
        cat << EOF
${BLUE}See You Toon - Docker Operations${NC}

${GREEN}Usage: $0 <command> [options]${NC}

${YELLOW}Build Commands:${NC}
  build              Build Docker image
  build-nc           Build Docker image (no cache)

${YELLOW}Service Commands:${NC}
  up                 Start all services
  down               Stop all services
  restart            Restart all services
  status             Show services status
  stats              Show Docker resource usage

${YELLOW}Logging Commands:${NC}
  logs [service]     View logs (default: app)
  logs-mysql         View MySQL logs
  logs-redis         View Redis logs

${YELLOW}Access Commands:${NC}
  shell              Open application shell
  mysql              Open MySQL CLI
  redis              Open Redis CLI

${YELLOW}Testing & Linting:${NC}
  test               Run tests
  test-watch         Run tests (watch mode)
  test-e2e           Run E2E tests
  lint               Run linter

${YELLOW}Backup & Restore:${NC}
  backup             Backup database
  restore <file>     Restore database from backup

${YELLOW}Maintenance Commands:${NC}
  health             Check health of all services
  clean              Clean up unused resources
  reset              Full reset (remove everything)
  info               Show system information

${YELLOW}Examples:${NC}
  $0 build
  $0 up
  $0 logs app
  $0 backup
  $0 restore backup_20240212_103045.sql

${YELLOW}Documentation:${NC}
  See DOCKER_SETUP_GUIDE.md for detailed information

EOF
        ;;
esac
