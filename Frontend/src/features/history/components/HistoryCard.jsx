import React from 'react';
import { MoreVertical, Download, Play, BarChart2, Star, Trash2 } from 'lucide-react';
import { useHistory } from '../hooks/useHistory';
import { useNavigate } from 'react-router';
import '../style/history.scss';

const HistoryCard = ({ data }) => {
    const { toggleFavorite, deleteHistory } = useHistory();
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const getAtsColor = (score) => {
        if (!score) return 'var(--text-muted)';
        if (score >= 95) return 'var(--success)';
        if (score >= 80) return 'var(--accent)';
        if (score >= 60) return 'var(--warning)';
        return 'var(--error)';
    };

    return (
        <div className={`history-card ${data.status === 'failed' ? 'card--failed' : ''}`}>
            {data.status === 'failed' && (
                <div className="card-badge badge-error" style={{ position: 'absolute', top: '-10px', right: '10px', background: 'var(--error)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Failed Generation</div>
            )}
            {data.status === 'partial' && (
                <div className="card-badge badge-warning" style={{ position: 'absolute', top: '-10px', right: '10px', background: 'var(--warning)', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Partial Generation</div>
            )}
            <div className="card-header">
                <div className="company-info">
                    <div className="company-logo">
                        {data.company ? data.company.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <h3>{data.company || "Unknown Company"}</h3>
                        <p className="job-title">{data.title}</p>
                    </div>
                </div>
                <button className={`favorite-btn ${data.favorite ? 'active' : ''}`} onClick={() => toggleFavorite(data._id)}>
                    <Star size={20} fill={data.favorite ? "var(--warning)" : "none"} stroke={data.favorite ? "var(--warning)" : "currentColor"} />
                </button>
            </div>

            <div className="card-metrics">
                <div className="metric-box">
                    <span className="metric-value" style={{ color: getAtsColor(data.atsScore) }}>
                        {data.atsScore || 0}
                    </span>
                    <span className="metric-label">ATS Score</span>
                </div>
                <div className="metric-box">
                    <span className="metric-value" style={{ color: getAtsColor(data.matchScore) }}>
                        {data.matchScore || 0}%
                    </span>
                    <span className="metric-label">Match</span>
                </div>
                <div className="metric-box">
                    <span className="metric-value text-blue">
                        {data.readinessScore || 0}%
                    </span>
                    <span className="metric-label">Readiness</span>
                </div>
            </div>

            <div className="card-progress">
                <div className="progress-labels">
                    <span>Preparation Progress</span>
                    <span>{data.progress || 0}%</span>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${data.progress || 0}%` }}></div>
                </div>
            </div>

            <div className="card-footer">
                <div className="dates">
                    <span className="created-date">Created {new Date(data.createdAt).toLocaleDateString()}</span>
                    {data.interviewDate && (
                        <span className="interview-date">Interview: {new Date(data.interviewDate).toLocaleDateString()}</span>
                    )}
                </div>

                <div className="card-actions-wrapper" onMouseLeave={() => setIsMenuOpen(false)}>
                    <button className="icon-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <MoreVertical size={20} />
                    </button>
                    {isMenuOpen && (
                        <div className="action-dropdown">
                            <button onClick={() => navigate(`/interview/${data._id}`)}>
                                <BarChart2 size={16} /> View Report
                            </button>
                            <button onClick={() => navigate(`/preparation?id=${data._id}`)}>
                                <Play size={16} /> Continue Prep
                            </button>
                            <button onClick={() => {}}>
                                <Download size={16} /> Download PDF
                            </button>
                            <button className="delete-action" onClick={() => deleteHistory(data._id)}>
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryCard;
