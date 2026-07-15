import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';

// Using the same axios instance config pattern
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true,
});

export const useAutoSave = (userId) => {
    const [status, setStatus] = useState('idle'); // idle, saving, saved, error
    const [lastSavedTime, setLastSavedTime] = useState(null);

    const userIdRef = useRef(userId);

    // Create a stable debounced save function for the cloud
    // eslint-disable-next-line react-hooks/refs
    const debouncedSave = useRef(
        debounce(async (data) => {
            const currentUserId = userIdRef.current;
            if (!currentUserId) return; // Wait until authenticated
            setStatus('saving');
            try {
                // Sync to cloud
                await api.post('/api/autosave', data);
                setStatus('saved');
                setLastSavedTime(new Date());
            } catch (error) {
                console.error("Autosave sync failed:", error);
                setStatus('error');
            }
        }, 1500)
    ).current;

    useEffect(() => {
        userIdRef.current = userId;
        if (!userId) {
            debouncedSave.cancel();
        }
    }, [userId, debouncedSave]);

    const triggerSave = useCallback((data) => {
        if (!userId) return;
        // 1. Save to local storage IMMEDIATELY for offline backup
        localStorage.setItem(`autosave_${userId}`, JSON.stringify(data));
        // 2. Debounce cloud sync
        debouncedSave(data);
    }, [userId, debouncedSave]);

    // Fetch the draft state on mount
    const loadDraft = useCallback(async () => {
        if (!userId) return null;
        
        // Always try to load from local storage first because it is instant
        // and captures changes that happened right before a reload
        const localData = localStorage.getItem(`autosave_${userId}`);
        let parsedLocal = null;
        if (localData) {
            try { parsedLocal = JSON.parse(localData); } catch { /* ignore */ }
        }

        try {
            // Also try to check cloud (e.g. if logging in from new device)
            const response = await api.get('/api/autosave');
            if (response.data?.success && response.data?.data) {
                // If local exists, it usually takes precedence on this device, but we can return cloud if local is empty
                return parsedLocal || response.data.data;
            }
        } catch { /* ignore */ }

        return parsedLocal;
    }, [userId]);

    const clearDraft = useCallback(async () => {
        if (!userId) return;
        localStorage.removeItem(`autosave_${userId}`);
        try {
            await api.delete('/api/autosave');
        } catch {
            console.error("Failed to clear cloud autosave");
        }
    }, [userId]);

    return { status, lastSavedTime, triggerSave, loadDraft, clearDraft };
};
