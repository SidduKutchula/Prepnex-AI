# Prepnex AI

<div align="center">
  <img src="Frontend/public/favicon.ico" alt="Prepnex AI Logo" width="100"/>
  <h3>AI-Powered Interview & Career Preparation Workspace</h3>
  <p>Crack your next tech interview with a deeply personalized roadmap, ATS analysis, and AI mock questions.</p>
</div>

---

## âœ¨ Overview

Prepnex AI is a sophisticated, full-stack career preparation workspace. By deeply analyzing a target **Job Description** and the candidate's **Resume** (via PDF parsing), the platform leverages the **Google Gemini AI** engine to generate a highly personalized, interactive preparation experience. 

Designed with modern workspace tools in mind (like Notion, Linear, or Cursor), Prepnex AI features a cinematic loading experience, an intuitive 3-column layout, and secure Google OAuth integration.

## ðŸš€ Key Features

### 1. Ultra-Fast AI Generation & Streaming
- **Server-Sent Events (SSE)**: Streams AI-generated reports (ATS Analysis, Interview Questions, Day-by-day Roadmaps, Resume Rewrites) in real-time.
- **Cinematic Loading Experience**: A beautiful glassmorphic overlay with dynamic staggered checklists and glowing gradients keeps users engaged during generation.

### 2. Workspace Layout & Analytics Dashboard
- **3-Column Architecture**: Features a navigation left sidebar, a rich interactive main content area, and a deep analytics right sidebar.
- **Real-Time Insights**: View your ATS Match Score, Interview Readiness, Skill Gaps, and Preparation Progress at a glance.
- **Gamified Tracking**: Daily goals, streak tracking, and estimated time-to-completion metrics.

### 3. Interactive Interview Report
- **Day-by-Day Roadmap**: A structured timeline breaking down preparation tasks day-by-day, complete with difficulty badges and interactive checklists.
- **Targeted Mock Questions**: Custom technical, behavioral, and system design questions tailored to bridge the exact gap between your resume and the job description.
- **AI Coach Feedback**: Reveal the "hidden intentions" behind questions and structure your answers using the STAR method.

### 4. Resume Generation & PDF Export
- **PDF Resume Parsing**: Upload your current PDF resume; the backend uses `pdf-parse` to extract and structure the content.
- **Server-Side PDF Export**: Uses headless **Puppeteer** to generate perfectly formatted, ATS-friendly PDF versions of your customized preparation plan.

### 5. Secure & Modern Infrastructure
- **Google OAuth**: One-tap, passwordless login using `@react-oauth/google` and Google Identity Services.
- **Strict Session Management**: JWT tokens, secure frontend context, and strict tab-level isolation ensure privacy.
- **Production SPA Routing**: Built-in rules for Vercel, Netlify, and Cloudflare to handle client-side React routing smoothly.

---

## ðŸ› ï¸  Technology Stack

### Frontend Architecture
- **React 19**: Modern functional components, hooks, and Context API.
- **Vite**: Lightning-fast build tool and development server.
- **Sass (SCSS)**: Scalable, modular styling system utilizing CSS variables and modern layout techniques (Grid/Flexbox).
- **Framer Motion**: Smooth, high-performance UI animations and page transitions.
- **React Router Dom**: Client-side routing.
- **Lucide React**: Clean, consistent typography and iconography.

### Backend Infrastructure
- **Node.js & Express.js**: Robust, scalable server-side framework.
- **MongoDB & Mongoose**: Flexible NoSQL database for storing Users, Interviews, and Notes.
- **Google GenAI SDK**: Deep semantic analysis powered by Gemini 1.5 Flash.
- **Puppeteer**: Headless browser automation for HTML-to-PDF rendering.
- **pdf-parse**: Reliable server-side text extraction.

---

## âš™ï¸  Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A running instance of [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or MongoDB Local.
- A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/).

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/SidduKutchula/Prepnex-AI.git
cd Prepnex-AI

# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

### 2. Configure Environment Variables

**Backend (`Backend/.env`)**:
```env
GOOGLE_GENAI_API_KEY=your_gemini_api_key_here
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_super_secret_key_string
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Frontend (`Frontend/.env`)**:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000
```

### 3. Run the Servers

Start the backend (Terminal 1):
```bash
cd Backend
npm run dev
```

Start the frontend (Terminal 2):
```bash
cd Frontend
npm run dev
```
Open your browser to `http://localhost:5173` to view the application.

---

## ðŸŒ  Production Deployment

### Frontend (Vercel / Netlify / Cloudflare / Render)
The frontend is built as a Single Page Application (SPA).
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Routing**: The repository includes a `vercel.json` and a `public/_redirects` file to automatically fix "404 Not Found" refresh errors on Vercel, Netlify, and Cloudflare by rewriting all requests to `index.html`.
  > **Note for Render Users**: Add a Rewrite rule in your dashboard: Source: `/*`, Destination: `/index.html`, Action: `Rewrite`.

### Backend (Render / Heroku)
Ensure your production environment variables include the correct `CLIENT_URL` (e.g., `https://sidmonai.app`) to prevent CORS issues. Set `NODE_ENV=production`.

---

## ðŸ“„ License
This project is proprietary and confidential. All rights reserved.
