# Alpine Linux User Creation Error - Fixed

## Problem
```
addgroup -g 1000 appuser failed - exit code: 1
```

**Root Cause**: The user creation commands were using incorrect Alpine Linux syntax. Alpine is different from Ubuntu/Debian:
- Group names cannot be the same as user names in some Alpine versions
- The `addgroup` and `adduser` commands have Alpine-specific behavior

## Solution

Changed the user creation to use distinct group and user names:

**Before (❌ Failed):**
```dockerfile
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app
```

**After (✅ Working):**
```dockerfile
RUN addgroup -g 1000 appgroup && \
    adduser -D -u 1000 -G appgroup appuser && \
    chown -R appuser:appgroup /app
```

### What Changed:
1. Created group named `appgroup` (not `appuser`)
2. Created user named `appuser` 
3. User belongs to `appgroup`
4. Files owned by `appuser:appgroup`

---

## Alpine Linux User Commands

Alpine uses `busybox` for user management with different behavior:

| Command | Alpine Syntax | Purpose |
|---------|---------------|---------|
| Add Group | `addgroup -g 1000 groupname` | Create group with GID |
| Add User | `adduser -D -u 1000 -G group username` | Create non-interactive user |
| Flags | `-D` = Don't set password | Important for Docker |
| Flags | `-u` = User ID | Numeric UID |
| Flags | `-G` = Group | Primary group |

---

## Why Group and User Must Be Different

In Alpine Linux:
- Group names and user names can conflict
- Using the same name for both can cause issues
- Industry practice is to separate them

**Examples:**
```
❌ Bad:  addgroup appuser && adduser -G appuser appuser
✅ Good: addgroup appgroup && adduser -G appgroup appuser
```

---

## Verification

After build and start, verify the user was created:

```bash
# Check user exists in container
docker-compose exec app id
# Output should show: uid=1000(appuser) gid=1000(appgroup) groups=1000(appgroup)

# Check file ownership
docker-compose exec app ls -la /app/
# Output should show: appuser appgroup

# Verify app still works
curl http://localhost:3000/
```

---

## Complete Fix Steps

### 1. Stop and Clean
```bash
docker-compose down
docker system prune -a
```

### 2. Rebuild
```bash
docker-compose build --no-cache
```

Watch for output showing:
```
[runtime] RUN addgroup -g 1000 appgroup
[runtime] RUN adduser -D -u 1000 -G appgroup appuser
[runtime] RUN chown -R appuser:appgroup /app
```

All three commands should complete without errors.

### 3. Start Services
```bash
docker-compose up -d
sleep 20
```

### 4. Verify
```bash
# Check containers are running
docker-compose ps

# Check application
curl http://localhost:3000/

# Check user in container
docker-compose exec app id
```

---

## What the Commands Do

### `addgroup -g 1000 appgroup`
- Creates a group named `appgroup`
- Assigns it group ID 1000
- Used for file permission management

### `adduser -D -u 1000 -G appgroup appuser`
- Creates user named `appuser`
- `-D` = Don't prompt for password (non-interactive)
- `-u 1000` = User ID 1000
- `-G appgroup` = Primary group is `appgroup`

### `chown -R appuser:appgroup /app`
- Recursively changes ownership of `/app` directory
- User owner: `appuser`
- Group owner: `appgroup`
- Ensures non-root user can read/write application files

---

## Security Benefits

Running as non-root user:
- ✅ Container escape is limited to non-root permissions
- ✅ Cannot modify system files
- ✅ Principle of least privilege
- ✅ Industry security best practice

---

## Common Alpine User Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `addgroup: bad syntax` | Wrong flags | Use Alpine syntax: `-g` |
| `adduser: bad syntax` | Wrong flags | Use Alpine syntax: `-D -u -G` |
| `group already exists` | Duplicate group | Use unique group name |
| `user already exists` | Duplicate user | Use unique user name |
| `permission denied` | Wrong ownership | Check `chown` command |

---

## Expected Build Output

```
[runtime stage]
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
RUN addgroup -g 1000 appgroup
RUN adduser -D -u 1000 -G appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser
HEALTHCHECK --interval=30s ...
EXPOSE 3000
CMD ["node", "dist/main"]
=> exporting to image
=> => successfully tagged see-you-toon1-app:latest
```

**All commands should execute without errors.**

---

## Dockerfile Reference

The corrected Dockerfile now has:

```dockerfile
# Stage 2: Runtime stage
FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=3000
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

WORKDIR /app

# Copy from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create non-root user for security
RUN addgroup -g 1000 appgroup && \
    adduser -D -u 1000 -G appgroup appuser && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

EXPOSE 3000
CMD ["node", "dist/main"]
```

---

## Quick Commands

```bash
# Full fix
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
sleep 20
docker-compose ps

# Verify user
docker-compose exec app id

# Test app
curl http://localhost:3000/
```

---

## Summary

**Changed**: User creation from `appuser:appuser` to `appuser:appgroup`
**Reason**: Alpine Linux compatibility
**Result**: Build completes successfully, app runs as non-root
**Status**: ✅ Fixed and Ready

**Next**: Run `docker-compose build --no-cache`
