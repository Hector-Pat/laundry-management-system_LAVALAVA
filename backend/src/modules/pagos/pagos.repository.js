const pool = require('../../config/db');

// Los pagos anulados no cuentan para el saldo pendiente, pero se conservan
// como historial (ver listByPedidoId) en vez de borrarse.
async function sumByPedidoId(pedidoId, executor = pool) {
    const [rows] = await executor.query(
        `SELECT COALESCE(SUM(amount), 0) AS totalPagado
        FROM pagos
        WHERE pedido_id = ? AND is_voided = FALSE`,
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
            created_at AS createdAt,
            is_voided AS isVoided,
            voided_at AS voidedAt,
            voided_by AS voidedBy,
            void_reason AS voidReason
        FROM pagos
        WHERE pedido_id = ?
        ORDER BY created_at ASC`,
        [pedidoId]
    );

    return rows;
}

async function findById(id, executor = pool) {
    const [rows] = await executor.query(
        `SELECT
            id,
            pedido_id AS pedidoId,
            amount,
            method,
            type,
            registered_by AS registeredBy,
            created_at AS createdAt,
            is_voided AS isVoided,
            voided_at AS voidedAt,
            voided_by AS voidedBy,
            void_reason AS voidReason
        FROM pagos
        WHERE id = ?
        LIMIT 1`,
        [id]
    );

    return rows[0] || null;
}

async function create({ pedidoId, amount, method, type, registeredBy }, executor = pool) {
    const [result] = await executor.query(
        `INSERT INTO pagos (pedido_id, amount, method, type, registered_by)
        VALUES (?, ?, ?, ?, ?)`,
        [pedidoId, amount, method, type, registeredBy]
    );

    return findById(result.insertId, executor);
}

async function voidPayment(id, reason, voidedBy, executor = pool) {
    await executor.query(
        `UPDATE pagos
        SET is_voided = TRUE, voided_at = NOW(), voided_by = ?, void_reason = ?
        WHERE id = ?`,
        [voidedBy, reason, id]
    );

    return findById(id, executor);
}

module.exports = {
    sumByPedidoId,
    listByPedidoId,
    findById,
    create,
    voidPayment
};
