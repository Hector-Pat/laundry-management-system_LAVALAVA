const clientesService = require('./clientes.service');

async function search(req, res, next) {
    try {
        const clientes = await clientesService.searchClientes(req.query.search);

        return res.status(200).json({
            message: 'Clientes retrieved successfully',
            data: clientes
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    search
};
