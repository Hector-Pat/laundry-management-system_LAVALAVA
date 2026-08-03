const express = require('express');
const pedidosController = require('./pedidos.controller');
const pagosController = require('../pagos/pagos.controller');
const reclamacionesController = require('../reclamaciones/reclamaciones.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

router.use(authenticateToken);

/**
 * @openapi
 * /pedidos:
 *   post:
 *     tags: [Pedidos]
 *     summary: Crea un pedido
 *     description: >
 *       Requiere rol RECEPCIONISTA o ADMIN. El cliente puede ser uno existente
 *       (`{ id }`) o darse de alta al vuelo (`{ fullName, phoneNumber, email? }`)
 *       dentro de la misma transaccion. La respuesta incluye el QR (data URL) con el folio.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePedidoRequest'
 *     responses:
 *       201:
 *         description: Pedido creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Pedido created successfully }
 *                 data: { $ref: '#/components/schemas/Pedido' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   get:
 *     tags: [Pedidos]
 *     summary: Lista pedidos (mostrador)
 *     description: Requiere rol RECEPCIONISTA, OPERADOR o ADMIN.
 *     parameters:
 *       - name: status
 *         in: query
 *         description: Filtra por estado del pedido
 *         schema: { $ref: '#/components/schemas/OrderStatus' }
 *       - name: date
 *         in: query
 *         description: Filtra por fecha de creacion (YYYY-MM-DD)
 *         schema: { type: string, format: date }
 *       - name: clienteId
 *         in: query
 *         description: Filtra por id de cliente
 *         schema: { type: integer }
 *       - name: cliente
 *         in: query
 *         description: Filtra por nombre/telefono de cliente
 *         schema: { type: string }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PageSizeParam'
 *     responses:
 *       200:
 *         description: Pedidos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Pedidos retrieved successfully }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Pedido' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
    '/',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN),
    pedidosController.create
);

router.get(
    '/',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.OPERADOR, USER_ROLES.ADMIN),
    pedidosController.list
);

// Portal de cliente (debe ir antes de GET /:id para que "mias" no se
// interprete como un id de pedido).
/**
 * @openapi
 * /pedidos/mias:
 *   get:
 *     tags: [Pedidos]
 *     summary: Lista los pedidos del cliente autenticado (portal de cliente)
 *     description: >
 *       Requiere rol CLIENT. Enlaza la cuenta con el directorio de clientes por
 *       coincidencia exacta de email o telefono; si no coincide con ningun cliente
 *       de mostrador, la lista sale vacia.
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PageSizeParam'
 *     responses:
 *       200:
 *         description: Pedidos del cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Pedidos retrieved successfully }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Pedido' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/mias',
    authorizeRoles(USER_ROLES.CLIENT),
    pedidosController.listMine
);

/**
 * @openapi
 * /pedidos/{id}:
 *   get:
 *     tags: [Pedidos]
 *     summary: Obtiene un pedido por id
 *     description: Requiere rol RECEPCIONISTA, OPERADOR o ADMIN.
 *     parameters:
 *       - $ref: '#/components/parameters/PedidoId'
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Pedido retrieved successfully }
 *                 data: { $ref: '#/components/schemas/Pedido' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
    '/:id',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.OPERADOR, USER_ROLES.ADMIN),
    pedidosController.getById
);

// El rol exacto permitido depende del estado actual del pedido (ver
// ORDER_TRANSITIONS), asi que aqui solo se descarta a CLIENT y la
// validacion fina queda en pedidos.service.js.
/**
 * @openapi
 * /pedidos/{id}/estado:
 *   patch:
 *     tags: [Pedidos]
 *     summary: Avanza (o fuerza) el estado de un pedido
 *     description: >
 *       Requiere rol RECEPCIONISTA, OPERADOR o ADMIN. La maquina de estados es lineal
 *       (RECIBIDO -> LAVADO -> SECADO -> PLANCHADO -> LISTO -> ENTREGADO) y cada transicion
 *       solo la puede hacer un rol especifico (OPERADOR hasta LISTO, RECEPCIONISTA a ENTREGADO).
 *       Un ADMIN puede forzar cualquier estado valido, saltandose la secuencia; ese forzado
 *       queda registrado en la bitacora de auditoria. Al llegar a LISTO se intenta notificar
 *       al cliente por WhatsApp (best-effort, no bloquea la respuesta si falla).
 *     parameters:
 *       - $ref: '#/components/parameters/PedidoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePedidoStatusRequest'
 *     responses:
 *       200:
 *         description: Estado actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Pedido status updated successfully }
 *                 data: { $ref: '#/components/schemas/Pedido' }
 *       400:
 *         description: Estado invalido, transicion no permitida, o el pedido ya fue entregado/cancelado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
    '/:id/estado',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.OPERADOR, USER_ROLES.ADMIN),
    pedidosController.updateStatus
);

// Editar detalle: solo pedidos en RECIBIDO sin pagos, ver comentario en
// pedidos.service.js::updatePedidoItemsService.
/**
 * @openapi
 * /pedidos/{id}/items:
 *   put:
 *     tags: [Pedidos]
 *     summary: Reemplaza los items (detalle) de un pedido
 *     description: >
 *       Requiere rol RECEPCIONISTA o ADMIN. Solo se puede editar un pedido mientras esta en
 *       estado RECIBIDO y no tiene pagos registrados; de lo contrario responde 400.
 *     parameters:
 *       - $ref: '#/components/parameters/PedidoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePedidoItemsRequest'
 *     responses:
 *       200:
 *         description: Pedido actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Pedido items updated successfully }
 *                 data: { $ref: '#/components/schemas/Pedido' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
    '/:id/items',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN),
    pedidosController.updateItems
);

// Cancelar pedido: no reembolsa pagos automaticamente, ver comentario en
// pedidos.service.js::cancelPedido.
/**
 * @openapi
 * /pedidos/{id}/cancelar:
 *   patch:
 *     tags: [Pedidos]
 *     summary: Cancela un pedido
 *     description: >
 *       Requiere rol RECEPCIONISTA o ADMIN. No reembolsa pagos ya registrados automaticamente
 *       (para eso existe la anulacion manual de un pago). No se puede cancelar un pedido ya
 *       entregado o ya cancelado.
 *     parameters:
 *       - $ref: '#/components/parameters/PedidoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelPedidoRequest'
 *     responses:
 *       200:
 *         description: Pedido cancelado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Pedido cancelled successfully }
 *                 data: { $ref: '#/components/schemas/Pedido' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
    '/:id/cancelar',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN),
    pedidosController.cancel
);

// Pagos (RF-06): solo quien cobra en mostrador registra o consulta el
// desglose de pagos/saldo de un pedido.
/**
 * @openapi
 * /pedidos/{id}/pagos:
 *   get:
 *     tags: [Pagos]
 *     summary: Obtiene el desglose de pagos y saldo de un pedido
 *     description: Requiere rol RECEPCIONISTA o ADMIN.
 *     parameters:
 *       - $ref: '#/components/parameters/PedidoId'
 *     responses:
 *       200:
 *         description: Resumen de pagos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Payments retrieved successfully }
 *                 data: { $ref: '#/components/schemas/PaymentSummary' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   post:
 *     tags: [Pagos]
 *     summary: Registra un pago sobre un pedido
 *     description: >
 *       Requiere rol RECEPCIONISTA o ADMIN. El tipo de pago (CONTADO/ADELANTO/SALDO) se
 *       calcula automaticamente segun el saldo antes/despues del pago. El monto no puede
 *       exceder el saldo pendiente. Operacion transaccional con bloqueo de fila para evitar
 *       sobrepagos por pagos concurrentes.
 *     parameters:
 *       - $ref: '#/components/parameters/PedidoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePagoRequest'
 *     responses:
 *       201:
 *         description: Pago registrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Payment registered successfully }
 *                 data: { $ref: '#/components/schemas/PaymentSummary' }
 *       400:
 *         description: Monto invalido, metodo invalido, pedido cancelado, sin saldo pendiente, o monto mayor al saldo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
    '/:id/pagos',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN),
    pagosController.list
);

router.post(
    '/:id/pagos',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN),
    pagosController.create
);

/**
 * @openapi
 * /pedidos/{id}/pagos/{pagoId}/anular:
 *   patch:
 *     tags: [Pagos]
 *     summary: Anula un pago
 *     description: >
 *       Requiere rol RECEPCIONISTA o ADMIN. No borra el pago, lo marca como anulado (queda
 *       como historial con quien y por que) y deja de contar para el saldo pendiente.
 *     parameters:
 *       - $ref: '#/components/parameters/PedidoId'
 *       - $ref: '#/components/parameters/PagoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoidPagoRequest'
 *     responses:
 *       200:
 *         description: Pago anulado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Payment voided successfully }
 *                 data: { $ref: '#/components/schemas/PaymentSummary' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Pedido o pago no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch(
    '/:id/pagos/:pagoId/anular',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN),
    pagosController.voidPayment
);

// Daños/reclamaciones (RF-09): cualquier miembro de piso puede reportar uno,
// ya sea al recibir el pedido o al detectarlo durante el proceso.
/**
 * @openapi
 * /pedidos/{id}/reclamaciones:
 *   get:
 *     tags: [Reclamaciones]
 *     summary: Lista las reclamaciones de un pedido
 *     description: Requiere rol RECEPCIONISTA, OPERADOR o ADMIN.
 *     parameters:
 *       - $ref: '#/components/parameters/PedidoId'
 *     responses:
 *       200:
 *         description: Reclamaciones del pedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Reclamaciones retrieved successfully }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Reclamacion' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   post:
 *     tags: [Reclamaciones]
 *     summary: Registra una reclamacion sobre un pedido
 *     description: Requiere rol RECEPCIONISTA, OPERADOR o ADMIN.
 *     parameters:
 *       - $ref: '#/components/parameters/PedidoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReclamacionRequest'
 *     responses:
 *       201:
 *         description: Reclamacion registrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Reclamacion registered successfully }
 *                 data: { $ref: '#/components/schemas/Reclamacion' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
    '/:id/reclamaciones',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.OPERADOR, USER_ROLES.ADMIN),
    reclamacionesController.list
);

router.post(
    '/:id/reclamaciones',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.OPERADOR, USER_ROLES.ADMIN),
    reclamacionesController.create
);

/**
 * @openapi
 * /pedidos/{id}/reclamaciones/{reclamacionId}/resolver:
 *   patch:
 *     tags: [Reclamaciones]
 *     summary: Resuelve una reclamacion
 *     description: Requiere rol RECEPCIONISTA o ADMIN.
 *     parameters:
 *       - $ref: '#/components/parameters/PedidoId'
 *       - $ref: '#/components/parameters/ReclamacionId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResolveReclamacionRequest'
 *     responses:
 *       200:
 *         description: Reclamacion resuelta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Reclamacion resolved successfully }
 *                 data: { $ref: '#/components/schemas/Reclamacion' }
 *       400:
 *         description: Notas de resolucion faltantes o la reclamacion ya estaba resuelta
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Pedido o reclamacion no encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch(
    '/:id/reclamaciones/:reclamacionId/resolver',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN),
    reclamacionesController.resolve
);

module.exports = router;
