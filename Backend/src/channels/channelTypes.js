const { z } = require("zod");

// ─── Channel-Independent Request Shape ───────────────────────────────────────
// This is the ONLY shape the AI engine ever sees, regardless of channel.

const ChannelRequestSchema = z.preprocess((val) => {
    if (val && typeof val === "object") {
        const obj = { ...val };
        if (!obj.userId && obj.user_id) obj.userId = obj.user_id;
        if (!obj.user_id && obj.userId) obj.user_id = obj.userId;
        if (!obj.conversationId && obj.conversation_id) obj.conversationId = obj.conversation_id;
        if (!obj.conversation_id && obj.conversationId) obj.conversation_id = obj.conversationId;
        return obj;
    }
    return val;
}, z.object({
    channel: z.enum(["web", "whatsapp", "slack"]).describe("Source channel"),
    userId: z.string().describe("Internal user ID or external channel ID"),
    user_id: z.string().optional().describe("Alias for userId"),
    conversationId: z.string().optional().describe("Existing conversation ID to continue"),
    conversation_id: z.string().optional().describe("Alias for conversationId"),
    threadId: z.string().optional().describe("Platform thread ID (Slack thread_ts, WhatsApp context)"),
    message: z.string().min(1).describe("The user's message text"),
    attachments: z.array(z.object({
        type: z.enum(["document", "image", "audio", "video"]),
        mimeType: z.string().optional(),
        url: z.string().optional().describe("URL to download the attachment"),
        buffer: z.any().optional().describe("Raw file buffer (if already downloaded)"),
        fileName: z.string().optional(),
    })).optional().default([]),
}));

// ─── Channel-Independent Response Shape ──────────────────────────────────────

const ChannelResponseSchema = z.preprocess((val) => {
    if (val && typeof val === "object") {
        const obj = { ...val };
        if (!obj.conversationId && obj.conversation_id) obj.conversationId = obj.conversation_id;
        if (!obj.conversation_id && obj.conversationId) obj.conversation_id = obj.conversationId;
        return obj;
    }
    return val;
}, z.object({
    answer: z.string().describe("The AI response text (markdown-formatted)"),
    conversationId: z.string().describe("Conversation ID for continuity"),
    conversation_id: z.string().optional().describe("Alias for conversationId"),
    actions: z.array(z.object({
        type: z.enum(["button", "link", "suggestion"]),
        label: z.string(),
        value: z.string().describe("Command string, URL, or suggestion text"),
    })).optional().default([]),
}));

// ─── Supported Commands ──────────────────────────────────────────────────────

const COMMANDS = {
    HELP: "/help",
    ANALYZE: "/analyze",
    GAPS: "/gaps",
    PLAN: "/plan",
    QUIZ: "/quiz",
    MOCK: "/mock",
    READY: "/ready",
    BUILD: "/build",
    BUILDER: "/builder",
    COURSES: "/courses",
};

const COMMAND_DESCRIPTIONS = {
    [COMMANDS.HELP]: "Show available commands and how to use PrepNex AI",
    [COMMANDS.ANALYZE]: "Analyze your resume against a job description (ATS score, keywords, feedback)",
    [COMMANDS.GAPS]: "Identify skill gaps between your resume and the target role",
    [COMMANDS.PLAN]: "Generate a personalized interview preparation roadmap",
    [COMMANDS.QUIZ]: "Start a technical/behavioral quiz based on your profile",
    [COMMANDS.MOCK]: "Begin a mock interview simulation",
    [COMMANDS.READY]: "Get a readiness assessment for your upcoming interview",
    [COMMANDS.BUILD]: "Start interactive AI Resume Builder to create your resume step-by-step",
    [COMMANDS.BUILDER]: "Start interactive AI Resume Builder",
    [COMMANDS.COURSES]: "Explore curated interview prep courses and live learning links",
};

/**
 * Validates and normalizes a raw incoming message into the ChannelRequest shape.
 * Throws ZodError if validation fails.
 */
function parseChannelRequest(raw) {
    return ChannelRequestSchema.parse(raw);
}

/**
 * Validates a response before sending it back through channel adapters.
 */
function parseChannelResponse(raw) {
    return ChannelResponseSchema.parse(raw);
}

module.exports = {
    ChannelRequestSchema,
    ChannelResponseSchema,
    COMMANDS,
    COMMAND_DESCRIPTIONS,
    parseChannelRequest,
    parseChannelResponse,
};
