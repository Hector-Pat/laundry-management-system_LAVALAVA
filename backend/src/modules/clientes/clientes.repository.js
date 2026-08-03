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
            telegram_chat_id AS telegramChatId,
            created_at AS createdAt
        FROM clientes
        WHERE id = ?
        LIMIT 1`,
        [id]
    );

    return rows[0] || null;
}

// Usado por el bot de Telegram (telegramBot.js) para enlazar el chat_id de
// quien comparte su contacto con su(s) registro(s) de cliente de mostrador.
// Puede haber mas de un cliente con el mismo telefono (no hay UNIQUE), asi
// que devuelve todos los que coincidan.
async function findByPhoneNumber(phoneNumber, executor = pool) {
    const [rows] = await executor.query(
        `SELECT
            id,
            full_name AS fullName,
            phone_number AS phoneNumber,
            email,
            telegram_chat_id AS telegramChatId,
            created_at AS createdAt
        FROM clientes
        WHERE phone_number = ?
        ORDER BY created_at DESC`,
        [phoneNumber]
    );

    return rows;
}

// Vincula (o re-vincula) el chat_id de Telegram a todos los clientes con ese
// telefono. Devuelve cuantos registros quedaron enlazados.
async function linkTelegramChatId(phoneNumber, chatId, executor = pool) {
    const [result] = await executor.query(
        `UPDATE clientes SET telegram_chat_id = ? WHERE phone_number = ?`,
        [chatId, phoneNumber]
    );

    return result.affectedRows;
}

async function search(query, executor = pool) {
    const like = `%${query}%`;

    const [rows] = await executor.query(
        `SELECT
            id,
            full_name AS fullName,
            phone_number AS phoneNumber,
            email,
            telegram_chat_id AS telegramChatId,
            created_at AS createdAt
        FROM clientes
        WHERE full_name LIKE ? OR phone_number LIKE ? OR email LIKE ?
        ORDER BY full_name ASC
        LIMIT 20`,
        [like, like, like]
    );

    return rows;
}

async function listPaginated({ cliente, page, pageSize }, executor = pool) {
    const conditions = [];
    const values = [];

    if (cliente) {
        conditions.push('(full_name LIKE ? OR phone_number LIKE ?)');
        values.push(`%${cliente}%`, `%${cliente}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await executor.query(
        `SELECT COUNT(*) AS total FROM clientes ${whereClause}`,
        values
    );
    const total = countRows[0].total;

    const offset = (page - 1) * pageSize;

    const [rows] = await executor.query(
        `SELECT
            id,
            full_name AS fullName,
            phone_number AS phoneNumber,
            email,
            telegram_chat_id AS telegramChatId,
            created_at AS createdAt
        FROM clientes
        ${whereClause}
        ORDER BY full_name ASC
        LIMIT ? OFFSET ?`,
        [...values, pageSize, offset]
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

async function update(id, changes, executor = pool) {
    const fields = [];
    const values = [];

    if (changes.fullName !== undefined) {
        fields.push('full_name = ?');
        values.push(changes.fullName);
    }

    if (changes.phoneNumber !== undefined) {
        fields.push('phone_number = ?');
        values.push(changes.phoneNumber);
    }

    if (changes.email !== undefined) {
        fields.push('email = ?');
        values.push(changes.email);
    }

    if (fields.length === 0) {
        return findById(id, executor);
    }

    values.push(id);

    await executor.query(`UPDATE clientes SET ${fields.join(', ')} WHERE id = ?`, values);

    return findById(id, executor);
}

// Enlaza una cuenta de usuario (rol CLIENT) con su(s) registro(s) de cliente
// de mostrador por coincidencia exacta de email o telefono, ya que ambas
// tablas son independientes (no hay FK entre users y clientes). Si el
// cliente se registro con datos distintos a los que dio en mostrador, no
// hay match: limitacion conocida, ver pedidos.service.js::getMisPedidos.
async function findIdsByContact({ email, phoneNumber }, executor = pool) {
    const conditions = [];
    const values = [];

    if (email) {
        conditions.push('email = ?');
        values.push(email);
    }

    if (phoneNumber) {
        conditions.push('phone_number = ?');
        values.push(phoneNumber);
    }

    if (conditions.length === 0) {
        return [];
    }

    const [rows] = await executor.query(
        `SELECT id FROM clientes WHERE ${conditions.join(' OR ')}`,
        values
    );

    return rows.map((row) => row.id);
}

module.exports = {
    create,
    findById,
    findByPhoneNumber,
    linkTelegramChatId,
    search,
    listPaginated,
    update,
    findIdsByContact
};
