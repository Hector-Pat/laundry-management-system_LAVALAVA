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

// Los pagos anulados (ver pagos.repository.js) no cuentan como ingreso.
async function sumPagosByDate(date) {
    const { clause, value } = dateCondition('created_at', date);
    const values = value ? [value] : [];

    const [rows] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM pagos WHERE ${clause} AND is_voided = FALSE`,
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
        WHERE ${clause} AND p.is_voided = FALSE
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

// Agrupado por dia para el reporte por rango (punto 12): DATE_FORMAT en vez
// de DATE(...) para que mysql2 devuelva directamente un string 'YYYY-MM-DD'
// y no un objeto Date sujeto a interpretacion de zona horaria en Node.
async function sumPagosByDateRange(from, to) {
    const [rows] = await pool.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, COALESCE(SUM(amount), 0) AS total
        FROM pagos
        WHERE DATE(created_at) BETWEEN ? AND ? AND is_voided = FALSE
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')`,
        [from, to]
    );

    return rows;
}

async function sumGastosByDateRange(from, to) {
    const [rows] = await pool.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, COALESCE(SUM(amount), 0) AS total
        FROM gastos
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')`,
        [from, to]
    );

    return rows;
}

module.exports = {
    sumPagosByDate,
    sumGastosByDate,
    listPagosByDate,
    listGastosByDate,
    createGasto,
    sumPagosByDateRange,
    sumGastosByDateRange
};
