const express = require('express');
const cors = require('cors');

const authRoutes = require('./modules/auth/auth.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
    return res.status(200).json({
        message: 'Laundry Management API is running'
    });
});

app.use((req, res) => {
    return res.status(404).json({
        message: 'Route not found'
    });
});

app.use((error, req, res, _next) => {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
        message: error.message || 'Internal server error'
    });
});

module.exports = app;
