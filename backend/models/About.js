const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
    content: {
        type: String, // About text
        required: false
    },
    name: {
        type: String, // Admin Name
    },
    title: {
        type: String, // Professional Title
    },
    tagline: {
        type: String, // Hero Section Tagline
    },
    profileImage: {
        type: String, // URL to profile image
    },
    favicon: {
        type: String, // URL to favicon
    },
    resumeUrl: {
        type: String, // URL to resume file
    },
    securityNotice: {
        enabled: { type: Boolean, default: true },
        message: { type: String, default: 'Confidential Administrator Panel. This is a secure administrative environment where all activities may be logged for security purposes. Actions performed here directly affect live content and the portfolio system. Restricted access only — proceed with caution.' },
        timerDuration: { type: Number, default: 5, min: 0, max: 30 },
        blurEffect: { type: Boolean, default: true }
    }
}, { timestamps: true });

module.exports = mongoose.model('About', aboutSchema);
