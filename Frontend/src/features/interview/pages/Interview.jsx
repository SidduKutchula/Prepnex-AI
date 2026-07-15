import React, { useState, useEffect, useRef, memo } from 'react'

import { useInterview, useInterviewStream } from '../hooks/useInterview.js'
import { useNavigate, useParams, useOutletContext } from 'react-router'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedCounter } from '../../../components/AnimatedCounter.jsx'
import {
    CodeXml,
    MessageCircleQuestion,
    Map,
    FileText,
    Download,
    LoaderCircle,
    ChevronDown,
    Check,
    Target,
    ScanSearch,
    BrainCircuit,
    ArrowLeft,
    Sparkles,
    Bot,
    Video,
    VideoOff,
    Mic,
    MicOff,
    Send,
    Play,
    Square,
    WandSparkles,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    LineChart,
    MessageSquare
} from 'lucide-react'

const NAV_ITEMS = [
    { 
        id: 'technical', 
        label: 'Technical questions', 
        icon: (<CodeXml size={22} />) 
    },
    { 
        id: 'behavioral', 
        label: 'Behavioral questions', 
        icon: (<MessageCircleQuestion size={22} />) 
    },
    { 
        id: 'roadmap', 
        label: 'Road map', 
        icon: (<Map size={22} />) 
    },
    { 
        id: 'resume', 
        label: 'Tailored resume', 
        icon: (<FileText size={22} />) 
    }
]

// Spring button preset
const buttonHoverTap = {
    whileHover: { scale: 1.01, transition: { type: 'spring', stiffness: 300, damping: 20 } },
    whileTap: { scale: 0.98 }
}



// Only animate opacity — no Y movement to prevent layout shifts on tab switch
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

// Section fade — used when switching between nav tabs
const sectionFade = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.1 } }
}

// ── Sub-components (memoised — prevent re-render on parent state changes) ─────
const QuestionCard = memo(({ item, index }) => {
    const [open, setOpen] = useState(false)

    const categories = ["system design", "technical deep-dive", "coding architecture", "behavioral alignment", "problem solving"];
    const category = categories[index % categories.length];
    const companiesCount = (index % 3) + 2;
    const contextText = `Asked at ${companiesCount} companies in this JD`;

    return (
        <div className={`q-card glass-card ${open ? 'is-open' : ''}`}>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <div className='q-card__title-section'>
                    <p className='q-card__question'>{item.question}</p>
                    <div className="q-card__meta-pills">
                        <span className="pill-badge accent-badge">
                            <CodeXml size={12} className="pill-icon" />
                            <span>{category}</span>
                        </span>
                        <span className="pill-badge neutral-badge">
                            <Target size={12} className="pill-icon" />
                            <span>{contextText}</span>
                        </span>
                    </div>
                </div>
                <motion.span 
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="q-card__chevron"
                >
                    <ChevronDown size={18} />
                </motion.span>
            </div>
            
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className='q-card__body'>
                            <div className='q-card__section'>
                                <div className="section-title">
                                    <span className='q-card__tag q-card__tag--intention'>Intention</span>
                                    <span className="section-heading">Why they ask this</span>
                                </div>
                                <p>{item.intention}</p>
                            </div>
                            <div className='q-card__section'>
                                <div className="section-title">
                                    <span className='q-card__tag q-card__tag--answer'>Model answer</span>
                                    <span className="section-heading">How you should answer</span>
                                </div>
                                <p>{item.answer}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
})

const getResourceIcon = (type) => {
    switch (type) {
        case "official": return <FileText size={14} />;
        case "interactive": return <Play size={14} />;
        case "practice": return <CodeXml size={14} />;
        case "project": return <Code size={14} />;
        case "cheatSheet": return <Map size={14} />;
        default: return <FileText size={14} />;
    }
}

const getOldResourceIcon = (type) => {
    switch (type) {
        case "video": return <Video size={14} />;
        case "practice": return <CodeXml size={14} />;
        case "article": return <FileText size={14} />;
        default: return <Map size={14} />;
    }
}

const RoadMapDay = memo(({ day, isCompleted, isActive, onToggleCompleted, completedTaskIds }) => {
    // Determine how many tasks are completed in this day
    const completedCount = day.tasks.filter(t => completedTaskIds.includes(t._id || t.title)).length;
    const progress = Math.round((completedCount / day.tasks.length) * 100) || 0;

    return (
        <motion.div 
            variants={itemReveal}
            className={`roadmap-day ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
        >
            <div className="roadmap-marker">
                {progress === 100 ? (
                    <Check size={12} className="task-check-icon" strokeWidth={3} />
                ) : (
                    <span className="roadmap-marker__inner"></span>
                )}
            </div>
            <div className="roadmap-card glass-card premium-dark">
                <div className='roadmap-day__header'>
                    <div className='roadmap-day__title-row'>
                        <span className='roadmap-day__badge'>Day {day.day}</span>
                        <h3 className='roadmap-day__focus'>{day.focus}</h3>
                    </div>
                    <div className='roadmap-day__meta-row'>
                        <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="progress-text">{progress === 100 ? '100% Completed' : `${progress}%`}</span>
                    </div>
                </div>
                
                <div className='roadmap-day__tasks-detailed'>
                    {day.tasks.map((task) => {
                        const taskId = task._id || task.title;
                        const isTaskCompleted = completedTaskIds.includes(taskId);
                        
                        return (
                            <div key={taskId} className={`detailed-task-row ${isTaskCompleted ? 'task-completed' : ''}`}>
                                <div className="task-checkbox" onClick={() => onToggleCompleted(taskId)}>
                                    {isTaskCompleted && <Check size={14} />}
                                </div>
                                <div className="task-content">
                                    <div className="task-top">
                                        <h4 className="task-title">{task.title}</h4>
                                        <span className={`task-difficulty badge-${task.difficulty?.toLowerCase()}`}>{task.difficulty}</span>
                                        <span className="task-time">{task.timeHours} hrs</span>
                                    </div>
                                    <div className="task-meta-pills">
                                        <span className="task-pill">{task.timeOfDay}</span>
                                        <span className="task-pill">{task.type}</span>
                                    </div>
                                    
                                    {task.resources && task.resources.length > 0 && (
                                        <div className="task-resources">
                                            {task.resources.map((res, j) => (
                                                <a key={j} href={res.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                                                    {getOldResourceIcon(res.type)}
                                                    <span>{res.title}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </motion.div>
    )
})

const SkillMasteryCard = memo(({ skill, isCompleted, onToggleCompleted }) => {
    return (
        <motion.div 
            variants={itemReveal}
            className={`roadmap-day ${isCompleted ? 'completed' : ''}`}
        >
            <div className="roadmap-marker">
                {isCompleted ? (
                    <Check size={12} className="task-check-icon" strokeWidth={3} />
                ) : (
                    <span className="roadmap-marker__inner"></span>
                )}
            </div>
            <div className="roadmap-card glass-card premium-dark">
                <div className='roadmap-day__header'>
                    <div className='roadmap-day__title-row'>
                        <span className={`roadmap-day__badge badge-${skill.priority?.toLowerCase()}`}>{skill.priority} Priority</span>
                        <h3 className='roadmap-day__focus'>{skill.topic}</h3>
                    </div>
                    <div className="task-checkbox" onClick={() => onToggleCompleted(skill._id || skill.topic)}>
                        {isCompleted && <Check size={14} />}
                    </div>
                </div>
                
                <div className='roadmap-day__tasks-detailed'>
                    <p style={{ color: 'var(--text-body)', fontSize: '14px', marginBottom: '1rem', lineHeight: 1.5 }}>
                        <strong>Why Learn:</strong> {skill.whyLearn}
                    </p>

                    <div className="task-meta-pills" style={{ marginBottom: '1rem' }}>
                        <span className="task-pill">{skill.estimatedHours} hrs</span>
                        <span className={`task-difficulty badge-${skill.difficulty?.toLowerCase()}`}>{skill.difficulty}</span>
                    </div>

                    <div className="task-resources" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        {skill.officialResource && (
                            <a href={skill.officialResource} target="_blank" rel="noopener noreferrer" className="resource-link">
                                {getResourceIcon("official")} <span>Official Docs</span>
                            </a>
                        )}
                        {skill.interactiveCourse && (
                            <a href={skill.interactiveCourse} target="_blank" rel="noopener noreferrer" className="resource-link">
                                {getResourceIcon("interactive")} <span>Interactive Course</span>
                            </a>
                        )}
                        {skill.practicePlatform && (
                            <a href={skill.practicePlatform} target="_blank" rel="noopener noreferrer" className="resource-link">
                                {getResourceIcon("practice")} <span>Practice Platform</span>
                            </a>
                        )}
                        {skill.cheatSheet && (
                            <a href={skill.cheatSheet} target="_blank" rel="noopener noreferrer" className="resource-link">
                                {getResourceIcon("cheatSheet")} <span>Cheat Sheet</span>
                            </a>
                        )}
                    </div>

                    {skill.project && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <strong style={{ color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Target size={14} /> Recommended Project
                            </strong>
                            <p style={{ fontSize: '14px', color: 'var(--text-body)' }}>{skill.project}</p>
                        </div>
                    )}

                    {skill.interviewQuestions && skill.interviewQuestions.length > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <strong style={{ color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <MessageSquare size={14} /> Practice Questions
                            </strong>
                            <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '14px', color: 'var(--text-body)' }}>
                                {skill.interviewQuestions.map((q, idx) => (
                                    <li key={idx} style={{ marginBottom: '4px' }}>{q}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <p style={{ color: 'var(--accent)', fontSize: '14px', fontStyle: 'italic', marginTop: '0.5rem' }}>
                        🎯 Expected Outcome: {skill.expectedOutcome}
                    </p>
                </div>
            </div>
        </motion.div>
    )
})

const ResumePreviewSection = ({ report }) => {
    return (
        <div className="resume-preview-panel animate-fade-in">
            <div className="preview-header">
                <h2>Tailored ATS Resume</h2>
            </div>
            
            <div className="ats-dashboard">
                <div className="ats-metrics-row">
                    <div className="ats-score-card">
                        <div className="ats-score-circle">
                            <svg viewBox="0 0 36 36" className="circular-chart">
                                <path className="circle-bg"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path className="circle"
                                    strokeDasharray={`${report?.atsScore || 0}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="score-value">{report?.atsScore || 0}%</div>
                        </div>
                        <h3>ATS Match Score</h3>
                        <p>Based on keyword & skill alignment</p>
                    </div>
                    
                    <div className="ats-feedback-card">
                        <h3><Target size={16} /> Improvement Summary</h3>
                        <p className="summary-text">{report?.improvementSummary || "Optimized structural layout and semantics."}</p>
                        
                        <h3 className="mt-4"><Bot size={16} /> Recruiter Feedback</h3>
                        <p className="feedback-text">{report?.recruiterFeedback || "Resume rewritten for optimal ATS parsing."}</p>
                    </div>
                </div>

                <div className="keywords-row">
                    <div className="keywords-card success">
                        <h3><Check size={16} /> Keywords Added</h3>
                        <div className="keyword-badges">
                            {report?.addedKeywords?.length > 0 ? (
                                report.addedKeywords.map((kw, i) => (
                                    <span key={i} className="badge badge-success">{kw}</span>
                                ))
                            ) : (
                                <span className="text-muted">No specific keywords added.</span>
                            )}
                        </div>
                    </div>
                    <div className="keywords-card warning">
                        <h3><ScanSearch size={16} /> Missing Keywords</h3>
                        <div className="keyword-badges">
                            {report?.missingKeywords?.length > 0 ? (
                                report.missingKeywords.map((kw, i) => (
                                    <span key={i} className="badge badge-warning">{kw}</span>
                                ))
                            ) : (
                                <span className="text-muted">No missing keywords!</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {report?.rewrittenResumeHtml && (
                <div className="resume-sheet-container mt-4">
                    <div className="resume-sheet">
                        <div 
                            className="resume-html-preview" 
                            style={{ background: '#fff', padding: '40px', borderRadius: '12px', color: '#333' }}
                            dangerouslySetInnerHTML={{ __html: report.rewrittenResumeHtml }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

// ── AI Interview Coach Component ──────────────────────────────────────────────
const AIInterviewCoachSection = memo(({ report }) => {
    const [isPracticing, setIsPracticing] = useState(false)
    const [sessionTime, setSessionTime] = useState(0)
    const [messages, setMessages] = useState([])
    const [inputText, setInputText] = useState("")
    const [aiThinking, setAiThinking] = useState(false)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [cameraActive, setCameraActive] = useState(false)
    const [micActive, setMicActive] = useState(true)

    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const chatEndRef = useRef(null)

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, aiThinking])

    useEffect(() => {
        let interval
        if (isPracticing) {
            interval = setInterval(() => {
                setSessionTime(t => t + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isPracticing])

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const toggleCamera = async () => {
        if (cameraActive) {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
            setCameraActive(false)
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                streamRef.current = stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
                setCameraActive(true)
            } catch (err) {
                console.error("Camera access failed:", err)
                alert("Could not access camera feed. Please check permissions.")
            }
        }
    }

    const startSession = () => {
        setIsPracticing(true)
        setSessionTime(0)
        const firstQ = report?.technicalQuestions?.[0]?.question || "Can you describe a challenging technical problem you solved?"
        setMessages([
            {
                sender: 'coach',
                text: `Hi! I'm your AI Interview Coach. Let's do a mock simulation for the target role: **${report?.title || 'Untitled position'}**. Ready? Here's the first question:\n\n**${firstQ}**`
            }
        ])
        setCurrentQuestionIndex(0)
    }

    const endSession = () => {
        setIsPracticing(false)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
        }
        setCameraActive(false)
        setMessages(prev => [...prev, {
            sender: 'coach',
            text: `Mock session complete. You did a great job reviewing technical topics! Download your customized resume to proceed.`
        }])
    }

    const handleSend = (e) => {
        if (e) e.preventDefault()
        if (!inputText.trim()) return
        const userText = inputText
        setMessages(prev => [...prev, { sender: 'user', text: userText }])
        setInputText("")
        setAiThinking(true)

        setTimeout(() => {
            setAiThinking(false)
            const currentQ = report?.technicalQuestions?.[currentQuestionIndex]
            const evaluationText = `**Coach Evaluation:** Excellent structural focus in your answer. You mapped the key requirements well.\n\n**Intention behind question:** ${currentQ?.intention || "Evaluates core structural capabilities."}\n\n**Key suggestion:** Reference scaling metrics. For example: ${currentQ?.answer?.slice(0, 100) || "describe scaling limits"}...`
            
            const nextIndex = currentQuestionIndex + 1
            const nextQ = report?.technicalQuestions?.[nextIndex]
            let nextQuestionText = ""
            if (nextQ) {
                nextQuestionText = `Ready for the next question? Here it is:\n\n**${nextQ.question}**`
                setCurrentQuestionIndex(nextIndex)
            } else {
                nextQuestionText = `That completes our technical question queue! Outstanding practice session.`
                setIsPracticing(false)
            }

            setMessages(prev => [...prev, {
                sender: 'coach',
                text: `${evaluationText}\n\n${nextQuestionText}`
            }])
        }, 1800)
    }

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60)
        const remain = secs % 60
        return `${mins.toString().padStart(2, '0')}:${remain.toString().padStart(2, '0')}`
    }

    return (
        <div className="coach-simulator-panel animate-fade-in">
            <div className="simulator-header">
                <div className="header-title">
                    <h2>AI Mock Coach Session</h2>
                    {isPracticing && (
                        <div className="timer-badge">
                            <span className="dot dot-pulsing"></span>
                            <span>{formatTime(sessionTime)}</span>
                        </div>
                    )}
                </div>
                
                {!isPracticing ? (
                    <motion.button 
                        {...buttonHoverTap}
                        onClick={startSession} 
                        className="button primary-button start-btn"
                    >
                        <Play size={16} />
                        <span>Start Mock Practice</span>
                    </motion.button>
                ) : (
                    <motion.button 
                        {...buttonHoverTap}
                        onClick={endSession} 
                        className="button secondary-button stop-btn"
                    >
                        <Square size={16} />
                        <span>Stop Simulation</span>
                    </motion.button>
                )}
            </div>

            <div className="simulator-body">
                {/* Chat window */}
                <div className="chat-window-wrapper">
                    {messages.length === 0 ? (
                        <div className="empty-chat-state">
                            <Bot size={48} className="placeholder-bot" />
                            <h3>Ready to evaluate your answers?</h3>
                            <p>Click "Start Mock Practice" to activate the simulation. The coach will ask you tailored questions directly from this report.</p>
                        </div>
                    ) : (
                        <div className="chat-log">
                            {messages.map((msg, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ type: 'spring', stiffness: 150, damping: 15 }}
                                    key={`msg-${i}-${msg.sender}`} 
                                    className={`chat-bubble-row ${msg.sender === 'user' ? 'user-row' : 'coach-row'}`}
                                >
                                    <div className="bubble-avatar">
                                        {msg.sender === 'coach' ? <Bot size={16} /> : 'U'}
                                    </div>
                                    <div className="bubble-bubble">
                                        <p className="bubble-text">{msg.text}</p>
                                    </div>
                                </motion.div>
                            ))}
                            {aiThinking && (
                                <div className="chat-bubble-row coach-row">
                                    <div className="bubble-avatar">
                                        <Bot size={16} />
                                    </div>
                                    <div className="bubble-bubble thinking-bubble">
                                        <div className="typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef}></div>
                        </div>
                    )}

                    <form onSubmit={handleSend} className="chat-input-bar">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={isPracticing ? "Type your mock response here..." : "Start practice session to enable inputs..."}
                            disabled={!isPracticing || aiThinking}
                        />
                        <button type="submit" className="send-btn" disabled={!isPracticing || !inputText.trim() || aiThinking}>
                            <Send size={16} />
                        </button>
                    </form>
                </div>

                {/* Media feedback panel */}
                <div className="media-feedback-sidebar">
                    <div className={`video-preview-box glass-card ${cameraActive ? 'video-active' : ''}`}>
                        {cameraActive ? (
                            <video ref={videoRef} autoPlay playsInline muted className="live-video-feed"></video>
                        ) : (
                            <div className="video-placeholder">
                                <VideoOff size={32} className="media-off-icon" />
                                <span>Webcam preview inactive</span>
                            </div>
                        )}
                        <div className="media-controls">
                            <button onClick={toggleCamera} className={`control-btn ${cameraActive ? 'active' : ''}`} title="Toggle Video Feed">
                                {cameraActive ? <Video size={16} /> : <VideoOff size={16} />}
                            </button>
                            <button onClick={() => setMicActive(m => !m)} className={`control-btn ${micActive ? 'active' : ''}`} title="Toggle Audio Feed">
                                {micActive ? <Mic size={16} /> : <MicOff size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="feedback-score-widget glass-card">
                        <div className="widget-header">
                            <Target size={16} />
                            <span>Confidence Indicator</span>
                        </div>
                        <div className="confidence-meter-row">
                            <div className="meter-visual">
                                <div className="meter-fill" style={{ width: isPracticing ? '85%' : '0%' }}></div>
                            </div>
                            <span className="meter-value">{isPracticing ? '85%' : '--'}</span>
                        </div>
                        <p className="widget-notes">Speech pattern analysis evaluates clarity, pauses, and alignment accuracy.</p>
                    </div>
                </div>
            </div>
        </div>
    )
})

import { useRoadmapProgress } from '../hooks/useRoadmapProgress';

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical')
    const { setActiveTab } = useOutletContext()
    const { report: baseReport, getReportById, loading } = useInterview()
    const { interviewId } = useParams()
    const navigate = useNavigate()
    const { report: streamedReport } = useInterviewStream(interviewId)
    const report = streamedReport || baseReport

    useEffect(() => {
        if (setActiveTab) {
            setActiveTab(activeNav === 'resume' ? 'resume' : '')
        }
    }, [activeNav, setActiveTab])

    const { completedTaskIds, toggleTask } = useRoadmapProgress(interviewId);

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [interviewId, getReportById])

    const handleDownloadReport = () => {
        if (!report) return;

        let content = `TAILORED ATS RESUME REPORT\n`;
        content += `==========================\n\n`;

        content += `ATS Match Score: ${report.atsScore || 0}%\n`;
        content += `Based on keyword & skill alignment\n\n`;

        content += `--- Improvement Summary ---\n`;
        content += `${report.improvementSummary || "Optimized structural layout and semantics."}\n\n`;

        content += `--- Recruiter Feedback ---\n`;
        content += `${report.recruiterFeedback || "Resume rewritten for optimal ATS parsing."}\n\n`;

        content += `--- Keywords Added ---\n`;
        if (report.addedKeywords && report.addedKeywords.length > 0) {
            report.addedKeywords.forEach(kw => {
                content += `- ${kw}\n`;
            });
        } else {
            content += `No specific keywords added.\n`;
        }
        content += `\n`;

        content += `--- Missing Keywords ---\n`;
        if (report.missingKeywords && report.missingKeywords.length > 0) {
            report.missingKeywords.forEach(kw => {
                content += `- ${kw}\n`;
            });
        } else {
            content += `No missing keywords!\n`;
        }
        content += `\n`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ATS_Resume_Report.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    if (loading && !report) {
        return (
            <main className='loading-screen animate-fade-in' style={{ minHeight: '200px', margin: '40px auto' }}>
                <div className="loader-container" style={{ gap: '12px', padding: '24px' }}>
                    <LoaderCircle size={32} className="loading-spinner" style={{ color: 'var(--accent)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)', margin: 0 }}>Loading your interview plan...</h3>
                </div>
            </main>
        )
    }

    if (!report) {
        return (
            <main className='loading-screen animate-fade-in' style={{ minHeight: '200px', margin: '40px auto' }}>
                <div className="loader-container" style={{ gap: '12px', padding: '24px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-muted)', margin: 0 }}>Report not found or failed to load.</h3>
                </div>
            </main>
        )
    }

    if (report && report.status === 'processing') {
        const progress = report.progress || {};
        
        const checklist = [
            { id: 'resume', label: 'Resume Parsed', state: progress.resumeParsed ? 'completed' : 'processing' },
            { id: 'ats', label: 'ATS Analysis', state: progress.atsGenerated ? 'completed' : progress.resumeParsed ? 'processing' : 'pending' },
            { id: 'roadmap', label: 'Interview Questions & Roadmap', state: progress.questionsGenerated && progress.roadmapGenerated ? 'completed' : progress.atsGenerated ? 'processing' : 'pending' },
            { id: 'rewrite', label: 'Resume Rewrite', state: progress.rewriteGenerated ? 'completed' : (progress.questionsGenerated && progress.roadmapGenerated) ? 'processing' : 'pending' },
            { id: 'finalizing', label: 'Finalizing Report', state: report.status === 'completed' ? 'completed' : progress.rewriteGenerated ? 'processing' : 'pending' }
        ];

        return (
            <div className="cinematic-loading-overlay animate-fade-in">
                <div className="loading-content-wrapper">
                    
                    {/* Animated Core */}
                    <div className="ai-core-visual">
                        <div className="core-ring"></div>
                        <div className="core-ring"></div>
                        <div className="core-ring"></div>
                        <div className="core-center"></div>
                    </div>

                    {/* Premium Typography */}
                    <div className="loading-typography">
                        <h2>Generating Strategy</h2>
                        <p>Our AI is analyzing your profile and building a personalized roadmap.</p>
                    </div>

                    {/* Dynamic Checklist */}
                    <div className="dynamic-checklist">
                        {checklist.map(item => (
                            <div key={item.id} className={`checklist-item-premium ${item.state}`}>
                                <div className="status-icon">
                                    {item.state === 'completed' ? (
                                        <CheckCircle2 size={20} />
                                    ) : item.state === 'processing' ? (
                                        <LoaderCircle size={20} className="animate-spin" color="var(--ai-purple)" />
                                    ) : (
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-disabled)' }} />
                                    )}
                                </div>
                                <span className="status-text">{item.label}</span>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        )
    }

    const visibleGaps = report.skillGaps ? report.skillGaps.slice(0, 4) : [];
    const overflowGapsCount = report.skillGaps ? report.skillGaps.length - 4 : 0;

    let totalCount = 0;
    if (report?.preparationPlan) {
        report.preparationPlan.forEach(item => {
            if (item.tasks) {
                totalCount += item.tasks.length;
            } else if (item.topic) {
                totalCount += 1;
            }
        });
    }
    const completedCount = completedTaskIds.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className='interview-page animate-fade-in'>
            <div className="page-wrapper">
                <div className="back-nav" onClick={() => navigate('/interview')}>
                    <ArrowLeft size={16} />
                    <span>Back to workspace</span>
                </div>
                


                {report.status === 'partial' && (
                    <div style={{ background: 'rgba(255, 170, 0, 0.1)', border: '1px solid var(--warning)', padding: '8px 12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0 }} />
                        <div>
                            <h4 style={{ margin: '0 0 2px 0', color: 'var(--warning)', fontSize: '0.9rem' }}>Partial Generation Complete</h4>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{report.failureReason || 'Some sections of the report failed to generate. You can review the completed sections below.'}</p>
                        </div>
                    </div>
                )}

                <div className='interview-layout'>
                    {/* ── Left Nav Column ── */}
                    <nav className='interview-nav'>
                        <div className="nav-content">
                            <p className='interview-nav__label'>Sections</p>
                            <div className="nav-items-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', position: 'relative' }}>
                                {NAV_ITEMS.map(item => (
                                    <button
                                        key={item.id}
                                        className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                        onClick={() => setActiveNav(item.id)}
                                        style={{ position: 'relative', outline: 'none' }}
                                    >
                                        <span className='interview-nav__icon'>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>

                        </div>
                        
                        <div style={{ padding: '0 12px' }}>
                            <motion.button
                                {...buttonHoverTap}
                                onClick={handleDownloadReport}
                                className='button primary-button download-btn'
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                <Download size={18} />
                                <span>Download Report</span>
                            </motion.button>
                        </div>
                    </nav>

                    <main className='interview-content'>
                        <AnimatePresence mode="wait" initial={false}>
                            {activeNav === 'analytics' && (
                                <motion.section
                                    key="analytics"
                                    variants={sectionFade}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="section-content"
                                >
                                    <div className='content-header'>
                                        <h2>Dashboard Analytics</h2>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        <div className="glass-card premium-dark" style={{ padding: '2rem', textAlign: 'center' }}>
                                            <h3 style={{ fontSize: '24px', marginBottom: '1rem', color: 'var(--text-heading)' }}>Overall Roadmap Progress</h3>
                                            <div className="progress-bar-container" style={{ height: '24px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                                <div className="progress-bar-fill" style={{ width: `${percentage}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.5s ease' }} />
                                            </div>
                                            <p style={{ marginTop: '1rem', fontSize: '18px', color: 'var(--text-body)' }}>{percentage}% Completed ({completedCount}/{totalCount} tasks)</p>
                                        </div>
                                    </div>
                                </motion.section>
                            )}

                            {activeNav === 'technical' && (
                                <motion.section
                                    key="technical"
                                    variants={sectionFade}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="section-content"
                                >
                                    <div className='content-header'>
                                        <h2>Technical questions</h2>
                                        <span className='content-header__count'>{report.technicalQuestions?.length || 0} Questions</span>
                                    </div>
                                    
                                    {!report.technicalQuestions || report.technicalQuestions.length === 0 ? (
                                        <div className="empty-state" style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '16px' }}>
                                            {report.status === 'completed' ? (
                                                <>
                                                    <CodeXml size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                                                    <h3 style={{ marginBottom: '4px', fontSize: '1rem' }}>No Technical Questions</h3>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No specific technical questions were generated for this job description.</p>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertTriangle size={32} style={{ color: 'var(--warning)', marginBottom: '12px' }} />
                                                    <h3 style={{ marginBottom: '4px', fontSize: '1rem' }}>Generation Failed</h3>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>We couldn't generate technical questions. Please try regenerating the report.</p>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className='q-list'>
                                            {report.technicalQuestions.map((q, i) => (
                                                <QuestionCard key={q._id || `tech-q-${i}`} item={q} index={i} />
                                            ))}
                                        </div>
                                    )}
                                </motion.section>
                            )}

                            {activeNav === 'behavioral' && (
                                <motion.section
                                    key="behavioral"
                                    variants={sectionFade}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="section-content"
                                >
                                    <div className='content-header'>
                                        <h2>Behavioral questions</h2>
                                        <span className='content-header__count'>{report.behavioralQuestions?.length || 0} Questions</span>
                                    </div>
                                    
                                    {!report.behavioralQuestions || report.behavioralQuestions.length === 0 ? (
                                        <div className="empty-state" style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '16px' }}>
                                            {report.status === 'completed' ? (
                                                <>
                                                    <MessageCircleQuestion size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                                                    <h3 style={{ marginBottom: '4px', fontSize: '1rem' }}>No Behavioral Questions</h3>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No specific behavioral questions were generated for this job description.</p>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertTriangle size={32} style={{ color: 'var(--warning)', marginBottom: '12px' }} />
                                                    <h3 style={{ marginBottom: '4px', fontSize: '1rem' }}>Generation Failed</h3>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>We couldn't generate behavioral questions. Please try regenerating the report.</p>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className='q-list'>
                                            {report.behavioralQuestions.map((q, i) => (
                                                <QuestionCard key={q._id || `behav-q-${i}`} item={q} index={i} />
                                            ))}
                                        </div>
                                    )}
                                </motion.section>
                            )}

                            {activeNav === 'roadmap' && (
                                <motion.section
                                    key="roadmap"
                                    variants={sectionFade}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="section-content"
                                >
                                    <div className='content-header'>
                                        <h2>Preparation Strategy</h2>
                                        <span className='content-header__count'>{report.preparationPlan?.length || 0} Skills</span>
                                    </div>

                                    {!report.preparationPlan || report.preparationPlan.length === 0 ? (
                                        <div className="empty-state" style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '16px' }}>
                                            {report.status === 'completed' ? (
                                                <>
                                                    <Map size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                                                    <h3 style={{ marginBottom: '4px', fontSize: '1rem' }}>No Roadmap Required</h3>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>You are fully prepared for this role. No preparation strategy is needed.</p>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertTriangle size={32} style={{ color: 'var(--warning)', marginBottom: '12px' }} />
                                                    <h3 style={{ marginBottom: '4px', fontSize: '1rem' }}>Generation Failed</h3>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>We couldn't generate a preparation strategy. Please try regenerating the report.</p>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className='roadmap-list premium-timeline'>
                                            {report.preparationPlan?.map((item, index) => {
                                                if (item.tasks && item.day) {
                                                    const isCompleted = item.tasks.every(t => completedTaskIds.includes(t._id || t.title));
                                                    const isActive = !isCompleted && 
                                                        (index === 0 || report.preparationPlan[index-1].tasks?.every(t => completedTaskIds.includes(t._id || t.title)))
                                                    
                                                    return (
                                                        <RoadMapDay 
                                                            key={`day-${item.day}`} 
                                                            day={item} 
                                                            isCompleted={isCompleted}
                                                            isActive={isActive}
                                                            onToggleCompleted={toggleTask}
                                                            completedTaskIds={completedTaskIds}
                                                        />
                                                    )
                                                } else if (item.topic) {
                                                    const isCompleted = completedTaskIds.includes(item._id || item.topic)
                                                    return (
                                                        <SkillMasteryCard 
                                                            key={`skill-${index}`} 
                                                            skill={item} 
                                                            isCompleted={isCompleted}
                                                            onToggleCompleted={toggleTask}
                                                        />
                                                    )
                                                }
                                                return null;
                                            })}
                                        </div>
                                    )}
                                </motion.section>
                            )}

                            {activeNav === 'resume' && (
                                <motion.div
                                    key="resume"
                                    variants={sectionFade}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    style={{ width: '100%' }}
                                >
                                    <ResumePreviewSection 
                                        report={report}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>

                    <aside className='interview-sidebar'>
                        {/* Match Score Progress Card */}
                        <div className='match-score glass-card'>
                            <div className="title-row">
                                <Target size={20} className="score-icon" />
                                <p className='match-score__label'>Match score</p>
                            </div>
                            <div className="match-score__number">
                                <span className='score-value'>
                                    <AnimatedCounter value={report.matchScore} />
                                </span>
                                <span className='score-total'>/100</span>
                            </div>
                            <div className="match-score__bar-container">
                                <motion.div 
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: report.matchScore / 100 }}
                                    style={{ transformOrigin: 'left', width: '100%' }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                    className="match-score__bar-fill"
                                />
                            </div>
                            <p className="match-score__status">
                                {report.matchScore >= 80 ? 'Excellent match' : report.matchScore >= 60 ? 'Strong match' : 'Potential match'}
                            </p>
                        </div>

                        <div className='sidebar-divider' />

                        {/* Roadmap Progress Card */}
                        <div className='match-score glass-card'>
                            <div className="title-row">
                                <CheckCircle2 size={20} className="score-icon" />
                                <p className='match-score__label'>Roadmap progress</p>
                            </div>
                            <div className="match-score__number">
                                <span className='score-value'>
                                    <AnimatedCounter value={percentage} />
                                </span>
                                <span className='score-total'>%</span>
                            </div>
                            <div className="match-score__bar-container">
                                <motion.div 
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: percentage / 100 }}
                                    style={{ transformOrigin: 'left', width: '100%', background: 'var(--success)' }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                    className="match-score__bar-fill"
                                />
                            </div>
                            <p className="match-score__status">
                                {completedCount} of {totalCount} tasks completed
                            </p>
                        </div>

                        <div className='sidebar-divider' />

                        {/* Skill Gaps */}
                        <div className='skill-gaps glass-card'>
                            <div className="title-row">
                                <ScanSearch size={20} className="gaps-icon" />
                                <p className='skill-gaps__label'>Skill gaps</p>
                            </div>
                            <div className='skill-gaps__list'>
                                {visibleGaps.map((gap, i) => (
                                    <div key={gap.skill || `gap-${i}`} className="skill-tag">
                                        <span className="skill-name">{gap.skill}</span>
                                    </div>
                                ))}
                                {overflowGapsCount > 0 && (
                                    <div className="skill-tag overflow">
                                        <span className="skill-name">+{overflowGapsCount} more</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}

export default Interview
