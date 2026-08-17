import React, { useContext } from 'react';
import { ResumeContext } from '../context/ResumeContext';
import { useResumePdf } from '../hooks/useResumePdf';
import { Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ResumeDownload = () => {
    const context = useContext(ResumeContext);
    const { generatePdf, isGenerating, step, error } = useResumePdf();

    if (!context) return null;

    const { resumeData, activeTemplate } = context;

    const handleDownload = async () => {
        if (!resumeData || isGenerating) return;
        const candidateName = (resumeData.name || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${candidateName}_${activeTemplate}_ATS_Resume.pdf`;
        await generatePdf(resumeData, activeTemplate, filename);
    };

    return (
        <div className="resume-download-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <button
                type="button"
                className={`download-resume-btn primary-btn ${isGenerating ? 'generating' : ''}`}
                onClick={handleDownload}
                disabled={isGenerating}
                title="Download ATS-Optimized PDF Resume"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    background: 'var(--accent)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                }}
            >
                {isGenerating ? (
                    <>
                        <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                        <span>{step || 'Generating PDF...'}</span>
                    </>
                ) : (
                    <>
                        <Download size={16} />
                        <span>Download ATS Resume</span>
                    </>
                )}
            </button>
            {error && (
                <div className="download-error-msg" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--error)', fontSize: '11px', marginTop: '4px' }}>
                    <AlertCircle size={12} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};

export default ResumeDownload;
