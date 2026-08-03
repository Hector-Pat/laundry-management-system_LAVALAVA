const authService = require('./auth.service');

// httpOnly: el JS del frontend no puede leer la cookie (mitiga robo de
// token via XSS, a diferencia de guardarlo en localStorage). Sin maxAge:
// es una cookie de sesion, y de todas formas el JWT deja de ser valido
// cuando expira (JWT_EXPIRES_IN) sin importar si la cookie sigue viva.
function cookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    };
}

async function register(req, res, next) {
    try {
        const user = await authService.registerUser(req.body);

        return res.status(201).json({
            message: 'User registered successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { token, user } = await authService.loginUser(req.body);

        res.cookie('token', token, cookieOptions());

        return res.status(200).json({
            message: 'Login successful',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
}

async function logout(_req, res) {
    res.clearCookie('token', cookieOptions());

    return res.status(200).json({
        message: 'Logout successful'
    });
}

async function changePassword(req, res, next) {
    try {
        await authService.changePassword(req.user, req.body);

        return res.status(200).json({
            message: 'Password updated successfully'
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    logout,
    changePassword
};
