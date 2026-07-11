import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, FileText, Target, Bookmark, Play, Download, Trash2, Clock, Edit2 } from 'lucide-react'
import { useInterview } from '../../interview/hooks/useInterview'
import { useNavigate } from 'react-router'
import '../../interview/style/home.scss'

const History = () => {
    const { reports, toggleBookmark, deleteReport, renameReport } = useInterview()
    const navigate = useNavigate()
    
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState('All')
    const [editingId, setEditingId] = useState(null)
    const [editTitle, setEditTitle] = useState('')

    const filteredData = (reports || []).filter(item => {
        const matchesSearch = (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (item.jobDescription || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'All' 
                              || (filter === 'Bookmarked' && item.isBookmarked)
                              || (filter === 'Drafts' && item.status === 'draft')
                              || (filter === 'Completed' && (item.status === 'completed' || !item.status));
        return matchesSearch && matchesFilter
    })

    const groupedData = filteredData.reduce((acc, item) => {
        const date = new Date(item.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
        if (!acc[date]) acc[date] = []
        acc[date].push(item)
        return acc
    }, {})

    const sortedDates = Object.keys(groupedData).sort((a,b) => new Date(b) - new Date(a))

    const handleRenameSubmit = async (id) => {
        if (editTitle.trim()) {
            await renameReport(id, editTitle)
        }
        setEditingId(null)
    }

    return (
        <div className="home-dashboard" style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '960px', display: 'flex', flexDirection: 'column' }}>
                <header className="history-page-header animate-fade-in" style={{ marginBottom: '24px' }}>
                    <div className="header-left">
                        <h1 className="greeting">Activity History</h1>
                        <p className="subtitle">Track all your generated reports, mock interviews, and optimized resumes.</p>
                    </div>
                </header>

                <div className="animate-fade-in" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Controls */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ 
                            flex: 1, 
                            minWidth: '240px',
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border)', 
                            borderRadius: '8px',
                            padding: '0 12px',
                            height: '36px'
                        }}>
                            <Search size={14} style={{ color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Search by title or job description..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ 
                                    background: 'transparent', 
                                    border: 'none', 
                                    outline: 'none', 
                                    color: 'var(--text-heading)', 
                                    width: '100%',
                                    fontSize: '13px'
                                }} 
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['All', 'Completed', 'Drafts', 'Bookmarked'].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        height: '36px',
                                        padding: '0 12px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        background: filter === f ? 'var(--bg-surface)' : 'var(--bg-card)',
                                        border: `1px solid ${filter === f ? 'var(--text-muted)' : 'var(--border)'}`,
                                        color: filter === f ? 'var(--text-heading)' : 'var(--text-muted)',
                                        fontWeight: filter === f ? '500' : '400',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {sortedDates.map(dateLabel => (
                            <div key={dateLabel}>
                                <h3 style={{ 
                                    fontSize: '12px', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.05em', 
                                    color: 'var(--text-muted)',
                                    marginBottom: '16px',
                                    paddingLeft: '8px'
                                }}>
                                    {dateLabel}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {groupedData[dateLabel].map(item => {
                                        return (
                                            <motion.div 
                                                key={item._id}
                                                className="glass-card"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'space-between',
                                                    padding: '20px 28px',
                                                    gap: '20px',
                                                    flexWrap: 'wrap'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: 1, minWidth: '240px' }}>
                                                    <div style={{ 
                                                        width: '46px', height: '46px', borderRadius: '12px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: 'var(--accent-subtle)',
                                                        color: 'var(--accent)'
                                                    }}>
                                                        <Target size={22} />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                                    {editingId === item._id ? (
                                                        <input 
                                                            type="text" 
                                                            value={editTitle} 
                                                            onChange={(e) => setEditTitle(e.target.value)}
                                                            onBlur={() => handleRenameSubmit(item._id)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(item._id)}
                                                            autoFocus
                                                            style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-heading)', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 8px' }}
                                                        />
                                                    ) : (
                                                        <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {item.title}
                                                            <button onClick={() => { setEditingId(item._id); setEditTitle(item.title); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                                <Edit2 size={12} />
                                                            </button>
                                                        </span>
                                                    )}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span>•</span>
                                                        <span style={{ 
                                                            color: (item.status || 'completed') === 'completed' ? 'var(--success)' : 'var(--warning)',
                                                            fontWeight: '500',
                                                            textTransform: 'capitalize'
                                                        }}>{item.status || 'completed'}</span>
                                                        {item.version > 1 && (
                                                            <>
                                                                <span>•</span>
                                                                <span style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px' }}>v{item.version}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button 
                                                    onClick={() => navigate(`/interview/${item._id}`)}
                                                    title="Open Report"
                                                    style={{ 
                                                    padding: '8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px',
                                                    color: 'var(--text-heading)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Play size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => toggleBookmark(item._id)}
                                                    title={item.isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                                                    style={{ 
                                                    padding: '8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px',
                                                    color: item.isBookmarked ? 'var(--accent)' : 'var(--text-muted)', 
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    backgroundColor: item.isBookmarked ? 'var(--accent-subtle)' : 'transparent'
                                                }}>
                                                    <Bookmark size={16} fill={item.isBookmarked ? "currentColor" : "none"} />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (window.confirm("Are you sure you want to delete this report?")) {
                                                            deleteReport(item._id)
                                                        }
                                                    }}
                                                    title="Delete Report"
                                                    style={{ 
                                                    padding: '8px', background: 'transparent', border: '1px solid var(--error-subtle)', borderRadius: '8px',
                                                    color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                    {sortedDates.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '16px' }}>
                            No history found matching your filters.
                        </div>
                    )}
                </div>
                </div>
            </div>
        </div>
    )
}

export default History
