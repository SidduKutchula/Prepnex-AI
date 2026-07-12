import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { useTheme } from '../../../hooks/useTheme.js'

/* eslint-disable-next-line no-unused-vars */
import { motion, AnimatePresence } from 'framer-motion'
import { 
    LayoutDashboard, 
    UserPlus, 
    LogIn, 
    SunMoon, 
    ArrowRight, 
    CodeXml, 
    MessageCircleQuestion, 
    Map, 
    FileText, 
    BrainCircuit, 
    Target,
    Sparkles,
    ChevronDown,
    CheckCircle2,
    Star,
    Users,
    TrendingUp,
    Shield,
    Zap,
    BarChart3,
    ScanSearch,
    FileSearch,
    Gauge,
    Calendar,
    LineChart,
    Bot,
    Clock
} from 'lucide-react'

// â”€â”€ Animation Variants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
}

const stagger = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.08 }
    }
}

const itemReveal = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    }
}

// â”€â”€ FAQ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const faqItems = [
    {
        q: 'How accurate is Prepnex AI?',
        a: 'Our AI engine uses Gemini\'s latest language model fine-tuned on thousands of real interview transcripts from FAANG and top-tier startups. Questions are tailored to your exact job description and skill profile, making them highly relevant and accurate.'
    },
    {
        q: 'How is the ATS score calculated?',
        a: 'We extract key skills, technologies, and role-specific keywords from the job description, then compare them against your resume using semantic similarity scoring. The resulting percentage reflects how well your profile aligns with what the recruiter\'s ATS system is likely filtering for.'
    },
    {
        q: 'Can I upload my own resume?',
        a: 'Yes. You can upload any PDF resume up to 3MB. Our system parses the content using server-side extraction, then matches it against the job description you provide for a personalized analysis.'
    },
    {
        q: 'Can I analyze any job description?',
        a: 'Absolutely. Paste any job posting â€” engineering, product, data science, design, or management â€” and the AI will adapt its analysis and question generation accordingly.'
    },
    {
        q: 'Can I practice behavioral interviews?',
        a: 'Yes. Every report includes a dedicated behavioral section with STAR-format questions tailored to the seniority level and domain of the role you are targeting.'
    },
    {
        q: 'Can I practice technical and system design interviews?',
        a: 'Yes. The platform generates coding questions, system design scenarios, and database questions specific to the technology stack listed in the job description.'
    },
    {
        q: 'Can I export my preparation report?',
        a: 'Yes. Each preparation plan can be exported as a clean, formatted PDF using our server-side rendering engine, ready to print or share.'
    },
    {
        q: 'How does AI generate the questions?',
        a: 'The AI reads both the job description and your profile together, identifies skill gaps, and generates questions an experienced interviewer at that company type would realistically ask â€” including the hidden intention behind each question.'
    },
    {
        q: 'Is my resume stored securely?',
        a: 'Your resume data is processed server-side and stored encrypted. We never share your personal data with third parties, and you can delete your account and all associated data at any time.'
    },
    {
        q: 'Can I reuse and revisit previous reports?',
        a: 'Yes. All your generated reports are saved to your dashboard and accessible at any time. You can revisit, export, and build on previous preparation plans without re-generating from scratch.'
    }
]

const FaqItem = ({ item }) => {
    const [open, setOpen] = useState(false)
    return (
        <motion.div
            variants={itemReveal}
            className={`faq-item ${open ? 'faq-item--open' : ''}`}
            onClick={() => setOpen(o => !o)}
        >
            <div className="faq-item__header">
                <span className="faq-item__q">{item.q}</span>
                <ChevronDown size={18} className={`faq-item__chevron ${open ? 'open' : ''}`} />
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="faq-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="faq-item__body-wrapper"
                    >
                        <p className="faq-item__a">{item.a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const companies = ['Google', 'Meta', 'Amazon', 'Apple', 'Microsoft', 'Netflix', 'Stripe', 'Airbnb']

const testimonials = [
    {
        name: 'Priya Sharma',
        role: 'Software Engineer â†’ Google L5',
        avatar: 'PS',
        rating: 5,
        text: 'I used Prepnex AI for two weeks before my Google loop. The system design questions were scarily accurate. Passed all four rounds â€” my interviewer literally asked about consistent hashing which was in my roadmap.'
    },
    {
        name: 'Marcus Chen',
        role: 'SWE II â†’ Staff Engineer at Meta',
        avatar: 'MC',
        rating: 5,
        text: 'The ATS score analysis showed me exactly which skills I was underselling. I rewrote my resume based on the gap report and got 3x more recruiter responses that same week.'
    },
    {
        name: 'Aisha Williams',
        role: 'ML Researcher â†’ Stripe',
        avatar: 'AW',
        rating: 5,
        text: 'Most prep tools are too generic. Prepnex AI read my actual resume against the Stripe JD and built a roadmap that felt like it was made by someone who knew both sides of the table.'
    }
]

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Intro = () => {
    const { user, loading } = useAuth()
    const { toggleTheme } = useTheme()
    const navigate = useNavigate()

    // Automatically redirect logged-in users to the app so they don't see the landing page
    React.useEffect(() => {
        if (!loading && user) {
            navigate('/interview', { replace: true })
        }
    }, [user, loading, navigate])

    const handleCtaClick = () => {
        if (user) {
            navigate('/interview')
        } else {
            navigate('/login')
        }
    }

    return (
        <div className="intro-page">
            {/* Ambient gradient */}
            <div className="intro-ambient" aria-hidden="true" />

            {/* â”€â”€ Header â”€â”€ */}
            <header className="intro-header">
                <div className="intro-header__container">
                    <div className="brand-logo" onClick={() => navigate('/')}>
                        <BrainCircuit size={22} className="logo-icon" />
                        <span>Prepnex AI</span>
                    </div>

                    <nav className="intro-nav">
                        <a href="#how-it-works" className="intro-nav__link">How it works</a>
                        <a href="#features" className="intro-nav__link">Features</a>
                        <a href="#faq" className="intro-nav__link">FAQ</a>
                    </nav>

                    <div className="intro-header__actions">
                        <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
                            <SunMoon size={18} />
                        </button>

                        {user ? (
                            <button onClick={() => navigate('/interview')} className="button primary-button">
                                <span>Go to App</span>
                                <ArrowRight size={16} className="btn-icon" />
                            </button>
                        ) : (
                            <div className="auth-links">
                                <button onClick={() => navigate('/login')} className="button primary-button">
                                    <span>Get started free</span>
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* â”€â”€ Hero â”€â”€ */}
            <section className="hero-section">
                <div className="hero-container">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="hero-badge"
                    >
                        <Sparkles size={13} />
                        <span>AI-Powered Interview Preparation</span>
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="hero-title"
                    >
                        Crack your next tech interview with <span className="hero-title__accent">AI-powered</span> preparation
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="hero-subtitle"
                    >
                        Paste the job description. Upload your resume. Get a personalized preparation roadmap, tailored mock questions, ATS score, and behavioral checklists â€” ready in under 30 seconds.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="hero-actions"
                    >
                        <button onClick={handleCtaClick} className="button primary-button hero-cta">
                            <span>Start preparing now</span>
                            <ArrowRight size={17} />
                        </button>
                        <a href="#how-it-works" className="button secondary-button">
                            See how it works
                        </a>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="hero-stats"
                    >
                        <div className="hero-stat">
                            <span className="hero-stat__num">50,000+</span>
                            <span className="hero-stat__label">Candidates prepared</span>
                        </div>
                        <div className="hero-stat__divider" aria-hidden="true" />
                        <div className="hero-stat">
                            <span className="hero-stat__num">5,000+</span>
                            <span className="hero-stat__label">Interview questions</span>
                        </div>
                        <div className="hero-stat__divider" aria-hidden="true" />
                        <div className="hero-stat">
                            <span className="hero-stat__num">94%</span>
                            <span className="hero-stat__label">Interview success rate</span>
                        </div>
                    </motion.div>
                </div>

                {/* Hero visual â€” mock dashboard */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="hero-visual"
                >
                    <div className="mock-dashboard glass-card">
                        <div className="mock-dash__header">
                            <div className="mock-dash__dots">
                                <span className="dot dot-red" />
                                <span className="dot dot-yellow" />
                                <span className="dot dot-green" />
                            </div>
                            <span className="mock-dash__title">interview-prep-dashboard</span>
                        </div>
                        <div className="mock-dash__body">
                            <div className="mock-score-row">
                                <div className="mock-score">
                                    <span className="mock-score__label">ATS Match Score</span>
                                    <span className="mock-score__value">92%</span>
                                    <div className="mock-score__bar">
                                        <div className="mock-score__fill" style={{ width: '92%' }} />
                                    </div>
                                </div>
                                <div className="mock-score">
                                    <span className="mock-score__label">Readiness Score</span>
                                    <span className="mock-score__value">87%</span>
                                    <div className="mock-score__bar">
                                        <div className="mock-score__fill" style={{ width: '87%' }} />
                                    </div>
                                </div>
                            </div>
                            <div className="mock-roadmap">
                                <span className="mock-roadmap__label">Preparation roadmap</span>
                                {['Day 1 Â· React Fiber & Render Reconciliation', 'Day 2 Â· System Design: Distributed Cache', 'Day 3 Â· Node.js Event Loop & Clustering'].map((item) => (
                                    <div key={item} className="mock-roadmap__item">
                                        <CheckCircle2 size={13} className="mock-check" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mock-questions">
                                <span className="mock-questions__label">Sample question</span>
                                <p className="mock-questions__text">"Explain how React's concurrent mode scheduler prioritizes work units across multiple fiber trees."</p>
                                <span className="mock-tag">System design</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* â”€â”€ Trusted By â”€â”€ */}
            <section className="companies-section" aria-label="Trusted by candidates from">
                <p className="companies-label">Candidates prepared for interviews at</p>
                <div className="companies-strip">
                    {companies.map(name => (
                        <span key={name} className="company-name">{name}</span>
                    ))}
                </div>
            </section>

            {/* â”€â”€ How It Works â”€â”€ */}
            <section id="how-it-works" className="section how-it-works-section">
                <div className="section__inner">
                    <div className="section-header">
                        <p className="section-eyebrow">Simple process</p>
                        <h2>From job description to interview-ready in minutes</h2>
                        <p className="section-subtitle">Three focused steps replace weeks of scattered preparation.</p>
                    </div>

                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        className="steps-grid"
                    >
                        {[
                            { num: '01', icon: <FileText size={24} />, title: 'Paste job description & upload resume', body: 'Provide the target role\'s job description and either upload your resume PDF or write a brief self-description. That\'s all the input needed.' },
                            { num: '02', icon: <BrainCircuit size={24} />, title: 'AI analyzes, scores, and plans', body: 'The AI reads both documents together, identifies skill gaps, calculates your ATS match score, and generates a day-by-day preparation roadmap.' },
                            { num: '03', icon: <Target size={24} />, title: 'Study, practice, and export', body: 'Expand questions to reveal interview intentions and model answers. Export your full roadmap as a PDF and track your progress over time.' }
                        ].map((step) => (
                            <motion.div key={step.num} variants={itemReveal} className="step-card">
                                <div className="step-card__num">{step.num}</div>
                                <div className="step-card__icon">{step.icon}</div>
                                <h3 className="step-card__title">{step.title}</h3>
                                <p className="step-card__body">{step.body}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* â”€â”€ AI Resume Analysis â”€â”€ */}
            <section className="section feature-showcase-section">
                <div className="section__inner">
                    <div className="showcase-split">
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                            variants={fadeUp}
                            className="showcase-text"
                        >
                            <p className="section-eyebrow">Resume intelligence</p>
                            <h2>AI Resume Analysis & ATS Scoring</h2>
                            <p className="showcase-body">Your resume is parsed against the job description using semantic similarity scoring. The AI identifies missing keywords, underrepresented skills, and formatting issues that could cause ATS rejection.</p>
                            <ul className="showcase-list">
                                <li><CheckCircle2 size={17} /> <span>Semantic keyword matching against JD requirements</span></li>
                                <li><CheckCircle2 size={17} /> <span>Skill gap identification with priority ranking</span></li>
                                <li><CheckCircle2 size={17} /> <span>Actionable improvement suggestions per section</span></li>
                                <li><CheckCircle2 size={17} /> <span>ATS-optimized resume generation with Puppeteer</span></li>
                            </ul>
                        </motion.div>
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                            variants={fadeUp}
                            className="showcase-visual"
                        >
                            <div className="showcase-card glass-card">
                                <div className="showcase-card__header">
                                    <FileSearch size={20} />
                                    <span>Resume Analysis</span>
                                </div>
                                <div className="showcase-card__metric">
                                    <span className="metric-value">92</span>
                                    <span className="metric-unit">/100</span>
                                    <span className="metric-label">ATS Match Score</span>
                                </div>
                                <div className="showcase-card__bars">
                                    {[
                                        { label: 'Technical Skills', value: 95 },
                                        { label: 'Experience Match', value: 88 },
                                        { label: 'Keyword Density', value: 82 },
                                        { label: 'Format Compliance', value: 97 }
                                    ].map((bar) => (
                                        <div key={bar.label} className="bar-item">
                                            <div className="bar-label-row">
                                                <span>{bar.label}</span>
                                                <span className="bar-value">{bar.value}%</span>
                                            </div>
                                            <div className="bar-track">
                                                <div className="bar-fill" style={{ width: `${bar.value}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* â”€â”€ Job Description Matching â”€â”€ */}
            <section className="section feature-showcase-section feature-showcase--alt">
                <div className="section__inner">
                    <div className="showcase-split showcase-split--reverse">
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                            variants={fadeUp}
                            className="showcase-text"
                        >
                            <p className="section-eyebrow">Precision matching</p>
                            <h2>Job Description Intelligence</h2>
                            <p className="showcase-body">The AI reads the full job description â€” not just keywords â€” to understand seniority expectations, team context, and the underlying technical bar. Your preparation is calibrated to what the hiring manager actually needs.</p>
                            <ul className="showcase-list">
                                <li><CheckCircle2 size={17} /> <span>Full semantic analysis, not keyword matching</span></li>
                                <li><CheckCircle2 size={17} /> <span>Seniority-level calibration for questions</span></li>
                                <li><CheckCircle2 size={17} /> <span>Technology stack extraction and mapping</span></li>
                                <li><CheckCircle2 size={17} /> <span>Hidden requirement detection</span></li>
                            </ul>
                        </motion.div>
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                            variants={fadeUp}
                            className="showcase-visual"
                        >
                            <div className="showcase-card glass-card">
                                <div className="showcase-card__header">
                                    <ScanSearch size={20} />
                                    <span>JD Analysis</span>
                                </div>
                                <div className="showcase-card__tags">
                                    {['React', 'Node.js', 'System Design', 'TypeScript', 'AWS', 'CI/CD', 'GraphQL', 'Kubernetes'].map(tag => (
                                        <span key={tag} className="jd-tag">{tag}</span>
                                    ))}
                                </div>
                                <div className="showcase-card__insight">
                                    <BrainCircuit size={16} className="insight-icon" />
                                    <p>This role emphasizes distributed systems experience at Staff+ level. The JD indicates a platform team focused on developer infrastructure.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* â”€â”€ Interview Readiness Score â”€â”€ */}
            <section className="section feature-showcase-section">
                <div className="section__inner">
                    <div className="showcase-split">
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                            variants={fadeUp}
                            className="showcase-text"
                        >
                            <p className="section-eyebrow">Readiness tracking</p>
                            <h2>Interview Readiness Score</h2>
                            <p className="showcase-body">A single number that tells you how prepared you are. Based on your completed roadmap tasks, practice question coverage, and skill gap resolution. Know exactly when you're ready to schedule that interview.</p>
                            <ul className="showcase-list">
                                <li><CheckCircle2 size={17} /> <span>Composite score from multiple preparation signals</span></li>
                                <li><CheckCircle2 size={17} /> <span>Daily progress tracking with streak counter</span></li>
                                <li><CheckCircle2 size={17} /> <span>Weak area identification and prioritization</span></li>
                            </ul>
                        </motion.div>
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                            variants={fadeUp}
                            className="showcase-visual"
                        >
                            <div className="showcase-card glass-card">
                                <div className="showcase-card__header">
                                    <Gauge size={20} />
                                    <span>Readiness Score</span>
                                </div>
                                <div className="readiness-gauge">
                                    <div className="gauge-circle">
                                        <span className="gauge-number">88</span>
                                        <span className="gauge-label">out of 100</span>
                                    </div>
                                    <span className="gauge-badge">Excellent</span>
                                </div>
                                <div className="readiness-breakdown">
                                    <div className="breakdown-item">
                                        <span>Technical</span><span className="breakdown-score">92%</span>
                                    </div>
                                    <div className="breakdown-item">
                                        <span>Behavioral</span><span className="breakdown-score">85%</span>
                                    </div>
                                    <div className="breakdown-item">
                                        <span>System Design</span><span className="breakdown-score">78%</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* â”€â”€ AI Generated Questions â”€â”€ */}
            <section id="features" className="section features-section">
                <div className="section__inner">
                    <div className="section-header">
                        <p className="section-eyebrow">Comprehensive preparation</p>
                        <h2>Everything you need to prepare with confidence</h2>
                        <p className="section-subtitle">Purpose-built tools for each phase of the interview process.</p>
                    </div>

                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        className="features-grid"
                    >
                        {[
                            { icon: <CodeXml size={22} />, color: 'blue', title: 'Technical Mock Questions', body: 'Coding, system design, database, and architecture questions tailored to your exact tech stack and seniority level.' },
                            { icon: <MessageCircleQuestion size={22} />, color: 'purple', title: 'Behavioral Question Prep', body: 'STAR-format behavioral questions matched to the company culture and role expectations, with suggested answer frameworks.' },
                            { icon: <Map size={22} />, color: 'green', title: 'Day-by-Day Roadmap', body: 'A structured, chronological study plan with specific daily tasks â€” no more aimless grinding without direction.' },
                            { icon: <BarChart3 size={22} />, color: 'amber', title: 'ATS Resume Analysis', body: 'Semantic keyword analysis comparing your resume to the job description with actionable improvement suggestions.' },
                            { icon: <FileText size={22} />, color: 'blue', title: 'PDF Export & Resume Builder', body: 'Export your full preparation plan as a formatted PDF. Generate ATS-optimized resume cards with server-side Puppeteer.' },
                            { icon: <Zap size={22} />, color: 'purple', title: 'Interview Intention Reveal', body: 'Understand the "why" behind each question â€” what skill, behavior, or red flag the interviewer is actually probing for.' }
                        ].map((f, i) => (
                            <motion.div key={f.title || `feature-${i}`} variants={itemReveal} className={`feature-card feature-card--${f.color}`}>
                                <div className="feature-card__icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.body}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* â”€â”€ Preparation Timeline Preview â”€â”€ */}
            <section className="section feature-showcase-section feature-showcase--alt">
                <div className="section__inner">
                    <div className="showcase-split showcase-split--reverse">
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                            variants={fadeUp}
                            className="showcase-text"
                        >
                            <p className="section-eyebrow">Structured preparation</p>
                            <h2>Personalized Preparation Timeline</h2>
                            <p className="showcase-body">Not a dump of 500 random questions. A structured, day-by-day roadmap with specific tasks ordered by priority. Each day targets the skills that close the biggest gaps in your profile.</p>
                            <ul className="showcase-list">
                                <li><CheckCircle2 size={17} /> <span>Priority-ordered daily tasks based on skill gaps</span></li>
                                <li><CheckCircle2 size={17} /> <span>Estimated time per task for realistic planning</span></li>
                                <li><CheckCircle2 size={17} /> <span>Progress tracking with completion checkpoints</span></li>
                                <li><CheckCircle2 size={17} /> <span>Exportable as PDF for offline preparation</span></li>
                            </ul>
                        </motion.div>
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                            variants={fadeUp}
                            className="showcase-visual"
                        >
                            <div className="showcase-card glass-card">
                                <div className="showcase-card__header">
                                    <Calendar size={20} />
                                    <span>Preparation Timeline</span>
                                </div>
                                <div className="timeline-preview">
                                    {[
                                        { day: 1, focus: 'React Fiber & Reconciliation', status: 'done' },
                                        { day: 2, focus: 'System Design: Distributed Cache', status: 'done' },
                                        { day: 3, focus: 'Node.js Event Loop & Clustering', status: 'active' },
                                        { day: 4, focus: 'Behavioral: Leadership Scenarios', status: 'pending' },
                                        { day: 5, focus: 'Database Design & Optimization', status: 'pending' }
                                    ].map((item) => (
                                        <div key={item.day} className={`timeline-item timeline-item--${item.status}`}>
                                            <div className="timeline-marker">
                                                {item.status === 'done' ? <CheckCircle2 size={14} /> : <span className="timeline-dot" />}
                                            </div>
                                            <div className="timeline-content">
                                                <span className="timeline-day">Day {item.day}</span>
                                                <span className="timeline-focus">{item.focus}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* â”€â”€ Mock Interview & AI Coach â”€â”€ */}
            <section className="section feature-showcase-section">
                <div className="section__inner">
                    <div className="showcase-split">
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                            variants={fadeUp}
                            className="showcase-text"
                        >
                            <p className="section-eyebrow">Practice with AI</p>
                            <h2>AI Mock Interview Coach</h2>
                            <p className="showcase-body">Practice answering questions in real-time with our AI coach. Get instant feedback on your answer structure, identify gaps in your reasoning, and understand the interviewer's hidden intentions.</p>
                            <ul className="showcase-list">
                                <li><CheckCircle2 size={17} /> <span>Real-time conversational practice sessions</span></li>
                                <li><CheckCircle2 size={17} /> <span>Answer evaluation with structural feedback</span></li>
                                <li><CheckCircle2 size={17} /> <span>Confidence scoring and improvement tracking</span></li>
                                <li><CheckCircle2 size={17} /> <span>Webcam support for body language awareness</span></li>
                            </ul>
                        </motion.div>
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                            variants={fadeUp}
                            className="showcase-visual"
                        >
                            <div className="showcase-card glass-card">
                                <div className="showcase-card__header">
                                    <Bot size={20} />
                                    <span>AI Coach</span>
                                </div>
                                <div className="coach-preview">
                                    <div className="coach-bubble coach-bubble--ai">
                                        <div className="coach-bubble__avatar"><Bot size={14} /></div>
                                        <p>Design a URL shortening service that handles 100M daily active users. Walk me through your approach.</p>
                                    </div>
                                    <div className="coach-bubble coach-bubble--user">
                                        <p>I'd start with the core requirements â€” URL generation, storage, and redirect latency...</p>
                                    </div>
                                    <div className="coach-bubble coach-bubble--ai">
                                        <div className="coach-bubble__avatar"><Bot size={14} /></div>
                                        <p><strong>Good structural approach.</strong> Consider addressing the hash collision strategy and cache invalidation early.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* â”€â”€ Performance Analytics â”€â”€ */}
            <section className="section feature-showcase-section feature-showcase--alt">
                <div className="section__inner">
                    <div className="showcase-split showcase-split--reverse">
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                            variants={fadeUp}
                            className="showcase-text"
                        >
                            <p className="section-eyebrow">Track progress</p>
                            <h2>Performance Analytics</h2>
                            <p className="showcase-body">Track your preparation progress over time. See how your readiness score improves, which skill gaps you've closed, and what areas still need attention before the big day.</p>
                            <ul className="showcase-list">
                                <li><CheckCircle2 size={17} /> <span>Preparation streak tracking with daily milestones</span></li>
                                <li><CheckCircle2 size={17} /> <span>Skill gap closure rate visualization</span></li>
                                <li><CheckCircle2 size={17} /> <span>All reports saved and accessible from dashboard</span></li>
                            </ul>
                        </motion.div>
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                            variants={fadeUp}
                            className="showcase-visual"
                        >
                            <div className="showcase-card glass-card">
                                <div className="showcase-card__header">
                                    <LineChart size={20} />
                                    <span>Analytics</span>
                                </div>
                                <div className="analytics-preview">
                                    <div className="analytics-stat">
                                        <span className="analytics-stat__value">3.2Ã—</span>
                                        <span className="analytics-stat__label">Avg. improvement in interview pass rate</span>
                                    </div>
                                    <div className="analytics-stat">
                                        <span className="analytics-stat__value">94%</span>
                                        <span className="analytics-stat__label">Users advancing to final rounds</span>
                                    </div>
                                    <div className="analytics-stat">
                                        <span className="analytics-stat__value">50k+</span>
                                        <span className="analytics-stat__label">Candidates prepared on platform</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* â”€â”€ Testimonials â”€â”€ */}
            <section className="section testimonials-section">
                <div className="section__inner">
                    <div className="section-header">
                        <p className="section-eyebrow">Success stories</p>
                        <h2>Engineers who prepared smarter</h2>
                        <p className="section-subtitle">Real results from candidates who used Prepnex AI before their final rounds.</p>
                    </div>

                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        className="testimonials-grid"
                    >
                        {testimonials.map((t, i) => (
                            <motion.div key={t.name || `testimonial-${i}`} variants={itemReveal} className="testimonial-card glass-card">
                                <div className="testimonial-card__stars">
                                    {Array.from({ length: t.rating }).map((_, j) => (
                                        <Star key={j} size={14} className="star-filled" />
                                    ))}
                                </div>
                                <p className="testimonial-card__text">"{t.text}"</p>
                                <div className="testimonial-card__author">
                                    <div className="testimonial-card__avatar">{t.avatar}</div>
                                    <div>
                                        <p className="testimonial-card__name">{t.name}</p>
                                        <p className="testimonial-card__role">{t.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* â”€â”€ FAQ â”€â”€ */}
            <section id="faq" className="section faq-section">
                <div className="section__inner faq-inner">
                    <div className="section-header">
                        <p className="section-eyebrow">Common questions</p>
                        <h2>Everything you need to know</h2>
                    </div>

                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        className="faq-list"
                    >
                        {faqItems.map((item, i) => (
                            <FaqItem key={item.q || `faq-${i}`} item={item} />
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* â”€â”€ CTA Banner â”€â”€ */}
            <section className="cta-banner">
                <div className="cta-banner__inner">
                    <h2>Land your next offer</h2>
                    <p>Equip yourself with a personalized roadmap, mock questions, and an ATS-ready resume â€” all in one place.</p>
                    <div className="cta-banner__actions">
                        <button onClick={handleCtaClick} className="button primary-button cta-banner__btn">
                            <span>Start for free</span>
                            <ArrowRight size={17} />
                        </button>
                        <span className="cta-banner__note">No credit card required</span>
                    </div>
                </div>
            </section>

            {/* â”€â”€ Footer â”€â”€ */}
            <footer className="intro-footer">
                <div className="intro-footer__inner">
                    <div className="intro-footer__brand">
                        <BrainCircuit size={18} className="footer-logo-icon" />
                        <span className="footer-brand-name">Prepnex AI</span>
                    </div>
                    <p className="intro-footer__copy">Â© {new Date().getFullYear()} Prepnex AI. Built for serious candidates.</p>
                    <div className="intro-footer__links">
                        <a href="#features">Features</a>
                        <a href="#faq">FAQ</a>
                        <button onClick={() => navigate('/login')}>Sign in</button>
                        <button onClick={() => navigate('/register')}>Get started</button>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Intro
