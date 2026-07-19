const pool = require('../../config/db');

// executor es el pool por defecto, o una conexion con transaccion abierta
// (la pasa pedidos.repository.js para crear un cliente nuevo atomicamente
// junto con el pedido).
async function create({ fullName, phoneNumber, email }, executor = pool) {
    const [result] = await executor.query(
        `INSERT INTO clientes (full_name, phone_number, email) VALUES (?, ?, ?)`,
        [fullName, phoneNumber, email || null]
    );

    return {
        id: result.insertId,
        fullName,
        phoneNumber,
        email: email || null
    };
}

async function findById(id, executor = pool) {
    const [rows] = await executor.query(
        `SELECT
            id,
            full_name AS fullName,
            phone_number AS phoneNumber,
            email,
            created_at AS createdAt
        FROM clientes
        WHERE id = ?
        LIMIT 1`,
        [id]
    );

    return rows[0] || null;
}

async function search(query, executor = pool) {
    const like = `%${query}%`;

    const [rows] = await executor.query(
        `SELECT
            id,
            full_name AS fullName,
            phone_number AS phoneNumber,
            email,
            created_at AS createdAt
        FROM clientes
        WHERE full_name LIKE ? OR phone_number LIKE ? OR email LIKE ?
        ORDER BY full_name ASC
        LIMIT 20`,
        [like, like, like]
    );

    return rows;
}

module.exports = {
    create,
    findById,
    search
};
