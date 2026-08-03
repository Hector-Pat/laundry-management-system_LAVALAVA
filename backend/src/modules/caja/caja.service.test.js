jest.mock('./caja.repository');

const cajaRepository = require('./caja.repository');
const cajaService = require('./caja.service');

describe('caja.service', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('getCorte', () => {
        it('calcula el total como ingresos menos egresos', async () => {
            cajaRepository.sumPagosByDate.mockResolvedValue(150.5);
            cajaRepository.sumGastosByDate.mockResolvedValue(50.25);
            cajaRepository.listPagosByDate.mockResolvedValue([]);
            cajaRepository.listGastosByDate.mockResolvedValue([]);

            const result = await cajaService.getCorte({});

            expect(result.ingresos).toBe(150.5);
            expect(result.egresos).toBe(50.25);
            expect(result.total).toBe(100.25);
        });

        it('rechaza una fecha con formato invalido', async () => {
            await expect(cajaService.getCorte({ date: '01-01-2026' })).rejects.toMatchObject({
                statusCode: 400
            });
        });
    });

    describe('getReporte', () => {
        it('exige from y to', async () => {
            await expect(cajaService.getReporte({})).rejects.toMatchObject({ statusCode: 400 });
        });

        it('rechaza un rango invertido', async () => {
            await expect(
                cajaService.getReporte({ from: '2026-02-01', to: '2026-01-01' })
            ).rejects.toMatchObject({ statusCode: 400 });
        });

        it('agrupa ingresos y egresos por dia', async () => {
            cajaRepository.sumPagosByDateRange.mockResolvedValue([
                { date: '2026-01-01', total: '100.00' },
                { date: '2026-01-02', total: '50.00' }
            ]);
            cajaRepository.sumGastosByDateRange.mockResolvedValue([{ date: '2026-01-01', total: '20.00' }]);

            const result = await cajaService.getReporte({ from: '2026-01-01', to: '2026-01-02' });

            expect(result.dias).toEqual([
                { date: '2026-01-01', ingresos: 100, egresos: 20, total: 80 },
                { date: '2026-01-02', ingresos: 50, egresos: 0, total: 50 }
            ]);
            expect(result.totales).toEqual({ ingresos: 150, egresos: 20, total: 130 });
        });
    });

    describe('registerGasto', () => {
        it('rechaza un monto no positivo', async () => {
            await expect(
                cajaService.registerGasto({ concept: 'Jabon', amount: -5 }, { id: 1 })
            ).rejects.toMatchObject({ statusCode: 400 });
        });

        it('registra un gasto valido', async () => {
            cajaRepository.createGasto.mockResolvedValue({ id: 1, concept: 'Jabon', amount: 50 });

            const result = await cajaService.registerGasto({ concept: 'Jabon', amount: 50 }, { id: 7 });

            expect(cajaRepository.createGasto).toHaveBeenCalledWith({
                concept: 'Jabon',
                amount: 50,
                registeredBy: 7
            });
            expect(result.id).toBe(1);
        });
    });
});
