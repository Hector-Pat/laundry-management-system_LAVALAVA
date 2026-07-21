const pool = require('../../config/db');

async function create({ pedidoId, clienteId, description, registeredBy }) {
    const [result] = await pool.query(
        `INSERT INTO reclamaciones (pedido_id, cliente_id, description, registered_by)
        VALUES (?, ?, ?, ?)`,
        [pedidoId, clienteId, description, registeredBy]
    );

    const [rows] = await pool.query(
        `SELECT
            id,
            pedido_id AS pedidoId,
            cliente_id AS clienteId,
            description,
            registered_by AS registeredBy,
            created_at AS createdAt
        FROM reclamaciones
        WHERE id = ?
        LIMIT 1`,
        [result.insertId]
    );

    return rows[0];
}

async function listByPedidoId(pedidoId) {
    const [rows] = await pool.query(
        `SELECT
            id,
            pedido_id AS pedidoId,
            cliente_id AS clienteId,
            description,
            registered_by AS registeredBy,
            created_at AS createdAt
        FROM reclamaciones
        WHERE pedido_id = ?
        ORDER BY created_at DESC`,
        [pedidoId]
    );

    return rows;
}

module.exports = {
    create,
    listByPedidoId
};
