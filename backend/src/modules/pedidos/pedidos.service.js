const QRCode = require('qrcode');
const pedidosRepository = require('./pedidos.repository');
const clientesService = require('../clientes/clientes.service');
const clientesRepository = require('../clientes/clientes.repository');
const serviciosRepository = require('../servicios/servicios.repository');
const pagosRepository = require('../pagos/pagos.repository');
const authRepository = require('../auth/auth.repository');
const auditoriaService = require('../auditoria/auditoria.service');
const { ORDER_STATUSES, ORDER_STATUS_VALUES, ORDER_TRANSITIONS } = require('../../constants/orderStatus');
const { USER_ROLES } = require('../../constants/roles');
const { notifyPedidoListo } = require('../../utils/telegramNotifier');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parseId(id, label = 'id') {
    const parsed = Number(id);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        const error = new Error(`Invalid ${label}`);
        error.statusCode = 400;
        throw error;
    }

    return parsed;
}

// Valida la forma del cliente recibido, sin tocar la base de datos todavia:
// { id } para un cliente existente, o { fullName, phoneNumber, email? } para
// darlo de alta al vuelo. La creacion real ocurre dentro de la transaccion
// del pedido (pedidos.repository.js) para que ambas cosas sean atomicas.
function parseClienteInput(cliente) {
    if (!cliente || typeof cliente !== 'object') {
        const error = new Error('cliente is required');
        error.statusCode = 400;
        throw error;
    }

    if (cliente.id !== undefined) {
        return { mode: 'existing', id: parseId(cliente.id, 'cliente.id') };
    }

    if (!cliente.fullName || !cliente.phoneNumber) {
        const error = new Error(
            'cliente.fullName and cliente.phoneNumber are required for a new client'
        );
        error.statusCode = 400;
        throw error;
    }

    clientesService.validatePhone(cliente.phoneNumber);

    return {
        mode: 'new',
        fullName: cliente.fullName.trim(),
        phoneNumber: cliente.phoneNumber,
        email: cliente.email ? cliente.email.trim() : null
    };
}

async function buildItems(itemsPayload) {
    if (!Array.isArray(itemsPayload) || itemsPayload.length === 0) {
        const error = new Error('At least one service item is required');
        error.statusCode = 400;
        throw error;
    }

    const servicios = await serviciosRepository.listActive();
    const serviciosById = new Map(servicios.map((servicio) => [servicio.id, servicio]));

    return itemsPayload.map((item) => {
        const servicio = serviciosById.get(Number(item.servicioId));
        const quantity = Number(item.quantity);

        if (!servicio) {
            const error = new Error(`Invalid or inactive servicioId: ${item.servicioId}`);
            error.statusCode = 400;
            throw error;
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            const error = new Error('Item quantity must be a positive integer');
            error.statusCode = 400;
            throw error;
        }

        const unitPrice = Number(servicio.price);
        const subtotal = Number((unitPrice * quantity).toFixed(2));

        return {
            servicioId: servicio.id,
            servicioName: servicio.name,
            quantity,
            unitPrice,
            subtotal
        };
    });
}

// El QR codifica el folio (no una URL): es lo unico que un usuario necesita
// para identificar el pedido en mostrador, y no depende de en que dominio
// este publicado el frontend. Se genera al vuelo, no se guarda en BD.
async function buildQrCode(folio) {
    return QRCode.toDataURL(folio, { margin: 1, width: 240 });
}

async function createPedido(payload, currentUser) {
    const clienteInput = parseClienteInput(payload.cliente);
    const items = await buildItems(payload.items);
    const total = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));

    const pedidoId = await pedidosRepository.createPedidoWithItems({
        clienteInput,
        items,
        total,
        createdBy: currentUser.id
    });

    const pedido = await pedidosRepository.findPedidoById(pedidoId);
    const qrCode = await buildQrCode(pedido.folio);

    return { ...pedido, qrCode };
}

async function getPedidoById(id) {
    const pedido = await pedidosRepository.findPedidoById(parseId(id));

    if (!pedido) {
        const error = new Error('Pedido not found');
        error.statusCode = 404;
        throw error;
    }

    const qrCode = await buildQrCode(pedido.folio);

    return { ...pedido, qrCode };
}

function parsePagination(query) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, Number(query.pageSize) || DEFAULT_PAGE_SIZE)
    );

    return { page, pageSize };
}

async function listPedidos(query) {
    const { status, date, clienteId, cliente } = query;

    if (status && !ORDER_STATUS_VALUES.includes(status)) {
        const error = new Error('Invalid status filter');
        error.statusCode = 400;
        throw error;
    }

    const { page, pageSize } = parsePagination(query);

    return pedidosRepository.listPedidos({
        status: status || null,
        date: date || null,
        clienteId: clienteId ? parseId(clienteId, 'clienteId') : null,
        cliente: cliente || null,
        page,
        pageSize
    });
}

// Portal de cliente: no hay FK entre users (cuentas con rol CLIENT) y
// clientes (directorio de mostrador), asi que se enlazan por coincidencia
// exacta de email o telefono. Si el cliente se registro con datos distintos
// a los que dio en mostrador, esta lista sale vacia (limitacion conocida).
async function getMisPedidos(currentUser, query) {
    const account = await authRepository.findUserById(currentUser.id);
    const clienteIds = await clientesRepository.findIdsByContact({
        email: account?.email || null,
        phoneNumber: account?.phoneNumber || null
    });

    const { page, pageSize } = parsePagination(query);

    return pedidosRepository.listPedidos({
        status: null,
        date: null,
        clienteId: null,
        clienteIds,
        cliente: null,
        page,
        pageSize
    });
}

// Maquina de estados lineal (ver constants/orderStatus.js): cada rol solo
// puede avanzar un pedido a su siguiente estado. ADMIN puede forzar
// cualquier estado valido, para poder corregir un pedido mal capturado.
async function updateStatus(id, newStatus, currentUser) {
    const pedidoId = parseId(id);

    if (!ORDER_STATUS_VALUES.includes(newStatus)) {
        const error = new Error('Invalid status');
        error.statusCode = 400;
        throw error;
    }

    const pedido = await pedidosRepository.findPedidoById(pedidoId);

    if (!pedido) {
        const error = new Error('Pedido not found');
        error.statusCode = 404;
        throw error;
    }

    if (pedido.status === 'ENTREGADO') {
        const error = new Error('This pedido has already been delivered');
        error.statusCode = 400;
        throw error;
    }

    if (pedido.cancelledAt) {
        const error = new Error('This pedido has been cancelled');
        error.statusCode = 400;
        throw error;
    }

    // "Normal" = el siguiente estado que le tocaria objetivamente al pedido
    // (sin importar el rol: un ADMIN avanzando al siguiente estado esperado
    // no es forzar nada, solo un salto fuera de esa secuencia lo es).
    const transition = ORDER_TRANSITIONS[pedido.status];
    const isNormalTransition = Boolean(transition && transition.next === newStatus);

    if (currentUser.role !== USER_ROLES.ADMIN) {
        if (!transition || transition.next !== newStatus) {
            const error = new Error(`Cannot change status from ${pedido.status} to ${newStatus}`);
            error.statusCode = 400;
            throw error;
        }

        if (!transition.roles.includes(currentUser.role)) {
            const error = new Error('You do not have permission to perform this status change');
            error.statusCode = 403;
            throw error;
        }
    }

    const updated = await pedidosRepository.updateStatus(pedidoId, newStatus);
    const qrCode = await buildQrCode(updated.folio);

    // ADMIN puede saltarse la maquina de estados; deja constancia solo
    // cuando de verdad la salto (no en un avance normal hecho por un ADMIN).
    if (currentUser.role === USER_ROLES.ADMIN && !isNormalTransition) {
        try {
            await auditoriaService.logAction(currentUser, 'FORZAR_ESTADO_PEDIDO', 'pedido', pedidoId, {
                from: pedido.status,
                to: newStatus
            });
        } catch (auditError) {
            console.warn(`No se pudo registrar en la bitacora el forzado de estado del pedido ${pedidoId}: ${auditError.message}`);
        }
    }

    // Aviso al cliente (RF-04): no debe tumbar el cambio de estado si Telegram
    // falla, no esta configurado, o el cliente aun no vinculo su chat, solo se
    // deja constancia en el log.
    if (newStatus === ORDER_STATUSES.LISTO) {
        try {
            await notifyPedidoListo(updated);
        } catch (notifyError) {
            console.warn(
                `No se pudo notificar por Telegram el pedido ${updated.folio}: ${notifyError.message}`
            );
        }
    }

    return { ...updated, qrCode };
}

// Solo se puede editar el detalle de un pedido antes de que entre a proceso
// (RECIBIDO) y mientras no tenga pagos registrados, para no descuadrar un
// saldo ya cobrado sobre un total distinto.
async function updatePedidoItemsService(id, payload) {
    const pedidoId = parseId(id);
    const pedido = await pedidosRepository.findPedidoById(pedidoId);

    if (!pedido) {
        const error = new Error('Pedido not found');
        error.statusCode = 404;
        throw error;
    }

    if (pedido.cancelledAt) {
        const error = new Error('This pedido has been cancelled');
        error.statusCode = 400;
        throw error;
    }

    if (pedido.status !== ORDER_STATUSES.RECIBIDO) {
        const error = new Error('Only pedidos in RECIBIDO status can be edited');
        error.statusCode = 400;
        throw error;
    }

    const totalPagado = await pagosRepository.sumByPedidoId(pedidoId);

    if (totalPagado > 0) {
        const error = new Error('Cannot edit a pedido that already has payments registered');
        error.statusCode = 400;
        throw error;
    }

    const items = await buildItems(payload.items);
    const total = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));

    const updated = await pedidosRepository.updatePedidoItems(pedidoId, items, total);
    const qrCode = await buildQrCode(updated.folio);

    return { ...updated, qrCode };
}

// Cancelar no es una transicion mas de la maquina de estados (ver
// orderStatus.js): puede pasar desde cualquier estado no terminal, no solo
// desde el "anterior" en la cadena RECIBIDO->...->ENTREGADO. No reembolsa
// pagos ya registrados automaticamente; para eso esta la anulacion manual
// de pagos (pagos.service.js::voidPayment).
async function cancelPedido(id, reason, currentUser) {
    const pedidoId = parseId(id);

    if (typeof reason !== 'string' || !reason.trim()) {
        const error = new Error('reason is required');
        error.statusCode = 400;
        throw error;
    }

    const pedido = await pedidosRepository.findPedidoById(pedidoId);

    if (!pedido) {
        const error = new Error('Pedido not found');
        error.statusCode = 404;
        throw error;
    }

    if (pedido.cancelledAt) {
        const error = new Error('This pedido has already been cancelled');
        error.statusCode = 400;
        throw error;
    }

    if (pedido.status === ORDER_STATUSES.ENTREGADO) {
        const error = new Error('This pedido has already been delivered');
        error.statusCode = 400;
        throw error;
    }

    const updated = await pedidosRepository.cancelPedido(pedidoId, reason.trim(), currentUser.id);
    const qrCode = await buildQrCode(updated.folio);

    try {
        await auditoriaService.logAction(currentUser, 'CANCELAR_PEDIDO', 'pedido', pedidoId, {
            reason: reason.trim()
        });
    } catch (auditError) {
        console.warn(`No se pudo registrar en la bitacora la cancelacion del pedido ${pedidoId}: ${auditError.message}`);
    }

    return { ...updated, qrCode };
}

module.exports = {
    createPedido,
    getPedidoById,
    listPedidos,
    updateStatus,
    updatePedidoItemsService,
    cancelPedido,
    getMisPedidos,
    parseId
};
