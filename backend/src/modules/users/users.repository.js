// La tabla de usuarios y sus queries viven en el modulo auth (auth.repository.js);
// este repositorio reutiliza esas funciones para mantener una unica fuente de verdad.
const authRepository = require('../auth/auth.repository');

module.exports = {
    listUsers: authRepository.listUsers,
    findUserById: authRepository.findUserById,
    updateUser: authRepository.updateUser,
    deleteUser: authRepository.deleteUser
};
