const OpenAI = require("openai");

let openRouterClientInstance = null;
let lastApiKey = null;

/**
 * Returns a singleton OpenAI client configured to route requests through OpenRouter.
 * Automatically recreates the client if the API key changes in runtime.
 */
function getOpenRouterClient() {
    const apiKey = process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : null;
    if (!apiKey) {
        return null;
    }

    if (!openRouterClientInstance || lastApiKey !== apiKey) {
        openRouterClientInstance = new OpenAI({
            baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
            apiKey: apiKey,
            defaultHeaders: {
                "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
                "X-Title": "PrepNex AI",
            },
        });
        lastApiKey = apiKey;
    }

    return openRouterClientInstance;
}

module.exports = { getOpenRouterClient };
