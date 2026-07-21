const reclamacionesRepository = require('./reclamaciones.repository');
const pedidosRepository = require('../pedidos/pedidos.repository');

function parseId(id, label = 'id') {
    const parsed = Number(id);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        const error = new Error(`Invalid ${label}`);
        error.statusCode = 400;
        throw error;
    }

    return parsed;
}

async function findPedidoOrThrow(pedidoId) {
    const pedido = await pedidosRepository.findPedidoById(pedidoId);

    if (!pedido) {
        const error = new Error('Pedido not found');
        error.statusCode = 404;
        throw error;
    }

    return pedido;
}

async function registerReclamacion(id, payload, currentUser) {
    const pedidoId = parseId(id, 'pedidoId');
    const description = typeof payload.description === 'string' ? payload.description.trim() : '';

    if (!description) {
        const error = new Error('description is required');
        error.statusCode = 400;
        throw error;
    }

    const pedido = await findPedidoOrThrow(pedidoId);

    return reclamacionesRepository.create({
        pedidoId,
        clienteId: pedido.cliente.id,
        description,
        registeredBy: currentUser.id
    });
}

async function listReclamaciones(id) {
    const pedidoId = parseId(id, 'pedidoId');
    await findPedidoOrThrow(pedidoId);

    return reclamacionesRepository.listByPedidoId(pedidoId);
}

module.exports = {
    registerReclamacion,
    listReclamaciones
};
