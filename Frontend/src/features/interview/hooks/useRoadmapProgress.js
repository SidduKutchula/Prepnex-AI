import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const api = axios.create({ 
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true 
});

export function useRoadmapProgress(reportId) {
    const [completedTaskIds, setCompletedTaskIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const isMounted = useRef(true);
    const abortControllers = useRef({});
    const fetchController = useRef(null);

    useEffect(() => {
        return () => {
            isMounted.current = false;
            if (fetchController.current) fetchController.current.abort();
            Object.values(abortControllers.current).forEach(controller => controller.abort());
        };
    }, []);

    const fetchProgress = useCallback(async () => {
        if (!reportId || !isMounted.current) return;
        if (fetchController.current) fetchController.current.abort();
        fetchController.current = new AbortController();

        try {
            const res = await api.get(`/api/roadmap/progress/${reportId}`, {
                signal: fetchController.current.signal
            });
            if (isMounted.current && res.data.success) {
                setCompletedTaskIds(res.data.completedTaskIds);
            }
        } catch (err) {
            if (axios.isCancel(err)) return;
            console.error('[Roadmap] Failed to load progress:', err.message);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [reportId]);

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    const toggleQueue = useRef({});

    const toggleTask = async (taskId) => {
        // Compute the expected next state based on the current state.
        // Because of optimistic UI and rapid clicks, we should rely on the functional state 
        // update to determine what the actual state will become in React.
        let nextCompleted = false;
        let wasCompleted = false;
        
        setCompletedTaskIds((prev) => {
            wasCompleted = prev.includes(taskId);
            nextCompleted = !wasCompleted;
            return nextCompleted ? [...prev, taskId] : prev.filter((id) => id !== taskId);
        });

        // Initialize the queue for this task if it doesn't exist
        if (!toggleQueue.current[taskId]) {
            toggleQueue.current[taskId] = Promise.resolve();
        }

        // Chain the network call onto the queue
        toggleQueue.current[taskId] = toggleQueue.current[taskId].then(async () => {
            try {
                const res = await api.patch(
                    `/api/roadmap/progress/${reportId}/task/${encodeURIComponent(taskId)}`,
                    { completed: nextCompleted }
                );
                if (isMounted.current && res.data.success) {
                    setCompletedTaskIds(res.data.completedTaskIds);
                }
            } catch (err) {
                console.error('[Roadmap] Toggle failed, reverting:', err.message);
                if (isMounted.current) {
                    // Revert to the state before THIS specific action was attempted
                    setCompletedTaskIds((prev) =>
                        wasCompleted ? [...prev, taskId] : prev.filter((id) => id !== taskId)
                    );
                }
            }
        });
    };

    return { completedTaskIds, toggleTask, loading, refetch: fetchProgress };
}
