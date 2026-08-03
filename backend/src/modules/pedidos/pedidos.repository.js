const pool = require('../../config/db');
const clientesRepository = require('../clientes/clientes.repository');

// Folio unico LAV-YYYYMMDD-XXX: usa CURDATE() de MySQL (no la hora del
// servidor de la app) para que el contador y el folio siempre queden en la
// misma fecha, e INSERT ... ON DUPLICATE KEY UPDATE para incrementar el
// contador del dia de forma atomica sin condiciones de carrera.
async function getNextFolio(connection) {
    await connection.query(
        `INSERT INTO pedido_folio_counters (folio_date, last_seq)
        VALUES (CURDATE(), 1)
        ON DUPLICATE KEY UPDATE last_seq = last_seq + 1`
    );

    const [rows] = await connection.query(
        `SELECT last_seq AS lastSeq, DATE_FORMAT(folio_date, '%Y%m%d') AS datePart
        FROM pedido_folio_counters
        WHERE folio_date = CURDATE()`
    );

    const { lastSeq, datePart } = rows[0];
    const sequence = String(lastSeq).padStart(3, '0');

    return `LAV-${datePart}-${sequence}`;
}

// Crea (o resuelve) el cliente, el pedido y sus lineas de detalle en una
// sola transaccion: si algo falla a mitad de camino (incluyendo un cliente
// nuevo que se acababa de insertar) no queda nada huerfano en la base.
async function createPedidoWithItems({ clienteInput, items, total, createdBy }) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let cliente;
        if (clienteInput.mode === 'existing') {
            cliente = await clientesRepository.findById(clienteInput.id, connection);

            if (!cliente) {
                const error = new Error('Client not found');
                error.statusCode = 404;
                throw error;
            }
        } else {
            cliente = await clientesRepository.create(
                {
                    fullName: clienteInput.fullName,
                    phoneNumber: clienteInput.phoneNumber,
                    email: clienteInput.email
                },
                connection
            );
        }

        const folio = await getNextFolio(connection);

        const [result] = await connection.query(
            `INSERT INTO pedidos (folio, cliente_id, status, total, created_by)
            VALUES (?, ?, 'RECIBIDO', ?, ?)`,
            [folio, cliente.id, total, createdBy]
        );
        const pedidoId = result.insertId;

        for (const item of items) {
            await connection.query(
                `INSERT INTO detalle_pedido
                    (pedido_id, servicio_id, servicio_name, quantity, unit_price, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    pedidoId,
                    item.servicioId,
                    item.servicioName,
                    item.quantity,
                    item.unitPrice,
                    item.subtotal
                ]
            );
        }

        await connection.commit();

        return pedidoId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Reemplaza el detalle completo de un pedido (borra e reinserta) y
// recalcula el total, en una sola transaccion. Solo se llama para pedidos
// en RECIBIDO sin pagos (ver pedidos.service.js::updatePedidoItemsService),
// asi que no hay folio ni cliente que tocar, a diferencia de createPedidoWithItems.
async function updatePedidoItems(pedidoId, items, total) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query('DELETE FROM detalle_pedido WHERE pedido_id = ?', [pedidoId]);

        for (const item of items) {
            await connection.query(
                `INSERT INTO detalle_pedido
                    (pedido_id, servicio_id, servicio_name, quantity, unit_price, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [pedidoId, item.servicioId, item.servicioName, item.quantity, item.unitPrice, item.subtotal]
            );
        }

        await connection.query('UPDATE pedidos SET total = ? WHERE id = ?', [total, pedidoId]);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    return findPedidoById(pedidoId);
}

async function findPedidoById(id) {
    const [pedidoRows] = await pool.query(
        `SELECT
            p.id,
            p.folio,
            p.status,
            p.total,
            p.created_by AS createdBy,
            p.created_at AS createdAt,
            p.updated_at AS updatedAt,
            p.delivered_at AS deliveredAt,
            p.cancelled_at AS cancelledAt,
            p.cancelled_by AS cancelledBy,
            p.cancel_reason AS cancelReason,
            c.id AS clienteId,
            c.full_name AS clienteFullName,
            c.phone_number AS clientePhoneNumber,
            c.email AS clienteEmail
        FROM pedidos p
        JOIN clientes c ON c.id = p.cliente_id
        WHERE p.id = ?
        LIMIT 1`,
        [id]
    );

    const pedido = pedidoRows[0];

    if (!pedido) {
        return null;
    }

    const [items] = await pool.query(
        `SELECT
            id,
            servicio_id AS servicioId,
            servicio_name AS servicioName,
            quantity,
            unit_price AS unitPrice,
            subtotal
        FROM detalle_pedido
        WHERE pedido_id = ?`,
        [id]
    );

    return {
        id: pedido.id,
        folio: pedido.folio,
        status: pedido.status,
        total: pedido.total,
        createdBy: pedido.createdBy,
        createdAt: pedido.createdAt,
        updatedAt: pedido.updatedAt,
        deliveredAt: pedido.deliveredAt,
        cancelledAt: pedido.cancelledAt,
        cancelledBy: pedido.cancelledBy,
        cancelReason: pedido.cancelReason,
        cliente: {
            id: pedido.clienteId,
            fullName: pedido.clienteFullName,
            phoneNumber: pedido.clientePhoneNumber,
            email: pedido.clienteEmail
        },
        items
    };
}

async function listPedidos({ status, date, clienteId, cliente, page, pageSize }) {
    const conditions = [];
    const values = [];

    if (status) {
        conditions.push('p.status = ?');
        values.push(status);
    }

    if (date) {
        conditions.push('DATE(p.created_at) = ?');
        values.push(date);
    }

    if (clienteId) {
        conditions.push('p.cliente_id = ?');
        values.push(clienteId);
    } else if (cliente) {
        conditions.push('(c.full_name LIKE ? OR c.phone_number LIKE ?)');
        values.push(`%${cliente}%`, `%${cliente}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await pool.query(
        `SELECT COUNT(*) AS total
        FROM pedidos p
        JOIN clientes c ON c.id = p.cliente_id
        ${whereClause}`,
        values
    );
    const total = countRows[0].total;

    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query(
        `SELECT
            p.id,
            p.folio,
            p.status,
            p.total,
            p.created_at AS createdAt,
            p.cancelled_at AS cancelledAt,
            c.id AS clienteId,
            c.full_name AS clienteFullName,
            c.phone_number AS clientePhoneNumber
        FROM pedidos p
        JOIN clientes c ON c.id = p.cliente_id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?`,
        [...values, pageSize, offset]
    );

    return {
        data: rows.map((row) => ({
            id: row.id,
            folio: row.folio,
            status: row.status,
            total: row.total,
            createdAt: row.createdAt,
            cancelledAt: row.cancelledAt,
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

// Bloquea la fila del pedido dentro de una transaccion (SELECT ... FOR
// UPDATE) para que dos operaciones concurrentes sobre el mismo pedido
// (p.ej. dos pagos a la vez) no puedan leer el mismo saldo y pisarse.
async function lockPedidoById(id, connection) {
    const [rows] = await connection.query(
        `SELECT id, total, status, cancelled_at AS cancelledAt FROM pedidos WHERE id = ? FOR UPDATE`,
        [id]
    );

    return rows[0] || null;
}

async function updateStatus(id, status) {
    const deliveredAtAssignment = status === 'ENTREGADO' ? ', delivered_at = NOW()' : '';

    await pool.query(`UPDATE pedidos SET status = ? ${deliveredAtAssignment} WHERE id = ?`, [
        status,
        id
    ]);

    return findPedidoById(id);
}

async function cancelPedido(id, reason, cancelledBy) {
    await pool.query(
        `UPDATE pedidos
        SET cancelled_at = NOW(), cancelled_by = ?, cancel_reason = ?
        WHERE id = ?`,
        [cancelledBy, reason, id]
    );

    return findPedidoById(id);
}

module.exports = {
    createPedidoWithItems,
    findPedidoById,
    lockPedidoById,
    listPedidos,
    updateStatus,
    updatePedidoItems,
    cancelPedido
};
