import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true
});

export const getHistoryApi = async (params) => {
    const response = await api.get('/history', { params });
    return response.data;
};

export const getHistoryAnalyticsApi = async () => {
    const response = await api.get('/history/analytics');
    return response.data;
};

export const compareHistoryApi = async (id1, id2) => {
    const response = await api.get(`/history/compare?id1=${id1}&id2=${id2}`);
    return response.data;
};

export const toggleFavoriteApi = async (id) => {
    const response = await api.put(`/history/${id}/favorite`);
    return response.data;
};

export const deleteHistoryApi = async (id) => {
    const response = await api.delete(`/history/${id}`);
    return response.data;
};
