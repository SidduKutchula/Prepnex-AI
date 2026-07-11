import React from 'react'
import LeftSidebar from './LeftSidebar.jsx'
import RightSidebar from './RightSidebar.jsx'
import './workspace.scss'

const WorkspaceLayout = ({ children, leftStats, rightAnalytics }) => {
  return (
    <div className="workspace-container">
      <LeftSidebar stats={leftStats} />
      
      <main className="workspace-main-content">
        <div className="workspace-scroll-area">
          {children}
        </div>
      </main>
      
      <RightSidebar analytics={rightAnalytics} />
    </div>
  )
}

export default WorkspaceLayout
