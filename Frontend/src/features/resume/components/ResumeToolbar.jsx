import React, { useContext } from 'react';
import { ResumeContext } from '../resume.context';
import { ResumeTemplateSwitcher } from './ResumeTemplateSwitcher';
import { ResumeDownload } from './ResumeDownload';
import { Edit3, Eye, Sparkles, Target } from 'lucide-react';

export const ResumeToolbar = ({ atsScore = 95, reportId }) => {
    return (
        <div className="resume-toolbar-container glass-card">
            <div className="toolbar-left">
                <div className="ats-score-pill">
                    <Target size={16} className="pill-icon" />
                    <span className="pill-label">ATS Score:</span>
                    <span className="pill-value">{atsScore}%</span>
                </div>
            </div>

            <div className="toolbar-center">
                <ResumeTemplateSwitcher />
            </div>

            <div className="toolbar-right">
                <ResumeDownload reportId={reportId} />
            </div>
        </div>
    );
};

export default ResumeToolbar;
