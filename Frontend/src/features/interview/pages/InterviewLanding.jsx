import React, { useState, useRef, useEffect, useCallback } from 'react'

import { useInterview } from '../hooks/useInterview.js'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { useAutoSave } from '../hooks/useAutoSave.js'
import AutoSaveIndicator from '../../../components/AutoSaveIndicator.jsx'
import { useNavigate } from 'react-router'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import { AnimatedCounter } from '../../../components/AnimatedCounter.jsx'
import { 
    BriefcaseBusiness, 
    FileUp, 
    FileText, 
    Sparkles, 
    CircleUserRound, 
    WandSparkles, 
    BrainCircuit,
    ArrowRight,
    Target,
    Flame,
    Trophy,
    ListChecks,
    CheckCircle2,
    X,
    Calendar
} from 'lucide-react'


// Stagger variants for widgets
const widgetContainer = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08
        }
    }
}

const widgetItem = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.3,
            ease: 'easeOut'
        }
    }
}



const gridStagger = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08
        }
    }
}

const itemReveal = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.25,
            ease: 'easeOut'
        }
    }
}

const buttonHoverTap = {
    whileHover: { scale: 1.01, transition: { type: 'spring', stiffness: 300, damping: 20 } },
    whileTap: { scale: 0.98 }
}

const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
}


const InterviewLanding = () => {
    const { loading, startGeneration, reports } = useInterview()
    const { user } = useAuth()
    const [jobDescription, setJobDescription] = useState("")
    const [selfDescription, setSelfDescription] = useState("")
    const [fileName, setFileName] = useState("")
    const [resumeFile, setResumeFile] = useState(null)
    const [remainingDays, setRemainingDays] = useState(7)
    const [error, setError] = useState("")
    const [isLoaded, setIsLoaded] = useState(false)
    const resumeInputRef = useRef()

    const { status: autoSaveStatus, lastSavedTime, triggerSave, loadDraft } = useAutoSave(user?.id)

    const navigate = useNavigate()

    // Load draft on mount (only if logged in)
    useEffect(() => {
        let mounted = true;
        const fetchDraft = async () => {
            if (!user?.id) {
                setIsLoaded(true);
                return;
            }
            const draft = await loadDraft();
            if (draft && mounted) {
                if (draft.jobDescription) setJobDescription(draft.jobDescription);
                if (draft.selfDescription) setSelfDescription(draft.selfDescription);
                if (draft.remainingDays) setRemainingDays(draft.remainingDays);
            }
            if (mounted) {
                setIsLoaded(true);
            }
        };
        fetchDraft();
        return () => { mounted = false; };
    }, [loadDraft, user?.id]);

    // Clear all form data when user logs out
    useEffect(() => {
        if (!user) {
            setJobDescription("");
            setSelfDescription("");
            setRemainingDays(7);
            setResumeFile(null);
            setFileName("");
            setError("");
            setIsLoaded(false);
        }
    }, [user]);

    // Trigger save on changes
    useEffect(() => {
        if (isLoaded) {
            triggerSave({
                jobDescription,
                selfDescription,
                remainingDays
            });
        }
    }, [jobDescription, selfDescription, remainingDays, triggerSave, isLoaded]);

    // Stable refs so handlers don't recreate on every render
    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0]
        if (file) {
            setResumeFile(file)
            setFileName(file.name)
        } else {
            setResumeFile(null)
            setFileName("")
        }
    }, [])

    const [isGenerating, setIsGenerating] = useState(false);

    // Removed manual progress state as we navigate immediately
    const handleGenerateReport = useCallback(async () => {
        if (isGenerating) return;
        
        setError("")
        if (!resumeFile && !selfDescription.trim()) {
            setError("Please upload a resume PDF or fill in the self description before generating.")
            return
        }
        if (!jobDescription.trim()) {
            setError("Please paste a job description before generating.")
            return
        }
        if (!remainingDays || remainingDays < 1) {
            setError("Please specify a valid number of days remaining.")
            return
        }
        
        setIsGenerating(true);
        try {
            const response = await startGeneration({ 
                jobDescription, 
                selfDescription, 
                resumeFile, 
                remainingDays
            })
            if (response.success) {
                navigate(`/interview/${response.reportId}`)
            } else {
                setError(response.error)
            }
        } finally {
            setIsGenerating(false);
        }
    }, [resumeFile, selfDescription, jobDescription, remainingDays, startGeneration, navigate, isGenerating])


    const renderLoader = () => (
        <div className='loading-screen inline-loader animate-fade-in'>
            <div className="loader-container glass-card">
                <div className="scanner-box">
                    <FileText size={38} className="document-icon" />
                    <motion.div 
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        className="scanner-beam"
                    />
                </div>
                <div className="loading-info">
                    <Sparkles size={20} className="ai-pulse" />
                    <h1>Initializing AI Engine...</h1>
                    <p>Securing strategy processing slot...</p>
                </div>
            </div>
        </div>
    )

    return (
        <div className='home-page animate-fade-in'>
            <div className="dashboard-container">
                <header className='page-header' style={{ position: 'relative' }}>
                    <h1>Good {getTimeOfDay()}, <span className='highlight'>{user?.username || 'Candidate'}</span></h1>
                    <p>Let our AI analyze target job requirements against your unique profile to build a winning strategy.</p>
                </header>


                {loading ? (
                    renderLoader()
                ) : (
                    <>
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.15 }}
                            className='premium-workspace glass-card'
                        >
                            <div className='premium-workspace__grid'>

                                {/* LEFT: JD */}
                                <div className='premium-panel'>
                                    <div className='premium-panel__header'>
                                        <div className='title-group'>
                                            <BriefcaseBusiness size={20} className='title-icon' />
                                            <h2>Target Job Description</h2>
                                        </div>
                                        <span className='premium-badge premium-badge--required'>Required</span>
                                    </div>
                                    <div className="premium-textarea-wrapper">
                                        <textarea
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                            className='premium-textarea'
                                            placeholder='Paste the complete job description...'
                                        />
                                        <div className="textarea-footer">
                                            <span className="helper-text">Paste the complete job description from LinkedIn, Indeed, or the company's career page.</span>
                                            <span className="char-counter">{jobDescription.length} characters</span>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: RESUME */}
                                <div className='premium-panel'>
                                    <div className='premium-panel__header'>
                                        <div className='title-group'>
                                            <CircleUserRound size={20} className='title-icon' />
                                            <h2>Candidate Profile</h2>
                                        </div>
                                        <span className='premium-badge premium-badge--recommended'>Recommended</span>
                                    </div>
                                    
                                    <div className='premium-upload-section'>
                                        <input
                                            type="file"
                                            ref={resumeInputRef}
                                            onChange={handleFileChange}
                                            accept="application/pdf"
                                            style={{ display: "none" }}
                                        />
                                        <div 
                                            className={`premium-dropzone ${fileName ? 'has-file' : ''}`}
                                            onClick={() => { if (!fileName) resumeInputRef.current.click() }}
                                        >
                                            {fileName ? (
                                                <div className="dropzone-success">
                                                    <CheckCircle2 size={36} className="success-icon" />
                                                    <h3 className="success-title">Resume uploaded</h3>
                                                    <p className='file-name'>{fileName}</p>
                                                    <div className="dropzone-actions">
                                                        <button 
                                                            type="button" 
                                                            className="action-btn replace-btn" 
                                                            onClick={(e) => { e.stopPropagation(); resumeInputRef.current.click(); }}
                                                        >
                                                            Replace
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            className="action-btn remove-btn" 
                                                            onClick={(e) => { e.stopPropagation(); setFileName(''); setResumeFile(null); resumeInputRef.current.value = null; }}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="dropzone-empty">
                                                    <FileUp size={36} className="empty-icon" />
                                                    <h3 className="empty-title">Upload Resume</h3>
                                                    <p className="empty-subtitle">or drag & drop</p>
                                                    <div className="file-limits">
                                                        <span>PDF</span>
                                                        <span className="dot">•</span>
                                                        <span>Max 5MB</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="manual-entry-accordion">
                                        <details className="premium-details">
                                            <summary>Don't have a resume?</summary>
                                            <div className="details-content">
                                                <textarea
                                                    value={selfDescription}
                                                    onChange={(e) => setSelfDescription(e.target.value)}
                                                    className='premium-textarea premium-textarea--short'
                                                    placeholder='Briefly describe your experience and skills...'
                                                />
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            </div>

                            <div className='premium-workspace__footer' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <div className="config-inline" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '8px 18px', borderRadius: '999px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                    <Calendar size={16} color="var(--text-muted)" />
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Preparation Time</label>
                                    <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 6px' }}></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <input 
                                            type="number" 
                                            value={remainingDays}
                                            onChange={(e) => setRemainingDays(parseInt(e.target.value) || "")}
                                            min="1"
                                            max="90"
                                            style={{ width: '32px', background: 'transparent', border: 'none', color: 'var(--text-heading)', fontWeight: 700, fontSize: '15px', textAlign: 'center', outline: 'none', padding: 0 }}
                                        />
                                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>days</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    {error && (
                                        <div className="error-message" style={{ margin: 0 }}>
                                            {error}
                                        </div>
                                    )}
                                    <motion.button 
                                        variants={buttonHoverTap}
                                        whileHover="whileHover"
                                        whileTap="whileTap"
                                        onClick={handleGenerateReport} 
                                        disabled={loading}
                                        className='premium-generate-btn'
                                    >
                                        <WandSparkles size={18} />
                                        <span>Generate Interview Strategy</span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    )
}

export default InterviewLanding
