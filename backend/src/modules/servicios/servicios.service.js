const serviciosRepository = require('./servicios.repository');

async function listActiveServicios() {
    return serviciosRepository.listActive();
}

module.exports = {
    listActiveServicios
};
