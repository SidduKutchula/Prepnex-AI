import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useAuth } from '../../features/auth/hooks/useAuth.js'
import { useTheme } from '../../hooks/useTheme.js'
import { 
    LayoutDashboard, 
    Search, 
    Bell, 
    SunMoon, 
    BrainCircuit,
    Menu,
    X,
    LogOut
} from 'lucide-react'
import ProfileDropdown from './ProfileDropdown.jsx'
import NotificationsDropdown from './NotificationsDropdown.jsx'
import './navbar.scss'

const Navbar = ({ onSearchOpen }) => {
    const { user, handleLogout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)

    const profileRef = useRef(null)
    const notifRef = useRef(null)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false)
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotificationsOpen(false)
            }
        }
        
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setProfileOpen(false)
                setNotificationsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [])

    const toggleProfile = () => {
        setProfileOpen(!profileOpen)
        setNotificationsOpen(false)
    }

    const toggleNotifications = () => {
        setNotificationsOpen(!notificationsOpen)
        setProfileOpen(false)
    }

    const navItems = [
        { name: 'Interview', path: '/interview' },
        { name: 'History', path: '/history' },
    ]

    return (
        <header className={`global-navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container">
                
                <div className="navbar-left">
                    <div className="brand-logo" onClick={() => navigate('/interview')}>
                        <BrainCircuit size={18} className="logo-icon" />
                        <span className="brand-name">Prepnex AI</span>
                    </div>
                </div>

                <nav className={`primary-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <button 
                                key={item.name}
                                className={`nav-link ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    navigate(item.path)
                                    setMobileMenuOpen(false)
                                }}
                            >
                                <span>{item.name}</span>
                            </button>
                        )
                    })}
                </nav>

                <div className="navbar-right">
                    <div className="action-group">

                        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
                            <SunMoon size={18} />
                        </button>

                        <div className="dropdown-container" ref={profileRef}>
                            <button className="profile-btn" onClick={toggleProfile}>
                                <div className="avatar">
                                    {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                                </div>
                            </button>
                            {profileOpen && <ProfileDropdown user={user} onLogout={handleLogout} onClose={() => setProfileOpen(false)} />}
                        </div>

                        <button className="icon-btn logout-nav-btn" onClick={handleLogout} title="Logout">
                            <LogOut size={18} />
                        </button>
                    </div>

                    <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

            </div>
        </header>
    )
}

export default Navbar
