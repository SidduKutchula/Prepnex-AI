/**
 * Centralized error handling middleware.
 * Ensures that unhandled exceptions do not crash the server or send raw HTML stack traces to clients.
 */
const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.url} - ${err.message}`);
    if (res.headersSent) return next(err);
    
    // Log stack trace only in development
    if (process.env.NODE_ENV !== "production") {
        console.error(err.stack);
    }

    const statusCode = err.statusCode || err.status || 500;
    
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            details: err.message
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        // Only include stack in development
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
    });
};

module.exports = errorHandler;
