# 🚀 NovaMind — Distributed Multi-Agent AI Interview & Career Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![LangChain](https://img.shields.io/badge/LangChain-LangGraph-1C3C3C?style=for-the-badge&logo=chainlink&logoColor=white)](https://js.langchain.com/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-DC382D?style=for-the-badge&logo=qdrant&logoColor=white)](https://qdrant.tech/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache%20%26%20Locks-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

---

## 📌 Project Overview

**NovaMind** is an enterprise-grade, distributed AI mock interview and career acceleration platform powered by **multi-agent state machines** (LangGraph) and a **production-hardened RAG vector pipeline** (Qdrant + Google Gemini embeddings). The platform conducts realistic, adaptive technical and HR interviews, executes semantic resume analysis, calculates multi-dimensional skill radar metrics, synthesizes personalized career roadmaps, and manages coin-based access with idempotent payment verification.

Built on an independent **microservices architecture** reverse-proxied through an authenticated API Gateway, NovaMind is engineered for strict tenant isolation, distributed concurrency protection, and zero-downtime scalability.

---

## ✨ Core Platform Capabilities

- 🤖 **Adaptive Multi-Agent AI Interviews**: Cyclic LangGraph workflows generating progressive technical and HR questions. Adapts difficulty in real-time based on evaluated candidate answers.
- 🔍 **Production RAG & Vector Retrieval (Qdrant)**: Section-aware resume chunking with rich provenance metadata, Google Gemini 3072-dim embeddings, strict `userId` tenant isolation, score thresholding, token budgeting, and prompt-injection guardrails.
- 📄 **ATS Resume Parser & Scorer**: Parses PDF documents, analyzes skill gaps against target roles, extracts strengths and weaknesses, and tracks indexing status.
- 🗺️ **Personalized Career Roadmaps**: Generates milestone curriculums tailored to target roles and salary bands, enriched with curated YouTube and documentation resources.
- 📊 **Skill Radar Analytics**: Interactive radar charts measuring problem solving, conceptual clarity, communication, efficiency, and creativity.
- 💳 **Secure Razorpay Payments**: Server-side atomic coin crediting, timing-safe HMAC SHA-256 signature verification, and replay-proof idempotency.
- 🔒 **Distributed Session & Concurrency Protection**: Redis distributed locking (`SET NX EX` + atomic Lua script release) preventing interview race conditions; Redis session broadcast synchronization.

---

## 🏗️ System Architecture

```
                                  +---------------------+
                                  |     Client (Web)    |
                                  |  React 19 + Vite UI |
                                  +----------+----------+
                                             |
                                             v (HTTP/REST + Cookies)
                                  +---------------------+
                                  |     API Gateway     |
                                  |     (Port 8000)     |
                                  +----------+----------+
                                             |
      +-----------------+--------------------+-------------------+-----------------+
      |                 |                    |                   |                 |
      v                 v                    v                   v                 v
+-----------+     +------------+      +---------------+    +------------+    +-----------+
|   Auth    |     |   Resume   |      |   Interview   |    |  Roadmap   |    |  Billing  |
|  Service  |     |  Service   |      |    Service    |    |  Service   |    |  Service  |
| (Pt 8001) |     | (Pt 8002)  |      |   (Pt 8003)   |    | (Pt 8004)  |    | (Pt 8005) |
+-----+-----+     +-----+------+      +-------+-------+    +-----+------+    +-----+-----+
      |                 |                     |                  |                 |
      +--------+--------+----------+----------+---------+--------+--------+--------+
               |                   |                    |                 |
               v                   v                    v                 v
        +--------------+    +--------------+     +-------------+   +-------------+
        |   MongoDB    |    | Redis Cache  |     |   Qdrant    |   |  Razorpay   |
        |  (Atlas/7.0) |    |  & Locks     |     |  Vector DB  |   |   Gateway   |
        +--------------+    +--------------+     +-------------+   +-------------+
```

---

## 📂 Repository Structure

```text
novamind-ai-platform/
├── backend/
│   ├── gateway/                  # Express reverse proxy API Gateway (Port 8000)
│   ├── services/
│   │   ├── auth/                 # Authentication, coin balances, transactions (Port 8001)
│   │   ├── resume/               # PDF parsing, ATS scoring, vector indexing (Port 8002)
│   │   ├── interview/            # LangGraph multi-agent interview engine (Port 8003)
│   │   ├── roadmap/              # Career roadmap synthesis & resource curation (Port 8004)
│   │   └── billing/              # Razorpay orders, HMAC verification & fulfillment (Port 8005)
│   ├── shared/
│   │   ├── middleware/           # requestLogger, healthCheck, verifyInternalSecret
│   │   ├── rag/                  # textSplitter, embeddings, qdrantClient, retriever
│   │   └── redis/                # Bounded ioredis client with health checks
│   ├── tests/                    # Comprehensive unit, integration & E2E test suites
│   ├── docker-compose.yml        # Multi-container orchestration (services, redis, qdrant)
│   └── package.json
├── frontend/                     # React 19 + Vite client with route-level code splitting
├── docs/                         # Screenshots, guides, and architectural diagrams
└── .github/workflows/ci.yml      # Automated CI/CD pipeline
```

---

## 🚀 Quick Start & Local Development

### Prerequisites
- **Node.js** (v20+ recommended)
- **MongoDB** (v6+ or Atlas URI)
- **Redis** (v6+)
- **Qdrant Vector Database** (or Docker for automated local container)
- API Keys: Google Gemini, Groq / OpenRouter, Razorpay (test credentials), Firebase

### 1. Backend Setup & Automated Test Suites
```bash
cd backend
npm install

# Run complete regression test suite (54/54 tests passing)
npm test

# Run individual test suites
npm run test:phase2    # Business logic & concurrency tests
npm run test:phase3    # RAG & Qdrant vector tests
npm run test:phase4    # Production readiness & E2E lifecycle tests
```

### 2. Frontend Setup & Production Build
```bash
cd frontend
npm install

# Start local Vite development server
npm run dev

# Run optimized production build (code-split bundle)
npm run build
```

### 3. Docker Compose Local Deployment
```bash
cd backend
docker-compose up -d --build
```

---

## 🩺 Health Check & Monitoring Endpoints

Each microservice and the API Gateway expose standardized health check endpoints:

- `GET /health` — General service status, uptime, and identifier.
- `GET /health/live` — Lightweight orchestrator liveness probe.
- `GET /health/ready` — Comprehensive readiness probe validating active MongoDB, Redis, and Qdrant connectivity without credential exposure.

---

## 🛡️ Security Hardening Summary

1. **Defense-in-Depth Internal Barrier**: Gateway strictly blocks client requests to `/internal/*`; internal microservice endpoints require cryptographic header `x-internal-secret`.
2. **Timing-Safe Cryptography**: Razorpay HMAC payment verification uses `crypto.timingSafeEqual` against timing side-channel attacks.
3. **Atomic Financial Transactions**: Coin deductions use MongoDB `{ interviewCoin: { $gte: amount } }` preventing negative balances under extreme concurrency.
4. **Distributed Concurrency Control**: Interview answer submissions acquire a Redis distributed lock (`SET NX EX`) with atomic Lua script token release.
5. **Strict Multi-Tenant RAG Isolation**: Every Qdrant vector upsert, search, and delete strictly enforces `{ key: "userId", match: { value: userId } }`.
6. **Prompt-Injection Guardrails**: Candidate resume evidence is enclosed in `<candidate_resume_context>` tags with explicit LLM defense boundaries.
7. **Container Security**: All production Dockerfiles use `node:20-alpine`, execute under unprivileged user `USER node`, and include built-in `HEALTHCHECK` probes.

---

## 📄 License

Licensed under the MIT License — see the LICENSE file for details.
