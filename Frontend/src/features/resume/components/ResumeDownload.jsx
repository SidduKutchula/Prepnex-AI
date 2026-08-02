import React, { useContext } from 'react';
import { ResumeContext } from '../resume.context';
import { useResumePdf } from '../hooks/useResumePdf';
import { Download, LoaderCircle, CheckCircle2 } from 'lucide-react';

export const ResumeDownload = ({ reportId }) => {
    const context = useContext(ResumeContext);
    const { generatePdf, isGenerating, step, error } = useResumePdf();

    if (!context) return null;

    const { getOptimizedData, activeTemplate } = context;

    const handleDownload = async () => {
        const data = getOptimizedData();
        await generatePdf(data, activeTemplate);
    };

    return (
        <div className="resume-download-wrapper">
            <button
                type="button"
                className={`download-resume-btn primary-btn ${isGenerating ? 'generating' : ''}`}
                onClick={handleDownload}
                disabled={isGenerating}
            >
                {isGenerating ? (
                    <>
                        <LoaderCircle size={18} className="animate-spin" />
                        <span>{step || 'Generating PDF...'}</span>
                    </>
                ) : step === 'Download Complete' ? (
                    <>
                        <CheckCircle2 size={18} color="var(--success)" />
                        <span>Download Complete!</span>
                    </>
                ) : (
                    <>
                        <Download size={18} />
                        <span>Download ATS Resume (PDF)</span>
                    </>
                )}
            </button>

            {error && (
                <p className="download-error-msg">{error}</p>
            )}
        </div>
    );
};

export default ResumeDownload;
