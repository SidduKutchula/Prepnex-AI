require("dotenv").config();
const validateEnv = require("./src/config/env");

// Validate critical configuration before importing the app
validateEnv();

const app = require("./src/app");
const connectToDB = require("./src/config/database");

// Global handlers to prevent silent crashes
process.on("uncaughtException", (err) => {
    console.error("[CRITICAL] Uncaught Exception:", err);
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    console.error("[FATAL] Unhandled Rejection:", reason);
});

// Boot Sequence: Connect to DB -> Start Server
async function startServer() {
    try {
        await connectToDB();
        
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server failed to start due to Database connection error.");
        process.exit(1);
    }
}

startServer();