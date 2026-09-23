### 2. `groundpulse-api`

```markdown
# GroundPulse Backend API & Workers (`groundpulse-api`)

Core NestJS API backend, PostgreSQL database access layer via Prisma, BullMQ asynchronous workers, and Socket.IO real-time gateway for GroundPulse.

---

## 📌 Work of This Repo
This repository powers the entire business logic and server-side processing for the GroundPulse platform:
- Implements modular NestJS services: Property, Inspection, Issue/Repair, Provider, Notification, and Admin.
- Enforces role-based access control (RBAC) via CASL policies and NestJS guards.
- Manages the PostgreSQL database via Prisma ORM schemas and versioned migrations.
- Processes background jobs asynchronously via Redis and BullMQ (PDF report compilation within 48h SLA, notification fan-out).
- Emits real-time WebSocket events via Socket.IO scoped to authenticated user rooms (`user:{userId}`).
- Generates pre-signed AWS S3 / Cloudflare R2 upload URLs for inspection photo/video media.

## ❓ Why We Created This Repo
GroundPulse requires ACID transactional guarantees (such as issue approval -> repair generation -> audit log write), server-side CASL authorization, and central relational data persistence. Keeping all NestJS backend services and workers in this single repository prevents distributed transaction failures and maintains direct database integrity across all 10 platform entities.

## 🛠 Tech Stack
- **Framework:** NestJS 10
- **Runtime:** Node.js 20 LTS / TypeScript 5.4+
- **Database ORM:** Prisma ORM / PostgreSQL 15+
- **Cache & Queues:** Redis 7+ / BullMQ
- **Real-Time:** Socket.IO
- **Security & Auth:** Passport.js, JWT, CASL
- **Storage SDK:** AWS SDK v3 (S3 pre-signed URLs)
- **Testing:** Jest, Supertest

## 📁 File Structure
```text
groundpulse-api/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── modules/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── inspection/
│   │   ├── issue-repair/
│   │   ├── notification/
│   │   ├── property/
│   │   └── provider/
│   ├── jobs/
│   │   ├── report-generation.processor.ts
│   │   └── notification-dispatch.processor.ts
│   ├── gateways/
│   │   └── notification.gateway.ts
│   ├── common/
│   │   ├── filters/
│   │   ├── guards/
│   │   └── interceptors/
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── unit/
│   └── integration/
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
💻 Commands
Bash
# Install dependencies
npm install

# Run database migrations locally
npx prisma migrate dev

# Seed database with initial roles & data
npx prisma db seed

# Open visual Prisma database studio
npx prisma studio

# Start backend in development mode (hot-reload)
npm run start:dev

# Run unit tests
npm test

# Run integration tests against test DB
npm run test:integration
🔑 Required Environment Variables
Code snippet
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/groundpulse?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="super-secret-jwt-key"
AWS_REGION="ap-south-1"
S3_BUCKET="groundpulse-media-dev"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3002
