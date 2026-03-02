import axios from 'axios';

const API_URL = typeof window !== 'undefined'
    ? ''
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (email: string, password: string) => api.post('/auth/login', { email, password }),
    register: (data: any) => api.post('/auth/register', data),
    me: () => api.get('/auth/me'),
};

export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
};

export const youtubeAPI = {
    search: (params: any) => api.post('/youtube/search', params),
    trending: (params?: any) => api.get('/youtube/trending', { params }),
    importVideo: (data: any) => api.post('/youtube/import', data),
    categories: () => api.get('/youtube/categories'),
};

export const videosAPI = {
    list: (params?: any) => api.get('/videos', { params }),
    get: (id: number) => api.get(`/videos/${id}`),
    update: (id: number, data: any) => api.put(`/videos/${id}`, data),
    approve: (id: number) => api.post(`/videos/${id}/approve`),
    reject: (id: number) => api.post(`/videos/${id}/reject`),
    reprocess: (id: number) => api.post(`/videos/${id}/reprocess`),
    delete: (id: number) => api.delete(`/videos/${id}`),
};

export const tiktokAPI = {
    getAuthUrl: () => api.get('/tiktok/auth-url'),
    accounts: () => api.get('/tiktok/accounts'),
    publish: (data: any) => api.post('/tiktok/publish', data),
    disconnectAccount: (id: number) => api.delete(`/tiktok/accounts/${id}`),
};

export const aiAPI = {
    generateContent: (data: any) => api.post('/ai/generate-content', data),
    analyzeEmotions: (text: string) => api.post('/ai/analyze-emotions', { text }),
    translate: (text: string, targetLanguage: string) => api.post('/ai/translate', { text, target_language: targetLanguage }),
};

export const settingsAPI = {
    get: () => api.get('/settings'),
};

export default api;
