const mongoose = require('mongoose');

const autosaveStateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true
    },
    jobDescription: {
        type: String,
        default: ""
    },
    selfDescription: {
        type: String,
        default: ""
    },
    fileName: {
        type: String,
        default: ""
    },
    resumeText: {
        type: String,
        default: ""
    },
    remainingDays: {
        type: Number,
        default: 7
    },
    activeInterviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("AutosaveState", autosaveStateSchema);
