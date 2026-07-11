const ActivityHistory = require('../models/activity.model');

const asyncHandler = require("../utils/asyncHandler");

// Log a new activity (mostly used internally by other controllers, but can be an endpoint)
exports.logActivity = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { actionType, metadata } = req.body;

    const activity = await ActivityHistory.create({
        user: userId,
        actionType,
        metadata
    });

    res.status(201).json({ success: true, data: activity });
});

// Get user activity history for dashboard
exports.getActivityHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const activities = await ActivityHistory.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20);

    res.status(200).json({ success: true, data: activities });
});
