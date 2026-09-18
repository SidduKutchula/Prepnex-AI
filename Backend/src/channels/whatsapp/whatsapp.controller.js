/**
 * WhatsApp Controller
 * 
 * Handles incoming webhooks from Meta's Cloud API:
 * 1. GET /webhooks/whatsapp — Meta webhook verification challenge handshake
 * 2. POST /webhooks/whatsapp — Receive messages, normalize to ChannelRequest,
 *    orchestrate via chat.service.js, format per-channel, and reply.
 */

const whatsappClient = require("./whatsapp.client");
const chatService = require("../../services/chat.service");
const { formatForWhatsApp } = require("../responseAdapter");
const ChannelUserModel = require("../../models/channelUser.model");
const { parseChannelRequest } = require("../channelTypes");

/**
 * Handle GET verification challenge from Meta App Dashboard.
 */
function verifyWebhook(req, res) {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
        console.log("[WhatsApp] Webhook verified successfully by Meta.");
        return res.status(200).send(challenge);
    }

    console.warn("[WhatsApp] Webhook verification failed. Token mismatch or invalid mode.");
    return res.status(403).send("Verification failed");
}

/**
 * Handle incoming POST webhook events from Meta.
 */
async function handleWebhook(req, res) {
    // Meta requires an immediate 200 OK acknowledgement, otherwise it retries.
    res.status(200).send("EVENT_RECEIVED");

    const body = req.body;

    if (!body || body.object !== "whatsapp_business_account") {
        return;
    }

    try {
        const entry = body.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;

        if (!value) return;

        // Skip status updates (sent, delivered, read)
        if (value.statuses && !value.messages) {
            return;
        }

        const messages = value.messages;
        if (!messages || messages.length === 0) {
            return;
        }

        const contacts = value.contacts || [];
        const contactMap = {};
        for (const contact of contacts) {
            contactMap[contact.wa_id] = contact.profile?.name || null;
        }

        // Process each message sequentially
        for (const message of messages) {
            await processIncomingWhatsAppMessage(message, contactMap[message.from]);
        }
    } catch (err) {
        console.error("[WhatsApp] Error processing webhook event:", err);
    }
}

/**
 * Extract and process an individual WhatsApp message.
 */
async function processIncomingWhatsAppMessage(message, contactName) {
    const from = message.from; // Phone number with country code
    const messageId = message.id;

    // Acknowledge read in WhatsApp UI
    whatsappClient.markAsRead(messageId).catch(() => {});

    let messageText = "";
    const attachments = [];

    // Extract message content based on type
    switch (message.type) {
        case "text":
            messageText = message.text?.body || "";
            break;

        case "interactive": {
            // Button clicks or list selections
            const interactive = message.interactive;
            if (interactive.button_reply) {
                // If the button id was formatted with a command value or title, use title/id
                const replyTitle = interactive.button_reply.title;
                const replyId = interactive.button_reply.id;
                messageText = replyTitle || replyId;
            } else if (interactive.list_reply) {
                messageText = interactive.list_reply.title || interactive.list_reply.id;
            }
            break;
        }

        case "document": {
            const doc = message.document;
            messageText = doc.caption || "Uploaded document resume";

            if (doc && doc.id) {
                try {
                    console.log(`[WhatsApp] Downloading document media ${doc.id}...`);
                    const media = await whatsappClient.downloadMedia(doc.id);
                    attachments.push({
                        type: "document",
                        mimeType: doc.mime_type || media.mimeType || "application/pdf",
                        buffer: media.buffer,
                        fileName: doc.filename || media.fileName || "resume.pdf",
                    });
                } catch (mediaErr) {
                    console.error("[WhatsApp] Failed to download document media:", mediaErr.message);
                    // Still push metadata so chatService can provide friendly feedback
                    attachments.push({
                        type: "document",
                        mimeType: doc.mime_type || "application/pdf",
                        fileName: doc.filename || "resume.pdf",
                    });
                }
            }
            break;
        }

        default:
            console.log(`[WhatsApp] Ignored unhandled message type: ${message.type}`);
            return;
    }

    if (!messageText && attachments.length === 0) {
        return;
    }

    // 1. Resolve or create internal user
    const channelUser = await ChannelUserModel.findOrCreateByExternalId(
        "whatsapp",
        from,
        contactName
    );

    // 2. Build channel-independent request shape
    const channelRequest = parseChannelRequest({
        channel: "whatsapp",
        userId: String(channelUser.userId),
        threadId: from, // WhatsApp groups all messages by sender phone
        message: messageText || "Please process my uploaded resume.",
        attachments,
    });

    // 3. Call central conversational orchestrator (NO duplicated AI logic)
    const channelResponse = await chatService.processMessage(channelRequest);

    // 4. Format response specifically for WhatsApp
    const formatted = formatForWhatsApp(channelResponse);

    // 5. Send reply messages back to user
    for (const msg of formatted.messages) {
        await whatsappClient.sendMessage(from, msg);
    }
}

module.exports = {
    verifyWebhook,
    handleWebhook,
    processIncomingWhatsAppMessage,
};
