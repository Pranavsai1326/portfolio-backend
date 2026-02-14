const User = require('../models/User');

// @desc    Auth user & get session
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    // Non-standard field names to break browser heuristics
    const { primary_credential_v1: username, security_token_payload: password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (user && (await user.matchPassword(password))) {
            // Record successful login using updateOne to avoid password re-hashing
            const loginRecord = {
                timestamp: new Date(),
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'],
                success: true
            };

            // Update user with login history
            await User.updateOne(
                { _id: user._id },
                {
                    $set: { lastLogin: new Date() },
                    $push: {
                        loginHistory: {
                            $each: [loginRecord],
                            $slice: -50 // Keep only last 50 records
                        }
                    }
                }
            );

            // Set session
            req.session.user = {
                _id: user._id,
                id: user._id,
                username: user.username,
                isAdmin: user.isAdmin
            };

            // If it's an AJAX/API request
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({
                    _id: user._id,
                    username: user.username,
                    isAdmin: user.isAdmin,
                    message: 'Login successful'
                });
            }

            // Redirect for form submission
            return res.redirect('/admin/dashboard');
        } else {
            // If API
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            // Render login with error
            return res.render('login', { error: 'Invalid username or password', layout: 'layouts/main' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
const logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Could not log out');
        }
        res.redirect('/admin/login');
    });
};

module.exports = { loginUser, logoutUser };
