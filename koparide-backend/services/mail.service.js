/**
 * Mail Service
 *
 * Handles all outgoing emails using Nodemailer.
 * Supports:
 *  - Password reset emails
 *  - Verification emails (future)
 *  - Notifications (future)
 */

const nodemailer = require('nodemailer');

class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: process.env.MAIL_SECURE === 'true', // true for 465, false for 587
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });
    }

    /**
     * Send a generic email
     */
    async sendMail({ to, subject, html }) {
        return this.transporter.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject,
            html
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, resetURL) {
        const html = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetURL}" target="_blank">${resetURL}</a>
      <p>This link expires in 10 minutes.</p>
    `;

        return this.sendMail({
            to: email,
            subject: 'Reset Your Password',
            html
        });
    }

    async sendVerificationEmail(email, verifyURL) {
        const html = `
            <h2>Verify Your Email</h2>
            <p>Click the link below to verify your email address:</p>
            <a href="${verifyURL}" target="_blank">${verifyURL}</a>
            <p>This link expires in 24 hours.</p>`;

        return this.sendMail({
            to: email,
            subject: 'Verify Your Email',
            html
        });
    }

}

module.exports = new MailService();
