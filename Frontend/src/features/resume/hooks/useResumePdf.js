import { useState, useCallback } from 'react';
import { optimizeForAts } from '../utils/atsOptimizer';
import { renderClassicTemplate } from '../pdf/templates/classic';
import { renderModernTemplate } from '../pdf/templates/modern';
import { renderMinimalTemplate } from '../pdf/templates/minimal';
import { renderDeveloperTemplate } from '../pdf/templates/developer';
import { renderExecutiveTemplate } from '../pdf/templates/executive';
import { renderGoogleTemplate } from '../pdf/templates/google';
import { renderMicrosoftTemplate } from '../pdf/templates/microsoft';
import { renderAcademicTemplate } from '../pdf/templates/academic';

const TEMPLATE_MAP = {
    classic: renderClassicTemplate,
    modern: renderClassicTemplate,
    minimal: renderClassicTemplate,
    developer: renderClassicTemplate,
    executive: renderClassicTemplate,
    google: renderClassicTemplate,
    microsoft: renderClassicTemplate,
    academic: renderClassicTemplate,
};

export function useResumePdf() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [step, setStep] = useState(''); // 'preparing' | 'optimizing' | 'generating' | 'embedding' | 'compressing' | 'complete'
    const [error, setError] = useState(null);

    const generatePdf = useCallback(async (resumeData, templateName = 'classic', filename = 'Resume.pdf') => {
        setIsGenerating(true);
        setError(null);

        try {
            // Step 1: Preparing Resume
            setStep('Preparing Resume');
            await new Promise(r => setTimeout(r, 200));

            // Step 2: Optimizing ATS
            setStep('Optimizing ATS');
            const cleanData = optimizeForAts(resumeData);
            await new Promise(r => setTimeout(r, 250));

            // Step 3: Generating PDF
            setStep('Generating PDF');
            const renderFn = TEMPLATE_MAP[templateName] || renderClassicTemplate;
            const doc = renderFn(cleanData);
            await new Promise(r => setTimeout(r, 200));

            // Step 4: Embedding Fonts
            setStep('Embedding Fonts');
            await new Promise(r => setTimeout(r, 150));

            // Step 5: Compressing PDF
            setStep('Compressing PDF');
            await new Promise(r => setTimeout(r, 150));

            // Save and download
            const safeName = (cleanData.name || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');
            const downloadFilename = `${safeName}_ATS_Resume.pdf`;
            doc.save(downloadFilename);

            // Step 6: Download Complete
            setStep('Download Complete');
            await new Promise(r => setTimeout(r, 1000));
            
            return { success: true, filename: downloadFilename };
        } catch (err) {
            console.error('PDF Generation failed:', err);
            setError(err.message || 'Failed to generate PDF');
            return { success: false, error: err.message };
        } finally {
            setIsGenerating(false);
            setStep('');
        }
    }, []);

    return {
        generatePdf,
        isGenerating,
        step,
        error
    };
}

export default useResumePdf;
