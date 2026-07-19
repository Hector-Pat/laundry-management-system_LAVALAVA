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

module.exports = {
    create,
    list,
    getById
};
