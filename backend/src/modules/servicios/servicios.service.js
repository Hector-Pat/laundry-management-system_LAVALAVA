const serviciosRepository = require('./servicios.repository');

async function listActiveServicios() {
    return serviciosRepository.listActive();
}

async function listAllServicios() {
    return serviciosRepository.listAll();
}

function parseServicioId(id) {
    const parsed = Number(id);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        const error = new Error('Invalid servicio id');
        error.statusCode = 400;
        throw error;
    }

    return parsed;
}

function validateName(name) {
    if (typeof name !== 'string' || !name.trim()) {
        const error = new Error('name is required');
        error.statusCode = 400;
        throw error;
    }

    return name.trim();
}

function validatePrice(price) {
    const parsed = Number(price);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        const error = new Error('price must be a positive number');
        error.statusCode = 400;
        throw error;
    }

    return Number(parsed.toFixed(2));
}

async function createServicio(payload) {
    const name = validateName(payload.name);
    const price = validatePrice(payload.price);

    const existing = await serviciosRepository.findByName(name);

    if (existing) {
        const error = new Error('A servicio with that name already exists');
        error.statusCode = 409;
        throw error;
    }

    return serviciosRepository.create({ name, price });
}

async function updateServicio(id, payload) {
    const servicioId = parseServicioId(id);
    const existing = await serviciosRepository.findById(servicioId);

    if (!existing) {
        const error = new Error('Servicio not found');
        error.statusCode = 404;
        throw error;
    }

    const changes = {};

    if (payload.name !== undefined) {
        const name = validateName(payload.name);
        const nameOwner = await serviciosRepository.findByName(name);

        if (nameOwner && nameOwner.id !== servicioId) {
            const error = new Error('A servicio with that name already exists');
            error.statusCode = 409;
            throw error;
        }

        changes.name = name;
    }

    if (payload.price !== undefined) {
        changes.price = validatePrice(payload.price);
    }

    if (payload.isActive !== undefined) {
        if (typeof payload.isActive !== 'boolean') {
            const error = new Error('isActive must be a boolean');
            error.statusCode = 400;
            throw error;
        }

        changes.isActive = payload.isActive;
    }

    if (Object.keys(changes).length === 0) {
        const error = new Error('No valid fields to update');
        error.statusCode = 400;
        throw error;
    }

    return serviciosRepository.update(servicioId, changes);
}

module.exports = {
    listActiveServicios,
    listAllServicios,
    createServicio,
    updateServicio
};
