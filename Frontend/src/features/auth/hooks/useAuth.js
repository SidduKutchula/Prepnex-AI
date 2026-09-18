import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { googleLogin, logout, api } from "../services/auth.api";

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
            // Delete cloud autosave draft while token is still active
            try {
                await api.delete('/api/autosave');
            } catch (e) {
                // Ignore failure if network error
            }

            // Perform backend token invalidation/logout
            await logout()
        } catch {
            // Ignore error on logout call
        } finally {
            // Clear all local & session storage, preserving only user UI theme preference
            const savedTheme = localStorage.getItem('theme');
            localStorage.clear();
            if (savedTheme) {
                localStorage.setItem('theme', savedTheme);
            }
            sessionStorage.clear();

            setUser(null);
            setLoading(false);
        }
    }

    return { user, loading, loginWithGoogle, handleLogout }
}