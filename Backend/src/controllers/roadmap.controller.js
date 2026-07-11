const RoadmapProgress = require('../models/roadmapProgress.model');

async function getProgress(req, res) {
    try {
        const { reportId } = req.params;
        const userId = req.user.id;

        const records = await RoadmapProgress.find({ userId, reportId, completed: true });
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
        const userId = req.user.id;

        await RoadmapProgress.findOneAndUpdate(
            { userId, reportId, taskId },
            { completed, completedAt: completed ? new Date() : null },
            { upsert: true, new: true }
        );

        const allRecords = await RoadmapProgress.find({ userId, reportId, completed: true });
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
