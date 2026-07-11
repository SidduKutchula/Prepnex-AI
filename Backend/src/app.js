const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const helmet = require("helmet")

const app = express()

// app.use(helmet({
//     crossOriginOpenerPolicy: false
// }))

app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});

app.use(express.json())
app.use(cookieParser())

let allowedOrigins = [
    "http://localhost:5173", 
    "http://localhost:5174", 
    "http://localhost:5175", 
    "http://localhost:5176",
    "https://interview-aiml.onrender.com" // Always allow the deployed frontend
];

if (process.env.CLIENT_URL) {
    const extraUrls = process.env.CLIENT_URL.split(',').map(url => url.trim().replace(/\/$/, ''));
    allowedOrigins = [...allowedOrigins, ...extraUrls];
}

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            console.error(`[CORS Error] Origin blocked: ${origin}. Allowed:`, allowedOrigins);
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")
const roadmapRouter = require("./routes/roadmap.routes")
const autosaveRouter = require("./routes/autosave.routes")
const activityRouter = require("./routes/activity.routes")
const historyRouter = require("./routes/history.routes")

/* Rate limiting */
const rateLimit = require("express-rate-limit")
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, error: "Too many auth requests, please try again later." } })

/* using all the routes here */
app.use("/api/auth", authLimiter, authRouter)
app.use("/api/interview", interviewRouter) // Removed global AI limiter, it blocked GET requests and streams!
app.use("/api/roadmap", roadmapRouter)
app.use("/api/autosave", autosaveRouter)
app.use("/api/activity", activityRouter)
app.use("/api/history", historyRouter)

// Global Error Handler (must be the last middleware)
const errorHandler = require("./middlewares/error.middleware")
app.use(errorHandler)

module.exports = app