# NovaMind AI Interview Platform — Workflows & Features Guide

## 1. Introduction

This guide documents the detailed user journeys, state machine workflows, client-server interactions, and UI components across the primary functional modules of the **NovaMind AI Interview Platform**.

---

## 2. Authentication & Session Lifecycle

```
[User clicks "Continue with Google"]
                │
                ▼
[Firebase Popup initiates OAuth 2.0]
                │
                ▼
[Firebase returns ID Token (JWT)]
                │
                ▼
[Client posts to /api/auth/login via Gateway]
                │
                ▼
[Auth Service: verifyIdToken(token)]
                │
                ├─► User exists? Update profile
                └─► New user? Create user document + 150 Free Coins
                │
                ▼
[Generate crypto.randomUUID() Session ID]
                │
                ▼
[Save {userId, email, coins} to Redis (session:<id>, TTL: 7 Days)]
                │
                ▼
[Set-Cookie: session=<id>; HttpOnly; Secure; SameSite=Lax/None]
                │
                ▼
[Client redirected to /dashboard with active user state]
```

### Key Technical Aspects:
- **Client**: `LoginModel.jsx` triggers `signInWithPopup(auth, provider)` from Firebase Auth.
- **Session Lookup**: Any subsequent request to protected routes (`/api/interview`, `/api/resume`, etc.) sends the cookie automatically. The Gateway's `isAuth` middleware queries Redis (`session:<sessionId>`), sets `req.user`, and enriches the proxied headers with `x-user-id`.

---

## 3. AI Mock Interview Workflow & LangGraph State Machine

### 3.1 Step 1: Configuration & Setup (`Step1setup.jsx`)
- Candidate selects **Interview Track**: `Technical` or `HR / Behavioral`.
- Selects **Job Role**: e.g., Full Stack Engineer, Frontend Specialist, Backend Architect, DevOps Engineer.
- Selects **Context Mode**:
  - Standard role questions.
  - **Resume-Tailored**: Pulls candidate's uploaded resume data to tailor questions around candidate's specific projects, work history, and declared tech stack.
- Checks coin balance (each interview costs **50 coins**). If sufficient, calls `useCoins({ coins: 50, action: "interview" })`.

### 3.2 Step 2: Live Interview Simulation (`Step2interview.jsx`)

```
               [Client triggers startInterview()]
                               │
                               ▼
               [LangGraph Router: action === "start"]
                               │
                               ▼
                    [interviewAgent invoked]
               (Technical or HR prompt sent to LLM)
                               │
                               ▼
                   [6 Progressive Questions Generated]
                               │
                               ▼
                 [Interview Document saved in MongoDB]
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    QUESTION EXECUTION LOOP                   │
│                                                              │
│ 1. AI Avatar Video speaks question (male/female avatar)      │
│ 2. Countdown timer begins (60-90 seconds)                    │
│ 3. Candidate responds via Web Speech API or Code Editor      │
│ 4. Real-time interim speech-to-text transcript displayed     │
│ 5. Candidate clicks "Submit Answer"                          │
│                                                              │
│                       submitAnswer()                         │
│                              │                               │
│                              ▼                               │
│            [LangGraph Router: action === "feedback"]         │
│                              │                               │
│                              ▼                               │
│                    [feedbackAgent invoked]                   │
│             (Evaluates 8 skill metrics + feedback)           │
│                              │                               │
│                              ▼                               │
│          Is currentQuestion + 1 >= totalQuestions?           │
│                  │                       │                   │
│            NO ───┘                       └───► YES           │
│             │                                    │           │
│             ▼                                    ▼           │
│  [Advance to Next Question]              [summaryAgent]      │
│                                                  │           │
│                                                  ▼           │
│                                         [Final Report & Score]
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Live Coding Pad (`CodeEditor.jsx`)
- For technical challenges requiring code implementation, candidate opens the built-in coding modal.
- Supports **JavaScript, Python, TypeScript, Java, and C++**.
- Includes automatic 2-space Tab indentation, starter code templates, and one-click insertion formatted into GitHub-flavored markdown fences (` ```lang ... ``` `) directly into the answer transcript.

### 3.4 Step 3: Performance Radar & Report (`Step3report.jsx` & `InterviewReport.jsx`)
Upon completion, the candidate receives an interactive evaluation dashboard:
- **Overall Performance Score (0-100)** with animated circular progress indicator.
- **Radar Skill Chart (Recharts)** visualizing performance across 8 vectors:
  1. *Correctness*: Technical accuracy and handling of edge cases.
  2. *Clarity*: Structure, conciseness, and articulation.
  3. *Relevance*: Direct addressing of the interviewer's prompt.
  4. *Detail*: Depth of architectural and implementation knowledge.
  5. *Efficiency*: Computational complexity and optimal solution paths.
  6. *Communication*: Professionalism, tone, and confidence.
  7. *Problem Solving*: Systematic breakdown of complex scenarios.
  8. *Creativity*: Novel approaches and alternative tradeoffs.
- **Strengths & Weaknesses**: Itemized takeaways for targeted study.
- **Question-by-Question Deep Dive**: Candidate answer review alongside personalized feedback and 3 concrete improvement suggestions.

---

## 4. ATS Resume Scorer & Builder Workflow

### 4.1 ATS Scorer (`Scorer.jsx` & `backend/services/resume`)
1. **File Dropzone**: Candidate uploads a PDF resume (max 20MB).
2. **Text Extraction**: Multer buffers the upload, and `pdf-parse` extracts raw text into memory.
3. **ATS Analyzer Agent (`resumeAgent`)**:
   - Compares resume text against industry ATS parser algorithms.
   - Computes an **ATS Compatibility Score (0-100)**.
   - Extracts structured candidate details: name, email, phone, skills, projects, experience, education.
   - Identifies **Missing Skills** crucial for target roles.
   - Suggests optimal job titles and actionable resume enhancement recommendations.
4. **Data Sanitization**:
   - Strips deep-thinking traces (`<think>...</think>`).
   - Normalizes non-printable unicode control characters.
   - Persists document in MongoDB (`Resume`) and caches in Redis (`resume:<userId>`).
   - Deletes temporary upload file from disk (`fs.unlinkSync`).

### 4.2 Resume Builder (`ResumeBuilder.jsx`)
- Allows candidates to interactively build, tweak, and export their resume.
- Features real-time template switching:
  - **ATS-Optimized Template**: Clean, high-parsing rate formatting.
  - **Modern Template**: Polished layout for startup and product company applications.
  - **Tech-Focused Template**: Emphasizes GitHub repositories, tech stacks, and architecture projects.
- One-click print / PDF export powered by `react-to-print`.

---

## 5. Dynamic Career Roadmap Workflow

### 5.1 Roadmap Synthesis (`Roadmap.jsx` & `backend/services/roadmap`)
1. Candidate inputs:
   - **Target Role** (e.g., "Full Stack MERN Engineer", "AI/ML Systems Engineer").
   - **Target Package / Compensation Tier** (e.g., "12-18 LPA", "25+ LPA Tier-1 Tech").
   - **Personalization**: Optional toggle to incorporate their ATS resume skill gaps.
2. **LangGraph Pipeline**:
   - **Node 1 (`roadmapAgent`)**: Designs a structured curriculum broken down into sequential modules with difficulty ratings (`Easy`, `Medium`, `Hard`) and expected time commitments.
   - **Node 2 (`resourceAgent`)**:
     - Asks LLM for official documentation and high-quality learning articles.
     - Queries YouTube Data API v3 to retrieve the most viewed, highly rated tutorial video for each module topic.
3. **Interactive Explorer**:
   - Displays a clean visual roadmap timeline.
   - Each module contains deep-dive topic descriptions, official documentation hyperlinks, and embedded YouTube tutorial links.
   - Caches roadmap in Redis for rapid subsequent loads.

---

## 6. Commercial Coin & Billing Workflow

### 6.1 Purchasing Interview Packs (`Billing.jsx` & `backend/services/billing`)
1. Candidate navigates to Billing & Plans:
   - **Starter Pack**: ₹199 -> 300 coins (6 interviews or 30 resume scans).
   - **Pro Pack**: ₹499 -> 900 coins (18 interviews or 90 resume scans).
   - **Mastery Pack**: ₹999 -> 2500 coins (50 interviews or 250 scans).
2. **Order Creation**:
   - Client calls `createBillingOrder(planId)`.
   - Billing service calculates amount in paise (`plan.amount * 100`) and calls Razorpay API to generate a registered order.
   - Saves initial billing record with status `created`.
3. **Razorpay Checkout**:
   - Razorpay client modal opens within the browser.
   - Candidate completes payment via UPI, Credit/Debit Card, or Netbanking.
4. **Cryptographic Verification**:
   - Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
   - Client posts verification payload to `/api/billing/verify`.
   - Server computes `HMAC-SHA256(order_id + "|" + payment_id, SECRET)`.
   - If signatures match, updates transaction status to `paid` and credits the purchased interview coins to candidate account balance.
