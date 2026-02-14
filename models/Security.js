const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const securitySchema = new mongoose.Schema({
    masterPassword: {
        type: String,
        required: true
    },
    securityEmail: {
        type: String,
        required: false // Can be set later
    },
    resetOTP: String,
    resetOTPExpires: Date,
    resetOTPAttempts: {
        type: Number,
        default: 0
    },
    resetOTPLockUntil: Date,
    failedAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    isSetupComplete: {
        type: Boolean,
        default: true
    },
    restrictedAccessLogs: [{
        action: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        userAgent: String,
        details: String
    }],
    messagesClearedAt: {
        type: Date,
        default: null
    },
    timelineClearedAt: {
        type: Date,
        default: null
    },
    additionsClearedAt: {
        type: Date,
        default: null
    },
    loginsClearedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Match master password
securitySchema.methods.matchMasterPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.masterPassword);
};

// Encrypt master password before saving
securitySchema.pre('save', async function () {
    if (!this.isModified('masterPassword')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.masterPassword = await bcrypt.hash(this.masterPassword, salt);
});

module.exports = mongoose.model('Security', securitySchema);
