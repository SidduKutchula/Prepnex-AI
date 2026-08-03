import React from 'react'
import {
  Play,
  RefreshCw,
  Download,
  Share2,
  Bookmark,
  FileText,
  ScanSearch,
  CheckCircle2,
  Target,
  Trophy
} from 'lucide-react'

const LeftSidebar = ({ stats, onDownloadReport, onDownloadResume, onBookmark, onShare }) => {
  return (
    <aside className="workspace-left-sidebar">
      
      {/* Progress Block */}
      <div className="sidebar-block">
        <h3 className="block-title">Interview Progress</h3>
        
        <div className="progress-stats">
          <div className="stat-row">
            <span className="stat-label">Overall Completion</span>
            <span className="stat-value">{stats?.completion || '0%'}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: stats?.completion || '0%' }}></div>
          </div>

          <div className="stat-row">
            <span className="stat-label">Interview Readiness</span>
            <span className="stat-value success">{stats?.readiness || '0%'}</span>
          </div>

          <div className="stat-row">
            <span className="stat-label">Questions</span>
            <span className="stat-value">{stats?.questionsCompleted || 0} / {stats?.totalQuestions || 0}</span>
          </div>

          <div className="stat-row">
            <span className="stat-label">Current Streak</span>
            <span className="stat-value highlight">{stats?.streak || 0} days</span>
          </div>

          <div className="stat-row">
            <span className="stat-label">Estimated Time</span>
            <span className="stat-value">{stats?.eta || '0h 0m'}</span>
          </div>
        </div>

        <div className="goals-section">
          <div className="goal-item">
            <Target size={14} className="goal-icon" />
            <div className="goal-content">
              <span className="goal-title">Daily Goal</span>
              <span className="goal-progress">2/5 Questions</span>
            </div>
          </div>
          <div className="goal-item">
            <Trophy size={14} className="goal-icon" />
            <div className="goal-content">
              <span className="goal-title">Weekly Goal</span>
              <span className="goal-progress">10/20 Questions</span>
            </div>
          </div>
        </div>

        <div className="recommendation">
          <span className="rec-label">Next Recommended</span>
          <span className="rec-value">Behavioral Questions</span>
        </div>
      </div>

      {/* Quick Actions Block */}
      <div className="sidebar-block">
        <h3 className="block-title">Quick Actions</h3>
        <div className="action-list">
          <button className="action-btn primary">
            <Play size={16} />
            <span>Continue Interview</span>
          </button>
          <button className="action-btn" onClick={onDownloadReport}>
            <Download size={16} />
            <span>Download Master Report</span>
          </button>
          <button className="action-btn" onClick={onDownloadResume}>
            <FileText size={16} />
            <span>Download ATS Resume</span>
          </button>
          <button className="action-btn" onClick={onShare}>
            <Share2 size={16} />
            <span>Share Report</span>
          </button>
          <button className="action-btn" onClick={onBookmark}>
            <Bookmark size={16} />
            <span>Bookmark Report</span>
          </button>
        </div>
      </div>

    </aside>
  )
}

export default LeftSidebar
