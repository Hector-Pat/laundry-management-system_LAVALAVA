const clientesRepository = require('./clientes.repository');

function validatePhone(phoneNumber) {
    if (!/^\d{10}$/.test(phoneNumber)) {
        const error = new Error('Phone number must contain exactly 10 digits');
        error.statusCode = 400;
        throw error;
    }
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
    validatePhone
};
