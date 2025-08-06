const { PrismaClient } = require('@prisma/client');
const { ErrorCodes } = require("../exception/root");
const UnauthorizedException = require("../exception/unauthorized");
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
    try {
        let token = req.cookies.token;
    
        if (!token) {
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new UnauthorizedException('Unauthorized', ErrorCodes.UNAUTHORIZED));
          }
          token = authHeader.split(' ')[1];
        }
    
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.users.findUnique({ where: { id: decoded.id } });
        if (!user) {
          return next(new UnauthorizedException('Unauthorized', ErrorCodes.UNAUTHORIZED));
        }
    
        delete user.password;
        req.user = user;
        next();
    
      } catch (error) {
        next(new UnauthorizedException('Unauthorized', ErrorCodes.UNAUTHORIZED));
      }
    };
    

module.exports = authMiddleware;