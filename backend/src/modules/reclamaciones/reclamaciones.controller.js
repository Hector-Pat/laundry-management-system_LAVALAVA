const reclamacionesService = require('./reclamaciones.service');

async function list(req, res, next) {
    try {
        const data = await reclamacionesService.listReclamaciones(req.params.id);

        return res.status(200).json({
            message: 'Reclamaciones retrieved successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const data = await reclamacionesService.registerReclamacion(req.params.id, req.body, req.user);

        return res.status(201).json({
            message: 'Reclamacion registered successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    list,
    create
};
