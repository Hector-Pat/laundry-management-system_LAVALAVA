const pool = require('../../config/db');

async function createUser(userData) {
    const { fullName, email, passwordHash, phoneNumber, birthDate, role } = userData;

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

async function findUserById(id) {
    const [rows] = await pool.query(
        `SELECT
            id,
            full_name AS fullName,
            email,
            phone_number AS phoneNumber,
            birth_date AS birthDate,
            role,
            is_active AS isActive,
            created_at AS createdAt
        FROM users
        WHERE id = ?
        LIMIT 1`,
        [id]
    );

    return rows[0] || null;
}

async function listUsers() {
    const [rows] = await pool.query(
        `SELECT
            id,
            full_name AS fullName,
            email,
            phone_number AS phoneNumber,
            birth_date AS birthDate,
            role,
            is_active AS isActive,
            created_at AS createdAt
        FROM users
        ORDER BY created_at DESC`
    );

    return rows;
}

async function updateUser(id, updates) {
    const fields = [];
    const values = [];

    if (updates.role !== undefined) {
        fields.push('role = ?');
        values.push(updates.role);
    }

    if (updates.isActive !== undefined) {
        fields.push('is_active = ?');
        values.push(updates.isActive);
    }

    if (updates.passwordHash !== undefined) {
        fields.push('password_hash = ?');
        values.push(updates.passwordHash);
    }

    if (fields.length === 0) {
        return findUserById(id);
    }

    values.push(id);

    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    return findUserById(id);
}

// Baja logica: nunca se borra el registro, solo se desactiva la cuenta.
async function deleteUser(id) {
    await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [id]);

    return findUserById(id);
}

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    listUsers,
    updateUser,
    deleteUser
};
