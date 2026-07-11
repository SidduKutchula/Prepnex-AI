import React, { useState } from 'react'
import { Check, Trash2, CheckCircle2, FileText, Mic, Target } from 'lucide-react'
import { useNavigate } from 'react-router'

const NotificationsDropdown = ({ onClose, onBadgeUpdate }) => {
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState([])


    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })))
    }

    const clearAll = () => {
        setNotifications([])
    }

    const markRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n))
    }

    const handleNav = (path) => {
        navigate(path)
        onClose()
    }

    // Call this to update parent badge state if we were lifting state
    // useEffect(() => {
    //     if (onBadgeUpdate) onBadgeUpdate(notifications.filter(n => n.unread).length)
    // }, [notifications, onBadgeUpdate])

    return (
        <div className="notifications-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="notifications-header">
                <h3>Notifications</h3>
                <div className="header-actions">
                    <button title="Mark all read" onClick={markAllRead}><Check size={16}/></button>
                    <button title="Clear all" onClick={clearAll}><Trash2 size={16}/></button>
                </div>
            </div>
            
            <div className="notifications-list">
                {['Today', 'Yesterday', 'Earlier'].map(group => {
                    const groupNotifs = notifications.filter(n => n.group === group)
                    if (groupNotifs.length === 0) return null
                    return (
                        <React.Fragment key={group}>
                            <div className="group-label">{group}</div>
                            {groupNotifs.map(n => (
                                <div key={n.id} className={`notification-item ${n.unread ? 'unread' : ''}`} onClick={() => handleNav(n.path)} style={{ cursor: 'pointer' }}>
                                    <div className={`notification-icon ${n.type}`}>
                                        <n.icon size={16} />
                                    </div>
                                    <div className="notification-content">
                                        <span className="text">{n.text}</span>
                                        <span className="time">{n.time}</span>
                                    </div>
                                    {n.unread && (
                                        <button className="mark-read-btn" onClick={(e) => { e.stopPropagation(); markRead(n.id) }}>
                                            <CheckCircle2 size={14}/>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </React.Fragment>
                    )
                })}
                {notifications.length === 0 && (
                    <div className="notification-item text-muted" style={{ justifyContent: 'center', padding: '2rem' }}>
                        No notifications
                    </div>
                )}
            </div>
        </div>
    )
}

// Inline components for missing icons
const TrendingUpIcon = ({size}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
)
const BellIcon = ({size}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
)

export default NotificationsDropdown
