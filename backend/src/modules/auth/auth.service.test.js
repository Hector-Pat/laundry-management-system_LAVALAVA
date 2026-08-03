jest.mock('./auth.repository');
jest.mock('../../utils/password.util');
jest.mock('../../utils/token.util');

const authRepository = require('./auth.repository');
const { hashPassword, comparePassword } = require('../../utils/password.util');
const { generateToken } = require('../../utils/token.util');
const authService = require('./auth.service');

describe('auth.service', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('registerUser', () => {
        it('ignora el role del payload publico y siempre registra CLIENT', async () => {
            authRepository.findUserByEmail.mockResolvedValue(null);
            hashPassword.mockResolvedValue('hashed');
            authRepository.createUser.mockImplementation(async (data) => ({ id: 1, ...data }));

            const result = await authService.registerUser({
                fullName: 'Ana',
                email: 'ana@test.com',
                password: 'password1',
                role: 'RECEPCIONISTA'
            });

            expect(result.role).toBe('CLIENT');
            expect(authRepository.createUser).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'CLIENT' })
            );
        });

        it('rechaza contraseñas menores a 6 caracteres', async () => {
            await expect(
                authService.registerUser({ fullName: 'Ana', email: 'a@test.com', password: '123' })
            ).rejects.toMatchObject({ statusCode: 400 });
        });

        it('rechaza un correo ya registrado', async () => {
            authRepository.findUserByEmail.mockResolvedValue({ id: 1 });

            await expect(
                authService.registerUser({ fullName: 'Ana', email: 'ana@test.com', password: 'password1' })
            ).rejects.toMatchObject({ statusCode: 409 });
        });
    });

    describe('loginUser', () => {
        it('rechaza credenciales invalidas', async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                email: 'ana@test.com',
                passwordHash: 'hashed',
                isActive: true
            });
            comparePassword.mockResolvedValue(false);

            await expect(
                authService.loginUser({ email: 'ana@test.com', password: 'wrong' })
            ).rejects.toMatchObject({ statusCode: 401 });
        });

        it('rechaza cuentas inactivas', async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                email: 'ana@test.com',
                passwordHash: 'hashed',
                isActive: false
            });

            await expect(
                authService.loginUser({ email: 'ana@test.com', password: 'password1' })
            ).rejects.toMatchObject({ statusCode: 403 });
        });

        it('genera un token con credenciales validas', async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                fullName: 'Ana',
                email: 'ana@test.com',
                passwordHash: 'hashed',
                isActive: true,
                role: 'CLIENT'
            });
            comparePassword.mockResolvedValue(true);
            generateToken.mockReturnValue('a-token');

            const result = await authService.loginUser({ email: 'ana@test.com', password: 'password1' });

            expect(result.token).toBe('a-token');
        });
    });

    describe('changePassword', () => {
        it('rechaza si la contraseña actual es incorrecta', async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                email: 'ana@test.com',
                passwordHash: 'hashed'
            });
            comparePassword.mockResolvedValue(false);

            await expect(
                authService.changePassword(
                    { id: 1, email: 'ana@test.com' },
                    { currentPassword: 'wrong', newPassword: 'newpassword1' }
                )
            ).rejects.toMatchObject({ statusCode: 401 });
        });

        it('actualiza la contraseña cuando la actual es correcta', async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                email: 'ana@test.com',
                passwordHash: 'hashed'
            });
            comparePassword.mockResolvedValue(true);
            hashPassword.mockResolvedValue('new-hashed');

            await authService.changePassword(
                { id: 1, email: 'ana@test.com' },
                { currentPassword: 'correct', newPassword: 'newpassword1' }
            );

            expect(authRepository.updateUser).toHaveBeenCalledWith(1, { passwordHash: 'new-hashed' });
        });
    });
});
