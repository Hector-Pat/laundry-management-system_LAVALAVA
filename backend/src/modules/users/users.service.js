const usersRepository = require('./users.repository');
const { USER_ROLE_VALUES } = require('../../constants/roles');

async function listUsers() {
    return usersRepository.listUsers();
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
    updateUser,
    deactivateUser
};
