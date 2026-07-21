const pagosRepository = require('./pagos.repository');
const pedidosRepository = require('../pedidos/pedidos.repository');
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

    const { pedido, totalPagado, saldoPendiente } = await getSaldo(pedidoId);

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

    await pagosRepository.create({
        pedidoId,
        amount,
        method,
        type,
        registeredBy: currentUser.id
    });

    return getPaymentSummary(pedidoId);
}

module.exports = {
    getPaymentSummary,
    registerPayment
};
