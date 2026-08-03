const pool = require('../../config/db');

async function sumByPedidoId(pedidoId, executor = pool) {
    const [rows] = await executor.query(
        `SELECT COALESCE(SUM(amount), 0) AS totalPagado
        FROM pagos
        WHERE pedido_id = ?`,
        [pedidoId]
    );

    return Number(rows[0].totalPagado);
}

async function listByPedidoId(pedidoId) {
    const [rows] = await pool.query(
        `SELECT
            id,
            pedido_id AS pedidoId,
            amount,
            method,
            type,
            registered_by AS registeredBy,
            created_at AS createdAt
        FROM pagos
        WHERE pedido_id = ?
        ORDER BY created_at ASC`,
        [pedidoId]
    );

    return rows;
}

async function create({ pedidoId, amount, method, type, registeredBy }, executor = pool) {
    const [result] = await executor.query(
        `INSERT INTO pagos (pedido_id, amount, method, type, registered_by)
        VALUES (?, ?, ?, ?, ?)`,
        [pedidoId, amount, method, type, registeredBy]
    );

    const [rows] = await executor.query(
        `SELECT
            id,
            pedido_id AS pedidoId,
            amount,
            method,
            type,
            registered_by AS registeredBy,
            created_at AS createdAt
        FROM pagos
        WHERE id = ?
        LIMIT 1`,
        [result.insertId]
    );

    return rows[0];
}

module.exports = {
    sumByPedidoId,
    listByPedidoId,
    create
};
