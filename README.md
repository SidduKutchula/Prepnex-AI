# Interview AI - Advanced Career & Interview Preparation Workspace

Interview AI is a modern, full-stack web application designed to act as a comprehensive career preparation workspace. By deeply analyzing a target **Job Description** and the candidate's **Profile** (via PDF resume upload or text), the platform uses the **Google Gemini AI API** to generate a highly personalized, interactive preparation experience.

The application has been completely redesigned to provide a professional workspace experience akin to top-tier productivity tools (Notion, Linear, Cursor), featuring ultra-fast concurrent AI generation, a cinematic loading experience, and Google OAuth integration.

---

## 🚀 Key Features

### 1. Ultra-Fast Concurrent AI Generation
- **Parallel Processing**: Uses advanced Node.js orchestration (`Promise.allSettled`) to generate ATS analysis, Interview Questions, Roadmaps, and Resume Rewrites simultaneously.
- **Cinematic Loading Screen**: A full-page, premium glassmorphic overlay with dynamic staggered checklists, glowing gradients, and animated AI visual cores to keep users engaged during generation.

### 2. Workspace Layout & Analytics Dashboard
- **3-Column Architecture**: A sophisticated layout featuring a navigation/progress left sidebar, a rich interactive main content area, and a deep analytics right sidebar.
- **Stacked Analytics Widgets**: Real-time insights including Match Score, ATS Compatibility, Interview Readiness, Skill Gaps, Recommended Skills, and Preparation Progress.
- **Goal Tracking & Streaks**: Gamified preparation with daily/weekly goals, streak tracking, and estimated time to completion.

### 3. Interactive Interview Report
- **Day-by-Day Roadmap**: A visually structured roadmap breaking down preparation tasks day-by-day, complete with difficulty badges and interactive checkboxes.
- **Personalized Questions**: Custom technical, behavioral, HR, and system design questions tailored to bridge the gap between your resume and the job description.
- **Workspace Actions**: Users can bookmark questions, mark them as complete, practice again, and securely save inline personal notes synchronized directly with the question.

### 4. Resume Generation & Job Tracking
- **Tailored Resume Generator**: Dynamically generates an ATS-friendly HTML resume optimized for specific job requirements.
- **Version Control**: Stores multiple tailored resume versions allowing users to compare, restore, or download them as PDFs (rendered server-side via Puppeteer).
- **JD History**: Keeps a historical record of all analyzed job descriptions and keyword match scores.

### 5. Secure Infrastructure
- **Google OAuth Integration**: Seamless and secure one-tap login using `@react-oauth/google` and Google Identity Services.
- **JWT Authentication**: Secure user session persistence utilizing JSON Web Tokens and HTTP-only cookies.
- **State Management**: Robust frontend context structures for auth and interview data handling.

---

## 🛠️ Technology Stack

### Frontend Architecture
- **React.js 19**: Modern functional components, hooks, and Context API.
- **Vite**: Next-generation, lightning-fast frontend build tool (strictly mapped to port 5173).
- **Sass (SCSS)**: Scalable, modular styling system utilizing CSS variables, theming tokens, and modern layout techniques (Grid/Flexbox).
- **Lucide React**: Clean, consistent, and beautiful iconography.
- **React Router Dom**: Client-side routing for seamless workspace navigation.
- **Google Identity Services**: OAuth 2.0 integration for seamless login.

### Backend Infrastructure
- **Node.js & Express.js**: Robust server-side framework.
- **MongoDB & Mongoose**: Flexible, schema-based NoSQL database for structured data storage (Users, Interviews, Resumes, Notes).
- **Google GenAI SDK (`@google/genai`)**: Integration with Gemini's advanced LLMs (`gemini-1.5-flash`) for deep semantic analysis and content generation.
- **Puppeteer**: Headless browser automation for perfect server-side HTML-to-PDF rendering.
- **pdf-parse**: Reliable server-side extraction of text from uploaded candidate resumes.
- **JWT & BcryptJS**: Industry-standard token signing and secure password hashing.

---

## 📂 Project Structure

```text
Interview AI/
├── Backend/
│   ├── src/
│   │   ├── config/          # Database configuration and environment setups
│   │   ├── controllers/     # Core business logic (Auth, Interview API, Reports)
│   │   ├── middlewares/     # Multer file handler, JWT authentication guards
│   │   ├── models/          # Mongoose schemas (User, Report, Notes, Resumes)
│   │   ├── routes/          # Express API route definitions
│   │   └── services/        # AI Service (Gemini prompting, Concurrency Workers, Puppeteer)
│   ├── .env                 # Environment variables (API Keys, DB URI)
│   ├── server.js            # Express server entry point
│   └── package.json
│
└── Frontend/
    ├── src/
    │   ├── components/      # Reusable UI components (WorkspaceLayout, Sidebars)
    │   ├── features/        # Feature-based module organization
    │   │   ├── auth/        # Context, hooks, Google login pages
    │   │   └── interview/   # Dashboard, timeline, question cards, analytics, loading UI
    │   ├── hooks/           # Custom React hooks (e.g., useTheme)
    │   ├── style/           # Global design system (tokens, resets, layout)
    │   ├── App.jsx          # Application root and router provider
    │   └── main.jsx         # ReactDOM render entry point
    ├── index.html
    ├── vite.config.js       # Vite configuration (port enforcement, proxy)
    └── package.json
```

---

## ⚙️ Prerequisites & Installation

Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended) and a running instance of [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or MongoDB Local.

### 1. Clone & Install Dependencies

Open your terminal in the project directory:

```bash
# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

### 2. Configure Environment Variables

#### Backend (`Backend/.env`)
Create a file named `.env` in the `Backend/` directory and populate it with the following:

```env
# Google Gemini API Key (Obtain from Google AI Studio)
GOOGLE_GENAI_API_KEY=your_gemini_api_key_here

# MongoDB Atlas or Local Connection String
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Secret key for signing JSON Web Tokens
JWT_SECRET=your_super_secret_key_string

# Google OAuth Client ID
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Server Config
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
```

#### Frontend (`Frontend/.env`)
Create a file named `.env` in the `Frontend/` directory:

```env
# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

## 🏃 Running the Application

To run the application locally, you will need to start both the backend and frontend development servers concurrently.

### Start the Backend Server

```bash
cd Backend
npm run dev
```
*The Express server will start on `http://localhost:5000` (nodemon will watch for changes).*

### Start the Frontend Dev Server

```bash
cd Frontend
npm run dev
```
*The Vite dev server will launch the React app at `http://localhost:5173`. Port 5173 is strictly enforced to match CORS requirements.*

---

## 🎨 Design System & UX Principles
The recent workspace overhaul strictly adheres to modern UX principles:
- **Cinematic Transitions**: Immersive full-page loading screens with dynamic micro-animations keep users engaged during heavy AI processing.
- **Compact & Balanced**: Information density is high but remains highly readable through excellent spacing and typography.
- **Accessibility (A11y)**: Text contrast tokens dynamically adjust across both light and dark modes to ensure optimal readability.
- **No Wasted Space**: The 3-column layout ensures all available viewport space provides meaningful insights or actionable tools, minimizing scrolling and contextual switching.
