jest.mock('../../config/db', () => ({ getConnection: jest.fn() }));
jest.mock('./pagos.repository');
jest.mock('../pedidos/pedidos.repository');
jest.mock('../auditoria/auditoria.service');

const pool = require('../../config/db');
const pagosRepository = require('./pagos.repository');
const pedidosRepository = require('../pedidos/pedidos.repository');
const auditoriaService = require('../auditoria/auditoria.service');
const pagosService = require('./pagos.service');

const CURRENT_USER = { id: 1, role: 'RECEPCIONISTA' };

function mockConnection() {
    return {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
    };
}

describe('pagos.service', () => {
    let connection;

    beforeEach(() => {
        jest.resetAllMocks();
        connection = mockConnection();
        pool.getConnection.mockResolvedValue(connection);
        pagosRepository.listByPedidoId.mockResolvedValue([]);
    });

    describe('registerPayment', () => {
        it('rechaza un monto que excede el saldo pendiente y hace rollback', async () => {
            pedidosRepository.lockPedidoById.mockResolvedValue({
                id: 5,
                total: '100.00',
                status: 'RECIBIDO',
                cancelledAt: null
            });
            pagosRepository.sumByPedidoId.mockResolvedValue(0);

            await expect(pagosService.registerPayment(5, { amount: 150 }, CURRENT_USER)).rejects.toMatchObject({
                statusCode: 400
            });

            expect(connection.rollback).toHaveBeenCalled();
            expect(connection.commit).not.toHaveBeenCalled();
            expect(pagosRepository.create).not.toHaveBeenCalled();
        });

        it('registra un pago valido dentro de la transaccion y calcula el saldo restante', async () => {
            pedidosRepository.lockPedidoById.mockResolvedValue({
                id: 5,
                total: '100.00',
                status: 'RECIBIDO',
                cancelledAt: null
            });
            pedidosRepository.findPedidoById.mockResolvedValue({ id: 5, total: '100.00' });
            pagosRepository.sumByPedidoId.mockResolvedValueOnce(0).mockResolvedValueOnce(40);
            pagosRepository.create.mockResolvedValue({ id: 1 });

            const summary = await pagosService.registerPayment(
                5,
                { amount: 40, method: 'EFECTIVO' },
                CURRENT_USER
            );

            expect(pagosRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ pedidoId: 5, amount: 40, type: 'ADELANTO' }),
                connection
            );
            expect(connection.commit).toHaveBeenCalled();
            expect(summary.saldoPendiente).toBe(60);
        });

        it('rechaza registrar un pago sobre un pedido cancelado', async () => {
            pedidosRepository.lockPedidoById.mockResolvedValue({
                id: 5,
                total: '100.00',
                status: 'RECIBIDO',
                cancelledAt: '2026-01-01T00:00:00Z'
            });

            await expect(pagosService.registerPayment(5, { amount: 10 }, CURRENT_USER)).rejects.toMatchObject({
                statusCode: 400
            });
        });
    });

    describe('voidPayment', () => {
        it('rechaza anular un pago que ya esta anulado', async () => {
            pedidosRepository.lockPedidoById.mockResolvedValue({ id: 5, total: '100.00' });
            pagosRepository.findById.mockResolvedValue({ id: 9, pedidoId: 5, isVoided: true });

            await expect(pagosService.voidPayment(5, 9, 'motivo', CURRENT_USER)).rejects.toMatchObject({
                statusCode: 400
            });

            expect(pagosRepository.voidPayment).not.toHaveBeenCalled();
            expect(connection.rollback).toHaveBeenCalled();
        });

        it('anula un pago valido y lo registra en la bitacora', async () => {
            pedidosRepository.lockPedidoById.mockResolvedValue({ id: 5, total: '100.00' });
            pedidosRepository.findPedidoById.mockResolvedValue({ id: 5, total: '100.00' });
            pagosRepository.findById.mockResolvedValue({ id: 9, pedidoId: 5, isVoided: false });
            pagosRepository.sumByPedidoId.mockResolvedValue(0);

            await pagosService.voidPayment(5, 9, 'motivo', CURRENT_USER);

            expect(pagosRepository.voidPayment).toHaveBeenCalledWith(9, 'motivo', CURRENT_USER.id, connection);
            expect(connection.commit).toHaveBeenCalled();
            expect(auditoriaService.logAction).toHaveBeenCalledWith(
                CURRENT_USER,
                'ANULAR_PAGO',
                'pago',
                9,
                expect.objectContaining({ pedidoId: 5 })
            );
        });
    });
});
