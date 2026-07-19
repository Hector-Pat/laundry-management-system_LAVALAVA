const usersService = require('./users.service');

async function list(req, res, next) {
    try {
        const users = await usersService.listUsers();

        return res.status(200).json({
            message: 'Users retrieved successfully',
            data: users
        });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const user = await usersService.updateUser(req.params.id, req.body, req.user);

        return res.status(200).json({
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const user = await usersService.deactivateUser(req.params.id, req.user);

        return res.status(200).json({
            message: 'User deactivated successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    list,
    update,
    remove
};
