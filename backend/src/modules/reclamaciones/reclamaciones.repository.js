const pool = require('../../config/db');

const RECLAMACION_COLUMNS = `
    id,
    pedido_id AS pedidoId,
    cliente_id AS clienteId,
    description,
    registered_by AS registeredBy,
    created_at AS createdAt,
    status,
    resolution_notes AS resolutionNotes,
    resolved_by AS resolvedBy,
    resolved_at AS resolvedAt
`;

async function create({ pedidoId, clienteId, description, registeredBy }) {
    const [result] = await pool.query(
        `INSERT INTO reclamaciones (pedido_id, cliente_id, description, registered_by)
        VALUES (?, ?, ?, ?)`,
        [pedidoId, clienteId, description, registeredBy]
    );

    const [rows] = await pool.query(
        `SELECT ${RECLAMACION_COLUMNS} FROM reclamaciones WHERE id = ? LIMIT 1`,
        [result.insertId]
    );

    return rows[0];
}

async function findById(id) {
    const [rows] = await pool.query(
        `SELECT ${RECLAMACION_COLUMNS} FROM reclamaciones WHERE id = ? LIMIT 1`,
        [id]
    );

    return rows[0] || null;
}

async function listByPedidoId(pedidoId) {
    const [rows] = await pool.query(
        `SELECT ${RECLAMACION_COLUMNS}
        FROM reclamaciones
        WHERE pedido_id = ?
        ORDER BY created_at DESC`,
        [pedidoId]
    );

    return rows;
}

async function resolve(id, resolutionNotes, resolvedBy) {
    await pool.query(
        `UPDATE reclamaciones
        SET status = 'RESUELTA', resolution_notes = ?, resolved_by = ?, resolved_at = NOW()
        WHERE id = ?`,
        [resolutionNotes, resolvedBy, id]
    );

    return findById(id);
}

async function listAll({ status, page, pageSize }) {
    const conditions = [];
    const values = [];

    if (status) {
        conditions.push('r.status = ?');
        values.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await pool.query(
        `SELECT COUNT(*) AS total FROM reclamaciones r ${whereClause}`,
        values
    );
    const total = countRows[0].total;

    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query(
        `SELECT
            r.id,
            r.pedido_id AS pedidoId,
            r.description,
            r.status,
            r.resolution_notes AS resolutionNotes,
            r.created_at AS createdAt,
            r.resolved_at AS resolvedAt,
            p.folio AS pedidoFolio,
            c.id AS clienteId,
            c.full_name AS clienteFullName,
            c.phone_number AS clientePhoneNumber
        FROM reclamaciones r
        JOIN pedidos p ON p.id = r.pedido_id
        JOIN clientes c ON c.id = r.cliente_id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?`,
        [...values, pageSize, offset]
    );

    return {
        data: rows.map((row) => ({
            id: row.id,
            pedidoId: row.pedidoId,
            pedidoFolio: row.pedidoFolio,
            description: row.description,
            status: row.status,
            resolutionNotes: row.resolutionNotes,
            createdAt: row.createdAt,
            resolvedAt: row.resolvedAt,
            cliente: {
                id: row.clienteId,
                fullName: row.clienteFullName,
                phoneNumber: row.clientePhoneNumber
            }
        })),
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize))
        }
    };
}

module.exports = {
    create,
    findById,
    listByPedidoId,
    resolve,
    listAll
};
