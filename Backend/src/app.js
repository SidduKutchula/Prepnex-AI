const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const helmet = require("helmet")

const app = express()

// Security headers — crossOriginOpenerPolicy set to 'same-origin-allow-popups'
// so Google OAuth popup flow works correctly
app.use(helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: false // Disable CSP for now to avoid breaking inline styles in resume HTML
}))

// Request logger — only in development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`[REQ] ${req.method} ${req.url}`);
        next();
    });
}

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}))
app.use(express.urlencoded({
    extended: true,
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}))
app.use(cookieParser())

let allowedOrigins = [
    "http://localhost:5173", 
    "http://localhost:5174", 
    "http://localhost:5175", 
    "http://localhost:5176",
    "https://interview-aiml.onrender.com",
    "https://sidmonai.app",
    "https://www.sidmonai.app"
];

if (process.env.CLIENT_URL) {
    const extraUrls = process.env.CLIENT_URL.split(',').map(url => url.trim().replace(/\/$/, ''));
    allowedOrigins = [...allowedOrigins, ...extraUrls];
}

app.use(cors({
    origin: function (origin, callback) {
        // Allow server-to-server requests (no origin header)
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        const isAllowed = allowedOrigins.some(allowed => cleanOrigin === allowed.replace(/\/$/, '') || cleanOrigin.endsWith('.sidmonai.app') || cleanOrigin.endsWith('.onrender.com'));
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`[CORS BLOCKED] Origin ${origin} rejected.`);
            callback(new Error(`CORS policy: Origin ${origin} is not allowed.`));
        }
    },
    credentials: true
}));

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")
const roadmapRouter = require("./routes/roadmap.routes")
const autosaveRouter = require("./routes/autosave.routes")
const activityRouter = require("./routes/activity.routes")
const historyRouter = require("./routes/history.routes")
const chatRouter = require("./routes/chat.routes")
const whatsappRouter = require("./channels/whatsapp/whatsapp.routes")
const slackRouter = require("./channels/slack/slack.routes")

/* Rate limiting */
const rateLimit = require("express-rate-limit")
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, error: "Too many auth requests, please try again later." } })

/* Webhook routes (platform signature authenticated) */
app.use("/webhooks/whatsapp", whatsappRouter)
app.use("/webhooks/slack", slackRouter)

/* using all the routes here */
app.use("/api/auth", authLimiter, authRouter)
app.use("/api/interview", interviewRouter) // Removed global AI limiter, it blocked GET requests and streams!
app.use("/api/roadmap", roadmapRouter)
app.use("/api/autosave", autosaveRouter)
app.use("/api/activity", activityRouter)
app.use("/api/history", historyRouter)
app.use("/api/chat", chatRouter)

// Global Error Handler (must be the last middleware)
const errorHandler = require("./middlewares/error.middleware")
app.use(errorHandler)

module.exports = app