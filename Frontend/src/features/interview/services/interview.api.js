import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true,
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('interview_ai_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Global interceptor for standardizing errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.data instanceof Blob && error.response?.data?.type === 'application/json') {
            try {
                const text = await error.response.data.text();
                error.response.data = JSON.parse(text);
            } catch (e) {
                // Ignore parse error
            }
        }
        
        const customError = new Error(error.response?.data?.error || error.response?.data?.message || 'Something went wrong');
        customError.status = error.response?.status;
        
        if (customError.status === 401) {
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        
        customError.data = error.response?.data;
        return Promise.reject(customError);
    }
);

/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const parseResumeApi = async ({ resumeFile, selfDescription }) => {
    const formData = new FormData()
    if (resumeFile) formData.append("resume", resumeFile)
    if (selfDescription) formData.append("selfDescription", selfDescription)

    const response = await api.post("/api/interview/parse", formData)
    return response.data
}

export const generateAtsGapsApi = async (data) => {
    const response = await api.post("/api/interview/ats-gaps", data)
    return response.data
}

export const generateQuestionsApi = async (data) => {
    const response = await api.post("/api/interview/questions", data)
    return response.data
}

export const generateRoadmapApi = async (data) => {
    const response = await api.post("/api/interview/roadmap", data)
    return response.data
}

export const generateResumeRewriteApi = async (data) => {
    const response = await api.post("/api/interview/resume-rewrite", data)
    return response.data
}

export const saveInterviewReportApi = async (data) => {
    const response = await api.post("/api/interview/save", data)
    return response.data
}

export const startInterviewReportApi = async (data) => {
    const response = await api.post("/api/interview/start", data)
    return response.data
}

/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)
    return response.data
}

/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")
    return response.data
}



export const toggleBookmarkApi = async (interviewId) => {
    const response = await api.put(`/api/interview/${interviewId}/bookmark`)
    return response.data
}

export const deleteInterviewReportApi = async (interviewId) => {
    const response = await api.delete(`/api/interview/${interviewId}`)
    return response.data
}

export const toggleTaskCompletionApi = async (interviewId, taskId, completed) => {
    const response = await api.put(`/api/interview/${interviewId}/task/${taskId}/toggle`, { completed })
    return response.data
}

export const renameInterviewReportApi = async (interviewId, title) => {
    const response = await api.put(`/api/interview/${interviewId}/rename`, { title })
    return response.data
}

export const syncProgressApi = async (updates) => {
    const response = await api.post(`/api/interview/sync-progress`, { updates })
    return response.data
}

export const getDashboardAnalyticsApi = async () => {
    const response = await api.get(`/api/interview/analytics/dashboard`)
    return response.data
}