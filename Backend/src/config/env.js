/**
 * Validates the presence of required environment variables before server startup.
 * Exits the process immediately if any critical variables are missing.
 */
function validateEnv() {
    const requiredEnvVars = [
        "MONGO_URI",
        "JWT_SECRET",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_GENAI_API_KEY"
    ];

    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingVars.length > 0) {
        console.error(`\n[CRITICAL ERROR] Missing required environment variables:`);
        missingVars.forEach(envVar => {
            console.error(`- ${envVar}`);
        });
        console.error(`\nPlease define them in the .env file before starting the server.\n`);
        process.exit(1);
    }
}

module.exports = validateEnv;
