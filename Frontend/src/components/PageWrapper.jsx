import React from 'react'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'

/**
 * PageWrapper — lightweight entry animation for page content.
 * Uses only opacity + translateY to avoid layout thrashing.
 * Does NOT set width/height/minHeight to avoid shifting the page layout.
 */

const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

const PageWrapper = ({ children }) => {
    if (prefersReducedMotion) {
        return <>{children}</>
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 18, duration: 0.3 }}
        >
            {children}
        </motion.div>
    )
}

export default PageWrapper
