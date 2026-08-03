const cajaService = require('./caja.service');

async function corte(req, res, next) {
    try {
        const data = await cajaService.getCorte(req.query);

        return res.status(200).json({
            message: 'Corte de caja retrieved successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

async function reporte(req, res, next) {
    try {
        const data = await cajaService.getReporte(req.query);

        return res.status(200).json({
            message: 'Reporte de caja retrieved successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

async function listGastos(req, res, next) {
    try {
        const data = await cajaService.listGastos(req.query);

        return res.status(200).json({
            message: 'Gastos retrieved successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

async function createGasto(req, res, next) {
    try {
        const data = await cajaService.registerGasto(req.body, req.user);

        return res.status(201).json({
            message: 'Gasto registered successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    corte,
    reporte,
    listGastos,
    createGasto
};
