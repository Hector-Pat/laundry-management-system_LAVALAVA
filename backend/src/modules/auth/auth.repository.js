const pool = require('../../config/db');

async function createUser(userData) {
    const {
        fullName,
        email,
        passwordHash,
        phoneNumber,
        birthDate,
        role
    } = userData;

    const [result] = await pool.query(
        `INSERT INTO users 
        (full_name, email, password_hash, phone_number, birth_date, role)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [fullName, email, passwordHash, phoneNumber, birthDate, role]
    );

    return {
        id: result.insertId,
        fullName,
        email,
        phoneNumber,
        birthDate,
        role
    };
}

async function findUserByEmail(email) {
    const [rows] = await pool.query(
        `SELECT 
            id,
            full_name AS fullName,
            email,
            password_hash AS passwordHash,
            phone_number AS phoneNumber,
            birth_date AS birthDate,
            role,
            is_active AS isActive
        FROM users
        WHERE email = ?
        LIMIT 1`,
        [email]
    );

    return rows[0] || null;
}

module.exports = {
    createUser,
    findUserByEmail
};