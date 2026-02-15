const nodemailer = require('nodemailer');
// dotenv is loaded in index/server.js usually, but good to be safe if standalone testing
// require('dotenv').config(); 

/*
 * Email Configuration using Nodemailer
 * Expects EMAIL_USER and EMAIL_PASS in .env
 * If missing, returns null to trigger dev/console fallback
 */

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('Initializing Email Transporter...');
    transporter = nodemailer.createTransport({
        service: 'gmail', // Default to Gmail, can be extended via env
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
} else {
    // Check if we are in production - if so, this is critical
    if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: Email credentials missing in production!');
    } else {
        console.warn('Email credentials missing. OTP will be logged to console (Dev Mode).');
    }
}

module.exports = transporter;
