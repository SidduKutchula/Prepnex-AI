const express = require("express");
const router = express.Router();
const whatsappController = require("./whatsapp.controller");
const { verifyWhatsAppSignature } = require("../webhookAuth.middleware");

// Meta webhook verification handshake (GET)
router.get("/", whatsappController.verifyWebhook);

// Incoming message webhook (POST) — verified with X-Hub-Signature-256
router.post("/", verifyWhatsAppSignature, whatsappController.handleWebhook);

module.exports = router;
