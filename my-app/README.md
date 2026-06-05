# PathwiseAI

> An adaptive learning companion that builds your personalized curriculum, curates real-time resources, and enforces mastery-based progression — powered by Groq LLM.

<br />

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Environment Variables](#environment-variables)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Team](#team)

---
(Basic Walkthrough Video of Pathwise AI) Drive link: https://drive.google.com/file/d/1mBVpWZDYTJocyGvneJpLyiHZQYulsRwE/view?usp=drive_link
## Overview

PathwiseAI addresses two fundamental problems with online learning: one-size-fits-all content and fragmented resources. You tell it what you want to learn, your current level, and your goal — it generates a structured multi-week curriculum, fetches relevant YouTube tutorials and GitHub repositories for every topic, creates per-topic quizzes, and blocks you from advancing until you actually understand the material.

The platform is built around a **mastery gate**: a learner must score ≥ 60% on a topic quiz before the next week unlocks. This prevents the "silent gap" problem where small misunderstandings compound unnoticed over time.

---

## Features

### Curriculum Generation
- Enter a subject, skill level, and goal
- Groq LLM (LLaMA 3.3 70B) generates a complete weekly roadmap with topics and projects
- Each curriculum is saved and accessible from the home page history

### Resource Curation
- YouTube videos fetched live via YouTube Data API per topic
- GitHub repositories fetched and ranked by stars via GitHub Search API
- Resources tracked per-user — opening a link marks it as completed

### Per-Topic Quizzes
- 5 questions generated per topic, stored permanently in MongoDB after first generation
- Questions include a `subtopic` tag for fine-grained weakness detection
- Mix of MCQ, True/False, and scenario-based questions across easy/medium/hard
- Best score is kept; passed status is permanent once achieved

### Weak Subtopic Detection & Remediation
- After each quiz attempt, per-subtopic accuracy is computed
- Subtopics below 50% accuracy are flagged as weak
- Two remediation options: ask the AI tutor (chatbot) or take a focused re-quiz on weak subtopics only

### Progress Tracking
- Week unlocks only when: ≥ 70% resources read + 75% topic quizzes passed + project submitted
- Sidebar shows live overall progress percentage and week completion count
- Per-week progress bar shows article count, quiz pass rate, and project status

### Project Submission
- Each week has a project; mark it done with an optional GitHub link

### AI Chatbot
- Context-aware assistant scoped to the current week and topic
- Automatically detects intent: `explain`, `hint` (never gives direct quiz answers), or `general`
- Rolling 10-message history per session stored in MongoDB

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Authentication | JWT |
| LLM | Groq API — LLaMA 3.3 70B Versatile |
| Resource APIs | YouTube Data API v3, GitHub Search API |
| Deployment | Vercel (frontend), Render (backend) |

---

## Project Structure

```
PathwiseAI/
├── backend/
│   ├── controllers/
│   │   ├── chatController.js       # AI chatbot — Groq call + history
│   │   ├── progressController.js   # Resources, projects, quiz scores
│   │   └── quizController.js       # Per-topic quiz fetch/generate/attempt
│   ├── middleware/
│   │   └── auth.js                 # JWT verification
│   ├── models/
│   │   ├── ChatSession.js          # Rolling 10-message chat history
│   │   ├── User.js                 # User identity + credentials
│   │   ├── UserProgress.js         # Per-user week/topic/resource progress
│   │   └── WeekQuiz.js             # Cached question banks per topic
│   ├── routes/
│   │   ├── chatRoutes.js
│   │   ├── progressRoutes.js
│   │   └── quizRoutes.js
│   ├── utils/
│   │   ├── buildPrompt.js          # Context-aware system prompt builder
│   │   ├── generateQuestions.js    # Groq question generation per topic
│   │   ├── topicAnalysis.js        # Subtopic weakness analysis (pure fn)
│   │   ├── validateCourseId.js     # Guards against undefined courseId
│   │   └── weekCompletion.js       # Week unlock logic (pure fn)
│   ├── app.js                      # Express entry point
│   ├── learning_system.py          # Curriculum + resource generation (Python/Groq)
│   └── quiz_module.py              # (Legacy) Python quiz generator
│
└── src/                            # React frontend
    ├── api/
    │   ├── chatApi.ts
    │   ├── progressApi.ts
    │   └── quizApi.ts
    ├── components/
    │   ├── chat/
    │   │   ├── ChatWidget.tsx       # Floating chat button + slide-up panel
    │   │   ├── ChatMessage.tsx      # Single message bubble
    │   │   └── SuggestedPrompts.tsx # Context-aware quick prompts
    │   ├── progress/
    │   │   ├── WeekCard.tsx         # Full week card with expand/collapse
    │   │   ├── TopicQuizBar.tsx     # Per-topic pass/fail + quiz buttons
    │   │   ├── WeekProgressBar.tsx  # 3-pill summary (articles/quiz/project)
    │   │   ├── ResourceList.tsx     # Videos + repos with completion tracking
    │   │   ├── ProjectSection.tsx   # Mark done + GitHub link input
    │   │   └── QuizStatus.tsx       # Quiz score display
    │   └── quiz/
    │       ├── QuizModal.tsx        # Per-topic quiz modal orchestrator
    │       ├── QuizCard.tsx         # Single question renderer
    │       ├── QuizResults.tsx      # Score + subtopic breakdown + remediation
    │       └── quiz.types.ts        # Shared TypeScript types
    ├── hooks/
    │   ├── useProgress.ts           # All progress state + API actions
    │   ├── useTopicQuiz.ts          # Quiz state machine (idle→active→results)
    │   └── useChat.ts               # Chat local state
    └── pages/
        ├── Home.tsx                 # Curriculum generator + saved paths grid
        ├── LearningPath.tsx         # Main learning page (timeline + sidebar)
        ├── WeekDetails.tsx          # Expanded week with all topic resources
        ├── Overview.tsx             # Landing page
        ├── Login.tsx / Signup.tsx
        └── LoaderPage.tsx
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- Groq API key — [console.groq.com](https://console.groq.com)
- YouTube Data API key — [Google Cloud Console](https://console.cloud.google.com)
- GitHub personal access token (optional, increases rate limit)

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/pathwiseai.git
cd pathwiseai/backend

# 2. Install Node.js dependencies
npm install

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Create your .env file (see Environment Variables below)
cp .env.example .env

# 5. Start the backend
npm run dev        # nodemon for development
# or
node app.js        # production
```

The server starts on `http://localhost:5000`.

---

### Frontend Setup

```bash
# From the project root
cd my-app          # or wherever src/ lives

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app starts on `http://localhost:5173`.

---

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/pathwiseai

# Authentication
JWT_SECRET=your_strong_secret_here

# Groq LLM
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx

# YouTube Data API
YOUTUBE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxx

# Server
PORT=5000
```

Create a `.env` file in the frontend root (`my-app/`):

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## How It Works

### 1. Curriculum Generation

When you submit the form on the home page, the frontend calls the Python Flask endpoint `/api/generate`. `learning_system.py` builds a structured prompt and calls Groq to generate a weekly curriculum in JSON format. It then fetches YouTube videos and GitHub repositories for each topic concurrently and attaches them to the curriculum. The full curriculum JSON is stored in `localStorage` under the key `curriculum`, and the subject is stored under `subject`.

### 2. Learning Path Page

`LearningPath.tsx` reads the curriculum from `localStorage` and uses `courseId = subject` to load the user's progress document from MongoDB via `useProgress`. Each `WeekCard` receives its week data, the user's progress for that week, and a locked/unlocked state derived from whether the previous week is complete.

### 3. Per-Topic Quiz Flow

When a user clicks **Take Quiz** on a topic row inside a week card:

1. `QuizModal` opens and `useTopicQuiz.start(topic)` fires
2. `GET /api/quiz/:courseId/:weekNumber/:topic` is called
3. If questions exist in `WeekQuiz.topicBanks`, they're returned immediately (cached)
4. If not, Groq generates 5 questions for that topic with subtopic tags and saves them
5. The user answers questions one by one; `QuizCard` handles reveal + explanation
6. On finish, `POST /api/quiz/:courseId/:weekNumber/:topic/attempt` saves the attempt with per-question results
7. The backend runs `analyzeSubtopics()` and returns weak subtopic names
8. `QuizResults` shows the subtopic breakdown and, if weak subtopics exist, remediation options

### 4. Week Unlock Logic

A week is marked complete in MongoDB when **all three conditions are true**:

```
resources completed ≥ 70%
AND topic quizzes passed ≥ 75% of total topics
AND project marked done
```

This check runs automatically at the end of every mutation (resource open, quiz submit, project mark).

### 5. AI Chatbot

The floating `ChatWidget` sends messages to `POST /api/chat/:courseId` with a `context` object containing the current week, topics, quiz score, and pass status. `buildPrompt.js` detects intent from the message text and constructs a lean ~200-token system prompt. Groq responds with max 400 tokens. The last 10 messages are persisted in `ChatSession` for context continuity.

---

## API Reference

### Progress

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/progress/:courseId` | Load full progress for a course |
| `POST` | `/api/progress/:courseId/resource` | Mark a resource as completed |
| `POST` | `/api/progress/:courseId/quiz` | Save a quiz score |
| `POST` | `/api/progress/:courseId/project` | Mark project done + GitHub link |
| `GET` | `/api/progress/:courseId/week/:weekNumber` | Single week progress |

### Quiz

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/quiz/:courseId/:weekNumber/summary` | All topics' pass/fail for a week |
| `GET` | `/api/quiz/:courseId/:weekNumber/:topic` | Fetch (or generate) topic questions |
| `POST` | `/api/quiz/:courseId/:weekNumber/:topic/attempt` | Submit attempt, get subtopic analysis |
| `GET` | `/api/quiz/:courseId/:weekNumber/:topic/remediation` | Weak subtopics + re-quiz questions |

### Chat

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat/:courseId` | Send a message, receive AI reply |
| `DELETE` | `/api/chat/:courseId` | Clear conversation history |

### Curriculum (Python / Flask)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate` | Generate full curriculum with resources |
| `GET` | `/api/health` | Health check |

---

## Database Schema

### UserProgress
```
{
  userId:   ObjectId,
  courseId: String,           // subject string, e.g. "java-backend"
  weeks: [{
    weekNumber:   Number,
    resources:    [{ resourceId, url, completed, completedAt }],
    topicQuizzes: [{
      topic,
      bestScore,
      passed,
      attempts: [{
        score, total, attemptedAt,
        results: [{ questionIndex, topic, subtopic, correct, selected }]
      }]
    }],
    project:     { completed, githubLink, completedAt },
    isCompleted: Boolean,
    completedAt: Date
  }]
}
```

### WeekQuiz
```
{
  courseId:   String,
  weekNumber: Number,
  weekTitle:  String,
  subject:    String,
  topics:     [String],
  topicBanks: {
    "<topicName>": {
      questions: [{
        question, options, answer, explanation,
        topic, subtopic, difficulty, question_type
      }],
      generatedAt: Date
    }
  }
}
```

### ChatSession
```
{
  userId:   ObjectId,
  courseId: String,
  messages: [{ role: "user"|"assistant", content: String }]
  // max 10 messages kept (rolling window)
}
```

---

## Deployment

### Frontend — Vercel

```bash
# From the frontend directory
vercel deploy --prod

# Set environment variable in Vercel dashboard:
VITE_API_BASE_URL = https://your-backend.onrender.com
```

### Backend — Render

The `render.yaml` in the backend directory configures the Render service. Set the following environment variables in the Render dashboard:

```
MONGODB_URI
JWT_SECRET
GROQ_API_KEY
YOUTUBE_API_KEY
PORT = 5000
```

The Python Flask server (`app.py`) and Node.js Express server (`app.js`) are separate processes. Deploy `app.py` as a Python web service and `app.js` as a Node.js web service, or combine them behind a reverse proxy.

---
