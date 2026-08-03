const { verifyToken } = require('../utils/token.util');

function authenticateToken(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({
            message: 'Authentication cookie is required'
        });
    }

    try {
        const decodedUser = verifyToken(token);
        req.user = decodedUser;

        return next();
    } catch (_error) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
}

module.exports = authenticateToken;
