import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import Navbar from '../components/navigation/Navbar.jsx'
import CommandPalette from '../components/navigation/CommandPalette.jsx'
import PageWrapper from '../components/PageWrapper.jsx'

const DashboardLayout = () => {
    const location = useLocation()
    const [activeTab, setActiveTab] = useState('')
    const [searchOpen, setSearchOpen] = useState(false)

    // Reset active tab if returning to dashboard
    if (location.pathname === '/interview' && activeTab !== '') {
        setActiveTab('')
    }

    return (
        <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar onSearchOpen={() => setSearchOpen(true)} />
            <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
            
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <PageWrapper>
                    <Outlet context={{ setActiveTab, activeTab }} />
                </PageWrapper>
            </div>
        </div>
    )
}

export default DashboardLayout
