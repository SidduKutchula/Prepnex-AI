/**
 * Standalone entrypoint for Slack Socket Mode Bot.
 * 
 * Note: The bot now boots automatically inside `server.js` when you run `npm run dev`!
 * Running this standalone script is optional and only needed if you specifically want
 * a decoupled standalone process.
 */

require("dotenv").config();
const { startSlackSocketBot } = require("./src/channels/slack/slack.socket");
const connectToDB = require("./src/config/database");

(async () => {
    try {
        await connectToDB();
        await startSlackSocketBot();
    } catch (err) {
        console.error("[SlackBot Standalone] Boot failed:", err);
        process.exit(1);
    }
})();
