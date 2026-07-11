const mongoose = require('mongoose');

const resumeVersionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true
    },
    fileName: {
        type: String,
        required: true
    },
    extractedText: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        default: 0
    },
    lastUsedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("ResumeVersion", resumeVersionSchema);
