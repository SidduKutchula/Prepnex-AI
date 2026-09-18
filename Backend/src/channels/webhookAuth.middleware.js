/**
 * Webhook Authentication Middleware
 * 
 * Verifies platform-specific signatures on every incoming webhook request.
 * Rejects anything that doesn't verify with a 401.
 */

const crypto = require("crypto");

// ─── WhatsApp Signature Verification ─────────────────────────────────────────

/**
 * Verifies the X-Hub-Signature-256 header on WhatsApp webhook POST requests.
 * Meta signs the payload with your app secret using HMAC-SHA256.
 * 
 * Requires: WHATSAPP_APP_SECRET env var
 */
function verifyWhatsAppSignature(req, res, next) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!appSecret) {
        console.error("[WebhookAuth] WHATSAPP_APP_SECRET is not configured. Cannot verify webhook signature.");
        return res.status(503).json({
            error: "WhatsApp integration is not fully configured. Missing WHATSAPP_APP_SECRET.",
        });
    }

    const signature = req.headers["x-hub-signature-256"];
    if (!signature) {
        console.warn("[WebhookAuth] WhatsApp webhook request missing X-Hub-Signature-256 header.");
        return res.status(401).json({ error: "Missing signature header." });
    }

    // The raw body is needed for HMAC computation
    const rawBody = req.rawBody;
    if (!rawBody) {
        console.error("[WebhookAuth] Raw body not available for WhatsApp signature verification. Ensure express.json() preserves rawBody.");
        return res.status(500).json({ error: "Server configuration error: raw body not available." });
    }

    const expectedSignature = "sha256=" + crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        console.warn("[WebhookAuth] WhatsApp signature verification FAILED.");
        return res.status(401).json({ error: "Invalid signature." });
    }

    next();
}

// ─── Slack Signature Verification ────────────────────────────────────────────

/**
 * Verifies Slack's signing secret on every incoming webhook request.
 * Slack signs with: v0=HMAC-SHA256(signing_secret, "v0:{timestamp}:{body}")
 * 
 * Also rejects requests with timestamps older than 5 minutes (replay protection).
 * 
 * Requires: SLACK_SIGNING_SECRET env var
 */
function verifySlackSignature(req, res, next) {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;

    if (!signingSecret) {
        console.error("[WebhookAuth] SLACK_SIGNING_SECRET is not configured. Cannot verify webhook signature.");
        return res.status(503).json({
            error: "Slack integration is not fully configured. Missing SLACK_SIGNING_SECRET.",
        });
    }

    const timestamp = req.headers["x-slack-request-timestamp"];
    const slackSignature = req.headers["x-slack-signature"];

    if (!timestamp || !slackSignature) {
        console.warn("[WebhookAuth] Slack webhook request missing timestamp or signature header.");
        return res.status(401).json({ error: "Missing Slack authentication headers." });
    }

    // Replay attack protection: reject if timestamp is more than 5 minutes old
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
        console.warn("[WebhookAuth] Slack request timestamp too old (possible replay attack).");
        return res.status(401).json({ error: "Request timestamp expired." });
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
        console.error("[WebhookAuth] Raw body not available for Slack signature verification.");
        return res.status(500).json({ error: "Server configuration error: raw body not available." });
    }

    const sigBaseString = `v0:${timestamp}:${rawBody}`;
    const expectedSignature = "v0=" + crypto
        .createHmac("sha256", signingSecret)
        .update(sigBaseString)
        .digest("hex");

    const sigBuf = Buffer.from(slackSignature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        console.warn("[WebhookAuth] Slack signature verification FAILED.");
        return res.status(401).json({ error: "Invalid signature." });
    }

    next();
}

module.exports = {
    verifyWhatsAppSignature,
    verifySlackSignature,
};
