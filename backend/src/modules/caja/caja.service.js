const cajaRepository = require('./caja.repository');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateFilter(date) {
    if (!date) {
        return null;
    }

    if (!DATE_PATTERN.test(date)) {
        const error = new Error('date must be in YYYY-MM-DD format');
        error.statusCode = 400;
        throw error;
    }

    return date;
}

function round2(value) {
    return Number(value.toFixed(2));
}

// Corte de caja diario (RF-08): ingresos = pagos cobrados, egresos = gastos
// registrados, total = lo que deberia quedar en caja ese dia.
async function getCorte(query) {
    const date = parseDateFilter(query.date);

    const [ingresos, egresos, pagos, gastos] = await Promise.all([
        cajaRepository.sumPagosByDate(date),
        cajaRepository.sumGastosByDate(date),
        cajaRepository.listPagosByDate(date),
        cajaRepository.listGastosByDate(date)
    ]);

    return {
        date: date || null,
        ingresos: round2(ingresos),
        egresos: round2(egresos),
        total: round2(ingresos - egresos),
        pagos,
        gastos
    };
}

async function listGastos(query) {
    const date = parseDateFilter(query.date);

    return cajaRepository.listGastosByDate(date);
}

async function registerGasto(payload, currentUser) {
    const concept = typeof payload.concept === 'string' ? payload.concept.trim() : '';
    const amount = round2(Number(payload.amount));

    if (!concept) {
        const error = new Error('concept is required');
        error.statusCode = 400;
        throw error;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        const error = new Error('amount must be a positive number');
        error.statusCode = 400;
        throw error;
    }

    return cajaRepository.createGasto({
        concept,
        amount,
        registeredBy: currentUser.id
    });
}

module.exports = {
    getCorte,
    listGastos,
    registerGasto
};
