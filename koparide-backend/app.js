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
const cookieParser = require('cookie-parser');
const path = require("path");

const app = express();

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const carRoutes = require('./routes/car.routes');
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

app.use(cookieParser()); // <-- this populates req.cookies
// Routes
app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/cars', carRoutes);
// Serve uploaded images
app.use("/uploads/licenses", express.static(path.join(__dirname, "uploads/licenses")));
app.use("/uploads/profiles", express.static(path.join(__dirname, "uploads/profiles")));
app.use("/uploads/cars", express.static(path.join(__dirname, "uploads/cars")));
app.use("/uploads/cars/insurance", express.static(path.join(__dirname, "uploads/cars/insurance")));
app.use("/uploads/cars/registration", express.static(path.join(__dirname, "uploads/cars/registration")));

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
