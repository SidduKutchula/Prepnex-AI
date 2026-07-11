import { 
    getAllInterviewReports, 
    getInterviewReportById, 
    parseResumeApi, 
    startInterviewReportApi,
    toggleBookmarkApi,
    deleteInterviewReportApi,
    renameInterviewReportApi
} from "../services/interview.api"
import { useContext, useEffect, useCallback, useRef } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const startGeneration = useCallback(async ({ jobDescription, selfDescription, resumeFile, remainingDays }) => {
        setLoading(true)
        try {
            // Optional: If we want to extract the resume text first before starting, we can do it here, 
            // but the backend start API expects just the fields. We can pass the file as base64 or let the backend extract.
            // Wait, the backend currently accepts `resume` as a string. Let's parse it first if there is a file.
            let resumeText = ""
            if (resumeFile) {
                const parsedData = await parseResumeApi({ resumeFile })
                resumeText = parsedData.resumeText || ""
            }

            const response = await startInterviewReportApi({
                jobDescription,
                selfDescription,
                resume: resumeText,
                remainingDays
            })

            return { success: true, reportId: response.reportId }
        } catch (error) {
            return { success: false, error: error.message || 'Failed to start report generation' }
        } finally {
            setLoading(false)
        }
    }, [setLoading])

    const isMounted = useRef(true)

    useEffect(() => {
        return () => {
            isMounted.current = false
        }
    }, [])

    const getReportById = useCallback(async (interviewId) => {
        if (!isMounted.current) return { success: false, error: 'Unmounted' };
        setLoading(true)
        try {
            const response = await getInterviewReportById(interviewId)
            if (isMounted.current) setReport(response.interviewReport)
            return { success: true, data: response.interviewReport }
        } catch (error) {
            return { success: false, error: error.message || 'Failed to load report' }
        } finally {
            if (isMounted.current) setLoading(false)
        }
    }, [setLoading, setReport])

    const getReports = useCallback(async () => {
        if (!isMounted.current) return { success: false, error: 'Unmounted' };
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            if (isMounted.current) setReports(response.interviewReports)
            return { success: true, data: response.interviewReports }
        } catch (error) {
            return { success: false, error: error.message || 'Failed to load reports' }
        } finally {
            if (isMounted.current) setLoading(false)
        }
    }, [setLoading, setReports])



    const toggleBookmark = useCallback(async (id) => {
        try {
            const response = await toggleBookmarkApi(id)
            if (response.success) {
                setReports(prev => prev.map(r => r._id === id ? { ...r, isBookmarked: response.isBookmarked } : r))
            }
            return { success: true, isBookmarked: response.isBookmarked }
        } catch (error) {
            return { success: false, error: error.message || 'Failed to toggle bookmark' }
        }
    }, [setReports])

    const deleteReport = useCallback(async (id) => {
        try {
            const response = await deleteInterviewReportApi(id)
            if (response.success) {
                setReports(prev => prev.filter(r => r._id !== id))
            }
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message || 'Failed to delete report' }
        }
    }, [setReports])

    const renameReport = useCallback(async (id, title) => {
        try {
            const response = await renameInterviewReportApi(id, title)
            if (response.success) {
                setReports(prev => prev.map(r => r._id === id ? { ...r, title: response.report.title } : r))
            }
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message || 'Failed to rename report' }
        }
    }, [setReports])

    const toggleTaskCompletion = useCallback(async (interviewId, taskId, completed) => {
        try {
            // Import it here or ensure it's imported at the top
            const { toggleTaskCompletionApi } = await import('../services/interview.api.js')
            const response = await toggleTaskCompletionApi(interviewId, taskId, completed)
            if (response.success) {
                setReport(prev => {
                    if (!prev || prev._id !== interviewId) return prev
                    const newPlan = prev.preparationPlan.map(t => t._id === taskId ? { ...t, status: completed ? 'completed' : 'pending' } : t)
                    return { ...prev, preparationPlan: newPlan }
                })
            }
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message || 'Failed to toggle task completion' }
        }
    }, [])

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId, getReportById, getReports ])

    return { loading, report, reports, startGeneration, getReportById, getReports, toggleBookmark, deleteReport, renameReport, toggleTaskCompletion }

}

export const useInterviewStream = (reportId) => {
    const context = useContext(InterviewContext)
    if (!context) {
        throw new Error("useInterviewStream must be used within an InterviewProvider")
    }

    const { setReport, report } = context

    useEffect(() => {
        if (!reportId) return;
        
        const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const eventSource = new EventSource(`${baseURL}/api/interview/stream/${reportId}?t=${Date.now()}`, { withCredentials: true })

        eventSource.addEventListener("initial", (e) => {
            const payload = JSON.parse(e.data)
            setReport(payload.data)
        })

        eventSource.addEventListener("progress", (e) => {
            const payload = JSON.parse(e.data)
            
            setReport(prev => {
                if (!prev) return prev;
                const updated = { ...prev };
                
                if (payload.stage === 'ats' && payload.data) {
                    updated.atsScore = payload.data.atsScore;
                    updated.improvementSummary = payload.data.improvementSummary;
                    updated.recruiterFeedback = payload.data.recruiterFeedback;
                    updated.addedKeywords = payload.data.addedKeywords;
                    updated.missingKeywords = payload.data.missingKeywords;
                    updated.skillGaps = payload.data.skillGaps;
                    updated.matchScore = payload.data.matchScore;
                    updated.progress = { ...updated.progress, atsGenerated: payload.status === 'completed' };
                } else if (payload.stage === 'questions') {
                    updated.progress = { ...updated.progress, questionsGenerated: payload.status === 'completed' };
                    // We must refetch the report completely if questions/roadmap completed because the stream payload only says 'completed'
                    // For now, this is enough to update the UI progress ticks. The data itself will be fetched if they reload, 
                    // or we could dispatch a GET /report/:id when questions complete to grab the latest content cleanly.
                } else if (payload.stage === 'roadmap') {
                    updated.progress = { ...updated.progress, roadmapGenerated: payload.status === 'completed' };
                } else if (payload.stage === 'rewrite') {
                    updated.progress = { ...updated.progress, rewriteGenerated: payload.status === 'completed' };
                }
                
                if (payload.stage === 'complete') {
                    updated.status = payload.status;
                    // Trigger a clean refetch to get all the data
                    setTimeout(async () => {
                        try {
                            const res = await getInterviewReportById(reportId);
                            setReport(res.interviewReport);
                        } catch (e) {
                            console.error(e);
                        }
                    }, 500);
                }
                return updated;
            });
        })

        eventSource.addEventListener("error", (e) => {
            // Prevent spamming the console on normal disconnects or stream ends
            if (e.eventPhase === EventSource.CLOSED || eventSource.readyState === EventSource.CLOSED) {
                eventSource.close()
            } else {
                console.warn("SSE Stream disconnected, attempting to reconnect...")
                eventSource.close()
            }
        })

        return () => {
            eventSource.close()
        }
    }, [reportId, setReport])

    return { report }
}