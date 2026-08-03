const pool = require('../../config/db');

async function create({ userId, action, entityType, entityId, details }) {
    await pool.query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
        VALUES (?, ?, ?, ?, ?)`,
        [userId, action, entityType, entityId, details ? JSON.stringify(details) : null]
    );
}

async function listAll({ page, pageSize }) {
    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM audit_log`);
    const total = countRows[0].total;

    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query(
        `SELECT
            al.id,
            al.user_id AS userId,
            u.full_name AS userFullName,
            al.action,
            al.entity_type AS entityType,
            al.entity_id AS entityId,
            al.details,
            al.created_at AS createdAt
        FROM audit_log al
        LEFT JOIN users u ON u.id = al.user_id
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?`,
        [pageSize, offset]
    );

    return {
        data: rows,
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
    listAll
};
