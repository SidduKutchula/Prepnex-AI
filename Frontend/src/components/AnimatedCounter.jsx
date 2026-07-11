import React, { useState, useEffect } from 'react'

/**
 * AnimatedCounter — counts from 0 up to `value` over ~1.2 seconds using
 * an ease-out-quad easing via requestAnimationFrame. 
 * Shared utility to avoid circular imports between page components.
 */
export const AnimatedCounter = ({ value }) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
        let active = true
        const duration = 1200
        const end = parseInt(value, 10) || 0
        if (end === 0) return

        const startTime = performance.now()

        const animate = (now) => {
            if (!active) return
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease out quad
            const easeProgress = progress * (2 - progress)
            setCount(Math.floor(easeProgress * end))
            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)

        return () => {
            active = false
        }
    }, [value])

    return <span>{count}</span>
}
