const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Check for SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('Email Service: SMTP credentials not provided. Security alert skipped.');
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: `"Portfolio Security" <${process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Security Email Sent: %s', info.messageId);
    } catch (error) {
        console.error('Email Service Error:', error);
    }
};

const sendSecurityAlert = async (to, details) => {
    const html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
            <h2 style="color: ${details.status === 'SUCCESS' ? '#28a745' : '#dc3545'};">Security Alert: Restricted Access Attempt</h2>
            <p>A Master Password verification attempt was detected on your administrator panel.</p>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; color: ${details.status === 'SUCCESS' ? 'green' : 'red'};">${details.status}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Timestamp:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date().toLocaleString()}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>IP Address:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${details.ip}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>User Agent:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${details.userAgent}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Action:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${details.action}</td>
                </tr>
            </table>
            <p style="margin-top: 20px; font-size: 0.9em; color: #666;">If this wasn't you, please secure your admin account immediately.</p>
        </div>
    `;

    await sendEmail({
        to,
        subject: `[Security] Restricted Access ${details.status}: ${details.action}`,
        html
    });
};

const sendLockoutAlert = async (to, ip) => {
    const html = `
        <div style="font-family: sans-serif; padding: 20px; border: 2px solid #dc3545; border-radius: 10px; background-color: #fff5f5;">
            <h2 style="color: #dc3545;">CRITICAL: Restricted Access Locked</h2>
            <p>Your administrator panel's Restricted Access section has been <strong>locked</strong> due to too many failed Master Password attempts (7 failures).</p>
            <p><strong>Lockout Details:</strong></p>
            <ul>
                <li><strong>IP Address:</strong> ${ip}</li>
                <li><strong>Duration:</strong> 6 Hours</li>
                <li><strong>Status:</strong> Strict Freeze Active</li>
            </ul>
            <p style="margin-top: 20px; font-size: 0.9em; color: #666;">Further attempts will be blocked until the cooldown period ends.</p>
        </div>
    `;

    await sendEmail({
        to,
        subject: `[CRITICAL] Restricted Access Section LOCKED`,
        html
    });
};

module.exports = {
    sendSecurityAlert,
    sendLockoutAlert
};
