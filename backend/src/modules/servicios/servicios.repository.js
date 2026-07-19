const pool = require('../../config/db');

async function listActive(executor = pool) {
    const [rows] = await executor.query(
        `SELECT id, name, price
        FROM servicios
        WHERE is_active = TRUE
        ORDER BY name ASC`
    );

    return rows;
}

module.exports = {
    listActive
};
