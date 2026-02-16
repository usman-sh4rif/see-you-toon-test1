# Docker Setup - Visual Guide

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      Your Host Machine                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Docker Daemon                                           │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │  see-you-toon-network (Bridge Network)          │   │  │
│  │  │                                                 │   │  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────┐ │   │  │
│  │  │  │ see-you-toon │  │ see-you-toon │  │ see- │ │   │  │
│  │  │  │    -redis    │  │   -mysql     │  │you-  │ │   │  │
│  │  │  │              │  │              │  │toon  │ │   │  │
│  │  │  │ Redis 7      │  │ MySQL 8      │  │ -app │ │   │  │
│  │  │  │ :6379        │  │ :3306        │  │ :3000│ │   │  │
│  │  │  │              │  │              │  │      │ │   │  │
│  │  │  │ Data: redis- │  │ Data: mysql- │  │Nest  │ │   │  │
│  │  │  │ data vol     │  │ data vol     │  │App   │ │   │  │
│  │  │  └──────────────┘  └──────────────┘  └──────┘ │   │  │
│  │  │        ▲                  ▲              ▲      │   │  │
│  │  │        └──────────────────┼──────────────┘      │   │  │
│  │  │               Service Discovery               │   │  │
│  │  │               (Internal DNS)                   │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  │           ▲                 ▲                ▲           │  │
│  │           │                 │                │           │  │
│  │  Published Ports on Localhost:              │           │  │
│  │  :6379 ←──┘                 └─→ :3306      └─→ :3000   │  │
│  │                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Browser/CLI:                                                    │
│  http://localhost:3000  ←→  Application                          │
│  localhost:3306         ←→  MySQL                                │
│  localhost:6379         ←→  Redis                                │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

## 📊 Service Dependency Graph

```
         ┌─────────────────┐
         │  Application    │
         │ (see-you-toon-  │
         │      app)       │
         └────────┬────────┘
                  │
          ┌───────┼───────┐
          │       │       │
          ▼       ▼       ▼
       ┌──────┐ ┌────┐ ┌──────┐
       │Health│ │Port│ │Image │
       │ Check│ │3000│ │nginx │
       └──────┘ └────┘ └──────┘
          │       │       │
    Depends on   Depends on   Depends on
          ▼           ▼           ▼
     ┌───────────────────────────────┐
     │  Redis     │     MySQL        │
     │(see-you-   │  (see-you-toon-  │
     │toon-redis) │     mysql)       │
     └───────────────────────────────┘
```

## 🔄 Data Flow

```
Browser Request:
curl http://localhost:3000
         ↓
Docker Network Port Mapping (localhost:3000 → container:3000)
         ↓
Application Container (NestJS App)
         ↓
         ├──→ Redis Cache (6379) → redis-data volume
         │     └─ Stored as key-value pairs
         │
         └──→ MySQL Database (3306) → mysql-data volume
               └─ Stored as structured data
```

## 🚀 Startup Sequence

```
Step 1: docker-compose up -d
         ↓
Step 2: Redis starts (depends_on ignored at this stage)
         └─ Container: see-you-toon-redis
         └─ Health check: ping Redis
         └─ Status: Up (healthy)
         ↓
Step 3: MySQL starts
         ├─ Container: see-you-toon-mysql
         ├─ Loads schema from db/schema.sql
         ├─ Health check: mysqladmin ping
         └─ Status: Up (healthy)
         ↓
Step 4: Application starts (waits for dependencies)
         ├─ Container: see-you-toon-app
         ├─ Connects to redis (hostname: redis)
         ├─ Connects to mysql (hostname: mysql)
         ├─ Starts listening on :3000
         ├─ Health check: curl http://localhost:3000
         └─ Status: Up (healthy)
         ↓
Step 5: All services ready
         └─ docker-compose ps shows: Up (healthy)
```

## 📁 File Structure

```
see-you-toon1/
│
├── 🐳 Docker Files
│   ├── Dockerfile                 ← Multi-stage build (Ubuntu + Node)
│   ├── docker-compose.yml         ← Service orchestration
│   ├── docker-compose.prod.yml    ← Production overrides
│   └── .dockerignore              ← Build optimization
│
├── 📚 Documentation
│   ├── SETUP_COMPLETE.md          ← You are here (overview)
│   ├── DOCKER_QUICKSTART.md       ← 3-step startup guide
│   ├── DOCKER_SETUP_GUIDE.md      ← Complete 50+ command reference
│   ├── DOCKER_FILES_SUMMARY.md    ← Detailed file descriptions
│   └── (This file)                ← Visual guide
│
├── 🛠️ Utilities
│   ├── docker.sh                  ← Helper script (25+ commands)
│   └── .env.example               ← Environment template
│
├── 📦 Application
│   ├── package.json               ← Node dependencies
│   ├── src/                       ← Source code
│   ├── dist/                      ← Compiled output (created by build)
│   ├── db/
│   │   └── schema.sql             ← Auto-loaded to MySQL
│   └── ...
```

## 🔐 Networking Model

```
localhost (Your Machine)
    ↓
    ├─ Port 3000 ──→ Docker Host Network ──→ App Container (3000)
    ├─ Port 3306 ──→ Docker Host Network ──→ MySQL Container (3306)
    └─ Port 6379 ──→ Docker Host Network ──→ Redis Container (6379)


Within Container Network (see-you-toon-network):
    
    App Container can access:
    ├─ redis:6379        (DNS resolution via Docker)
    ├─ mysql:3306        (DNS resolution via Docker)
    └─ localhost:3000    (self)
    
    Redis Container can access:
    ├─ app:3000          (DNS resolution via Docker)
    └─ mysql:3306        (DNS resolution via Docker)
    
    MySQL Container can access:
    ├─ app:3000          (DNS resolution via Docker)
    └─ redis:6379        (DNS resolution via Docker)
```

## 💾 Volume Mapping

```
Host Machine                Docker Container
    ↓                            ↓
        redis-data  ←────────→  /data (in redis container)
        └─ Stores Redis data     └─ Persistent between restarts

        mysql-data  ←────────→  /var/lib/mysql (in mysql container)
        └─ Stores MySQL data     └─ Persistent between restarts

        (none)      ←────────→  /app (in app container)
        └─ No data volume        └─ Ephemeral, recreated each time
```

## 🔄 Lifecycle States

```
Initial State:
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │ Redis   │   │ MySQL   │   │ App     │
    │ Not     │   │ Not     │   │ Not     │
    │ Running │   │ Running │   │ Running │
    └─────────┘   └─────────┘   └─────────┘

After docker-compose up -d:
    ┌─────────────────────────────────────┐
    │ docker-compose up -d                │
    └────────┬────────────────────────────┘
             ↓
    ┌─────────────────────┐
    │ Creates Containers  │
    └─────────┬───────────┘
             ↓
    ┌──────────────────────────────────────────┐
    │ Starts Redis       │ Starts MySQL        │
    │ Running, waiting   │ Running, waiting    │
    │ for health check   │ for health check    │
    └──────────┬───────────────┬───────────────┘
               │               │
    Health Check Passes        │
               └───────────┬────┘
                           ↓
                   ┌──────────────────┐
                   │ Both ready!      │
                   │ Starts App       │
                   └─────────┬────────┘
                             ↓
                   ┌──────────────────┐
                   │ App running!     │
                   │ All services up  │
                   │ Application ready│
                   └──────────────────┘

After docker-compose down:
    ┌──────────────────────────────────┐
    │ Stops all containers             │
    │ Data in volumes preserved        │
    │ Network destroyed                │
    └──────────────────────────────────┘

After docker-compose down -v:
    ┌──────────────────────────────────┐
    │ Stops all containers             │
    │ Removes data volumes (!)         │
    │ Network destroyed                │
    └──────────────────────────────────┘
```

## 📋 Command Flow

```
User runs: docker-compose build
    ↓
Docker reads: docker-compose.yml
    ↓
Docker reads: Dockerfile
    ↓
┌─────────────────────────────────────┐
│ Build Stage 1: Builder              │
├─────────────────────────────────────┤
│ FROM ubuntu:22.04                   │
│ Install Node.js 20.x                │
│ COPY package.json                   │
│ npm ci                              │
│ COPY src/                           │
│ npm run build                       │
│ Output: dist/ directory             │
└────────────────────┬────────────────┘
                     ↓
┌─────────────────────────────────────┐
│ Build Stage 2: Runtime              │
├─────────────────────────────────────┤
│ FROM ubuntu:22.04 (fresh image)     │
│ Install Node.js runtime only        │
│ COPY --from=builder /app/dist ./    │
│ Create non-root user                │
│ Set health checks                   │
│ Output: Final image                 │
└────────────────────┬────────────────┘
                     ↓
            Image ready to run
            (stored in Docker)
                     ↓
User runs: docker-compose up
    ↓
Creates containers from images
    ↓
Starts all services
```

## 🎯 Quick Decision Tree

```
I want to...

├─ GET STARTED FAST?
│  └─ Read: DOCKER_QUICKSTART.md
│  └─ Run: docker-compose build && docker-compose up -d
│
├─ UNDERSTAND HOW IT WORKS?
│  └─ Read: DOCKER_SETUP_GUIDE.md
│  └─ Read: This file (Visual Guide)
│
├─ ACCESS SERVICES?
│  ├─ MySQL: docker-compose exec mysql mysql -u appuser -p...
│  ├─ Redis: docker-compose exec redis redis-cli -a...
│  └─ App: docker-compose exec app sh
│
├─ MANAGE SERVICES?
│  ├─ View logs: docker-compose logs -f
│  ├─ Stop: docker-compose down
│  ├─ Check status: docker-compose ps
│  └─ Full cleanup: docker-compose down -v
│
├─ DEPLOY TO PRODUCTION?
│  └─ Use: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
│  └─ Change passwords in .env
│  └─ Set resource limits
│
├─ DEBUG PROBLEMS?
│  └─ Read: DOCKER_SETUP_GUIDE.md → Troubleshooting section
│  └─ Check: docker-compose logs
│  └─ Use: docker-compose ps
│
└─ USE HELPER SCRIPT?
   └─ Run: chmod +x docker.sh && ./docker.sh help
   └─ Examples: ./docker.sh status, ./docker.sh backup, ./docker.sh health
```

## ✅ Verification Checklist

```
After running docker-compose up -d:

□ Check docker-compose ps shows 3 "Up" containers
□ Check all services show (healthy) status
□ Verify app port with: curl http://localhost:3000
□ Check MySQL: docker-compose exec mysql mysql -u appuser -p... -e "SELECT 1"
□ Check Redis: docker-compose exec redis redis-cli -a redis_password ping
□ Review logs: docker-compose logs --tail=50
□ Run tests: docker-compose exec app npm run test
```

## 🎓 Key Concepts

| Concept | Meaning |
|---------|---------|
| **Container** | Isolated application environment running in Docker |
| **Image** | Blueprint for creating containers (like a class) |
| **Volume** | Persistent storage that survives container restart |
| **Network** | Communication layer connecting multiple containers |
| **Service** | Container definition in docker-compose.yml |
| **Health Check** | Automated test ensuring service is working |
| **Port Mapping** | Connecting container port to host port (3000:3000) |
| **Environment Variable** | Configuration passed to containers |

## 📞 Help Resources

| Need | Location |
|------|----------|
| Fast startup | DOCKER_QUICKSTART.md |
| Full reference | DOCKER_SETUP_GUIDE.md |
| File details | DOCKER_FILES_SUMMARY.md |
| This overview | SETUP_COMPLETE.md |
| Visual help | This file |
| Quick commands | ./docker.sh help |

---

**Visual Guide Created**: February 2026
**Diagrams**: ASCII-based for clarity
**Next Step**: Read DOCKER_QUICKSTART.md or run `docker-compose up -d`
