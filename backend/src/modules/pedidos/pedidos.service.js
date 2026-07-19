const pedidosRepository = require('./pedidos.repository');
const clientesService = require('../clientes/clientes.service');
const serviciosRepository = require('../servicios/servicios.repository');
const { ORDER_STATUS_VALUES } = require('../../constants/orderStatus');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parseId(id, label = 'id') {
    const parsed = Number(id);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        const error = new Error(`Invalid ${label}`);
        error.statusCode = 400;
        throw error;
    }

    return parsed;
}

// Valida la forma del cliente recibido, sin tocar la base de datos todavia:
// { id } para un cliente existente, o { fullName, phoneNumber, email? } para
// darlo de alta al vuelo. La creacion real ocurre dentro de la transaccion
// del pedido (pedidos.repository.js) para que ambas cosas sean atomicas.
function parseClienteInput(cliente) {
    if (!cliente || typeof cliente !== 'object') {
        const error = new Error('cliente is required');
        error.statusCode = 400;
        throw error;
    }

    if (cliente.id !== undefined) {
        return { mode: 'existing', id: parseId(cliente.id, 'cliente.id') };
    }

    if (!cliente.fullName || !cliente.phoneNumber) {
        const error = new Error(
            'cliente.fullName and cliente.phoneNumber are required for a new client'
        );
        error.statusCode = 400;
        throw error;
    }

    clientesService.validatePhone(cliente.phoneNumber);

    return {
        mode: 'new',
        fullName: cliente.fullName.trim(),
        phoneNumber: cliente.phoneNumber,
        email: cliente.email ? cliente.email.trim() : null
    };
}

async function buildItems(itemsPayload) {
    if (!Array.isArray(itemsPayload) || itemsPayload.length === 0) {
        const error = new Error('At least one service item is required');
        error.statusCode = 400;
        throw error;
    }

    const servicios = await serviciosRepository.listActive();
    const serviciosById = new Map(servicios.map((servicio) => [servicio.id, servicio]));

    return itemsPayload.map((item) => {
        const servicio = serviciosById.get(Number(item.servicioId));
        const quantity = Number(item.quantity);

        if (!servicio) {
            const error = new Error(`Invalid or inactive servicioId: ${item.servicioId}`);
            error.statusCode = 400;
            throw error;
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            const error = new Error('Item quantity must be a positive integer');
            error.statusCode = 400;
            throw error;
        }

        const unitPrice = Number(servicio.price);
        const subtotal = Number((unitPrice * quantity).toFixed(2));

        return {
            servicioId: servicio.id,
            servicioName: servicio.name,
            quantity,
            unitPrice,
            subtotal
        };
    });
}

async function createPedido(payload, currentUser) {
    const clienteInput = parseClienteInput(payload.cliente);
    const items = await buildItems(payload.items);
    const total = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));

    const pedidoId = await pedidosRepository.createPedidoWithItems({
        clienteInput,
        items,
        total,
        createdBy: currentUser.id
    });

    return pedidosRepository.findPedidoById(pedidoId);
}

async function getPedidoById(id) {
    const pedido = await pedidosRepository.findPedidoById(parseId(id));

    if (!pedido) {
        const error = new Error('Pedido not found');
        error.statusCode = 404;
        throw error;
    }

    return pedido;
}

function parsePagination(query) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, Number(query.pageSize) || DEFAULT_PAGE_SIZE)
    );

    return { page, pageSize };
}

async function listPedidos(query) {
    const { status, date, clienteId, cliente } = query;

    if (status && !ORDER_STATUS_VALUES.includes(status)) {
        const error = new Error('Invalid status filter');
        error.statusCode = 400;
        throw error;
    }

    const { page, pageSize } = parsePagination(query);

    return pedidosRepository.listPedidos({
        status: status || null,
        date: date || null,
        clienteId: clienteId ? parseId(clienteId, 'clienteId') : null,
        cliente: cliente || null,
        page,
        pageSize
    });
}

module.exports = {
    createPedido,
    getPedidoById,
    listPedidos,
    parseId
};
