const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    // 1. Check Session (for EJS Admin Panel)
    if (req.session && req.session.user) {
        return next();
    }

    // 2. Check JWT (for API calls)
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Store decoded user info (usually {id})
            return next();
        } catch (error) {
            console.error('JWT validation error:', error.message);
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }
        }
    }

    // 3. Handle Unauthorized
    if (req.xhr || req.headers.accept?.includes('application/json') || req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ message: 'Not authorized, please login' });
    }

    // Redirect to login for browsers
    res.redirect('/admin/login');
};

const adminOnly = (req, res, next) => {
    // Session-based admin check
    const isSessionAdmin = req.session && req.session.user && req.session.user.isAdmin;
    // JWT-based admin check (placeholder if isAdmin is in payload or needs DB lookup)
    const isJWTAdmin = req.user; // For now if they have a valid token we treat as admin for APIs

    if (isSessionAdmin || isJWTAdmin) {
        next();
    } else {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(403).json({ message: 'Not Authorized as Admin' });
        }
        res.status(403).send('Not Authorized as Admin');
    }
};

module.exports = { protect, adminOnly };
