// services/mpesa.service.js
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * M-Pesa Service Class
 * Handles STK Push (Lipa Na M-Pesa Online) transactions
 * Supports both sandbox and production environments
 */
class MpesaService {
    constructor() {
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        this.shortCode = process.env.MPESA_SHORTCODE;
        this.passkey = process.env.MPESA_PASSKEY;
        this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';

        // Set base URL based on environment
        this.baseURL = this.environment === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';

        // Get callback URL from environment with fallback
        this.callbackUrl = this.getValidCallbackUrl();

        // Token cache
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Get valid callback URL from environment variables
     * Ensures URL is properly formatted for M-Pesa requirements
     */
    getValidCallbackUrl() {
        let callbackUrl = process.env.MPESA_CALLBACK_URL || process.env.BASE_URL;

        // Default fallback based on environment
        if (!callbackUrl) {
            callbackUrl = this.environment === 'production'
                ? 'https://yourdomain.com'
                : 'https://your-ngrok-url.ngrok.io'; // Use ngrok for local testing
        }

        // Remove trailing slash if present
        callbackUrl = callbackUrl.replace(/\/$/, '');

        // Append the callback endpoint
        const fullCallbackUrl = `${callbackUrl}/api/payments/mpesa-callback`;
        console.log(fullCallbackUrl);
        // Validate URL format
        try {
            new URL(fullCallbackUrl);
            if (this.environment === 'production' && !fullCallbackUrl.startsWith('https://')) {
                logger.warn('Production callback URL should use HTTPS');
            }
        } catch (error) {
            logger.error('Invalid callback URL configured:', fullCallbackUrl);
            throw new Error('Invalid MPESA_CALLBACK_URL configuration');
        }

        return fullCallbackUrl;
    }

    /**
     * Format phone number to M-Pesa required format
     * Converts 0712345678 -> 254712345678
     * Converts +254712345678 -> 254712345678
     * @param {string} phoneNumber - Raw phone number input
     * @returns {string} Formatted phone number
     * @throws {Error} If phone number is invalid
     */
    formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) {
            throw new Error('Phone number is required');
        }

        // Convert to string and remove any spaces, dashes, or special characters
        let cleaned = phoneNumber.toString().replace(/[\s\-\(\)]/g, '');

        // Remove leading '+'
        if (cleaned.startsWith('+')) {
            cleaned = cleaned.substring(1);
        }

        // If it starts with 0, replace with 254 (Kenya code)
        if (cleaned.startsWith('0')) {
            cleaned = '254' + cleaned.substring(1);
        }

        // If it already starts with 254, keep as is
        if (cleaned.startsWith('254')) {
            // Validate length (254 + 9 digits = 12 total)
            if (cleaned.length !== 12) {
                throw new Error('Invalid phone number length. Expected 12 digits after 254 code');
            }
            return cleaned;
        }

        // Validate final format for M-Pesa (must start with 254 followed by 1 or 7)
        const mpesaRegex = /^254[17]\d{8}$/;
        if (!mpesaRegex.test(cleaned)) {
            throw new Error('Valid M-Pesa phone number required (format 254XXXXXXXXX)');
        }

        return cleaned;
    }

    /**
     * Get OAuth access token from Safaricom
     * Implements token caching to avoid unnecessary API calls
     */
    async getAccessToken() {
        // Check if cached token is still valid (with 5-minute buffer)
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
            logger.debug('Using cached access token');
            return this.accessToken;
        }

        const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
        const url = `${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`;

        try {
            logger.info('Fetching new M-Pesa access token');
            const response = await axios.get(url, {
                headers: { Authorization: `Basic ${auth}` },
                timeout: 10000 // 10 second timeout
            });

            // Cache token with 1-hour expiry (typical M-Pesa token lifetime)
            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in || 3600) * 1000;

            logger.info('M-Pesa access token obtained successfully');
            return this.accessToken;
        } catch (error) {
            logger.error('M-Pesa token fetch failed:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            throw new Error('Unable to obtain M-Pesa access token. Please check your credentials.');
        }
    }

    /**
     * Generate timestamp in required format (YYYYMMDDHHMMSS)
     * @returns {string} Formatted timestamp
     */
    generateTimestamp() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    /**
     * Generate base64 encoded password for STK push
     * @param {string} timestamp - Timestamp string
     * @returns {string} Base64 encoded password
     */
    generatePassword(timestamp) {
        const data = this.shortCode + this.passkey + timestamp;
        return Buffer.from(data).toString('base64');
    }

    /**
     * Initiate STK Push (Lipa Na M-Pesa Online) transaction
     * @param {string} phoneNumber - Customer phone number (format: 254XXXXXXXXX)
     * @param {number} amount - Transaction amount
     * @param {string} accountReference - Reference for the transaction (max 12 chars)
     * @param {string} transactionDesc - Transaction description (max 13 chars)
     * @returns {Promise<Object>} M-Pesa API response
     */
    async stkPush(phoneNumber, amount, accountReference, transactionDesc) {
        // Validate required parameters
        if (!phoneNumber) {
            throw new Error('Phone number is required for STK push');
        }

        if (!amount || amount <= 0) {
            throw new Error('Valid amount is required for STK push');
        }

        // Format phone number to M-Pesa required format
        let formattedPhone;
        try {
            formattedPhone = this.formatPhoneNumber(phoneNumber);
            logger.info(`Formatted phone number: ${phoneNumber} -> ${formattedPhone}`);
        } catch (error) {
            logger.error('Phone number formatting failed:', error.message);
            throw error;
        }

        // Validate amount
        const validAmount = Math.floor(Number(amount));
        if (isNaN(validAmount) || validAmount < 1) {
            throw new Error('Invalid amount provided');
        }

        // Get access token
        const token = await this.getAccessToken();

        // Generate timestamp and password
        const timestamp = this.generateTimestamp();
        const password = this.generatePassword(timestamp);

        // Prepare STK push payload
        const payload = {
            BusinessShortCode: this.shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: validAmount,
            PartyA: formattedPhone,      // Customer phone number
            PartyB: this.shortCode,      // Business short code
            PhoneNumber: formattedPhone,  // Customer phone number
            CallBackURL: this.callbackUrl, // ✅ Using configured callback URL
            AccountReference: accountReference.slice(0, 12), // Max 12 chars
            TransactionDesc: transactionDesc.slice(0, 13),   // Max 13 chars
        };

        const url = `${this.baseURL}/mpesa/stkpush/v1/processrequest`;

        try {
            logger.info(`Initiating STK Push for ${formattedPhone}, amount: ${validAmount}`);

            const response = await axios.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout for STK push
            });

            // Log success but mask sensitive data
            logger.info('STK Push initiated successfully', {
                CheckoutRequestID: response.data?.CheckoutRequestID,
                ResponseCode: response.data?.ResponseCode,
                ResponseDescription: response.data?.ResponseDescription
            });

            return response.data; // Contains CheckoutRequestID, MerchantRequestID, etc.

        } catch (error) {
            // Handle different types of errors
            if (error.response) {
                // Safaricom responded with an error
                const errorData = error.response.data;
                const errorCode = errorData?.errorCode;
                const errorMessage = errorData?.errorMessage;

                logger.error('M-Pesa API error response:', {
                    status: error.response.status,
                    errorCode: errorCode,
                    errorMessage: errorMessage,
                    requestId: errorData?.requestId
                });

                // Provide user-friendly error messages
                if (errorCode === '400.002.02') {
                    throw new Error('Invalid callback URL configuration. Please contact support.');
                } else if (errorCode === '500.001.1001') {
                    throw new Error('Invalid consumer key or consumer secret');
                } else if (errorMessage?.includes('timeout')) {
                    throw new Error('M-Pesa request timeout. Please try again.');
                } else {
                    throw new Error(`M-Pesa API error: ${errorMessage || 'Unknown error occurred'}`);
                }

            } else if (error.request) {
                // No response received from Safaricom
                logger.error('M-Pesa API no response:', error.request);
                throw new Error('M-Pesa service is currently unavailable. Please try again later.');

            } else {
                // Other error (configuration, validation, etc.)
                logger.error('M-Pesa request setup error:', error.message);
                throw new Error(`Payment service error: ${error.message}`);
            }
        }
    }

    /**
     * Clear cached access token (useful for testing or when token issues occur)
     */
    clearTokenCache() {
        this.accessToken = null;
        this.tokenExpiry = null;
        logger.info('M-Pesa token cache cleared');
    }
}

module.exports = new MpesaService();