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

async function resolve(req, res, next) {
    try {
        const data = await reclamacionesService.resolveReclamacion(
            req.params.id,
            req.params.reclamacionId,
            req.body,
            req.user
        );

        return res.status(200).json({
            message: 'Reclamacion resolved successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

async function listAll(req, res, next) {
    try {
        const result = await reclamacionesService.listAllReclamaciones(req.query);

        return res.status(200).json({
            message: 'Reclamaciones retrieved successfully',
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    list,
    create,
    resolve,
    listAll
};
