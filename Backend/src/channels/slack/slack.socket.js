/**
 * Slack Socket Mode Runner
 * 
 * Runs on top of the backend server layer within the same process.
 * Eliminates the need for a separate terminal window and eliminates
 * loopback HTTP overhead by calling chatService.processMessage() directly.
 */

require("dotenv").config();
const { App } = require("@slack/bolt");
const chatService = require("../../services/chat.service");
const ChannelUserModel = require("../../models/channelUser.model");
const { parseChannelRequest } = require("../channelTypes");
const { formatForSlack } = require("../responseAdapter");

let boltApp = null;

/**
 * Handle incoming user interactions directly via the central chat engine.
 */
async function handleMessage({ text, userId, channelId, threadTs, say }) {
    if (!text || !text.trim()) {
        console.log("[Slack Socket] Ignored empty message text.");
        return;
    }

    console.log(`[Slack Socket] 📥 Processing message from user ${userId} in ${channelId}: "${text}"`);

    try {
        // 1. Resolve or create user mapping
        const channelUser = await ChannelUserModel.findOrCreateByExternalId(
            "slack",
            userId,
            null
        );

        // 2. Build channel-independent request shape
        const channelRequest = parseChannelRequest({
            channel: "slack",
            userId: String(channelUser.userId),
            threadId: threadTs,
            message: text.trim(),
            attachments: [],
        });

        // 3. Directly call central conversational orchestrator (Zero HTTP overhead!)
        const channelResponse = await chatService.processMessage(channelRequest);

        // 4. Format for Slack Block Kit
        const formatted = formatForSlack(channelResponse);

        // 5. Build safe say options
        const sayOptions = {
            text: formatted.text || "PrepNex AI Response",
        };
        if (formatted.blocks && formatted.blocks.length > 0) {
            sayOptions.blocks = formatted.blocks;
        }
        if (threadTs) {
            sayOptions.thread_ts = threadTs;
        }

        // 6. Send reply to Slack (with plain text fallback)
        try {
            await say(sayOptions);
            console.log(`[Slack Socket] 📤 Successfully replied to user ${userId} in ${channelId}`);
        } catch (postErr) {
            console.warn(`[Slack Socket] Block Kit send failed (${postErr.message}), falling back to plain text...`);
            const fallbackOptions = { text: formatted.text || channelResponse.answer };
            if (threadTs) fallbackOptions.thread_ts = threadTs;
            await say(fallbackOptions);
            console.log(`[Slack Socket] 📤 Sent plain text fallback to ${userId}`);
        }
    } catch (err) {
        console.error("[Slack Socket] ❌ Error handling interaction:", err.message);
        try {
            const errReply = { text: "Something went wrong on my end — please try again in a moment." };
            if (threadTs) errReply.thread_ts = threadTs;
            await say(errReply);
        } catch (sendErr) {
            console.error("[Slack Socket] Could not send error message to Slack:", sendErr.message);
        }
    }
}

/**
 * Initialize and start the Slack Socket Mode bot.
 */
async function startSlackSocketBot() {
    const botToken = process.env.SLACK_BOT_TOKEN;
    const appToken = process.env.SLACK_APP_TOKEN;

    if (!botToken || !appToken) {
        console.log("[Slack Socket] SLACK_BOT_TOKEN or SLACK_APP_TOKEN not configured. Skipping Socket Mode.");
        return null;
    }

    if (boltApp) {
        console.log("[Slack Socket] Socket Mode bot is already running.");
        return boltApp;
    }

    try {
        boltApp = new App({
            token: botToken,
            appToken: appToken,
            socketMode: true,
            clientPingTimeoutMS: 30000,
            serverPingTimeoutMS: 60000,
        });

        // Suppress noisy transient WebSocket reconnect warnings
        boltApp.error(async (error) => {
            if (error.name === 'SMWebsocketError' || error.message?.includes('pong') || error.message?.includes('fetch failed')) {
                console.warn("[Slack Socket] Network reconnecting...");
            } else {
                console.error("[Slack Socket] Error:", error.message || error);
            }
        });

        // 1. Handle Direct Messages (and channel messages if subscribed)
        boltApp.message(async ({ message, say }) => {
            // Ignore bot's own messages to prevent loops
            if (message.bot_id || message.subtype === "bot_message") return;

            console.log(`[Slack Socket] 📨 Received message event: "${message.text}" from user ${message.user}`);

            await handleMessage({
                text: message.text,
                userId: message.user,
                channelId: message.channel,
                threadTs: message.thread_ts,
                say,
            });
        });

        // 2. Handle @mentions in public/private channels
        boltApp.event("app_mention", async ({ event, say }) => {
            if (event.bot_id) return;
            const cleanText = (event.text || "").replace(/<@[A-Z0-9]+>/g, "").trim();
            console.log(`[Slack Socket] 🔔 Received app_mention: "${cleanText}" from user ${event.user}`);

            await handleMessage({
                text: cleanText || "/help",
                userId: event.user,
                channelId: event.channel,
                threadTs: event.thread_ts || event.ts,
                say,
            });
        });

        // 3. Handle Block Kit Button Clicks (Resume Builder, Quick Replies, Home Tab)
        boltApp.action(/^(action_|btn_)/, async ({ action, body, ack, say, client }) => {
            await ack();
            const actionValue = action.value || action.text?.text;
            if (!actionValue) return;

            console.log(`[Slack Socket] 🔘 Received button action: "${actionValue}" from user ${body.user?.id}`);

            let channelId = body.channel?.id;
            let sayFn = say;

            // If action originated from the Home Tab, open user DM and send reply there
            if (!channelId && client && body.user?.id) {
                try {
                    const im = await client.conversations.open({ users: body.user.id });
                    channelId = im.channel?.id;
                    sayFn = async (msg) => {
                        const payload = typeof msg === "string" ? { text: msg } : msg;
                        await client.chat.postMessage({ channel: channelId, ...payload });
                    };
                } catch (imErr) {
                    console.error("[Slack Socket] Failed to open DM for home button click:", imErr.message);
                }
            }

            await handleMessage({
                text: actionValue,
                userId: body.user?.id,
                channelId,
                threadTs: body.message?.thread_ts || body.message?.ts,
                say: sayFn,
            });
        });

        // 4. Handle App Home Tab Opened (Interactive in-app dashboard!)
        boltApp.event("app_home_opened", async ({ event, client }) => {
            console.log(`[Slack Socket] 🏠 App Home opened by user ${event.user}`);
            try {
                await client.views.publish({
                    user_id: event.user,
                    view: {
                        type: "home",
                        blocks: [
                            {
                                type: "header",
                                text: {
                                    type: "plain_text",
                                    text: "PrepNex AI — Interview Prep & ATS Resume Builder 🚀",
                                    emoji: true,
                                },
                            },
                            {
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: "Welcome to *PrepNex AI*! I'm your interactive AI career assistant. Use the quick launch buttons below or click the *Messages* tab above to start chatting with me directly!",
                                },
                            },
                            { type: "divider" },
                            {
                                type: "header",
                                text: {
                                    type: "plain_text",
                                    text: "⚡ Quick Action Launchers",
                                    emoji: true,
                                },
                            },
                            {
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: "• *AI Resume Builder*: Build an ATS-optimized resume from scratch through guided Q&A.\n• *Analyze Resume*: Upload your resume and paste a JD for ATS score & feedback.\n• *Skill Gaps*: Discover concepts you need to brush up for your target role.\n• *Prep Plan*: Get a customized, step-by-step roadmap for your upcoming interview.\n• *Mock Interview*: Practice technical or behavioral interview questions.",
                                },
                            },
                            {
                                type: "actions",
                                elements: [
                                    {
                                        type: "button",
                                        text: { type: "plain_text", text: "📝 Build Resume", emoji: true },
                                        value: "/build",
                                        action_id: "btn_home_build",
                                        style: "primary",
                                    },
                                    {
                                        type: "button",
                                        text: { type: "plain_text", text: "🔍 Analyze Resume", emoji: true },
                                        value: "/analyze",
                                        action_id: "btn_home_analyze",
                                    },
                                    {
                                        type: "button",
                                        text: { type: "plain_text", text: "🎯 Skill Gaps", emoji: true },
                                        value: "/gaps",
                                        action_id: "btn_home_gaps",
                                    },
                                    {
                                        type: "button",
                                        text: { type: "plain_text", text: "📅 Prep Plan", emoji: true },
                                        value: "/plan",
                                        action_id: "btn_home_plan",
                                    },
                                    {
                                        type: "button",
                                        text: { type: "plain_text", text: "🎙️ Mock Interview", emoji: true },
                                        value: "/mock",
                                        action_id: "btn_home_mock",
                                    },
                                ],
                            },
                            { type: "divider" },
                            {
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: "💡 *How to Chat With Me:*\n1. Switch to the *Messages* tab at the top of this screen.\n2. Send any message like `hi`, `/build`, or drag & drop a PDF resume.\n3. You can also invite me to any channel with `/invite @PrepNex AI`.",
                                },
                                accessory: {
                                    type: "button",
                                    text: { type: "plain_text", text: "🌐 Open Web App", emoji: true },
                                    url: process.env.CLIENT_URL || "https://sidmonai.app",
                                    action_id: "btn_home_webapp",
                                },
                            },
                        ],
                    },
                });
                console.log(`[Slack Socket] 🏠 Successfully published Home Tab for user ${event.user}`);
            } catch (homeErr) {
                console.error("[Slack Socket] Failed to publish Home Tab:", homeErr.message);
            }
        });

        // 4. Handle Slash Commands
        const slashCommands = ["/prepnex", "/analyze", "/build", "/mock", "/plan", "/help", "/gaps", "/quiz", "/ready"];
        for (const cmd of slashCommands) {
            boltApp.command(cmd, async ({ command, ack, respond, say }) => {
                await ack();
                const text = (command.text || "").trim();
                console.log(`[Slack Socket] ⚡ Received slash command ${cmd} with text "${text}" from user ${command.user_id}`);

                let fullMessage;
                if (cmd === "/prepnex") {
                    fullMessage = text || "/help";
                } else {
                    fullMessage = text ? `${cmd} ${text}` : cmd;
                }

                // In channels where bot isn't invited yet, respond() uses response_url
                const replyFn = respond || say;
                await handleMessage({
                    text: fullMessage,
                    userId: command.user_id,
                    channelId: command.channel_id,
                    threadTs: undefined,
                    say: replyFn,
                });
            });
        }

        await boltApp.start();
        console.log("⚡ [Slack Socket Mode] PrepNex Slack Bot running on top of backend layer!");
        return boltApp;
    } catch (err) {
        console.error("⚠️ [Slack Socket Mode] Failed to initialize Slack bot:", err.message);
        return null;
    }
}

module.exports = {
    startSlackSocketBot,
    handleMessage,
};
