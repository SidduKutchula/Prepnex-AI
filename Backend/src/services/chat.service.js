const crypto = require("crypto");
const mongoose = require("mongoose");
const { getOpenRouterClient } = require("../config/openrouter.client");
const { OPENROUTER_MODEL } = require("../config/ai.config");
const { COMMANDS, COMMAND_DESCRIPTIONS } = require("../channels/channelTypes");
const ConversationModel = require("../models/conversation.model");
const ChannelUserModel = require("../models/channelUser.model");
const InterviewReport = require("../models/interviewReport.model");
const aiService = require("./ai.service");
const { PDFParse } = require("pdf-parse");
const resumeBuilderService = require("./resumeBuilder.service");

// ─── OpenRouter client helper ────────────────────────────────────────────────

function getAI() {
    return getOpenRouterClient();
}

// ─── Intent Detection ────────────────────────────────────────────────────────

const INTENTS = {
    HELP: "help",
    ANALYZE: "analyze",
    GAPS: "gaps",
    PLAN: "plan",
    QUIZ: "quiz",
    MOCK: "mock",
    READY: "ready",
    BUILD: "build",
    COURSES: "courses",
    GENERAL: "general",
    SET_RESUME: "set_resume",
    SET_JD: "set_jd",
};

const COMMAND_TO_INTENT = {
    [COMMANDS.HELP]: INTENTS.HELP,
    [COMMANDS.ANALYZE]: INTENTS.ANALYZE,
    [COMMANDS.GAPS]: INTENTS.GAPS,
    [COMMANDS.PLAN]: INTENTS.PLAN,
    [COMMANDS.QUIZ]: INTENTS.QUIZ,
    [COMMANDS.MOCK]: INTENTS.MOCK,
    [COMMANDS.READY]: INTENTS.READY,
    [COMMANDS.BUILD]: INTENTS.BUILD,
    [COMMANDS.BUILDER]: INTENTS.BUILD,
    [COMMANDS.COURSES]: INTENTS.COURSES,
};

/**
 * Detect the user's intent from their message.
 * Explicit /commands are recognized first; otherwise Gemini classifies.
 */
async function detectIntent(message, conversationState) {
    const trimmed = message.trim().toLowerCase();

    // Check explicit commands first
    for (const [cmd, intent] of Object.entries(COMMAND_TO_INTENT)) {
        if (trimmed === cmd || trimmed.startsWith(cmd + " ")) {
            return { intent, params: trimmed.replace(cmd, "").trim() };
        }
    }

    // Common greetings immediately map to HELP without burning Gemini API quota
    const GREETINGS = ["hi", "hello", "hey", "hola", "start", "help", "menu", "info"];
    if (GREETINGS.includes(trimmed)) {
        return { intent: INTENTS.HELP, params: "" };
    }

    // Course and tutorial requests immediately map to COURSES
    if (trimmed.includes("course") || trimmed.includes("tutorial") || trimmed.includes("learn link") || trimmed.includes("study link") || trimmed.includes("study material")) {
        return { intent: INTENTS.COURSES, params: trimmed };
    }

    // Use OpenRouter to classify natural language intent
    const client = getOpenRouterClient();
    if (!client) {
        return { intent: INTENTS.GENERAL, params: "" };
    }

    try {
        const response = await client.chat.completions.create({
            model: OPENROUTER_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an intent classifier for an interview preparation AI assistant. Respond with ONLY the single intent keyword in lowercase."
                },
                {
                    role: "user",
                    content: `Given the user's message, classify it into EXACTLY ONE of these intents:
- "analyze" — user wants to analyze their resume, get ATS score, or check resume quality
- "gaps" — user wants to identify skill gaps for a specific role
- "plan" — user wants an interview preparation plan or roadmap
- "quiz" — user wants to practice with quiz questions
- "mock" — user wants a mock interview
- "ready" — user wants a readiness assessment
- "build" — user wants to build, create, or write a resume from scratch with the bot
- "set_resume" — user is providing their resume text or describing themselves
- "set_jd" — user is providing a job description
- "help" — user wants help or doesn't know what to do
- "general" — general conversation, follow-up question, or anything else

Current conversation state: ${conversationState || "idle"}

User's message: "${message}"

Respond with ONLY the intent string, nothing else.`
                }
            ],
            temperature: 0.1,
            max_tokens: 30
        });

        const detected = (response.choices[0]?.message?.content || "").trim().toLowerCase().replace(/[^a-z_]/g, "");
        if (Object.values(INTENTS).includes(detected)) {
            return { intent: detected, params: "" };
        }
    } catch (err) {
        console.error("[ChatService] Intent detection failed, defaulting to general:", err.message);
    }

    return { intent: INTENTS.GENERAL, params: "" };
}

// ─── Resume Extraction (reuses existing parser) ──────────────────────────────

async function extractResumeFromAttachment(attachment) {
    try {
        let buffer = attachment.buffer;

        // If we have a URL but no buffer, download it
        if (!buffer && attachment.url) {
            const response = await fetch(attachment.url);
            if (!response.ok) {
                throw new Error(`Failed to download attachment: HTTP ${response.status}`);
            }
            buffer = Buffer.from(await response.arrayBuffer());
        }

        if (!buffer) {
            return null;
        }

        // Reuse the EXACT same PDFParse logic from interview.controller.js
        const parser = new PDFParse({ data: buffer });
        const parsed = await parser.getText();
        const text = (parsed.text && parsed.text.trim()) ? parsed.text : null;

        if (text) {
            console.log("[ChatService] Resume PDF parsed successfully. Text length:", text.length);
            return text;
        }

        return null;
    } catch (err) {
        console.error("[ChatService] Resume extraction failed:", err.message);
        return null;
    }
}

// ─── Help Text Generator ─────────────────────────────────────────────────────

function generateHelpText() {
    const lines = [
        "👋 *Welcome to PrepNex AI!*",
        "",
        "I'm your AI-powered interview preparation assistant. Here's what I can do:",
        "",
    ];

    for (const [cmd, desc] of Object.entries(COMMAND_DESCRIPTIONS)) {
        lines.push(`• *${cmd}* — ${desc}`);
    }

    lines.push(
        "",
        "📎 *Resume Upload*: Send me a PDF of your resume and I'll parse it automatically.",
        "📝 *Job Description*: Just paste a job description and tell me it's a JD.",
        "",
        "💡 *Tip*: You don't need to use commands — just type naturally! For example:",
        '  _"Can you analyze my resume for a React developer role?"_',
        '  _"What are my skill gaps?"_',
        '  _"Give me a 5-day prep plan"_',
        "",
        "🌐 For the full experience (resume upload, visual roadmaps, PDF export), visit the web app."
    );

    return lines.join("\n");
}

// ─── Main Chat Processing ────────────────────────────────────────────────────

/**
 * Process an incoming channel message.
 * This is the central orchestrator — the "chat engine" all channels call.
 *
 * @param {Object} channelRequest - Validated ChannelRequest shape
 * @returns {Object} ChannelResponse shape
 */
async function processMessage(channelRequest) {
    const { channel, userId, conversationId, threadId, message, attachments } = channelRequest;

    // 1. Resolve or create conversation
    const conversation = await resolveConversation(channel, userId, conversationId, threadId);

    // 2. Add user message to history
    conversation.addMessage("user", message);

    // 3. Handle document attachments (resume PDF)
    let resumeExtracted = false;
    if (attachments && attachments.length > 0) {
        for (const att of attachments) {
            if (att.type === "document" && (att.mimeType === "application/pdf" || (att.fileName && att.fileName.endsWith(".pdf")))) {
                const resumeText = await extractResumeFromAttachment(att);
                if (resumeText) {
                    conversation.currentResume = resumeText;
                    resumeExtracted = true;
                } else {
                    // Resume parsing failed — tell user to use web app
                    const failMsg = "📄 I received your document, but I wasn't able to reliably extract the text from it. " +
                        "This can happen with image-based PDFs or certain formats.\n\n" +
                        "👉 *Please upload your resume through the PrepNex web app instead* — it has a more robust parser that handles all PDF types.\n\n" +
                        "In the meantime, you can paste your resume text directly in this chat and I'll work with that!";

                    conversation.addMessage("assistant", failMsg);
                    await conversation.save();

                    return {
                        answer: failMsg,
                        conversationId: conversation.conversationId,
                        actions: [
                            { type: "link", label: "Open Web App", value: process.env.CLIENT_URL || "https://sidmonai.app" },
                        ],
                    };
                }
            }
        }
    }

    // 4. If conversation is actively in resume_builder state, handle next question step
    if (conversation.resumeBuilderState?.active || conversation.state === "resume_builder") {
        const isCancel = message.startsWith("/help");
        if (!isCancel) {
            const builderResp = await resumeBuilderService.handleStep(conversation, message);
            conversation.addMessage("assistant", builderResp.answer);
            await conversation.save();
            return {
                answer: builderResp.answer,
                conversationId: conversation.conversationId,
                actions: builderResp.actions || [],
            };
        }
    }

    // 5. Detect intent
    const { intent, params } = await detectIntent(message, conversation.state);
    console.log(`[ChatService] Intent: ${intent}, Channel: ${channel}, ConvId: ${conversation.conversationId}`);

    // 6. Route to handler
    let response;
    try {
        switch (intent) {
            case INTENTS.HELP:
                response = handleHelp(conversation);
                break;

            case INTENTS.BUILD:
                response = resumeBuilderService.startBuilder(conversation);
                break;

            case INTENTS.ANALYZE:
                response = await handleAnalyze(conversation, message);
                break;

            case INTENTS.GAPS:
                response = await handleGaps(conversation, message);
                break;

            case INTENTS.PLAN:
                response = await handlePlan(conversation, message);
                break;

            case INTENTS.QUIZ:
                response = await handleQuiz(conversation, message);
                break;

            case INTENTS.MOCK:
                response = await handleMock(conversation, message);
                break;

            case INTENTS.READY:
                response = await handleReady(conversation, message);
                break;

            case INTENTS.SET_RESUME:
                response = handleSetResume(conversation, message);
                break;

            case INTENTS.SET_JD:
                response = handleSetJD(conversation, message);
                break;

            case INTENTS.COURSES:
                response = handleCourses();
                break;

            default:
                response = await handleGeneral(conversation, message);
                break;
        }
    } catch (err) {
        console.error("[ChatService] Handler error:", err);
        response = {
            answer: "⚠️ Sorry, something went wrong while processing your request. Please try again in a moment.",
            actions: [{ type: "suggestion", label: "Try again", value: message }],
        };
    }

    // 6. If resume was just extracted, prepend confirmation
    if (resumeExtracted) {
        response.answer = "✅ *Resume parsed successfully!* I've loaded your resume into this conversation.\n\n" + response.answer;
    }

    // 7. Add assistant response to history and save
    conversation.addMessage("assistant", response.answer);
    await conversation.save();

    return {
        answer: response.answer,
        conversationId: conversation.conversationId,
        actions: response.actions || [],
    };
}

// ─── Conversation Resolution ─────────────────────────────────────────────────

async function resolveConversation(channel, userId, conversationId, threadId) {
    // Try to find existing conversation
    if (conversationId) {
        const existing = await ConversationModel.findOne({ conversationId });
        if (existing) return existing;
    }

    // For Slack, try to find by threadId
    if (channel === "slack" && threadId) {
        const byThread = await ConversationModel.findOne({ channel: "slack", threadId });
        if (byThread) return byThread;
    }

    // For WhatsApp, find the most recent active conversation for this user
    if (channel === "whatsapp") {
        const recent = await ConversationModel.findOne({
            channel: "whatsapp",
            userId,
            lastActiveAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Active within 24h
        }).sort({ lastActiveAt: -1 });
        if (recent) return recent;
    }

    // Resolve external channel user to a MongoDB user if needed
    let resolvedUserId = userId;
    if (channel === "slack" || channel === "whatsapp") {
        try {
            const channelUser = await ChannelUserModel.findOrCreateByExternalId(channel, userId);
            if (channelUser?.userId) {
                resolvedUserId = channelUser.userId;
            }
        } catch (err) {
            console.warn("[ChatService] Failed to map channel user:", err.message);
        }
    }

    // Create new conversation
    const newConvId = `${channel}_${crypto.randomUUID()}`;
    const conversation = new ConversationModel({
        channel,
        userId: resolvedUserId,
        conversationId: newConvId,
        threadId: threadId || null,
        candidateId: resolvedUserId,
    });

    // Try to load user's most recent resume and JD from their latest interview report
    try {
        const queryUser = mongoose.Types.ObjectId.isValid(resolvedUserId) ? resolvedUserId : null;
        if (queryUser) {
            const latestReport = await InterviewReport.findOne({ user: queryUser })
                .sort({ createdAt: -1 })
                .select("resume jobDescription selfDescription");
            if (latestReport) {
                conversation.currentResume = latestReport.resume || latestReport.selfDescription || "";
                conversation.currentJD = latestReport.jobDescription || "";
            }
        }
    } catch (err) {
        console.warn("[ChatService] Could not load latest report for context:", err.message);
    }

    await conversation.save();
    return conversation;
}

// ─── Intent Handlers ─────────────────────────────────────────────────────────

function handleHelp(conversation) {
    return {
        answer: generateHelpText(),
        actions: [
            { type: "suggestion", label: "Analyze Resume", value: "/analyze" },
            { type: "suggestion", label: "Find Skill Gaps", value: "/gaps" },
            { type: "suggestion", label: "Prep Plan", value: "/plan" },
            { type: "suggestion", label: "Quiz Me", value: "/quiz" },
            { type: "suggestion", label: "Courses & Links", value: "/courses" },
        ],
    };
}

function handleCourses() {
    return {
        answer: `🎓 *Top Recommended Courses & Verified Learning Links*\n\n` +
            `Here are industry-recognized, high-impact learning resources with direct live links:\n\n` +
            `### 💻 Data Structures & Algorithms (DSA)\n` +
            `• [NeetCode.io](https://neetcode.io) — Structured LeetCode blind 75 & 150 roadmaps with video solutions *(Free / Pro)*\n` +
            `• [Striver's A2Z DSA Sheet](https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2) — Step-by-step interview problem sets & tutorials *(Free)*\n` +
            `• [Princeton Algorithms (Coursera)](https://www.coursera.org/learn/algorithms-part1) — Deep-dive core computer science algorithms by Robert Sedgewick *(Free to audit)*\n` +
            `• [Tech Interview Handbook](https://www.techinterviewhandbook.org) — Algorithms, behavioral questions, and coding patterns *(Free)*\n\n` +
            `### 🌐 Full-Stack & Modern Web Development\n` +
            `• [Full Stack Open](https://fullstackopen.com) — Deep-dive React, Redux, Node.js, Express, TypeScript, and CI/CD from University of Helsinki *(Free)*\n` +
            `• [The Odin Project](https://www.theodinproject.com) — Open-source full-stack web development curriculum *(Free)*\n` +
            `• [Meta Front-End Developer (Coursera)](https://www.coursera.org/professional-certificates/meta-front-end-developer) — Professional React & UX certificate\n` +
            `• [Meta Back-End Developer (Coursera)](https://www.coursera.org/professional-certificates/meta-back-end-developer) — Python, APIs, and microservices\n\n` +
            `### 🏗️ System Design & Architecture\n` +
            `• [System Design Primer (GitHub)](https://github.com/donnemartin/system-design-primer) — Open-source scalability, caching, load balancing & DB guide *(Free)*\n` +
            `• [ByteByteGo](https://bytebytego.com) — Visual real-world distributed system architectures *(Free articles & newsletter)*\n` +
            `• [MIT 6.824 Distributed Systems](https://pdos.csail.mit.edu/6.824/) — Full MIT university lectures & labs *(Free)*\n\n` +
            `### 🤖 Generative AI & Machine Learning\n` +
            `• [Google Cloud GenAI Path](https://www.cloudskillsboost.google/paths/118) — Official Google Cloud generative AI roadmap *(Free)*\n` +
            `• [DeepLearning.AI GenAI with LLMs](https://www.deeplearning.ai/courses/generative-ai-with-llms/) — Hands-on LLM deployment course\n` +
            `• [Fast.ai Practical Deep Learning](https://course.fast.ai) — Hands-on deep learning for coders *(Free)*\n\n` +
            `💡 *Tip*: Use */plan* to generate a personalized day-by-day prep plan for your target job!`,
        actions: [
            { type: "link", label: "NeetCode.io", value: "https://neetcode.io" },
            { type: "link", label: "Full Stack Open", value: "https://fullstackopen.com" },
            { type: "link", label: "System Design Primer", value: "https://github.com/donnemartin/system-design-primer" },
            { type: "button", label: "Generate Prep Plan", value: "/plan" },
        ],
    };
}

async function handleAnalyze(conversation, message) {
    if (!conversation.currentResume || !conversation.currentJD) {
        return promptForMissingContext(conversation, "analyze your resume");
    }

    try {
        const result = await aiService.generateAtsAndGaps({
            resume: conversation.currentResume,
            jobDescription: conversation.currentJD,
        });

        // Store the report reference
        const report = await InterviewReport.create({
            user: conversation.userId,
            jobDescription: conversation.currentJD,
            resume: conversation.currentResume,
            atsScore: result.atsScore || 0,
            matchScore: result.matchScore || 0,
            skillGaps: result.skillGaps || [],
            missingKeywords: result.missingKeywords || [],
            addedKeywords: result.addedKeywords || [],
            improvementSummary: result.improvementSummary || "",
            recruiterFeedback: result.recruiterFeedback || "",
            title: result.title || "Analysis",
            status: "completed",
            progress: { resumeParsed: true, atsGenerated: true },
        });
        conversation.currentReportId = report._id;

        const answer = formatAnalysisResult(result);
        return {
            answer,
            actions: [
                { type: "suggestion", label: "Show Skill Gaps", value: "/gaps" },
                { type: "suggestion", label: "Create Prep Plan", value: "/plan" },
                { type: "suggestion", label: "Quiz Me", value: "/quiz" },
            ],
        };
    } catch (err) {
        console.error("[ChatService] Analysis failed:", err.message);
        return {
            answer: "⚠️ Sorry, the analysis couldn't be completed right now. The AI service might be under heavy load. Please try again in a moment.",
            actions: [{ type: "suggestion", label: "Try again", value: "/analyze" }],
        };
    }
}

async function handleGaps(conversation, message) {
    if (!conversation.currentResume || !conversation.currentJD) {
        return promptForMissingContext(conversation, "identify skill gaps");
    }

    try {
        const result = await aiService.generateAtsAndGaps({
            resume: conversation.currentResume,
            jobDescription: conversation.currentJD,
        });

        const gaps = result.skillGaps || [];
        if (gaps.length === 0) {
            return {
                answer: "🎉 *Great news!* No significant skill gaps were identified between your resume and this job description. You're well-positioned for this role!",
                actions: [
                    { type: "suggestion", label: "Get Prep Plan", value: "/plan" },
                    { type: "suggestion", label: "Quiz Me", value: "/quiz" },
                ],
            };
        }

        let answer = "🔍 *Skill Gap Analysis*\n\n";
        for (const gap of gaps) {
            const severity = gap.severity === "high" ? "🔴" : gap.severity === "medium" ? "🟡" : "🟢";
            answer += `${severity} *${gap.skill}* — ${gap.severity} priority\n`;
        }

        if (result.missingKeywords && result.missingKeywords.length > 0) {
            answer += "\n📋 *Missing Keywords:* " + result.missingKeywords.join(", ");
        }

        return {
            answer,
            actions: [
                { type: "suggestion", label: "Create Prep Plan", value: "/plan" },
                { type: "suggestion", label: "Full Analysis", value: "/analyze" },
            ],
        };
    } catch (err) {
        console.error("[ChatService] Gaps analysis failed:", err.message);
        return {
            answer: "⚠️ Couldn't complete the gap analysis right now. Please try again shortly.",
            actions: [{ type: "suggestion", label: "Try again", value: "/gaps" }],
        };
    }
}

async function handlePlan(conversation, message) {
    if (!conversation.currentResume || !conversation.currentJD) {
        return promptForMissingContext(conversation, "generate a preparation plan");
    }

    // Extract days from message (e.g., "5 day plan", "plan for 3 days")
    const daysMatch = message.match(/(\d+)\s*(?:day|days)/i);
    const remainingDays = daysMatch ? parseInt(daysMatch[1]) : 7;

    try {
        const result = await aiService.generateRoadmap({
            resume: conversation.currentResume,
            jobDescription: conversation.currentJD,
            remainingDays,
        });

        let answer = `📅 *${remainingDays}-Day Interview Preparation Plan*\n\n`;
        const plan = result.preparationPlan || [];
        for (const day of plan) {
            answer += `*Day ${day.day}: ${day.focus}*\n`;
            if (day.tasks) {
                for (const task of day.tasks) {
                    const icon = task.priority === "High" ? "🔴" : task.priority === "Medium" ? "🟡" : "🟢";
                    answer += `  ${icon} ${task.title} (${task.timeHours}h, ${task.difficulty})\n`;
                }
            }
            answer += "\n";
        }

        answer += "💡 _For detailed task tracking with progress bars and resources, use the PrepNex web app._";

        return {
            answer,
            actions: [
                { type: "suggestion", label: "Quiz Me", value: "/quiz" },
                { type: "suggestion", label: "Mock Interview", value: "/mock" },
                { type: "link", label: "Open Web App", value: process.env.CLIENT_URL || "https://sidmonai.app" },
            ],
        };
    } catch (err) {
        console.error("[ChatService] Plan generation failed:", err.message);
        return {
            answer: "⚠️ Couldn't generate the plan right now. Please try again shortly.",
            actions: [{ type: "suggestion", label: "Try again", value: "/plan" }],
        };
    }
}

async function handleQuiz(conversation, message) {
    if (!conversation.currentResume && !conversation.currentJD) {
        return promptForMissingContext(conversation, "start a quiz");
    }

    try {
        const result = await aiService.generateQuestions({
            resume: conversation.currentResume || "",
            jobDescription: conversation.currentJD || "",
        });

        const allQuestions = [
            ...(result.technicalQuestions || []).map(q => ({ ...q, type: "Technical" })),
            ...(result.behavioralQuestions || []).map(q => ({ ...q, type: "Behavioral" })),
        ];

        if (allQuestions.length === 0) {
            return {
                answer: "I couldn't generate questions right now. Please try again.",
                actions: [{ type: "suggestion", label: "Try again", value: "/quiz" }],
            };
        }

        // Save quiz state
        conversation.state = "quiz";
        conversation.quizState = {
            questions: allQuestions,
            currentIndex: 0,
            score: 0,
            total: allQuestions.length,
        };

        const q = allQuestions[0];
        let answer = "🧠 *Quiz Mode Started!*\n\n";
        answer += `*Question 1/${allQuestions.length}* (${q.type})\n\n`;
        answer += `${q.question}\n\n`;
        answer += "_Type your answer, and I'll evaluate it. Type /help to exit quiz mode._";

        return { answer, actions: [] };
    } catch (err) {
        console.error("[ChatService] Quiz generation failed:", err.message);
        return {
            answer: "⚠️ Couldn't start the quiz right now. Please try again shortly.",
            actions: [{ type: "suggestion", label: "Try again", value: "/quiz" }],
        };
    }
}

async function handleMock(conversation, message) {
    if (!conversation.currentResume && !conversation.currentJD) {
        return promptForMissingContext(conversation, "start a mock interview");
    }

    conversation.state = "mock_interview";
    conversation.mockInterviewState = {
        questionsAsked: 0,
        maxQuestions: 5,
        phase: "intro",
    };

    const answer = "🎤 *Mock Interview Mode*\n\n" +
        "I'll simulate a real interview experience. I'll ask you 5 questions — a mix of technical and behavioral.\n\n" +
        "Treat this like a real interview: give complete, structured answers.\n\n" +
        "Let's begin!\n\n" +
        `*Interviewer:* \"Tell me about yourself and what interests you about this role.\"\n\n` +
        "_Type your response as you would in a real interview. Type /help to exit._";

    return { answer, actions: [] };
}

async function handleReady(conversation, message) {
    if (!conversation.currentResume || !conversation.currentJD) {
        return promptForMissingContext(conversation, "assess your readiness");
    }

    try {
        const result = await aiService.generateAtsAndGaps({
            resume: conversation.currentResume,
            jobDescription: conversation.currentJD,
        });

        const score = result.atsScore || 0;
        const matchScore = result.matchScore || 0;
        const gaps = result.skillGaps || [];
        const highGaps = gaps.filter(g => g.severity === "high").length;

        let emoji, verdict;
        if (score >= 80 && matchScore >= 75 && highGaps === 0) {
            emoji = "🟢";
            verdict = "You're looking strong! You're well-prepared for this role.";
        } else if (score >= 60 && matchScore >= 50) {
            emoji = "🟡";
            verdict = "You're getting there, but there are areas to improve before your interview.";
        } else {
            emoji = "🔴";
            verdict = "You need more preparation. Focus on the critical gaps below.";
        }

        let answer = `${emoji} *Readiness Assessment*\n\n`;
        answer += `📊 *ATS Score:* ${score}/100\n`;
        answer += `🎯 *Match Score:* ${matchScore}/100\n`;
        answer += `⚠️ *Critical Gaps:* ${highGaps}\n\n`;
        answer += `*Verdict:* ${verdict}`;

        if (highGaps > 0) {
            answer += "\n\n*Critical areas to address:*\n";
            for (const g of gaps.filter(g => g.severity === "high")) {
                answer += `  🔴 ${g.skill}\n`;
            }
        }

        return {
            answer,
            actions: [
                { type: "suggestion", label: "Prep Plan", value: "/plan" },
                { type: "suggestion", label: "Quiz Me", value: "/quiz" },
            ],
        };
    } catch (err) {
        console.error("[ChatService] Readiness assessment failed:", err.message);
        return {
            answer: "⚠️ Couldn't complete the readiness assessment. Please try again.",
            actions: [{ type: "suggestion", label: "Try again", value: "/ready" }],
        };
    }
}

function handleSetResume(conversation, message) {
    // Strip the command prefix if present
    const resumeText = message.replace(/^\/?\s*set[_-]?resume\s*/i, "").trim();
    if (resumeText.length < 20) {
        return {
            answer: "Please paste your full resume text. It seems too short to be useful.",
            actions: [],
        };
    }

    conversation.currentResume = resumeText;
    return {
        answer: "✅ *Resume saved!* I'll use this for all analyses in this conversation.\n\n" +
            "Now, what would you like to do?",
        actions: [
            { type: "suggestion", label: "Analyze Resume", value: "/analyze" },
            { type: "suggestion", label: "Find Gaps", value: "/gaps" },
        ],
    };
}

function handleSetJD(conversation, message) {
    const jdText = message.replace(/^\/?\s*set[_-]?jd\s*/i, "").trim();
    if (jdText.length < 20) {
        return {
            answer: "Please paste the full job description. It seems too short.",
            actions: [],
        };
    }

    conversation.currentJD = jdText;
    return {
        answer: "✅ *Job description saved!* I'll use this for all analyses in this conversation.\n\n" +
            "Now, what would you like to do?",
        actions: [
            { type: "suggestion", label: "Analyze Resume", value: "/analyze" },
            { type: "suggestion", label: "Find Gaps", value: "/gaps" },
            { type: "suggestion", label: "Prep Plan", value: "/plan" },
        ],
    };
}

async function handleGeneral(conversation, message) {
    // Check if we're in quiz mode
    if (conversation.state === "quiz" && conversation.quizState) {
        return handleQuizAnswer(conversation, message);
    }

    // Check if we're in mock interview mode
    if (conversation.state === "mock_interview" && conversation.mockInterviewState) {
        return handleMockAnswer(conversation, message);
    }

    // General conversation — use OpenRouter for a contextual response
    const client = getOpenRouterClient();
    if (!client) {
        return {
            answer: "I'm here to help with your interview preparation! Try using one of the commands — type /help to see what's available.",
            actions: [{ type: "suggestion", label: "Help", value: "/help" }],
        };
    }

    try {
        const context = buildAIContext(conversation);
        const history = conversation.getRecentHistory(8);

        const response = await client.chat.completions.create({
            model: OPENROUTER_MODEL,
            messages: [
                {
                    role: "system",
                    content: `You are PrepNex AI, an expert interview preparation assistant. You help candidates prepare for technical interviews.\n\n${context}\n\nProvide a helpful, concise response. If the user seems to need specific features (resume analysis, skill gaps, prep plan, quiz, mock interview), suggest the relevant commands. Keep responses under 500 words. Use markdown formatting.`
                },
                {
                    role: "user",
                    content: `Recent conversation:\n${history}\n\nUser: ${message}`
                }
            ],
            temperature: 0.7,
            max_tokens: 800
        });

        return {
            answer: response.choices[0]?.message?.content || "I'm not sure how to help with that. Try /help to see what I can do!",
            actions: [
                { type: "suggestion", label: "Analyze", value: "/analyze" },
                { type: "suggestion", label: "Quiz", value: "/quiz" },
                { type: "suggestion", label: "Help", value: "/help" },
            ],
        };
    } catch (err) {
        console.error("[ChatService] General response failed:", err.message);
        return {
            answer: "I'm having trouble right now. Please try again, or use one of the specific commands like /analyze, /plan, or /quiz.",
            actions: [{ type: "suggestion", label: "Help", value: "/help" }],
        };
    }
}

// ─── Quiz Answer Handler ─────────────────────────────────────────────────────

async function handleQuizAnswer(conversation, message) {
    const qs = conversation.quizState;
    if (!qs || qs.currentIndex >= qs.total) {
        conversation.state = "idle";
        conversation.quizState = null;
        return {
            answer: "Quiz is complete! Type /quiz to start a new one.",
            actions: [{ type: "suggestion", label: "New Quiz", value: "/quiz" }],
        };
    }

    const currentQ = qs.questions[qs.currentIndex];
    const modelAnswer = currentQ.answer;

    // Evaluate the answer using OpenRouter
    const client = getOpenRouterClient();
    let evaluation = "";
    if (client) {
        try {
            const evalResponse = await client.chat.completions.create({
                model: OPENROUTER_MODEL,
                messages: [
                    {
                        role: "system",
                        content: "You are evaluating an interview answer. Be constructive, specific, concise, encouraging, and format with markdown."
                    },
                    {
                        role: "user",
                        content: `Question: ${currentQ.question}
Model Answer: ${modelAnswer}
Candidate's Answer: ${message}

Provide:
1. A score out of 10
2. What was good (1-2 sentences)
3. What could be improved (1-2 sentences)
4. Key points they missed (brief list)`
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            });
            evaluation = evalResponse.choices[0]?.message?.content || "";
        } catch (err) {
            evaluation = `*Model answer:* ${modelAnswer}`;
        }
    } else {
        evaluation = `*Model answer:* ${modelAnswer}`;
    }

    qs.currentIndex++;
    conversation.quizState = qs;
    conversation.markModified("quizState");

    let answer = `📝 *Feedback on Q${qs.currentIndex}/${qs.total}*\n\n${evaluation}\n\n`;

    if (qs.currentIndex < qs.total) {
        const nextQ = qs.questions[qs.currentIndex];
        answer += `---\n\n*Question ${qs.currentIndex + 1}/${qs.total}* (${nextQ.type})\n\n${nextQ.question}`;
    } else {
        conversation.state = "idle";
        conversation.quizState = null;
        answer += "🎉 *Quiz complete!* Great practice session.";
    }

    return { answer, actions: [] };
}

// ─── Mock Interview Answer Handler ───────────────────────────────────────────

async function handleMockAnswer(conversation, message) {
    const ms = conversation.mockInterviewState;
    if (!ms) {
        conversation.state = "idle";
        return { answer: "Mock interview session ended. Type /mock to start again.", actions: [] };
    }

    ms.questionsAsked++;
    conversation.mockInterviewState = ms;
    conversation.markModified("mockInterviewState");

    const genai = getAI();
    if (!genai) {
        conversation.state = "idle";
        conversation.mockInterviewState = null;
        return { answer: "Mock interview ended (AI unavailable). Type /mock to retry.", actions: [] };
    }

    try {
        const context = buildAIContext(conversation);
        const history = conversation.getRecentHistory(6);

        const prompt = ms.questionsAsked >= ms.maxQuestions
            ? `You are conducting a mock interview. The candidate just gave their final answer. Provide a brief overall evaluation of their interview performance (strengths, weaknesses, areas to improve). Then end the interview professionally.

${context}
Recent interview exchange:
${history}
Candidate's answer: ${message}

Keep the evaluation concise (under 300 words). Use markdown.`
            : `You are a professional technical interviewer conducting a mock interview. The candidate just answered your previous question. 

${context}
Recent interview exchange:
${history}
Candidate's answer: ${message}

1. Give brief feedback on their answer (2-3 sentences, constructive).
2. Then ask the NEXT interview question. Alternate between technical and behavioral. Make questions specific to their resume and the target JD.

Keep it natural and professional like a real interview. Use markdown.`;

        const client = getOpenRouterClient();
        if (!client) {
            throw new Error("OPENROUTER_API_KEY is not configured.");
        }

        const response = await client.chat.completions.create({
            model: OPENROUTER_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert technical interviewer conducting a mock interview. Format with markdown."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 600
        });

        if (ms.questionsAsked >= ms.maxQuestions) {
            conversation.state = "idle";
            conversation.mockInterviewState = null;
        }

        return {
            answer: response.choices[0]?.message?.content || "Thank you for your answer. The mock interview is now complete.",
            actions: ms.questionsAsked >= ms.maxQuestions ? [
                { type: "suggestion", label: "New Mock", value: "/mock" },
                { type: "suggestion", label: "Quiz Me", value: "/quiz" },
                { type: "suggestion", label: "Prep Plan", value: "/plan" },
            ] : [],
        };
    } catch (err) {
        console.error("[ChatService] Mock interview response failed:", err.message);
        conversation.state = "idle";
        conversation.mockInterviewState = null;
        return {
            answer: "The mock interview was interrupted due to a technical issue. Type /mock to start again.",
            actions: [{ type: "suggestion", label: "Restart", value: "/mock" }],
        };
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function promptForMissingContext(conversation, action) {
    const missing = [];
    if (!conversation.currentResume) missing.push("resume");
    if (!conversation.currentJD) missing.push("job description");

    let answer = `📋 To ${action}, I need your ${missing.join(" and ")}.\n\n`;

    if (missing.includes("resume")) {
        answer += "📎 *Resume:* Send me a PDF, or paste your resume text directly.\n";
    }
    if (missing.includes("job description")) {
        answer += "📝 *Job Description:* Paste the job description you're targeting.\n";
    }

    answer += "\nOnce I have both, I'll be able to help!";

    return { answer, actions: [] };
}

function buildAIContext(conversation) {
    const parts = [];
    if (conversation.currentResume) {
        parts.push(`Candidate's Resume:\n${conversation.currentResume.substring(0, 2000)}`);
    }
    if (conversation.currentJD) {
        parts.push(`Target Job Description:\n${conversation.currentJD.substring(0, 2000)}`);
    }
    return parts.length > 0 ? parts.join("\n\n") : "No resume or job description provided yet.";
}

function formatAnalysisResult(result) {
    let answer = "📊 *Resume Analysis Complete*\n\n";
    answer += `🎯 *ATS Score:* ${result.atsScore || 0}/100\n`;
    answer += `📈 *Match Score:* ${result.matchScore || 0}/100\n`;

    if (result.skillGaps && result.skillGaps.length > 0) {
        answer += "\n⚠️ *Skill Gaps:*\n";
        for (const gap of result.skillGaps) {
            const icon = gap.severity === "high" ? "🔴" : gap.severity === "medium" ? "🟡" : "🟢";
            answer += `  ${icon} ${gap.skill} (${gap.severity})\n`;
        }
    }

    if (result.missingKeywords && result.missingKeywords.length > 0) {
        answer += "\n🔑 *Missing Keywords:* " + result.missingKeywords.slice(0, 8).join(", ") + "\n";
    }

    if (result.recruiterFeedback) {
        answer += `\n💬 *Recruiter Feedback:*\n${result.recruiterFeedback}\n`;
    }

    if (result.improvementSummary) {
        answer += `\n✨ *Improvement Summary:*\n${result.improvementSummary}`;
    }

    return answer;
}

module.exports = {
    processMessage,
    resolveConversation,
    detectIntent,
    INTENTS,
};
