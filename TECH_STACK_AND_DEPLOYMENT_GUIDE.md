# NovaMind AI Interview Platform — Tech Stack & Deployment Guide

## 1. Complete Technology Stack

### 1.1 Frontend Ecosystem
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2.8 | Core reactive UI library using modern Hooks and functional components |
| **Vite** | 8.2.0 | Next-generation ultra-fast bundler and development server |
| **Tailwind CSS** | 4.3.3 | Modern utility-first CSS framework with Vite native plugin |
| **Redux Toolkit** | 2.12.0 | Predictable centralized state container for candidate resume builder |
| **React Redux** | 9.3.0 | React bindings for Redux store integration |
| **React Router DOM** | 7.18.2 | Client-side routing, protected route guards, dynamic parameters |
| **Framer Motion** | 13.1.1 | Production-ready motion and physics-based UI transitions |
| **Recharts** | 3.10.1 | Composable declarative charting library for candidate skill radar visualizer |
| **React to Print** | 3.3.0 | High-fidelity resume PDF printing directly from DOM |
| **React Icons** | 5.7.0 | Vector icon sets (Lucide, Feather, Tabler, Material Design) |
| **Axios** | 1.19.0 | Promise-based HTTP client configured with cookie credentials |
| **Firebase Client SDK** | 12.18.0 | Client-side Google OAuth popup authentication |

### 1.2 Backend & Microservices Ecosystem
| Technology | Package | Purpose |
|---|---|---|
| **Runtime** | Node.js (ES Modules `type: "module"`) | Asynchronous non-blocking runtime environment |
| **Web Framework** | Express.js 4.x | RESTful API routing, middleware chaining, and service controllers |
| **API Gateway Proxy**| `express-http-proxy` | Reverse-proxying client HTTP traffic to internal microservices |
| **Database ORM** | `mongoose` | Document schema validation, indexing, and MongoDB queries |
| **Distributed Cache**| `ioredis` | High-performance Redis client with auto-reconnection and connection monitoring |
| **AI / Multi-Agent** | `@langchain/core`, `@langchain/langgraph` | Cyclical graph state machine, agent routing, and memory flow |
| **LLM Inference** | `@langchain/groq`, `@langchain/openai`, `@langchain/google-genai` | Multi-tier fallback LLM orchestration |
| **Document Parsing** | `pdf-parse` | Extracting raw text from binary PDF resumes |
| **File Ingestion** | `multer` | Disk streaming and MIME-type validation for resume uploads |
| **Payment Gateway** | `razorpay` | Commercial payment order generation and subscription tracking |
| **Auth Admin** | `firebase-admin` | Cryptographic verification of client Firebase JWT tokens |
| **Security & Crypto**| Node.js Native `crypto` | HMAC SHA-256 payment signature verification and UUID generation |

---

## 2. Environment Variables Specification

Every service in the NovaMind platform maintains an isolated `.env` configuration file:

### 2.1 Gateway (`backend/gateway/.env`)
```env
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379

# Downstream Microservice URLs
AUTH_SERVICE_URL=http://localhost:6001
RESUME_SERVICE_URL=http://localhost:6002
INTERVIEW_SERVICE_URL=http://localhost:6003
ROADMAP_SERVICE_URL=http://localhost:6004
BILLING_SERVICE_URL=http://localhost:6005
```

### 2.2 Auth Service (`backend/services/auth/.env`)
```env
PORT=6001
NODE_ENV=development
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/novamind_auth
REDIS_URL=redis://localhost:6379
```

### 2.3 Interview Service (`backend/services/interview/.env`)
```env
PORT=6003
NODE_ENV=development
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/novamind_interview
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=AIzaSy...
```

### 2.4 Resume Service (`backend/services/resume/.env`)
```env
PORT=6002
NODE_ENV=development
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/novamind_resume
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=gsk_...
```

### 2.5 Roadmap Service (`backend/services/roadmap/.env`)
```env
PORT=6004
NODE_ENV=development
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/novamind_roadmap
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=gsk_...
YOUTUBE_API_KEY=AIzaSy...
```

### 2.6 Billing Service (`backend/services/billing/.env`)
```env
PORT=6005
NODE_ENV=development
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/novamind_billing
REDIS_URL=redis://localhost:6379
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 2.7 Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=novamind-...firebaseapp.com
VITE_FIREBASE_PROJECT_ID=novamind-...
VITE_FIREBASE_STORAGE_BUCKET=novamind-...appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...:web:...
```

---

## 3. Production Deployment Architecture (AWS ECS & ECR)

The project includes an infrastructure blueprint (`deploymentSetup.txt`) targeting enterprise containerized cloud deployment on Amazon Web Services:

```
                  [Git Repository: Main Branch]
                               │
                               ▼
            [Docker Build (Multi-Stage Dockerfiles)]
             - Dockerfile.gateway
             - Dockerfile.auth
             - Dockerfile.interview
             - Dockerfile.resume
             - Dockerfile.roadmap
             - Dockerfile.billing
                               │
                               ▼
               [Container Images Tagged & Built]
                               │
                               ▼
              [Docker Push to Amazon ECR Registry]
             (Elastic Container Registry: Private Repos)
                               │
                               ▼
           [Amazon ECS Cluster (Fargate / EC2 Tasks)]
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Gateway Task    │   │ Auth Service    │   │ Interview Serv. │
│ (Target Group)  │   │ (Internal VPC)  │   │ (Internal VPC)  │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └─────────────────────┴─────────────────────┘
                               │
                               ▼
        [AWS Application Load Balancer (ALB) + HTTPS / ACM]
```

### 3.1 Docker Multi-Service Containerization
Each service uses an optimized multi-stage Node.js Alpine base image:
```dockerfile
# Example Service Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 6003
USER node
CMD ["node", "index.js"]
```

### 3.2 Deployment Workflow
1. **Build Step**:
   ```bash
   docker build -t novamind-gateway:latest -f ./backend/gateway/Dockerfile ./backend/gateway
   docker build -t novamind-interview:latest -f ./backend/services/interview/Dockerfile ./backend/services/interview
   # Repeat for auth, resume, roadmap, billing
   ```
2. **AWS ECR Authentication & Push**:
   ```bash
   aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.ap-south-1.amazonaws.com
   docker tag novamind-gateway:latest <aws_account_id>.dkr.ecr.ap-south-1.amazonaws.com/novamind-gateway:latest
   docker push <aws_account_id>.dkr.ecr.ap-south-1.amazonaws.com/novamind-gateway:latest
   ```
3. **ECS Deployment**:
   - Updates task definitions on AWS ECS.
   - ECS executes a blue-green rolling deployment without downtime.
   - Gateway container is bound to AWS ALB listener rules (port 443 with SSL/TLS certificate).
   - Internal microservices communicate over AWS Cloud Map private service discovery or internal VPC endpoints.
