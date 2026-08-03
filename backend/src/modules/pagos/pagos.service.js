const pool = require('../../config/db');
const pagosRepository = require('./pagos.repository');
const pedidosRepository = require('../pedidos/pedidos.repository');
const auditoriaService = require('../auditoria/auditoria.service');
const { PAYMENT_METHOD_VALUES, PAYMENT_TYPES } = require('../../constants/paymentMethods');

function parseId(id, label = 'id') {
    const parsed = Number(id);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        const error = new Error(`Invalid ${label}`);
        error.statusCode = 400;
        throw error;
    }

    return parsed;
}

// Redondea a centavos para no arrastrar errores de punto flotante entre
// pagos parciales (0.1 + 0.2 !== 0.3).
function round2(value) {
    return Number(value.toFixed(2));
}

async function getSaldo(pedidoId) {
    const pedido = await pedidosRepository.findPedidoById(pedidoId);

    if (!pedido) {
        const error = new Error('Pedido not found');
        error.statusCode = 404;
        throw error;
    }

    const totalPagado = round2(await pagosRepository.sumByPedidoId(pedidoId));
    const saldoPendiente = round2(Number(pedido.total) - totalPagado);

    return { pedido, totalPagado, saldoPendiente };
}

async function getPaymentSummary(id) {
    const pedidoId = parseId(id, 'pedidoId');
    const { pedido, totalPagado, saldoPendiente } = await getSaldo(pedidoId);
    const pagos = await pagosRepository.listByPedidoId(pedidoId);

    return {
        pedidoId: pedido.id,
        total: pedido.total,
        totalPagado,
        saldoPendiente,
        pagos
    };
}

// Determina el tipo de pago a partir del saldo antes/despues del pago: de
// contado si liquida todo el total en un solo pago, adelanto si deja saldo
// pendiente, y saldo si termina de cubrir un pedido que ya tenia abonos.
function resolvePaymentType({ totalPagadoAntes, total, amount }) {
    const totalPagadoDespues = round2(totalPagadoAntes + amount);

    if (totalPagadoAntes === 0 && totalPagadoDespues === total) {
        return PAYMENT_TYPES.CONTADO;
    }

    if (totalPagadoDespues === total) {
        return PAYMENT_TYPES.SALDO;
    }

    return PAYMENT_TYPES.ADELANTO;
}

async function registerPayment(id, payload, currentUser) {
    const pedidoId = parseId(id, 'pedidoId');
    const amount = round2(Number(payload.amount));
    const method = payload.method || 'EFECTIVO';

    if (!Number.isFinite(amount) || amount <= 0) {
        const error = new Error('amount must be a positive number');
        error.statusCode = 400;
        throw error;
    }

    if (!PAYMENT_METHOD_VALUES.includes(method)) {
        const error = new Error('Invalid payment method');
        error.statusCode = 400;
        throw error;
    }

    // Bloquea la fila del pedido dentro de una transaccion para leer el
    // saldo e insertar el pago de forma atomica: sin esto, dos pagos
    // concurrentes podrian leer el mismo saldo pendiente y sobrepasar el
    // total del pedido.
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const pedido = await pedidosRepository.lockPedidoById(pedidoId, connection);

        if (!pedido) {
            const error = new Error('Pedido not found');
            error.statusCode = 404;
            throw error;
        }

        if (pedido.cancelledAt) {
            const error = new Error('This pedido has been cancelled');
            error.statusCode = 400;
            throw error;
        }

        const totalPagado = round2(await pagosRepository.sumByPedidoId(pedidoId, connection));
        const saldoPendiente = round2(Number(pedido.total) - totalPagado);

        if (saldoPendiente <= 0) {
            const error = new Error('This pedido has no pending balance');
            error.statusCode = 400;
            throw error;
        }

        if (amount > saldoPendiente) {
            const error = new Error(
                `amount (${amount}) exceeds the pending balance (${saldoPendiente})`
            );
            error.statusCode = 400;
            throw error;
        }

        const type = resolvePaymentType({
            totalPagadoAntes: totalPagado,
            total: Number(pedido.total),
            amount
        });

        await pagosRepository.create(
            {
                pedidoId,
                amount,
                method,
                type,
                registeredBy: currentUser.id
            },
            connection
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    return getPaymentSummary(pedidoId);
}

// Anular un pago no lo borra (queda como historial con quien y por que), y
// deja de contar para el saldo pendiente. Usa el mismo bloqueo de fila que
// registerPayment: anular y registrar un pago a la vez sobre el mismo
// pedido no debe pisarse.
async function voidPayment(id, pagoId, reason, currentUser) {
    const pedidoId = parseId(id, 'pedidoId');
    const parsedPagoId = parseId(pagoId, 'pagoId');

    if (typeof reason !== 'string' || !reason.trim()) {
        const error = new Error('reason is required');
        error.statusCode = 400;
        throw error;
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const pedido = await pedidosRepository.lockPedidoById(pedidoId, connection);

        if (!pedido) {
            const error = new Error('Pedido not found');
            error.statusCode = 404;
            throw error;
        }

        const pago = await pagosRepository.findById(parsedPagoId, connection);

        if (!pago || pago.pedidoId !== pedidoId) {
            const error = new Error('Pago not found');
            error.statusCode = 404;
            throw error;
        }

        if (pago.isVoided) {
            const error = new Error('This pago has already been voided');
            error.statusCode = 400;
            throw error;
        }

        await pagosRepository.voidPayment(parsedPagoId, reason.trim(), currentUser.id, connection);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    try {
        await auditoriaService.logAction(currentUser, 'ANULAR_PAGO', 'pago', parsedPagoId, {
            pedidoId,
            reason: reason.trim()
        });
    } catch (auditError) {
        console.warn(`No se pudo registrar en la bitacora la anulacion del pago ${parsedPagoId}: ${auditError.message}`);
    }

    return getPaymentSummary(pedidoId);
}

module.exports = {
    getPaymentSummary,
    registerPayment,
    voidPayment
};
