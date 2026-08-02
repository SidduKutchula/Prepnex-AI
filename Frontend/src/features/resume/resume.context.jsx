import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { parseResumeHtml, createEmptyResume } from './utils/parseResumeHtml';
import { optimizeForAts } from './utils/atsOptimizer';

export const ResumeContext = createContext(null);

export const ResumeProvider = ({ children, initialHtml = '', reportData = null }) => {
    const [resumeData, setResumeData] = useState(() => {
        if (initialHtml) {
            return parseResumeHtml(initialHtml, reportData || {});
        }
        return createEmptyResume();
    });

    const [activeTemplate, setActiveTemplate] = useState('classic'); // classic | modern | minimal | developer | executive
    const [isEditing, setIsEditing] = useState(false);

    // Sync when initialHtml or reportData changes
    useEffect(() => {
        if (initialHtml) {
            const parsed = parseResumeHtml(initialHtml, reportData || {});
            setResumeData(parsed);
        }
    }, [initialHtml, reportData]);

    /**
     * Updates a single field or nested path in resumeData instantly.
     */
    const updateField = useCallback((field, value) => {
        setResumeData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                [field]: value
            };
        });
    }, []);

    /**
     * Updates a bullet point inside an experience or project entry.
     */
    const updateArrayItem = useCallback((category, index, itemValue) => {
        setResumeData(prev => {
            if (!prev || !Array.isArray(prev[category])) return prev;
            const updated = [...prev[category]];
            updated[index] = itemValue;
            return {
                ...prev,
                [category]: updated
            };
        });
    }, []);

    /**
     * Adds an item to an array section (e.g. experience, project, education, skill).
     */
    const addArrayItem = useCallback((category, defaultItem = {}) => {
        setResumeData(prev => {
            if (!prev) return prev;
            const currentArr = Array.isArray(prev[category]) ? prev[category] : [];
            return {
                ...prev,
                [category]: [...currentArr, defaultItem]
            };
        });
    }, []);

    /**
     * Removes an item from an array section by index.
     */
    const removeArrayItem = useCallback((category, index) => {
        setResumeData(prev => {
            if (!prev || !Array.isArray(prev[category])) return prev;
            const updated = prev[category].filter((_, i) => i !== index);
            return {
                ...prev,
                [category]: updated
            };
        });
    }, []);

    /**
     * Replaces the entire resume data object with optimized/reset content.
     */
    const resetResumeData = useCallback((newData) => {
        setResumeData(newData || createEmptyResume());
    }, []);

    /**
     * Returns an optimized copy of the resume data ready for PDF rendering.
     */
    const getOptimizedData = useCallback(() => {
        return optimizeForAts(resumeData);
    }, [resumeData]);

    const value = useMemo(() => ({
        resumeData,
        setResumeData,
        updateField,
        updateArrayItem,
        addArrayItem,
        removeArrayItem,
        resetResumeData,
        getOptimizedData,
        activeTemplate,
        setActiveTemplate,
        isEditing,
        setIsEditing
    }), [
        resumeData,
        updateField,
        updateArrayItem,
        addArrayItem,
        removeArrayItem,
        resetResumeData,
        getOptimizedData,
        activeTemplate,
        isEditing
    ]);

    return (
        <ResumeContext.Provider value={value}>
            {children}
        </ResumeContext.Provider>
    );
};

export default ResumeProvider;
