/**
 * WhatsApp Client (Meta Cloud API)
 * 
 * Handles sending messages and downloading media via Meta's Graph API.
 * Uses native fetch (Node.js 18+).
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

class WhatsAppClient {
    constructor() {
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    }

    /**
     * Check if WhatsApp integration credentials are configured.
     */
    isConfigured() {
        return !!(this.accessToken && this.phoneNumberId);
    }

    /**
     * Assert configuration is present before making API calls.
     */
    _assertConfigured() {
        if (!this.accessToken || !this.phoneNumberId) {
            throw new Error(
                "[WhatsAppClient] WhatsApp credentials are missing. " +
                "Please configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID."
            );
        }
    }

    /**
     * Send a prepared message payload to a WhatsApp user.
     * 
     * @param {string} to - Recipient's phone number with country code (no '+' or other symbols)
     * @param {Object} messagePayload - The message object (type: 'text' or 'interactive')
     */
    async sendMessage(to, messagePayload) {
        this._assertConfigured();

        const url = `${GRAPH_BASE_URL}/${this.phoneNumberId}/messages`;
        const body = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            ...messagePayload,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error?.message || `HTTP ${response.status}`;
            console.error(`[WhatsAppClient] Send message failed to ${to}:`, data);
            throw new Error(`WhatsApp API error: ${errorMsg}`);
        }

        return data;
    }

    /**
     * Convenience method to send a simple text message.
     */
    async sendTextMessage(to, body) {
        return this.sendMessage(to, {
            type: "text",
            text: { body },
        });
    }

    /**
     * Download media from Meta Graph API given a media ID.
     * 
     * Step 1: Query Graph API to get the temporary media download URL.
     * Step 2: Download the binary media buffer using the access token.
     * 
     * @param {string} mediaId - The media ID from the incoming webhook
     * @returns {Promise<{ buffer: Buffer, mimeType: string, fileName?: string }>}
     */
    async downloadMedia(mediaId) {
        this._assertConfigured();

        // 1. Get media URL
        const mediaUrlEndpoint = `${GRAPH_BASE_URL}/${mediaId}`;
        const metaRes = await fetch(mediaUrlEndpoint, {
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
            },
        });

        if (!metaRes.ok) {
            const err = await metaRes.text();
            throw new Error(`Failed to retrieve media URL for ID ${mediaId}: ${err}`);
        }

        const mediaMetadata = await metaRes.json();
        const downloadUrl = mediaMetadata.url;
        const mimeType = mediaMetadata.mime_type;

        if (!downloadUrl) {
            throw new Error(`No download URL returned for media ID ${mediaId}`);
        }

        // 2. Download the actual binary file
        const fileRes = await fetch(downloadUrl, {
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
            },
        });

        if (!fileRes.ok) {
            throw new Error(`Failed to download media file from ${downloadUrl}: HTTP ${fileRes.status}`);
        }

        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return {
            buffer,
            mimeType,
            fileName: mediaMetadata.filename || "document.pdf",
        };
    }

    /**
     * Upload media to Meta Graph API.
     * 
     * @param {Object} options
     * @param {Buffer} options.buffer - Raw binary buffer
     * @param {string} options.mimeType - MIME type (e.g. application/pdf)
     * @param {string} [options.filename] - File name
     * @returns {Promise<string>} Media ID
     */
    async uploadMedia({ buffer, mimeType, filename }) {
        this._assertConfigured();

        const url = `${GRAPH_BASE_URL}/${this.phoneNumberId}/media`;
        const formData = new FormData();
        const blob = new Blob([buffer], { type: mimeType || "application/pdf" });
        formData.append("file", blob, filename || "resume.pdf");
        formData.append("messaging_product", "whatsapp");
        formData.append("type", mimeType || "application/pdf");

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok || !data.id) {
            throw new Error(`WhatsApp media upload failed: ${data.error?.message || response.statusText}`);
        }

        return data.id;
    }

    /**
     * Send a document message (e.g. Resume PDF) to a WhatsApp user.
     * 
     * @param {Object} options
     * @param {string} options.to - Recipient phone number
     * @param {string} [options.mediaId] - Media ID from uploadMedia
     * @param {string} [options.link] - Public URL to the PDF
     * @param {string} [options.filename] - Document file name
     * @param {string} [options.caption] - Accompanying caption
     */
    async sendDocumentMessage({ to, mediaId, link, filename, caption }) {
        this._assertConfigured();

        const documentPayload = {
            filename: filename || "resume.pdf",
            caption: caption || "Here is your generated resume.",
        };

        if (mediaId) {
            documentPayload.id = mediaId;
        } else if (link) {
            documentPayload.link = link;
        } else {
            throw new Error("Either mediaId or link must be provided to send a document message.");
        }

        return this.sendMessage(to, {
            type: "document",
            document: documentPayload,
        });
    }

    /**
     * Mark an incoming message as read (shows blue double checkmark).
     */
    async markAsRead(messageId) {
        if (!this.isConfigured()) return;

        try {
            const url = `${GRAPH_BASE_URL}/${this.phoneNumberId}/messages`;
            await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    status: "read",
                    message_id: messageId,
                }),
            });
        } catch (err) {
            // Non-critical, ignore read-receipt failures
            console.warn("[WhatsAppClient] Failed to mark message as read:", err.message);
        }
    }
}

module.exports = new WhatsAppClient();
