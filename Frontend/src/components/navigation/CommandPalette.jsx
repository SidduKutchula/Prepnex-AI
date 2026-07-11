import React, { useState, useEffect, useRef } from 'react'
import { Search, X, FileText, Mic, Clock, User, Building } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useInterview } from '../../features/interview/hooks/useInterview.js'
import './commandPalette.scss'

const CommandPalette = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('')
    const navigate = useNavigate()
    const { reports, getReports } = useInterview()
    const inputRef = useRef(null)

    useEffect(() => {
        if (isOpen && (!reports || reports.length === 0)) {
            getReports()
        }
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50)
            setQuery('')
        }
    }, [isOpen, reports, getReports])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                // Should toggle open here, but assuming it's managed by parent
            }
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const lowerQuery = query.toLowerCase()
    
    // Filter reports by title
    const filteredReports = reports ? reports.filter(r => 
        r.title && r.title.toLowerCase().includes(lowerQuery)
    ) : []

    const handleNavigate = (path) => {
        navigate(path)
        onClose()
    }

    return (
        <div className="command-palette-overlay" onClick={onClose}>
            <div className="command-palette-container" onClick={e => e.stopPropagation()}>
                <div className="search-header">
                    <Search size={20} className="search-icon" />
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Search questions, companies, reports, history..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="search-results">
                    {query ? (
                        <div className="result-group">
                            <span className="group-label">Interview Reports</span>
                            {filteredReports.length > 0 ? (
                                filteredReports.map(report => (
                                    <div 
                                        key={report._id} 
                                        className="result-item" 
                                        onClick={() => handleNavigate(`/interview/${report._id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Mic size={16} />
                                        <span>{report.title || "Untitled Role"}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="result-item text-muted">
                                    <span>No matching reports found</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="result-group">
                                <span className="group-label">Recently Opened</span>
                                {reports && reports.slice(0, 2).map(report => (
                                    <div 
                                        key={report._id} 
                                        className="result-item" 
                                        onClick={() => handleNavigate(`/interview/${report._id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <FileText size={16} />
                                        <span>{report.title}</span>
                                    </div>
                                ))}
                                {(!reports || reports.length === 0) && (
                                    <div className="result-item text-muted">
                                        <span>No recent reports</span>
                                    </div>
                                )}
                            </div>

                            <div className="result-group">
                                <span className="group-label">Suggestions</span>
                                <div className="result-item" onClick={() => handleNavigate('/interview')} style={{ cursor: 'pointer' }}>
                                    <Building size={16} />
                                    <span>Google Interview Questions</span>
                                </div>
                                <div className="result-item" onClick={() => handleNavigate('/interview')} style={{ cursor: 'pointer' }}>
                                    <Clock size={16} />
                                    <span>View Preparation History</span>
                                </div>
                                <div className="result-item" onClick={() => handleNavigate('/interview')} style={{ cursor: 'pointer' }}>
                                    <User size={16} />
                                    <span>Edit Profile Preferences</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="search-footer">
                    <span className="nav-hint"><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
                    <span className="nav-hint"><kbd>Enter</kbd> to select</span>
                    <span className="nav-hint"><kbd>Esc</kbd> to close</span>
                </div>
            </div>
        </div>
    )
}

export default CommandPalette
