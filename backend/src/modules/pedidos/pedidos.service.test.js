jest.mock('./pedidos.repository');
jest.mock('../clientes/clientes.service');
jest.mock('../clientes/clientes.repository');
jest.mock('../servicios/servicios.repository');
jest.mock('../pagos/pagos.repository');
jest.mock('../auth/auth.repository');
jest.mock('../auditoria/auditoria.service');
jest.mock('../../utils/whatsappNotifier');

const pedidosRepository = require('./pedidos.repository');
const auditoriaService = require('../auditoria/auditoria.service');
const pedidosService = require('./pedidos.service');

const ADMIN = { id: 1, role: 'ADMIN' };
const OPERADOR = { id: 2, role: 'OPERADOR' };
const RECEPCIONISTA = { id: 3, role: 'RECEPCIONISTA' };

function pedidoFixture(overrides = {}) {
    return {
        id: 10,
        folio: 'LAV-20260101-001',
        status: 'RECIBIDO',
        total: '100.00',
        cancelledAt: null,
        ...overrides
    };
}

describe('pedidos.service', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('updateStatus', () => {
        it('rechaza un status invalido', async () => {
            await expect(pedidosService.updateStatus(10, 'NO_EXISTE', OPERADOR)).rejects.toMatchObject({
                statusCode: 400
            });
        });

        it('permite a OPERADOR avanzar RECIBIDO -> LAVADO', async () => {
            pedidosRepository.findPedidoById.mockResolvedValue(pedidoFixture());
            pedidosRepository.updateStatus.mockResolvedValue(pedidoFixture({ status: 'LAVADO' }));

            const result = await pedidosService.updateStatus(10, 'LAVADO', OPERADOR);

            expect(result.status).toBe('LAVADO');
            expect(auditoriaService.logAction).not.toHaveBeenCalled();
        });

        it('rechaza que RECEPCIONISTA avance un pedido que le corresponde a OPERADOR', async () => {
            pedidosRepository.findPedidoById.mockResolvedValue(pedidoFixture());

            await expect(pedidosService.updateStatus(10, 'LAVADO', RECEPCIONISTA)).rejects.toMatchObject({
                statusCode: 403
            });
        });

        it('rechaza saltar estados fuera de orden para un rol que no es ADMIN', async () => {
            pedidosRepository.findPedidoById.mockResolvedValue(pedidoFixture());

            await expect(pedidosService.updateStatus(10, 'LISTO', OPERADOR)).rejects.toMatchObject({
                statusCode: 400
            });
        });

        it('permite a ADMIN forzar un salto de estado y lo registra en la bitacora', async () => {
            pedidosRepository.findPedidoById.mockResolvedValue(pedidoFixture());
            pedidosRepository.updateStatus.mockResolvedValue(pedidoFixture({ status: 'LISTO' }));

            await pedidosService.updateStatus(10, 'LISTO', ADMIN);

            expect(auditoriaService.logAction).toHaveBeenCalledWith(
                ADMIN,
                'FORZAR_ESTADO_PEDIDO',
                'pedido',
                10,
                { from: 'RECIBIDO', to: 'LISTO' }
            );
        });

        it('no registra en la bitacora un avance normal hecho por ADMIN', async () => {
            pedidosRepository.findPedidoById.mockResolvedValue(pedidoFixture());
            pedidosRepository.updateStatus.mockResolvedValue(pedidoFixture({ status: 'LAVADO' }));

            await pedidosService.updateStatus(10, 'LAVADO', ADMIN);

            expect(auditoriaService.logAction).not.toHaveBeenCalled();
        });

        it('rechaza cambiar el estado de un pedido cancelado', async () => {
            pedidosRepository.findPedidoById.mockResolvedValue(
                pedidoFixture({ cancelledAt: '2026-01-01T00:00:00Z' })
            );

            await expect(pedidosService.updateStatus(10, 'LAVADO', OPERADOR)).rejects.toMatchObject({
                statusCode: 400
            });
        });

        it('rechaza cambiar el estado de un pedido ya entregado', async () => {
            pedidosRepository.findPedidoById.mockResolvedValue(pedidoFixture({ status: 'ENTREGADO' }));

            await expect(pedidosService.updateStatus(10, 'LAVADO', ADMIN)).rejects.toMatchObject({
                statusCode: 400
            });
        });
    });

    describe('cancelPedido', () => {
        it('exige un motivo', async () => {
            await expect(pedidosService.cancelPedido(10, '', RECEPCIONISTA)).rejects.toMatchObject({
                statusCode: 400
            });
        });

        it('rechaza cancelar un pedido inexistente', async () => {
            pedidosRepository.findPedidoById.mockResolvedValue(null);

            await expect(pedidosService.cancelPedido(10, 'motivo', RECEPCIONISTA)).rejects.toMatchObject({
                statusCode: 404
            });
        });

        it('rechaza cancelar un pedido ya cancelado', async () => {
            pedidosRepository.findPedidoById.mockResolvedValue(
                pedidoFixture({ cancelledAt: '2026-01-01T00:00:00Z' })
            );

            await expect(pedidosService.cancelPedido(10, 'motivo', RECEPCIONISTA)).rejects.toMatchObject({
                statusCode: 400
            });
        });

        it('rechaza cancelar un pedido ya entregado', async () => {
            pedidosRepository.findPedidoById.mockResolvedValue(pedidoFixture({ status: 'ENTREGADO' }));

            await expect(pedidosService.cancelPedido(10, 'motivo', RECEPCIONISTA)).rejects.toMatchObject({
                statusCode: 400
            });
        });

        it('cancela un pedido valido y lo registra en la bitacora', async () => {
            pedidosRepository.findPedidoById.mockResolvedValue(pedidoFixture());
            pedidosRepository.cancelPedido.mockResolvedValue(
                pedidoFixture({ cancelledAt: '2026-01-01T00:00:00Z' })
            );

            const result = await pedidosService.cancelPedido(10, 'ya no lo quiere', RECEPCIONISTA);

            expect(pedidosRepository.cancelPedido).toHaveBeenCalledWith(10, 'ya no lo quiere', RECEPCIONISTA.id);
            expect(auditoriaService.logAction).toHaveBeenCalledWith(
                RECEPCIONISTA,
                'CANCELAR_PEDIDO',
                'pedido',
                10,
                { reason: 'ya no lo quiere' }
            );
            expect(result.cancelledAt).toBeTruthy();
        });
    });
});
