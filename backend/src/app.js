const express = require('express');
const cors = require('cors');

const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const clientesRoutes = require('./modules/clientes/clientes.routes');
const serviciosRoutes = require('./modules/servicios/servicios.routes');
const pedidosRoutes = require('./modules/pedidos/pedidos.routes');
const cajaRoutes = require('./modules/caja/caja.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/caja', cajaRoutes);

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
