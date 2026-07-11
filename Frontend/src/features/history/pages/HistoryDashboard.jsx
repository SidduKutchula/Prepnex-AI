import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Target, Bookmark, Download, Trash2, Clock, Activity, Briefcase, BarChart2, GitCommit } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useHistory } from '../hooks/useHistory';
import ProgressCharts from '../components/ProgressCharts';
import HistoryCard from '../components/HistoryCard';
import '../../interview/style/home.scss';
import '../style/history.scss';

import { exportHistoryToPDF } from '../utils/export';

const HistoryDashboard = () => {
    const { history, analytics, loading, fetchHistory, fetchAnalytics, pagination } = useHistory();
    const navigate = useNavigate();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState('newest');

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchHistory({ search: searchQuery, filter, sort, page: 1 });
        }, 500); // debounce search
        return () => clearTimeout(timeoutId);
    }, [searchQuery, filter, sort, fetchHistory]);

    return (
        <div className="history-dashboard">
            <header className="history-page-header animate-fade-in">
                <div className="header-left">
                    <h1 className="greeting">Activity History & Progress Tracking</h1>
                    <p className="subtitle">Your complete timeline of interview preparation, mock performance, and AI-optimized resumes.</p>
                </div>
                <div className="header-actions">
                    <button className="primary-btn compare-btn" onClick={() => navigate('/history/compare')}>
                        <GitCommit size={18} /> Compare Analyses
                    </button>
                    <button className="secondary-btn export-btn" onClick={() => exportHistoryToPDF(history, analytics)}>
                        <Download size={18} /> Export Report
                    </button>
                </div>
            </header>

            {analytics && history.length > 0 && (
                <div className="analytics-overview animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="stat-card">
                        <div className="icon-wrapper bg-blue"><Briefcase size={24}/></div>
                        <div className="stat-info">
                            <span className="value">{analytics.totalInterviews}</span>
                            <span className="label">Total Interviews</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon-wrapper bg-green"><Target size={24}/></div>
                        <div className="stat-info">
                            <span className="value">{analytics.avgAts}</span>
                            <span className="label">Average ATS Score</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon-wrapper bg-purple"><Activity size={24}/></div>
                        <div className="stat-info">
                            <span className="value">{analytics.avgMatch}%</span>
                            <span className="label">Average Match</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon-wrapper bg-orange"><Clock size={24}/></div>
                        <div className="stat-info">
                            <span className="value">{analytics.preparing}</span>
                            <span className="label">In Preparation</span>
                        </div>
                    </div>
                </div>
            )}

            {history.length > 0 && (
                <div className="progress-section animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <ProgressCharts />
                </div>
            )}

            <div className="history-controls animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="search-bar">
                    <Search className="search-icon" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by company, role, or technology..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filters">
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">All</option>
                        <option value="completed">Completed</option>
                        <option value="preparing">Preparing</option>
                        <option value="upcoming">Upcoming Interview</option>
                        <option value="high-ats">High ATS (80+)</option>
                        <option value="favorites">Favorites</option>
                    </select>
                    <select value={sort} onChange={(e) => setSort(e.target.value)}>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest-ats">Highest ATS</option>
                        <option value="upcoming">Upcoming Interview</option>
                    </select>
                </div>
            </div>

            <div className="history-grid animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {loading && history.length === 0 ? (
                    <div className="loading-state">Loading history...</div>
                ) : history.length > 0 ? (
                    history.map(item => (
                        <HistoryCard key={item._id} data={item} />
                    ))
                ) : (
                    <div className="empty-state">
                        <BarChart2 size={48} className="empty-icon" />
                        <h3>No activity found</h3>
                        <p>Generate a new interview report to start tracking your progress.</p>
                    </div>
                )}
            </div>
            
            {pagination.page < pagination.pages && (
                <div className="load-more-container">
                    <button 
                        className="secondary-btn" 
                        onClick={() => fetchHistory({ search: searchQuery, filter, sort, page: pagination.page + 1 }, true)}
                    >
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
};

export default HistoryDashboard;
