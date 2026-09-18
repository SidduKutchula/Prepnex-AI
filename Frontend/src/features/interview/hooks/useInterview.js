import { 
    getAllInterviewReports, 
    getInterviewReportById, 
    parseResumeApi, 
    startInterviewReportApi,
    toggleBookmarkApi,
    deleteInterviewReportApi,
    renameInterviewReportApi,
    toggleTaskCompletionApi
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
                setReports(prev => prev.map(r => r._id === id ? { ...r, isBookmarked: response.isBookmarked, favorite: response.isBookmarked } : r))
                setReport(prev => (prev && prev._id === id ? { ...prev, isBookmarked: response.isBookmarked, favorite: response.isBookmarked } : prev))
            }
            return { success: true, isBookmarked: response.isBookmarked }
        } catch (error) {
            return { success: false, error: error.message || 'Failed to toggle bookmark' }
        }
    }, [setReports, setReport])

    const deleteReport = useCallback(async (id) => {
        try {
            const response = await deleteInterviewReportApi(id)
            if (response.success) {
                setReports(prev => prev.filter(r => r._id !== id))
                setReport(prev => (prev && prev._id === id ? null : prev))
            }
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message || 'Failed to delete report' }
        }
    }, [setReports, setReport])

    const renameReport = useCallback(async (id, title) => {
        try {
            const response = await renameInterviewReportApi(id, title)
            if (response.success) {
                setReports(prev => prev.map(r => r._id === id ? { ...r, title: response.report.title } : r))
                setReport(prev => (prev && prev._id === id ? { ...prev, title: response.report.title } : prev))
            }
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message || 'Failed to rename report' }
        }
    }, [setReports, setReport])

    const toggleTaskCompletion = useCallback(async (interviewId, taskId, completed) => {
        try {
            const response = await toggleTaskCompletionApi(interviewId, taskId, completed)
            if (response.success) {
                setReport(prev => {
                    if (!prev || prev._id !== interviewId) return prev
                    // Walk the nested preparationPlan[].tasks[] structure
                    const newPlan = prev.preparationPlan.map(dayPlan => {
                        if (!dayPlan.tasks) return dayPlan;
                        return {
                            ...dayPlan,
                            tasks: dayPlan.tasks.map(t => 
                                (t._id && t._id.toString() === taskId) || t.title === taskId
                                    ? { ...t, status: completed ? 'completed' : 'pending' }
                                    : t
                            )
                        };
                    });
                    return { ...prev, preparationPlan: newPlan }
                })
            }
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message || 'Failed to toggle task completion' }
        }
    }, [setReport])

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId, getReportById, getReports ])

    return { loading, report, setReport, reports, setReports, startGeneration, getReportById, getReports, toggleBookmark, deleteReport, renameReport, toggleTaskCompletion }

}

export const useInterviewStream = (reportId) => {
    const context = useContext(InterviewContext)
    if (!context) {
        throw new Error("useInterviewStream must be used within an InterviewProvider")
    }

    const { setReport, report } = context

    useEffect(() => {
        if (!reportId) return;

        let isCleanedUp = false;
        let pollInterval = null;

        const checkReportStatus = async () => {
            if (isCleanedUp) return;
            try {
                const res = await getInterviewReportById(reportId);
                if (res && res.interviewReport && !isCleanedUp) {
                    setReport(res.interviewReport);
                    if (['completed', 'partial', 'failed'].includes(res.interviewReport.status)) {
                        if (pollInterval) {
                            clearInterval(pollInterval);
                            pollInterval = null;
                        }
                    }
                }
            } catch (err) {
                console.warn("[Stream/Poll] Error polling report status:", err.message);
            }
        };

        // Active safety polling interval every 2.5s as long as status is processing
        pollInterval = setInterval(() => {
            if (report?.status === 'processing' || !report?.status) {
                checkReportStatus();
            } else if (['completed', 'partial', 'failed'].includes(report?.status)) {
                if (pollInterval) {
                    clearInterval(pollInterval);
                    pollInterval = null;
                }
            }
        }, 2500);
        
        const token = sessionStorage.getItem('interview_ai_token') || '';
        const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const eventSource = new EventSource(`${baseURL}/api/interview/stream/${reportId}?token=${encodeURIComponent(token)}&t=${Date.now()}`, { withCredentials: true })

        eventSource.addEventListener("initial", (e) => {
            if (isCleanedUp) return;
            try {
                const payload = JSON.parse(e.data)
                setReport(payload.data)
                if (['completed', 'partial', 'failed'].includes(payload.data?.status)) {
                    if (pollInterval) {
                        clearInterval(pollInterval);
                        pollInterval = null;
                    }
                }
            } catch (err) {
                console.error("Failed to parse initial SSE event:", err);
            }
        })

        eventSource.addEventListener("progress", (e) => {
            if (isCleanedUp) return;
            try {
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
                        if (payload.data) {
                            if (payload.data.technicalQuestions) updated.technicalQuestions = payload.data.technicalQuestions;
                            if (payload.data.behavioralQuestions) updated.behavioralQuestions = payload.data.behavioralQuestions;
                        }
                        updated.progress = { ...updated.progress, questionsGenerated: payload.status === 'completed' };
                    } else if (payload.stage === 'roadmap') {
                        if (payload.data && payload.data.preparationPlan) {
                            updated.preparationPlan = payload.data.preparationPlan;
                        }
                        updated.progress = { ...updated.progress, roadmapGenerated: payload.status === 'completed' };
                    } else if (payload.stage === 'rewrite') {
                        if (payload.data && payload.data.rewrittenResumeHtml) {
                            updated.rewrittenResumeHtml = payload.data.rewrittenResumeHtml;
                        }
                        updated.progress = { ...updated.progress, rewriteGenerated: payload.status === 'completed' };
                    }
                    
                    if (payload.stage === 'complete') {
                        updated.status = payload.status;
                    }
                    return updated;
                });

                if (payload.stage === 'complete') {
                    if (pollInterval) {
                        clearInterval(pollInterval);
                        pollInterval = null;
                    }
                    checkReportStatus();
                }
            } catch (err) {
                console.error("Failed to parse progress SSE event:", err);
            }
        })

        eventSource.addEventListener("error", (e) => {
            console.warn("SSE Stream disconnected or ended, checking report directly...");
            if (e.eventPhase === EventSource.CLOSED || eventSource.readyState === EventSource.CLOSED) {
                eventSource.close()
            }
            checkReportStatus();
        })

        return () => {
            isCleanedUp = true;
            if (pollInterval) clearInterval(pollInterval);
            eventSource.close()
        }
    // NOTE: report?.status is intentionally NOT included in the dependency array.
    // Including it would re-create the EventSource on every status change, causing
    // duplicate SSE connections. The polling interval reads report?.status via closure.
    }, [reportId, setReport])

    return { report }
}