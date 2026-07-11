import React from 'react';
import { useHistory } from '../hooks/useHistory';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Legend
} from 'recharts';
import '../style/history.scss';

const ProgressCharts = () => {
    const { history } = useHistory();

    // Generate mock data for demonstration if history is empty, 
    // otherwise aggregate real progress data from the history array.
    const aggregatedData = history.length > 0 ? history.map(item => ({
        name: item.company || 'Unknown',
        progress: item.progress || 0,
        ats: item.atsScore || 0,
        readiness: item.readinessScore || 0
    })) : [
        { name: 'Google', progress: 80, ats: 92, readiness: 75 },
        { name: 'Meta', progress: 45, ats: 78, readiness: 40 },
        { name: 'Amazon', progress: 100, ats: 88, readiness: 90 },
        { name: 'Stripe', progress: 20, ats: 65, readiness: 15 }
    ];

    return (
        <div className="progress-charts-container">
            <div className="chart-wrapper">
                <h3>Readiness vs ATS Score</h3>
                <div className="chart-inner" style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer>
                        <LineChart data={aggregatedData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-heading)' }} />
                            <Legend />
                            <Line type="monotone" dataKey="ats" stroke="var(--success)" name="ATS Score" strokeWidth={2} />
                            <Line type="monotone" dataKey="readiness" stroke="var(--accent)" name="Readiness" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="chart-wrapper">
                <h3>Interview Completion Rate</h3>
                <div className="chart-inner" style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer>
                        <BarChart data={aggregatedData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-heading)' }} cursor={{fill: 'var(--border)'}} />
                            <Legend />
                            <Bar dataKey="progress" fill="var(--accent)" name="Completion %" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ProgressCharts;
