const clientesRepository = require('./clientes.repository');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function validatePhone(phoneNumber) {
    if (!/^\d{10}$/.test(phoneNumber)) {
        const error = new Error('Phone number must contain exactly 10 digits');
        error.statusCode = 400;
        throw error;
    }
}

function parseId(id) {
    const parsed = Number(id);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        const error = new Error('Invalid cliente id');
        error.statusCode = 400;
        throw error;
    }

    return parsed;
}

function parsePagination(query) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, Number(query.pageSize) || DEFAULT_PAGE_SIZE)
    );

    return { page, pageSize };
}

async function listClientes(query) {
    const { page, pageSize } = parsePagination(query);

    return clientesRepository.listPaginated({
        cliente: query.cliente || null,
        page,
        pageSize
    });
}

async function getClienteById(id) {
    const clienteId = parseId(id);
    const cliente = await clientesRepository.findById(clienteId);

    if (!cliente) {
        const error = new Error('Cliente not found');
        error.statusCode = 404;
        throw error;
    }

    return cliente;
}

async function updateCliente(id, payload) {
    const clienteId = parseId(id);
    const existing = await clientesRepository.findById(clienteId);

    if (!existing) {
        const error = new Error('Cliente not found');
        error.statusCode = 404;
        throw error;
    }

    const changes = {};

    if (payload.fullName !== undefined) {
        if (!payload.fullName || !payload.fullName.trim()) {
            const error = new Error('fullName is required');
            error.statusCode = 400;
            throw error;
        }
        changes.fullName = payload.fullName.trim();
    }

    if (payload.phoneNumber !== undefined) {
        validatePhone(payload.phoneNumber);
        changes.phoneNumber = payload.phoneNumber;
    }

    if (payload.email !== undefined) {
        changes.email = payload.email ? payload.email.trim() : null;
    }

    if (Object.keys(changes).length === 0) {
        const error = new Error('No valid fields to update');
        error.statusCode = 400;
        throw error;
    }

    return clientesRepository.update(clienteId, changes);
}

async function searchClientes(query) {
    if (!query || query.trim().length < 2) {
        const error = new Error('Search query must be at least 2 characters long');
        error.statusCode = 400;
        throw error;
    }

    return clientesRepository.search(query.trim());
}

// executor opcional: permite que pedidos.service.js cree el cliente dentro
// de la misma transaccion que el pedido (ver pedidos.repository.js).
async function createCliente(data, executor) {
    const { fullName, phoneNumber, email } = data;

    if (!fullName || !phoneNumber) {
        const error = new Error('fullName and phoneNumber are required');
        error.statusCode = 400;
        throw error;
    }

    validatePhone(phoneNumber);

    return clientesRepository.create(
        {
            fullName: fullName.trim(),
            phoneNumber,
            email: email ? email.trim() : null
        },
        executor
    );
}

module.exports = {
    searchClientes,
    createCliente,
    validatePhone,
    listClientes,
    getClienteById,
    updateCliente
};
