const express = require("express");
const router = express.Router();
const slackController = require("./slack.controller");
const { verifySlackSignature } = require("../webhookAuth.middleware");

// Slack Webhook Endpoint (POST /webhooks/slack)
// Handles Events API, interactive components, and slash commands.
// Validates signature with SLACK_SIGNING_SECRET.
router.post("/", verifySlackSignature, slackController.handleWebhook);

module.exports = router;
