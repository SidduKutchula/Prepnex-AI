import React, { useContext } from 'react';
import { ResumeContext } from '../context/ResumeContext';
import { Layout, Check } from 'lucide-react';

const TEMPLATES = [
    { id: 'classic', label: 'Classic ATS', desc: 'Recruiter-approved traditional format', color: '#3b82f6' },
    { id: 'modern', label: 'Modern', desc: 'Clean layout with blue accent bars', color: '#2563eb' },
    { id: 'minimal', label: 'Minimalist', desc: 'Maximum whitespace, elegant dividers', color: '#64748b' },
    { id: 'developer', label: 'Developer', desc: 'Tech stack prominence & code styling', color: '#0ea5e9' },
    { id: 'google', label: 'Google Tech', desc: 'Hyper-compact 1-page tech corporate layout', color: '#ea4335' },
    { id: 'microsoft', label: 'Microsoft', desc: 'Corporate navy blue executive design', color: '#0078d4' },
    { id: 'executive', label: 'Executive', desc: 'Leadership hierarchy & serif typography', color: '#0f172a' },
    { id: 'academic', label: 'Academic', desc: 'Research & publication-first hierarchy', color: '#8b5cf6' }
];

export const ResumeTemplateSwitcher = () => {
    const context = useContext(ResumeContext);
    if (!context) return null;

    const { activeTemplate, setActiveTemplate } = context;

    return (
        <div className="template-switcher-container">
            <div className="switcher-header">
                <Layout size={16} />
                <span>Resume Templates</span>
            </div>
            
            <div className="template-cards-grid">
                {TEMPLATES.map(tpl => {
                    const isSelected = activeTemplate === tpl.id;
                    return (
                        <div
                            key={tpl.id}
                            className={`template-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => setActiveTemplate(tpl.id)}
                        >
                            <div className="card-top">
                                <span className="tpl-badge" style={{ backgroundColor: tpl.color }}></span>
                                <span className="tpl-title">{tpl.label}</span>
                                {isSelected && <Check size={14} className="check-icon" />}
                            </div>
                            <p className="tpl-desc">{tpl.desc}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ResumeTemplateSwitcher;
