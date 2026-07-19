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

module.exports = {
    list
};
