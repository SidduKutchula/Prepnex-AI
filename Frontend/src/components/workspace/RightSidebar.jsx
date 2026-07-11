import React from 'react'

const RightSidebar = ({ analytics }) => {
  return (
    <aside className="workspace-right-sidebar">
      
      <div className="analytics-widgets">
        
        {/* Match Score */}
        <div className="widget-card">
          <div className="widget-header">Match Score</div>
          <div className="widget-value highlight-value">{analytics?.matchScore || '0%'}</div>
          <div className="widget-bar"><div className="widget-fill" style={{ width: analytics?.matchScore || '0%' }}></div></div>
        </div>

        {/* ATS Compatibility */}
        <div className="widget-card">
          <div className="widget-header">ATS Compatibility</div>
          <div className="widget-value">{analytics?.atsCompatibility || '0%'}</div>
          <div className="widget-bar"><div className="widget-fill ats-fill" style={{ width: analytics?.atsCompatibility || '0%' }}></div></div>
        </div>

        {/* Interview Readiness */}
        <div className="widget-card">
          <div className="widget-header">Interview Readiness</div>
          <div className="widget-value success">{analytics?.readiness || '0%'}</div>
        </div>

        {/* Skill Gaps */}
        <div className="widget-card">
          <div className="widget-header">Skill Gaps</div>
          <div className="tags-container">
            {(analytics?.skillGaps || []).map((skill, i) => (
              <span key={i} className="tag error-tag">{skill}</span>
            ))}
          </div>
        </div>

        {/* Recommended Skills */}
        <div className="widget-card">
          <div className="widget-header">Recommended Skills</div>
          <div className="tags-container">
            {(analytics?.recommendedSkills || []).map((skill, i) => (
              <span key={i} className="tag primary-tag">{skill}</span>
            ))}
          </div>
        </div>

        {/* Top Strengths */}
        <div className="widget-card">
          <div className="widget-header">Top Strengths</div>
          <ul className="bullet-list">
            {(analytics?.strengths || []).map((str, i) => (
              <li key={i}>{str}</li>
            ))}
          </ul>
        </div>

        {/* Weak Areas */}
        <div className="widget-card">
          <div className="widget-header">Weak Areas</div>
          <ul className="bullet-list warning-list">
            {(analytics?.weaknesses || []).map((wk, i) => (
              <li key={i}>{wk}</li>
            ))}
          </ul>
        </div>

        {/* Confidence & Next Topic */}
        <div className="widget-card split-widget">
          <div>
            <div className="widget-header">Confidence</div>
            <div className="widget-subvalue">{analytics?.confidence || 'Medium'}</div>
          </div>
          <div>
            <div className="widget-header">Next Topic</div>
            <div className="widget-subvalue accent">{analytics?.nextTopic || 'None'}</div>
          </div>
        </div>

      </div>

    </aside>
  )
}

export default RightSidebar
