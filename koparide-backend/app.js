/**
 * server.js
 * ---------
 * Main Express application entry point.
 * Configured for both development and production (DigitalOcean App Platform).
 * In production, static files are NOT served from disk – they are served from
 * DigitalOcean Spaces (CDN). File uploads go directly to Spaces via the SDK.
 */

require('dotenv').config(); // Load environment variables FIRST

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const xssClean = require('./middleware/xss.middleware');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const path = require('path');
const compression = require('compression');

// Import routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const profileRoutes = require('./routes/profile.routes');
const carRoutes = require('./routes/car.routes');
const reservationRoutes = require('./routes/reservation.routes');
const paymentRoutes = require('./routes/payment.routes');

// Import error handlers
const errorHandler = require('./middleware/error.middleware');
const { notFoundHandler } = require('./middleware/error.middleware');

const app = express();

// ==================== TRUST PROXY ====================
// Required when running behind a reverse proxy (e.g., DigitalOcean App Platform, Nginx)
app.set('trust proxy', 1);

// ==================== COMPRESSION ====================
// Gzip compress responses
app.use(compression());

// ==================== BODY PARSERS ====================
// Limit increased to 10MB for base64 images or large JSON payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser (for JWT stored in cookies if used)
app.use(cookieParser());

// ==================== SECURITY MIDDLEWARE ====================

// Helmet configuration – sets various HTTP headers for security
const helmetConfig = {
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: false, // we'll set per static route (if any)
};

// Content Security Policy (CSP) – different for dev and prod
if (process.env.NODE_ENV === 'production') {
    helmetConfig.contentSecurityPolicy = {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            // Allow images from self, data URIs, Unsplash, and our DigitalOcean Spaces CDN
            imgSrc: [
                "'self'",
                "data:",
                "https://images.unsplash.com",
                process.env.DO_SPACES_CDN_ENDPOINT, // e.g., https://wheelawaykenya.sfo3.cdn.digitaloceanspaces.com
            ],
            connectSrc: ["'self'", process.env.FRONTEND_URL],
        },
    };
} else {
    // Development CSP – more permissive for hot reloading and dev tools
    helmetConfig.contentSecurityPolicy = {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
            connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
        },
    };
}

app.use(helmet(helmetConfig));
app.use(xssClean);       // Prevent XSS attacks
app.use(hpp());          // Protect against HTTP Parameter Pollution

// ==================== CORS ====================
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,   // Allow cookies/auth headers
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ==================== STATIC FILES ====================
/**
 * IMPORTANT:
 * In PRODUCTION, we DO NOT serve static files from disk.
 * All uploaded files (car images, logbooks, insurance, profiles, etc.)
 * are stored in DigitalOcean Spaces and accessed via the CDN endpoint.
 *
 * In DEVELOPMENT only, we serve local uploads for testing.
 */
if (process.env.NODE_ENV !== 'production') {
    const staticOptions = { maxAge: '1d' }; // Cache for 1 day
    app.use('/uploads/licenses', express.static(path.join(__dirname, 'uploads/licenses'), staticOptions));
    app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles'), staticOptions));
    // Car images are stored under uploads/cars/images/ in development to mirror cloud structure
    app.use('/uploads/cars', express.static(path.join(__dirname, 'uploads/cars/images'), staticOptions));
    app.use('/uploads/cars/insurance', express.static(path.join(__dirname, 'uploads/cars/insurance'), staticOptions));
    app.use('/uploads/cars/registration', express.static(path.join(__dirname, 'uploads/cars/registration'), staticOptions));
}
// No unconditional static routes – production never serves from disk

// ==================== API ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint (useful for load balancers and monitoring)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== ERROR HANDLING ====================
// 404 handler for unmatched routes (must come after all other routes)
app.use(notFoundHandler);
// Global error handler (must be the LAST middleware)
app.use(errorHandler);

module.exports = app;