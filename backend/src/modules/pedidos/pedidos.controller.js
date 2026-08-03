const pedidosService = require('./pedidos.service');

async function create(req, res, next) {
    try {
        const pedido = await pedidosService.createPedido(req.body, req.user);

        return res.status(201).json({
            message: 'Pedido created successfully',
            data: pedido
        });
    } catch (error) {
        next(error);
    }
}

async function list(req, res, next) {
    try {
        const result = await pedidosService.listPedidos(req.query);

        return res.status(200).json({
            message: 'Pedidos retrieved successfully',
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
}

async function getById(req, res, next) {
    try {
        const pedido = await pedidosService.getPedidoById(req.params.id);

        return res.status(200).json({
            message: 'Pedido retrieved successfully',
            data: pedido
        });
    } catch (error) {
        next(error);
    }
}

async function updateStatus(req, res, next) {
    try {
        const pedido = await pedidosService.updateStatus(req.params.id, req.body.status, req.user);

        return res.status(200).json({
            message: 'Pedido status updated successfully',
            data: pedido
        });
    } catch (error) {
        next(error);
    }
}

async function updateItems(req, res, next) {
    try {
        const pedido = await pedidosService.updatePedidoItemsService(req.params.id, req.body);

        return res.status(200).json({
            message: 'Pedido items updated successfully',
            data: pedido
        });
    } catch (error) {
        next(error);
    }
}

async function cancel(req, res, next) {
    try {
        const pedido = await pedidosService.cancelPedido(req.params.id, req.body.reason, req.user);

        return res.status(200).json({
            message: 'Pedido cancelled successfully',
            data: pedido
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    create,
    list,
    getById,
    updateStatus,
    updateItems,
    cancel
};
