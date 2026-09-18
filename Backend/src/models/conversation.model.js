const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const conversationSchema = new mongoose.Schema({
    channel: {
        type: String,
        enum: ["web", "whatsapp", "slack"],
        required: true,
        index: true,
    },
    userId: {
        type: mongoose.Schema.Types.Mixed,
        ref: "users",
        required: true,
        index: true,
    },
    conversationId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    threadId: {
        type: String,
        default: null,
        index: true,
    },
    candidateId: {
        type: mongoose.Schema.Types.Mixed,
        ref: "users",
        default: null,
    },

    // ─── Cached context for AI calls ─────────────────────────────────
    currentResume: {
        type: String,
        default: "",
    },
    currentJD: {
        type: String,
        default: "",
    },
    currentReportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport",
        default: null,
    },

    state: {
        type: String,
        enum: ["idle", "awaiting_resume", "awaiting_jd", "quiz", "mock_interview", "resume_builder"],
        default: "idle",
    },
    resumeBuilderState: {
        active: { type: Boolean, default: false },
        currentSection: { type: String, default: null },
        stepIndex: { type: Number, default: 0 },
        tempItem: { type: mongoose.Schema.Types.Mixed, default: {} },
        data: {
            name: { type: String, default: "" },
            title: { type: String, default: "" },
            email: { type: String, default: "" },
            phone: { type: String, default: "" },
            linkedin: { type: String, default: "" },
            github: { type: String, default: "" },
            portfolio: { type: String, default: "" },
            summary: { type: String, default: "" },
            skills: { type: [String], default: [] },
            education: { type: [mongoose.Schema.Types.Mixed], default: [] },
            experience: { type: [mongoose.Schema.Types.Mixed], default: [] },
            projects: { type: [mongoose.Schema.Types.Mixed], default: [] },
            achievements: { type: [String], default: [] },
            certifications: { type: [String], default: [] },
        },
    },
    quizState: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    mockInterviewState: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },

    // ─── Message history (capped for context window) ─────────────────
    messages: {
        type: [messageSchema],
        default: [],
    },

    lastActiveAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
}, {
    timestamps: true,
});

// Keep only last 50 messages to prevent unbounded growth
conversationSchema.methods.addMessage = function (role, content) {
    this.messages.push({ role, content, timestamp: new Date() });
    if (this.messages.length > 50) {
        this.messages = this.messages.slice(-50);
    }
    this.lastActiveAt = new Date();
    return this;
};

// Get recent history formatted for AI context
conversationSchema.methods.getRecentHistory = function (count = 10) {
    const recent = this.messages.slice(-count);
    return recent.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
};

const ConversationModel = mongoose.model("Conversation", conversationSchema);

module.exports = ConversationModel;
