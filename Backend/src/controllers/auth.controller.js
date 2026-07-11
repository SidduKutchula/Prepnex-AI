const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")
const { OAuth2Client } = require('google-auth-library');
const asyncHandler = require("../utils/asyncHandler");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @name googleLoginController
 * @description Verify Google ID token, create-or-find user, issue JWT cookie
 * @access Public
 */
const googleLoginController = asyncHandler(async (req, res) => {
    try {
        const token = req.body.token || req.body.credential;
        
        if (!token) {
            return res.status(400).json({ success: false, error: 'Missing Google token', code: 'NO_TOKEN' });
        }

        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (jwtErr) {
            return res.status(401).json({ success: false, error: 'Invalid Google token', code: 'TOKEN_INVALID' });
        }

        if (!payload?.email) {
            return res.status(400).json({ success: false, error: 'Google account has no email', code: 'NO_EMAIL' });
        }

        let user = await userModel.findOne({ email: payload.email });
        
        if (!user) {
            const baseUsername = (payload.name || payload.email.split('@')[0]).replace(/\s+/g, '');
            let finalUsername = baseUsername;
            let counter = 1;
            while (await userModel.findOne({ username: finalUsername })) {
                finalUsername = `${baseUsername}${counter++}`;
            }

            user = await userModel.create({
                email: payload.email,
                name: payload.name,
                username: finalUsername,
                googleId: payload.sub,
                avatar: payload.picture,
            });
        }

        const jwtToken = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', jwtToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: 'Authentication successful',
            user: { id: user._id, email: user.email, username: user.username, name: user.name }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message, code: err.name || 'INTERNAL_ERROR' });
    }
});

/**
 * @name logoutUserController
 * @description Clear JWT cookie and blacklist the token
 * @access Public
 */
const logoutUserController = asyncHandler(async (req, res) => {
    const token = req.cookies?.token;

    if (token) {
        await tokenBlacklistModel.create({ token });
    }

    res.clearCookie("token");
    res.status(200).json({ success: true, message: "User logged out successfully" });
});

/**
 * @name getMeController
 * @description Return current authenticated user
 * @access Private (via checkUser middleware)
 */
const getMeController = asyncHandler(async (req, res) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({ success: false, error: 'Not authenticated', code: 'NO_TOKEN' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtErr) {
            console.warn('[Auth:GetMe] Invalid/expired token:', jwtErr.message);
            return res.status(401).json({ success: false, error: 'Session expired, please log in again', code: 'TOKEN_INVALID' });
        }

        const userId = decoded.id || decoded.userId;
        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
        }

        return res.status(200).json({
            success: true,
            isAuthenticated: true,
            user: { id: user._id, username: user.username, email: user.email, name: user.name, avatar: user.avatar }
        });
    } catch (err) {
        console.error('[Auth:GetMe] FULL ERROR:', err);
        return res.status(500).json({ success: false, error: err.message, code: err.name || 'INTERNAL_ERROR' });
    }
});

module.exports = {
    googleLoginController,
    logoutUserController,
    getMeController
}