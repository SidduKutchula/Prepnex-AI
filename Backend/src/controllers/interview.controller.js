
const mongoose = require("mongoose")
const aiService = require("../services/ai.service")
const aiWorker = require("../services/aiWorker.service")
const interviewReportModel = require("../models/interviewReport.model")
const resumeVersionModel = require("../models/resumeVersion.model")
const asyncHandler = require("../utils/asyncHandler")



const { PDFParse } = require('pdf-parse');

async function parseResumeController(req, res) {
    try {
        const { selfDescription } = req.body
        let resumeText = ""

        if (req.file && req.file.buffer) {
            try {
                const parser = new PDFParse({ data: req.file.buffer });
                const parsed = await parser.getText();
                console.log("PDF Parsed successfully. Text length:", parsed.text ? parsed.text.length : 0);
                resumeText = (parsed.text && parsed.text.trim()) ? parsed.text : "The candidate uploaded a resume, but no extractable text was found. Please generate a generalized interview strategy based on the target job description.";
            } catch (err) {
                console.error("PDF Parse error:", err);
                // Proceed with fallback resumeText instead of returning 400 or empty string
                resumeText = "The candidate uploaded a resume, but the text could not be extracted (possibly an image-based PDF or parsing error). Please generate a generalized interview strategy based on the target job description.";
            }
        } else if (req.file) {
            resumeText = "Resume file uploaded but could not be processed. Please generate a generalized interview strategy based on the target job description.";
        }
        
        console.log("Resume Text:", !!resumeText, "Self Description:", !!selfDescription);

        if (!resumeText && !selfDescription) {
            console.warn("Both resume and self-description are empty. Proceeding with just job description if available.");
        }

        res.status(200).json({
            message: "Resume processed.",
            resumeText,
            selfDescription
        })
    } catch (error) {
        return res.status(500).json({ message: "Failed to parse resume.", error: error.message });
    }
}

async function generateAtsGapsController(req, res) {
    try {
        const { resume, jobDescription } = req.body
        if (!resume || !jobDescription) return res.status(400).json({ success: false, message: "Missing resume or job description." })
        const result = await aiService.generateAtsAndGaps({ resume, jobDescription })
        res.status(200).json({ success: true, ...result })
    } catch (error) {
        return handleAiError(res, error)
    }
}

async function generateQuestionsController(req, res) {
    try {
        const { resume, jobDescription } = req.body
        if (!resume || !jobDescription) return res.status(400).json({ success: false, message: "Missing resume or job description." })
        const result = await aiService.generateQuestions({ resume, jobDescription })
        res.status(200).json({ success: true, ...result })
    } catch (error) {
        return handleAiError(res, error)
    }
}

async function generateRoadmapController(req, res) {
    try {
        const { resume, jobDescription, remainingDays, atsScore, skillGaps } = req.body
        if (!resume || !jobDescription) return res.status(400).json({ success: false, message: "Missing resume or job description." })
        const result = await aiService.generateRoadmap({ resume, jobDescription, remainingDays, atsScore, skillGaps })
        res.status(200).json({ success: true, ...result })
    } catch (error) {
        return handleAiError(res, error)
    }
}

async function generateResumeRewriteController(req, res) {
    try {
        const { resume, selfDescription, jobDescription } = req.body
        if (!resume || !jobDescription) return res.status(400).json({ success: false, message: "Missing resume or job description." })
        const result = await aiService.generateResumeRewrite({ resume, selfDescription, jobDescription })
        res.status(200).json({ success: true, ...result })
    } catch (error) {
        return handleAiError(res, error)
    }
}

async function startInterviewReportController(req, res) {
    try {
        const { jobDescription, resume, selfDescription, remainingDays } = req.body;
        
        if (!resume && !selfDescription) {
            return res.status(400).json({ success: false, message: "Missing resume or self description." });
        }
        if (!jobDescription) {
            return res.status(400).json({ success: false, message: "Missing job description." });
        }

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            jobDescription,
            resume: resume || "",
            selfDescription: selfDescription || "",
            remainingDays: remainingDays || 7,
            status: "processing",
            progress: {
                resumeParsed: true,
                atsGenerated: false,
                questionsGenerated: false,
                roadmapGenerated: false,
                rewriteGenerated: false,
                pdfGenerated: false
            }
        });

        // Start background processing
        aiWorker.startBackgroundGeneration(interviewReport._id, {
            jobDescription, resume: resume || selfDescription, selfDescription, remainingDays
        });

        res.status(201).json({
            success: true,
            message: "Interview report started successfully.",
            reportId: interviewReport._id
        });
    } catch (error) {
        console.error("Failed to start interview report:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
}

async function streamProgressController(req, res) {
    const { interviewId } = req.params;

    res.status(200).set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.flushHeaders();

    const sendEvent = (type, payload) => {
        res.write(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    try {
        const report = await interviewReportModel.findById(interviewId);
        if (!report) {
            sendEvent('error', { message: 'Report not found' });
            return res.end();
        }

        // Send initial state
        sendEvent('initial', { status: report.status, progress: report.progress, data: report });

        if (report.status === 'completed' || report.status === 'failed') {
            return res.end(); // Already finished
        }

        const listener = (data) => {
            sendEvent('progress', data);
            if (data.stage === 'complete') {
                aiWorker.removeListener(`progress:${interviewId}`, listener);
                res.end();
            }
        };

        aiWorker.on(`progress:${interviewId}`, listener);

        req.on('close', () => {
            aiWorker.removeListener(`progress:${interviewId}`, listener);
        });

    } catch (error) {
        console.error("Stream Error:", error);
        sendEvent('error', { message: error.message });
        res.end();
    }
}

async function saveInterviewReportController(req, res) {
    try {
        const { 
            jobDescription, 
            resume, 
            selfDescription, 
            remainingDays,
            atsData,
            questionsData,
            roadmapData,
            rewriteData
        } = req.body

        if (roadmapData && Array.isArray(roadmapData.preparationPlan)) {
            roadmapData.preparationPlan = roadmapData.preparationPlan.map((dayPlan, index) => {
                return {
                    day: typeof dayPlan.day === 'number' ? dayPlan.day : (index + 1),
                    focus: dayPlan.focus || `Day ${index + 1} Focus`,
                    tasks: Array.isArray(dayPlan.tasks) ? dayPlan.tasks.map(task => ({
                        title: task.title || "Untitled Task",
                        timeHours: typeof task.timeHours === 'number' ? task.timeHours : 1,
                        timeOfDay: ["Morning", "Afternoon", "Evening", "Night"].includes(task.timeOfDay) ? task.timeOfDay : "Morning",
                        difficulty: ["Easy", "Medium", "Hard"].includes(task.difficulty) ? task.difficulty : "Medium",
                        priority: ["High", "Medium", "Low"].includes(task.priority) ? task.priority : "Medium",
                        type: ["Learn", "Practice", "Project", "Revision", "Mock"].includes(task.type) ? task.type : "Learn",
                        status: "pending",
                        resources: Array.isArray(task.resources) ? task.resources.map(res => ({
                            title: res.title || "Resource",
                            url: res.url || "",
                            type: ["docs", "video", "practice", "article", "cheatsheet"].includes(res.type) ? res.type : "docs"
                        })) : []
                    })) : []
                }
            })
        }

        // Logging removed for cleaner console

        let interviewReport;
        try {
            interviewReport = await interviewReportModel.create({
                user: req.user.id,
                jobDescription,
                resume,
                selfDescription,
                remainingDays,
                ...atsData,
                ...questionsData,
                ...roadmapData,
                ...rewriteData
            })
        } catch (validationError) {
            console.error("MongoDB Validation Failed:", validationError);
            return res.status(400).json({ message: "Validation failed while saving report.", error: validationError.message });
        }

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (error) {
        console.error("Save Report Error:", error);
        return res.status(500).json({ message: "Failed to save interview report.", error: error.message });
    }
}

function handleAiError(res, error) {
    console.error("AI Error:", error.stack || error);
    const message = error.message || "";
    if (error.status === 429 || (error.response && error.response.status === 429) || message.includes("429") || message.includes("quota")) {
        return res.status(429).json({ success: false, message: "AI is currently handling too many requests. Please try again in a minute." });
    }
    if (error.status === 503 || (error.response && error.response.status === 503) || message.includes("503") || message.toLowerCase().includes("unavailable") || message.toLowerCase().includes("high demand")) {
        return res.status(503).json({ success: false, message: "AI models are currently experiencing high demand. Please try again in a few moments." });
    }
    return res.status(500).json({ success: false, message: "Failed to generate AI content.", error: error.message });
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        if (!mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(400).json({ success: false, message: "Invalid interview ID format." })
        }

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                success: false,
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            success: true,
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (error) {
        console.error("Error fetching report by ID:", error.stack || error);
        return res.status(500).json({ success: false, message: "Failed to fetch interview report.", error: error.message });
    }
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            success: true,
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (error) {
        console.error("Error fetching all reports:", error.stack || error);
        return res.status(500).json({ success: false, message: "Failed to fetch interview reports.", error: error.message });
    }
}


async function toggleBookmarkController(req, res) {
    try {
        const { interviewId } = req.params;
        const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });
        if (!report) return res.status(404).json({ success: false, message: "Report not found" });
        report.isBookmarked = !report.isBookmarked;
        await report.save();
        res.status(200).json({ success: true, isBookmarked: report.isBookmarked });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to toggle bookmark", error: error.message });
    }
}

async function deleteInterviewReportController(req, res) {
    try {
        const { interviewId } = req.params;
        const deleted = await interviewReportModel.findOneAndDelete({ _id: interviewId, user: req.user.id });
        if (!deleted) return res.status(404).json({ success: false, message: "Report not found" });
        res.status(200).json({ success: true, message: "Report deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete report", error: error.message });
    }
}

async function renameInterviewReportController(req, res) {
    try {
        const { interviewId } = req.params;
        const { title } = req.body;
        if (!title) return res.status(400).json({ success: false, message: "Title is required" });
        const report = await interviewReportModel.findOneAndUpdate({ _id: interviewId, user: req.user.id }, { title }, { new: true });
        if (!report) return res.status(404).json({ success: false, message: "Report not found" });
        res.status(200).json({ success: true, report });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to rename report", error: error.message });
    }
}

const RoadmapProgress = require('../models/roadmapProgress.model');
const Achievement = require('../models/achievement.model');

async function toggleTaskCompletionController(req, res) {
    try {
        const { interviewId, taskId } = req.params;
        const { completed, title, estimatedHours, difficulty } = req.body;
        
        const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });
        if (!report) return res.status(404).json({ success: false, message: "Report not found" });

        const status = completed ? 'completed' : 'pending';
        
        let reportUpdated = false;
        if (report.preparationPlan && report.preparationPlan.length > 0) {
            for (let item of report.preparationPlan) {
                if (item.topic && ((item._id && item._id.toString() === taskId) || item.topic === taskId)) {
                    item.status = status;
                    reportUpdated = true;
                    break;
                } else if (item.day && item.tasks) {
                    const nestedTask = item.tasks.find(t => (t._id && t._id.toString() === taskId) || t.title === taskId);
                    if (nestedTask) {
                        nestedTask.status = status;
                        reportUpdated = true;
                        break;
                    }
                }
            }
        }
        
        if (reportUpdated) {
            report.markModified('preparationPlan');
            await report.save();
        }

        const progress = await RoadmapProgress.findOneAndUpdate(
            { user: req.user.id, interviewReport: interviewId, taskId },
            { 
                status, 
                title: title || taskId,
                completedAt: completed ? new Date() : null,
                estimatedHours: estimatedHours || 0,
                difficulty: difficulty || 'Medium'
            },
            { upsert: true, new: true }
        );

        // Check for achievements based on total completed tasks for this user
        if (completed) {
            const completedCount = await RoadmapProgress.countDocuments({ user: req.user.id, status: 'completed' });
            
            const milestones = [1, 10, 50, 100];
            for (let milestone of milestones) {
                if (completedCount === milestone) {
                    await Achievement.findOneAndUpdate(
                        { user: req.user.id, achievementType: `${milestone}_tasks` },
                        { unlockedAt: new Date() },
                        { upsert: true }
                    );
                }
            }
        }

        res.status(200).json({ success: true, task: progress });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to toggle task", error: error.message });
    }
}

async function syncProgressController(req, res) {
    try {
        const { updates } = req.body; // Array of { interviewId, taskId, completed, ... }
        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ success: false, message: "Invalid updates format" });
        }

        const results = [];
        const reportsToUpdate = new Set();
        const reportDocs = {};

        for (let update of updates) {
            const status = update.completed ? 'completed' : 'pending';
            
            // Sync with interview report model
            if (!reportDocs[update.interviewId]) {
                const doc = await interviewReportModel.findOne({ _id: update.interviewId, user: req.user.id });
                if (doc) reportDocs[update.interviewId] = doc;
            }
            
            const report = reportDocs[update.interviewId];
            if (report && report.preparationPlan) {
                for (let item of report.preparationPlan) {
                    if (item.topic && ((item._id && item._id.toString() === update.taskId) || item.topic === update.taskId)) {
                        item.status = status;
                        reportsToUpdate.add(update.interviewId);
                        break;
                    } else if (item.day && item.tasks) {
                        const nestedTask = item.tasks.find(t => (t._id && t._id.toString() === update.taskId) || t.title === update.taskId);
                        if (nestedTask) {
                            nestedTask.status = status;
                            reportsToUpdate.add(update.interviewId);
                            break;
                        }
                    }
                }
            }

            const progress = await RoadmapProgress.findOneAndUpdate(
                { user: req.user.id, interviewReport: update.interviewId, taskId: update.taskId },
                { 
                    status, 
                    title: update.title || update.taskId,
                    completedAt: update.completed ? new Date() : null,
                    estimatedHours: update.estimatedHours || 0,
                    difficulty: update.difficulty || 'Medium'
                },
                { upsert: true, new: true }
            );
            results.push(progress);
        }

        // Save all updated reports
        for (let interviewId of reportsToUpdate) {
            reportDocs[interviewId].markModified('preparationPlan');
            await reportDocs[interviewId].save();
        }

        res.status(200).json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to sync progress", error: error.message });
    }
}

async function getDashboardAnalyticsController(req, res) {
    try {
        const progressList = await RoadmapProgress.find({ user: req.user.id, status: 'completed' });
        const achievements = await Achievement.find({ user: req.user.id }).sort({ unlockedAt: -1 });
        
        const totalCompleted = progressList.length;
        
        res.status(200).json({ 
            success: true, 
            analytics: {
                totalCompletedTasks: totalCompleted,
                achievements
            },
            progressList
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch analytics", error: error.message });
    }
}

async function resetRoadmapProgressController(req, res) {
    try {
        const { interviewId } = req.params;
        
        // 1. Delete all RoadmapProgress documents for this user and interviewId
        await RoadmapProgress.deleteMany({ user: req.user.id, interviewReport: interviewId });
        
        // 2. Reset the status in the InterviewReport itself
        const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });
        if (report && report.preparationPlan) {
            report.preparationPlan.forEach(item => {
                if (item.topic) {
                    item.status = 'pending';
                } else if (item.day && item.tasks) {
                    item.tasks.forEach(t => t.status = 'pending');
                }
            });
            report.markModified('preparationPlan');
            await report.save();
        }
        
        res.status(200).json({ success: true, message: "Roadmap progress reset successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to reset roadmap progress", error: error.message });
    }
}

module.exports = {
    parseResumeController: asyncHandler(parseResumeController),
    generateAtsGapsController: asyncHandler(generateAtsGapsController),
    generateQuestionsController: asyncHandler(generateQuestionsController),
    generateRoadmapController: asyncHandler(generateRoadmapController),
    generateResumeRewriteController: asyncHandler(generateResumeRewriteController),
    startInterviewReportController: asyncHandler(startInterviewReportController),
    streamProgressController: asyncHandler(streamProgressController),
    saveInterviewReportController: asyncHandler(saveInterviewReportController),
    getInterviewReportByIdController: asyncHandler(getInterviewReportByIdController),
    getAllInterviewReportsController: asyncHandler(getAllInterviewReportsController),
    toggleBookmarkController: asyncHandler(toggleBookmarkController),
    deleteInterviewReportController: asyncHandler(deleteInterviewReportController),
    renameInterviewReportController: asyncHandler(renameInterviewReportController),
    toggleTaskCompletionController: asyncHandler(toggleTaskCompletionController),
    syncProgressController: asyncHandler(syncProgressController),
    getDashboardAnalyticsController: asyncHandler(getDashboardAnalyticsController),
    resetRoadmapProgressController: asyncHandler(resetRoadmapProgressController)
}