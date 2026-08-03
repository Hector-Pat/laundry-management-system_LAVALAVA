const serviciosService = require('./servicios.service');

async function list(req, res, next) {
    try {
        const servicios = await serviciosService.listActiveServicios();

        return res.status(200).json({
            message: 'Servicios retrieved successfully',
            data: servicios
        });
    } catch (error) {
        next(error);
    }
}

async function listAll(req, res, next) {
    try {
        const servicios = await serviciosService.listAllServicios();

        return res.status(200).json({
            message: 'Servicios retrieved successfully',
            data: servicios
        });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const servicio = await serviciosService.createServicio(req.body);

        return res.status(201).json({
            message: 'Servicio created successfully',
            data: servicio
        });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const servicio = await serviciosService.updateServicio(req.params.id, req.body);

        return res.status(200).json({
            message: 'Servicio updated successfully',
            data: servicio
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    list,
    listAll,
    create,
    update
};
