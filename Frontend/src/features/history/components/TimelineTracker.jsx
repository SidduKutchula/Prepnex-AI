import React from 'react';
import { CheckCircle, Circle, ArrowDown } from 'lucide-react';
import '../style/history.scss';

const TimelineTracker = ({ timeline = [] }) => {
    // If no timeline exists, we show a default placeholder based on report status
    const steps = timeline.length > 0 ? timeline : [
        { event: 'Resume Uploaded', completed: true },
        { event: 'ATS Analysis Generated', completed: true },
        { event: 'Interview Questions Prepared', completed: true },
        { event: 'Preparation Roadmap Created', completed: true },
        { event: 'Mock Interview Completed', completed: false },
        { event: 'Interview Day', completed: false }
    ];

    return (
        <div className="timeline-tracker">
            <h3 className="timeline-title">Activity Timeline</h3>
            <div className="timeline-container">
                {steps.map((step, index) => (
                    <div key={index} className={`timeline-step ${step.completed ? 'completed' : 'pending'}`}>
                        <div className="step-indicator">
                            {step.completed ? (
                                <CheckCircle size={24} className="icon-completed" />
                            ) : (
                                <Circle size={24} className="icon-pending" />
                            )}
                            {index < steps.length - 1 && <div className="step-line" />}
                        </div>
                        <div className="step-content">
                            <h4>{step.event}</h4>
                            {step.date && <p className="step-date">{new Date(step.date).toLocaleString()}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineTracker;
