import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('interview_ai_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Global interceptor — surfaces real server error messages, never hides them
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        let message = 'Something went wrong';
        const data = error.response?.data;

        if (data instanceof Blob) {
            try {
                const parsed = JSON.parse(await data.text());
                message = parsed.error || parsed.message || message;
            } catch {}
        } else if (data?.error || data?.message) {
            message = data.error || data.message;
        }

        console.error('[API Error]', {
            url: error.config?.url,
            status: error.response?.status,
            message,
        });

        const err = new Error(message);
        err.status = error.response?.status;
        
        if (err.status === 401) {
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        err.data = data;
        return Promise.reject(err);
    }
);

export async function googleLogin({ credential }) {
    // Send as both 'credential' and 'token' — controller accepts either
    const response = await api.post("/api/auth/google", { credential, token: credential })
    if (response.data?.token) {
        localStorage.setItem('interview_ai_token', response.data.token);
    }
    return response.data
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout")
        localStorage.removeItem('interview_ai_token');
        return response.data
    } catch {
        localStorage.removeItem('interview_ai_token');
        return null;
    }
}

export async function getMe() {
    const response = await api.get("/api/auth/get-me")
    return response.data
}