const mongoose = require('mongoose');


const technicalQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [ true, "Technical question is required" ]
    },
    intention: {
        type: String,
        required: [ true, "Intention is required" ]
    },
    answer: {
        type: String,
        required: [ true, "Answer is required" ]
    }
}, {
    _id: false
})

const behavioralQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [ true, "Technical question is required" ]
    },
    intention: {
        type: String,
        required: [ true, "Intention is required" ]
    },
    answer: {
        type: String,
        required: [ true, "Answer is required" ]
    }
}, {
    _id: false
})

const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [ true, "Skill is required" ]
    },
    severity: {
        type: String,
        enum: [ "low", "medium", "high" ],
        required: [ true, "Severity is required" ]
    }
}, {
    _id: false
})

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: [true, "Resource title is required"] },
    url: { type: String, required: [true, "Resource URL is required"] },
    type: { type: String, required: [true, "Resource type is required"] } // docs, video, practice, article, cheatsheet
}, { _id: false });

const taskSchema = new mongoose.Schema({
    title: { type: String, required: [true, "Task title is required"] },
    timeHours: { type: Number, required: [true, "Estimated time is required"] },
    timeOfDay: { type: String, required: [true, "Time of day is required"] }, // Morning, Afternoon, Evening, Night
    difficulty: { type: String, required: [true, "Difficulty is required"] }, // Easy, Medium, Hard
    priority: { type: String, required: [true, "Priority is required"] }, // High, Medium, Low
    type: { type: String, required: [true, "Task type is required"] }, // Learn, Practice, Project, Revision, Mock
    status: { type: String, enum: ["pending", "completed", "skipped"], default: "pending" },
    resources: [resourceSchema]
});

const preparationPlanSchema = new mongoose.Schema({
    day: { type: Number, required: true },
    focus: { type: String, required: true },
    tasks: [taskSchema]
});

const interviewReportSchema = new mongoose.Schema({
    jobDescription: {
        type: String,
        required: [ true, "Job description is required" ]
    },
    resume: {
        type: String,
    },
    selfDescription: {
        type: String,
    },
    interviewDate: {
        type: Date,
    },
    dailyStreak: {
        type: Number,
        default: 0
    },
    xp: {
        type: Number,
        default: 0
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    technicalQuestions: [ technicalQuestionSchema ],
    behavioralQuestions: [ behavioralQuestionSchema ],
    skillGaps: [ skillGapSchema ],
    preparationPlan: [ preparationPlanSchema ],
    // NEW ATS RESUME REWRITER FIELDS
    atsScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    missingKeywords: [ { type: String } ],
    addedKeywords: [ { type: String } ],
    improvementSummary: {
        type: String
    },
    recruiterFeedback: {
        type: String
    },
    rewrittenResumeHtml: {
        type: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    title: {
        type: String,
        default: "Software Engineer" // Optional default so it doesn't fail on initial creation
    },
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "partial"],
        default: "pending"
    },
    failureReason: {
        type: String,
        default: null
    },
    progress: {
        resumeParsed: { type: Boolean, default: false },
        atsGenerated: { type: Boolean, default: false },
        questionsGenerated: { type: Boolean, default: false },
        roadmapGenerated: { type: Boolean, default: false },
        rewriteGenerated: { type: Boolean, default: false },
        pdfGenerated: { type: Boolean, default: false }
    },
    errorDetails: {
        type: Object,
        default: {}
    },
    version: {
        type: Number,
        default: 1
    },
    parentReportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport"
    },
    notes: {
        type: String,
        default: ""
    },
    company: {
        type: String,
        default: "Unknown Company"
    },
    readinessScore: {
        type: Number,
        default: 0
    },

    timeline: [{
        event: { type: String },
        date: { type: Date, default: Date.now }
    }],
    favorite: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})


const interviewReportModel = mongoose.model("InterviewReport", interviewReportSchema);

module.exports = interviewReportModel;  