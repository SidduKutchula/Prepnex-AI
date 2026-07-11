import { createContext, useState, useMemo, useEffect } from "react";
import { getMe } from "./services/auth.api";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext()

export const AuthProvider = ({ children }) => { 
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initAuth = async () => {
            try {
                const data = await getMe()
                setUser(data?.user || null)
            } catch (err) {
                if (err.status === 401) {
                    setUser(null);
                } else {
                    console.error('[Auth] Unexpected get-me error:', err.message);
                    setUser(null);
                }
            } finally {
                setLoading(false)
            }
        }
        initAuth()

        const handleUnauthorized = () => {
            setUser(null);
            setLoading(false);
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [])

    const value = useMemo(() => ({ user, setUser, loading, setLoading }), [user, loading])

    return (
        <AuthContext.Provider value={value} >
            {children}
        </AuthContext.Provider>
    )
}