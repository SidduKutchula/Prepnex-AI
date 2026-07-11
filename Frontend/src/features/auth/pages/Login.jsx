import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'
import { 
    BrainCircuit, 
    FileText, 
    Target, 
    Mic, 
    LineChart,
    CheckCircle2,
    Lock,
    ArrowLeft
} from 'lucide-react'
import '../auth.form.scss'

const PREVIEW_ITEMS = [
    'Resume Analysis',
    'ATS Score',
    'Interview Readiness',
    'Skill Gap Analysis',
    'Roadmap',
    'Mock Interview',
    'Question Preview'
]

const Login = () => {
    const { loginWithGoogle, user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || '/interview'

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [previewIndex, setPreviewIndex] = useState(0)

    // Cycle preview items
    useEffect(() => {
        const interval = setInterval(() => {
            setPreviewIndex(prev => (prev + 1) % PREVIEW_ITEMS.length)
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    // Skip login if already authenticated
    useEffect(() => {
        if (user) {
            navigate(from, { replace: true })
        }
    }, [user, navigate, from])

    const handleGoogleSuccess = async (credentialResponse) => {
        if (submitting) return;
        setError("")
        setSubmitting(true)
        try {
            const response = await loginWithGoogle(credentialResponse.credential)
            if (response.success) {
                navigate(from, { replace: true })
            } else {
                setError(response.error || "Google authentication failed. Please try again.")
            }
        } catch {
            setError("Something went wrong with Google authentication.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleGoogleError = () => {
        setError("Google sign-in popup closed or failed.")
    }

    // Animation variants
    const pageFade = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } }
    }

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const fadeUp = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
    }

    return (
        <motion.main 
            className="auth-page-premium"
            variants={pageFade}
            initial="hidden"
            animate="visible"
        >
            <div className="bg-mesh" />
            <div className="bg-noise" />

            {/* Back to Home Link */}
            <Link to="/" className="back-to-home-premium">
                <ArrowLeft size={16} />
                <span>Back to Home</span>
            </Link>

            <div className="auth-layout-grid">
                
                {/* ── LEFT SIDE: Story & Features ── */}
                <div className="auth-left">
                    <motion.div 
                        className="left-content"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.h1 variants={fadeUp} className="hero-heading">
                            Prepare Smarter.<br/>Get Hired Faster.
                        </motion.h1>
                        
                        <motion.p variants={fadeUp} className="hero-subtitle">
                            AI-powered interview preparation that analyzes your resume, understands your target job description, identifies skill gaps, generates personalized interview questions, optimizes your ATS score, and guides you with a structured preparation roadmap.
                        </motion.p>

                        {/* Features have been removed for a cleaner look */}

                        <motion.div variants={fadeUp} className="preview-carousel-container">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={previewIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="preview-pill"
                                >
                                    <BrainCircuit size={16} color="#4F46E5" />
                                    <span>{PREVIEW_ITEMS[previewIndex]}</span>
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                </div>

                {/* ── RIGHT SIDE: Authentication ── */}
                <div className="auth-right">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                        className="auth-card-glass"
                    >
                        <Link to="/" style={{ textDecoration: 'none' }}>
                            <div className="brand-logo-center">
                                <BrainCircuit size={28} />
                                <span>Interview AI</span>
                            </div>
                        </Link>

                        <h2>Welcome Back</h2>
                        <p className="auth-desc">
                            Continue with your Google account to access your personalized Interview AI workspace.
                        </p>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="auth-toast-error"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="google-btn-wrapper" style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                            <button 
                                className="btn-google"
                                disabled={submitting}
                                style={{ width: '100%' }}
                            >
                                {submitting ? (
                                    <div className="auth-spinner"></div>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                        </svg>
                                        <span>Continue with Google</span>
                                    </>
                                )}
                            </button>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.0001, zIndex: 10, display: submitting ? 'none' : 'block' }}>
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                />
                            </div>
                        </div>

                        <div className="divider">
                            <Lock size={12} style={{ marginRight: '6px' }} />
                            Secure Authentication
                        </div>

                        <div className="trust-row">
                            <div className="trust-item">
                                <CheckCircle2 size={16} />
                                <span>Secure Google Authentication</span>
                            </div>
                            <div className="trust-item">
                                <CheckCircle2 size={16} />
                                <span>No Password Required</span>
                            </div>
                            <div className="trust-item">
                                <CheckCircle2 size={16} />
                                <span>Your data stays private</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.main>
    )
}

export default Login