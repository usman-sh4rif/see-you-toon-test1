# Docker Troubleshooting - "This site can't be reached"

## Problem
When accessing `http://localhost:3000/` you get:
```
This site can't be reached
localhost refused to connect
```

## Root Causes & Solutions

### 1. **Application Not Started or Crashed**

**Check service status:**
```bash
docker-compose ps
```

**Expected output:**
```
NAME                COMMAND              SERVICE   STATUS
see-you-toon-app    node dist/main       app       Up (healthy)
see-you-toon-mysql  docker-entrypoint    mysql     Up (healthy)
see-you-toon-redis  redis-server         redis     Up (healthy)
```

**If app is not "Up":**
```bash
# View app logs
docker-compose logs app

# Look for errors like:
# - "Cannot find module"
# - "Connection refused"
# - "EADDRINUSE" (port already in use)
```

### 2. **Database Connection Failed**

The app depends on MySQL being ready. It may be starting but failing to connect.

**Check MySQL is healthy:**
```bash
docker-compose logs mysql
```

**Test MySQL connection:**
```bash
docker-compose exec mysql mysql -u appuser -pappuser_password see_you_toon
```

**If connection fails, the app will crash.**

**Solution:**
```bash
# Restart MySQL first
docker-compose restart mysql

# Wait 10 seconds for MySQL to initialize
timeout 10 || sleep 10

# Then restart app
docker-compose restart app

# Check logs
docker-compose logs app
```

### 3. **Environment Variables Not Set**

The app needs database credentials. If they're wrong, it won't start.

**Check environment variables:**
```bash
docker-compose exec app env | grep DB_
```

**Expected output:**
```
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=appuser
DB_PASSWORD=appuser_password
DB_NAME=see_you_toon
```

**If missing or wrong:**
1. Edit `docker-compose.yml`
2. Verify the `environment:` section under `app:` service
3. Rebuild: `docker-compose build --no-cache`
4. Restart: `docker-compose up -d`

### 4. **Port Not Mapped Correctly**

**Verify port mapping:**
```bash
docker-compose port app 3000
```

**Expected output:**
```
0.0.0.0:3000
```

**If blank or error:**
1. Check docker-compose.yml has: `ports: - "3000:3000"`
2. Make sure port 3000 is not used by another service
3. Restart: `docker-compose up -d`

### 5. **Port Already in Use**

**Check what's using port 3000:**

**Windows:**
```cmd
netstat -ano | findstr :3000
```

**Mac/Linux:**
```bash
lsof -i :3000
```

**Solution:**
```bash
# Kill the process (Windows)
taskkill /PID <PID> /F

# Or use a different port in docker-compose.yml
# Change: "3000:3000" to "8000:3000"
# Then access: http://localhost:8000
```

### 6. **Build Incomplete or Failed**

The application code might not be compiled.

**Check dist folder exists in container:**
```bash
docker-compose exec app ls -la /app/dist/
```

**If empty or missing:**
```bash
# Rebuild
docker-compose build --no-cache

# Restart
docker-compose up -d
```

### 7. **Health Check Failing**

The container might be running but health check is failing.

**View health status:**
```bash
docker-compose ps
```

**If showing "Up (unhealthy)":**
```bash
# View detailed health info
docker inspect see-you-toon-app | grep -A 10 "Health"

# View logs to see what's failing
docker-compose logs app
```

---

## Step-by-Step Diagnostic Process

### Step 1: Check Overall Status
```bash
docker-compose ps
```
- All three containers should show "Up"
- App should eventually show "healthy"

### Step 2: View Application Logs
```bash
docker-compose logs app --tail=50
```
Look for:
- ✓ "Listening on port 3000" = App started
- ✗ "Cannot find module" = Build issue
- ✗ "Connection refused" = Database issue
- ✗ "EADDRINUSE" = Port in use

### Step 3: Test Database
```bash
docker-compose exec mysql mysql -u appuser -pappuser_password see_you_toon
# Type: SELECT 1;
# Then: exit
```

### Step 4: Test Redis
```bash
docker-compose exec redis redis-cli -a redis_password
# Type: ping
# Expected: PONG
# Then: exit
```

### Step 5: Test Network Connectivity from App
```bash
# Can app reach MySQL?
docker-compose exec app ping -c 2 mysql

# Can app reach Redis?
docker-compose exec app ping -c 2 redis
```

### Step 6: Verify Environment Variables
```bash
docker-compose exec app env | grep -E "DB_|REDIS_|PORT|NODE_ENV"
```

### Step 7: Manual Test (Inside Container)
```bash
# Open shell in app container
docker-compose exec app sh

# Inside the container, try:
curl http://localhost:3000/

# Should show HTML response instead of "connection refused"
```

### Step 8: Restart Everything
```bash
# Full restart
docker-compose down
docker-compose up -d

# Wait 15-20 seconds for services to fully initialize
sleep 20

# Then test
curl http://localhost:3000/
```

---

## Use the Diagnostic Script

I've created `docker-diagnose.sh` to run all checks automatically:

**On Linux/Mac:**
```bash
chmod +x docker-diagnose.sh
./docker-diagnose.sh
```

**On Windows (in Git Bash):**
```bash
bash docker-diagnose.sh
```

This will show:
- Service status
- Health checks
- Network connectivity
- Environment variables
- Resource usage
- Logs

---

## Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Port not mapped or app not listening | Check `docker-compose ps`, view `docker-compose logs app` |
| `getaddrinfo ENOTFOUND mysql` | Can't resolve mysql hostname | MySQL not running or network issue: `docker-compose restart mysql` |
| `ER_ACCESS_DENIED_FOR_USER` | Wrong DB credentials | Check DB_USERNAME/DB_PASSWORD match docker-compose.yml |
| `EADDRINUSE :::3000` | Port 3000 already in use | Find: `netstat -ano \| findstr :3000`, Kill: `taskkill /PID <PID> /F` |
| `Cannot find module` | Code not compiled | Rebuild: `docker-compose build --no-cache` |
| `ENOENT: no such file or directory, open '/app/dist/main.js'` | dist/ not created | Check build logs: `docker-compose logs app` |

---

## Quick Fix Checklist

```
☐ docker-compose ps shows all "Up"
☐ app shows "(healthy)" status
☐ docker-compose logs app shows no errors
☐ curl http://localhost:3000/ works (in app container)
☐ docker-compose exec mysql mysql ... connects
☐ docker-compose exec redis redis-cli ping returns PONG
☐ DB_HOST=mysql (not localhost)
☐ REDIS_HOST=redis (not localhost)
☐ Port 3000 mapping shows: 0.0.0.0:3000
☐ No other service using port 3000
```

---

## Nuclear Option - Full Reset

If everything else fails:

```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker rmi see-you-toon1-app

# Clean Docker system
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache

# Start fresh
docker-compose up -d

# Wait 30 seconds
sleep 30

# Test
curl http://localhost:3000/
```

---

## Still Having Issues?

1. **Run the diagnostic:**
   ```bash
   ./docker-diagnose.sh
   ```
   This generates a full report of all services

2. **Check specific logs:**
   ```bash
   docker-compose logs app     # App errors
   docker-compose logs mysql   # Database errors
   docker-compose logs redis   # Cache errors
   ```

3. **Enable verbose logging:**
   ```bash
   docker-compose up  # (without -d) to see real-time logs
   ```

4. **Access app shell to test manually:**
   ```bash
   docker-compose exec app sh
   curl http://localhost:3000/
   ```

---

**Last Updated**: February 2026
