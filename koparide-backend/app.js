/**
 * Application Entry (Express App)
 *
 * Loads middleware, routes, and centralized error handling.
 */

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();

const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middleware/error.middleware');

// Body parser
app.use(express.json());
if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
    app.use(cors());
    app.use(xss());
    app.use(hpp());
}
app.use(cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true // if you use cookies/auth headers
    }));
// Routes
app.use('/auth', authRoutes);

app.get('/', function (req, res) {
    res.json('NINJA');
});

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
