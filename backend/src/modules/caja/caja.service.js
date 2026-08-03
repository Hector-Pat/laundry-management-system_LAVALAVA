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

// Reporte por rango de fechas (distinto del corte diario): agrupa ingresos
// y egresos por dia para poder ver una tendencia, no solo el corte de hoy.
async function getReporte(query) {
    const from = parseDateFilter(query.from);
    const to = parseDateFilter(query.to);

    if (!from || !to) {
        const error = new Error('from and to are required (YYYY-MM-DD)');
        error.statusCode = 400;
        throw error;
    }

    if (from > to) {
        const error = new Error('from must be before or equal to to');
        error.statusCode = 400;
        throw error;
    }

    const [ingresosPorDia, egresosPorDia] = await Promise.all([
        cajaRepository.sumPagosByDateRange(from, to),
        cajaRepository.sumGastosByDateRange(from, to)
    ]);

    const byDate = new Map();

    const ensureDate = (date) => {
        if (!byDate.has(date)) {
            byDate.set(date, { date, ingresos: 0, egresos: 0 });
        }

        return byDate.get(date);
    };

    ingresosPorDia.forEach((row) => {
        ensureDate(row.date).ingresos = round2(Number(row.total));
    });

    egresosPorDia.forEach((row) => {
        ensureDate(row.date).egresos = round2(Number(row.total));
    });

    const dias = Array.from(byDate.values())
        .map((dia) => ({ ...dia, total: round2(dia.ingresos - dia.egresos) }))
        .sort((a, b) => a.date.localeCompare(b.date));

    const totales = dias.reduce(
        (acc, dia) => ({
            ingresos: round2(acc.ingresos + dia.ingresos),
            egresos: round2(acc.egresos + dia.egresos)
        }),
        { ingresos: 0, egresos: 0 }
    );

    return {
        from,
        to,
        dias,
        totales: { ...totales, total: round2(totales.ingresos - totales.egresos) }
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
    getReporte,
    listGastos,
    registerGasto
};
