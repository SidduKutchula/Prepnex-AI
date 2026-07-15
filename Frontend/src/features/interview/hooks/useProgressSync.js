import { useState, useEffect, useCallback } from 'react';
import { toggleTaskCompletionApi, syncProgressApi } from '../services/interview.api';

export const useProgressSync = (interviewId, initialTasks = []) => {
    const [completedTasks, setCompletedTasks] = useState(new Set(initialTasks));
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [syncQueue, setSyncQueue] = useState(() => {
        const savedQueue = localStorage.getItem(`syncQueue_${interviewId}`);
        if (savedQueue) {
            try {
                return JSON.parse(savedQueue);
            } catch (e) {
                console.error("Failed to parse offline sync queue");
            }
        }
        return [];
    });

    const flushQueue = useCallback(async () => {
        if (syncQueue.length === 0 || isOffline) return;

        try {
            await syncProgressApi(syncQueue);
            setSyncQueue([]);
            localStorage.removeItem(`syncQueue_${interviewId}`);
        } catch (error) {
            console.error("Failed to sync progress batch", error);
        }
    }, [syncQueue, isOffline, interviewId]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            flushQueue();
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [flushQueue]);




    // Attempt to flush queue periodically if online
    useEffect(() => {
        const interval = setInterval(flushQueue, 30000); // every 30s
        return () => clearInterval(interval);
    }, [flushQueue]);

    const toggleTaskCompleted = useCallback(async (taskId, details = {}) => {
        const isCurrentlyCompleted = completedTasks.has(taskId);
        const nextState = !isCurrentlyCompleted;

        // Optimistic UI Update
        setCompletedTasks(prev => {
            const next = new Set(prev);
            if (nextState) next.add(taskId);
            else next.delete(taskId);
            return next;
        });

        const updateData = {
            interviewId,
            taskId,
            completed: nextState,
            ...details
        };

        if (isOffline) {
            // Queue for offline
            const newQueue = [...syncQueue, updateData];
            setSyncQueue(newQueue);
            localStorage.setItem(`syncQueue_${interviewId}`, JSON.stringify(newQueue));
        } else {
            // Sync immediately
            try {
                await toggleTaskCompletionApi(interviewId, taskId, nextState);
            } catch (error) {
                console.error("Failed to sync task", error);
                // Revert or queue for retry
                const newQueue = [...syncQueue, updateData];
                setSyncQueue(newQueue);
                localStorage.setItem(`syncQueue_${interviewId}`, JSON.stringify(newQueue));
            }
        }
    }, [completedTasks, interviewId, isOffline, syncQueue]);

    return { completedTasks, setCompletedTasks, toggleTaskCompleted, isOffline };
};
