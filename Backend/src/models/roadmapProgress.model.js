const mongoose = require('mongoose');

const roadmapProgressSchema = new mongoose.Schema({
  // Dual-support for user / userId
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', index: true },

  // Dual-support for interviewReport / reportId
  interviewReport: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewReport', index: true },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewReport', index: true },

  taskId: { type: String, required: true, index: true },
  
  // Dual-support for status / completed
  status: { type: String, enum: ['pending', 'completed', 'skipped'], default: 'pending', index: true },
  completed: { type: Boolean, default: false },

  title: { type: String },
  estimatedHours: { type: Number, default: 0 },
  difficulty: { type: String, default: 'Medium' },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

// Auto-sync aliases before saving or validating
roadmapProgressSchema.pre('validate', function() {
  if (this.user && !this.userId) this.userId = this.user;
  if (this.userId && !this.user) this.user = this.userId;

  if (this.interviewReport && !this.reportId) this.reportId = this.interviewReport;
  if (this.reportId && !this.interviewReport) this.interviewReport = this.reportId;

  if (this.status === 'completed' && !this.completed) this.completed = true;
  if (this.completed && this.status !== 'completed') this.status = 'completed';
  if (!this.completed && this.status === 'completed') this.status = 'pending';
});

// Auto-sync on update operations
roadmapProgressSchema.pre('findOneAndUpdate', function() {
  const update = this.getUpdate();
  if (!update) return;

  const setObj = update.$set || update;

  if (setObj.user && !setObj.userId) setObj.userId = setObj.user;
  if (setObj.userId && !setObj.user) setObj.user = setObj.userId;

  if (setObj.interviewReport && !setObj.reportId) setObj.reportId = setObj.interviewReport;
  if (setObj.reportId && !setObj.interviewReport) setObj.interviewReport = setObj.reportId;

  if (setObj.status === 'completed') {
    setObj.completed = true;
  } else if (setObj.completed === true) {
    setObj.status = 'completed';
  } else if (setObj.completed === false) {
    setObj.status = 'pending';
  }
});

roadmapProgressSchema.index({ user: 1, interviewReport: 1, taskId: 1 }, { unique: true });
roadmapProgressSchema.index({ userId: 1, reportId: 1, taskId: 1 });
roadmapProgressSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('RoadmapProgress', roadmapProgressSchema);
