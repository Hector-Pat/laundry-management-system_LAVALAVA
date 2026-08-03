const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const clientesRoutes = require('./modules/clientes/clientes.routes');
const serviciosRoutes = require('./modules/servicios/servicios.routes');
const pedidosRoutes = require('./modules/pedidos/pedidos.routes');
const cajaRoutes = require('./modules/caja/caja.routes');
const reclamacionesRoutes = require('./modules/reclamaciones/reclamaciones.routes');
const auditoriaRoutes = require('./modules/auditoria/auditoria.routes');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/reclamaciones', reclamacionesRoutes);
app.use('/api/auditoria', auditoriaRoutes);

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Verifica que la API este en linea
 *     security: []
 *     responses:
 *       200:
 *         description: La API esta funcionando
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Laundry Management API is running
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Lava-Lava API Docs'
}));

app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(swaggerSpec);
});

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
