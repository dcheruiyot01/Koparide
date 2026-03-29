const axios = require('axios');
const logger = require('../utils/logger');

class MpesaService {
    constructor() {
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        this.shortCode = process.env.MPESA_SHORTCODE;
        this.passkey = process.env.MPESA_PASSKEY;
        this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
        this.baseURL = this.environment === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    async getAccessToken() {
        const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
        const url = `${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`;
        try {
            const response = await axios.get(url, {
                headers: { Authorization: `Basic ${auth}` }
            });
            return response.data.access_token;
        } catch (error) {
            logger.error('M‑Pesa token fetch failed:', error.message);
            throw new Error('Unable to obtain M‑Pesa access token');
        }
    }

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

    generatePassword(timestamp) {
        const data = this.shortCode + this.passkey + timestamp;
        return Buffer.from(data).toString('base64');
    }

    async stkPush(phoneNumber, amount, accountReference, transactionDesc) {
        const token = await this.getAccessToken();
        const timestamp = this.generateTimestamp();
        const password = this.generatePassword(timestamp);

        const payload = {
            BusinessShortCode: this.shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.floor(amount),         // ensure integer
            PartyA: phoneNumber,
            PartyB: this.shortCode,
            PhoneNumber: phoneNumber,
            CallBackURL: `${process.env.BASE_URL}/api/payments/mpesa-callback`,
            AccountReference: accountReference.slice(0, 12),
            TransactionDesc: transactionDesc.slice(0, 13),
        };

        const url = `${this.baseURL}/mpesa/stkpush/v1/processrequest`;
        try {
            const response = await axios.post(url, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data; // contains CheckoutRequestID, MerchantRequestID, etc.
        } catch (error) {
            // Log full error details
            if (error.response) {
                // Safaricom responded with an error
                logger.error('M‑Pesa API error response:', {
                    status: error.response.status,
                    data: error.response.data
                });
                throw new Error(`M‑Pesa API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                // No response received
                logger.error('M‑Pesa API no response:', error.request);
                throw new Error('M‑Pesa API not reachable (network error)');
            } else {
                // Other error
                logger.error('M‑Pesa request setup error:', error.message);
                throw new Error(`M‑Pesa request error: ${error.message}`);
            }
        }
    }
}

module.exports = new MpesaService();