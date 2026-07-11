const AutosaveState = require('../models/autosave.model');

const asyncHandler = require("../utils/asyncHandler");

// Save or update active autosave state for a user
exports.saveAutosaveState = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { jobDescription, selfDescription, fileName, resumeText, remainingDays, activeInterviewId } = req.body;

    // Upsert the autosave state for the user
    const autosave = await AutosaveState.findOneAndUpdate(
        { user: userId },
        {
            $set: {
                jobDescription,
                selfDescription,
                fileName,
                resumeText,
                remainingDays,
                activeInterviewId
            }
        },
        { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: autosave });
});

// Fetch the latest autosave state for a user to "Continue where left off"
exports.getAutosaveState = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const autosave = await AutosaveState.findOne({ user: userId });

    if (!autosave) {
        return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data: autosave });
});

// Clear autosave state (e.g. when report is completed)
exports.clearAutosaveState = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    await AutosaveState.findOneAndDelete({ user: userId });
    res.status(200).json({ success: true, message: "Autosave cleared" });
});
