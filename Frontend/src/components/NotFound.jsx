import React from 'react'
import { useNavigate } from 'react-router'
import { FileQuestion, ArrowLeft } from 'lucide-react'

const NotFound = () => {
    const navigate = useNavigate()

    return (
        <main style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: 'var(--bg-page)',
            color: 'var(--text-heading)',
            textAlign: 'center'
        }}>
            <FileQuestion size={64} style={{ color: 'var(--text-muted)', marginBottom: '24px' }} />
            <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>404</h1>
            <h2 style={{ fontSize: '24px', fontWeight: '500', marginBottom: '12px' }}>Page Not Found</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '400px' }}>
                The page you are looking for doesn't exist or has been moved.
            </p>
            <button 
                className="button primary-button" 
                onClick={() => navigate('/interview')}
                style={{ marginTop: '24px' }}
            >
                <ArrowLeft size={16} />
                <span>Back to Workspace</span>
            </button>
        </main>
    )
}

export default NotFound
