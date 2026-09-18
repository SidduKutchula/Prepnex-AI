import React, { useEffect, useState } from 'react';
import { useInterview } from '../hooks/useInterview';
import { ResumeProvider } from '../../resume/resume.context';
import { ResumeToolbar } from '../../resume/components/ResumeToolbar';
import { ResumePreview } from '../../resume/components/ResumePreview';
import { ResumeBotModal } from '../../resume/components/ResumeBotModal';
import { useNavigate } from 'react-router';
import { UploadCloud, WandSparkles, FileText, Bot } from 'lucide-react';
import '../style/home.scss';

const ResumeContent = ({ report, onOpenBot }) => {
    return (
        <div className="resume-builder-workspace animate-fade-in">
            <ResumeToolbar atsScore={report?.atsScore || 95} reportId={report?._id} />
            <div className="builder-single-preview" style={{ display: 'flex', justifyContent: 'center', margin: '24px auto', maxWidth: '850px' }}>
                <ResumePreview />
            </div>
        </div>
    );
};

const Resume = () => {
    const { getReports, reports, loading } = useInterview();
    const [latestReport, setLatestReport] = useState(null);
    const [isBotOpen, setIsBotOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        const fetchLatest = async () => {
            const res = await getReports();
            if (res.success && res.data && res.data.length > 0 && isMounted) {
                // Find latest report that has a rewritten resume HTML or just latest
                const withResume = res.data.find(r => r.rewrittenResumeHtml) || res.data[0];
                setLatestReport(withResume);
            }
        };
        fetchLatest();
        return () => { isMounted = false; };
    }, [getReports]);

    if (loading && !latestReport) {
        return (
            <div className="home-dashboard" style={{ padding: '40px', textAlign: 'center' }}>
                <p className="text-muted">Loading your Resume Intelligence data...</p>
            </div>
        );
    }

    if (!latestReport || !latestReport.rewrittenResumeHtml) {
        return (
            <div className="home-dashboard animate-fade-in">
                <header className="dashboard-header">
                    <div className="header-left">
                        <h1 className="greeting">Resume Intelligence</h1>
                        <p className="subtitle">Optimize and build recruiter-ready ATS resumes from your target job description.</p>
                    </div>
                </header>

                <div className="glass-card" style={{ padding: '48px', textAlign: 'center', maxWidth: '640px', margin: '40px auto' }}>
                    <FileText size={48} style={{ color: 'var(--accent)', marginBottom: '16px' }} />
                    <h2 style={{ marginBottom: '8px', color: 'var(--text-heading)' }}>Build or Optimize Your ATS Resume</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '28px', lineHeight: '1.6' }}>
                        Create a recruiter-ready resume step-by-step with our conversational AI Resume Bot, or upload your existing resume with a job description for full strategy analysis.
                    </p>
                    <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button 
                            className="primary-btn pulse-glow" 
                            onClick={() => setIsBotOpen(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Bot size={18} />
                            Chat with AI Resume Bot
                        </button>
                        <button 
                            className="secondary-btn" 
                            onClick={() => navigate('/interview')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <WandSparkles size={18} />
                            Generate from Job Description
                        </button>
                    </div>
                </div>

                <ResumeProvider>
                    <ResumeBotModal isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} />
                </ResumeProvider>
            </div>
        );
    }

    return (
        <div className="home-dashboard animate-fade-in">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1 className="greeting">Resume Intelligence</h1>
                    <p className="subtitle">Live ATS Resume Builder & PDF Generation Engine for {latestReport.title || 'Target Role'}.</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        className="secondary-btn" 
                        onClick={() => setIsBotOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Bot size={18} />
                        AI Resume Bot
                    </button>
                    <button className="primary-btn" onClick={() => navigate('/interview')}>
                        <UploadCloud size={18} />
                        New Analysis
                    </button>
                </div>
            </header>

            <ResumeProvider initialHtml={latestReport.rewrittenResumeHtml} reportData={latestReport}>
                <ResumeContent report={latestReport} onOpenBot={() => setIsBotOpen(true)} />
                <ResumeBotModal isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} />
            </ResumeProvider>
        </div>
    );
};

export default Resume;
