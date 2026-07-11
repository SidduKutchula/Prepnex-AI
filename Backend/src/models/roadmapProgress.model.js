const mongoose = require('mongoose');

const roadmapProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, index: true },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewReport', required: true, index: true },
  taskId: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

roadmapProgressSchema.index({ userId: 1, reportId: 1, taskId: 1 }, { unique: true });

module.exports = mongoose.model('RoadmapProgress', roadmapProgressSchema);
