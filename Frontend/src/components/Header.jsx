import React from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth.js'
import { useTheme } from '../hooks/useTheme.js'
import { useInterview } from '../features/interview/hooks/useInterview.js'
import { 
    LayoutDashboard, 
    FileBarChart, 
    FileText, 
    SunMoon, 
    LogOut,
    BrainCircuit
} from 'lucide-react'

const Header = ({ onTabChange, activeTab }) => {
    const { user, handleLogout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const { reports } = useInterview()
    const navigate = useNavigate()
    const location = useLocation()

    const isInterviewPage = location.pathname.includes('/interview/')

    const handleDashboardClick = () => {
        navigate('/dashboard')
    }

    const handleReportsClick = () => {
        if (location.pathname === '/dashboard') {
            const el = document.querySelector('.recent-reports')
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' })
            }
        } else {
            navigate('/dashboard')
            setTimeout(() => {
                const el = document.querySelector('.recent-reports')
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' })
                }
            }, 100)
        }
    }

    const handleResumeClick = () => {
        if (isInterviewPage && onTabChange) {
            onTabChange('resume')
        } else if (reports && reports.length > 0) {
            navigate(`/interview/${reports[0]._id}`)
        } else {
            navigate('/dashboard')
        }
    }

    const initials = user?.username 
        ? user.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U'

    return (
        <header className="dashboard-header">
            <div className="header-container">
                <div className="brand-logo" onClick={handleDashboardClick}>
                    <BrainCircuit size={22} className="logo-icon" />
                    <span>Interview AI</span>
                </div>

                <nav className="header-nav">
                    <button 
                        className={`nav-link ${location.pathname === '/dashboard' && activeTab !== 'resume' ? 'active' : ''}`}
                        onClick={handleDashboardClick}
                    >
                        <LayoutDashboard size={22} className="nav-icon" />
                        <span>Dashboard</span>
                    </button>
                    <button 
                        className="nav-link"
                        onClick={handleReportsClick}
                    >
                        <FileBarChart size={22} className="nav-icon" />
                        <span>Reports</span>
                    </button>
                    <button 
                        className={`nav-link ${activeTab === 'resume' ? 'active' : ''}`}
                        onClick={handleResumeClick}
                    >
                        <FileText size={22} className="nav-icon" />
                        <span>Resume</span>
                    </button>
                </nav>
                
                <div className="user-control">
                    {/* Theme Toggle Button */}
                    <button onClick={toggleTheme} className="theme-toggle-btn" title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                        <SunMoon size={18} />
                    </button>

                    <div className="user-profile">
                        <div className="user-avatar">
                            {initials}
                        </div>
                        <span className="user-name">{user?.username || 'User'}</span>
                    </div>
                    
                    <button onClick={handleLogout} className="logout-btn" title="Sign Out">
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </header>
    )
}

export default Header
