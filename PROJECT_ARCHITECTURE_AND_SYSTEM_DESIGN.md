# NovaMind AI Interview Platform — Architecture & System Design Document

## 1. Executive Summary

**NovaMind AI** is an enterprise-grade, microservices-powered AI interview preparation and career acceleration platform. The platform empowers software engineers and tech job seekers to practice adaptive technical and behavioral interviews with real-time AI avatars, receive granular skill gap evaluations, optimize their resumes with an automated ATS (Applicant Tracking System) scorer, and generate personalized, resource-backed learning roadmaps.

The platform is designed with high scalability, fault tolerance, and modularity in mind, separating responsibilities into a centralized API Gateway, distributed backend microservices, a distributed caching and session layer, and a high-performance modern React client.

---

## 2. High-Level System Architecture

```
[ Client: React 19 + Vite + Tailwind CSS ]
                   │
                   ▼ (HTTP / REST with Credentials)
      ┌─────────────────────────────┐
      │     API Gateway (Port 8000) │
      │  - Express Reverse Proxy    │
      │  - CORS & Security Headers  │
      │  - Redis Session Auth Check │
      │  - Header Enrichment (x-user-id)
      └──────────────┬──────────────┘
                     │
     ┌───────────────┼───────────────┬───────────────┬───────────────┐
     ▼               ▼               ▼               ▼               ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│Auth Serv. │ │Resume Srv │ │Interv. Srv│ │Roadmap Srv│ │Billing Srv│
│(Port 6001)│ │(Port 6002)│ │(Port 6003)│ │(Port 6004)│ │(Port 6005)│
└─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
      │             │             │             │             │
      ├─────────────┴─────────────┴─────────────┴─────────────┤
      ▼                                                       ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│     MongoDB Cluster     │               │   Redis Cache & Store   │
│  - Users & Coin Balance │               │  - 7-Day User Sessions  │
│  - Resume ATS Scores    │               │  - Interview Caches     │
│  - Interviews & Radar   │               │  - Roadmap Data Cache   │
│  - Roadmaps & Modules   │               │  - Exponential Backoff  │
│  - Billing & Orders     │               └─────────────────────────┘
└─────────────────────────┘
```

---

## 3. Microservices Breakdown & Responsibilities

### 3.1 API Gateway (`backend/gateway` — Port 8000)
- **Role**: Single entry point for all frontend traffic.
- **Technology**: Express, `express-http-proxy`, `cookie-parser`, `cors`, `morgan`.
- **Key Functions**:
  - **Reverse Proxy Routing**: Routes requests dynamically to downstream microservices based on URL path prefixes (`/api/auth`, `/api/resume`, `/api/interview`, `/api/roadmap`, `/api/billing`).
  - **Authentication Guard (`isAuth`)**: Inspects the incoming `session` HTTP-only cookie, verifies it against Redis (`session:<sessionId>`), and injects parsed user metadata into `req.user`.
  - **Header Decoration (`proxyWithHeaders`)**: Injects `x-user-id` into downstream proxied requests so internal services do not need to repeat session verification.
  - **Multipart Streaming**: Intentionally bypasses body-parsing on `multipart/form-data` requests so that resume file upload streams maintain their raw binary boundaries for Multer.

### 3.2 Auth Service (`backend/services/auth` — Port 6001)
- **Role**: Authentication, session issuance, and user coin ledger management.
- **Technology**: Express, Firebase Admin SDK, Mongoose, Redis.
- **Key Functions**:
  - **Google OAuth Verification**: Verifies client-side Firebase JWT tokens using Firebase Admin SDK.
  - **User Persistence**: Upserts the user record in MongoDB, granting initial free credits (150 interview coins).
  - **Session Management**: Generates a secure random UUID session ID, saves session data to Redis with a 7-day TTL (`EX 604800`), and issues an HTTP-only, secure cookie.
  - **Atomic Coin Ledger (`useCoins`)**: Uses MongoDB's atomic `$inc: { interviewCoin: -coinAmount }` with condition `{ interviewCoin: { $gte: coinAmount } }` to eliminate race conditions under concurrent requests.

### 3.3 Interview Service (`backend/services/interview` — Port 6003)
- **Role**: Core intelligence engine for mock interviews.
- **Technology**: Express, LangChain, LangGraph, Mongoose, Redis.
- **Key Functions**:
  - **LangGraph State Machine**: Orchestrates execution nodes (`interviewNode`, `feedbackNode`, `summaryNode`) based on state triggers (`start` vs `feedback`).
  - **Adaptive Question Generation**: Crafts role-specific questions for Technical (coding, system design, architecture) or HR (behavioral, leadership, conflict resolution) tracks, factoring in the candidate's parsed resume if provided.
  - **Per-Question Scoring**: Evaluates answers across 8 core dimensions: *Correctness, Clarity, Relevance, Detail, Efficiency, Communication, Problem Solving, and Creativity* (0-100 scale).
  - **End-of-Interview Summary**: Computes composite final score, strengths, weaknesses, and concrete recommendations upon completing all questions.
  - **Radar Analytics**: Aggregates multi-dimensional performance data across past technical and HR interviews for candidate skill radar visualization.
  - **Multi-Tier Fault-Tolerant LLM Pipeline**:
    1. Primary: Groq (ultra-low latency with `openai/gpt-oss-120b`).
    2. Fallback 1: OpenRouter (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`).
    3. Fallback 2: Google Gemini (`gemini-3.6-flash`).

### 3.4 Resume Service (`backend/services/resume` — Port 6002)
- **Role**: Document ingestion, plain-text parsing, and ATS analysis.
- **Technology**: Express, Multer, `pdf-parse`, LangChain, Mongoose, Redis.
- **Key Functions**:
  - **Upload Pipeline**: Streams PDF through Multer to a temporary disk path with strict 20MB limits and MIME-type validation.
  - **Text Extraction**: Uses `pdf-parse` to convert binary PDF layout into raw string content.
  - **ATS LLM Analysis**: Analyzes resume text against modern applicant tracking system rubrics, computing an ATS score (0-100), identifying missing skills, suggested roles, and extraction of projects/experience.
  - **Sanitization & Cleanup**: Strips reasoning tags (`<think>...</think>`), markdown formatting, and non-printable control characters before JSON serialization. Deletes temporary upload files from disk (`fs.unlinkSync`).

### 3.5 Roadmap Service (`backend/services/roadmap` — Port 6004)
- **Role**: Dynamic career progression roadmap synthesis and learning resource curation.
- **Technology**: Express, LangGraph, YouTube Data API v3, Axios, Mongoose, Redis.
- **Key Functions**:
  - **Multi-Agent Flow**:
    1. `roadmapAgent`: Takes role, target salary/package, and candidate skill gaps to construct a multi-module milestone roadmap.
    2. `resourceAgent`: Queries LLM for official documentation URLs and concurrently queries the YouTube Data API to fetch the top-ranked video tutorial for every topic.
  - **Caching Strategy**: Caches generated roadmaps for 1 hour (`3600s`) in Redis.

### 3.6 Billing Service (`backend/services/billing` — Port 6005)
- **Role**: Monetization, coin pack management, and payment gateway integration.
- **Technology**: Express, Razorpay SDK, Crypto (HMAC SHA-256), Mongoose.
- **Key Functions**:
  - **Plan Catalog**: Exposes Starter (300 coins / ₹199), Pro (900 coins / ₹499), and Mastery (2500 coins / ₹999) packs.
  - **Razorpay Order Creation**: Converts currency into paise (INR * 100) and creates an order with a timestamped receipt ID.
  - **Cryptographic Signature Verification**: Computes HMAC SHA-256 digest (`${orderId}|${paymentId}`) with the Razorpay Secret and compares against client signature to ensure tamper-proof payment confirmation.

### 3.7 Shared Infrastructure (`backend/shared/redis`)
- **Role**: Centralized Redis singleton with exponential backoff (`Math.min(times * 100, 3000)`), connection lifecycle event handlers, and `maxRetriesPerRequest: null`.

---

## 4. Database Schema Design (MongoDB)

### 4.1 User Schema (`User`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `firebaseUid` | String | required, unique, indexed | Unique identifier from Firebase Auth |
| `name` | String | required, trim | Candidate display name |
| `email` | String | required, unique, lowercase | Candidate primary email |
| `interviewCoin` | Number | default: 150, min: 0 | Current balance of interview credits |
| `timestamps` | Date | `createdAt`, `updatedAt` | Automatic audit timestamps |

### 4.2 Interview Schema (`Interview`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `userId` | ObjectId | required, indexed, ref: User | Owner of the interview |
| `type` | String | enum: `["hr", "technical"]` | Track classification |
| `role` | String | required | Target job role |
| `useResume` | Boolean | default: false | Indicates if personalized to resume |
| `currentQuestion` | Number | default: 0 | Pointer to active question index |
| `questions` | Array | `[questionSchema]` | Array of 6 progressive questions |
| `overallScore` | Number | default: 0 | Cumulative performance score (0-100) |
| `strengths` | [String] | default: [] | AI-identified candidate strengths |
| `weaknesses` | [String] | default: [] | AI-identified areas for improvement |
| `recommendations`| [String] | default: [] | Actionable next steps |
| `summary` | String | default: "" | Comprehensive post-interview summary |
| `status` | String | enum: `["in-progress", "completed"]` | Session status |

#### Sub-Schema: `questionSchema`
- `question` (String, required): Prompt text presented to user.
- `userAnswer` (String): Transcript of spoken answer or typed code.
- `difficulty` (String: "easy" | "medium" | "hard").
- `timer` (Number, default: 60s/90s).
- `feedback` (Embedded `feedbackSchema`):
  - `score`, `correctness`, `clarity`, `relevance`, `detail`, `efficiency`, `communication`, `problemSolving`, `creativity` (all Numbers 0-100).
  - `feedback` (String, natural 2-sentence conversational feedback).
  - `improvements` ([String], exactly 3 actionable points).

### 4.3 Resume Schema (`Resume`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `userId` | ObjectId | required, unique, indexed | Candidate ID |
| `extractedText` | String | required | Full raw text extracted from PDF |
| `score` | Number | default: 0 | ATS optimization score (0-100) |
| `summary` | String | default: "" | AI synthesized professional summary |
| `skills` | [String] | default: [] | Extracted technical and soft skills |
| `missingSkills` | [String] | default: [] | Skills required for role that are missing |
| `education` | [Mixed] | default: [] | Structured education history |
| `experience` | [Mixed] | default: [] | Work history |
| `projects` | [Mixed] | default: [] | Extracted project portfolio |
| `suggestedRole` | String | default: "" | Optimal job role match |
| `recommendations`| [String] | default: [] | Formatting and ATS keyword improvements |

### 4.4 Billing Schema (`Billing`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `userId` | ObjectId | required, indexed | Purchaser ID |
| `amount` | Number | required | Amount paid in INR |
| `interviewCoins` | Number | required | Purchased coin quantity |
| `razorpayOrderId` | String | indexed | Order ID generated by Razorpay |
| `razorpayPaymentId`| String | optional | Payment ID returned upon success |
| `razorpaySignature`| String | optional | HMAC SHA-256 verification signature |
| `status` | String | enum: `["created", "paid", "failed"]` | Order payment state |

---

## 5. Security & Data Protection Architecture

1. **HTTP-Only, SameSite Cookies**: Sessions are stored in tamper-proof HTTP-only cookies, preventing Cross-Site Scripting (XSS) credential theft.
2. **Reverse Proxy Isolation**: Microservices run in private networking spaces; only the Gateway is exposed to public HTTP traffic.
3. **Internal Header Decoration**: `x-user-id` is stripped from client inputs at the gateway and replaced with the cryptographically verified session owner ID, preventing user impersonation.
4. **Race-Condition Safe Transactions**: Coin balances are deducted using conditional atomic increments in MongoDB, preventing double-spending.
5. **HMAC SHA-256 Webhook Verification**: Razorpay transactions are validated through cryptographic signatures before crediting user balances.
6. **Automatic File Purging**: Uploaded resume PDFs are immediately deleted from local disk after text extraction.

---

## 6. Scalability & Resilience Mechanisms

1. **Stateless Services**: All microservices are completely stateless; all shared state resides in Redis and MongoDB.
2. **Cache-Aside Pattern**:
   - User interviews list cached in Redis (`interviews:<userId>`) with 10-minute TTL.
   - User resume cached in Redis (`resume:<userId>`) with 10-minute TTL.
   - Roadmaps cached in Redis (`roadmap:<id>`) with 1-hour TTL.
3. **Multi-Model LLM Fallback Pipeline**: LangChain's `.withFallbacks()` automatically switches from Groq to OpenRouter to Gemini if rate limits (HTTP 429) or service outages occur.
4. **Redis Reconnection Logic**: Reconnects automatically using exponential backoff to handle intermittent network blips without crashing microservice pods.
