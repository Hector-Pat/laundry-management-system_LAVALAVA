const clientesService = require('./clientes.service');

// GET /api/clientes: con ?search= hace el autocomplete usado en el form de
// pedidos (limite de 20, sin paginacion); sin ?search= hace el listado
// paginado usado en la pantalla de gestion de clientes.
async function list(req, res, next) {
    try {
        if (req.query.search !== undefined) {
            const clientes = await clientesService.searchClientes(req.query.search);

            return res.status(200).json({
                message: 'Clientes retrieved successfully',
                data: clientes
            });
        }

        const result = await clientesService.listClientes(req.query);

        return res.status(200).json({
            message: 'Clientes retrieved successfully',
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
}

async function getById(req, res, next) {
    try {
        const cliente = await clientesService.getClienteById(req.params.id);

        return res.status(200).json({
            message: 'Cliente retrieved successfully',
            data: cliente
        });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const cliente = await clientesService.createCliente(req.body);

        return res.status(201).json({
            message: 'Cliente created successfully',
            data: cliente
        });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const cliente = await clientesService.updateCliente(req.params.id, req.body);

        return res.status(200).json({
            message: 'Cliente updated successfully',
            data: cliente
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    list,
    getById,
    create,
    update
};
