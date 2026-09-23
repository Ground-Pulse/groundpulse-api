

  `groundpulse-api`

```
# groundpulse-api

Core backend REST API, WebSocket gateway, and background worker service for GroundPulse[cite: 1].

---

## 🎯 Purpose of This Repo
This repository contains the complete NestJS backend that drives authentication, role-based authorization (RBAC), data persistence, real-time push events, and asynchronous job processing for GroundPulse[cite: 1].

## ❓ Why We Created This Repo
GroundPulse requires a single, unified backend to enforce critical platform constraints:
- **Relational Integrity & Transactions:** Coordinates multi-step transactional operations across 10 interrelated database tables (such as approving an issue, generating a repair record, and alerting service providers atomically via `prisma.$transaction`)[cite: 1].
- **Server-Side RBAC:** Enforces permissions via CASL and NestJS guards so clients can never bypass security checks[cite: 1].
- **Asynchronous Processing:** Hosts Redis-backed BullMQ workers that generate media-rich inspection reports and fan out notifications without blocking the HTTP request path[cite: 1].
- **Real-Time Push:** Dispatches state changes to authenticated WebSocket rooms (`user:{userId}`) via Socket.IO[cite: 1].

## 📂 File Structure
```text
groundpulse-api/
├── prisma/
│   ├── migrations/                    # Managed Prisma database migrations
│   └── schema.prisma                  # 10 core domain models
├── src/
│   ├── modules/
│   │   ├── auth/                      # Passport.js JWT strategies & CASL ability factory
│   │   ├── property/                  # Property registration & S3 cover upload
│   │   ├── inspection/                # Scheduling & checklist state management
│   │   ├── issue-repair/              # Flagging, approval flow & repair status tracker
│   │   ├── provider/                  # Service provider verification & matching
│   │   ├── notification/              # Notification dispatcher & Socket.IO gateway
│   │   └── admin/                     # Platform-wide live metrics aggregation
│   ├── jobs/                          # BullMQ background workers
│   │   ├── report-generation.processor.ts
│   │   └── notification-dispatch.processor.ts
│   ├── filters/
│   │   └── global-exception.filter.ts # Unified error-handling contract
│   ├── lib/
│   │   └── prisma.service.ts          # Central Prisma connection client
│   ├── app.module.ts
│   └── main.ts                        # Application bootstrap & CORS configuration
├── test/                              # Jest unit & Supertest integration suites
├── Dockerfile                         # Production multi-stage container build
├── package.json
├── tsconfig.json
└── README.md
💻 Commands
Bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Run database migrations and generate Prisma Client
npx prisma migrate dev
npx prisma db seed

# 4. Start local development server (with hot reload)
npm run start:dev

# 5. Run unit and integration tests
npm test
npm run test:integration

# 6. Open visual database browser
npx prisma studio
🔑 Required Environment Variables
Code snippet
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/groundpulse?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="super-secret-jwt-key"
AWS_REGION="ap-south-1"
S3_BUCKET="groundpulse-media-dev"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3002
