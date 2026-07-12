import { useContext } from "react";
import axios from "axios";
import { AuthContext } from "../auth.context";
import { googleLogin, logout } from "../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    const loginWithGoogle = async (credential) => {
        try {
            const data = await googleLogin({ credential })
            if (data?.user) setUser(data.user)
            return { success: true, data }
        } catch (error) {
            const isOffline = error.message === 'Network Error' || error.message.includes('ECONNREFUSED');
            return { 
                success: false, 
                error: isOffline ? 'Backend is currently offline. Please try again later.' : (error.message || 'Google Login failed') 
            }
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            // Aggressively clear all draft keys from localStorage
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('autosave_') || key.startsWith('syncQueue_') || key.includes('job'))) {
                    localStorage.removeItem(key);
                }
            }
            try {
                const { api } = await import('../services/auth.api');
                await api.delete('/api/autosave');
            } catch (e) { } // ignore if delete fails

            await logout()
            setUser(null)
        } catch {
            // Ignore error on logout
        } finally {
            setLoading(false)
        }
    }

    return { user, loading, loginWithGoogle, handleLogout }
}