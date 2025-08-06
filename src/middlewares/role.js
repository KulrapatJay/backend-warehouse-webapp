const UnauthorizedException = require("../exception/unauthorized");
const { ErrorCodes } = require("../exception/root");

const adminMiddleware = async (req, res, next) => {
    const user = req.user; 

    if (!user) {
        return next(new UnauthorizedException('Authentication failed', ErrorCodes.UNAUTHORIZED));
    }

    if (user.role_id == 1) {
        next();
    } else {
        return next(new UnauthorizedException('Unauthorized', ErrorCodes.UNAUTHORIZED));
    }
};

const menagerMiddleware = async (req, res, next) => {
    const user = req.user; 

    if (!user) {
        return next(new UnauthorizedException('Authentication failed', ErrorCodes.UNAUTHORIZED));
    }

    if (user.role_id == 2) {
        next();
    } else {
        return next(new UnauthorizedException('Unauthorized', ErrorCodes.UNAUTHORIZED));
    }
};

const staffMiddleware = async (req, res, next) => {
    const user = req.user; 

    if (!user) {
        return next(new UnauthorizedException('Authentication failed', ErrorCodes.UNAUTHORIZED));
    }

    if (user.role_id == 3) {
        next();
    } else {
        return next(new UnauthorizedException('Unauthorized', ErrorCodes.UNAUTHORIZED));
    }
};

    
module.exports = {
    staffMiddleware,
    menagerMiddleware,
    adminMiddleware};