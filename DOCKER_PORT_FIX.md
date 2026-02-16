# Docker Port & Version Issues - Fixed

## Issues Fixed

### 1. **Port 3306 Already in Use**

**Problem:**
```
Error: Only one usage of each socket address (protocol/network address/port) is normally permitted
exposing port TCP 0.0.0.0:3306
```

**Root Cause:** 
- Local MySQL server running on port 3306
- Or previous Docker container still occupying the port

**Solution Applied:**
Changed port mapping in `docker-compose.yml`:
```yaml
# OLD
ports:
  - "3306:3306"    # ❌ Conflicts with local MySQL

# NEW  
ports:
  - "3307:3306"    # ✅ Maps to port 3307 instead
```

**Access MySQL now:**
```bash
# Old: localhost:3306
# New: localhost:3307

mysql -h localhost -P 3307 -u appuser -pappuser_password see_you_toon
```

### 2. **Redis Port Changed**

For consistency, also moved Redis to avoid conflicts:
```yaml
# OLD
ports:
  - "6379:6379"

# NEW
ports:
  - "6380:6379"
```

**Access Redis now:**
```bash
# Old: localhost:6379
# New: localhost:6380

docker-compose exec redis redis-cli -a redis_password -p 6380
```

### 3. **Removed Deprecated Version Attribute**

**Problem:**
```
Warning: the attribute `version` is obsolete, it will be ignored
```

**Solution Applied:**
```yaml
# OLD
version: '3.9'
services:
  ...

# NEW (removed version line)
services:
  ...
```

---

## Port Mapping Summary

| Service | Container Port | Host Port (Old) | Host Port (New) | Access URL |
|---------|---|---|---|---|
| Application | 3000 | 3000 | 3000 | http://localhost:3000 |
| MySQL | 3306 | 3306 | **3307** | localhost:3307 |
| Redis | 6379 | 6379 | **6380** | localhost:6380 |

---

## Start Services Again

```bash
# Stop if running
docker-compose down

# Start with new configuration
docker-compose up -d

# Check status
docker-compose ps
```

**Expected output:**
```
NAME                    COMMAND                  SERVICE   STATUS
see-you-toon-redis      redis-server ...         redis     Up (healthy)
see-you-toon-mysql      docker-entrypoint...     mysql     Up (healthy)
see-you-toon-app        node dist/main           app       Up (healthy)
```

---

## Updated Connection Strings

### For Application (Inside Docker)
```
MySQL: mysql://appuser:appuser_password@mysql:3306/see_you_toon
Redis: redis://default:redis_password@redis:6379
```

(These use Docker internal networking and don't change)

### For Local Tools (Outside Docker)
```bash
# MySQL from local machine
mysql -h localhost -P 3307 -u appuser -pappuser_password see_you_toon

# Or in Docker
docker-compose exec mysql mysql -u appuser -pappuser_password see_you_toon

# Redis from local machine
redis-cli -p 6380 -a redis_password

# Or in Docker
docker-compose exec redis redis-cli -a redis_password
```

---

## Verify Everything Works

```bash
# 1. Check all services are up
docker-compose ps

# 2. Test application
curl http://localhost:3000/

# 3. Test MySQL
docker-compose exec mysql mysql -u appuser -pappuser_password see_you_toon -e "SELECT 1"

# 4. Test Redis
docker-compose exec redis redis-cli -a redis_password ping
```

---

## If Port 3307 or 6380 Are Also in Use

Find what's using them:

```bash
# Check port 3307
netstat -ano | findstr :3307

# Check port 6380
netstat -ano | findstr :6380
```

If something is using them, change them in `docker-compose.yml`:

```yaml
# Example: Use 3308 instead
mysql:
  ports:
    - "3308:3306"

# Example: Use 6381 instead  
redis:
  ports:
    - "6381:6379"
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

---

## Complete docker-compose.yml Changes

Changes made:
1. ✅ Removed `version: '3.9'` line
2. ✅ Changed MySQL port `3306:3306` → `3307:3306`
3. ✅ Changed Redis port `6379:6379` → `6380:6379`

Your services should now start without port conflicts!

---

**Fixed**: February 12, 2026
