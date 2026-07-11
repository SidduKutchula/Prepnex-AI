const mongoose = require('mongoose');

const activityHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true
    },
    actionType: {
        type: String,
        required: true,
        enum: ["UPLOAD_RESUME", "GENERATE_STRATEGY", "UPDATE_NOTES", "TOGGLE_BOOKMARK", "REWRITE_RESUME"]
    },
    metadata: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("ActivityHistory", activityHistorySchema);
