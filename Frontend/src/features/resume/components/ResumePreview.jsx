import React, { useContext, useState } from 'react';
import { ResumeContext } from '../resume.context';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { groupSkillsIntoCategories } from '../utils/atsOptimizer';

export const ResumePreview = () => {
    const context = useContext(ResumeContext);
    const [zoom, setZoom] = useState(100);

    if (!context) return null;

    const { resumeData, activeTemplate } = context;
    const data = resumeData || {};

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 15, 150));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 15, 60));
    const handleResetZoom = () => setZoom(100);

    const formattedSkills = groupSkillsIntoCategories(data.skills || []);
    const candidateName = data.name && data.name.trim() !== '' && !/^(software engineer|full stack|developer)/i.test(data.name) 
        ? data.name 
        : 'SIDDU KUTCHULA';

    return (
        <div className="resume-preview-column">
            <div className="preview-controls-bar">
                <span className="controls-label">Live A4 Paper Preview</span>
                <div className="zoom-buttons">
                    <button type="button" onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={14} /></button>
                    <span className="zoom-text">{zoom}%</span>
                    <button type="button" onClick={handleZoomIn} title="Zoom In"><ZoomIn size={14} /></button>
                    <button type="button" onClick={handleResetZoom} title="Reset Zoom"><Maximize2 size={13} /></button>
                </div>
            </div>

            <div className={`resume-paper-preview template-${activeTemplate}`}>
                <div className="resume-sheet" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
                
                {/* --- HEADER --- */}
                <header className="resume-header centered-header">
                    <h1 className="name">{candidateName}</h1>
                    {data.title && <h2 className="title">{data.title}</h2>}

                    <div className="contact-row centered-contact">
                        {data.phone && <span className="contact-item">{data.phone}</span>}
                        {data.email && <span className="contact-item">{data.email}</span>}
                        {data.linkedin && <span className="contact-item">{data.linkedin.replace(/^https?:\/\//, '')}</span>}
                        {data.github && <span className="contact-item">{data.github.replace(/^https?:\/\//, '')}</span>}
                    </div>
                </header>

                {/* --- PROFESSIONAL SUMMARY --- */}
                {data.summary && (
                    <section className="resume-section">
                        <h3 className="section-title">PROFESSIONAL SUMMARY</h3>
                        <p className="summary-text">{data.summary}</p>
                    </section>
                )}

                {/* --- TECHNICAL PROFICIENCIES --- */}
                {formattedSkills && formattedSkills.length > 0 && (
                    <section className="resume-section">
                        <h3 className="section-title">TECHNICAL PROFICIENCIES</h3>
                        <div className="technical-grid">
                            {formattedSkills.map((skillItem, idx) => {
                                const parts = typeof skillItem === 'string' ? skillItem.split(':') : [skillItem];
                                const category = parts.length > 1 ? parts[0].trim() : 'Technical Skills';
                                const value = parts.length > 1 ? parts.slice(1).join(':').trim() : skillItem;
                                return (
                                    <div key={idx} className="tech-row">
                                        <span className="tech-label">{category}</span>
                                        <span className="tech-value">{value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* --- PROJECTS --- */}
                {data.projects && data.projects.length > 0 && (
                    <section className="resume-section">
                        <h3 className="section-title">PROJECTS</h3>
                        {data.projects.map((proj, idx) => (
                            <div key={idx} className="resume-entry">
                                <div className="entry-header">
                                    <span className="entry-role">{proj.name}</span>
                                    {proj.dates && <span className="entry-dates">{proj.dates}</span>}
                                </div>
                                <div className="entry-sub-header">
                                    {proj.tech && <span className="entry-tech-italic">{proj.tech}</span>}
                                    <span className="entry-links">
                                        <a href={proj.sourceUrl || '#'} target="_blank" rel="noreferrer">Source Code</a>
                                        {' — '}
                                        <a href={proj.demoUrl || '#'} target="_blank" rel="noreferrer">Live Demo</a>
                                    </span>
                                </div>
                                {proj.bullets && proj.bullets.length > 0 && (
                                    <ul className="entry-bullets">
                                        {proj.bullets.map((b, bIdx) => (
                                            <li key={bIdx}>{b}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {/* --- WORK EXPERIENCE --- */}
                {data.experience && data.experience.length > 0 && (
                    <section className="resume-section">
                        <h3 className="section-title">WORK EXPERIENCE</h3>
                        {data.experience.map((exp, idx) => (
                            <div key={idx} className="resume-entry">
                                <div className="entry-header">
                                    <span className="entry-role">{exp.role} {exp.company ? `– ${exp.company}` : ''}</span>
                                    {exp.dates && <span className="entry-dates">{exp.dates}</span>}
                                </div>
                                {exp.bullets && exp.bullets.length > 0 && (
                                    <ul className="entry-bullets">
                                        {exp.bullets.map((b, bIdx) => (
                                            <li key={bIdx}>{b}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {/* --- ACHIEVEMENTS --- */}
                {data.achievements && data.achievements.length > 0 && (
                    <section className="resume-section">
                        <h3 className="section-title">ACHIEVEMENTS</h3>
                        <ul className="entry-bullets">
                            {data.achievements.map((item, idx) => (
                                <li key={idx}>{item}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* --- CERTIFICATIONS --- */}
                {data.certifications && data.certifications.length > 0 && (
                    <section className="resume-section">
                        <h3 className="section-title">CERTIFICATIONS</h3>
                        <ul className="entry-bullets">
                            {data.certifications.map((cert, idx) => (
                                <li key={idx}>{cert}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* --- EDUCATION --- */}
                {data.education && data.education.length > 0 && (
                    <section className="resume-section">
                        <h3 className="section-title">EDUCATION</h3>
                        {data.education.map((edu, idx) => (
                            <div key={idx} className="resume-entry">
                                <div className="entry-header">
                                    <span className="entry-role" style={{ maxWidth: '75%' }}>{edu.degree}</span>
                                    {edu.dates && <span className="entry-dates">{edu.dates}</span>}
                                </div>
                                {edu.institution && (
                                    <div className="entry-sub-header">
                                        <span className="entry-tech-italic">{edu.institution}</span>
                                        {edu.gpa && <span style={{ fontWeight: 600, fontSize: '10px', color: '#0f172a' }}>{edu.gpa}</span>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>
                )}

            </div>
        </div>
    </div>
);
};

export default ResumePreview;
