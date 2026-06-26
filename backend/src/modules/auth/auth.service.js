const authRepository = require('./auth.repository');
const { hashPassword, comparePassword } = require('../../utils/password.util');
const { generateToken } = require('../../utils/token.util');
const { USER_ROLES, USER_ROLE_VALUES } = require('../../constants/roles');

function validateRegisterData(data) {
    const {
        fullName,
        email,
        password,
        phoneNumber,
        birthDate,
        role
    } = data;

    if (!fullName || !email || !password) {
        const error = new Error('Full name, email and password are required');
        error.statusCode = 400;
        throw error;
    }

    if (password.length < 6) {
        const error = new Error('Password must contain at least 6 characters');
        error.statusCode = 400;
        throw error;
    }

    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
        const error = new Error('Phone number must contain exactly 10 digits');
        error.statusCode = 400;
        throw error;
    }

    if (role && !USER_ROLE_VALUES.includes(role)) {
        const error = new Error('Invalid user role');
        error.statusCode = 400;
        throw error;
    }

    if (role === USER_ROLES.ADMIN) {
        const error = new Error('Admin accounts cannot be created through public registration');
        error.statusCode = 403;
        throw error;
    }

    return {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phoneNumber: phoneNumber || null,
        birthDate: birthDate || null,
        role: role || USER_ROLES.CLIENT
    };
}

async function registerUser(data) {
    const validData = validateRegisterData(data);

    const existingUser = await authRepository.findUserByEmail(validData.email);

    if (existingUser) {
        const error = new Error('Email is already registered');
        error.statusCode = 409;
        throw error;
    }

    const passwordHash = await hashPassword(validData.password);

    const createdUser = await authRepository.createUser({
        fullName: validData.fullName,
        email: validData.email,
        passwordHash,
        phoneNumber: validData.phoneNumber,
        birthDate: validData.birthDate,
        role: validData.role
    });

    return createdUser;
}

async function loginUser(data) {
    const { email, password } = data;

    if (!email || !password) {
        const error = new Error('Email and password are required');
        error.statusCode = 400;
        throw error;
    }

    const user = await authRepository.findUserByEmail(email.trim().toLowerCase());

    if (!user) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
    }

    if (!user.isActive) {
        const error = new Error('User account is inactive');
        error.statusCode = 403;
        throw error;
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
    }

    const token = generateToken(user);

    return {
        token,
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            birthDate: user.birthDate,
            role: user.role
        }
    };
}

module.exports = {
    registerUser,
    loginUser
};