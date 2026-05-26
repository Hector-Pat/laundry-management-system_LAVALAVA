const { verifyToken } = require('../utils/token.util');

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: 'Authorization header is required'
        });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({
            message: 'Invalid authorization format'
        });
    }

    try {
        const decodedUser = verifyToken(token);
        req.user = decodedUser;

        return next();
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
}

module.exports = authenticateToken;