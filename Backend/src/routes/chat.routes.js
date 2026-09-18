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
 */
router.post("/", async (req, res, next) => {
    try {
        const { channel, userId: bodyUserId, user_id, message, conversation_id, conversationId, attachments } = req.body;

        if (!message && (!attachments || attachments.length === 0)) {
            return res.status(400).json({ error: "Message or attachment is required." });
        }

        // Try using provided userId, or extract from authenticated token, or generate a guest ID
        let resolvedUserId = bodyUserId || user_id;
        if (!resolvedUserId) {
            resolvedUserId = "guest_web_user";
            if (req.cookies?.token || req.headers.authorization) {
                try {
                    const jwt = require("jsonwebtoken");
                    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
                    if (token) {
                        const decoded = jwt.verify(token, process.env.JWT_SECRET);
                        if (decoded && decoded._id) {
                            resolvedUserId = String(decoded._id);
                        }
                    }
                } catch {
                    // Keep guest ID if token is invalid/expired
                }
            }
        }

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
