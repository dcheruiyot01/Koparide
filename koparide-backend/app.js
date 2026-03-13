require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const xssClean = require('./middleware/xss.middleware'); // adjust path
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const path = require('path');
const compression = require('compression');

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const carRoutes = require('./routes/car.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Trust proxy – needed if behind a reverse proxy (e.g., Nginx, Heroku)
app.set('trust proxy', 1);

// Compression
app.use(compression());

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// ==================== SECURITY ====================
const helmetConfig = {
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: false, // we'll set per static route
};

if (process.env.NODE_ENV === 'production') {
    helmetConfig.contentSecurityPolicy = {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
            connectSrc: ["'self'", process.env.FRONTEND_URL],
        },
    };
} else {
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
app.use(xssClean);
app.use(hpp());

// ==================== CORS ====================
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
// ==================== STATIC FILES ====================
const staticOptions = {
    setHeaders: (res) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('Cache-Control', 'public, max-age=86400');
    },
};

app.use('/uploads/licenses', express.static(path.join(__dirname, 'uploads/licenses'), staticOptions));
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles'), staticOptions));
app.use('/uploads/cars', express.static(path.join(__dirname, 'uploads/cars'), staticOptions));
app.use('/uploads/cars/insurance', express.static(path.join(__dirname, 'uploads/cars/insurance'), staticOptions));
app.use('/uploads/cars/registration', express.static(path.join(__dirname, 'uploads/cars/registration'), staticOptions));

// ==================== ROUTES ====================
app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/cars', carRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== ERROR HANDLER ====================
app.use(errorHandler);

module.exports = app;