/**
 * Slack Client (Web API)
 * 
 * Handles calling Slack's Web API:
 * - chat.postMessage (sending messages & Block Kit)
 * - users.info (fetching user profile)
 * - authenticated file download (Slack private files)
 */

const SLACK_API_BASE = "https://slack.com/api";

class SlackClient {
    constructor() {
        this.botToken = process.env.SLACK_BOT_TOKEN;
    }

    /**
     * Check if Slack integration credentials are configured.
     */
    isConfigured() {
        return !!this.botToken;
    }

    /**
     * Assert token is present before making Slack API calls.
     */
    _assertConfigured() {
        if (!this.botToken) {
            throw new Error(
                "[SlackClient] SLACK_BOT_TOKEN is not configured. " +
                "Please configure SLACK_BOT_TOKEN to send messages to Slack."
            );
        }
    }

    /**
     * Post a message to a Slack channel or DM.
     * 
     * @param {Object} options
     * @param {string} options.channel - Channel ID or User ID (for DM)
     * @param {string} options.text - Fallback text
     * @param {Array} [options.blocks] - Block Kit blocks
     * @param {string} [options.thread_ts] - Thread timestamp for threaded replies
     */
    async postMessage({ channel, text, blocks, thread_ts }) {
        this._assertConfigured();

        const body = {
            channel,
            text: text || "PrepNex AI Response",
        };

        if (blocks && blocks.length > 0) {
            body.blocks = blocks;
        }

        if (thread_ts) {
            body.thread_ts = thread_ts;
        }

        const response = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.botToken}`,
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!data.ok) {
            console.error(`[SlackClient] chat.postMessage failed for channel ${channel}:`, data);
            throw new Error(`Slack API error: ${data.error || "Unknown error"}`);
        }

        return data;
    }

    /**
     * Fetch profile information for a Slack user.
     * 
     * @param {string} userId - Slack user ID (e.g. U12345678)
     */
    async getUserInfo(userId) {
        if (!this.isConfigured()) return null;

        try {
            const response = await fetch(`${SLACK_API_BASE}/users.info?user=${encodeURIComponent(userId)}`, {
                headers: {
                    "Authorization": `Bearer ${this.botToken}`,
                },
            });

            const data = await response.json();
            if (!data.ok) {
                console.warn(`[SlackClient] Failed to get user info for ${userId}:`, data.error);
                return null;
            }

            return {
                displayName: data.user?.profile?.display_name || data.user?.profile?.real_name || data.user?.name,
                email: data.user?.profile?.email || null,
            };
        } catch (err) {
            console.warn(`[SlackClient] Error querying user info for ${userId}:`, err.message);
            return null;
        }
    }

    /**
     * Download a private file from Slack.
     * Slack file URLs require the bot token in the Authorization header.
     * 
     * @param {string} urlPrivate - The file's url_private from the Slack event
     */
    async downloadFile(urlPrivate) {
        this._assertConfigured();

        // Follow redirect manually because Slack often redirects to Amazon S3 signed URLs,
        // and forwarding the Slack Authorization Bearer header to AWS S3 causes S3 to reject with 400.
        let response = await fetch(urlPrivate, {
            headers: {
                "Authorization": `Bearer ${this.botToken}`,
            },
            redirect: "manual",
        });

        if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
            const redirectUrl = response.headers.get("location");
            response = await fetch(redirectUrl);
        }

        if (!response.ok) {
            throw new Error(`Failed to download Slack file from ${urlPrivate}: HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    /**
     * Upload and share a file (e.g. PDF Resume) in a Slack channel or thread.
     * Uses the modern Slack files.getUploadURLExternal API.
     * 
     * @param {Object} options
     * @param {string} options.channel - Channel ID or User ID (for DM)
     * @param {string} [options.thread_ts] - Thread timestamp
     * @param {Buffer} options.buffer - File buffer
     * @param {string} [options.filename] - File name
     * @param {string} [options.title] - Title displayed in Slack
     * @param {string} [options.initial_comment] - Comment accompanying file
     */
    async uploadFile({ channel, thread_ts, buffer, filename = "resume.pdf", title = "PrepNex ATS Resume", initial_comment }) {
        this._assertConfigured();

        // 1. Request an upload URL from Slack
        const getUrlEndpoint = `${SLACK_API_BASE}/files.getUploadURLExternal?filename=${encodeURIComponent(filename)}&length=${buffer.length}`;
        const urlRes = await fetch(getUrlEndpoint, {
            headers: {
                "Authorization": `Bearer ${this.botToken}`,
            },
        });
        const urlData = await urlRes.json();
        if (!urlData.ok || !urlData.upload_url) {
            console.error("[SlackClient] getUploadURLExternal failed:", urlData);
            throw new Error(`Slack file upload URL error: ${urlData.error || "Unknown"}`);
        }

        // 2. Upload file to Slack's external upload URL
        const uploadRes = await fetch(urlData.upload_url, {
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream",
            },
            body: buffer,
        });
        if (!uploadRes.ok) {
            throw new Error(`Slack binary upload failed: HTTP ${uploadRes.status}`);
        }

        // 3. Complete the upload and share to the channel/thread
        const completeBody = {
            files: [
                {
                    id: urlData.file_id,
                    title,
                },
            ],
            channel_id: channel,
            initial_comment: initial_comment || "Here is your generated ATS resume!",
        };
        if (thread_ts) {
            completeBody.thread_ts = thread_ts;
        }

        const completeRes = await fetch(`${SLACK_API_BASE}/files.completeUploadExternal`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.botToken}`,
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify(completeBody),
        });

        const completeData = await completeRes.json();
        if (!completeData.ok) {
            console.error("[SlackClient] completeUploadExternal failed:", completeData);
            throw new Error(`Slack complete upload error: ${completeData.error || "Unknown"}`);
        }

        return completeData;
    }
}

module.exports = new SlackClient();
