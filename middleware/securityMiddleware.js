const rateLimit = require('express-rate-limit');
const ms = require('ms');
const Security = require('../models/Security');
const { sendSecurityAlert, sendLockoutAlert } = require('../services/emailService');

// Rate limiter for security-sensitive actions
const securityRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Increased slightly to allow for UI retries within reason
    message: {
        message: 'Too many security checks, please try again in 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware to verify Master Password with Lockout & Notifications
const verifyMasterPassword = async (req, res, next) => {
    try {
        const { masterPassword } = req.body;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const action = req.originalUrl.split('/').pop().toUpperCase(); // e.g., FACTORY-RESET, VERIFY, UPDATE

        const security = await Security.findOne();
        if (!security) {
            return res.status(404).json({ message: 'Security configuration not found' });
        }

        // 1. Check if Locked
        if (security.lockUntil && security.lockUntil > Date.now()) {
            const remaining = ms(security.lockUntil - Date.now(), { long: true });
            return res.status(423).json({
                message: `Security Freeze Active. Restricted Access is locked for another ${remaining}.`,
                lockUntil: security.lockUntil,
                failedAttempts: security.failedAttempts,
                remainingAttempts: 0
            });
        }

        if (!masterPassword) {
            return res.status(400).json({
                message: 'Master Password is required',
                failedAttempts: security.failedAttempts,
                remainingAttempts: 7 - security.failedAttempts
            });
        }

        // 2. Perform Matching
        const isMatch = await security.matchMasterPassword(masterPassword);

        const details = { ip, userAgent, action, status: isMatch ? 'SUCCESS' : 'FAILURE' };

        if (!isMatch) {
            // INCREMENT FAILED ATTEMPTS
            security.failedAttempts += 1;

            if (security.failedAttempts >= 7) {
                security.lockUntil = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 Hours
                await security.save();

                if (security.securityEmail) {
                    await sendLockoutAlert(security.securityEmail, ip);
                }

                return res.status(423).json({
                    message: 'Maximum attempts exceeded. Restricted Access has been locked for 6 hours.',
                    lockUntil: security.lockUntil,
                    failedAttempts: security.failedAttempts,
                    remainingAttempts: 0
                });
            }

            await security.save();

            // Send Alert for Failure (unless locked out already handled above)
            if (security.securityEmail) {
                await sendSecurityAlert(security.securityEmail, details);
            }

            return res.status(401).json({
                message: `Invalid Master Password.`,
                failedAttempts: security.failedAttempts,
                remainingAttempts: 7 - security.failedAttempts
            });
        }

        // 3. SUCCESS Logic
        security.failedAttempts = 0;
        security.lockUntil = null;
        await security.save();

        if (security.securityEmail) {
            await sendSecurityAlert(security.securityEmail, details);
        }

        // 4. Set Session Flag for Auto-Lock (60s Session)
        req.session.restrictedUnlocked = true;
        req.session.restrictedExpiresAt = Date.now() + 180 * 1000;
        req.session.extensionCount = 0; // Initialize extension counter

        next();
    } catch (error) {
        console.error('Enhanced Master Password Verification Error:', error);
        res.status(500).json({
            message: 'Internal Server Error during high-tier verification',
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Middleware to ensure Restricted Access session is valid
const ensureRestrictedUnlocked = (req, res, next) => {
    if (req.session && req.session.restrictedUnlocked) {
        // Double check expiration server-side
        if (req.session.restrictedExpiresAt && Date.now() < req.session.restrictedExpiresAt) {
            return next();
        }

        // Session expired
        req.session.restrictedUnlocked = false;
        req.session.restrictedExpiresAt = null;
    }
    res.status(403).json({
        message: 'Restricted Access is locked. Please re-authenticate.',
        locked: true
    });
};

module.exports = {
    securityRateLimiter,
    verifyMasterPassword,
    ensureRestrictedUnlocked
};
