import React from 'react'

const PageLoader = () => (
    <div style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
        flexDirection: 'column',
        gap: '1rem'
    }}>
        <div style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(96,165,250,0.2)',
            borderTop: '3px solid var(--accent-hover)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
)

export default PageLoader
