const auditoriaRepository = require('./auditoria.repository');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Registra una accion sensible. Quien llama debe envolver esto en try/catch
// (como telegramNotifier): un fallo al auditar no debe tumbar la operacion
// principal que se esta auditando.
async function logAction(currentUser, action, entityType, entityId, details) {
    return auditoriaRepository.create({
        userId: currentUser.id,
        action,
        entityType,
        entityId,
        details: details || null
    });
}

function parsePagination(query) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, Number(query.pageSize) || DEFAULT_PAGE_SIZE)
    );

    return { page, pageSize };
}

async function listAuditLog(query) {
    const { page, pageSize } = parsePagination(query);

    return auditoriaRepository.listAll({ page, pageSize });
}

module.exports = {
    logAction,
    listAuditLog
};
