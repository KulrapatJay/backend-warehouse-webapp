const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const authMiddleware = require('../middlewares/auth');
const { GetUsers, UpdateUser, GetUserById, DeleteUser } = require('../modules/controllers/admin/user-management');
const {adminMiddleware} = require('../middlewares/role');


const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, 
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
});

const userManagementRouter = express.Router();

userManagementRouter.get('/', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(GetUsers));
userManagementRouter.put('/:id', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(UpdateUser));
userManagementRouter.get('/:id', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(GetUserById));
userManagementRouter.delete('/:id', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(DeleteUser));

module.exports = userManagementRouter;