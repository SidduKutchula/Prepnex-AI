import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, FileText, ChevronRight, UploadCloud } from 'lucide-react'
import '../style/home.scss'

const Resume = () => {
    // Mock Data for the ATS display
    const atsScore = 91;
    const statusText = "Excellent ATS Compatibility";
    
    return (
        <div className="home-dashboard">
            <header className="dashboard-header animate-fade-in">
                <div className="header-left">
                    <h1 className="greeting">Resume Intelligence</h1>
                    <p className="subtitle">Analyze and optimize your resume for applicant tracking systems.</p>
                </div>
                <div className="header-actions">
                    <button className="primary-btn pulse-glow">
                        <UploadCloud size={18} />
                        Upload New Resume
                    </button>
                </div>
            </header>

            <div className="dashboard-grid animate-fade-in" style={{ animationDelay: '0.1s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {/* CARD 1 — RESUME ATS SCORE */}
                <motion.div 
                    className="glass-card stat-widget"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>RESUME ATS SCORE</h3>
                        <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            background: 'var(--success-subtle)', 
                            color: 'var(--success)', 
                            fontSize: '11px', 
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>Excellent</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '48px', fontWeight: '800', color: 'var(--text-heading)', lineHeight: '1' }}>{atsScore}</span>
                        <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-muted)' }}>/ 100</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                        <span style={{ color: 'var(--success)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                            +6
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>from previous resume</span>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                        <div style={{ height: '6px', background: 'var(--bg-page)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${atsScore}%` }}
                                transition={{ duration: 1.5, ease: 'easeOut' }}
                                style={{ height: '100%', background: 'var(--success)' }}
                            />
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last analyzed: Just now</div>
                    </div>
                </motion.div>

                {/* CARD 2 — ATS BREAKDOWN */}
                <motion.div 
                    className="glass-card stat-widget"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                    <h3 style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '24px' }}>ATS BREAKDOWN</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                        {[
                            { label: 'Keywords Match', value: 85 },
                            { label: 'Formatting', value: 98 },
                            { label: 'Resume Structure', value: 100 },
                            { label: 'Readability', value: 72, warning: true },
                            { label: 'Grammar', value: 95 },
                            { label: 'Section Completeness', value: 90 }
                        ].map((metric, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '500' }}>
                                    <span style={{ color: 'var(--text-body)' }}>{metric.label}</span>
                                    <span style={{ color: metric.warning ? 'var(--warning)' : 'var(--text-heading)', fontWeight: '600' }}>{metric.value}%</span>
                                </div>
                                <div style={{ height: '4px', background: 'var(--bg-page)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${metric.value}%` }}
                                        transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                                        style={{ height: '100%', background: metric.warning ? 'var(--warning)' : 'var(--accent)' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CARD 3 — IMPROVEMENT CENTER */}
                <motion.div 
                    className="glass-card stat-widget"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                    <h3 style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '20px' }}>IMPROVEMENT CENTER</h3>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-body)', marginBottom: '12px' }}>Missing Keywords</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {['Docker', 'CI/CD', 'Kubernetes', 'AWS'].map(kw => (
                                    <span key={kw} style={{ 
                                        padding: '4px 10px', 
                                        background: 'var(--error-subtle)', 
                                        color: 'var(--error)',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}>{kw}</span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-body)', marginBottom: '12px' }}>Quick Improvements</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    "Add measurable achievements",
                                    "Include deployment experience",
                                    "Improve project descriptions",
                                    "Mention REST API development"
                                ].map((suggestion, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                        <CheckCircle2 size={14} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
                                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{suggestion}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button style={{ 
                        marginTop: '24px', 
                        width: '100%', 
                        padding: '12px', 
                        background: 'var(--bg-surface)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px',
                        color: 'var(--text-heading)',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-page)'; e.currentTarget.style.borderColor = 'var(--text-muted)' }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                    >
                        Optimize Resume Again
                    </button>
                </motion.div>
            </div>
        </div>
    )
}

export default Resume
