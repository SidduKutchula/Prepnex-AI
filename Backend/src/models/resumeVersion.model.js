const mongoose = require('mongoose');

const resumeVersionSchema = new mongoose.Schema({
    interviewReportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewReport',
        required: true
    },
    versionNumber: {
        type: Number,
        required: true
    },
    htmlContent: {
        type: String,
        required: true
    },
    atsScore: {
        type: Number,
        default: 0
    },
    addedKeywords: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ResumeVersion', resumeVersionSchema);
