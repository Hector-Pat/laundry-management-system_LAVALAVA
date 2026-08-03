const auditoriaService = require('./auditoria.service');

async function list(req, res, next) {
    try {
        const result = await auditoriaService.listAuditLog(req.query);

        return res.status(200).json({
            message: 'Audit log retrieved successfully',
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    list
};
