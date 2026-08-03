const usersRepository = require('./users.repository');
const { hashPassword } = require('../../utils/password.util');
const { USER_ROLE_VALUES } = require('../../constants/roles');

async function listUsers() {
    return usersRepository.listUsers();
}

function validateNewUser(data) {
    const { fullName, email, password, phoneNumber, birthDate, role } = data;

    if (!fullName || !email || !password || !role) {
        const error = new Error('Full name, email, password and role are required');
        error.statusCode = 400;
        throw error;
    }

    if (password.length < 6) {
        const error = new Error('Password must contain at least 6 characters');
        error.statusCode = 400;
        throw error;
    }

    if (!USER_ROLE_VALUES.includes(role)) {
        const error = new Error('Invalid user role');
        error.statusCode = 400;
        throw error;
    }

    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
        const error = new Error('Phone number must contain exactly 10 digits');
        error.statusCode = 400;
        throw error;
    }

    return {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phoneNumber: phoneNumber || null,
        birthDate: birthDate || null,
        role
    };
}

// A diferencia del registro publico (auth.service.js), esta ruta la usa un
// ADMIN autenticado y permite crear cualquier rol, incluyendo staff.
async function createUser(payload) {
    const validData = validateNewUser(payload);

    const existingUser = await usersRepository.findUserByEmail(validData.email);

    if (existingUser) {
        const error = new Error('Email is already registered');
        error.statusCode = 409;
        throw error;
    }

    const passwordHash = await hashPassword(validData.password);

    return usersRepository.createUser({
        fullName: validData.fullName,
        email: validData.email,
        passwordHash,
        phoneNumber: validData.phoneNumber,
        birthDate: validData.birthDate,
        role: validData.role
    });
}

function parseUserId(id) {
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
        const error = new Error('Invalid user id');
        error.statusCode = 400;
        throw error;
    }

    return userId;
}

function validateUpdates(updates) {
    const { role, isActive } = updates;
    const changes = {};

    if (role !== undefined) {
        if (!USER_ROLE_VALUES.includes(role)) {
            const error = new Error('Invalid user role');
            error.statusCode = 400;
            throw error;
        }
        changes.role = role;
    }

    if (isActive !== undefined) {
        if (typeof isActive !== 'boolean') {
            const error = new Error('isActive must be a boolean');
            error.statusCode = 400;
            throw error;
        }
        changes.isActive = isActive;
    }

    if (Object.keys(changes).length === 0) {
        const error = new Error('No valid fields to update');
        error.statusCode = 400;
        throw error;
    }

    return changes;
}

async function updateUser(id, updates, currentUser) {
    const userId = parseUserId(id);
    const changes = validateUpdates(updates);

    if (userId === currentUser.id) {
        if (changes.role && changes.role !== currentUser.role) {
            const error = new Error('You cannot change your own role');
            error.statusCode = 403;
            throw error;
        }

        if (changes.isActive === false) {
            const error = new Error('You cannot deactivate your own account');
            error.statusCode = 403;
            throw error;
        }
    }

    const existingUser = await usersRepository.findUserById(userId);

    if (!existingUser) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return usersRepository.updateUser(userId, changes);
}

async function deactivateUser(id, currentUser) {
    const userId = parseUserId(id);

    if (userId === currentUser.id) {
        const error = new Error('You cannot deactivate your own account');
        error.statusCode = 403;
        throw error;
    }

    const existingUser = await usersRepository.findUserById(userId);

    if (!existingUser) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return usersRepository.deleteUser(userId);
}

module.exports = {
    listUsers,
    createUser,
    updateUser,
    deactivateUser
};
