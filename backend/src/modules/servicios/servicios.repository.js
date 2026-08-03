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

async function listAll(executor = pool) {
    const [rows] = await executor.query(
        `SELECT id, name, price, is_active AS isActive, created_at AS createdAt
        FROM servicios
        ORDER BY name ASC`
    );

    return rows;
}

async function findById(id, executor = pool) {
    const [rows] = await executor.query(
        `SELECT id, name, price, is_active AS isActive, created_at AS createdAt
        FROM servicios
        WHERE id = ?
        LIMIT 1`,
        [id]
    );

    return rows[0] || null;
}

async function findByName(name, executor = pool) {
    const [rows] = await executor.query(
        `SELECT id, name, price, is_active AS isActive
        FROM servicios
        WHERE name = ?
        LIMIT 1`,
        [name]
    );

    return rows[0] || null;
}

async function create({ name, price }, executor = pool) {
    const [result] = await executor.query(
        `INSERT INTO servicios (name, price) VALUES (?, ?)`,
        [name, price]
    );

    return findById(result.insertId, executor);
}

async function update(id, changes, executor = pool) {
    const fields = [];
    const values = [];

    if (changes.name !== undefined) {
        fields.push('name = ?');
        values.push(changes.name);
    }

    if (changes.price !== undefined) {
        fields.push('price = ?');
        values.push(changes.price);
    }

    if (changes.isActive !== undefined) {
        fields.push('is_active = ?');
        values.push(changes.isActive);
    }

    if (fields.length === 0) {
        return findById(id, executor);
    }

    values.push(id);

    await executor.query(`UPDATE servicios SET ${fields.join(', ')} WHERE id = ?`, values);

    return findById(id, executor);
}

module.exports = {
    listActive,
    listAll,
    findById,
    findByName,
    create,
    update
};
