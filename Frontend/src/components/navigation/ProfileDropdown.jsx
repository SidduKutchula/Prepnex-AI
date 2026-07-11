import React, { useEffect } from 'react'
import { 
    User, Settings, Award, Briefcase, FileText, 
    Mic, Clock, Bookmark, PlayCircle, Star, 
    MessageSquare, AlertCircle, HelpCircle, FileQuestion, 
    Mail, Palette, Bell, Shield, Keyboard, LogOut
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { useInterview } from '../../features/interview/hooks/useInterview.js'

const ProfileDropdown = ({ user, onLogout, onClose }) => {
    const navigate = useNavigate()
    const { reports, getReports } = useInterview()

    useEffect(() => {
        if (!reports || reports.length === 0) {
            getReports()
        }
    }, [reports, getReports])

    const recentScore = reports && reports.length > 0 ? Math.round(reports.slice(0, 3).reduce((acc, curr) => acc + (curr.matchScore || 0), 0) / Math.min(reports.length, 3)) : 0;
    const streak = reports?.length > 0 ? new Set(reports.map(r => new Date(r.createdAt).toDateString())).size : 0;

    const handleNav = (path) => {
        navigate(path)
        onClose()
    }

    return (
        <div className="profile-dropdown-workspace">
            {/* Header */}
            <div className="workspace-header">
                <div className="user-identity">
                    <div className="avatar-large">
                        {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="user-details">
                        <span className="name">{user?.username || 'User'}</span>
                        <span className="email">{user?.email || 'user@example.com'}</span>
                        <span className="plan-badge">Pro Plan</span>
                    </div>
                </div>
            </div>

        </div>
    )
}

// Inline component for missing icon
const TrendingUpIcon = ({size}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
)

export default ProfileDropdown
