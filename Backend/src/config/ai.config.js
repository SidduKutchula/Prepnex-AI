const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || process.env.GEMINI_MODEL || 'google/gemini-2.5-flash';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

module.exports = {
    OPENROUTER_MODEL,
    OPENROUTER_BASE_URL,
    // Backwards compatibility alias
    GEMINI_MODEL: OPENROUTER_MODEL,
};
