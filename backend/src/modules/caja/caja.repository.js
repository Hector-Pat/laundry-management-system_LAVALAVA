const pool = require('../../config/db');

// date es opcional (YYYY-MM-DD); sin fecha se usa CURDATE() para que el
// corte siempre caiga en el mismo dia que usa pedidos.repository.js para
// generar folios.
function dateCondition(column, date) {
    if (date) {
        return { clause: `DATE(${column}) = ?`, value: date };
    }

    return { clause: `DATE(${column}) = CURDATE()`, value: null };
}

async function sumPagosByDate(date) {
    const { clause, value } = dateCondition('created_at', date);
    const values = value ? [value] : [];

    const [rows] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM pagos WHERE ${clause}`,
        values
    );

    return Number(rows[0].total);
}

async function sumGastosByDate(date) {
    const { clause, value } = dateCondition('created_at', date);
    const values = value ? [value] : [];

    const [rows] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM gastos WHERE ${clause}`,
        values
    );

    return Number(rows[0].total);
}

async function listPagosByDate(date) {
    const { clause, value } = dateCondition('p.created_at', date);
    const values = value ? [value] : [];

    const [rows] = await pool.query(
        `SELECT
            p.id,
            p.pedido_id AS pedidoId,
            pe.folio AS pedidoFolio,
            p.amount,
            p.method,
            p.type,
            p.created_at AS createdAt
        FROM pagos p
        JOIN pedidos pe ON pe.id = p.pedido_id
        WHERE ${clause}
        ORDER BY p.created_at ASC`,
        values
    );

    return rows;
}

async function listGastosByDate(date) {
    const { clause, value } = dateCondition('created_at', date);
    const values = value ? [value] : [];

    const [rows] = await pool.query(
        `SELECT id, concept, amount, registered_by AS registeredBy, created_at AS createdAt
        FROM gastos
        WHERE ${clause}
        ORDER BY created_at ASC`,
        values
    );

    return rows;
}

async function createGasto({ concept, amount, registeredBy }) {
    const [result] = await pool.query(
        `INSERT INTO gastos (concept, amount, registered_by) VALUES (?, ?, ?)`,
        [concept, amount, registeredBy]
    );

    const [rows] = await pool.query(
        `SELECT id, concept, amount, registered_by AS registeredBy, created_at AS createdAt
        FROM gastos
        WHERE id = ?
        LIMIT 1`,
        [result.insertId]
    );

    return rows[0];
}

module.exports = {
    sumPagosByDate,
    sumGastosByDate,
    listPagosByDate,
    listGastosByDate,
    createGasto
};
