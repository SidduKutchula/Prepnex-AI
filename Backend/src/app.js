const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const helmet = require("helmet")

const app = express()

app.use(helmet({
    crossOriginOpenerPolicy: false
}))

app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});

app.use(express.json())
app.use(cookieParser())

let allowedOrigins = [];
if (process.env.NODE_ENV === 'production') {
    const clientUrlString = process.env.CLIENT_URL || "http://localhost:5173";
    // Support multiple comma-separated URLs and remove trailing slashes
    allowedOrigins = clientUrlString.split(',').map(url => url.trim().replace(/\/$/, ''));
    // Always fallback to the known deployed frontend to guarantee access
    if (!allowedOrigins.includes("https://interview-aiml.onrender.com")) {
        allowedOrigins.push("https://interview-aiml.onrender.com");
    }
} else {
    allowedOrigins = [ "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176" ];
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