/**
 * Validates the presence of required environment variables before server startup.
 * Exits the process immediately if any critical variables are missing.
 */
function validateEnv() {
    const requiredEnvVars = [
        "MONGO_URI",
        "JWT_SECRET",
        "GOOGLE_CLIENT_ID"
    ];

    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (!process.env.OPENROUTER_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
        missingVars.push("OPENROUTER_API_KEY");
    }

    if (missingVars.length > 0) {
        console.error(`\n[CRITICAL ERROR] Missing required environment variables:`);
        missingVars.forEach(envVar => {
            console.error(`- ${envVar}`);
        });
        console.error(`\nPlease define them in the .env file before starting the server.\n`);
        process.exit(1);
    }

    if (process.env.OPENROUTER_API_KEY) {
        console.log(`[INFO] OpenRouter API configured. Model: ${process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash'}`);
    }

    // Check optional WhatsApp configuration
    const whatsappVars = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN"];
    const missingWhatsApp = whatsappVars.filter(v => !process.env[v]);
    if (missingWhatsApp.length > 0) {
        console.warn(`[NOTICE] WhatsApp channel not fully configured (missing: ${missingWhatsApp.join(", ")}). Webhook will return 503.`);
    } else {
        console.log("[INFO] WhatsApp integration configured.");
    }

    // Check optional Slack configuration
    const slackVars = ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET"];
    const missingSlack = slackVars.filter(v => !process.env[v]);
    if (missingSlack.length > 0) {
        console.warn(`[NOTICE] Slack channel not fully configured (missing: ${missingSlack.join(", ")}). Webhook will return 503.`);
    } else {
        console.log("[INFO] Slack integration configured.");
    }
}

module.exports = validateEnv;
