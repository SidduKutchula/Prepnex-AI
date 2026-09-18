import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const api = axios.create({ 
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true 
});

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('interview_ai_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export function useRoadmapProgress(reportId) {
    const [completedTaskIds, setCompletedTaskIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const isMounted = useRef(true);
    const abortControllers = useRef({});
    const fetchController = useRef(null);

    useEffect(() => {
        const controllers = abortControllers.current;
        return () => {
            isMounted.current = false;
            if (fetchController.current) fetchController.current.abort();
            Object.values(controllers).forEach(controller => controller.abort());
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

    const completedTaskIdsRef = useRef(completedTaskIds);
    useEffect(() => {
        completedTaskIdsRef.current = completedTaskIds;
    }, [completedTaskIds]);

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    const toggleQueue = useRef({});

    const toggleTask = async (taskId) => {
        if (!reportId || !taskId) return;

        const wasCompleted = completedTaskIdsRef.current.includes(taskId);
        const nextCompleted = !wasCompleted;

        // Synchronously update ref for subsequent rapid clicks before re-render
        const nextList = nextCompleted
            ? (completedTaskIdsRef.current.includes(taskId) ? completedTaskIdsRef.current : [...completedTaskIdsRef.current, taskId])
            : completedTaskIdsRef.current.filter((id) => id !== taskId);
        completedTaskIdsRef.current = nextList;

        // Optimistic UI state update
        setCompletedTaskIds((prev) =>
            nextCompleted
                ? (prev.includes(taskId) ? prev : [...prev, taskId])
                : prev.filter((id) => id !== taskId)
        );

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
                if (isMounted.current && res.data?.success && Array.isArray(res.data.completedTaskIds)) {
                    setCompletedTaskIds(res.data.completedTaskIds);
                    completedTaskIdsRef.current = res.data.completedTaskIds;
                }
            } catch (err) {
                console.error('[Roadmap] Toggle failed, reverting:', err.message);
                if (isMounted.current) {
                    setCompletedTaskIds((prev) =>
                        wasCompleted
                            ? (prev.includes(taskId) ? prev : [...prev, taskId])
                            : prev.filter((id) => id !== taskId)
                    );
                }
            }
        });
    };

    return { completedTaskIds, toggleTask, loading, refetch: fetchProgress };

}
