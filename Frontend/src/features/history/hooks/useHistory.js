import { useState, useCallback, useRef, useEffect } from 'react';
import { getHistoryApi, getHistoryAnalyticsApi, compareHistoryApi, toggleFavoriteApi, deleteHistoryApi } from '../services/history.api';

export const useHistory = () => {
    const [history, setHistory] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchHistory = useCallback(async (params = {}, append = false) => {
        if (!isMounted.current) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getHistoryApi(params);
            if (isMounted.current && data.success) {
                setHistory(prev => append ? [...prev, ...data.data] : data.data);
                setPagination({
                    page: data.page,
                    pages: data.pages,
                    total: data.total
                });
            }
        } catch (err) {
            if (isMounted.current) setError(err.response?.data?.message || 'Failed to fetch history');
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, []);

    const fetchAnalytics = useCallback(async () => {
        if (!isMounted.current) return;
        try {
            const data = await getHistoryAnalyticsApi();
            if (isMounted.current && data.success) {
                setAnalytics(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch analytics", err);
        }
    }, []);

    const toggleFavorite = useCallback(async (id) => {
        try {
            const data = await toggleFavoriteApi(id);
            if (data.success) {
                setHistory(prev => prev.map(item => item._id === id ? { ...item, favorite: data.data.favorite } : item));
            }
        } catch (err) {
            console.error("Failed to toggle favorite", err);
        }
    }, []);

    const deleteHistory = useCallback(async (id) => {
        try {
            const data = await deleteHistoryApi(id);
            if (data.success) {
                setHistory(prev => prev.filter(item => item._id !== id));
            }
            return data.success;
        } catch (err) {
            console.error("Failed to delete history", err);
            return false;
        }
    }, []);

    const compareHistory = useCallback(async (id1, id2) => {
        setLoading(true);
        setError(null);
        try {
            const data = await compareHistoryApi(id1, id2);
            return data.success ? data.data : null;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to compare history');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        history,
        analytics,
        loading,
        error,
        pagination,
        fetchHistory,
        fetchAnalytics,
        toggleFavorite,
        deleteHistory,
        compareHistory
    };
};
