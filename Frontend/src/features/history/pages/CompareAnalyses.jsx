import React, { useState, useEffect } from 'react';
import { useHistory } from '../hooks/useHistory';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import '../style/history.scss';

const CompareAnalyses = () => {
    const { history, fetchHistory, compareHistory, loading } = useHistory();
    const navigate = useNavigate();
    
    const [selectedId1, setSelectedId1] = useState('');
    const [selectedId2, setSelectedId2] = useState('');
    const [comparisonData, setComparisonData] = useState(null);

    useEffect(() => {
        fetchHistory(); // Fetch all history items for dropdowns
    }, [fetchHistory]);

    const handleCompare = async () => {
        if (!selectedId1 || !selectedId2) return;
        const data = await compareHistory(selectedId1, selectedId2);
        if (data) {
            setComparisonData(data);
        }
    };

    return (
        <div className="history-dashboard">
            <header className="history-page-header animate-fade-in">
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/history')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowLeft size={16} /> Back to History
                    </button>
                    <h1 className="greeting">Compare Analyses</h1>
                    <p className="subtitle">Select two historical analyses to compare progress and skill acquisition.</p>
                </div>
            </header>

            <div className="comparison-controls animate-fade-in" style={{ animationDelay: '0.1s', display: 'flex', gap: '16px', marginBottom: '32px' }}>
                <select 
                    value={selectedId1} 
                    onChange={(e) => setSelectedId1(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', background: '#1e1e2d', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', flex: 1 }}
                >
                    <option value="">Select First Analysis...</option>
                    {history.map(item => (
                        <option key={item._id} value={item._id}>
                            {item.company} ({new Date(item.createdAt).toLocaleDateString()}) - ATS: {item.atsScore}
                        </option>
                    ))}
                </select>

                <select 
                    value={selectedId2} 
                    onChange={(e) => setSelectedId2(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', background: '#1e1e2d', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', flex: 1 }}
                >
                    <option value="">Select Second Analysis...</option>
                    {history.map(item => (
                        <option key={item._id} value={item._id}>
                            {item.company} ({new Date(item.createdAt).toLocaleDateString()}) - ATS: {item.atsScore}
                        </option>
                    ))}
                </select>

                <button 
                    onClick={handleCompare}
                    disabled={!selectedId1 || !selectedId2 || selectedId1 === selectedId2 || loading}
                    style={{ padding: '12px 24px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                    {loading ? 'Comparing...' : 'Compare'}
                </button>
            </div>

            {comparisonData && (
                <div className="comparison-results animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="result-column" style={{ background: '#1e1e2d', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3>{comparisonData.report1.company || 'Analysis 1'}</h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px' }}>{new Date(comparisonData.report1.createdAt).toLocaleDateString()}</p>
                        
                        <div style={{ marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span>ATS Score:</span>
                                <span style={{ fontWeight: 'bold' }}>{comparisonData.report1.atsScore}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span>Match Score:</span>
                                <span style={{ fontWeight: 'bold' }}>{comparisonData.report1.matchScore}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="result-column" style={{ background: '#1e1e2d', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3>{comparisonData.report2.company || 'Analysis 2'}</h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px' }}>{new Date(comparisonData.report2.createdAt).toLocaleDateString()}</p>
                        
                        <div style={{ marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span>ATS Score:</span>
                                <span style={{ fontWeight: 'bold' }}>
                                    {comparisonData.report2.atsScore}
                                    <span style={{ color: comparisonData.comparison.atsDiff >= 0 ? '#4ade80' : '#f87171', marginLeft: '8px', fontSize: '14px' }}>
                                        ({comparisonData.comparison.atsDiff >= 0 ? '+' : ''}{comparisonData.comparison.atsDiff})
                                    </span>
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span>Match Score:</span>
                                <span style={{ fontWeight: 'bold' }}>
                                    {comparisonData.report2.matchScore}%
                                    <span style={{ color: comparisonData.comparison.matchDiff >= 0 ? '#4ade80' : '#f87171', marginLeft: '8px', fontSize: '14px' }}>
                                        ({comparisonData.comparison.matchDiff >= 0 ? '+' : ''}{comparisonData.comparison.matchDiff}%)
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="result-full-width" style={{ gridColumn: '1 / -1', background: '#1e1e2d', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '8px' }}>
                        <h3 style={{ marginBottom: '24px' }}>Skill Gap Evolution</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <h4 style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <CheckCircle size={18} /> Resolved Skill Gaps
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {comparisonData.comparison.resolvedSkillsGaps.length > 0 ? comparisonData.comparison.resolvedSkillsGaps.map((skill, i) => (
                                        <li key={i} style={{ padding: '8px 12px', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', borderRadius: '4px', marginBottom: '8px' }}>
                                            {skill}
                                        </li>
                                    )) : <li style={{ color: '#94a3b8' }}>No gaps resolved yet.</li>}
                                </ul>
                            </div>

                            <div>
                                <h4 style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <XCircle size={18} /> New Skill Gaps (Target Role)
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {comparisonData.comparison.newSkillsGaps.length > 0 ? comparisonData.comparison.newSkillsGaps.map((skill, i) => (
                                        <li key={i} style={{ padding: '8px 12px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', borderRadius: '4px', marginBottom: '8px' }}>
                                            {skill}
                                        </li>
                                    )) : <li style={{ color: '#94a3b8' }}>No new gaps identified.</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompareAnalyses;
