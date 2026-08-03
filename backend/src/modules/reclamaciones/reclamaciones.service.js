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

async function resolveReclamacion(id, reclamacionId, payload, currentUser) {
    const pedidoId = parseId(id, 'pedidoId');
    const parsedReclamacionId = parseId(reclamacionId, 'reclamacionId');
    const notes = typeof payload.resolutionNotes === 'string' ? payload.resolutionNotes.trim() : '';

    if (!notes) {
        const error = new Error('resolutionNotes is required');
        error.statusCode = 400;
        throw error;
    }

    const reclamacion = await reclamacionesRepository.findById(parsedReclamacionId);

    if (!reclamacion || reclamacion.pedidoId !== pedidoId) {
        const error = new Error('Reclamacion not found');
        error.statusCode = 404;
        throw error;
    }

    if (reclamacion.status === 'RESUELTA') {
        const error = new Error('This reclamacion has already been resolved');
        error.statusCode = 400;
        throw error;
    }

    return reclamacionesRepository.resolve(parsedReclamacionId, notes, currentUser.id);
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parsePagination(query) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, Number(query.pageSize) || DEFAULT_PAGE_SIZE)
    );

    return { page, pageSize };
}

async function listAllReclamaciones(query) {
    const { status } = query;

    if (status && !['ABIERTA', 'RESUELTA'].includes(status)) {
        const error = new Error('Invalid status filter');
        error.statusCode = 400;
        throw error;
    }

    const { page, pageSize } = parsePagination(query);

    return reclamacionesRepository.listAll({ status: status || null, page, pageSize });
}

module.exports = {
    registerReclamacion,
    listReclamaciones,
    resolveReclamacion,
    listAllReclamaciones
};
