# 🚀 NovaMind — Multi-Agent AI Interview & Career Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![LangChain](https://img.shields.io/badge/LangChain-LangGraph-1C3C3C?style=for-the-badge&logo=chainlink&logoColor=white)](https://js.langchain.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

---

## 📌 Project Overview

**NovaMind** is a full-stack, enterprise-grade AI interview and career development platform powered by a **multi-agent state machine** built on LangChain and LangGraph. The platform emulates realistic technical interviews, conducts semantic resume analysis, constructs tailored learning roadmaps, and provides data-driven feedback to help engineers accelerate their career readiness.

Built on an independent **microservices architecture** reverse-proxied through a unified API Gateway, NovaMind is designed for high scalability, fault isolation, and low-latency response streaming.

---

## ✨ Key Features

- 🤖 **Adaptive Multi-Agent AI Interviews**: Real-time mock technical interviews powered by cyclic LangGraph workflows. Dynamically adjusts question difficulty based on candidate responses.
- 📄 **Intelligent Resume Parser & Scorer**: Parses PDF resumes, compares candidate profiles against target roles, and produces ATS compatibility metrics and actionable suggestions.
- 🗺️ **Personalized Career Roadmaps**: Generates structured, step-by-step milestone roadmaps with curated YouTube and documentation resources.
- 📊 **Skill Analytics & Radar Visualizations**: Interactive Recharts visualizations tracking problem solving, conceptual clarity, and behavioral performance.
- 💳 **Subscription & Credit Management**: Integrated Razorpay checkout with webhook-driven order fulfillment.
- 🔐 **Secure Google OAuth Authentication**: Firebase Client SDK authentication verified server-side with Firebase Admin tokens.

---

## 🏗️ System Architecture

```
                                  +---------------------+
                                  |     Client (Web)    |
                                  | React 19 + Vite UI  |
                                  +----------+----------+
                                             |
                                             v (HTTP/REST)
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
        |   MongoDB    |    | Redis Cache  |     | Groq / LLMs |   |  Razorpay   |
        +--------------+    +--------------+     +-------------+   +-------------+
```

---

## 📂 Repository Structure

```text
novamind-multiagent-ai-platform/
├── backend/
│   ├── gateway/                  # Express reverse proxy API Gateway
│   ├── services/
│   │   ├── auth/                 # User authentication & session management
│   │   ├── resume/               # PDF extraction & AI resume evaluation agent
│   │   ├── interview/            # Multi-agent LangGraph interview orchestrator
│   │   ├── roadmap/              # AI career milestone & video recommendation
│   │   └── billing/              # Razorpay checkout & subscription tracking
│   └── shared/                   # Shared types, utilities, and helpers
├── frontend/                     # React 19 + Vite + Tailwind CSS client
├── .gitignore                    # Comprehensive repository ignore rules
├── PROJECT_ARCHITECTURE_AND_SYSTEM_DESIGN.md
├── PROJECT_WORKFLOW_AND_FEATURES_GUIDE.md
└── TECH_STACK_AND_DEPLOYMENT_GUIDE.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/atlas) or local MongoDB instance
- [Redis](https://redis.io/) (v6+)
- API Keys: Groq / Gemini / OpenRouter, Razorpay (test keys), Firebase

### 1. Environment Setup
Each microservice and the frontend maintain isolated environment configurations. Copy the provided `.env.example` templates to `.env`:

```bash
# Gateway
cp backend/gateway/.env.example backend/gateway/.env

# Services
cp backend/services/auth/.env.example backend/services/auth/.env
cp backend/services/billing/.env.example backend/services/billing/.env
cp backend/services/interview/.env.example backend/services/interview/.env
cp backend/services/resume/.env.example backend/services/resume/.env
cp backend/services/roadmap/.env.example backend/services/roadmap/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 2. Install Dependencies
```bash
# Frontend
cd frontend && npm install

# Backend Services
cd ../backend/gateway && npm install
cd ../services/auth && npm install
cd ../services/billing && npm install
cd ../services/interview && npm install
cd ../services/resume && npm install
cd ../services/roadmap && npm install
```

### 3. Run Locally
Start the backend services and the frontend client concurrently:

```bash
# In separate terminal tabs or using Docker Compose:
npm run dev
```

---

## 🛡️ Security Note

All secret credentials, `.env` files, API keys, and personal candidate resume uploads are omitted from this repository via `.gitignore`. Refer to the `.env.example` files in each service directory for configuration schemas.

---

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.
