/**
 * Generate a secure password reset token.
 *
 * - resetToken: plain token sent to the user (via email)
 * - hashedToken: stored in DB for secure comparison
 */

const crypto = require('crypto');

function generateResetToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    return { resetToken, hashedToken };
}

module.exports = generateResetToken;
