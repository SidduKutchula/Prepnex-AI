<p align="center">
  <img src="public/favicon.png" alt="Prepnex AI" width="80" />
</p>

<h1 align="center">Prepnex AI — Frontend</h1>

<p align="center">
  <strong>AI-Powered Interview Preparation & Career Coaching Platform</strong><br/>
  Built with React 19 · Vite · SCSS · Framer Motion · Google OAuth
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Sass-1.97-CC6699?logo=sass&logoColor=white" alt="Sass" />
  <img src="https://img.shields.io/badge/Framer%20Motion-12.x-FF0050?logo=framer&logoColor=white" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/License-Proprietary-red" alt="License" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Architecture & Design Patterns](#architecture--design-patterns)
- [Routing](#routing)
- [Authentication Flow](#authentication-flow)
- [State Management](#state-management)
- [AI Generation Pipeline](#ai-generation-pipeline)
- [Deployment](#deployment)
- [Related — Backend](#related--backend)
- [License](#license)

---

## Overview

**Prepnex AI Frontend** is the client-side application for the Prepnex AI career preparation platform. It provides an immersive, workspace-style interface where users can:

1. Paste a **target job description** and upload their **resume (PDF)**
2. Receive a fully personalized **AI-generated interview strategy** including ATS analysis, tailored interview questions, a day-by-day preparation roadmap, and an optimized resume rewrite
3. Track preparation progress with **interactive checklists**, **analytics dashboards**, and **comparison tools**

The frontend communicates with a Node.js/Express backend via REST APIs and **Server-Sent Events (SSE)** for real-time streaming of AI-generated content.

---

## Key Features

### 🧠 AI-Powered Interview Reports
- **ATS Score & Skill Gap Analysis** — Instant compatibility scoring against the target job description
- **Technical & Behavioral Questions** — AI-generated mock questions with hidden interviewer intentions and structured answer guides
- **Day-by-Day Preparation Roadmap** — Personalized study plan with difficulty levels, time estimates, and curated learning resources
- **Resume Rewrite** — Fully ATS-optimized HTML resume generated from the candidate's profile

### 📡 Real-Time Streaming
- **Server-Sent Events (SSE)** — Live progress updates as each AI generation stage completes (ATS → Questions → Roadmap → Resume)
- **Cinematic Loading UX** — Glassmorphic overlay with animated progress checklists during generation

### 📊 Analytics & History
- **History Dashboard** — Browse, search, bookmark, rename, and delete past interview reports
- **Compare Analyses** — Side-by-side comparison of multiple interview reports
- **Progress Charts** — Visual tracking of preparation progress with Recharts
- **Timeline Tracker** — Chronological activity feed

### 💾 Smart Autosave
- **Dual-layer persistence** — Instant localStorage backup + debounced cloud sync
- **Draft restoration** — Automatically restores in-progress work on page reload or device switch
- **Clean logout** — All user data (localStorage, sessionStorage, cloud drafts) is wiped on sign-out, preserving only the theme preference

### 🔐 Secure Authentication
- **Google OAuth 2.0** — Passwordless one-tap sign-in via `@react-oauth/google`
- **Session-scoped tokens** — JWT stored in `sessionStorage` (cleared on tab close)
- **Route protection** — `<Protected>` wrapper redirects unauthenticated users
- **Automatic session cleanup** — Storage is wiped on 401 responses

### 🎨 Premium UI/UX
- **Dark/Light theme** — Persisted in `localStorage`, applied before first paint (no flash)
- **Framer Motion animations** — Spring-based micro-interactions, page transitions, and staggered reveals
- **Responsive design** — Mobile-first layouts with collapsible sidebar and adaptive navigation
- **Modern typography** — Inter, Sora, and JetBrains Mono via Google Fonts

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React 19.2 | Functional components, hooks, Context API |
| **Build Tool** | Vite 7.3 | Dev server, HMR, code-splitting, proxy |
| **Styling** | Sass (SCSS) 1.97 | Modular BEM-style stylesheets, CSS custom properties |
| **Animations** | Framer Motion 12.x | Spring animations, layout transitions, `AnimatePresence` |
| **Routing** | React Router 7.13 | File-based SPA routing with lazy-loaded pages |
| **HTTP Client** | Axios 1.13 | API calls with interceptors for auth headers and error handling |
| **Charts** | Recharts 3.9 | Analytics visualizations (bar, line, radar charts) |
| **PDF Export** | jsPDF + jspdf-autotable | Client-side PDF generation of preparation plans |
| **Icons** | Lucide React 1.23 | Consistent, tree-shakeable icon library |
| **Auth** | @react-oauth/google | Google Identity Services integration |
| **Utilities** | Lodash (debounce) | Efficient autosave throttling |

---

## Project Structure

```
Frontend/
├── public/                     # Static assets
│   ├── favicon.png             # App icon
│   ├── favicon.ico             # Browser tab icon
│   └── _redirects              # Netlify SPA routing fallback
│
├── src/
│   ├── main.jsx                # App entry point — providers, router
│   ├── App.jsx                 # Root component
│   ├── app.routes.jsx          # Route definitions with lazy-loading
│   ├── style.scss              # Global styles, CSS variables, design tokens
│   │
│   ├── components/             # Shared UI components
│   │   ├── navigation/         # Navbar, ProfileDropdown
│   │   ├── workspace/          # Workspace layout components
│   │   ├── Header.jsx          # Page header with user info
│   │   ├── Sidebar.jsx         # Dashboard sidebar navigation
│   │   ├── PageLoader.jsx      # Suspense fallback spinner
│   │   ├── PageWrapper.jsx     # Scroll-to-top wrapper
│   │   ├── ErrorBoundary.jsx   # React error boundary
│   │   ├── NotFound.jsx        # 404 page
│   │   ├── AutoSaveIndicator.jsx
│   │   └── AnimatedCounter.jsx
│   │
│   ├── hooks/                  # Global custom hooks
│   │   └── useTheme.js         # Dark/light theme toggle
│   │
│   ├── layouts/                # Page layout wrappers
│   │   └── DashboardLayout.jsx # Authenticated 3-column workspace layout
│   │
│   ├── style/                  # Global SCSS partials
│   │
│   └── features/               # Feature-based modules
│       │
│       ├── auth/               # Authentication feature
│       │   ├── auth.context.jsx      # AuthContext provider
│       │   ├── auth.form.scss        # Login page styles
│       │   ├── components/
│       │   │   └── Protected.jsx     # Route guard component
│       │   ├── hooks/
│       │   │   └── useAuth.js        # Login, logout, session management
│       │   ├── pages/
│       │   │   └── Login.jsx         # Google OAuth login page
│       │   └── services/
│       │       └── auth.api.js       # Auth API calls + axios interceptors
│       │
│       ├── interview/          # Core interview preparation feature
│       │   ├── interview.context.jsx # Interview state provider
│       │   ├── hooks/
│       │   │   ├── useInterview.js       # Report CRUD + SSE streaming
│       │   │   ├── useAutoSave.js        # Dual-layer draft persistence
│       │   │   ├── useProgressSync.js    # Offline-first progress queue
│       │   │   └── useRoadmapProgress.js # Roadmap completion tracking
│       │   ├── pages/
│       │   │   ├── Intro.jsx             # Public landing page
│       │   │   ├── InterviewLanding.jsx  # Job description + resume input form
│       │   │   ├── Interview.jsx         # Full interview report viewer
│       │   │   └── Resume.jsx            # Resume intelligence dashboard
│       │   ├── services/
│       │   │   └── interview.api.js      # Interview API calls
│       │   └── style/                    # Feature-scoped SCSS
│       │
│       └── history/            # Report history & analytics feature
│           ├── components/
│           │   ├── HistoryCard.jsx       # Report card with actions
│           │   ├── ProgressCharts.jsx    # Recharts visualizations
│           │   └── TimelineTracker.jsx   # Activity timeline
│           ├── hooks/
│           ├── pages/
│           │   ├── History.jsx           # Report list with search/filter
│           │   ├── HistoryDashboard.jsx  # Analytics overview
│           │   └── CompareAnalyses.jsx   # Side-by-side report comparison
│           ├── services/
│           ├── style/
│           └── utils/
│
├── index.html                  # HTML entry with theme pre-load script
├── vite.config.js              # Vite configuration with API proxy
├── vercel.json                 # Vercel SPA routing config
├── eslint.config.js            # ESLint configuration
├── package.json                # Dependencies and scripts
├── .env.example                # Environment variable template
└── .gitignore
```

---

## Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org/))
- **npm** v9+ (bundled with Node.js)
- A **Google OAuth Client ID** from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- The [Prepnex AI Backend](../Backend/) running locally or deployed

---

## Getting Started

### 1. Install Dependencies

```bash
cd Frontend
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required — your Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Optional — Backend API URL (defaults to Vite proxy at localhost:5000)
VITE_API_URL=http://localhost:5000
```

> **Note:** In local development, the Vite dev server proxies `/api/*` requests to `http://127.0.0.1:5000` automatically (configured in `vite.config.js`), so `VITE_API_URL` can be omitted.

### 3. Start the Dev Server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**.

> Make sure the [Backend](../Backend/) is running on port 5000 before logging in.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | ✅ | — | Google OAuth 2.0 Client ID |
| `VITE_API_URL` | ❌ | `http://localhost:5000` | Backend API base URL |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR at `localhost:5173` |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint on all source files |

---

## Architecture & Design Patterns

### Feature-Based Module Organization
The codebase follows a **feature-first** architecture where each domain (`auth`, `interview`, `history`) encapsulates its own pages, hooks, services, components, and styles. Shared components live in `src/components/`.

### Context + Hooks Pattern
State management uses React's built-in **Context API** with custom hooks:
- `AuthContext` / `useAuth()` — User session, login, logout
- `InterviewContext` / `useInterview()` — Reports, loading states, CRUD operations

### API Layer with Interceptors
A shared Axios instance (`auth.api.js`) handles:
- **Request interceptor** — Injects JWT `Authorization` header from `sessionStorage`
- **Response interceptor** — Normalizes errors, dispatches `auth:unauthorized` events on 401s
- **Automatic session cleanup** — Clears all storage and resets user state when unauthorized

### Offline-First Sync Queue
`useProgressSync` maintains a localStorage-backed queue of task completion updates, flushing them to the backend in batches. Failed syncs are retried automatically.

---

## Routing

| Path | Page | Auth | Description |
|------|------|------|-------------|
| `/` | `Intro` | Public | Landing page with feature showcase |
| `/login` | `Login` | Public | Google OAuth sign-in |
| `/interview` | `InterviewLanding` | 🔒 | Job description & resume input form |
| `/interview/:interviewId` | `Interview` | 🔒 | Full AI-generated report viewer |
| `/preparation` | `InterviewLanding` | 🔒 | Alias for `/interview` |
| `/resume` | `Resume` | 🔒 | Resume intelligence dashboard |
| `/history` | `History` | 🔒 | Past reports list with search/filter |
| `/history/compare` | `CompareAnalyses` | 🔒 | Side-by-side report comparison |
| `*` | `NotFound` | Public | 404 page |

All authenticated routes (🔒) are wrapped in `<Protected>` → `<DashboardLayout>` which provides the sidebar + navbar chrome.

---

## Authentication Flow

```
┌─────────────┐     Google ID Token      ┌─────────────────┐
│  Google      │ ──────────────────────→  │  POST /api/auth │
│  One-Tap     │                          │  /google        │
└─────────────┘                          └────────┬────────┘
                                                  │
                                         JWT + httpOnly cookie
                                                  │
                                         ┌────────▼────────┐
                                         │  sessionStorage  │
                                         │  (token backup)  │
                                         └────────┬────────┘
                                                  │
                                         Axios interceptor
                                         attaches Bearer token
                                                  │
                                         ┌────────▼────────┐
                                         │  All API calls   │
                                         │  authenticated   │
                                         └─────────────────┘
```

**On logout:**
1. Cloud autosave draft is deleted via `DELETE /api/autosave`
2. Backend token is blacklisted via `GET /api/auth/logout`
3. `localStorage` is fully cleared (theme preference preserved)
4. `sessionStorage` is fully cleared
5. Auth context resets (`user = null`)

---

## State Management

```
AuthProvider                          InterviewProvider
    │                                       │
    ├── user (object | null)                ├── report (single report)
    ├── loading (boolean)                   ├── reports (list)
    ├── setUser                             ├── loading (boolean)
    └── setLoading                          └── setReport / setReports
         │                                       │
    useAuth()                              useInterview()
    ├── loginWithGoogle()                  ├── startGeneration()
    ├── handleLogout()                     ├── getReportById()
    └── user, loading                      ├── getReports()
                                           ├── toggleBookmark()
                                           ├── deleteReport()
                                           ├── renameReport()
                                           └── toggleTaskCompletion()
```

---

## AI Generation Pipeline

When the user clicks **"Generate Interview Strategy"**, the following pipeline executes:

```
1. User submits JD + Resume
         │
2. POST /api/interview/start
         │
3. Backend queues AI worker → returns reportId
         │
4. Frontend navigates to /interview/:reportId
         │
5. SSE connection opens: GET /api/interview/stream/:reportId
         │
6. AI stages stream in real-time:
   ├── Stage 1: ATS Score & Skill Gaps
   ├── Stage 2: Technical & Behavioral Questions
   ├── Stage 3: Day-by-Day Roadmap
   └── Stage 4: Resume Rewrite
         │
7. "complete" event → Full report refetch
```

The frontend's `useInterviewStream` hook listens for SSE events and progressively updates the UI via `setReport()`.

---

## Deployment

### Vercel (Recommended)

The project includes a [`vercel.json`](vercel.json) that handles SPA routing:

1. Connect your GitHub repo to Vercel
2. Set the root directory to `Frontend`
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variables (`VITE_GOOGLE_CLIENT_ID`, `VITE_API_URL`)

### Netlify

A [`public/_redirects`](public/_redirects) file is included for Netlify SPA routing:

```
/*    /index.html   200
```

### Render / Cloudflare Pages

Add a rewrite rule in the platform dashboard:
- **Source:** `/*`
- **Destination:** `/index.html`
- **Action:** Rewrite

> ⚠️ **Important:** Set `VITE_API_URL` to your deployed backend URL (e.g., `https://your-backend.onrender.com`) in the hosting platform's environment variables.

---

## Related — Backend

The backend lives in [`../Backend/`](../Backend/) and provides:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/google` | POST | Google OAuth login, returns JWT |
| `/api/auth/logout` | GET | Blacklist token, clear cookie |
| `/api/auth/get-me` | GET | Get authenticated user |
| `/api/interview/start` | POST | Start AI report generation |
| `/api/interview/stream/:id` | GET (SSE) | Stream generation progress |
| `/api/interview/report/:id` | GET | Fetch complete report |
| `/api/interview/` | GET | List all user reports |
| `/api/interview/:id/bookmark` | PUT | Toggle bookmark |
| `/api/interview/:id` | DELETE | Delete report |
| `/api/interview/:id/rename` | PUT | Rename report |
| `/api/interview/:id/task/:taskId/toggle` | PUT | Toggle task completion |
| `/api/interview/sync-progress` | POST | Batch sync task progress |
| `/api/interview/analytics/dashboard` | GET | Dashboard analytics |
| `/api/autosave` | GET/POST/DELETE | Autosave draft CRUD |
| `/api/roadmap/progress` | GET/POST | Roadmap progress tracking |
| `/api/history/` | GET | History with analytics |
| `/api/activity/recent` | GET | Recent activity feed |

Backend tech stack: **Node.js · Express 5 · MongoDB · Google Gemini 3.5 Flash · JWT · pdf-parse**

See the [Backend README](../Backend/README.md) or the [root project README](../README.md) for full backend setup instructions.

---

## License

This project is **proprietary and confidential**. All rights reserved.

---

<p align="center">
  <sub>Built with ❤️ by the Prepnex AI team</sub>
</p>
