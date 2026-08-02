import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth.js'
import { useTheme } from '../hooks/useTheme.js'
import { 
    LayoutDashboard, 
    FileText, 
    FileBarChart, 
    Map, 
    Search, 
    Bell, 
    SunMoon, 
    LogOut,
    BrainCircuit,
    ChevronDown,
    ChevronRight,
    PlayCircle,
    Code,
    Users,
    Briefcase,
    Server,
    Cpu,
    FileCheck,
    History,
    Settings,
    User
} from 'lucide-react'
import './sidebar.scss'

const Sidebar = () => {
    const { user, handleLogout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    


    const initials = user?.username 
        ? user.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U'

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="brand-logo" onClick={() => navigate('/interview')}>
                    <BrainCircuit size={24} className="logo-icon" />
                    <span>Prepnex AI</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <button 
                    className={`nav-item ${location.pathname === '/interview' || location.pathname === '/' ? 'active' : ''}`}
                    onClick={() => navigate('/interview')}
                >
                    <LayoutDashboard size={20} className="nav-icon" />
                    <span>Interview Workspace</span>
                </button>

                <button 
                    className={`nav-item ${location.pathname === '/resume' ? 'active' : ''}`}
                    onClick={() => navigate('/resume')}
                >
                    <FileCheck size={20} className="nav-icon" />
                    <span>Resume Intelligence</span>
                </button>

                <button 
                    className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}
                    onClick={() => navigate('/history')}
                >
                    <FileBarChart size={20} className="nav-icon" />
                    <span>Activity & Analytics</span>
                </button>

                <button 
                    className={`nav-item ${location.pathname === '/history/compare' ? 'active' : ''}`}
                    onClick={() => navigate('/history/compare')}
                >
                    <History size={20} className="nav-icon" />
                    <span>Compare Analyses</span>
                </button>
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item" onClick={toggleTheme}>
                    <SunMoon size={20} className="nav-icon" />
                    <span>Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                </button>

                <div className="user-profile-section">
                    <div className="user-info">
                        <div className="user-avatar">
                            {initials}
                        </div>
                        <span className="user-name">{user?.username || 'Candidate'}</span>
                    </div>
                    <button className="logout-btn" onClick={handleLogout} title="Sign Out">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
