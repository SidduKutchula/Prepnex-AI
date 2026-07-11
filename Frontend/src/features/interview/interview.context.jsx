import { createContext, useState, useMemo } from "react";


// eslint-disable-next-line react-refresh/only-export-components
export const InterviewContext = createContext()

export const InterviewProvider = ({ children }) => {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState(null)
    const [reports, setReports] = useState([])

    const value = useMemo(() => ({ loading, setLoading, report, setReport, reports, setReports }), [loading, report, reports])

    return (
        <InterviewContext.Provider value={value}>
            {children}
        </InterviewContext.Provider>
    )
}