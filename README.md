# 🎙️ BaatCheet — AI-Powered Mock Interview Platform

> Practice interviews with a real-time AI interviewer that listens, evaluates, and gives you actionable feedback.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-baatcheet.vercel.app-emerald?style=for-the-badge)](https://baatcheet-orcin.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-purple?style=for-the-badge)](https://ai-interview-platform-4xc1.onrender.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-JS-orange?style=for-the-badge)](https://langchain-ai.github.io/langgraphjs)

---

## 🧠 What is BaatCheet?

BaatCheet is an AI-powered mock interview platform that conducts voice-based technical interviews. It listens to your spoken answers, evaluates them in real time, asks intelligent follow-up questions, and delivers a detailed performance report — all without a human interviewer.

Built for **job seekers** and **students** who want to sharpen their interview skills before the real thing, at a fraction of the cost of human-led mock interviews.

---

## ✨ Key Features

- 🎤 **Voice-Based Interviews** — speak your answers naturally; no typing required
- 🤖 **Intelligent Follow-ups** — AI asks deeper questions when your answer needs more detail
- 📊 **Detailed Result Page** — per-question scores, overall feedback, strengths, and actionable improvement tips
- 📄 **Resume-Aware Questions** — upload your resume; the AI tailors questions to your background
- 💳 **Credit-Based Subscription** — flexible plans from free tier to pro yearly
- 🔒 **Auth Options** — Google OAuth, GitHub OAuth, or email/password
- ⚡ **Real-Time Everything** — Socket.io for live interview state, BullMQ for async resume processing
- 🧩 **LangGraph Orchestration** — stateful AI graph manages the full interview lifecycle

---

## 🛠️ Tech Stack

### Frontend

| Technology               | Purpose                           |
| ------------------------ | --------------------------------- |
| Next.js 15 + TypeScript  | App framework                     |
| Tailwind CSS + shadcn/ui | Styling and components            |
| Zustand                  | Global auth state                 |
| Socket.io Client         | Real-time interview communication |
| Web Speech API           | Speech-to-text (STT)              |
| Recharts                 | Score visualizations              |

### Backend

| Technology                     | Purpose                            |
| ------------------------------ | ---------------------------------- |
| Node.js + Express + TypeScript | API server                         |
| Socket.io                      | Real-time bidirectional events     |
| LangGraph JS                   | AI interview graph orchestration   |
| Groq (llama-3.3-70b)           | Question generation and evaluation |
| Google Gemini                  | Result generation                  |
| Sarvam AI                      | Text-to-speech (TTS)               |
| BullMQ                         | Async resume processing queue      |
| Prisma ORM                     | Database access layer              |

### Infrastructure

| Technology          | Purpose                                   |
| ------------------- | ----------------------------------------- |
| PostgreSQL (NeonDB) | Primary database                          |
| Redis (Upstash)     | BullMQ job queue + credit deduction guard |
| AWS S3              | Resume PDF storage                        |
| Razorpay            | Payment processing                        |
| Render              | Backend deployment                        |
| Vercel              | Frontend deployment                       |

---

## 🏗️ System Architecture

> High-level architecture diagram coming soon.

```
User (Browser)
    │
    ├── REST API (axios) ──────────────► Express Server (Render)
    │                                         │
    └── WebSocket (socket.io) ───────────────►│
                                              ├── LangGraph Interview Graph
                                              │      ├── Initializer Node
                                              │      ├── Question Generator (Groq)
                                              │      ├── Evaluator (Groq)
                                              │      ├── Flow Controller
                                              │      └── Result Generator (Gemini)
                                              │
                                              ├── PostgreSQL (NeonDB)
                                              ├── Redis (Upstash) — BullMQ
                                              └── AWS S3 — Resume Storage
```

---

## 🔄 How It Works

BaatCheet uses a **LangGraph stateful graph** to orchestrate the entire interview lifecycle:

1. **Setup** — user selects role, skills, difficulty, duration and uploads resume
2. **Resume Processing** — BullMQ worker extracts text from PDF asynchronously via AWS S3
3. **Interview Start** — LangGraph initializes state, calculates max questions from duration
4. **Question Generation** — Groq LLM generates role-specific questions tailored to resume
5. **Listening** — Web Speech API captures spoken answer with 2-second silence detection
6. **Evaluation** — Groq evaluates the answer, decides if follow-up is needed
7. **Flow Control** — graph decides next question or ends interview based on score and count
8. **Result Generation** — Gemini produces overall score, feedback, strengths, and improvements
9. **Result Page** — detailed breakdown with per-question scores and actionable tips

---

## 📸 Screenshots

> Screenshots coming soon.

---

## 🚀 Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database (or NeonDB account)
- Redis instance (or Upstash account)
- AWS S3 bucket
- Groq API key
- Google Gemini API key
- Sarvam AI API key

### 1. Clone the repository

```bash
git clone https://github.com/adarsh946/Ai_interview_platform.git
cd Ai_interview_platform
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in `/backend`:

```properties
# Database
DATABASE_URL=your_neondb_connection_string

# Redis
UPSTASH_REDIS_URL=rediss://your_upstash_redis_url
UPSTASH_REDIS_URL_IOREDIS=rediss://your_upstash_redis_url

# JWT
JWT_SECRET=your_jwt_secret

# AI
GOOGLE_AI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
SARVAM_API_KEY=your_sarvam_api_key

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_s3_bucket_name

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# URLs
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

Run database migrations and seed:

```bash
npx prisma migrate dev
npx prisma db seed
```

Start backend:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env.local` file in `/frontend`:

```properties
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

Start frontend:

```bash
npm run dev
```

### 4. Open in browser

```
http://localhost:3000
```

---

## 🌐 Deployment

### Backend — Render

- **Build Command:** `npm install && npx prisma generate && npm run build`
- **Start Command:** `npm run start`
- **Environment:** Node.js
- Add all backend environment variables in Render dashboard

### Frontend — Vercel

- **Framework:** Next.js
- **Root Directory:** `frontend`
- Add `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` in Vercel environment variables

---

## 💳 Subscription Plans

| Plan         | Price         | Credits             | Expiry        |
| ------------ | ------------- | ------------------- | ------------- |
| Free         | ₹0            | 3 credits on signup | Never         |
| Basic        | ₹199/month    | 10 credits          | Monthly cycle |
| Pro          | ₹499/month    | 30 credits          | Monthly cycle |
| Pro Yearly   | ₹4999/year    | 360 credits         | Yearly cycle  |
| Starter Pack | ₹99 one-time  | 5 credits           | Never         |
| Booster Pack | ₹199 one-time | 12 credits          | Never         |

1 credit = 1 interview session

---

## 🗺️ Roadmap

- [ ] Screenshot of this roadmap — add architecture diagram
- [ ] Mobile app (React Native)
- [ ] Company dashboard — let companies use BaatCheet for initial candidate screening (like Mercor)
- [ ] Interview history and analytics over time
- [ ] Support for more interview types (HR, System Design, DSA)
- [ ] Company-specific interview prep (Google, Amazon, etc.)
- [ ] Leaderboard and community features

---

## 👨‍💻 Author

**Adarsh Shukla**

- 🔗 [LinkedIn](https://www.linkedin.com/in/adarsh-shukla-610875201/)
- 🐙 [GitHub](https://github.com/adarsh946)
- 🌐 [Live Project](https://baatcheet-orcin.vercel.app)

---

## 📄 License

MIT License — feel free to use this project as inspiration for your own.

---

> Built with ❤️ by Adarsh Shukla — feedback welcome!
