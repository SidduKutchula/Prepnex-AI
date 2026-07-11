const EventEmitter = require('events');
const interviewReportModel = require('../models/interviewReport.model');
const aiService = require('./ai.service');

class AIWorkerService extends EventEmitter {
    constructor() {
        super();
        this.activeJobs = new Map();
    }

    async startBackgroundGeneration(reportId, params) {
        const jobId = reportId.toString();
        if (this.activeJobs.has(jobId)) {
            console.log(`[OK] Duplicate generation request prevented for reportId=${reportId}`);
            return;
        }
        this.activeJobs.set(jobId, true);

        this.processJob(reportId, params)
            .catch(err => {
                console.error(`[FAILED] Fatal error in job ${reportId}:`, err);
            })
            .finally(() => {
                this.activeJobs.delete(jobId);
            });
    }

    async processJob(reportId, { resume, jobDescription, selfDescription, remainingDays }) {
        const pipelineStart = Date.now();
        const jobId = reportId.toString();
        console.log(`[START] Request received - starting background generation for reportId=${reportId}`);
        const emitProgress = (stage, data) => this.emit(`progress:${reportId}`, { stage, ...data });

        // Duration tracking metrics
        const timings = {
            ats: 0,
            questions: 0,
            roadmap: 0,
            rewrite: 0,
            total: 0
        };

        try {
            console.log("[START] Bootstrapping Questions and Rewrite (Concurrent with ATS)");
            const questionsPromise = runQuestions();
            const rewritePromise = runRewrite();

            // Stage 1: ATS Analysis
            console.log("[START] Stage 1 - ATS Generation");
            emitProgress('ats', { status: 'processing' });
            
            const atsTimer = setInterval(() => {
                console.log("STAGE TIME: Stage 1 (ATS Analysis) is taking more than 5 seconds...");
            }, 5000);
            
            let atsData = {};
            const atsStart = Date.now();
            try {
                atsData = await aiService.generateAtsAndGaps({ resume, jobDescription });
                timings.ats = ((Date.now() - atsStart) / 1000).toFixed(1);
                console.log(`[OK] Stage 1 - ATS Generation complete in ${timings.ats} sec`);

                console.log("[START] Saving ATS to Mongo");
                const updateRes = await interviewReportModel.updateOne(
                    { _id: reportId },
                    {
                        $set: {
                            atsScore: atsData.atsScore || 0,
                            improvementSummary: atsData.improvementSummary || "",
                            recruiterFeedback: atsData.recruiterFeedback || "",
                            addedKeywords: atsData.addedKeywords || [],
                            missingKeywords: atsData.missingKeywords || [],
                            skillGaps: atsData.skillGaps || [],
                            matchScore: atsData.matchScore || 0,
                            'progress.atsGenerated': true
                        }
                    },
                    { runValidators: true }
                );
                console.log("[OK] Mongo Saved (ATS)");
                emitProgress('ats', { status: 'completed', data: atsData });
            } catch (err) {
                console.error(`[FAILED] Stage 1 - ATS Generation failed for ${reportId}:`, err);
                if (err.name === 'ValidationError') {
                    console.error("[MONGO VALIDATION ERROR] Collection: InterviewReport");
                    for (const field in err.errors) {
                        const error = err.errors[field];
                        console.error(`  - Field: ${field}, Expected: ${error.properties?.type || 'valid type'}, Received: ${error.value}`);
                    }
                }
                
                await interviewReportModel.updateOne(
                    { _id: reportId },
                    { $set: { 'errorDetails.ats': err.message } }
                );
                emitProgress('ats', { status: 'failed', error: err.message });
            } finally {
                clearInterval(atsTimer);
            }

            // Stage 2, 3, and 4 run independently (Module Independence)
            async function runQuestions() {
                console.log("[START] Stage 2 - Questions Generation");
                emitProgress('questions', { status: 'processing' });
                
                const questionsTimer = setInterval(() => {
                    console.log("STAGE TIME: Stage 2 (Questions) is taking more than 5 seconds...");
                }, 5000);

                const questionsStart = Date.now();
                try {
                    const questionsData = await aiService.generateQuestions({ resume, jobDescription });
                    timings.questions = ((Date.now() - questionsStart) / 1000).toFixed(1);
                    console.log(`[OK] Stage 2 - Questions Generation complete in ${timings.questions} sec`);

                    console.log("[START] Saving Questions to Mongo");
                    await interviewReportModel.updateOne(
                        { _id: reportId },
                        {
                            $set: {
                                technicalQuestions: questionsData.technicalQuestions || [],
                                behavioralQuestions: questionsData.behavioralQuestions || [],
                                'progress.questionsGenerated': true
                            }
                        },
                        { runValidators: true }
                    );
                    console.log("[OK] Mongo Saved (Questions)");
                    emitProgress('questions', { status: 'completed' });
                } catch (err) {
                    console.error(`[FAILED] Stage 2 - Questions failed for ${reportId}:`, err);
                    if (err.name === 'ValidationError') {
                        console.error("[MONGO VALIDATION ERROR] Collection: InterviewReport");
                        for (const field in err.errors) {
                            const error = err.errors[field];
                            console.error(`  - Field: ${field}, Expected: ${error.properties?.type || 'valid type'}, Received: ${error.value}`);
                        }
                    }
                    
                    await interviewReportModel.updateOne(
                        { _id: reportId },
                        { $set: { 'errorDetails.questions': err.message } }
                    );
                    emitProgress('questions', { status: 'failed', error: err.message });
                } finally {
                    clearInterval(questionsTimer);
                }
            };

            async function runRoadmap() {
                console.log("[START] Stage 3 - Roadmap Generation");
                emitProgress('roadmap', { status: 'processing' });

                const roadmapTimer = setInterval(() => {
                    console.log("STAGE TIME: Stage 3 (Roadmap) is taking more than 5 seconds...");
                }, 5000);

                const roadmapStart = Date.now();
                try {
                    const roadmapData = await aiService.generateRoadmap({ 
                        resume, 
                        jobDescription, 
                        remainingDays, 
                        atsScore: atsData.atsScore, 
                        skillGaps: atsData.skillGaps 
                    });
                    timings.roadmap = ((Date.now() - roadmapStart) / 1000).toFixed(1);
                    console.log(`[OK] Stage 3 - Roadmap Generation complete in ${timings.roadmap} sec`);

                    const prepPlan = Array.isArray(roadmapData.preparationPlan) ? roadmapData.preparationPlan.map((dayPlan, index) => ({
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
                    })) : [];

                    console.log("[START] Saving Roadmap to Mongo");
                    await interviewReportModel.updateOne(
                        { _id: reportId },
                        {
                            $set: {
                                preparationPlan: prepPlan,
                                'progress.roadmapGenerated': true
                            }
                        },
                        { runValidators: true }
                    );
                    console.log("[OK] Mongo Saved (Roadmap)");
                    emitProgress('roadmap', { status: 'completed' });
                } catch (err) {
                    console.error(`[FAILED] Stage 3 - Roadmap failed for ${reportId}:`, err);
                    if (err.name === 'ValidationError') {
                        console.error("[MONGO VALIDATION ERROR] Collection: InterviewReport");
                        for (const field in err.errors) {
                            const error = err.errors[field];
                            console.error(`  - Field: ${field}, Expected: ${error.properties?.type || 'valid type'}, Received: ${error.value}`);
                        }
                    }
                    
                    await interviewReportModel.updateOne(
                        { _id: reportId },
                        { $set: { 'errorDetails.roadmap': err.message } }
                    );
                    emitProgress('roadmap', { status: 'failed', error: err.message });
                } finally {
                    clearInterval(roadmapTimer);
                }
            };

            async function runRewrite() {
                console.log("[START] Stage 4 - Resume Rewrite Generation");
                emitProgress('rewrite', { status: 'processing' });

                const rewriteTimer = setInterval(() => {
                    console.log("STAGE TIME: Stage 4 (Resume Rewrite) is taking more than 5 seconds...");
                }, 5000);

                const rewriteStart = Date.now();
                try {
                    const rewriteData = await aiService.generateResumeRewrite({ resume, jobDescription });
                    timings.rewrite = ((Date.now() - rewriteStart) / 1000).toFixed(1);
                    console.log(`[OK] Stage 4 - Resume Rewrite complete in ${timings.rewrite} sec`);

                    console.log("[START] Saving Resume Rewrite to Mongo");
                    await interviewReportModel.updateOne(
                        { _id: reportId },
                        {
                            $set: {
                                tailoredResume: rewriteData.tailoredResume || "",
                                coverLetter: rewriteData.coverLetter || "",
                                'progress.rewriteGenerated': true
                            }
                        },
                        { runValidators: true }
                    );
                    console.log("[OK] Mongo Saved (Resume Rewrite)");
                    emitProgress('rewrite', { status: 'completed' });
                } catch (err) {
                    console.error(`[FAILED] Stage 4 - Resume Rewrite failed for ${reportId}:`, err);
                    if (err.name === 'ValidationError') {
                        console.error("[MONGO VALIDATION ERROR] Collection: InterviewReport");
                        for (const field in err.errors) {
                            const error = err.errors[field];
                            console.error(`  - Field: ${field}, Expected: ${error.properties?.type || 'valid type'}, Received: ${error.value}`);
                        }
                    }
                    
                    await interviewReportModel.updateOne(
                        { _id: reportId },
                        { $set: { 'errorDetails.rewrite': err.message } }
                    );
                    emitProgress('rewrite', { status: 'failed', error: err.message });
                } finally {
                    clearInterval(rewriteTimer);
                }
            };

            console.log("[START] Executing Stage 3 (Roadmap) since ATS is complete");
            const roadmapPromise = runRoadmap();

            console.log("[WAITING] Waiting for Questions, Roadmap, and Rewrite to finish");
            await Promise.allSettled([questionsPromise, roadmapPromise, rewritePromise]);
            console.log("[OK] Stages 2, 3, and 4 Concurrent execution complete");

            // Finalize status
            const report = await interviewReportModel.findById(reportId);
            const { atsGenerated, questionsGenerated, roadmapGenerated, rewriteGenerated } = report.progress || {};
            
            let successfulStages = 0;
            const failedStageNames = [];
            
            if (atsGenerated) successfulStages++; else failedStageNames.push("ATS Analysis");
            if (questionsGenerated) successfulStages++; else failedStageNames.push("Questions");
            if (roadmapGenerated) successfulStages++; else failedStageNames.push("Roadmap");
            if (rewriteGenerated) successfulStages++; else failedStageNames.push("Resume Rewrite");

            let finalStatus = "completed";
            let failureReason = null;

            if (successfulStages === 0) {
                finalStatus = "failed";
                failureReason = "All AI generation stages failed. Please check the logs or try again later.";
            } else if (successfulStages < 4) {
                finalStatus = "partial";
                failureReason = `Partial generation: The following stages failed: ${failedStageNames.join(", ")}`;
            }

            await interviewReportModel.updateOne(
                { _id: reportId },
                { $set: { status: finalStatus, failureReason } }
            );

            timings.total = ((Date.now() - pipelineStart) / 1000).toFixed(1);

            console.log("\n==================================================");
            console.log("INTERVIEW REPORT GENERATION PERFORMANCE METRICS");
            console.log("==================================================");
            console.log(`ATS: ${timings.ats} sec`);
            console.log(`Questions: ${timings.questions} sec`);
            console.log(`Roadmap: ${timings.roadmap} sec`);
            console.log(`Resume Rewrite: ${timings.rewrite} sec`);
            console.log(`Total Time: ${timings.total} sec`);
            console.log(`Final Status: ${finalStatus}`);
            console.log("==================================================\n");

            console.log("[SUCCESS] Generation process complete!");
            emitProgress('complete', { status: finalStatus });

        } catch (error) {
            console.error(`[FAILED] Overall pipeline failed for ${reportId}:`, error);
            await interviewReportModel.updateOne(
                { _id: reportId },
                { $set: { status: "failed", 'errorDetails.pipeline': error.message } }
            );
            emitProgress('complete', { status: 'failed', error: error.message });
        } finally {
            this.activeJobs.delete(jobId);
        }
    }
}

// Export a singleton instance
module.exports = new AIWorkerService();
