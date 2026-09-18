/**
 * Response Adapter
 * 
 * Takes the channel-independent ChannelResponse and formats it
 * per channel (web / WhatsApp / Slack). All platform-specific
 * formatting lives here — nowhere else in the codebase.
 */

// ─── WhatsApp Constants ──────────────────────────────────────────────────────
const WHATSAPP_MAX_LENGTH = 4096;

// ─── Web Formatter ───────────────────────────────────────────────────────────

/**
 * Format response for the web frontend. Returns JSON as-is.
 */
function formatForWeb(response) {
    const convId = response.conversationId || response.conversation_id;
    return {
        answer: response.answer,
        conversationId: convId,
        conversation_id: convId,
        actions: response.actions || [],
    };
}

// ─── WhatsApp Formatter ──────────────────────────────────────────────────────

/**
 * Convert markdown to WhatsApp text formatting and split long messages.
 * WhatsApp supports: *bold*, _italic_, ~strikethrough~, ```monospace```
 */
function formatForWhatsApp(response) {
    let text = response.answer;

    // Convert markdown headers to WhatsApp bold
    text = text.replace(/^###\s+(.+)$/gm, "*$1*");
    text = text.replace(/^##\s+(.+)$/gm, "*$1*");
    text = text.replace(/^#\s+(.+)$/gm, "*$1*");

    // Markdown bold **text** → WhatsApp bold *text*
    text = text.replace(/\*\*(.+?)\*\*/g, "*$1*");

    // Markdown italic (single underscore or asterisk)
    // _text_ is already WhatsApp italic format, so leave it
    // *text* is already handled as bold

    // Markdown code blocks ```code``` → keep as-is (WhatsApp supports this)
    // Inline code `text` → keep as-is

    // Markdown links [text](url) → text: url
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1: $2");

    // Markdown bullet points - item → • item
    text = text.replace(/^[-*]\s+/gm, "• ");
    text = text.replace(/^\s{2,}[-*]\s+/gm, "  ◦ ");

    // Split into chunks if too long
    const messages = splitText(text, WHATSAPP_MAX_LENGTH);

    // Convert actions to WhatsApp interactive buttons (max 3 buttons)
    const actions = response.actions || [];
    const buttons = actions
        .filter(a => a.type === "suggestion" || a.type === "button")
        .slice(0, 3)
        .map((a, i) => ({
            type: "reply",
            reply: {
                id: `btn_${i}_${a.value.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20)}`,
                title: a.label.substring(0, 20), // WhatsApp button title limit
            },
        }));

    return {
        messages: messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            // Only attach buttons to the last message
            if (isLast && buttons.length > 0) {
                return {
                    type: "interactive",
                    interactive: {
                        type: "button",
                        body: { text: msg },
                        action: { buttons },
                    },
                };
            }
            return { type: "text", text: { body: msg } };
        }),
        conversationId: response.conversationId,
    };
}

// ─── Slack Formatter ─────────────────────────────────────────────────────────

/**
 * Convert to Slack Block Kit format.
 * Slack uses mrkdwn: *bold*, _italic_, ~strikethrough~, `code`, ```code block```
 */
function formatForSlack(response) {
    let text = response.answer;

    // Markdown bold **text** → Slack bold *text*
    text = text.replace(/\*\*(.+?)\*\*/g, "*$1*");

    // Markdown headers → Slack bold on its own line
    text = text.replace(/^###\s+(.+)$/gm, "*$1*");
    text = text.replace(/^##\s+(.+)$/gm, "*$1*");
    text = text.replace(/^#\s+(.+)$/gm, "*$1*");

    // Markdown links [text](url) → Slack links <url|text>
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<$2|$1>");

    // WhatsApp-style emojis are fine in Slack too

    // Build blocks
    const blocks = [];

    // Split text into sections (Slack section text max is 3000 chars)
    const sections = splitText(text, 3000);
    for (const section of sections) {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: section,
            },
        });
    }

    // Add action buttons if present
    const actions = response.actions || [];
    if (actions.length > 0) {
        blocks.push({ type: "divider" });

        const elements = actions.map((a, i) => {
            const labelText = (a.label || "Action").substring(0, 75);
            const val = (a.value || "").substring(0, 2000);
            if (a.type === "link") {
                return {
                    type: "button",
                    text: { type: "plain_text", text: labelText },
                    url: a.value,
                    action_id: `link_${i}`,
                };
            }
            return {
                type: "button",
                text: { type: "plain_text", text: labelText },
                value: val,
                action_id: `action_${i}_${val.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20)}`,
            };
        });

        blocks.push({
            type: "actions",
            elements: elements.slice(0, 5), // Slack allows max 5 elements per actions block
        });
    }

    return {
        text: text.substring(0, 300) + (text.length > 300 ? "..." : ""), // Fallback text
        blocks,
        conversationId: response.conversationId,
    };
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Split text into chunks at natural boundaries (double newline, newline, or space).
 */
function splitText(text, maxLength) {
    if (text.length <= maxLength) return [text];

    const chunks = [];
    let remaining = text;

    while (remaining.length > maxLength) {
        // Try to split at a double newline
        let splitIdx = remaining.lastIndexOf("\n\n", maxLength);
        if (splitIdx <= 0 || splitIdx < maxLength * 0.3) {
            // Try single newline
            splitIdx = remaining.lastIndexOf("\n", maxLength);
        }
        if (splitIdx <= 0 || splitIdx < maxLength * 0.3) {
            // Try space
            splitIdx = remaining.lastIndexOf(" ", maxLength);
        }
        if (splitIdx <= 0) {
            // Force split
            splitIdx = maxLength;
        }

        chunks.push(remaining.substring(0, splitIdx).trim());
        remaining = remaining.substring(splitIdx).trim();
    }

    if (remaining.length > 0) {
        chunks.push(remaining);
    }

    return chunks;
}

module.exports = {
    formatForWeb,
    formatForWhatsApp,
    formatForSlack,
    splitText,
};
