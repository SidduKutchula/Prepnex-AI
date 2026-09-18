const express = require("express");
const router = express.Router();
const chatService = require("../services/chat.service");
const { formatForWeb } = require("../channels/responseAdapter");
const { parseChannelRequest } = require("../channels/channelTypes");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @route POST /api/chat
 * @description Central conversation endpoint used by the Web frontend.
 * Accepts channel-independent format and calls the unified chat engine.
 * Uses checkUser (soft auth) — allows guest usage but identifies authenticated users.
 */
router.post("/", authMiddleware.checkUser, async (req, res, next) => {
    try {
        const { channel, userId: bodyUserId, user_id, message, conversation_id, conversationId, attachments } = req.body;

        if (!message && (!attachments || attachments.length === 0)) {
            return res.status(400).json({ error: "Message or attachment is required." });
        }

        // Use authenticated user ID if available, otherwise fall back to body or guest
        let resolvedUserId = req.user?.id || bodyUserId || user_id || "guest_web_user";

        const channelRequest = parseChannelRequest({
            channel: channel || "web",
            userId: String(resolvedUserId),
            conversationId: conversationId || conversation_id,
            message: message || "Hello",
            attachments: attachments || [],
        });

        const channelResponse = await chatService.processMessage(channelRequest);
        const webResponse = formatForWeb(channelResponse);

        return res.status(200).json(webResponse);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
