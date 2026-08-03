const express = require('express');
const cajaController = require('./caja.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

router.use(authenticateToken, authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN));

/**
 * @openapi
 * /caja/corte:
 *   get:
 *     tags: [Caja]
 *     summary: Corte de caja diario
 *     description: >
 *       Ingresos = pagos cobrados, egresos = gastos registrados, total = lo que deberia
 *       quedar en caja ese dia. Sin `date`, agrega todos los pagos/gastos (sin filtrar por fecha).
 *     parameters:
 *       - name: date
 *         in: query
 *         description: Fecha del corte (YYYY-MM-DD). Si se omite, no filtra por fecha.
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Corte de caja
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Corte de caja retrieved successfully }
 *                 data: { $ref: '#/components/schemas/CorteCaja' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/corte', cajaController.corte);

/**
 * @openapi
 * /caja/reporte:
 *   get:
 *     tags: [Caja]
 *     summary: Reporte de caja por rango de fechas
 *     description: Agrupa ingresos y egresos por dia dentro del rango [from, to] para ver una tendencia.
 *     parameters:
 *       - name: from
 *         in: query
 *         required: true
 *         description: Fecha inicial (YYYY-MM-DD)
 *         schema: { type: string, format: date }
 *       - name: to
 *         in: query
 *         required: true
 *         description: Fecha final (YYYY-MM-DD), debe ser >= from
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Reporte de caja
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Reporte de caja retrieved successfully }
 *                 data: { $ref: '#/components/schemas/ReporteCaja' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/reporte', cajaController.reporte);

/**
 * @openapi
 * /caja/gastos:
 *   get:
 *     tags: [Caja]
 *     summary: Lista los gastos registrados
 *     parameters:
 *       - name: date
 *         in: query
 *         description: Filtra por fecha (YYYY-MM-DD)
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Gastos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Gastos retrieved successfully }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Gasto' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     tags: [Caja]
 *     summary: Registra un gasto de caja
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGastoRequest'
 *     responses:
 *       201:
 *         description: Gasto registrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Gasto registered successfully }
 *                 data: { $ref: '#/components/schemas/Gasto' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/gastos', cajaController.listGastos);
router.post('/gastos', cajaController.createGasto);

module.exports = router;
