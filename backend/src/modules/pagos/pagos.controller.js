const pagosService = require('./pagos.service');

async function list(req, res, next) {
    try {
        const summary = await pagosService.getPaymentSummary(req.params.id);

        return res.status(200).json({
            message: 'Payments retrieved successfully',
            data: summary
        });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const summary = await pagosService.registerPayment(req.params.id, req.body, req.user);

        return res.status(201).json({
            message: 'Payment registered successfully',
            data: summary
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    list,
    create
};
