const RoadmapProgress = require('../models/roadmapProgress.model');
const interviewReportModel = require('../models/interviewReport.model');

async function getProgress(req, res) {
    try {
        const { reportId } = req.params;
        const userId = req.user?.id || req.user?._id;

        const records = await RoadmapProgress.find({ user: userId, interviewReport: reportId, status: 'completed' });
        const completedTaskIds = records.map((r) => r.taskId);

        console.log(`[Roadmap:GetProgress] userId=${userId} reportId=${reportId} completed=${completedTaskIds.length}`);
        return res.status(200).json({ success: true, completedTaskIds });
    } catch (err) {
        console.error('[Roadmap:GetProgress] FAILED:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

async function toggleTask(req, res) {
    try {
        const { reportId, taskId } = req.params;
        const { completed } = req.body;
        const userId = req.user?.id || req.user?._id;
        const status = completed ? 'completed' : 'pending';

        await RoadmapProgress.findOneAndUpdate(
            { user: userId, interviewReport: reportId, taskId },
            { status, completedAt: completed ? new Date() : null },
            { upsert: true, new: true }
        );

        // Keep interviewReport preparationPlan in sync
        const report = await interviewReportModel.findOne({ _id: reportId, user: userId });
        if (report && report.preparationPlan) {
            let updated = false;
            for (let item of report.preparationPlan) {
                if (item.tasks) {
                    const task = item.tasks.find(t => (t._id && t._id.toString() === taskId) || t.title === taskId);
                    if (task) {
                        task.status = status;
                        updated = true;
                        break;
                    }
                } else if (item.topic && ((item._id && item._id.toString() === taskId) || item.topic === taskId)) {
                    item.status = status;
                    updated = true;
                    break;
                }
            }
            if (updated) {
                report.markModified('preparationPlan');
                await report.save();
            }
        }

        const allRecords = await RoadmapProgress.find({ user: userId, interviewReport: reportId, status: 'completed' });
        const completedTaskIds = allRecords.map((r) => r.taskId);

        console.log(`[Roadmap:Toggle] taskId="${taskId}" completed=${completed} total_completed=${completedTaskIds.length}`);

        return res.status(200).json({
            success: true,
            completedTaskIds,
        });
    } catch (err) {
        console.error('[Roadmap:Toggle] FAILED:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = { getProgress, toggleTask };
