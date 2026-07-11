import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './autosaveIndicator.scss';

const AutoSaveIndicator = ({ status, lastSavedTime }) => {
    return (
        <div className="autosave-indicator">
            <AnimatePresence mode="wait">
                {status === 'saving' && (
                    <motion.div
                        key="saving"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="status-item"
                    >
                        <Loader2 size={14} className="spin text-muted" />
                        <span>Saving...</span>
                    </motion.div>
                )}

                {status === 'saved' && (
                    <motion.div
                        key="saved"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="status-item"
                    >
                        <CheckCircle2 size={14} className="text-success" />
                        <span>Saved</span>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="status-item"
                    >
                        <AlertCircle size={14} className="text-error" />
                        <span>Save failed. Retrying...</span>
                    </motion.div>
                )}

                {status === 'idle' && lastSavedTime && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="status-item idle-state"
                    >
                        <span>Last saved at {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AutoSaveIndicator;
