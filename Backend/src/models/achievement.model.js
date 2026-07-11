const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    achievementType: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

achievementSchema.index({ user: 1, achievementType: 1 }, { unique: true });

module.exports = mongoose.model("Achievement", achievementSchema);
